/**
 * Einmaliger Auto-Import: Liest vorhandene Daten aus LocalStorage (und optional
 * aus File-Storage/SQLite), merged sie mit Supabase und schreibt das Ergebnis
 * nach Supabase. Danach wird ein Flag gesetzt, damit der Import nicht erneut läuft.
 */
import { Character, JournalEntry, Skill } from '@/types'
import { createSupabaseClient } from './supabase'
import {
  getCharactersFromSupabase,
  saveCharacterToSupabase,
  getJournalEntriesFromSupabase,
  saveJournalEntryToSupabase,
  getAvailableSkillsFromSupabase,
  saveSkillToSupabase,
} from './supabase-data'

const MIGRATION_FLAG = 'supabase_migrated_v1'

function parseLocalCharacters(): Character[] {
  try {
    const raw = typeof window !== 'undefined' ? localStorage.getItem('characters') : null
    if (!raw) return []
    const arr = JSON.parse(raw)
    return (Array.isArray(arr) ? arr : []).map((char: any) => ({
      ...char,
      createdDate: char.createdDate ? new Date(char.createdDate) : undefined,
      lastPlayedDate: char.lastPlayedDate ? new Date(char.lastPlayedDate) : undefined,
      deletedDate: char.deletedDate ? new Date(char.deletedDate) : undefined,
      updatedAt: char.updatedAt ? new Date(char.updatedAt) : undefined,
    }))
  } catch {
    return []
  }
}

function parseLocalJournal(): JournalEntry[] {
  try {
    const raw = typeof window !== 'undefined' ? localStorage.getItem('journalEntries') : null
    if (!raw) return []
    const arr = JSON.parse(raw)
    return (Array.isArray(arr) ? arr : []).map((e: any) => ({
      ...e,
      timestamp: new Date(e.timestamp),
    }))
  } catch {
    return []
  }
}

function parseLocalSkills(): Skill[] {
  try {
    const raw = typeof window !== 'undefined' ? localStorage.getItem('availableSkills') : null
    if (!raw) return []
    const arr = JSON.parse(raw)
    return (Array.isArray(arr) ? arr : []).map((s: any) => ({
      ...s,
      bonusSteps: s.bonusSteps ?? 0,
      specializations: s.specializations ?? [],
    }))
  } catch {
    return []
  }
}

async function loadCharactersFromFileApi(groupId: string): Promise<Character[]> {
  try {
    const res = await fetch(`/api/file-storage/characters?groupId=${encodeURIComponent(groupId)}`)
    if (!res.ok) return []
    const data = await res.json()
    const arr = data.characters || []
    return arr.map((char: any) => ({
      ...char,
      createdDate: char.createdDate ? new Date(char.createdDate) : undefined,
      lastPlayedDate: char.lastPlayedDate ? new Date(char.lastPlayedDate) : undefined,
      deletedDate: char.deletedDate ? new Date(char.deletedDate) : undefined,
      updatedAt: char.updatedAt ? new Date(char.updatedAt) : undefined,
    }))
  } catch {
    return []
  }
}

async function loadJournalFromFileApi(groupId: string): Promise<JournalEntry[]> {
  try {
    const res = await fetch(`/api/file-storage/journal?groupId=${encodeURIComponent(groupId)}`)
    if (!res.ok) return []
    const data = await res.json()
    const arr = data.entries || []
    return arr.map((e: any) => ({ ...e, timestamp: new Date(e.timestamp) }))
  } catch {
    return []
  }
}

function mergeCharactersByUpdatedAt(remote: Character[], local: Character[]): Character[] {
  const localById = new Map(local.map((c) => [c.id, c]))
  const remoteIds = new Set<string>()
  const merged = remote.map((r) => {
    remoteIds.add(r.id)
    const localChar = localById.get(r.id)
    if (!localChar?.updatedAt || !r.updatedAt) return r
    return r.updatedAt >= localChar.updatedAt ? r : localChar
  })
  const localOnly = local.filter((c) => !remoteIds.has(c.id))
  return [...merged, ...localOnly]
}

function mergeJournalEntries(remote: JournalEntry[], local: JournalEntry[]): JournalEntry[] {
  const byId = new Map<string, JournalEntry>()
  remote.forEach((e) => byId.set(e.id, e))
  local.forEach((e) => {
    const existing = byId.get(e.id)
    if (!existing || (e.timestamp && existing.timestamp && e.timestamp > existing.timestamp)) {
      byId.set(e.id, e)
    }
  })
  return Array.from(byId.values()).sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
}

function mergeSkills(remote: Skill[], local: Skill[]): Skill[] {
  const key = (s: Skill) => `${(s.name || '').toLowerCase()}|${(s.attribute || '').toLowerCase()}`
  const map = new Map<string, Skill>()
  remote.forEach((s) => map.set(key(s), s))
  local.forEach((s) => {
    const k = key(s)
    const existing = map.get(k)
    const prefer = existing?.description ? existing : s
    map.set(k, { ...prefer, description: (prefer.description || existing?.description || s.description) || undefined })
  })
  return Array.from(map.values())
}

export async function runSupabaseMigrationIfNeeded(groupId: string): Promise<boolean> {
  if (typeof window === 'undefined') return false
  if (localStorage.getItem(MIGRATION_FLAG) === '1') return false
  const supabase = createSupabaseClient()
  if (!supabase) return false

  const localChars = parseLocalCharacters().filter((c) => !c.deletedDate)
  const localJournal = parseLocalJournal()
  const localSkills = parseLocalSkills()

  const fileChars = await loadCharactersFromFileApi(groupId)
  const fileJournal = await loadJournalFromFileApi(groupId)

  const remoteChars = await getCharactersFromSupabase(groupId)
  const remoteJournal = await getJournalEntriesFromSupabase(groupId)
  const remoteSkills = await getAvailableSkillsFromSupabase(groupId)

  const allLocalChars = mergeCharactersByUpdatedAt(
    mergeCharactersByUpdatedAt(remoteChars, localChars),
    fileChars
  )
  const allJournal = mergeJournalEntries(mergeJournalEntries(remoteJournal, localJournal), fileJournal)
  const allSkills = mergeSkills(remoteSkills, localSkills)

  for (const char of allLocalChars) {
    const withDate = char.updatedAt ? char : { ...char, updatedAt: new Date() }
    await saveCharacterToSupabase(groupId, withDate)
  }
  for (const entry of allJournal) {
    await saveJournalEntryToSupabase(groupId, entry)
  }
  for (const skill of allSkills) {
    await saveSkillToSupabase(groupId, skill)
  }

  localStorage.setItem(MIGRATION_FLAG, '1')
  return true
}
