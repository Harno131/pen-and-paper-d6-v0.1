'use client'

import { useState } from 'react'
import { Character } from '@/types'
import { saveCharacters, getCharacters } from '@/lib/data'
import { parseD6Value } from '@/lib/dice'
import AlignmentSelector from './AlignmentSelector'

interface CharacterCreationProps {
  playerName: string
  onComplete: (character: Character) => void
  onCancel: () => void
}

// Standard-Attribute basierend auf Georg-Blatt
const STANDARD_ATTRIBUTES = [
  'Reflexe',
  'Koordination',
  'Stärke',
  'Wissen',
  'Wahrnehmung',
  'Ausstrahlung',
  'Magie',
]

const BASE_VALUES: { [key: string]: string } = {
  Reflexe: '2D',
  Koordination: '2D',
  Stärke: '2D',
  Wissen: '2D',
  Wahrnehmung: '2D',
  Ausstrahlung: '2D',
  Magie: '0D', // Magie startet mit 0D
}

export default function CharacterCreation({
  playerName,
  onComplete,
  onCancel,
}: CharacterCreationProps) {
  const [characterName, setCharacterName] = useState('')
  const [className, setClassName] = useState('')
  const [race, setRace] = useState('')
  const [attributeBonuses, setAttributeBonuses] = useState<{ [key: string]: number }>({})
  const [selectedAlignment, setSelectedAlignment] = useState<{ row: number; col: number } | undefined>()
  const [remainingDice, setRemainingDice] = useState(7)

  const getAttributeValue = (attrName: string): string => {
    const base = BASE_VALUES[attrName] || '2D'
    const bonus = attributeBonuses[attrName] || 0
    
    if (bonus === 0) {
      return base
    }
    
    const { diceCount, modifier } = parseD6Value(base)
    const newDiceCount = diceCount + bonus
    return `${newDiceCount}D${modifier > 0 ? `+${modifier}` : ''}`
  }

  const handleBonusChange = (attrName: string, delta: number) => {
    const current = attributeBonuses[attrName] || 0
    const newValue = Math.max(0, current + delta)
    const usedDice = Object.values(attributeBonuses).reduce((sum, val) => sum + val, 0) - current + newValue
    
    if (usedDice <= 7) {
      setAttributeBonuses({ ...attributeBonuses, [attrName]: newValue })
      setRemainingDice(7 - usedDice)
    }
  }

  const handleCreate = () => {
    if (!characterName.trim()) {
      alert('Bitte gib einen Charakternamen ein')
      return
    }

    if (remainingDice > 0) {
      const useAll = confirm(
        `Du hast noch ${remainingDice} D6 übrig. Möchtest du sie trotzdem erstellen?`
      )
      if (!useAll) return
    }

    const attributes: { [key: string]: string } = {}
    STANDARD_ATTRIBUTES.forEach((attr) => {
      attributes[attr] = getAttributeValue(attr)
    })

    const characters = getCharacters()
    const newCharacter: Character = {
      id: Date.now().toString(),
      name: characterName,
      playerName: playerName,
      attributes,
      skills: [],
      inventory: [],
      alignment: selectedAlignment,
      createdDate: new Date(),
      lastPlayedDate: new Date(),
    }

    const updated = [...characters, newCharacter]
    saveCharacters(updated)
    onComplete(newCharacter)
  }

  const usedDice = Object.values(attributeBonuses).reduce((sum, val) => sum + val, 0)

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4">
      <div className="container mx-auto max-w-4xl">
        <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
          <h1 className="text-3xl font-bold text-white mb-6">Charakter erstellen</h1>

          {/* Grundinformationen */}
          <div className="space-y-4 mb-6">
            <div>
              <label className="block text-white/90 mb-2 font-medium">Charaktername:</label>
              <input
                type="text"
                value={characterName}
                onChange={(e) => setCharacterName(e.target.value)}
                className="w-full px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-primary-400"
                placeholder="Name deines Charakters"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-white/90 mb-2 font-medium">Klasse:</label>
                <input
                  type="text"
                  value={className}
                  onChange={(e) => setClassName(e.target.value)}
                  className="w-full px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-primary-400"
                  placeholder="z.B. Krieger, Magier..."
                />
              </div>
              <div>
                <label className="block text-white/90 mb-2 font-medium">Rasse:</label>
                <input
                  type="text"
                  value={race}
                  onChange={(e) => setRace(e.target.value)}
                  className="w-full px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-primary-400"
                  placeholder="z.B. Mensch, Zwerg..."
                />
              </div>
            </div>
          </div>

          {/* Gesinnung */}
          <div className="mb-6">
            <AlignmentSelector
              selectedAlignment={selectedAlignment}
              onSelect={(row, col) => setSelectedAlignment({ row, col })}
            />
          </div>

          {/* Attribute-Verteilung */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-white">Attribute</h2>
              <div className={`text-lg font-semibold ${remainingDice === 0 ? 'text-green-400' : remainingDice < 0 ? 'text-red-400' : 'text-yellow-400'}`}>
                Verbleibende D6: {remainingDice} / 7
              </div>
            </div>

            <div className="space-y-3">
              {STANDARD_ATTRIBUTES.map((attr) => {
                const base = BASE_VALUES[attr] || '2D'
                const bonus = attributeBonuses[attr] || 0
                const total = getAttributeValue(attr)
                const isMagic = attr === 'Magie'

                return (
                  <div
                    key={attr}
                    className="bg-white/5 rounded-lg p-4 border border-white/10"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <span className="text-white font-semibold w-32">{attr}</span>
                          <span className="text-white/70 text-sm">
                            Basis: {base}
                            {bonus > 0 && (
                              <span className="text-green-400 ml-2">
                                +{bonus}D = {total}
                              </span>
                            )}
                          </span>
                        </div>
                        {isMagic && (
                          <div className="text-xs text-yellow-400 mt-1">
                            Magie startet mit 0D
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleBonusChange(attr, -1)}
                          disabled={bonus === 0}
                          className="w-8 h-8 rounded bg-white/10 border border-white/20 text-white disabled:opacity-30 disabled:cursor-not-allowed hover:bg-white/20"
                        >
                          -
                        </button>
                        <span className="text-white font-mono w-8 text-center">{bonus}</span>
                        <button
                          onClick={() => handleBonusChange(attr, 1)}
                          disabled={remainingDice <= 0}
                          className="w-8 h-8 rounded bg-white/10 border border-white/20 text-white disabled:opacity-30 disabled:cursor-not-allowed hover:bg-white/20"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Buttons */}
          <div className="flex gap-4">
            <button
              onClick={handleCreate}
              disabled={!characterName.trim() || remainingDice < 0}
              className="flex-1 bg-primary-600 hover:bg-primary-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-lg transition-colors"
            >
              Charakter erstellen
            </button>
            <button
              onClick={onCancel}
              className="px-6 bg-white/10 hover:bg-white/20 text-white font-semibold py-3 rounded-lg transition-colors"
            >
              Abbrechen
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

