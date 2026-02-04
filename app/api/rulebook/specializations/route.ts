import { NextResponse } from 'next/server'
import { createSupabaseAdmin } from '@/lib/supabase'

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
      .from('rulebook_specializations')
      .select('*')
      .order('skill_name', { ascending: true })
      .order('specialization_name', { ascending: true })
    if (error) {
      console.error('Failed to load rulebook specializations:', error)
      return NextResponse.json(
        { error: 'Rule-Book-Spezialisierungen konnten nicht geladen werden.' },
        { status: 500, headers: { 'Cache-Control': 'no-store' } }
      )
    }
    return NextResponse.json({ specializations: data || [] }, { headers: { 'Cache-Control': 'no-store' } })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unbekannter Fehler'
    return NextResponse.json(
      { error: 'Rule-Book-Spezialisierungen konnten nicht geladen werden.', details: message },
      { status: 500, headers: { 'Cache-Control': 'no-store' } }
    )
  }
}
