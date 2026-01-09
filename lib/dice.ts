/**
 * D6-System Würfelfunktionen
 * Unterstützt Formate wie: "1D", "1D+1", "2D", "2D+2", etc.
 */

export interface DiceRollResult {
  diceResults: number[]
  redDieResult: number // Ergebnis des roten Würfels (erster Würfel)
  explodingRolls: number[] // Zusätzliche Würfe durch Exploding Dice
  modifier: number
  total: number
  formula: string
  isCriticalFailure: boolean // true wenn roter Würfel 1 zeigt
}

/**
 * Parst einen D6-Wert (z.B. "1D", "1D+1", "2D", "2D+2")
 * und gibt die Anzahl der Würfel und den Modifikator zurück
 */
export function parseD6Value(value: string): { diceCount: number; modifier: number } {
  const trimmed = value.trim().toUpperCase()
  
  // Format: "1D", "2D", etc.
  const simpleMatch = trimmed.match(/^(\d+)D$/)
  if (simpleMatch) {
    return {
      diceCount: parseInt(simpleMatch[1]),
      modifier: 0,
    }
  }
  
  // Format: "1D+1", "2D+2", etc.
  const withModifierMatch = trimmed.match(/^(\d+)D\+(\d+)$/)
  if (withModifierMatch) {
    return {
      diceCount: parseInt(withModifierMatch[1]),
      modifier: parseInt(withModifierMatch[2]),
    }
  }
  
  // Fallback: Wenn Format nicht erkannt wird, versuche es als "1D" zu behandeln
  return { diceCount: 1, modifier: 0 }
}

/**
 * Würfelt einen einzelnen D6
 */
function rollSingleD6(): number {
  return Math.floor(Math.random() * 6) + 1
}

/**
 * Würfelt mit dem D6-System mit Exploding Dice
 * Der erste Würfel ist rot:
 * - Bei 1: Immer Misserfolg (Critical Failure)
 * - Bei 6: Exploding Dice - nochmal würfeln und aufaddieren
 * @param value D6-Wert (z.B. "1D", "1D+1", "2D")
 * @returns Würfelergebnis mit Details
 */
export function rollD6(value: string): DiceRollResult {
  const { diceCount, modifier } = parseD6Value(value)
  
  // Würfle die Würfel
  const diceResults: number[] = []
  const explodingRolls: number[] = []
  
  // Erster Würfel ist immer der rote Würfel
  let redDieResult = rollSingleD6()
  diceResults.push(redDieResult)
  
  // Prüfe auf Exploding Dice beim roten Würfel
  // Wenn der rote Würfel 6 zeigt, weiter würfeln und aufaddieren
  // Jede weitere 6 wird genauso behandelt
  let currentRoll = redDieResult
  while (currentRoll === 6) {
    const explodingRoll = rollSingleD6()
    explodingRolls.push(explodingRoll)
    currentRoll = explodingRoll // Wenn 6, wird die Schleife fortgesetzt
  }
  
  // Würfle die restlichen Würfel (nicht rot)
  for (let i = 1; i < diceCount; i++) {
    diceResults.push(rollSingleD6())
  }
  
  // Berechne Gesamtergebnis
  // Alle Würfel + Exploding Rolls + Modifier
  const allRolls = [...diceResults, ...explodingRolls]
  const diceSum = allRolls.reduce((sum, val) => sum + val, 0)
  const total = diceSum + modifier
  
  // Prüfe auf Critical Failure (roter Würfel = 1)
  const isCriticalFailure = redDieResult === 1
  
  // Erstelle Formel-String für Anzeige
  let formula = `${diceCount}D`
  if (modifier > 0) {
    formula += `+${modifier}`
  }
  
  return {
    diceResults,
    redDieResult,
    explodingRolls,
    modifier,
    total,
    formula,
    isCriticalFailure,
  }
}

/**
 * Gibt den möglichen Wertebereich für einen D6-Wert zurück
 * Hinweis: Durch Exploding Dice kann der Maximalwert theoretisch unbegrenzt sein
 * @param value D6-Wert (z.B. "1D", "1D+1", "2D")
 * @returns {min, max} Minimaler und maximaler Wert (ohne Exploding Dice)
 */
export function getD6Range(value: string): { min: number; max: number } {
  const { diceCount, modifier } = parseD6Value(value)
  return {
    min: diceCount + modifier, // Mindestens 1 pro Würfel
    max: diceCount * 6 + modifier, // Maximal 6 pro Würfel (ohne Exploding)
  }
}

/**
 * Formatiert einen D6-Wert für die Anzeige
 */
export function formatD6Value(value: string): string {
  const { diceCount, modifier } = parseD6Value(value)
  if (modifier === 0) {
    return `${diceCount}D`
  }
  return `${diceCount}D+${modifier}`
}

