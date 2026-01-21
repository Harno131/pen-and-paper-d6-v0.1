'use client'

import { useState } from 'react'
import { Character, Skill, Specialization, DiceRoll } from '@/types'
import { saveDiceRoll } from '@/lib/data'
import { rollD6, formatD6Value } from '@/lib/dice'
import { calculateSkillValue } from '@/lib/skills'

interface SkillDiceRollerProps {
  character: Character
  skill: Skill
  specialization?: Specialization
  onClose: () => void
}

export default function SkillDiceRoller({
  character,
  skill,
  specialization,
  onClose,
}: SkillDiceRollerProps) {
  const [isRolling, setIsRolling] = useState(false)
  const [lastRoll, setLastRoll] = useState<DiceRoll | null>(null)
  const [targetValue, setTargetValue] = useState<number | ''>('')
  const [showResult, setShowResult] = useState(false)

  const getDisplaySkillName = (name: string) => {
    const trimmed = name.trim()
    const match = trimmed.match(/^\s*(\d+)[\).\s-]+(.+)$/)
    if (!match) return trimmed
    return match[2].trim()
  }

  // Berechne den finalen D6-Wert der Fertigkeit
  const attributeValue = character.attributes[skill.attribute] || '1D'
  const isLearned = skill.bonusDice > 0 || (specialization && specialization.blibs > 0)
  const skillBlibs = specialization
    ? (skill.bonusSteps || 0) + specialization.blibs
    : (skill.bonusSteps || 0)
  const skillDiceFormula = calculateSkillValue(
    attributeValue,
    skill.bonusDice,
    skillBlibs,
    skill.isWeakened,
    isLearned
  )

  const handleRoll = () => {
    if (showResult) {
      // Zweiter Klick: Dialog schließen
      onClose()
      return
    }

    setIsRolling(true)
    setShowResult(true)
    
    // Simuliere Würfelwurf mit Animation
    setTimeout(() => {
      const rollResult = rollD6(skillDiceFormula)
      const target = targetValue !== '' ? Number(targetValue) : undefined
      
      // Bei Critical Failure (roter Würfel = 1) ist es immer ein Fehlschlag
      let success: boolean | undefined = undefined
      if (rollResult.isCriticalFailure) {
        success = false
      } else if (target !== undefined) {
        success = rollResult.total >= target
      }

      const roll: DiceRoll = {
        id: Date.now().toString(),
        characterId: character.id,
        attribute: skill.attribute,
        diceFormula: rollResult.formula,
        diceResults: rollResult.diceResults,
        redDieResult: rollResult.redDieResult,
        explodingRolls: rollResult.explodingRolls.length > 0 ? rollResult.explodingRolls : undefined,
        modifier: rollResult.modifier,
        result: rollResult.total,
        timestamp: new Date(),
        targetValue: target,
        success,
        isCriticalFailure: rollResult.isCriticalFailure,
      }

      saveDiceRoll(roll)
      setLastRoll(roll)
      setIsRolling(false)
    }, 500)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 rounded-2xl border-2 border-white/20 shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-4xl font-bold text-white">Würfelwurf</h2>
            <button
              onClick={onClose}
              className="text-white/70 hover:text-white text-3xl font-bold"
            >
              ×
            </button>
          </div>

          {/* Fertigkeits-Info */}
          <div className="bg-white/10 rounded-xl p-6 mb-6 border border-white/20">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <div className="text-white/70 text-lg mb-1">Attribut</div>
                <div className="text-3xl font-bold text-white">{skill.attribute}</div>
                <div className="text-white/60 text-xl mt-1">
                  {formatD6Value(attributeValue)}
                </div>
              </div>
              <div>
                <div className="text-white/70 text-lg mb-1">Fertigkeit</div>
                <div className="text-3xl font-bold text-white">{getDisplaySkillName(skill.name)}</div>
                {specialization && (
                  <div className="text-white/60 text-xl mt-1">
                    Spezialisierung: {specialization.name}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Würfel-Formel */}
          <div className="bg-white/10 rounded-xl p-6 mb-6 border border-white/20 text-center">
            <div className="text-white/70 text-xl mb-2">Würfel-Formel</div>
            <div className="text-5xl font-bold text-white font-mono">
              {formatD6Value(skillDiceFormula)}
            </div>
            {skill.isWeakened && !isLearned && (
              <div className="text-yellow-400 text-sm mt-2">
                ⚠️ Geschwächte Fertigkeit (3D weniger)
              </div>
            )}
          </div>

          {/* Zielwert-Eingabe */}
          {!showResult && (
            <div className="bg-white/10 rounded-xl p-6 mb-6 border border-white/20">
              <label className="block text-white/70 text-lg mb-3">
                Zielwert (optional)
              </label>
              <input
                type="number"
                value={targetValue}
                onChange={(e) => setTargetValue(e.target.value === '' ? '' : Number(e.target.value))}
                placeholder="Zielwert eingeben"
                className="w-full px-6 py-4 rounded-lg bg-white/10 border border-white/20 text-white text-2xl text-center focus:outline-none focus:ring-2 focus:ring-primary-400"
              />
            </div>
          )}

          {/* Würfel-Button */}
          {!showResult && (
            <button
              onClick={handleRoll}
              disabled={isRolling}
              className="w-full bg-primary-600 hover:bg-primary-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-8 py-6 rounded-xl font-bold text-3xl transition-colors shadow-lg"
            >
              {isRolling ? 'Würfeln...' : '🎲 Würfeln'}
            </button>
          )}

          {/* Ergebnis */}
          {showResult && lastRoll && (
            <div className="space-y-6">
              <div className={`rounded-xl p-8 border-4 ${
                lastRoll.isCriticalFailure
                  ? 'bg-red-600/30 border-red-500'
                  : lastRoll.success === true
                  ? 'bg-green-500/30 border-green-500'
                  : lastRoll.success === false
                  ? 'bg-red-500/30 border-red-500'
                  : 'bg-white/10 border-white/20'
              }`}>
                {lastRoll.isCriticalFailure && (
                  <div className="text-red-300 font-bold text-4xl mb-4 text-center">
                    ⚠️ KRITISCHER FEHLSCHLAG!
                  </div>
                )}
                
                {/* Würfelergebnisse - EXTRA GROSS */}
                <div className="text-center mb-6">
                  <div className="text-white/70 text-2xl mb-4">Würfelergebnisse</div>
                  <div className="flex flex-wrap justify-center gap-4 mb-4">
                    {lastRoll.diceResults.map((val, idx) => (
                      <div
                        key={idx}
                        className={`text-6xl font-bold font-mono px-6 py-4 rounded-xl ${
                          idx === 0 && lastRoll.redDieResult === 1
                            ? 'bg-red-600/50 text-red-100 border-4 border-red-400'
                            : idx === 0 && lastRoll.redDieResult === 6
                            ? 'bg-yellow-600/50 text-yellow-100 border-4 border-yellow-400'
                            : 'bg-white/20 text-white border-2 border-white/30'
                        }`}
                      >
                        {val}
                      </div>
                    ))}
                    {lastRoll.explodingRolls && lastRoll.explodingRolls.map((val, idx) => (
                      <div
                        key={`exp-${idx}`}
                        className="text-6xl font-bold font-mono px-6 py-4 rounded-xl bg-yellow-600/50 text-yellow-100 border-4 border-yellow-400"
                      >
                        {val}
                        <div className="text-xs text-yellow-200 mt-1">Exploding</div>
                      </div>
                    ))}
                  </div>
                  
                  {/* Gesamtergebnis */}
                  <div className="text-white/70 text-3xl mb-2">Gesamtergebnis</div>
                  <div className="text-8xl font-bold text-white font-mono">
                    {lastRoll.result}
                  </div>
                  
                  {lastRoll.modifier > 0 && (
                    <div className="text-white/60 text-xl mt-2">
                      (+{lastRoll.modifier} Modifikator)
                    </div>
                  )}
                </div>

                {lastRoll.targetValue !== undefined && (
                  <div className="text-center text-3xl mt-6">
                    {lastRoll.success ? (
                      <span className="text-green-400 font-bold">✅ Erfolg!</span>
                    ) : (
                      <span className="text-red-400 font-bold">❌ Fehlschlag</span>
                    )}
                    <div className="text-white/70 text-xl mt-2">
                      (Ziel: {lastRoll.targetValue})
                    </div>
                  </div>
                )}

                {lastRoll.redDieResult === 6 && lastRoll.explodingRolls && lastRoll.explodingRolls.length > 0 && (
                  <div className="text-center text-yellow-300 text-2xl mt-4">
                    🎲 Exploding Dice aktiviert!
                  </div>
                )}
              </div>

              {/* Schließen-Button */}
              <button
                onClick={handleRoll}
                className="w-full bg-primary-600 hover:bg-primary-700 text-white px-8 py-6 rounded-xl font-bold text-3xl transition-colors shadow-lg"
              >
                Schließen
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}











