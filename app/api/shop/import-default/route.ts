import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseAdmin } from '@/lib/supabase'
import { SHOP_ITEMS } from '@/data/items'

export const revalidate = 0

const MASTER_NAME = 'Flori'

const validateMaster = (playerName?: string | null, password?: string | null) => {
  const expected = process.env.RBM_PASSWORD || ''
  if (!expected) {
    return { ok: false, error: 'RBM_PASSWORD fehlt in der Umgebung.' }
  }
  if (!playerName || playerName.trim() !== MASTER_NAME) {
    return { ok: false, error: 'Nicht als Rule-Book-Master angemeldet.' }
  }
  if (!password || password !== expected) {
    return { ok: false, error: 'Rule-Book-Master-Passwort ist falsch.' }
  }
  return { ok: true }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { playerName, password } = body || {}
    const auth = validateMaster(playerName, password)
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
    const rows = SHOP_ITEMS.map((item) => ({
      name: item.name,
      category: item.category,
      price_copper: item.priceCopper || 0,
      slot: Array.isArray(item.slot) ? item.slot.join(',') : item.slot || null,
      two_handed: item.twoHanded || false,
      description: item.description || null,
      stats: item.stats || {},
      created_by: 'Rule-Book-Master',
      is_custom: false,
      updated_at: new Date().toISOString(),
    }))
    const { error } = await supabase
      .from('inventory_items')
      .upsert(rows, { onConflict: 'name,category' })
    if (error) {
      console.error('Failed to import shop defaults:', error)
      return NextResponse.json(
        { error: 'Import fehlgeschlagen.' },
        { status: 500, headers: { 'Cache-Control': 'no-store' } }
      )
    }
    return NextResponse.json(
      { success: true, count: rows.length },
      { headers: { 'Cache-Control': 'no-store' } }
    )
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unbekannter Fehler'
    return NextResponse.json(
      { error: 'Import fehlgeschlagen.', details: message },
      { status: 500, headers: { 'Cache-Control': 'no-store' } }
    )
  }
}
