import { NextRequest, NextResponse } from 'next/server'
import { BACKUP_BUCKET, ensureSpielleiter, getAdminClient } from '../utils'

export const revalidate = 0

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const groupId = searchParams.get('groupId') || ''
    const playerName = searchParams.get('playerName') || ''
    if (!groupId || !playerName) {
      return NextResponse.json({ error: 'groupId und playerName fehlen.' }, { status: 400 })
    }

    await ensureSpielleiter(groupId, playerName)
    const supabase = getAdminClient()
    const { data, error } = await supabase.storage
      .from(BACKUP_BUCKET)
      .list(groupId, { limit: 200, sortBy: { column: 'created_at', order: 'desc' } })

    if (error) {
      return NextResponse.json({ error: 'Backups konnten nicht geladen werden.' }, { status: 500 })
    }

    const files = (data || [])
      .filter((item) => item.name.endsWith('.sqlite'))
      .map((item) => ({
        name: item.name,
        size: item.metadata?.size || 0,
        createdAt: item.created_at || null,
        updatedAt: item.updated_at || null,
      }))

    return NextResponse.json({ files }, { headers: { 'Cache-Control': 'no-store' } })
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Backup-Liste fehlgeschlagen.', details: error?.message || 'Unbekannter Fehler' },
      { status: 500, headers: { 'Cache-Control': 'no-store' } }
    )
  }
}
