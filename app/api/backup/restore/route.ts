import { NextRequest, NextResponse } from 'next/server'
import { ensureSpielleiter, getAdminClient, loadSqlJs, assertValidBackupFileName, getBackupFileBuffer } from '../utils'

export const revalidate = 0

type RestorePayload = {
  groupId: string
  playerName: string
  fileName: string
  players: string[]
  suffix?: string
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as RestorePayload
    const groupId = body?.groupId || ''
    const playerName = body?.playerName || ''
    const fileName = body?.fileName || ''
    const players = Array.isArray(body?.players) ? body.players : []
    const suffix = (body?.suffix || '_V2').trim() || '_V2'

    if (!groupId || !playerName || !fileName || players.length === 0) {
      return NextResponse.json({ error: 'groupId, playerName, fileName oder players fehlen.' }, { status: 400 })
    }

    assertValidBackupFileName(fileName)
    await ensureSpielleiter(groupId, playerName)

    const SQL = await loadSqlJs()
    const buffer = await getBackupFileBuffer(groupId, fileName)
    const db = new SQL.Database(buffer)
    const result = db.exec('SELECT player_name, json FROM characters')
    const rows = result[0]?.values || []

    const selectedPlayers = new Set(players.map((name) => String(name).trim()).filter(Boolean))
    if (selectedPlayers.size === 0) {
      return NextResponse.json({ error: 'Keine gültigen Spielernamen übergeben.' }, { status: 400 })
    }

    const nowIso = new Date().toISOString()
    const inserts: any[] = []
    const memberNames = new Set<string>()

    rows.forEach((row: any[]) => {
      const sourcePlayer = String(row[0] || '').trim()
      if (!selectedPlayers.has(sourcePlayer)) return
      const rawJson = String(row[1] || '')
      if (!rawJson) return
      let payload: any = null
      try {
        payload = JSON.parse(rawJson)
      } catch {
        return
      }
      if (payload?.deleted_date) return
      const newPlayerName = `${sourcePlayer}${suffix}`
      memberNames.add(newPlayerName)
      inserts.push({
        ...payload,
        id: crypto.randomUUID(),
        group_id: groupId,
        player_name: newPlayerName,
        updated_at: nowIso,
        deleted_date: null,
      })
    })

    if (inserts.length === 0) {
      return NextResponse.json({ error: 'Keine passenden Charaktere im Backup gefunden.' }, { status: 400 })
    }

    const supabase = getAdminClient()

    const memberRows = Array.from(memberNames).map((name) => ({
      group_id: groupId,
      player_name: name,
      role: 'spieler',
    }))
    const { error: memberError } = await supabase
      .from('group_members')
      .upsert(memberRows, { onConflict: 'group_id,player_name' })
    if (memberError) {
      return NextResponse.json({ error: 'Konnte Spieler nicht in die Gruppe eintragen.' }, { status: 500 })
    }

    const { error: insertError } = await supabase
      .from('characters')
      .insert(inserts)
    if (insertError) {
      return NextResponse.json({ error: 'Charakter-Import fehlgeschlagen.' }, { status: 500 })
    }

    return NextResponse.json(
      { success: true, imported: inserts.length, players: Array.from(memberNames) },
      { headers: { 'Cache-Control': 'no-store' } }
    )
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Backup-Import fehlgeschlagen.', details: error?.message || 'Unbekannter Fehler' },
      { status: 500, headers: { 'Cache-Control': 'no-store' } }
    )
  }
}
