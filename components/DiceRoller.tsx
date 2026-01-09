'use client'

import { useState } from 'react'
import { DiceRoll } from '@/types'
import { saveDiceRoll } from '@/lib/data'
import { rollD6, formatD6Value, getD6Range } from '@/lib/dice'

interface DiceRollerProps {
  characterId: string
  attribute: string
  diceFormula: string // z.B. "1D", "1D+1", "2D"
  onRollComplete?: (roll: DiceRoll) => void
}

export default function DiceRoller({
  characterId,
  attribute,
  diceFormula,
  onRollComplete,
}: DiceRollerProps) {
  const [isRolling, setIsRolling] = useState(false)
  const [lastRoll, setLastRoll] = useState<DiceRoll | null>(null)
  const [targetValue, setTargetValue] = useState<number | ''>('')
  const range = getD6Range(diceFormula)

  const handleRoll = () => {
    setIsRolling(true)
    
    // Simuliere Würfelwurf mit Animation
    setTimeout(() => {
      const rollResult = rollD6(diceFormula)
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
        characterId,
        attribute,
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
      onRollComplete?.(roll)
    }, 500)
  }

  return (
    <div className="bg-white/5 rounded-lg p-4 border border-white/10">
      <div className="flex items-center justify-between mb-3">
        <div>
          <div className="text-sm text-white/70">{attribute}</div>
          <div className="text-lg font-semibold text-white">
            {formatD6Value(diceFormula)}
          </div>
          <div className="text-xs text-white/60">
            ({range.min} - {range.max})
          </div>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="number"
            placeholder="Zielwert"
            value={targetValue}
            onChange={(e) => setTargetValue(e.target.value === '' ? '' : Number(e.target.value))}
            className="w-20 px-2 py-1 rounded bg-white/10 border border-white/20 text-white text-sm"
          />
          <button
            onClick={handleRoll}
            disabled={isRolling}
            className="bg-primary-600 hover:bg-primary-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg font-semibold transition-colors"
          >
            {isRolling ? '...' : '🎲 Würfeln'}
          </button>
        </div>
      </div>

      {lastRoll && (
        <div className={`mt-3 p-3 rounded-lg ${
          lastRoll.isCriticalFailure
            ? 'bg-red-600/30 border-2 border-red-500'
            : lastRoll.success === true
            ? 'bg-green-500/20 border border-green-500/50'
            : lastRoll.success === false
            ? 'bg-red-500/20 border border-red-500/50'
            : 'bg-white/10 border border-white/20'
        }`}>
          {lastRoll.isCriticalFailure && (
            <div className="text-red-300 font-bold text-lg mb-2">
              ⚠️ KRITISCHER FEHLSCHLAG! (Roter Würfel = 1)
            </div>
          )}
          <div className="text-white font-mono text-lg mb-1">
            {lastRoll.diceResults.length > 1 ? (
              <>
                [
                <span className={lastRoll.redDieResult === 1 ? 'text-red-400 font-bold' : lastRoll.redDieResult === 6 ? 'text-yellow-400 font-bold' : 'text-white'}>
                  {lastRoll.diceResults[0]}
                </span>
                {lastRoll.diceResults.slice(1).map((val, idx) => (
                  <span key={idx} className="text-white"> + {val}</span>
                ))}
                ]
                {lastRoll.explodingRolls && lastRoll.explodingRolls.length > 0 && (
                  <span className="text-yellow-400">
                    {' + ['}
                    {lastRoll.explodingRolls.map((val, idx) => (
                      <span key={idx}>
                        {val}
                        {idx < lastRoll.explodingRolls!.length - 1 && ' + '}
                      </span>
                    ))}
                    {'] (Exploding)'}
                  </span>
                )}
                {lastRoll.modifier > 0 && ` + ${lastRoll.modifier}`}
              </>
            ) : (
              <>
                <span className={lastRoll.redDieResult === 1 ? 'text-red-400 font-bold' : lastRoll.redDieResult === 6 ? 'text-yellow-400 font-bold' : 'text-white'}>
                  {lastRoll.diceResults[0]}
                </span>
                {lastRoll.explodingRolls && lastRoll.explodingRolls.length > 0 && (
                  <span className="text-yellow-400">
                    {' + ['}
                    {lastRoll.explodingRolls.map((val, idx) => (
                      <span key={idx}>
                        {val}
                        {idx < lastRoll.explodingRolls!.length - 1 && ' + '}
                      </span>
                    ))}
                    {'] (Exploding)'}
                  </span>
                )}
                {lastRoll.modifier > 0 && ` + ${lastRoll.modifier}`}
              </>
            )}
            {' = '}
            <span className="font-bold text-2xl">{lastRoll.result}</span>
          </div>
          {lastRoll.targetValue !== undefined && (
            <div className="text-sm text-white/80">
              {lastRoll.success ? '✅ Erfolg!' : '❌ Fehlschlag'}
              {' '}(Ziel: {lastRoll.targetValue})
            </div>
          )}
          {lastRoll.redDieResult === 6 && lastRoll.explodingRolls && lastRoll.explodingRolls.length > 0 && (
            <div className="text-xs text-yellow-300 mt-1">
              🎲 Exploding Dice aktiviert!
            </div>
          )}
        </div>
      )}
    </div>
  )
}

