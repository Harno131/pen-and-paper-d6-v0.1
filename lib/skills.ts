import { Skill } from '@/types'
import { formatD6Value } from '@/lib/dice'

// Fertigkeiten basierend auf Georg-Blatt (Zeilen 32-135)
// Basiswert = Attributwert, kann mit bis zu 8 D6 erhöht werden
export const SKILLS_BY_ATTRIBUTE: { [attribute: string]: string[] } = {
  Reflexe: [
    'unbewaffneter Kampf',
    'bewaffneter Nahkampf',
    'Akrobatik',
    'Klettern',
    'Springen',
    'Reiten',
    'Schleichen',
  ],
  Koordination: [
    'Fernkampf',
    'Steuern',
    'Fingerfertigkeit',
    'Schlösser öffnen',
  ],
  Stärke: [
    'Ausdauer',
    'Heben',
    'Rennen',
    'Schwimmen',
  ],
  Wissen: [
    'Schulwissen',
    'Handwerk',
    'Navigation',
    'Geschäftssinn',
    'Heilkunde',
  ],
  Wahrnehmung: [
    'Überleben',
    'schöne Künste',
    'Spielen',
  ],
  Ausstrahlung: [
    'Betören',
    'Bedrohen',
    'Betrügen',
    'Verkleiden',
    'Kommandieren',
    'mentaler Widerstand',
  ],
  Magie: [
    'magisches Wissen',
    'magische Kraft',
    'magische Konzentration',
    'magische Ausdauer',
  ],
}

export function getAllSkills(): { attribute: string; name: string }[] {
  const allSkills: { attribute: string; name: string }[] = []
  
  for (const [attribute, skills] of Object.entries(SKILLS_BY_ATTRIBUTE)) {
    for (const skillName of skills) {
      allSkills.push({ attribute, name: skillName })
    }
  }
  
  return allSkills
}

export function getSkillsByAttribute(attribute: string): string[] {
  return SKILLS_BY_ATTRIBUTE[attribute] || []
}

/**
 * Konvertiert Blibs zu D6-Wert
 * 1 Blib = +1
 * 2 Blibs = +2
 * 3 Blibs = +1D (nächster D6)
 * 4 Blibs = +1D+1
 */
export function blibsToModifier(blibs: number): { diceBonus: number; modifier: number } {
  if (blibs === 0) {
    return { diceBonus: 0, modifier: 0 }
  }
  if (blibs === 1) {
    return { diceBonus: 0, modifier: 1 }
  }
  if (blibs === 2) {
    return { diceBonus: 0, modifier: 2 }
  }
  if (blibs === 3) {
    return { diceBonus: 1, modifier: 0 }
  }
  if (blibs === 4) {
    return { diceBonus: 1, modifier: 1 }
  }
  return { diceBonus: 0, modifier: 0 }
}

/**
 * Berechnet den finalen D6-Wert einer Fertigkeit
 * Basis = Attributwert
 * + Bonus-D6 (aus 8 D6 Verteilung)
 * + Blibs aus Spezialisierungen
 * Geschwächte Fertigkeiten: 3D weniger als Attribut (min. 0D), springt auf normalen Wert wenn gelernt
 */
export function calculateSkillValue(
  attributeValue: string,
  bonusDice: number,
  blibs: number,
  isWeakened?: boolean,
  isLearned?: boolean
): string {
  // Parse Attributwert
  const attrMatch = attributeValue.match(/^(\d+)D(\+(\d+))?$/)
  if (!attrMatch) return attributeValue
  
  let baseDice = parseInt(attrMatch[1])
  const baseModifier = parseInt(attrMatch[3] || '0')
  
  // Geschwächte Fertigkeiten: 3D weniger als Attribut (min. 0D)
  // Wenn gelernt (bonusDice > 0 oder blibs > 0), springt auf normalen Wert
  if (isWeakened && !isLearned) {
    baseDice = Math.max(0, baseDice - 3)
  }
  
  const baseBlips = baseDice * 3 + baseModifier
  const totalBlips = Math.max(0, baseBlips + bonusDice * 3 + blibs)
  return formatD6Value(totalBlips)
}

export function getBaseSkillBlibs(skill: Pick<Skill, 'specializations'>): number {
  const specs = skill.specializations || []
  return specs.reduce((max, spec) => Math.max(max, spec.blibs || 0), 0)
}