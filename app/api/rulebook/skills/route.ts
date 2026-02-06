import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseAdmin } from '@/lib/supabase'
import { validateMasterFromRequest } from '../utils'

export const revalidate = 0

export async function GET() {
  try {
    const supabase = createSupabaseAdmin()
    if (!supabase) {
      return NextResponse.json(
        { error: 'Supabase Admin ist nicht verfügbar.' },
        { status: 500, headers: { 'Cache-Control': 'no-store' } }
      )
    }
    const { data, error } = await supabase
      .from('rulebook_skills')
      .select('*')
      .order('attribute', { ascending: true })
      .order('name', { ascending: true })
    if (error) {
      console.error('Failed to load rulebook skills:', error)
      return NextResponse.json(
        { error: 'Rule-Book konnte nicht geladen werden.' },
        { status: 500, headers: { 'Cache-Control': 'no-store' } }
      )
    }
    return NextResponse.json({ skills: data || [] }, { headers: { 'Cache-Control': 'no-store' } })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unbekannter Fehler'
    return NextResponse.json(
      { error: 'Rule-Book konnte nicht geladen werden.', details: message },
      { status: 500, headers: { 'Cache-Control': 'no-store' } }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { skills } = body || {}
    const auth = validateMasterFromRequest(request)
    if (!auth.ok) {
      return NextResponse.json(
        { error: auth.error },
        { status: 401, headers: { 'Cache-Control': 'no-store' } }
      )
    }
    if (!Array.isArray(skills) || skills.length === 0) {
      return NextResponse.json(
        { error: 'skills Array ist erforderlich.' },
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
    const rows = skills.map((skill: any) => ({
      name: String(skill.name || '').trim(),
      attribute: String(skill.attribute || '').trim(),
      description: String(skill.description || '').trim(),
      source_group_id: skill.source_group_id || null,
      source_player_name: skill.source_player_name || null,
      updated_at: new Date().toISOString(),
    })).filter((row: any) => row.name && row.attribute && row.description)
    if (rows.length === 0) {
      return NextResponse.json(
        { error: 'Keine gültigen Skills zum Import gefunden.' },
        { status: 400, headers: { 'Cache-Control': 'no-store' } }
      )
    }
    const { error } = await supabase
      .from('rulebook_skills')
      .upsert(rows, { onConflict: 'name,attribute' })
    if (error) {
      console.error('Failed to upsert rulebook skills:', error)
      return NextResponse.json(
        { error: 'Rule-Book konnte nicht gespeichert werden.' },
        { status: 500, headers: { 'Cache-Control': 'no-store' } }
      )
    }
    return NextResponse.json({ success: true, count: rows.length }, { headers: { 'Cache-Control': 'no-store' } })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unbekannter Fehler'
    return NextResponse.json(
      { error: 'Rule-Book konnte nicht gespeichert werden.', details: message },
      { status: 500, headers: { 'Cache-Control': 'no-store' } }
    )
  }
}
