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
  existingCharacter?: Character | null
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

const RACES = ['Mensch', 'Elf', 'Halb-Elf', 'Zwerg', 'Halbling', 'Gnom', 'Halbork', 'Drakonier', 'Andere']
const CLASSES = ['Krieger', 'Magier', 'Dieb', 'Kleriker', 'Barde', 'Jäger', 'Händler', 'Handwerker', 'Gelehrter', 'Adliger', 'Bauer', 'Soldat', 'Andere']

type CreationStep = 'basics' | 'skills' | 'attributes'

export default function CharacterCreationExtended({
  playerName,
  onComplete,
  onCancel,
  existingCharacter,
}: CharacterCreationExtendedProps) {
  const [step, setStep] = useState<CreationStep>('basics')
  const [characterName, setCharacterName] = useState('')
  const [className, setClassName] = useState('Abenteurer')
  const [otherClass, setOtherClass] = useState('')
  const [race, setRace] = useState('Mensch')
  const [otherRace, setOtherRace] = useState('')
  const [age, setAge] = useState('')
  const [gender, setGender] = useState('')
  const [attributeBonuses, setAttributeBonuses] = useState<{ [key: string]: number }>({})
  const [selectedAlignment, setSelectedAlignment] = useState<{ row: number; col: number } | undefined>()
  const [skillBonuses, setSkillBonuses] = useState<{ [skillId: string]: number }>({})
  const [customSkills, setCustomSkills] = useState<{ [attribute: string]: string }>({})
  const [availableSkills, setAvailableSkills] = useState<Skill[]>([])
  const [characterSkills, setCharacterSkills] = useState<{ [skillId: string]: Skill }>({})
  const [showOnlyLearned, setShowOnlyLearned] = useState(false)
  const [newSpecialization, setNewSpecialization] = useState({ name: '', skillId: '' })
  const [settings, setSettings] = useState(getCharacterCreationSettings())
  const [charTraits, setCharTraits] = useState('')
  const [profileImageUrl, setProfileImageUrl] = useState<string | null>(null)
  const [profileImageSaved, setProfileImageSaved] = useState(false)
  const [visibleEquipment, setVisibleEquipment] = useState('')
  const [profileImageLoading, setProfileImageLoading] = useState(false)
  const [portraitFallcrestFilter, setPortraitFallcrestFilter] = useState(false)

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
    if (existingCharacter) {
      existingCharacter.skills.forEach((skill) => {
        initialSkills[skill.id] = {
          ...skill,
          bonusDice: skill.bonusDice || 0,
          specializations: skill.specializations || [],
        }
      })
      const bonuses: { [skillId: string]: number } = {}
      existingCharacter.skills.forEach((skill) => {
        bonuses[skill.id] = skill.bonusDice || 0
      })
      setSkillBonuses(bonuses)
    }
    setCharacterSkills(initialSkills)
  }, [])

  useEffect(() => {
    if (!existingCharacter) return
    setCharacterName(existingCharacter.name || '')
    setClassName(existingCharacter.className || 'Abenteurer')
    setRace(existingCharacter.race || 'Mensch')
    setAge(existingCharacter.age || '')
    setGender(existingCharacter.gender || '')
    setSelectedAlignment(existingCharacter.alignment)
    if (existingCharacter.profileImageUrl) {
      setProfileImageUrl(existingCharacter.profileImageUrl)
      setProfileImageSaved(true)
    }

    const bonuses: { [key: string]: number } = {}
    STANDARD_ATTRIBUTES.forEach((attr) => {
      const base = BASE_VALUES[attr] || '2D'
      const baseDice = parseD6Value(base).diceCount
      const current = existingCharacter.attributes?.[attr] || base
      const currentDice = parseD6Value(current).diceCount
      bonuses[attr] = Math.max(0, currentDice - baseDice)
    })
    setAttributeBonuses(bonuses)
  }, [existingCharacter])

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

  const getAttributeSteps = (attrName: string): number => {
    const base = BASE_VALUES[attrName] || '2D'
    const current = getAttributeValue(attrName)
    return Math.max(0, getStepsFromD6(current) - getStepsFromD6(base))
  }

  const getSkillSteps = (skillId: string): number => (skillBonuses[skillId] || 0) * 3

  const calculateTotalBlips = (): number => {
    let total = 0
    STANDARD_ATTRIBUTES.forEach((attr) => {
      total += calculateStepCost(getAttributeSteps(attr))
    })
    Object.values(characterSkills).forEach((skill) => {
      total += calculateStepCost(getSkillSteps(skill.id))
      skill.specializations.forEach((spec) => {
        total += calculateStepCost(spec.blibs || 0)
      })
    })
    return total
  }

  const getAdditionalStepCost = (currentSteps: number, stepsToAdd: number): number => {
    return calculateStepCost(currentSteps + stepsToAdd) - calculateStepCost(currentSteps)
  }

  const totalBlipBudget = settings.defaultStartBlips
  const totalBlipsUsed = calculateTotalBlips()
  const remainingBlips = totalBlipBudget - totalBlipsUsed
  const usedAttributePoints = Object.values(attributeBonuses).reduce((sum, val) => sum + val, 0)
  const usedSkillPoints = Object.values(skillBonuses).reduce((sum, val) => sum + val, 0)

  const traitList = charTraits
    .split(/\n|,|;/)
    .map(t => t.trim())
    .filter(Boolean)
  const traitCount = traitList.length
  const wordCount = charTraits.trim() ? charTraits.trim().split(/\s+/).length : 0
  const canGenerateProfileImage = (traitCount >= 5 || wordCount >= 50) && traitCount <= 5 && !profileImageUrl

  const getAttributeScore = (value: string): number => {
    const { diceCount, modifier } = parseD6Value(value)
    return diceCount * 10 + modifier
  }

  const formatSpecBonus = (blibs: number): string => {
    const bonus = blibsToModifier(blibs)
    if (bonus.diceBonus === 0 && bonus.modifier === 0) return '+0'
    let result = ''
    if (bonus.diceBonus > 0) {
      result += `${bonus.diceBonus}D`
    }
    if (bonus.modifier > 0) {
      result += `${bonus.diceBonus > 0 ? '+' : ''}${bonus.modifier}`
    }
    return `+${result}`
  }

  const getTopAttributes = () => {
    return STANDARD_ATTRIBUTES
      .map((attr) => {
        const value = getAttributeValue(attr)
        return { name: attr, value, score: getAttributeScore(value) }
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, 2)
  }

  const generatePlaceholderProfileImage = async () => {
    const topAttributes = getTopAttributes()
      .map((attr) => `${attr.name} ${attr.value}`)
      .join(', ')
    const equipmentText = visibleEquipment.trim()
    const resolvedRace = race === 'Andere' ? otherRace.trim() : race
    const resolvedClass = className === 'Andere' ? otherClass.trim() : className

    setProfileImageLoading(true)
    try {
      const response = await fetch('/api/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'portrait',
          data: {
            race: resolvedRace,
            className: resolvedClass,
            age,
            traits: traitList,
            equipment: equipmentText,
            topAttributes,
          },
          fallcrestFilter: portraitFallcrestFilter,
        }),
      })
      const json = await response.json()
      if (json?.imageUrl) {
        setProfileImageUrl(json.imageUrl)
        setProfileImageSaved(false)
      } else {
        alert('Bild konnte nicht generiert werden.')
      }
    } catch (error) {
      alert('Bildgenerierung fehlgeschlagen.')
    } finally {
      setProfileImageLoading(false)
    }
  }

  const handleAttributeBonusChange = (attrName: string, delta: number) => {
    const current = attributeBonuses[attrName] || 0
    const newValue = Math.max(0, current + delta)
    if (delta > 0) {
      const costIncrease = getAdditionalStepCost(getAttributeSteps(attrName), 3)
      if (remainingBlips < costIncrease) return
    }
    if (newValue <= settings.maxAttributeDicePerAttribute) {
      setAttributeBonuses({ ...attributeBonuses, [attrName]: newValue })
    }
  }

  const handleSkillBonusChange = (skillId: string, delta: number) => {
    const current = skillBonuses[skillId] || 0
    const newValue = Math.max(0, current + delta)
    if (delta > 0) {
      const costIncrease = getAdditionalStepCost(getSkillSteps(skillId), 3)
      if (remainingBlips < costIncrease) return
    }
    if (newValue <= settings.maxSkillDicePerSkill) {
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
        const maxPerSpec = Math.max(0, settings.maxBlibsPerSpecialization || 0)
        const newValue = Math.max(0, Math.min(maxPerSpec, current + delta))
        
        if (delta > 0) {
          const costIncrease = getAdditionalStepCost(current, 1)
          if (remainingBlips < costIncrease) return spec
        }
        return { ...spec, blibs: newValue }
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

  const handleAddSpecializationGlobal = () => {
    if (!newSpecialization.name.trim() || !newSpecialization.skillId) return

    const skill = characterSkills[newSpecialization.skillId]
    if (!skill) return

    const newSpec: Specialization = {
      id: Date.now().toString(),
      name: newSpecialization.name.trim(),
      skillName: skill.name,
      blibs: 0,
    }

    setCharacterSkills(prev => ({
      ...prev,
      [newSpecialization.skillId]: {
        ...prev[newSpecialization.skillId],
        specializations: [...prev[newSpecialization.skillId].specializations, newSpec],
      }
    }))

    setNewSpecialization({ name: '', skillId: '' })
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
    const baseCharacter = existingCharacter || {
      id: Date.now().toString(),
      playerName,
      inventory: [],
      createdDate: new Date(),
      lastPlayedDate: new Date(),
      level: 1,
    }

    const newCharacter: Character = {
      ...baseCharacter,
      name: characterName,
      playerName: baseCharacter.playerName || playerName,
      className: (className === 'Andere' ? otherClass.trim() : className) || undefined,
      race: (race === 'Andere' ? otherRace.trim() : race) || undefined,
      age: age || undefined,
      gender: gender || undefined,
      attributes,
      skills: finalSkills,
      alignment: selectedAlignment,
      lastPlayedDate: new Date(),
      baseAttributes: existingCharacter?.baseAttributes || { ...attributes },
      baseSkills: existingCharacter?.baseSkills || finalSkills.map(s => ({ ...s })),
      attributePointsUsed: usedAttributePoints,
      skillPointsUsed: usedSkillPoints,
      blibsUsed: totalBlipsUsed,
      earnedBlips: existingCharacter?.earnedBlips || 0,
      profileImageUrl: profileImageSaved ? profileImageUrl || undefined : existingCharacter?.profileImageUrl,
      imageUrl: profileImageSaved ? profileImageUrl || undefined : existingCharacter?.imageUrl,
    }

    const updated = existingCharacter
      ? characters.map((char) => (char.id === newCharacter.id ? newCharacter : char))
      : [...characters, newCharacter]
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
            <h1 className="text-3xl font-bold text-white">
              {existingCharacter ? 'Charakter steigern' : 'Charakter erstellen'}
            </h1>
            <div className="flex gap-2">
              {(['basics', 'skills'] as CreationStep[]).map((s) => (
                <div
                  key={s}
                  className={`w-3 h-3 rounded-full ${
                    step === s ? 'bg-primary-400' : s < step ? 'bg-green-400' : 'bg-white/20'
                  }`}
                />
              ))}
            </div>
          </div>
          <div className="flex items-center justify-between text-sm text-white/70 mb-6">
            <div className="flex items-center gap-2">
              <span
                className="cursor-help"
                title="1D = 3 Schritte (+1, +2, +1D). Kosten steigen alle 3 Schritte an."
              >
                ℹ️
              </span>
              <span>Blips: {remainingBlips} / {totalBlipBudget}</span>
            </div>
            <span className={remainingBlips >= 0 ? 'text-green-400' : 'text-red-400'}>
              {remainingBlips >= 0 ? 'Budget ok' : 'Budget überschritten'}
            </span>
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
                  <select
                    value={className}
                    onChange={(e) => {
                      setClassName(e.target.value)
                      if (e.target.value !== 'Andere') {
                        setOtherClass('')
                      }
                    }}
                    className="w-full px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white focus:outline-none focus:ring-2 focus:ring-primary-400"
                  >
                    {CLASSES.map((c) => (
                      <option key={c} value={c} className="bg-slate-800">
                        {c}
                      </option>
                    ))}
                  </select>
                  {className === 'Andere' && (
                    <input
                      type="text"
                      value={otherClass}
                      onChange={(e) => setOtherClass(e.target.value)}
                      placeholder="Eigene Klasse eingeben..."
                      className="mt-2 w-full px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-primary-400"
                    />
                  )}
                </div>
                <div>
                  <label className="block text-white/90 mb-2 font-medium">Rasse:</label>
                  <select
                    value={race}
                    onChange={(e) => {
                      setRace(e.target.value)
                      if (e.target.value !== 'Andere') {
                        setOtherRace('')
                      }
                    }}
                    className="w-full px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white focus:outline-none focus:ring-2 focus:ring-primary-400"
                  >
                    {RACES.map((r) => (
                      <option key={r} value={r} className="bg-slate-800">
                        {r}
                      </option>
                    ))}
                  </select>
                  {race === 'Andere' && (
                    <input
                      type="text"
                      value={otherRace}
                      onChange={(e) => setOtherRace(e.target.value)}
                      placeholder="Eigene Rasse eingeben..."
                      className="mt-2 w-full px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-primary-400"
                    />
                  )}
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
                <label className="block text-white/90 mb-2 font-medium">Zusätzliche Merkmale (bis zu 5):</label>
                <textarea
                  value={charTraits}
                  onChange={(e) => setCharTraits(e.target.value)}
                  rows={4}
                  className="w-full px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-primary-400"
                  placeholder="z.B. narbiges Gesicht&#10;trägt einen blauen Schal&#10;hat leuchtende Augen"
                />
                <div className="flex items-center justify-between mt-2 text-xs">
                  <span className="text-white/70">
                    Merkmale: {traitCount}/5 · Wörter: {wordCount}/50
                  </span>
                  {traitCount > 5 && (
                    <span className="text-yellow-400">Bitte maximal 5 Merkmale verwenden.</span>
                  )}
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
                  Zurück
                </button>
                <button
                  onClick={() => setStep('skills')}
                  disabled={!canProceedToAttributes}
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
              <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-2xl font-bold text-white">
                    Attribute (Blip-System, max {settings.maxAttributeDicePerAttribute} pro Attribut)
                  </h2>
                  <div className={`text-lg font-semibold ${remainingBlips >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    Verfügbare Blips: {remainingBlips} / {totalBlipBudget}
                  </div>
                </div>
                <div className="grid grid-cols-[1fr_6rem_6rem_6rem] gap-4 text-xs text-white/60 mb-2 font-mono tabular-nums">
                  <span>Attribut</span>
                  <span>Wert</span>
                  <span>Blips</span>
                  <span>ΔD</span>
                </div>
                <div className="space-y-2">
                  {STANDARD_ATTRIBUTES.map((attr) => {
                    const bonus = attributeBonuses[attr] || 0
                    const total = getAttributeValue(attr)
                    const cost = calculateStepCost(getAttributeSteps(attr))
                    return (
                      <div key={attr} className="grid grid-cols-[1fr_6rem_6rem_6rem] items-center gap-4 bg-white/5 rounded p-2">
                        <span className="text-white">{attr}</span>
                        <span className="text-white font-mono tabular-nums">{total}</span>
                        <span className="text-white font-mono tabular-nums">{cost}</span>
                        <div className="flex items-center gap-2">
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
                            disabled={
                              remainingBlips < getAdditionalStepCost(getAttributeSteps(attr), 3) ||
                              bonus >= settings.maxAttributeDicePerAttribute
                            }
                            className="w-8 h-8 rounded bg-white/10 border border-white/20 text-white disabled:opacity-30"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-3">
                    <h2 className="text-2xl font-bold text-white">
                      Fertigkeiten / Spezialisierungen
                    </h2>
                    <span className="text-white/70">▼</span>
                  </div>
                  <div className="text-sm text-white/70 space-y-0 text-right">
                    <div>Verfügbare Blips: {remainingBlips} / {totalBlipBudget}</div>
                    <div>Max. Würfel pro Skill: {settings.maxSkillDicePerSkill}</div>
                    <div>Max. Blips je Spezialisierung: {settings.maxBlibsPerSpecialization}</div>
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
                        <div className="w-32 text-left">
                          <span className="text-white font-mono tabular-nums">{attributeValue}</span>
                        </div>
                      </div>

                      <div className="space-y-2 mb-3">
                        {filteredSkills.map((skill) => {
                          const characterSkill = characterSkills[skill.id] || skill
                          const bonus = skillBonuses[skill.id] || 0
                          const learned = isSkillLearned(skill.id)
                          const skillBlibs = characterSkill.specializations.reduce(
                            (max, spec) => Math.max(max, spec.blibs || 0),
                            0
                          )
                          const skillValue = calculateSkillValue(
                            attributeValue,
                            bonus,
                            skillBlibs,
                            skill.isWeakened,
                            learned
                          )
                          return (
                            <div key={skill.id} className="bg-white/5 rounded p-3 border border-white/10">
                              <div className="grid grid-cols-[1fr_6rem_6rem] items-center gap-4">
                                <div className="flex items-center gap-3">
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
                                <div className="flex items-center gap-2 justify-start">
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
                                    disabled={
                                      remainingBlips < getAdditionalStepCost(getSkillSteps(skill.id), 3) ||
                                      bonus >= settings.maxSkillDicePerSkill
                                    }
                                    className="w-8 h-8 rounded bg-white/10 border border-white/20 text-white disabled:opacity-30"
                                  >
                                    +
                                  </button>
                                </div>
                                <div className="text-left">
                                  <span className={`font-mono tabular-nums ${bonus > 0 || characterSkill.specializations.length > 0 ? 'text-green-400' : 'text-white/50'}`}>
                                    {skillValue}
                                  </span>
                                </div>
                              </div>
                              <div className="mt-2 text-xs text-white/60 font-mono tabular-nums">
                                {(() => {
                                  const specBlibs = characterSkill.specializations.reduce(
                                    (max, spec) => Math.max(max, spec.blibs || 0),
                                    0
                                  )
                                  const specLabel = formatSpecBonus(specBlibs)
                                  const skillLabel = bonus > 0 ? `+${bonus}D` : '+0'
                                  return `${attributeValue} + ${skillLabel} + ${specLabel} = ${skillValue}`
                                })()}
                              </div>

                              {/* Spezialisierungen (immer sichtbar, eingerückt) */}
                              {characterSkill.specializations.length > 0 && (
                                <div className="mt-3 pt-3 border-t border-white/10 space-y-2 pl-6">
                                  {/* Vorhandene Spezialisierungen */}
                                  {characterSkill.specializations.map((spec) => {
                                    const totalBlibs = spec.blibs
                                    const specValue = calculateSkillValue(attributeValue, bonus, totalBlibs, skill.isWeakened, learned)

                                    return (
                                      <div key={spec.id} className="grid grid-cols-[1fr_6rem_6rem] items-center gap-4 bg-white/5 rounded p-2">
                                        <div className="pl-6">
                                          <span className="text-white">{spec.name}</span>
                                        </div>
                                        <div className="flex items-center gap-2 justify-start">
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
                                            disabled={
                                              remainingBlips < getAdditionalStepCost(spec.blibs || 0, 1) ||
                                              spec.blibs >= settings.maxBlibsPerSpecialization
                                            }
                                            className="w-8 h-8 rounded bg-white/10 border border-white/20 text-white disabled:opacity-30"
                                          >
                                            +
                                          </button>
                                        </div>
                                        <div className="text-left">
                                          <span className={`font-mono tabular-nums ${totalBlibs > 0 ? 'text-green-400' : 'text-white/50'}`}>
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
                      
                      {/* Spezialisierung hinzufügen - ÜBER "Eigene Fertigkeit hinzufügen" */}
                      <div className="mt-3 pt-3 border-t border-white/10 space-y-2">
                        <div className="text-white/90 text-sm font-medium mb-2">Eine Spezialisierung hinzufügen:</div>
                        <div className="flex gap-2">
                          {(() => {
                            const isSelectedAttr = attrSkills.some(s => s.id === newSpecialization.skillId)
                            return (
                              <>
                          <input
                            type="text"
                            placeholder="Name der Spezialisierung..."
                            value={isSelectedAttr ? newSpecialization.name : ''}
                            onChange={(e) => {
                              if (isSelectedAttr) {
                                setNewSpecialization(prev => ({ ...prev, name: e.target.value }))
                              }
                            }}
                            className="flex-1 px-3 py-2 rounded bg-white/10 border border-white/20 text-white placeholder-white/50 text-sm"
                          />
                          <select
                            value={isSelectedAttr ? newSpecialization.skillId : ''}
                            onChange={(e) => {
                              const nextSkillId = e.target.value
                              if (!nextSkillId) {
                                setNewSpecialization({ name: '', skillId: '' })
                                return
                              }
                              setNewSpecialization(prev => ({
                                ...prev,
                                skillId: nextSkillId,
                              }))
                            }}
                            className="px-3 py-2 rounded bg-white/10 border border-white/20 text-white text-sm"
                          >
                            <option value="" className="bg-slate-800">Fertigkeit wählen...</option>
                            {attrSkills.map(s => (
                              <option key={s.id} value={s.id} className="bg-slate-800">
                                {s.name}
                              </option>
                            ))}
                          </select>
                          <button
                            onClick={() => {
                              if (isSelectedAttr && newSpecialization.name.trim()) {
                                handleAddSpecializationGlobal()
                              }
                            }}
                            disabled={!newSpecialization.name.trim() || !isSelectedAttr}
                            className="px-4 py-2 bg-primary-600 hover:bg-primary-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded text-sm transition-colors"
                          >
                            Hinzufügen
                          </button>
                              </>
                            )
                          })()}
                        </div>
                      </div>
                      
                      {/* Freie Zeile für eigene Fertigkeitsvorschläge */}
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

              <div className="bg-white/5 rounded-xl p-4 border border-white/10 space-y-4">
                <div>
                  <label className="block text-white/90 mb-2 font-medium">Sichtbare Ausrüstung (für das Profilbild):</label>
                  <textarea
                    value={visibleEquipment}
                    onChange={(e) => setVisibleEquipment(e.target.value)}
                    rows={3}
                    className="w-full px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-primary-400"
                    placeholder="z.B. Lederweste, Dolch, Kartenrolle"
                  />
                </div>
                <div className="flex flex-col gap-4">
                  <label className="flex items-center gap-2 text-white/80 text-sm">
                    <input
                      type="checkbox"
                      checked={portraitFallcrestFilter}
                      onChange={(e) => setPortraitFallcrestFilter(e.target.checked)}
                      className="rounded"
                    />
                    Fallcrest-Artefakt-Nässe aktivieren
                  </label>
                  <button
                    onClick={generatePlaceholderProfileImage}
                    disabled={!canGenerateProfileImage || profileImageLoading}
                    className="px-4 py-2 rounded-lg font-semibold bg-primary-600 hover:bg-primary-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white transition-all duration-300 hover:shadow-lg hover:shadow-primary-500/40"
                  >
                    {profileImageLoading ? 'Generiere...' : 'Profilbild generieren'}
                  </button>

                  {profileImageUrl && (
                    <div className="space-y-3">
                      <div className="bg-white/5 p-3 rounded-lg border border-white/10">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={profileImageUrl}
                          alt="Generiertes Profilbild"
                          className="w-full max-w-sm rounded-lg border border-white/10"
                        />
                      </div>
                      <div className="flex flex-col sm:flex-row gap-3">
                        <button
                          onClick={() => {
                            setProfileImageUrl(null)
                            setProfileImageSaved(false)
                          }}
                          className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white font-semibold transition-all duration-300 hover:shadow-lg hover:shadow-white/10"
                        >
                          Verwerfen / Neuer Versuch
                        </button>
                        <button
                          onClick={() => setProfileImageSaved(true)}
                          className="px-4 py-2 rounded-lg bg-green-600 hover:bg-green-700 text-white font-semibold transition-all duration-300 hover:shadow-lg hover:shadow-green-500/30"
                        >
                          Speichern
                        </button>
                      </div>
                      {profileImageSaved && (
                        <div className="text-green-400 text-sm">Profilbild wird beim Speichern des Charakters übernommen.</div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-4">
                <button
                  onClick={() => setStep('attributes')}
                  className="px-6 bg-white/10 hover:bg-white/20 text-white font-semibold py-3 rounded-lg transition-colors"
                >
                  Zurück
                </button>
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
