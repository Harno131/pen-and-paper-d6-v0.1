import { NextRequest, NextResponse } from 'next/server'
import { ensureSpielleiter, loadSqlJs, assertValidBackupFileName, getBackupFileBuffer } from '../utils'

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

    const SQL = await loadSqlJs()
    const buffer = await getBackupFileBuffer(groupId, fileName)
    const db = new SQL.Database(buffer)
    const result = db.exec('SELECT player_name, name, json FROM characters')
    const rows = result[0]?.values || []

    const players = new Map<string, { playerName: string; characters: { id: string; name: string }[] }>()
    rows.forEach((row: any[]) => {
      const player = String(row[0] || '').trim()
      const characterName = String(row[1] || '').trim()
      const json = String(row[2] || '')
      if (!player || !json) return
      let payload: any = null
      try {
        payload = JSON.parse(json)
      } catch {
        return
      }
      if (payload?.deleted_date) return
      if (!players.has(player)) {
        players.set(player, { playerName: player, characters: [] })
      }
      players.get(player)!.characters.push({ id: String(payload.id || ''), name: characterName || 'Unbenannt' })
    })

    const payload = Array.from(players.values())
      .map((player) => ({
        playerName: player.playerName,
        characterCount: player.characters.length,
        characters: player.characters,
      }))
      .sort((a, b) => a.playerName.localeCompare(b.playerName, 'de'))

    return NextResponse.json({ players: payload }, { headers: { 'Cache-Control': 'no-store' } })
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Backup-Analyse fehlgeschlagen.', details: error?.message || 'Unbekannter Fehler' },
      { status: 500, headers: { 'Cache-Control': 'no-store' } }
    )
  }
}
