import { CharacterInjury, InjurySlot } from '@/types'

const normalizeSkillKey = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/ä/g, 'ae')
    .replace(/ö/g, 'oe')
    .replace(/ü/g, 'ue')
    .replace(/ß/g, 'ss')

const SLOT_SKILL_KEYWORDS: Record<InjurySlot, string[]> = {
  head: [
    'wissen',
    'wahrnehmung',
    'schulwissen',
    'handwerk',
    'navigation',
    'geschaft',
    'heilkunde',
    'uberleben',
    'schone kunste',
    'spielen',
  ],
  neck: ['betoren', 'bedrohen', 'kommandieren', 'verkleiden'],
  ears: ['wahrnehmung', 'uberleben', 'schone kunste', 'spielen'],
  torso: ['ausdauer', 'heben', 'schwimmen'],
  legs: ['rennen', 'springen', 'klettern', 'reiten', 'schleichen', 'akrobatik', 'laufen'],
  feet: ['rennen', 'springen', 'klettern', 'schleichen', 'laufen'],
  back: ['heben', 'ausdauer', 'schwimmen'],
  finger_l: ['fingerfertigkeit', 'schlosser', 'schloss'],
  finger_r: ['fingerfertigkeit', 'schlosser', 'schloss'],
  wrists: ['fingerfertigkeit', 'schlosser', 'schloss', 'handwerk'],
  ankles: ['rennen', 'schleichen', 'laufen'],
  main_hand: ['bewaffneter nahkampf', 'unbewaffneter kampf', 'fernkampf', 'handwerk'],
  off_hand: ['bewaffneter nahkampf', 'unbewaffneter kampf', 'fernkampf', 'handwerk'],
  belt: ['ausdauer', 'uberleben'],
  psyche: ['willenskraft', 'konzentration', 'mentaler widerstand', 'magische konzentration'],
}

const matchesSkill = (skillName: string, keywords: string[]) => {
  const normalized = normalizeSkillKey(skillName)
  return keywords.some((keyword) => normalized.includes(keyword))
}

export const getSkillPenaltyBlips = (injuries: CharacterInjury[], skillName: string): number => {
  let total = 0
  injuries.forEach((injury) => {
    const keywords = SLOT_SKILL_KEYWORDS[injury.slot as InjurySlot] || []
    if (keywords.length === 0) return
    if (!matchesSkill(skillName, keywords)) return
    const severity = Number(injury.currentSeverity || 0)
    if (severity !== 1 && severity !== 3) {
      console.warn('Unexpected injury severity value, using raw number.', {
        injuryId: injury.id,
        severity,
      })
    }
    total += Math.max(0, severity)
  })
  return total
}

export const getCharacterSkillPenaltyBlips = (
  injuries: CharacterInjury[],
  characterId: string,
  skillName: string
): number => {
  return getSkillPenaltyBlips(
    injuries.filter((injury) => injury.characterId === characterId),
    skillName
  )
}
