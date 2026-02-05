import { parseD6Value } from '@/lib/dice'
import type { Skill } from '@/types'

export type PromptOption = {
  id: string
  label: string
  source?: string
}

export const PROMPT_BACKGROUNDS = [
  'Stadt',
  'Dungeon',
  'Gasthof',
  'Wald',
  'Gebirge',
  'Mystischer Schrein',
]

const toBlips = (value: string) => {
  const { diceCount, modifier } = parseD6Value(value || '0D')
  return diceCount * 3 + modifier
}

const addOption = (items: PromptOption[], id: string, label?: string, source?: string) => {
  if (!label || !label.trim()) return
  items.push({ id, label: label.trim(), source })
}

const ATTRIBUTE_STRENGTHS: Record<string, string> = {
  Reflexe: 'blitzschnelle Reflexe',
  Koordination: 'geschmeidige Bewegungen',
  Stärke: 'kraftvolle Statur',
  Wissen: 'gelehrtes Auftreten',
  Wahrnehmung: 'wachsamer Blick',
  Ausstrahlung: 'charismatische Ausstrahlung',
  Magie: 'magisch begabt',
}

const ATTRIBUTE_WEAKNESSES: Record<string, string> = {
  Reflexe: 'träge Reaktionen',
  Koordination: 'etwas ungelenk',
  Stärke: 'schmächtige Statur',
  Wissen: 'unerfahrener Blick',
  Wahrnehmung: 'leicht ablenkbar',
  Ausstrahlung: 'schüchternes Auftreten',
  Magie: 'magisch unerfahren',
}

const inferWeaponFromSkill = (skillName: string) => {
  const lower = skillName.toLowerCase()
  if (lower.includes('schwert')) return 'trägt ein verziertes Langschwert'
  if (lower.includes('dolch')) return 'führt einen Dolch'
  if (lower.includes('axt')) return 'führt eine Axt'
  if (lower.includes('bogen')) return 'führt einen Bogen'
  if (lower.includes('armbrust')) return 'führt eine Armbrust'
  if (lower.includes('stab')) return 'trägt einen Stab'
  if (lower.includes('schild')) return 'trägt einen Schild'
  if (lower.includes('fernkampf')) return 'führt eine Fernkampfwaffe'
  if (lower.includes('nahkampf') || lower.includes('waffe')) return 'führt eine Nahkampfwaffe'
  return ''
}

const inferArmorFromClass = (className?: string) => {
  const lower = (className || '').toLowerCase()
  if (lower.includes('dieb')) return 'dunkle Lederrüstung'
  if (lower.includes('magier')) return 'schlichte Robe'
  if (lower.includes('krieger')) return 'solide Plattenrüstung'
  if (lower.includes('jäger')) return 'leichte Lederüstung'
  if (lower.includes('kleriker')) return 'geweihte Rüstung'
  return ''
}

const getTopAndWeakestAttributes = (attributes: Record<string, string>) => {
  const scored = Object.entries(attributes || {}).map(([name, value]) => ({
    name,
    score: toBlips(value),
  }))
  if (scored.length === 0) return { top: [], weakest: null as string | null }
  const sorted = [...scored].sort((a, b) => b.score - a.score)
  return {
    top: sorted.slice(0, 2).map(entry => entry.name),
    weakest: sorted[sorted.length - 1].name,
  }
}

const getTopCombatSkill = (skills: Skill[]) => {
  const combat = skills
    .map(skill => ({
      name: skill.name,
      score: (skill.bonusDice || 0) * 3 + (skill.bonusSteps || 0),
    }))
    .sort((a, b) => b.score - a.score)
  return combat.length > 0 ? combat[0].name : ''
}

export const buildCharacterPromptOptions = (params: {
  gender?: string
  race?: string
  className?: string
  age?: string
  attributes: Record<string, string>
  skills: Skill[]
  traits?: string[]
  visibleEquipment?: string
}) => {
  const options: PromptOption[] = []
  addOption(options, 'gender', params.gender ? `Geschlecht: ${params.gender}` : undefined, 'basis')
  addOption(options, 'race', params.race ? `Rasse: ${params.race}` : undefined, 'basis')
  addOption(options, 'class', params.className ? `Klasse: ${params.className}` : undefined, 'basis')
  addOption(options, 'age', params.age ? `Alter: ${params.age}` : undefined, 'basis')

  const { top, weakest } = getTopAndWeakestAttributes(params.attributes)
  top.forEach((attr) => addOption(options, `attr-${attr}`, ATTRIBUTE_STRENGTHS[attr], 'attribute'))
  if (weakest) {
    addOption(options, `attr-weak-${weakest}`, ATTRIBUTE_WEAKNESSES[weakest], 'attribute')
  }

  const armor = inferArmorFromClass(params.className)
  addOption(options, 'class-armor', armor, 'class')

  const topCombat = getTopCombatSkill(params.skills)
  if (topCombat) {
    addOption(options, 'combat-skill', `Geübt in ${topCombat}`, 'combat')
    addOption(options, 'combat-weapon', inferWeaponFromSkill(topCombat), 'combat')
  }

  if (params.visibleEquipment) {
    addOption(options, 'equipment', `Sichtbare Ausrüstung: ${params.visibleEquipment}`, 'equipment')
  }

  ;(params.traits || []).forEach((trait, index) => {
    addOption(options, `trait-${index}`, trait, 'traits')
  })

  return options
}

export const buildNpcPromptOptions = (params: {
  name?: string
  race?: string
  className?: string
  gender?: string
  profession?: string
  bestSkills?: string[]
  affiliation?: string
  location?: string
}) => {
  const options: PromptOption[] = []
  addOption(options, 'npc-race', params.race ? `Rasse: ${params.race}` : undefined, 'basis')
  addOption(options, 'npc-class', params.className ? `Klasse: ${params.className}` : undefined, 'basis')
  addOption(options, 'npc-gender', params.gender ? `Geschlecht: ${params.gender}` : undefined, 'basis')
  addOption(options, 'npc-profession', params.profession ? `Beruf: ${params.profession}` : undefined, 'profession')
  addOption(options, 'npc-affiliation', params.affiliation ? `Zugehörigkeit: ${params.affiliation}` : undefined, 'context')
  addOption(options, 'npc-location', params.location ? `Ort: ${params.location}` : undefined, 'context')

  ;(params.bestSkills || []).forEach((skill, index) => {
    addOption(options, `npc-skill-${index}`, `Begabt in ${skill}`, 'skills')
  })

  return options
}

export const buildMonsterPromptOptions = (params: {
  name?: string
  type?: string
  race?: string
  description?: string
  abilities?: string[]
  tags?: string[]
}) => {
  const options: PromptOption[] = []
  addOption(options, 'monster-name', params.name ? `Name: ${params.name}` : undefined, 'basis')
  addOption(options, 'monster-type', params.type ? `Typ: ${params.type}` : undefined, 'basis')
  addOption(options, 'monster-race', params.race ? `Spezies: ${params.race}` : undefined, 'basis')
  addOption(options, 'monster-desc', params.description ? `Beschreibung: ${params.description}` : undefined, 'desc')
  ;(params.abilities || []).forEach((ability, index) => {
    addOption(options, `monster-ability-${index}`, `Fähigkeit: ${ability}`, 'abilities')
  })
  ;(params.tags || []).forEach((tag, index) => {
    addOption(options, `monster-tag-${index}`, `Lebensraum/Tag: ${tag}`, 'tags')
  })
  return options
}

export const buildJournalPromptOptions = (params: {
  title?: string
  text?: string
  tags?: string[]
}) => {
  const options: PromptOption[] = []
  addOption(options, 'journal-title', params.title ? `Ereignis: ${params.title}` : undefined, 'title')
  if (params.text) {
    const snippet = params.text.trim().split(/\s+/).slice(0, 24).join(' ')
    addOption(options, 'journal-text', snippet ? `Szene: ${snippet}` : undefined, 'text')
  }
  ;(params.tags || []).forEach((tag, index) => {
    addOption(options, `journal-tag-${index}`, `Thema: ${tag}`, 'tags')
  })
  return options
}

export const buildPromptText = (params: {
  type: 'portrait' | 'monster' | 'event'
  items: string[]
  background?: string
}) => {
  const base =
    params.type === 'portrait'
      ? 'Erzeuge ein detailiertes Portrait einer Person (halbkörper).'
      : params.type === 'monster'
        ? 'Erzeuge eine detailierte Monster-Illustration.'
        : 'Erzeuge eine detailierte, atmosphärische Szene.'
  const details = params.items.length > 0 ? `Merkmale: ${params.items.join(', ')}.` : ''
  const background = params.background ? `Hintergrund: ${params.background}.` : ''
  return [base, details, background].filter(Boolean).join(' ')
}
