import { NextRequest, NextResponse } from 'next/server'
import { BACKUP_BUCKET, ensureSpielleiter, getAdminClient, assertValidBackupFileName, getStoragePath } from '../utils'

export const revalidate = 0

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const groupId = searchParams.get('groupId') || ''
    const playerName = searchParams.get('playerName') || ''
    const fileName = searchParams.get('file') || ''
    if (!groupId || !playerName || !fileName) {
      return NextResponse.json({ error: 'groupId, playerName oder file fehlen.' }, { status: 400 })
    }

    assertValidBackupFileName(fileName)
    await ensureSpielleiter(groupId, playerName)
    const supabase = getAdminClient()
    const path = getStoragePath(groupId, fileName)
    const { data, error } = await supabase.storage
      .from(BACKUP_BUCKET)
      .createSignedUrl(path, 120)

    if (error || !data?.signedUrl) {
      return NextResponse.json({ error: 'Download-Link konnte nicht erstellt werden.' }, { status: 500 })
    }

    return NextResponse.json({ url: data.signedUrl }, { headers: { 'Cache-Control': 'no-store' } })
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Backup-Download fehlgeschlagen.', details: error?.message || 'Unbekannter Fehler' },
      { status: 500, headers: { 'Cache-Control': 'no-store' } }
    )
  }
}
