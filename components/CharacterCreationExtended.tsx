'use client'

import { useState, useEffect } from 'react'
import { Character, Skill, Specialization } from '@/types'
import { 
  saveCharacters, 
  getCharacters, 
  getAvailableSkills,
  getCharacterCreationSettings,
} from '@/lib/data'
import { parseD6Value } from '@/lib/dice'
import { calculateSkillValue, blibsToModifier } from '@/lib/skills'
import AlignmentSelector from './AlignmentSelector'

interface CharacterCreationExtendedProps {
  playerName: string
  onComplete: (character: Character) => void
  onCancel: () => void
}

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
  Magie: '0D',
}

type CreationStep = 'basics' | 'attributes' | 'skills'

export default function CharacterCreationExtended({
  playerName,
  onComplete,
  onCancel,
}: CharacterCreationExtendedProps) {
  const [step, setStep] = useState<CreationStep>('basics')
  const [characterName, setCharacterName] = useState('')
  const [className, setClassName] = useState('Abenteurer')
  const [race, setRace] = useState('Mensch')
  const [age, setAge] = useState('')
  const [gender, setGender] = useState('')
  const [attributeBonuses, setAttributeBonuses] = useState<{ [key: string]: number }>({})
  const [selectedAlignment, setSelectedAlignment] = useState<{ row: number; col: number } | undefined>()
  const [skillBonuses, setSkillBonuses] = useState<{ [skillId: string]: number }>({})
  const [customSkills, setCustomSkills] = useState<{ [attribute: string]: string }>({})
  const [availableSkills, setAvailableSkills] = useState<Skill[]>([])
  const [characterSkills, setCharacterSkills] = useState<{ [skillId: string]: Skill }>({})
  const [expandedSpecializations, setExpandedSpecializations] = useState<{ [skillId: string]: boolean }>({})
  const [showOnlyLearned, setShowOnlyLearned] = useState(false)
  const [settings, setSettings] = useState(getCharacterCreationSettings())

  useEffect(() => {
    const skills = getAvailableSkills()
    setAvailableSkills(skills)
    
    // Initialisiere characterSkills mit allen verfügbaren Skills
    const initialSkills: { [skillId: string]: Skill } = {}
    skills.forEach(skill => {
      initialSkills[skill.id] = {
        ...skill,
        bonusDice: 0,
        specializations: [],
      }
    })
    setCharacterSkills(initialSkills)
  }, [])

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

  const usedAttributePoints = Object.values(attributeBonuses).reduce((sum, val) => sum + val, 0)
  const remainingAttributePoints = settings.maxAttributePoints - usedAttributePoints

  const usedSkillPoints = Object.values(skillBonuses).reduce((sum, val) => sum + val, 0)
  const remainingSkillPoints = settings.maxSkillPoints - usedSkillPoints

  const usedBlibs = Object.values(characterSkills).reduce((sum, skill) => 
    sum + skill.specializations.reduce((specSum, spec) => specSum + spec.blibs, 0), 0
  )
  const remainingBlibs = settings.maxBlibs - usedBlibs

  const handleAttributeBonusChange = (attrName: string, delta: number) => {
    const current = attributeBonuses[attrName] || 0
    const newValue = Math.max(0, current + delta)
    const newUsed = Object.values(attributeBonuses).reduce((sum, val) => sum + val, 0) - current + newValue
    
    if (newUsed <= settings.maxAttributePoints) {
      setAttributeBonuses({ ...attributeBonuses, [attrName]: newValue })
    }
  }

  const handleSkillBonusChange = (skillId: string, delta: number) => {
    const current = skillBonuses[skillId] || 0
    const newValue = Math.max(0, current + delta)
    const newUsed = Object.values(skillBonuses).reduce((sum, val) => sum + val, 0) - current + newValue
    
    if (newUsed <= settings.maxSkillPoints) {
      setSkillBonuses({ ...skillBonuses, [skillId]: newValue })
      
      // Aktualisiere characterSkills
      setCharacterSkills(prev => ({
        ...prev,
        [skillId]: {
          ...prev[skillId],
          bonusDice: newValue,
        }
      }))
    }
  }

  const handleAddCustomSkill = (attribute: string, skillName: string) => {
    if (!skillName.trim()) return

    const newSkill: Skill = {
      id: `custom-${Date.now()}`,
      name: skillName.trim(),
      attribute,
      bonusDice: 0,
      specializations: [],
      isCustom: true,
    }

    setAvailableSkills(prev => [...prev, newSkill])
    setCharacterSkills(prev => ({
      ...prev,
      [newSkill.id]: { ...newSkill },
    }))
    setCustomSkills(prev => ({ ...prev, [attribute]: '' }))
  }

  const handleAddSpecialization = (skillId: string, specName: string) => {
    if (!specName.trim()) return

    const skill = characterSkills[skillId]
    if (!skill) return

    const newSpec: Specialization = {
      id: Date.now().toString(),
      name: specName.trim(),
      skillName: skill.name,
      blibs: 0,
    }

    setCharacterSkills(prev => ({
      ...prev,
      [skillId]: {
        ...prev[skillId],
        specializations: [...prev[skillId].specializations, newSpec],
      }
    }))
  }

  const handleSpecializationBlibChange = (skillId: string, specId: string, delta: number) => {
    const skill = characterSkills[skillId]
    if (!skill) return

    const updatedSpecs = skill.specializations.map(spec => {
      if (spec.id === specId) {
        const current = spec.blibs || 0
        const newValue = Math.max(0, Math.min(4, current + delta))
        
        // Prüfe Gesamt-Blibs
        const currentTotal = usedBlibs
        const newTotal = currentTotal - current + newValue
        
        if (newTotal <= settings.maxBlibs) {
          return { ...spec, blibs: newValue }
        }
        return spec
      }
      return spec
    })

    setCharacterSkills(prev => ({
      ...prev,
      [skillId]: {
        ...prev[skillId],
        specializations: updatedSpecs,
      }
    }))
  }

  const toggleSpecializationExpansion = (skillId: string) => {
    setExpandedSpecializations(prev => ({
      ...prev,
      [skillId]: !prev[skillId],
    }))
  }

  const getSkillsForAttribute = (attribute: string): Skill[] => {
    return availableSkills.filter(s => s.attribute === attribute)
  }

  const isSkillLearned = (skillId: string): boolean => {
    const bonus = skillBonuses[skillId] || 0
    const skill = characterSkills[skillId]
    if (!skill) return false
    
    // Geschwächte Fertigkeiten benötigen mindestens 1 Punkt oder 1 Blib
    if (skill.isWeakened) {
      return bonus > 0 || skill.specializations.some(spec => spec.blibs > 0)
    }
    
    return bonus > 0 || skill.specializations.some(spec => spec.blibs > 0)
  }

  const handleCreate = () => {
    if (!characterName.trim()) {
      alert('Bitte gib einen Charakternamen ein')
      return
    }

    if (!selectedAlignment) {
      alert('Bitte wähle eine Gesinnung aus')
      return
    }

    const attributes: { [key: string]: string } = {}
    STANDARD_ATTRIBUTES.forEach((attr) => {
      attributes[attr] = getAttributeValue(attr)
    })

    // Finalisiere Fertigkeiten
    const finalSkills: Skill[] = Object.values(characterSkills)
      .filter(skill => {
        // Nur Skills mit Punkten oder Blibs oder wenn nicht geschwächt
        if (skill.isWeakened) {
          const bonus = skillBonuses[skill.id] || 0
          const hasBlibs = skill.specializations.some(spec => spec.blibs > 0)
          return bonus > 0 || hasBlibs
        }
        const bonus = skillBonuses[skill.id] || 0
        const hasBlibs = skill.specializations.some(spec => spec.blibs > 0)
        return bonus > 0 || hasBlibs
      })
      .map((skill) => {
        const bonusDice = skillBonuses[skill.id] || 0
        return {
          ...skill,
          bonusDice,
        }
      })

    const characters = getCharacters()
    const newCharacter: Character = {
      id: Date.now().toString(),
      name: characterName,
      playerName: playerName,
      className: className || undefined,
      race: race || undefined,
      age: age || undefined,
      gender: gender || undefined,
      level: 1, // Startet auf Stufe 1
      attributes,
      skills: finalSkills,
      inventory: [],
      alignment: selectedAlignment,
      createdDate: new Date(),
      lastPlayedDate: new Date(),
      // Grundwerte dauerhaft speichern
      baseAttributes: { ...attributes },
      baseSkills: finalSkills.map(s => ({ ...s })),
      attributePointsUsed: usedAttributePoints,
      skillPointsUsed: usedSkillPoints,
      blibsUsed: usedBlibs,
    }

    const updated = [...characters, newCharacter]
    saveCharacters(updated)
    onComplete(newCharacter)
  }

  const canProceedToAttributes = characterName.trim() !== '' && selectedAlignment !== undefined
  const canProceedToSkills = true // Kann immer weitergehen, auch mit freien Punkten
  const canFinish = characterName.trim() !== '' && selectedAlignment !== undefined // Kann auch mit freien Punkten abgeschlossen werden

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4">
      <div className="container mx-auto max-w-6xl">
        <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-bold text-white">Charakter erstellen</h1>
            <div className="flex gap-2">
              {(['basics', 'attributes', 'skills'] as CreationStep[]).map((s) => (
                <div
                  key={s}
                  className={`w-3 h-3 rounded-full ${
                    step === s ? 'bg-primary-400' : s < step ? 'bg-green-400' : 'bg-white/20'
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Schritt 1: Grundinformationen */}
          {step === 'basics' && (
            <div className="space-y-6">
              <div>
                <label className="block text-white/90 mb-2 font-medium">Charaktername: *</label>
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
                  />
                </div>
                <div>
                  <label className="block text-white/90 mb-2 font-medium">Rasse:</label>
                  <input
                    type="text"
                    value={race}
                    onChange={(e) => setRace(e.target.value)}
                    className="w-full px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-primary-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-white/90 mb-2 font-medium">Alter:</label>
                  <select
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    className="w-full px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white focus:outline-none focus:ring-2 focus:ring-primary-400"
                  >
                    <option value="" className="bg-slate-800">Bitte wählen</option>
                    <option value="zu jung" className="bg-slate-800">zu jung</option>
                    <option value="Jugendlich" className="bg-slate-800">Jugendlich</option>
                    <option value="junger Erwachsener" className="bg-slate-800">junger Erwachsener</option>
                    <option value="Mittelalter" className="bg-slate-800">Mittelalter</option>
                    <option value="älter" className="bg-slate-800">älter</option>
                    <option value="alt" className="bg-slate-800">alt</option>
                    <option value="zu alt" className="bg-slate-800">zu alt</option>
                  </select>
                </div>
                <div>
                  <label className="block text-white/90 mb-2 font-medium">Geschlecht:</label>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                    className="w-full px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white focus:outline-none focus:ring-2 focus:ring-primary-400"
                  >
                    <option value="" className="bg-slate-800">Bitte wählen</option>
                    <option value="männlich" className="bg-slate-800">männlich</option>
                    <option value="weiblich" className="bg-slate-800">weiblich</option>
                    <option value="divers" className="bg-slate-800">divers</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-white/90 mb-2 font-medium">Gesinnung: *</label>
                <AlignmentSelector
                  selectedAlignment={selectedAlignment}
                  onSelect={(row, col) => {
                    setSelectedAlignment({ row, col })
                  }}
                />
                {!selectedAlignment && (
                  <p className="text-yellow-400 text-sm mt-2">Bitte wähle eine Gesinnung aus</p>
                )}
              </div>

              <div className="flex gap-4">
                <button
                  onClick={onCancel}
                  className="px-6 bg-white/10 hover:bg-white/20 text-white font-semibold py-3 rounded-lg transition-colors"
                >
                  Abbrechen
                </button>
                <button
                  onClick={() => setStep('attributes')}
                  disabled={!canProceedToAttributes}
                  className="flex-1 bg-primary-600 hover:bg-primary-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-lg transition-colors"
                >
                  Weiter zu Attributen
                </button>
              </div>
            </div>
          )}

          {/* Schritt 2: Attribute */}
          {step === 'attributes' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-white">
                  Attribute ({settings.maxAttributePoints} D6 verteilen)
                </h2>
                <div className={`text-lg font-semibold ${remainingAttributePoints === 0 ? 'text-green-400' : 'text-yellow-400'}`}>
                  Verbleibend: {remainingAttributePoints} / {settings.maxAttributePoints}
                </div>
              </div>

              <div className="space-y-3">
                {STANDARD_ATTRIBUTES.map((attr) => {
                  const base = BASE_VALUES[attr] || '2D'
                  const bonus = attributeBonuses[attr] || 0
                  const total = getAttributeValue(attr)

                  return (
                    <div key={attr} className="bg-white/5 rounded-lg p-4 border border-white/10">
                      <div className="flex items-center gap-4">
                        <div className="flex-1">
                          <span className="text-white font-semibold w-32">{attr}</span>
                        </div>
                        <div className="w-32 text-right">
                          <span className="text-white font-mono">{total}</span>
                        </div>
                        <div className="flex items-center gap-2 w-24 justify-end">
                          <button
                            onClick={() => handleAttributeBonusChange(attr, -1)}
                            disabled={bonus === 0}
                            className="w-8 h-8 rounded bg-white/10 border border-white/20 text-white disabled:opacity-30"
                          >
                            -
                          </button>
                          <span className="text-white font-mono w-8 text-center">{bonus}</span>
                          <button
                            onClick={() => handleAttributeBonusChange(attr, 1)}
                            disabled={remainingAttributePoints <= 0}
                            className="w-8 h-8 rounded bg-white/10 border border-white/20 text-white disabled:opacity-30"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>

              <div className="flex gap-4">
                <button
                  onClick={() => setStep('basics')}
                  className="px-6 bg-white/10 hover:bg-white/20 text-white font-semibold py-3 rounded-lg transition-colors"
                >
                  Zurück
                </button>
                <button
                  onClick={() => setStep('skills')}
                  disabled={!canProceedToSkills}
                  className="flex-1 bg-primary-600 hover:bg-primary-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-lg transition-colors"
                >
                  Weiter zu Fertigkeiten
                </button>
              </div>
            </div>
          )}

          {/* Schritt 3: Fertigkeiten */}
          {step === 'skills' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-3">
                    <h2 className="text-2xl font-bold text-white">
                      Fertigkeiten / Spezialisierungen
                    </h2>
                    <span className="text-white/70">▼</span>
                  </div>
                  <div className="text-sm text-white/70 space-y-0 text-right">
                    <div>Attributspunkte: {remainingAttributePoints} / {settings.maxAttributePoints}</div>
                    <div>Fertigkeitspunkte: {remainingSkillPoints} / {settings.maxSkillPoints}</div>
                    <div>Blibs: {remainingBlibs} / {settings.maxBlibs}</div>
                  </div>
                </div>
                <label className="flex items-center gap-2 text-white/70 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showOnlyLearned}
                    onChange={(e) => setShowOnlyLearned(e.target.checked)}
                    className="rounded"
                  />
                  <span>Nur gelernte/verstärkte anzeigen</span>
                </label>
              </div>

              <div className="space-y-6">
                {STANDARD_ATTRIBUTES.map((attr) => {
                  const attributeValue = getAttributeValue(attr)
                  const attrSkills = getSkillsForAttribute(attr)
                  const filteredSkills = showOnlyLearned
                    ? attrSkills.filter(skill => isSkillLearned(skill.id))
                    : attrSkills

                  if (filteredSkills.length === 0 && !showOnlyLearned) return null

                  return (
                    <div key={attr} className="bg-white/5 rounded-lg p-4 border border-white/10">
                      <div className="flex items-center gap-4 mb-3">
                        <h3 className="text-white font-semibold">
                          {attr}
                        </h3>
                        <div className="w-32 text-right">
                          <span className="text-white font-mono">{attributeValue}</span>
                        </div>
                      </div>

                      <div className="space-y-2 mb-3">
                        {filteredSkills.map((skill) => {
                          const characterSkill = characterSkills[skill.id] || skill
                          const bonus = skillBonuses[skill.id] || 0
                          const learned = isSkillLearned(skill.id)
                          const skillValue = calculateSkillValue(
                            attributeValue,
                            bonus,
                            characterSkill.specializations.reduce((sum, spec) => sum + spec.blibs, 0),
                            skill.isWeakened,
                            learned
                          )
                          const isExpanded = expandedSpecializations[skill.id]

                          return (
                            <div key={skill.id} className="bg-white/5 rounded p-3 border border-white/10">
                              <div className="flex items-center gap-4">
                                <div className="flex-1 flex items-center gap-3">
                                  <span className="text-white">{skill.name}</span>
                                  {skill.isWeakened && (
                                    <span className="text-xs bg-yellow-600 text-white px-2 py-1 rounded">
                                      Geschwächt
                                    </span>
                                  )}
                                  {skill.isCustom && (
                                    <span className="text-xs bg-blue-600 text-white px-2 py-1 rounded">
                                      Eigen
                                    </span>
                                  )}
                                </div>
                                {/* Spezialisierungen-Knopf */}
                                <button
                                  onClick={() => toggleSpecializationExpansion(skill.id)}
                                  className="px-1 py-1 bg-white/10 hover:bg-white/20 text-white rounded text-xs"
                                >
                                  {isExpanded ? '▼' : '▶'}
                                </button>
                                <div className="flex items-center gap-2 w-24 justify-end">
                                  {/* Fertigkeitspunkte */}
                                  <button
                                    onClick={() => handleSkillBonusChange(skill.id, -1)}
                                    disabled={bonus === 0}
                                    className="w-8 h-8 rounded bg-white/10 border border-white/20 text-white disabled:opacity-30"
                                  >
                                    -
                                  </button>
                                  <span className="text-white font-mono w-8 text-center">{bonus}</span>
                                  <button
                                    onClick={() => handleSkillBonusChange(skill.id, 1)}
                                    disabled={remainingSkillPoints <= 0}
                                    className="w-8 h-8 rounded bg-white/10 border border-white/20 text-white disabled:opacity-30"
                                  >
                                    +
                                  </button>
                                </div>
                                <div className="w-32 text-right">
                                  <span className={`font-mono ${bonus > 0 || characterSkill.specializations.length > 0 ? 'text-green-400' : 'text-white/50'}`}>
                                    {skillValue}
                                  </span>
                                </div>
                              </div>

                              {/* Spezialisierungen (ausklappbar) */}
                              {isExpanded && (
                                <div className="mt-3 pt-3 border-t border-white/10 space-y-2">
                                  {/* Neue Spezialisierung hinzufügen */}
                                  <div className="flex gap-2">
                                    <input
                                      type="text"
                                      placeholder="Spezialisierung hinzufügen..."
                                      onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                          const input = e.target as HTMLInputElement
                                          handleAddSpecialization(skill.id, input.value)
                                          input.value = ''
                                        }
                                      }}
                                      className="flex-1 px-3 py-1 rounded bg-white/10 border border-white/20 text-white placeholder-white/50 text-sm"
                                    />
                                  </div>

                                  {/* Vorhandene Spezialisierungen */}
                                  {characterSkill.specializations.map((spec) => {
                                    const totalBlibs = spec.blibs
                                    const specValue = calculateSkillValue(attributeValue, bonus, totalBlibs, skill.isWeakened, learned)

                                    return (
                                      <div key={spec.id} className="flex items-center gap-4 bg-white/5 rounded p-2">
                                        <div className="flex-1 pl-6">
                                          <span className="text-white">{spec.name}</span>
                                        </div>
                                        <div className="flex items-center gap-2 w-24 justify-end">
                                          <button
                                            onClick={() => handleSpecializationBlibChange(skill.id, spec.id, -1)}
                                            disabled={spec.blibs === 0}
                                            className="w-8 h-8 rounded bg-white/10 border border-white/20 text-white disabled:opacity-30"
                                          >
                                            -
                                          </button>
                                          <span className="text-white font-mono w-8 text-center">{spec.blibs}</span>
                                          <button
                                            onClick={() => handleSpecializationBlibChange(skill.id, spec.id, 1)}
                                            disabled={remainingBlibs <= 0 || spec.blibs >= 4}
                                            className="w-8 h-8 rounded bg-white/10 border border-white/20 text-white disabled:opacity-30"
                                          >
                                            +
                                          </button>
                                        </div>
                                        <div className="w-32 text-right">
                                          <span className={`font-mono ${totalBlibs > 0 ? 'text-green-400' : 'text-white/50'}`}>
                                            {specValue}
                                          </span>
                                        </div>
                                      </div>
                                    )
                                  })}
                                </div>
                              )}
                            </div>
                          )
                        })}
                      </div>
                      
                      {/* Freie Zeile für eigene Fertigkeitsvorschläge - nach unten verschoben */}
                      <div className="mt-3 pt-3 border-t border-white/10 flex gap-2">
                        <input
                          type="text"
                          placeholder="Eigene Fertigkeit hinzufügen..."
                          value={customSkills[attr] || ''}
                          onChange={(e) => setCustomSkills(prev => ({ ...prev, [attr]: e.target.value }))}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && customSkills[attr]) {
                              handleAddCustomSkill(attr, customSkills[attr])
                            }
                          }}
                          className="flex-1 px-3 py-2 rounded bg-white/10 border border-white/20 text-white placeholder-white/50 text-sm"
                        />
                        <button
                          onClick={() => {
                            if (customSkills[attr]) {
                              handleAddCustomSkill(attr, customSkills[attr])
                            }
                          }}
                          className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded text-sm"
                        >
                          Hinzufügen
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>

              <div className="flex gap-4">
                <button
                  onClick={handleCreate}
                  disabled={!characterName.trim() || !selectedAlignment || !canFinish}
                  className="flex-1 bg-primary-600 hover:bg-primary-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-lg transition-colors"
                >
                  Charakter erstellen
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
