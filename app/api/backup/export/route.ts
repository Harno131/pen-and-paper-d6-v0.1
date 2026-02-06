import { NextRequest, NextResponse } from 'next/server'
import { BACKUP_BUCKET, ensureSpielleiter, getAdminClient, getStoragePath, loadSqlJs } from '../utils'

export const revalidate = 0

const buildFileName = () => {
  const now = new Date()
  const pad = (value: number) => String(value).padStart(2, '0')
  return `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}_${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}.sqlite`
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { groupId, playerName } = body || {}
    if (!groupId || !playerName) {
      return NextResponse.json({ error: 'groupId und playerName fehlen.' }, { status: 400 })
    }

    await ensureSpielleiter(groupId, playerName)
    const supabase = getAdminClient()

    const [characters, journalEntries, skills, bestiary, groups, inventory] = await Promise.all([
      supabase.from('characters').select('*').eq('group_id', groupId),
      supabase.from('journal_entries').select('*').eq('group_id', groupId),
      supabase.from('available_skills').select('*').eq('group_id', groupId),
      supabase.from('bestiary').select('*').eq('group_id', groupId),
      supabase.from('groups').select('id, settings').eq('id', groupId),
      supabase.from('inventory_items').select('*').eq('group_id', groupId),
    ])

    if (characters.error || journalEntries.error || skills.error || bestiary.error || groups.error || inventory.error) {
      return NextResponse.json(
        { error: 'Fehler beim Laden der Backup-Daten.' },
        { status: 500 }
      )
    }

    const SQL = await loadSqlJs()
    const db = new SQL.Database()

    db.exec(`
      CREATE TABLE meta (key TEXT, value TEXT);
      CREATE TABLE characters (id TEXT, player_name TEXT, name TEXT, json TEXT);
      CREATE TABLE journal_entries (id TEXT, json TEXT);
      CREATE TABLE available_skills (id TEXT, name TEXT, attribute TEXT, json TEXT);
      CREATE TABLE bestiary (id TEXT, name TEXT, json TEXT);
      CREATE TABLE group_settings (id TEXT, json TEXT);
      CREATE TABLE inventory_items (id TEXT, name TEXT, category TEXT, json TEXT);
    `)

    const insertMeta = db.prepare('INSERT INTO meta (key, value) VALUES (?, ?)')
    insertMeta.run(['group_id', groupId])
    insertMeta.run(['created_at', new Date().toISOString()])
    insertMeta.free()

    const insertChar = db.prepare('INSERT INTO characters (id, player_name, name, json) VALUES (?, ?, ?, ?)')
    ;(characters.data || []).forEach((row: any) => {
      insertChar.run([row.id, row.player_name, row.name, JSON.stringify(row)])
    })
    insertChar.free()

    const insertJournal = db.prepare('INSERT INTO journal_entries (id, json) VALUES (?, ?)')
    ;(journalEntries.data || []).forEach((row: any) => {
      insertJournal.run([row.id, JSON.stringify(row)])
    })
    insertJournal.free()

    const insertSkill = db.prepare('INSERT INTO available_skills (id, name, attribute, json) VALUES (?, ?, ?, ?)')
    ;(skills.data || []).forEach((row: any) => {
      insertSkill.run([row.id, row.name, row.attribute, JSON.stringify(row)])
    })
    insertSkill.free()

    const insertBestiary = db.prepare('INSERT INTO bestiary (id, name, json) VALUES (?, ?, ?)')
    ;(bestiary.data || []).forEach((row: any) => {
      insertBestiary.run([row.id, row.name, JSON.stringify(row)])
    })
    insertBestiary.free()

    const insertSettings = db.prepare('INSERT INTO group_settings (id, json) VALUES (?, ?)')
    ;(groups.data || []).forEach((row: any) => {
      insertSettings.run([row.id, JSON.stringify(row)])
    })
    insertSettings.free()

    const insertInventory = db.prepare('INSERT INTO inventory_items (id, name, category, json) VALUES (?, ?, ?, ?)')
    ;(inventory.data || []).forEach((row: any) => {
      insertInventory.run([row.id, row.name, row.category, JSON.stringify(row)])
    })
    insertInventory.free()

    const binary = db.export()
    const buffer = Buffer.from(binary)
    const fileName = buildFileName()
    const path = getStoragePath(groupId, fileName)

    const { error: uploadError } = await supabase.storage
      .from(BACKUP_BUCKET)
      .upload(path, buffer, {
        contentType: 'application/x-sqlite3',
        upsert: true,
      })

    if (uploadError) {
      return NextResponse.json({ error: 'Backup konnte nicht hochgeladen werden.' }, { status: 500 })
    }

    return NextResponse.json({ success: true, fileName }, { headers: { 'Cache-Control': 'no-store' } })
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Backup fehlgeschlagen.', details: error?.message || 'Unbekannter Fehler' },
      { status: 500, headers: { 'Cache-Control': 'no-store' } }
    )
  }
}
