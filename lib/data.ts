import { Character, JournalEntry, SharedImage, DiceRoll, DeletedCharacter, Skill, CharacterCreationSettings } from '@/types'
import { getAllSkills } from '@/lib/skills'
import { createSupabaseClient } from './supabase'
import { parseD6Value } from './dice'
import {
  getCharactersFromSupabase,
  saveCharacterToSupabase,
  deleteCharacterInSupabase,
  getAvailableSkillsFromSupabase,
  saveSkillToSupabase,
  removeSkillFromSupabase,
  getGroupSettings,
  saveGroupSettings,
} from './supabase-data'
import {
  loadCharactersFromFile,
  saveCharactersToFile,
  loadJournalEntriesFromFile,
  saveJournalEntriesToFile,
  isFileStorageEnabled,
} from './file-storage'

// Hybrid: Supabase wenn verfügbar, sonst localStorage
const isSupabaseAvailable = (): boolean => {
  if (typeof window === 'undefined') return false
  const supabase = createSupabaseClient()
  const groupId = localStorage.getItem('groupId')
  return supabase !== null && groupId !== null
}

// Synchron für Kompatibilität (localStorage)
export const getCharacters = (): Character[] => {
  if (typeof window === 'undefined') return []
  const stored = localStorage.getItem('characters')
  if (stored) {
    const characters = JSON.parse(stored)
    return characters.map((char: any) => ({
      ...char,
      createdDate: char.createdDate ? new Date(char.createdDate) : undefined,
      lastPlayedDate: char.lastPlayedDate ? new Date(char.lastPlayedDate) : undefined,
      deletedDate: char.deletedDate ? new Date(char.deletedDate) : undefined,
    }))
  }
  // Keine Standard-Charaktere mehr - alle Charaktere kommen aus Supabase/localStorage
  return []
}

// Synchron für Kompatibilität (localStorage)
export const saveCharacters = (characters: Character[]): void => {
  if (typeof window === 'undefined') return
  
  // Versuche auch Supabase zu speichern (async im Hintergrund)
  if (isSupabaseAvailable()) {
    const groupId = localStorage.getItem('groupId')
    if (groupId) {
      // Speichere im Hintergrund (nicht blockierend)
      characters.forEach(char => {
        saveCharacterToSupabase(groupId, char).catch(err => {
          console.warn('Failed to save to Supabase:', err)
        })
      })
    }
  }
  
  // Immer auch localStorage (für Fallback)
  localStorage.setItem('characters', JSON.stringify(characters))
}

// Neue async Funktionen für Supabase und Datei-Storage
export const getCharactersAsync = async (): Promise<Character[]> => {
  if (typeof window === 'undefined') return []
  
  const groupId = localStorage.getItem('groupId')
  if (!groupId) {
    // Fallback: localStorage
    return getCharacters()
  }
  
  // 1. Prüfe Datei-Storage (wenn aktiviert)
  if (isFileStorageEnabled()) {
    const fileCharacters = await loadCharactersFromFile(groupId)
    if (fileCharacters.length > 0) {
      // Auch in localStorage speichern für Offline-Fallback
      localStorage.setItem('characters', JSON.stringify(fileCharacters))
      return fileCharacters
    }
  }
  
  // 2. Prüfe Supabase
  if (isSupabaseAvailable()) {
    const characters = await getCharactersFromSupabase(groupId)
    if (characters.length > 0) {
      // Auch in localStorage speichern für Offline-Fallback
      localStorage.setItem('characters', JSON.stringify(characters))
      // Optional: Auch in Dateien speichern (Backup)
      if (isFileStorageEnabled()) {
        await saveCharactersToFile(groupId, characters).catch(err => {
          console.warn('Fehler beim Speichern in Dateien:', err)
        })
      }
      return characters
    }
  }
  
  // Fallback: localStorage
  return getCharacters()
}

export const saveCharacterAsync = async (character: Character): Promise<void> => {
  if (typeof window === 'undefined') return
  
  const groupId = localStorage.getItem('groupId')
  
  // Immer auch localStorage
  const characters = getCharacters()
  const index = characters.findIndex(c => c.id === character.id)
  if (index >= 0) {
    characters[index] = character
  } else {
    characters.push(character)
  }
  saveCharacters(characters)
  
  // Speichere in Datei-Storage (wenn aktiviert)
  if (isFileStorageEnabled() && groupId) {
    await saveCharactersToFile(groupId, characters).catch(err => {
      console.warn('Fehler beim Speichern in Dateien:', err)
    })
  }
  
  // Speichere in Supabase (wenn verfügbar)
  if (isSupabaseAvailable() && groupId) {
    await saveCharacterToSupabase(groupId, character).catch(err => {
      console.warn('Fehler beim Speichern in Supabase:', err)
    })
  }
}

export const getJournalEntries = async (): Promise<JournalEntry[]> => {
  if (typeof window === 'undefined') return []
  
  const groupId = localStorage.getItem('groupId')
  
  // 1. Prüfe Datei-Storage (wenn aktiviert)
  if (isFileStorageEnabled() && groupId) {
    const fileEntries = await loadJournalEntriesFromFile(groupId)
    if (fileEntries.length > 0) {
      // Auch in localStorage speichern für Offline-Fallback
      localStorage.setItem('journalEntries', JSON.stringify(fileEntries))
      return fileEntries
    }
  }
  
  // 2. Prüfe Supabase
  if (isSupabaseAvailable() && groupId) {
    const { getJournalEntriesFromSupabase } = await import('./supabase-data')
    const entries = await getJournalEntriesFromSupabase(groupId)
    if (entries.length > 0) {
      // Auch in localStorage speichern für Offline-Fallback
      localStorage.setItem('journalEntries', JSON.stringify(entries))
      // Optional: Auch in Dateien speichern (Backup)
      if (isFileStorageEnabled()) {
        await saveJournalEntriesToFile(groupId, entries).catch(err => {
          console.warn('Fehler beim Speichern in Dateien:', err)
        })
      }
      return entries
    }
  }
  
  // Fallback: localStorage
  const stored = localStorage.getItem('journalEntries')
  if (stored) {
    const entries = JSON.parse(stored)
    return entries.map((e: any) => ({
      ...e,
      timestamp: new Date(e.timestamp),
    }))
  }
  return []
}

export const saveJournalEntry = async (entry: JournalEntry): Promise<void> => {
  if (typeof window === 'undefined') return
  
  const groupId = localStorage.getItem('groupId')
  
  // Immer auch localStorage
  const entries = await getJournalEntries()
  entries.push(entry)
  localStorage.setItem('journalEntries', JSON.stringify(entries))
  
  // Speichere in Datei-Storage (wenn aktiviert)
  if (isFileStorageEnabled() && groupId) {
    await saveJournalEntriesToFile(groupId, entries).catch(err => {
      console.warn('Fehler beim Speichern in Dateien:', err)
    })
  }
  
  // Speichere in Supabase wenn verfügbar
  if (isSupabaseAvailable() && groupId) {
    const { saveJournalEntryToSupabase } = await import('./supabase-data')
    await saveJournalEntryToSupabase(groupId, entry).catch(err => {
      console.warn('Fehler beim Speichern in Supabase:', err)
    })
  }
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
    localStorage.setItem('sharedImages', JSON.stringify(images))
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
  localStorage.setItem('diceRolls', JSON.stringify(rolls))
}

// Gelöschte Charaktere (soft delete)
export const getDeletedCharacters = (): DeletedCharacter[] => {
  if (typeof window === 'undefined') return []
  const stored = localStorage.getItem('deletedCharacters')
  if (stored) {
    const deleted = JSON.parse(stored)
    return deleted.map((char: any) => ({
      ...char,
      createdDate: char.createdDate ? new Date(char.createdDate) : undefined,
      lastPlayedDate: char.lastPlayedDate ? new Date(char.lastPlayedDate) : undefined,
      deletedDate: new Date(char.deletedDate),
    }))
  }
  return []
}

export const saveDeletedCharacters = (deletedCharacters: DeletedCharacter[]) => {
  if (typeof window === 'undefined') return
  localStorage.setItem('deletedCharacters', JSON.stringify(deletedCharacters))
}

export const deleteCharacter = (characterId: string): boolean => {
  if (typeof window === 'undefined') return false
  const characters = getCharacters()
  const character = characters.find(c => c.id === characterId)
  
  if (!character) return false

  // Markiere als gelöscht
  const deletedCharacter: DeletedCharacter = {
    ...character,
    deletedDate: new Date(),
  }

  // Entferne aus aktiven Charakteren
  const updatedCharacters = characters.filter(c => c.id !== characterId)
  saveCharacters(updatedCharacters)

  // Füge zu gelöschten Charakteren hinzu
  const deletedCharacters = getDeletedCharacters()
  deletedCharacters.push(deletedCharacter)
  saveDeletedCharacters(deletedCharacters)

  return true
}

export const restoreCharacter = (characterId: string): boolean => {
  if (typeof window === 'undefined') return false
  const deletedCharacters = getDeletedCharacters()
  const deletedCharacter = deletedCharacters.find(c => c.id === characterId)
  
  if (!deletedCharacter) return false

  // Entferne deletedDate
  const { deletedDate, ...character } = deletedCharacter
  const restoredCharacter: Character = {
    ...character,
    lastPlayedDate: new Date(), // Aktualisiere lastPlayedDate
  }

  // Füge zu aktiven Charakteren hinzu
  const characters = getCharacters()
  characters.push(restoredCharacter)
  saveCharacters(characters)

  // Entferne aus gelöschten Charakteren
  const updatedDeleted = deletedCharacters.filter(c => c.id !== characterId)
  saveDeletedCharacters(updatedDeleted)

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
      }
    }
    return char
  })
  saveCharacters(updated)
}

// Skill-Verwaltung (globale Skill-Liste)
export const getAvailableSkills = (): Skill[] => {
  if (typeof window === 'undefined') return []
  const stored = localStorage.getItem('availableSkills')
  if (stored) {
    const skills = JSON.parse(stored)
    return skills.map((skill: any) => ({
      ...skill,
      bonusSteps: skill.bonusSteps || 0,
      specializations: skill.specializations || [],
    }))
  }
  // Standard-Skills aus lib/skills.ts laden
  const defaultSkills = getAllSkills().map((s: any, idx: number) => ({
    id: `skill-${idx}`,
    name: s.name,
    attribute: s.attribute,
    bonusDice: 0,
    bonusSteps: 0,
    specializations: [],
    isWeakened: false,
    isCustom: false,
  }))
  saveAvailableSkills(defaultSkills)
  return defaultSkills
}

export const saveAvailableSkills = (skills: Skill[]) => {
  if (typeof window === 'undefined') return
  localStorage.setItem('availableSkills', JSON.stringify(skills))
}

export const addSkill = (skill: Omit<Skill, 'id'>): Skill => {
  const skills = getAvailableSkills()
  const newSkill: Skill = {
    ...skill,
    id: `skill-${Date.now()}`,
  }
  skills.push(newSkill)
  saveAvailableSkills(skills)
  return newSkill
}

export const removeSkill = (skillId: string): boolean => {
  const skills = getAvailableSkills()
  const filtered = skills.filter(s => s.id !== skillId)
  if (filtered.length === skills.length) return false
  saveAvailableSkills(filtered)
  return true
}

export const updateSkill = (skillId: string, updates: Partial<Skill>): boolean => {
  const skills = getAvailableSkills()
  const updated = skills.map(s => {
    if (s.id === skillId) {
      return { ...s, ...updates }
    }
    return s
  })
  if (updated === skills) return false
  saveAvailableSkills(updated)
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
  localStorage.setItem('characterCreationSettings', JSON.stringify(settings))
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
