'use client'

import { useState, useEffect } from 'react'

interface NamingSyllables {
  [key: string]: {
    male?: {
      prefix: string[];
      suffix: string[];
    };
    female?: {
      prefix: string[];
      suffix: string[];
    };
    part1?: string[];
    part2?: string[];
  };
}

interface NameGeneratorProps {
  onNameSelected: (name: string) => void
}

export default function NameGenerator({ onNameSelected }: NameGeneratorProps) {
  const [namingData, setNamingData] = useState<NamingSyllables | null>(null)
  const [selectedRace, setSelectedRace] = useState<string>('human')
  const [selectedGender, setSelectedGender] = useState<string>('male')
  const [generatedNames, setGeneratedNames] = useState<string[]>([])

  useEffect(() => {
    // Lade naming_syllables.json
    fetch('/naming_syllables.json')
      .then(res => res.json())
      .then(data => setNamingData(data))
      .catch(err => console.error('Fehler beim Laden der Namensdaten:', err))
  }, [])

  const generateName = () => {
    const raceData = namingSyllables[selectedRace]
    if (!raceData) return ''

    // Zugriff auf Vornamen-Daten mit Type-Cast für Gender
    const genderData = raceData[selectedGender as 'male' | 'female']
    if (!genderData || !genderData.prefix || !genderData.suffix) return ''

    // Generiere Vorname
    const prefix = genderData.prefix[Math.floor(Math.random() * genderData.prefix.length)]
    const suffix = genderData.suffix[Math.floor(Math.random() * genderData.suffix.length)]
    const firstName = prefix + suffix

    // Nachnamen-Logik
    const surnameKey = `${selectedRace}_surnames`
    const surnameData = namingSyllables[surnameKey]

    // Falls keine Nachnamen-Daten da sind (z.B. bei Halborks), nur Vorname zurückgeben
    if (!surnameData || !surnameData.part1 || !surnameData.part2) {
      return firstName
    }

    const surnamePart1 = surnameData.part1[Math.floor(Math.random() * surnameData.part1.length)]
    const surnamePart2 = surnameData.part2[Math.floor(Math.random() * surnameData.part2.length)]
    
    return `${firstName} ${surnamePart1}${surnamePart2}`
  }

  const handleGenerate = () => {
    const names: string[] = []
    for (let i = 0; i < 3; i++) {
      names.push(generateName())
    }
    setGeneratedNames(names)
  }

  const handleNameClick = (name: string) => {
    onNameSelected(name)
  }

  if (!namingData) {
    return (
      <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
        <p className="text-white/70">Lade Namensdaten...</p>
      </div>
    )
  }

  return (
    <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
      <h3 className="text-xl font-bold text-white mb-4" style={{ fontSize: 'calc(1.25rem * var(--app-scale, 1))' }}>
        🎲 Zufalls-Namens-Engine
      </h3>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        {/* Rasse-Auswahl */}
        <div>
          <label className="block text-white/90 mb-2 font-medium" style={{ fontSize: 'calc(0.875rem * var(--app-scale, 1))' }}>
            Rasse:
          </label>
          <select
            value={selectedRace}
            onChange={(e) => setSelectedRace(e.target.value)}
            className="w-full px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white focus:outline-none focus:ring-2 focus:ring-primary-400 backdrop-blur-sm transition-all duration-300 hover:bg-white/15"
            style={{ fontSize: 'calc(1rem * var(--app-scale, 1))' }}
          >
            <option value="human" className="bg-slate-800">Mensch</option>
            <option value="elf" className="bg-slate-800">Elf</option>
            <option value="dwarf" className="bg-slate-800">Zwerg</option>
            <option value="halfling" className="bg-slate-800">Halbling</option>
            <option value="halforc" className="bg-slate-800">Halbork</option>
            <option value="gnome" className="bg-slate-800">Gnom</option>
          </select>
        </div>

        {/* Geschlecht-Auswahl */}
        <div>
          <label className="block text-white/90 mb-2 font-medium" style={{ fontSize: 'calc(0.875rem * var(--app-scale, 1))' }}>
            Geschlecht:
          </label>
          <select
            value={selectedGender}
            onChange={(e) => setSelectedGender(e.target.value)}
            className="w-full px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white focus:outline-none focus:ring-2 focus:ring-primary-400 backdrop-blur-sm transition-all duration-300 hover:bg-white/15"
            style={{ fontSize: 'calc(1rem * var(--app-scale, 1))' }}
          >
            <option value="male" className="bg-slate-800">Männlich</option>
            <option value="female" className="bg-slate-800">Weiblich</option>
          </select>
        </div>

        {/* Generieren-Button */}
        <div className="flex items-end">
          <button
            onClick={handleGenerate}
            className="w-full px-4 py-2 rounded-lg bg-primary-600 hover:bg-primary-700 text-white font-semibold transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-primary-500/50 backdrop-blur-sm"
            style={{ fontSize: 'calc(1rem * var(--app-scale, 1))' }}
          >
            🎲 Generieren
          </button>
        </div>
      </div>

      {/* Generierte Namen */}
      {generatedNames.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {generatedNames.map((name, index) => (
            <button
              key={index}
              onClick={() => handleNameClick(name)}
              className="px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white text-center font-medium transition-all duration-300 hover:bg-white/15 hover:border-white/30 hover:scale-105 hover:shadow-lg backdrop-blur-sm"
              style={{ fontSize: 'calc(1.125rem * var(--app-scale, 1))' }}
            >
              {name}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
