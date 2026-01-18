export type UserRole = 'spielleiter' | 'spieler'

// D6-System: Attribute werden als String gespeichert (z.B. "1D", "1D+1", "2D", "2D+1")
export type D6Value = string // Format: "1D", "1D+1", "2D", "2D+2", etc.

export interface Alignment {
  name: string
  nameEnglish?: string // Optional: Englische Bezeichnung
  description: string
  row: number
  col: number
}

export interface Specialization {
  id: string
  name: string
  skillName: string
  blibs: number // 0-4 Blibs, 3 Blibs = +1D
}

export interface Skill {
  id: string
  name: string
  attribute: string
  bonusDice: number // Anzahl zusätzlicher D6 (0-8 insgesamt)
  specializations: Specialization[] // Spezialisierungen (z.B. "Schwert" für bewaffneter Nahkampf)
  isWeakened?: boolean // Geschwächte Fertigkeit (kann ohne Fertigkeitspunkt/Blip nicht ausgeführt werden)
  isCustom?: boolean // Eigene Fertigkeit des Spielers
  description?: string // Hover-Over-Text / Beschreibung der Fertigkeit
}

export interface Character {
  id: string
  name: string
  playerName: string
  className?: string // Klasse des Charakters
  race?: string // Rasse des Charakters
  age?: string // Alter des Charakters
  gender?: string // Geschlecht des Charakters
  level?: number // Aktuelle Stufe (Standard: 1)
  attributes: {
    [key: string]: D6Value // z.B. "Stärke": "2D", "Geschicklichkeit": "1D+1"
  }
  skills: Skill[]
  inventory: Item[]
  alignment?: { row: number; col: number } // Ausgewählte Gesinnung
  notes?: string
  profileImageUrl?: string
  imageUrl?: string
  tags?: string[]
  createdDate?: Date // Erstellt am
  lastPlayedDate?: Date // Zuletzt gespielt am
  deletedDate?: Date // Gelöscht am (soft delete)
  // Grundwerte bei Erstellung (dauerhaft gespeichert)
  baseAttributes?: { [key: string]: D6Value }
  baseSkills?: Skill[]
  attributePointsUsed?: number // Verwendete Attributspunkte bei Erstellung
  skillPointsUsed?: number // Verwendete Fertigkeitspunkte bei Erstellung
  blibsUsed?: number // Verwendete Blibs bei Erstellung
  earnedBlips?: number // Verdiente Blips durch Belohnungen
  // Verwundungen
  currentHP?: number // Aktuelle Trefferpunkte
  maxHP?: number // Maximale Trefferpunkte
  wounds?: string[] // Liste der Verwundungen
  // NPCs
  isNPC?: boolean // Nicht-Spieler-Charakter (Händler, Stadtwache, Monster, etc.)
  npcType?: 'händler' | 'stadtwache' | 'monster' | 'sonstiges' // Typ des NPCs
  // Erweiterte NPC-Felder
  npcProfession?: string // Beruf
  npcAffiliation?: string // Zugehörigkeit
  npcLocation?: string // Ort
  npcAddress?: string // Adresse
  npcBestSkills?: string[] // Beste Fähigkeiten (abhängig von Beruf und Rasse)
  // Geheim-Attribute (dürfen nicht ins Tagebuch)
  npcSecretAlignment?: { row: number; col: number } // Gesinnung (geheim)
  npcSecretAgenda?: string // Agenda (geheim)
  npcSecretQuestGiver?: boolean // Questgeber (geheim)
  npcSecretHiddenHero?: boolean // Versteckter Held (geheim)
  npcSecretNemesis?: string // Erzfeind (geheim)
  npcSecretPerpetrator?: boolean // Täter (geheim)
  npcSecretVictim?: boolean // Opfer (geheim)
}

export interface DeletedCharacter extends Character {
  deletedDate: Date // Muss vorhanden sein für gelöschte Charaktere
}

export interface Item {
  id: string
  name: string
  description?: string
  quantity?: number
  category?: 'weapon' | 'armor' | 'equipment' | 'other' // Kategorie für Filterung
}

export interface DiceRoll {
  id: string
  characterId: string
  attribute: string
  diceFormula: string // z.B. "2D", "1D+1"
  diceResults: number[] // Die einzelnen Würfelergebnisse
  redDieResult?: number // Ergebnis des roten Würfels (erster Würfel)
  explodingRolls?: number[] // Zusätzliche Würfe durch Exploding Dice
  modifier: number // Der Modifikator (+1, +2, etc.)
  result: number // Gesamtergebnis
  timestamp: Date
  success?: boolean
  targetValue?: number
  isCriticalFailure?: boolean // true wenn roter Würfel 1 zeigt
}

export type TimeOfDay = 'Frühgischt' | 'Aufgang' | 'Früh' | 'Mittag' | 'Spät' | 'Untergang' | 'Gischt' | 'Nacht'

export interface JournalEntry {
  id: string
  author: string
  characterId?: string
  title: string
  content: string
  tags?: string[]
  illustrationUrl?: string
  imageUrl?: string
  timestamp: Date
  fantasyDate?: {
    year: number
    month: number
    day: number
    weekday: number
  }
  timeOfDay?: TimeOfDay
}

export interface Bestiary {
  id: string
  name: string
  type: string
  level?: number
  race?: string
  description?: string
  abilities?: string[]
  tags?: string[]
  attributes: { [key: string]: D6Value }
  maxHp: number
  fallcrestTwist: string
  imageUrl?: string
  createdAt?: Date
  updatedAt?: Date
}

export interface FantasyCalendarSettings {
  startDate?: {
    year: number
    month: number
    day: number
  }
}

export interface SharedImage {
  id: string
  url: string
  title?: string
  description?: string
  sentBy: string
  sentTo?: string[] // leer = alle Spieler
  timestamp: Date
}

export interface User {
  id: string
  name: string
  role: UserRole
  characterId?: string
}

// Globale Einstellungen für Charaktererstellung
export interface CharacterCreationSettings {
  maxAttributePoints: number // Standard: 7
  maxSkillPoints: number // Standard: 8
  maxBlibs: number // Standard: 4
  maxAttributeDicePerAttribute: number // Standard: 2
  maxSkillDicePerSkill: number // Standard: 2
  maxBlibsPerSpecialization: number // Standard: 2
  defaultStartBlips: number // Standard: 67
  fantasyCalendar?: FantasyCalendarSettings
}

export interface FantasyCalendarSettings {
  startDate?: {
    year: number
    month: number
    day: number
  }
  realStartDate?: string // ISO-Datum-String
}
