import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseAdmin } from '@/lib/supabase'
import { validateMasterFromRequest } from '../utils'

export const revalidate = 0

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      skillName,
      attribute,
      description,
      sourceGroupId,
      sourcePlayerName,
      entryType,
      specName,
    } = body || {}
    if (!skillName || !attribute || !description) {
      return NextResponse.json(
        { error: 'skillName, attribute und description sind erforderlich.' },
        { status: 400, headers: { 'Cache-Control': 'no-store' } }
      )
    }
    const supabase = createSupabaseAdmin()
    if (!supabase) {
      return NextResponse.json(
        { error: 'Supabase Admin ist nicht verfügbar.' },
        { status: 500, headers: { 'Cache-Control': 'no-store' } }
      )
    }
    const { error } = await supabase
      .from('rulebook_reviews')
      .insert({
        skill_name: String(skillName),
        attribute: String(attribute),
        description: String(description),
        source_group_id: sourceGroupId || null,
        source_player_name: sourcePlayerName || null,
        action: 'pending',
        entry_type: entryType || 'skill',
        spec_name: specName || null,
      })
    if (error) {
      console.error('Failed to insert rulebook review:', error)
      return NextResponse.json(
        { error: 'Review konnte nicht gespeichert werden.' },
        { status: 500, headers: { 'Cache-Control': 'no-store' } }
      )
    }
    return NextResponse.json({ success: true }, { headers: { 'Cache-Control': 'no-store' } })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unbekannter Fehler'
    return NextResponse.json(
      { error: 'Review konnte nicht gespeichert werden.', details: message },
      { status: 500, headers: { 'Cache-Control': 'no-store' } }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')
    const auth = validateMasterFromRequest(request)
    if (!auth.ok) {
      return NextResponse.json(
        { error: auth.error },
        { status: 401, headers: { 'Cache-Control': 'no-store' } }
      )
    }
    const supabase = createSupabaseAdmin()
    if (!supabase) {
      return NextResponse.json(
        { error: 'Supabase Admin ist nicht verfügbar.' },
        { status: 500, headers: { 'Cache-Control': 'no-store' } }
      )
    }
    let query = supabase
      .from('rulebook_reviews')
      .select('*')
      .order('created_at', { ascending: true })
    if (action) {
      query = query.eq('action', action)
    } else {
      query = query.in('action', ['pending', 'waiting'])
    }
    const { data, error } = await query
    if (error) {
      console.error('Failed to load rulebook reviews:', error)
      return NextResponse.json(
        { error: 'Reviews konnten nicht geladen werden.' },
        { status: 500, headers: { 'Cache-Control': 'no-store' } }
      )
    }
    return NextResponse.json({ reviews: data || [] }, { headers: { 'Cache-Control': 'no-store' } })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unbekannter Fehler'
    return NextResponse.json(
      { error: 'Reviews konnten nicht geladen werden.', details: message },
      { status: 500, headers: { 'Cache-Control': 'no-store' } }
    )
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      id,
      action,
      editedName,
      editedAttribute,
      editedDescription,
      editedSpecName,
    } = body || {}
    if (!id || !action) {
      return NextResponse.json(
        { error: 'id und action sind erforderlich.' },
        { status: 400, headers: { 'Cache-Control': 'no-store' } }
      )
    }
    const auth = validateMasterFromRequest(request)
    if (!auth.ok) {
      return NextResponse.json(
        { error: auth.error },
        { status: 401, headers: { 'Cache-Control': 'no-store' } }
      )
    }
    const supabase = createSupabaseAdmin()
    if (!supabase) {
      return NextResponse.json(
        { error: 'Supabase Admin ist nicht verfügbar.' },
        { status: 500, headers: { 'Cache-Control': 'no-store' } }
      )
    }

    const { data: review, error: reviewError } = await supabase
      .from('rulebook_reviews')
      .select('*')
      .eq('id', id)
      .single()
    if (reviewError || !review) {
      return NextResponse.json(
        { error: 'Review nicht gefunden.' },
        { status: 404, headers: { 'Cache-Control': 'no-store' } }
      )
    }

    if (action === 'approved') {
      const name = String(editedName || review.skill_name)
      const attribute = String(editedAttribute || review.attribute)
      const description = String(editedDescription || review.description)
      if (review.entry_type === 'specialization') {
        const specName = String(editedSpecName || review.spec_name || '').trim()
        if (!specName) {
          return NextResponse.json(
            { error: 'specName fehlt für Spezialisierung.' },
            { status: 400, headers: { 'Cache-Control': 'no-store' } }
          )
        }
        const { error: upsertError } = await supabase
          .from('rulebook_specializations')
          .upsert({
            skill_name: name,
            specialization_name: specName,
            description: description || null,
            source_group_id: review.source_group_id || null,
            source_player_name: review.source_player_name || null,
            updated_at: new Date().toISOString(),
          }, { onConflict: 'skill_name,specialization_name' })
        if (upsertError) {
          console.error('Failed to upsert rulebook specialization:', upsertError)
          return NextResponse.json(
            { error: 'Rule-Book-Spezialisierung konnte nicht übernommen werden.' },
            { status: 500, headers: { 'Cache-Control': 'no-store' } }
          )
        }
      } else {
        const { error: upsertError } = await supabase
          .from('rulebook_skills')
          .upsert({
            name,
            attribute,
            description,
            source_group_id: review.source_group_id || null,
            source_player_name: review.source_player_name || null,
            updated_at: new Date().toISOString(),
          }, { onConflict: 'name,attribute' })
        if (upsertError) {
          console.error('Failed to upsert rulebook skill:', upsertError)
          return NextResponse.json(
            { error: 'Rule-Book-Eintrag konnte nicht übernommen werden.' },
            { status: 500, headers: { 'Cache-Control': 'no-store' } }
          )
        }
      }
      const { error: updateError } = await supabase
        .from('rulebook_reviews')
        .update({ action: 'approved', updated_at: new Date().toISOString() })
        .eq('id', id)
      if (updateError) {
        console.warn('Failed to mark review approved:', updateError)
      }
      return NextResponse.json({ success: true }, { headers: { 'Cache-Control': 'no-store' } })
    }

    if (action === 'declined') {
      const { error: deleteError } = await supabase
        .from('rulebook_reviews')
        .delete()
        .eq('id', id)
      if (deleteError) {
        console.error('Failed to delete review:', deleteError)
        return NextResponse.json(
          { error: 'Review konnte nicht gelöscht werden.' },
          { status: 500, headers: { 'Cache-Control': 'no-store' } }
        )
      }
      return NextResponse.json({ success: true }, { headers: { 'Cache-Control': 'no-store' } })
    }

    if (action === 'waiting') {
      const { error: updateError } = await supabase
        .from('rulebook_reviews')
        .update({ action: 'waiting', updated_at: new Date().toISOString() })
        .eq('id', id)
      if (updateError) {
        console.error('Failed to update review:', updateError)
        return NextResponse.json(
          { error: 'Review konnte nicht aktualisiert werden.' },
          { status: 500, headers: { 'Cache-Control': 'no-store' } }
        )
      }
      return NextResponse.json({ success: true }, { headers: { 'Cache-Control': 'no-store' } })
    }

    return NextResponse.json(
      { error: 'Unbekannte action.' },
      { status: 400, headers: { 'Cache-Control': 'no-store' } }
    )
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unbekannter Fehler'
    return NextResponse.json(
      { error: 'Review konnte nicht aktualisiert werden.', details: message },
      { status: 500, headers: { 'Cache-Control': 'no-store' } }
    )
  }
}
