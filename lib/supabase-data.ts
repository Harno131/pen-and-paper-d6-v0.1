import { Character, JournalEntry, SharedImage, DiceRoll, DeletedCharacter, Skill, CharacterCreationSettings, Bestiary } from '@/types'
import { extractTagsFromText } from '@/lib/tags'
import { createSupabaseClient } from './supabase'

// Supabase-basierte Datenbank-Funktionen
// Fallback auf localStorage wenn Supabase nicht verfügbar

const isSupabaseAvailable = () => {
  const supabase = createSupabaseClient()
  return supabase !== null
}

// Gruppen-Funktionen
export const createGroup = async (name: string, createdBy: string, code: string): Promise<{ groupId: string | null; error: string | null }> => {
  const supabase = createSupabaseClient()
  // Entschärft für Entwicklung: Fallback auf localStorage wenn Supabase nicht verfügbar
  if (!supabase) {
    console.warn('⚠️ Supabase nicht verfügbar, verwende localStorage (Entwicklungsmodus)')
    // Für Entwicklung: Erstelle eine lokale Gruppe-ID
    const localGroupId = `local-${Date.now()}`
    if (typeof window !== 'undefined') {
      const localGroups = JSON.parse(localStorage.getItem('localGroups') || '[]')
      localGroups.push({ id: localGroupId, name, code, createdBy })
      localStorage.setItem('localGroups', JSON.stringify(localGroups))
      localStorage.setItem('groupId', localGroupId)
      localStorage.setItem('groupCode', code)
      localStorage.setItem('playerName', createdBy)
      localStorage.setItem('role', 'spielleiter')
    }
    return { groupId: localGroupId, error: null }
  }

  // Prüfe ob Code bereits existiert (entschärft für Entwicklung: nur Warnung, kein Fehler)
  const { data: existingGroup } = await supabase
    .from('groups')
    .select('code')
    .eq('code', code)
    .single()

  // Für Entwicklung: Erlaube doppelte Codes, nur Warnung in Console
  if (existingGroup) {
    console.warn('⚠️ Code bereits vorhanden, wird trotzdem erstellt (Entwicklungsmodus)')
    // return { groupId: null, error: 'Dieser Code ist bereits vergeben. Bitte wähle einen anderen.' }
  }

  const { data, error } = await supabase
    .from('groups')
    .insert({ name, created_by: createdBy, code })
    .select()
    .single()

  if (error) {
    console.error('Error creating group:', error)
    // Entschärft für Entwicklung: Fallback auf localStorage
    console.warn('⚠️ Supabase-Fehler, verwende localStorage (Entwicklungsmodus)')
    const localGroupId = `local-${Date.now()}`
    if (typeof window !== 'undefined') {
      const localGroups = JSON.parse(localStorage.getItem('localGroups') || '[]')
      localGroups.push({ id: localGroupId, name, code, createdBy })
      localStorage.setItem('localGroups', JSON.stringify(localGroups))
      localStorage.setItem('groupId', localGroupId)
      localStorage.setItem('groupCode', code)
      localStorage.setItem('playerName', createdBy)
      localStorage.setItem('role', 'spielleiter')
    }
    return { groupId: localGroupId, error: null }
    // return { 
    //   groupId: null, 
    //   error: `Fehler beim Erstellen der Gruppe: ${error.message || error.code || 'Unbekannter Fehler'}. Prüfe ob die Tabelle "groups" existiert und RLS-Policies korrekt sind.` 
    // }
  }

  if (!data || !data.id) {
    return { groupId: null, error: 'Gruppe wurde erstellt, aber keine ID zurückgegeben.' }
  }

  // Spielleiter als Mitglied hinzufügen
  const { error: memberError } = await supabase
    .from('group_members')
    .insert({ group_id: data.id, player_name: createdBy, role: 'spielleiter' })

  if (memberError) {
    console.error('Error adding group member:', memberError)
    // Für Entwicklung: Gruppe trotzdem behalten, nur Warnung
    console.warn('⚠️ Mitglied konnte nicht hinzugefügt werden, aber Gruppe wurde erstellt (Entwicklungsmodus)')
    // Lösche die Gruppe NICHT mehr für Entwicklung
    // await supabase.from('groups').delete().eq('id', data.id)
    // return { 
    //   groupId: null, 
    //   error: `Fehler beim Hinzufügen des Mitglieds: ${memberError.message || memberError.code || 'Unbekannter Fehler'}. Prüfe ob die Tabelle "group_members" existiert.` 
    // }
  }

  return { groupId: data.id, error: null }
}

export const getGroupByCode = async (code: string) => {
  const supabase = createSupabaseClient()
  if (!supabase) return null

  const { data, error } = await supabase
    .from('groups')
    .select('*')
    .eq('code', code)
    .single()

  if (error) return null
  return data
}

export const joinGroup = async (groupId: string, playerName: string, role: 'spielleiter' | 'spieler'): Promise<boolean> => {
  const supabase = createSupabaseClient()
  if (!supabase) return false

  const { error } = await supabase
    .from('group_members')
    .insert({ group_id: groupId, player_name: playerName, role })

  return !error
}

export const getGroupMembers = async (groupId: string) => {
  const supabase = createSupabaseClient()
  if (!supabase) return []

  const { data, error } = await supabase
    .from('group_members')
    .select('*')
    .eq('group_id', groupId)

  if (error) return []
  return data || []
}

// Bestiary
export const getBestiary = async (): Promise<Bestiary[]> => {
  const supabase = createSupabaseClient()
  if (!supabase) return []

  const { data, error } = await supabase
    .from('bestiary')
    .select('*')
    .order('name', { ascending: true })

  if (error || !data) return []

  return data.map((row: any) => {
    const skills = Array.isArray(row.skills) ? row.skills : []
    const abilities = skills.map((s: any) => (typeof s === 'string' ? s : s?.name)).filter(Boolean)
    return {
      id: row.id,
      name: row.name,
      type: row.type,
      level: row.level,
      race: row.race || undefined,
      description: row.description || undefined,
      abilities,
      tags: Array.isArray(row.tags) ? row.tags : undefined,
      attributes: row.attributes || {},
      maxHp: row.max_hp || 1,
      fallcrestTwist: row.fallcrest_twist || '',
      imageUrl: row.image_url || undefined,
      createdAt: row.created_at ? new Date(row.created_at) : undefined,
      updatedAt: row.updated_at ? new Date(row.updated_at) : undefined,
    }
  })
}

export const upsertBestiary = async (monster: Bestiary): Promise<boolean> => {
  const supabase = createSupabaseClient()
  if (!supabase) return false

  const { error } = await supabase
    .from('bestiary')
    .upsert({
      id: monster.id,
      name: monster.name,
      type: monster.type,
      level: monster.level || 1,
      race: monster.race || null,
      description: monster.description || null,
      attributes: monster.attributes,
      skills: monster.abilities || [],
      inventory: [],
      max_hp: monster.maxHp || 1,
      fallcrest_twist: monster.fallcrestTwist || '',
      image_url: monster.imageUrl || null,
      tags: monster.tags || [],
      updated_at: new Date().toISOString(),
    })

  return !error
}

export const removeBestiary = async (id: string): Promise<boolean> => {
  const supabase = createSupabaseClient()
  if (!supabase) return false

  const { error } = await supabase
    .from('bestiary')
    .delete()
    .eq('id', id)

  return !error
}

// Entferne einen Spieler aus der Gruppe
export const removePlayerFromGroup = async (groupId: string, memberId: string, playerName: string): Promise<boolean> => {
  const supabase = createSupabaseClient()
  if (!supabase) return false

  // Entferne Spieler aus group_members
  const { error: memberError } = await supabase
    .from('group_members')
    .delete()
    .eq('group_id', groupId)
    .eq('id', memberId)

  if (memberError) {
    console.error('Error removing player from group:', memberError)
    return false
  }

  // Entferne auch alle Charaktere des Spielers (soft delete)
  const { error: charError } = await supabase
    .from('characters')
    .update({ deleted_date: new Date().toISOString() })
    .eq('group_id', groupId)
    .eq('player_name', playerName)

  if (charError) {
    console.error('Error deleting player characters:', charError)
    // Spieler wurde trotzdem entfernt, nur Warnung
  }

  return true
}

// Hole alle Gruppen eines Spielers (als Mitglied)
export const getGroupsByPlayer = async (playerName: string) => {
  const supabase = createSupabaseClient()
  if (!supabase) return []

  const { data: members, error } = await supabase
    .from('group_members')
    .select('group_id, role, joined_at')
    .eq('player_name', playerName)

  if (error || !members || members.length === 0) return []

  // Hole die Gruppen-Details
  const groupIds = members.map(m => m.group_id)
  const { data: groups, error: groupsError } = await supabase
    .from('groups')
    .select('*')
    .in('id', groupIds)

  if (groupsError || !groups) return []

  // Kombiniere Gruppen-Daten mit Mitgliedschafts-Info
  return groups.map(group => {
    const member = members.find(m => m.group_id === group.id)
    return {
      ...group,
      role: member?.role || 'spieler',
      joined_at: member?.joined_at,
    }
  })
}

// Validiere ob ein Spieler Mitglied einer Gruppe ist
export const validateGroupMembership = async (groupId: string, playerName: string): Promise<{ valid: boolean; role?: 'spielleiter' | 'spieler'; group?: any }> => {
  const supabase = createSupabaseClient()
  if (!supabase) return { valid: false }

  // Prüfe ob Gruppe existiert
  const { data: group, error: groupError } = await supabase
    .from('groups')
    .select('*')
    .eq('id', groupId)
    .single()

  if (groupError || !group) {
    return { valid: false }
  }

  // Prüfe ob Spieler Mitglied ist
  const { data: member, error: memberError } = await supabase
    .from('group_members')
    .select('role')
    .eq('group_id', groupId)
    .eq('player_name', playerName)
    .single()

  if (memberError || !member) {
    return { valid: false, group }
  }

  return {
    valid: true,
    role: member.role as 'spielleiter' | 'spieler',
    group,
  }
}

// Hole Gruppe nach ID
export const getGroupById = async (groupId: string) => {
  const supabase = createSupabaseClient()
  if (!supabase) return null

  const { data, error } = await supabase
    .from('groups')
    .select('*')
    .eq('id', groupId)
    .single()

  if (error) return null
  return data
}

// Hole alle Gruppen (für Spielleiter-Übersicht)
export const getAllGroups = async () => {
  const supabase = createSupabaseClient()
  if (!supabase) return []

  const { data, error } = await supabase
    .from('groups')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) return []
  return data || []
}

// Charakter-Funktionen mit Supabase
export const getCharactersFromSupabase = async (groupId: string): Promise<Character[]> => {
  const supabase = createSupabaseClient()
  if (!supabase) return []

  const { data, error } = await supabase
    .from('characters')
    .select('*')
    .eq('group_id', groupId)
    .is('deleted_date', null) // Nur nicht-gelöschte Charaktere

  if (error) {
    console.error('Error fetching characters:', error)
    return []
  }

  // Konvertiere Datenbank-Format zu Character-Format
  return (data || []).map((char: any) => ({
    id: char.id,
    name: char.name,
    playerName: char.player_name,
    className: char.class_name,
    race: char.race,
    age: char.age,
    gender: char.gender,
    level: char.level || 1,
    attributes: char.attributes,
    skills: char.skills || [],
    inventory: char.inventory || [],
    alignment: char.alignment,
    notes: char.notes,
    imageUrl: char.image_url || undefined,
    profileImageUrl: char.profile_image_url || char.image_url || undefined,
    tags: Array.isArray(char.tags) ? char.tags : undefined,
    createdDate: char.created_date ? new Date(char.created_date) : undefined,
    lastPlayedDate: char.last_played_date ? new Date(char.last_played_date) : undefined,
    deletedDate: char.deleted_date ? new Date(char.deleted_date) : undefined,
    baseAttributes: char.base_attributes,
    baseSkills: char.base_skills,
    attributePointsUsed: char.attribute_points_used,
    skillPointsUsed: char.skill_points_used,
    blibsUsed: char.blibs_used,
    earnedBlips: char.earned_blips || 0,
  }))
}

export const saveCharacterToSupabase = async (groupId: string, character: Character): Promise<boolean> => {
  const supabase = createSupabaseClient()
  if (!supabase) return false

  const tagsFromNotes = extractTagsFromText(character.notes || '')
  const tags = character.tags && character.tags.length > 0 ? character.tags : tagsFromNotes

  const { error } = await supabase
    .from('characters')
    .upsert({
      id: character.id,
      group_id: groupId,
      name: character.name,
      player_name: character.playerName,
      class_name: character.className,
      race: character.race,
      age: character.age,
      gender: character.gender,
      level: character.level || 1,
      attributes: character.attributes,
      skills: character.skills || [],
      inventory: character.inventory || [],
      alignment: character.alignment,
      notes: character.notes,
      image_url: character.imageUrl || character.profileImageUrl || null,
      profile_image_url: character.profileImageUrl || character.imageUrl || null,
      tags: tags.length > 0 ? tags : null,
      created_date: character.createdDate?.toISOString(),
      last_played_date: character.lastPlayedDate?.toISOString(),
      deleted_date: character.deletedDate?.toISOString(),
      base_attributes: character.baseAttributes,
      base_skills: character.baseSkills,
      attribute_points_used: character.attributePointsUsed,
      skill_points_used: character.skillPointsUsed,
      blibs_used: character.blibsUsed,
      earned_blips: character.earnedBlips || 0,
    })

  return !error
}

export const deleteCharacterInSupabase = async (groupId: string, characterId: string): Promise<boolean> => {
  const supabase = createSupabaseClient()
  if (!supabase) return false

  // Soft delete: Setze deleted_date
  const { error } = await supabase
    .from('characters')
    .update({ deleted_date: new Date().toISOString() })
    .eq('id', characterId)
    .eq('group_id', groupId)

  return !error
}

// Fertigkeiten-Funktionen
export const getAvailableSkillsFromSupabase = async (groupId: string): Promise<Skill[]> => {
  const supabase = createSupabaseClient()
  if (!supabase) return []

  const { data, error } = await supabase
    .from('available_skills')
    .select('*')
    .eq('group_id', groupId)
    .order('attribute', { ascending: true })
    .order('name', { ascending: true })

  if (error) return []

  return (data || []).map((skill: any) => ({
    id: skill.id,
    name: skill.name,
    attribute: skill.attribute,
    bonusDice: 0,
    specializations: [],
    isWeakened: skill.is_weakened || false,
    isCustom: skill.is_custom || false,
  }))
}

export const saveSkillToSupabase = async (groupId: string, skill: Skill): Promise<boolean> => {
  const supabase = createSupabaseClient()
  if (!supabase) return false

  const { error } = await supabase
    .from('available_skills')
    .upsert({
      id: skill.id,
      group_id: groupId,
      name: skill.name,
      attribute: skill.attribute,
      is_weakened: skill.isWeakened || false,
      is_custom: skill.isCustom || false,
    })

  return !error
}

export const removeSkillFromSupabase = async (groupId: string, skillId: string): Promise<boolean> => {
  const supabase = createSupabaseClient()
  if (!supabase) return false

  const { error } = await supabase
    .from('available_skills')
    .delete()
    .eq('id', skillId)
    .eq('group_id', groupId)

  return !error
}

// Einstellungen
export const getGroupSettings = async (groupId: string): Promise<CharacterCreationSettings | null> => {
  const supabase = createSupabaseClient()
  if (!supabase) return null

  const { data, error } = await supabase
    .from('groups')
    .select('settings')
    .eq('id', groupId)
    .single()

  const settings = data.settings as any
  return {
    maxAttributePoints: settings.maxAttributePoints || 7,
    maxSkillPoints: settings.maxSkillPoints || 8,
    maxBlibs: settings.maxBlibs || 4,
    fantasyCalendar: settings.fantasyCalendar || {},
    // Diese Felder fügen wir hinzu, um das Interface zu erfüllen:
    maxAttributeDicePerAttribute: 4, 
    maxSkillDicePerSkill: 3,
    maxBlibsPerSpecialization: 3,
    defaultStartBlips: settings.defaultStartBlips || 67
  }
}

export const saveGroupSettings = async (groupId: string, settings: CharacterCreationSettings): Promise<boolean> => {
  const supabase = createSupabaseClient()
  if (!supabase) return false

  const { error } = await supabase
    .from('groups')
    .update({ settings })
    .eq('id', groupId)

  return !error
}

// Journal-Einträge Funktionen
export const getJournalEntriesFromSupabase = async (groupId: string): Promise<JournalEntry[]> => {
  const supabase = createSupabaseClient()
  if (!supabase) return []

  const { data, error } = await supabase
    .from('journal_entries')
    .select('*')
    .eq('group_id', groupId)
    .order('timestamp', { ascending: false })

  if (error || !data) return []

  return data.map((entry: any) => ({
    id: entry.id,
    author: entry.author,
    characterId: entry.character_id,
    title: entry.title,
    content: entry.content,
    tags: Array.isArray(entry.tags) ? entry.tags : undefined,
    imageUrl: entry.image_url || undefined,
    illustrationUrl: entry.illustration_url || entry.image_url || undefined,
    timestamp: new Date(entry.timestamp),
    fantasyDate: entry.fantasy_date ? {
      year: entry.fantasy_date.year,
      month: entry.fantasy_date.month,
      day: entry.fantasy_date.day,
      weekday: entry.fantasy_date.weekday,
    } : undefined,
    timeOfDay: entry.time_of_day as any,
  }))
}

export const saveJournalEntryToSupabase = async (groupId: string, entry: JournalEntry): Promise<boolean> => {
  const supabase = createSupabaseClient()
  if (!supabase) return false

  const tagsFromContent = extractTagsFromText(`${entry.title} ${entry.content}`)
  const tags = entry.tags && entry.tags.length > 0 ? entry.tags : tagsFromContent

  const { error } = await supabase
    .from('journal_entries')
    .insert({
      id: entry.id,
      group_id: groupId,
      author: entry.author,
      character_id: entry.characterId || null,
      title: entry.title,
      content: entry.content,
      tags,
      image_url: entry.imageUrl || entry.illustrationUrl || null,
      illustration_url: entry.illustrationUrl || entry.imageUrl || null,
      timestamp: entry.timestamp.toISOString(),
      fantasy_date: entry.fantasyDate || null,
      time_of_day: entry.timeOfDay || null,
    })

  return !error
}

