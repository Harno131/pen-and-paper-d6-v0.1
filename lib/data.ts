import { Character, JournalEntry, SharedImage, DiceRoll, DeletedCharacter, Skill, CharacterCreationSettings } from '@/types'
import { getAllSkills } from '@/lib/skills'
import { createSupabaseClient } from './supabase'
import { parseD6Value } from './dice'
import {
  getCharactersFromSupabase,
  saveCharacterToSupabase,
  deleteCharacterInSupabase,
  restoreCharacterInSupabase,
  getDeletedCharactersFromSupabase,
  getAvailableSkillsFromSupabase,
  saveSkillToSupabase,
  removeSkillFromSupabase,
  getGroupSettings,
  saveGroupSettings,
} from './supabase-data'
import {
  saveCharactersToFile,
  saveJournalEntriesToFile,
  isFileStorageEnabled,
} from './file-storage'

// Supabase-only: In-Memory-Cache für synchrone Aufrufer (nach getCharactersAsync / getJournalEntries)
let charactersCache: Character[] = []
let journalCache: JournalEntry[] = []
let deletedCharactersCache: DeletedCharacter[] = []
let lastStorageError: string | null = null

const emitStorageError = () => {
  if (typeof window === 'undefined') return
  if (!lastStorageError) return
  window.dispatchEvent(new CustomEvent('storage-error', { detail: lastStorageError }))
}

const reportRemoteSaveFailure = () => {
  lastStorageError = 'Es gibt eine Sicherheits-Kopie dieses Characters!'
  emitStorageError()
}

export const getStorageError = () => lastStorageError
export const clearStorageError = () => {
  lastStorageError = null
}

const safeSetItem = (key: string, value: string): boolean => {
  try {
    localStorage.setItem(key, value)
    return true
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unbekannter Fehler'
    lastStorageError = `Lokaler Speicher ist voll oder blockiert. (${key}) ${message}`
    console.warn('Speicherfehler:', key, error)
    emitStorageError()
    return false
  }
}
const isSupabaseAvailable = (): boolean => {
  if (typeof window === 'undefined') return false
  const supabase = createSupabaseClient()
  const groupId = localStorage.getItem('groupId')
  return supabase !== null && groupId !== null
}

// Synchron: liefert gecachten Stand (nach getCharactersAsync geladen aus Supabase)
export const getCharacters = (): Character[] => {
  if (typeof window === 'undefined') return []
  return charactersCache
}

// Synchron für Kompatibilität (localStorage)
type SaveCharactersOptions = {
  touchedIds?: string[]
}

const mergeCharactersByUpdatedAt = (remote: Character[], local: Character[]) => {
  const localById = new Map(local.map((char) => [char.id, char]))
  const remoteIds = new Set<string>()
  const merged = remote.map((remoteChar) => {
    remoteIds.add(remoteChar.id)
    const localChar = localById.get(remoteChar.id)
    if (!localChar || !localChar.updatedAt || !remoteChar.updatedAt) return remoteChar
    return remoteChar.updatedAt >= localChar.updatedAt ? remoteChar : localChar
  })
  const localOnly = local.filter((char) => !remoteIds.has(char.id))
  return [...merged, ...localOnly]
}

export const saveCharacters = (characters: Character[], options?: SaveCharactersOptions): void => {
  if (typeof window === 'undefined') return
  
  const touchedIds = new Set(options?.touchedIds || [])
  const now = new Date()
  const stamped = characters.map((char) => {
    if (touchedIds.has(char.id)) {
      return { ...char, updatedAt: now }
    }
    if (!char.updatedAt) {
      return { ...char, updatedAt: now }
    }
    return char
  })

  charactersCache = stamped

  if (isSupabaseAvailable()) {
    const groupId = localStorage.getItem('groupId')
    if (groupId) {
      stamped.forEach(char => {
        saveCharacterToSupabase(groupId, char)
          .then((ok) => {
            if (!ok) reportRemoteSaveFailure()
          })
          .catch(() => reportRemoteSaveFailure())
      })
      if (isFileStorageEnabled()) {
        saveCharactersToFile(groupId, stamped).catch(() => {})
      }
    }
  }
}

export const clearDataCaches = (): void => {
  charactersCache = []
  journalCache = []
  deletedCharactersCache = []
  availableSkillsCache = []
}

export const getCharactersAsync = async (): Promise<Character[]> => {
  if (typeof window === 'undefined') return []
  const groupId = localStorage.getItem('groupId')
  if (!groupId || !isSupabaseAvailable()) {
    charactersCache = []
    return []
  }
  const characters = await getCharactersFromSupabase(groupId)
  charactersCache = characters
  return characters
}

export const saveCharacterAsync = async (character: Character): Promise<void> => {
  if (typeof window === 'undefined') return
  const groupId = localStorage.getItem('groupId')
  const nextCharacter = { ...character, updatedAt: new Date() }
  const characters = [...charactersCache]
  const index = characters.findIndex(c => c.id === nextCharacter.id)
  if (index >= 0) characters[index] = nextCharacter
  else characters.push(nextCharacter)
  saveCharacters(characters, { touchedIds: [nextCharacter.id] })
  if (isSupabaseAvailable() && groupId) {
    await saveCharacterToSupabase(groupId, nextCharacter)
      .then((ok) => { if (!ok) reportRemoteSaveFailure() })
      .catch(() => reportRemoteSaveFailure())
  }
}

export const getJournalEntries = async (): Promise<JournalEntry[]> => {
  if (typeof window === 'undefined') return []
  const groupId = localStorage.getItem('groupId')
  if (!groupId || !isSupabaseAvailable()) {
    journalCache = []
    return []
  }
  const { getJournalEntriesFromSupabase } = await import('./supabase-data')
  const entries = await getJournalEntriesFromSupabase(groupId)
  journalCache = entries
  return entries
}

export const saveJournalEntry = async (entry: JournalEntry): Promise<void> => {
  if (typeof window === 'undefined') return
  const groupId = localStorage.getItem('groupId')
  if (isSupabaseAvailable() && groupId) {
    const { saveJournalEntryToSupabase } = await import('./supabase-data')
    await saveJournalEntryToSupabase(groupId, entry).catch(() => {})
  }
  journalCache = [...journalCache, entry]
  if (isFileStorageEnabled() && groupId) {
    await saveJournalEntriesToFile(groupId, journalCache).catch(() => {})
  }
}

export const deleteJournalEntry = async (entryId: string): Promise<boolean> => {
  if (typeof window === 'undefined') return false
  const groupId = localStorage.getItem('groupId')
  if (!groupId || !isSupabaseAvailable()) return false
  const { deleteJournalEntryFromSupabase } = await import('./supabase-data')
  const ok = await deleteJournalEntryFromSupabase(groupId, entryId)
  if (ok) journalCache = journalCache.filter(e => e.id !== entryId)
  return ok
}

export const getSharedImages = (): SharedImage[] => {
  if (typeof window === 'undefined') return []
  const stored = localStorage.getItem('sharedImages')
  if (stored) {
    const images = JSON.parse(stored)
    return images.map((img: any) => ({
      ...img,
      timestamp: new Date(img.timestamp),
    }))
  }
  return []
}

export const saveSharedImage = (image: SharedImage): boolean => {
  if (typeof window === 'undefined') return false
  try {
    const images = getSharedImages()
    images.push(image)
    safeSetItem('sharedImages', JSON.stringify(images))
    return true
  } catch (error) {
    console.warn('Fehler beim Speichern des Bildes:', error)
    return false
  }
}

export const getDiceRolls = (characterId?: string): DiceRoll[] => {
  if (typeof window === 'undefined') return []
  const stored = localStorage.getItem('diceRolls')
  if (stored) {
    const rolls = JSON.parse(stored)
    const parsed = rolls.map((r: any) => ({
      ...r,
      timestamp: new Date(r.timestamp),
    }))
    if (characterId) {
      return parsed.filter((r: DiceRoll) => r.characterId === characterId)
    }
    return parsed
  }
  return []
}

export const saveDiceRoll = (roll: DiceRoll) => {
  if (typeof window === 'undefined') return
  const rolls = getDiceRolls()
  rolls.push(roll)
  safeSetItem('diceRolls', JSON.stringify(rolls))
}

export const getDeletedCharacters = (): DeletedCharacter[] => {
  if (typeof window === 'undefined') return []
  return deletedCharactersCache
}

export const getDeletedCharactersAsync = async (): Promise<DeletedCharacter[]> => {
  if (typeof window === 'undefined') return []
  const groupId = localStorage.getItem('groupId')
  if (!groupId || !isSupabaseAvailable()) {
    deletedCharactersCache = []
    return []
  }
  const list = await getDeletedCharactersFromSupabase(groupId)
  deletedCharactersCache = list as DeletedCharacter[]
  return deletedCharactersCache
}

export const deleteCharacter = async (characterId: string): Promise<boolean> => {
  if (typeof window === 'undefined') return false
  const groupId = localStorage.getItem('groupId')
  const character = charactersCache.find(c => c.id === characterId)
  if (!character || !groupId) return false
  const ok = await deleteCharacterInSupabase(groupId, characterId)
  if (!ok) return false
  charactersCache = charactersCache.filter(c => c.id !== characterId)
  const deletedCharacter: DeletedCharacter = {
    ...character,
    deletedDate: new Date(),
    updatedAt: new Date(),
  }
  deletedCharactersCache = [...deletedCharactersCache, deletedCharacter]
  return true
}

export const restoreCharacter = async (characterId: string): Promise<boolean> => {
  if (typeof window === 'undefined') return false
  const groupId = localStorage.getItem('groupId')
  const deletedCharacter = deletedCharactersCache.find(c => c.id === characterId)
  if (!deletedCharacter || !groupId) return false
  const ok = await restoreCharacterInSupabase(groupId, characterId)
  if (!ok) return false
  const { deletedDate: _, ...rest } = deletedCharacter
  const restored: Character = {
    ...rest,
    lastPlayedDate: new Date(),
    updatedAt: new Date(),
  }
  deletedCharactersCache = deletedCharactersCache.filter(c => c.id !== characterId)
  charactersCache = [...charactersCache, restored]
  saveCharacters(charactersCache, { touchedIds: [characterId] })
  return true
}

export const updateLastPlayedDate = (characterId: string) => {
  if (typeof window === 'undefined') return
  const characters = getCharacters()
  const updated = characters.map(char => {
    if (char.id === characterId) {
      return {
        ...char,
        lastPlayedDate: new Date(),
        updatedAt: new Date(),
      }
    }
    return char
  })
  saveCharacters(updated, { touchedIds: [characterId] })
}

let availableSkillsCache: Skill[] = []

export const getAvailableSkills = (): Skill[] => {
  if (typeof window === 'undefined') return []
  return availableSkillsCache
}

export const getAvailableSkillsAsync = async (groupId: string | null): Promise<Skill[]> => {
  if (typeof window === 'undefined') return []
  if (!groupId || !isSupabaseAvailable()) {
    availableSkillsCache = []
    return []
  }
  const skills = await getAvailableSkillsFromSupabase(groupId)
  availableSkillsCache = skills
  return skills
}

export const saveAvailableSkills = (skills: Skill[]): boolean => {
  if (typeof window === 'undefined') return false
  availableSkillsCache = skills
  return true
}

export const addSkill = async (skill: Omit<Skill, 'id'>): Promise<Skill | null> => {
  const groupId = typeof window !== 'undefined' ? localStorage.getItem('groupId') : null
  const newSkill: Skill = {
    ...skill,
    id: `skill-${Date.now()}`,
  }
  availableSkillsCache = [...availableSkillsCache, newSkill]
  if (groupId && isSupabaseAvailable()) {
    const ok = await saveSkillToSupabase(groupId, newSkill)
    if (!ok) return null
  }
  return newSkill
}

export const removeSkill = async (skillId: string): Promise<boolean> => {
  const groupId = typeof window !== 'undefined' ? localStorage.getItem('groupId') : null
  const filtered = availableSkillsCache.filter(s => s.id !== skillId)
  if (filtered.length === availableSkillsCache.length) return false
  availableSkillsCache = filtered
  if (groupId && isSupabaseAvailable()) {
    return removeSkillFromSupabase(groupId, skillId)
  }
  return true
}

export const updateSkill = async (skillId: string, updates: Partial<Skill>): Promise<boolean> => {
  const groupId = typeof window !== 'undefined' ? localStorage.getItem('groupId') : null
  const idx = availableSkillsCache.findIndex(s => s.id === skillId)
  if (idx < 0) return false
  availableSkillsCache = availableSkillsCache.map(s =>
    s.id === skillId ? { ...s, ...updates } : s
  )
  if (groupId && isSupabaseAvailable()) {
    const skill = availableSkillsCache.find(s => s.id === skillId)
    if (skill) return saveSkillToSupabase(groupId, skill)
  }
  return true
}

// Charaktererstellungs-Einstellungen
export const getCharacterCreationSettings = (): CharacterCreationSettings => {
  const defaults: CharacterCreationSettings = {
    maxAttributePoints: 7,
    maxSkillPoints: 8,
    maxBlibs: 4,
    maxAttributeDicePerAttribute: 2,
    maxSkillDicePerSkill: 2,
    maxBlibsPerSpecialization: 2,
    defaultStartBlips: 67,
  }
  if (typeof window === 'undefined') {
    return defaults
  }
  const stored = localStorage.getItem('characterCreationSettings')
  if (stored) {
    return { ...defaults, ...JSON.parse(stored) }
  }
  saveCharacterCreationSettings(defaults)
  return defaults
}

export const saveCharacterCreationSettings = (settings: CharacterCreationSettings) => {
  if (typeof window === 'undefined') return
  safeSetItem('characterCreationSettings', JSON.stringify(settings))
}

// Prüft Charakter auf Punkte-Status (verwendet gespeicherte Werte für Kompatibilität)
export const checkCharacterPoints = (character: Character): {
  hasRemainingPoints: boolean
  needsReduction: boolean
  remainingAttributePoints: number
  remainingSkillPoints: number
  remainingBlibs: number
  usedAttributePoints: number
  usedSkillPoints: number
  usedBlibs: number
} => {
  const settings = getCharacterCreationSettings()
  
  // Berechne verwendete Punkte (neu berechnen, nicht aus gespeicherten Werten)
  const calculated = calculateCharacterPoints(character)
  const usedAttributePoints = calculated.usedAttributePoints
  const usedSkillPoints = calculated.usedSkillPoints
  const usedBlibs = calculated.usedBlibs
  
  // Berechne verbleibende Punkte
  const remainingAttributePoints = settings.maxAttributePoints - usedAttributePoints
  const remainingSkillPoints = settings.maxSkillPoints - usedSkillPoints
  const remainingBlibs = settings.maxBlibs - usedBlibs
  
  // Prüfe ob Reduktion nötig ist (mehr verwendet als erlaubt)
  const needsReduction = 
    usedAttributePoints > settings.maxAttributePoints ||
    usedSkillPoints > settings.maxSkillPoints ||
    usedBlibs > settings.maxBlibs
  
  // Prüfe ob noch Punkte übrig sind
  const hasRemainingPoints = 
    remainingAttributePoints > 0 ||
    remainingSkillPoints > 0 ||
    remainingBlibs > 0
  
  return {
    hasRemainingPoints,
    needsReduction,
    remainingAttributePoints,
    remainingSkillPoints,
    remainingBlibs,
    usedAttributePoints,
    usedSkillPoints,
    usedBlibs,
  }
}

// Hole alle Spieler mit ihren Charakteranzahlen
export const getPlayersWithCharacterCount = (): { playerName: string; characterCount: number }[] => {
  const characters = getCharacters()
  const playerMap = new Map<string, number>()
  
  characters.forEach(char => {
    const count = playerMap.get(char.playerName) || 0
    playerMap.set(char.playerName, count + 1)
  })
  
  return Array.from(playerMap.entries()).map(([playerName, characterCount]) => ({
    playerName,
    characterCount,
  }))
}

// Berechne Trefferpunkte (HP) basierend auf Klasse, Stufe und Stärke
export const calculateHitPoints = (character: Character): number => {
  const level = character.level || 1
  const strengthValue = character.attributes['Stärke'] || '2D'
  
  // Parse Stärke-Wert (z.B. "2D", "2D+1", "3D")
  const strengthMatch = strengthValue.match(/^(\d+)D(\+(\d+))?$/)
  if (!strengthMatch) return 10 * level // Fallback
  
  const strengthDice = parseInt(strengthMatch[1])
  const strengthModifier = parseInt(strengthMatch[3] || '0')
  
  // Basis-HP pro Stufe: Stärke-D6 + Modifier
  // Beispiel: Stärke 2D+1 = 2 + 1 = 3 HP pro Stufe
  const hpPerLevel = strengthDice + strengthModifier
  
  // Minimum 1 HP pro Stufe
  const finalHpPerLevel = Math.max(1, hpPerLevel)
  
  return finalHpPerLevel * level
}

const BASE_VALUES: { [key: string]: string } = {
  Reflexe: '2D',
  Koordination: '2D',
  Stärke: '2D',
  Wissen: '2D',
  Wahrnehmung: '2D',
  Ausstrahlung: '2D',
  Magie: '0D',
}

// Berechne Punkte immer neu aus den aktuellen Werten
export const calculateCharacterPoints = (character: Character): {
  usedAttributePoints: number
  usedSkillPoints: number
  usedBlibs: number
  usedBlips: number
  remainingAttributePoints: number
  remainingSkillPoints: number
  remainingBlibs: number
  remainingBlips: number
  totalBlipBudget: number
} => {
  const settings = getCharacterCreationSettings()
  
  // Berechne verwendete Attributspunkte aus aktuellen Attributen
  const usedAttributePoints = Object.entries(character.attributes).reduce((sum, [attrName, attrValue]) => {
    const base = BASE_VALUES[attrName] || '2D'
    const baseMatch = base.match(/^(\d+)D(\+(\d+))?$/)
    const attrMatch = attrValue.match(/^(\d+)D(\+(\d+))?$/)
    
    if (!baseMatch || !attrMatch) return sum
    
    const baseDice = parseInt(baseMatch[1])
    const attrDice = parseInt(attrMatch[1])
    
    return sum + Math.max(0, attrDice - baseDice)
  }, 0)
  
  // Berechne verwendete Fertigkeitspunkte
  const usedSkillPoints = character.skills.reduce((sum, skill) => sum + (skill.bonusDice || 0), 0)
  
  // Berechne verwendete Blibs
  const usedBlibs = character.skills.reduce((sum, skill) => 
    sum + skill.specializations.reduce((specSum, spec) => specSum + spec.blibs, 0), 0
  )

  const calculateStepCost = (totalSteps: number): number => {
    let totalBlips = 0
    for (let i = 1; i <= totalSteps; i += 1) {
      totalBlips += Math.ceil(i / 3)
    }
    return totalBlips
  }

  const getStepsFromD6 = (value: string): number => {
    const { diceCount, modifier } = parseD6Value(value)
    return diceCount * 3 + modifier
  }

  const usedBlipsFromAttributes = Object.entries(character.attributes || {}).reduce((sum, [attrName, attrValue]) => {
    const base = BASE_VALUES[attrName] || '2D'
    const steps = Math.max(0, getStepsFromD6(attrValue) - getStepsFromD6(base))
    return sum + calculateStepCost(steps)
  }, 0)

  const usedBlipsFromSkills = character.skills.reduce((sum, skill) => {
    const skillSteps = Math.max(0, (skill.bonusDice || 0) * 3 + (skill.bonusSteps || 0))
    const skillCost = calculateStepCost(skillSteps)
    const specCost = skill.specializations.reduce((specSum, spec) => specSum + calculateStepCost(spec.blibs || 0), 0)
    return sum + skillCost + specCost
  }, 0)

  const usedBlips = usedBlipsFromAttributes + usedBlipsFromSkills
  const totalBlipBudget = (settings.defaultStartBlips || 0) + (character.earnedBlips || 0)
  const remainingBlips = totalBlipBudget - usedBlips
  
  return {
    usedAttributePoints,
    usedSkillPoints,
    usedBlibs,
    usedBlips,
    remainingAttributePoints: settings.maxAttributePoints - usedAttributePoints,
    remainingSkillPoints: settings.maxSkillPoints - usedSkillPoints,
    remainingBlibs: settings.maxBlibs - usedBlibs,
    remainingBlips,
    totalBlipBudget,
  }
}
