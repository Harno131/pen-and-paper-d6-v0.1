'use client'

import { useState, useEffect } from 'react'
import { Character } from '@/types'
import { getAlignment } from '@/lib/alignments'
import { extractTagsFromText, normalizeTag } from '@/lib/tags'
import NameGenerator from './NameGenerator'
import AlignmentSelector from './AlignmentSelector'

interface NpcCreationExtendedProps {
  onComplete: (npc: Character) => void
  onCancel: () => void
  editingNpc?: Character | null
}

// Optionen für Dropdowns
const RACES = ['Mensch', 'Elf', 'Zwerg', 'Halbling', 'Ork', 'Gnom', 'Drache', 'Andere']
const CLASSES = ['Krieger', 'Magier', 'Dieb', 'Kleriker', 'Barde', 'Jäger', 'Händler', 'Handwerker', 'Gelehrter', 'Adliger', 'Bauer', 'Soldat', 'Andere']
const GENDERS = ['Männlich', 'Weiblich']
const PROFESSIONS = [
  'Händler', 'Schmied', 'Bäcker', 'Barkeeper', 'Wirt', 'Heiler', 'Magier', 'Priester',
  'Stadtwache', 'Soldat', 'Dieb', 'Assassine', 'Barde', 'Gelehrter', 'Adliger', 'Bauer',
  'Fischer', 'Seefahrer', 'Jäger', 'Falkner', 'Koch', 'Schneider', 'Gerber', 'Tischler',
  'Maurer', 'Metzger', 'Krämer', 'Bibliothekar', 'Kartograph', 'Alchemist', 'Andere'
]

// Berufsabhängige Fähigkeiten
const PROFESSION_SKILLS: { [key: string]: string[] } = {
  'Händler': ['Geschäftssinn', 'Betrügen', 'Ausstrahlung'],
  'Schmied': ['Handwerk', 'Stärke'],
  'Bäcker': ['Handwerk'],
  'Barkeeper': ['Ausstrahlung', 'Betören'],
  'Wirt': ['Ausstrahlung', 'Geschäftssinn'],
  'Heiler': ['Heilkunde', 'Wissen'],
  'Magier': ['magisches Wissen', 'magische Kraft'],
  'Priester': ['magisches Wissen', 'Ausstrahlung'],
  'Stadtwache': ['bewaffneter Nahkampf', 'Ausdauer'],
  'Soldat': ['bewaffneter Nahkampf', 'Ausdauer'],
  'Dieb': ['Schleichen', 'Fingerfertigkeit', 'Schlösser öffnen'],
  'Assassine': ['Schleichen', 'bewaffneter Nahkampf', 'Fingerfertigkeit'],
  'Barde': ['Betören', 'schöne Künste', 'Spielen'],
  'Gelehrter': ['Schulwissen', 'magisches Wissen'],
  'Adliger': ['Ausstrahlung', 'Kommandieren'],
  'Bauer': ['Überleben', 'Heben'],
  'Fischer': ['Überleben', 'Koordination'],
  'Seefahrer': ['Steuern', 'Überleben'],
  'Jäger': ['Überleben', 'Fernkampf'],
  'Falkner': ['Überleben', 'Koordination'],
  'Koch': ['Handwerk'],
  'Schneider': ['Handwerk', 'Fingerfertigkeit'],
  'Gerber': ['Handwerk'],
  'Tischler': ['Handwerk'],
  'Maurer': ['Handwerk', 'Stärke'],
  'Metzger': ['Handwerk'],
  'Krämer': ['Geschäftssinn'],
  'Bibliothekar': ['Schulwissen'],
  'Kartograph': ['Navigation', 'Schulwissen'],
  'Alchemist': ['magisches Wissen', 'Handwerk'],
}

// Rassenabhängige Fähigkeiten
const RACE_SKILLS: { [key: string]: string[] } = {
  'Mensch': ['Ausstrahlung', 'Geschäftssinn'],
  'Elf': ['magisches Wissen', 'Wahrnehmung'],
  'Zwerg': ['Handwerk', 'Stärke'],
  'Halbling': ['Schleichen', 'Geschäftssinn'],
  'Ork': ['Stärke', 'Ausdauer'],
  'Gnom': ['Handwerk', 'magisches Wissen'],
  'Drache': ['magische Kraft', 'Stärke'],
}

export default function NpcCreationExtended({ onComplete, onCancel, editingNpc }: NpcCreationExtendedProps) {
  const [name, setName] = useState(editingNpc?.name || '')
  const [race, setRace] = useState(editingNpc?.race || '')
  const [className, setClassName] = useState(editingNpc?.className || '')
  const [gender, setGender] = useState(editingNpc?.gender || '')
  const [profession, setProfession] = useState(editingNpc?.npcProfession || '')
  const [affiliation, setAffiliation] = useState(editingNpc?.npcAffiliation || '')
  const [location, setLocation] = useState(editingNpc?.npcLocation || '')
  const [address, setAddress] = useState(editingNpc?.npcAddress || '')
  const [bestSkills, setBestSkills] = useState<string[]>(editingNpc?.npcBestSkills || [])
  const [portraitUrl, setPortraitUrl] = useState<string | null>(editingNpc?.profileImageUrl || null)
  const [portraitSaved, setPortraitSaved] = useState(!!editingNpc?.profileImageUrl)
  const [portraitLoading, setPortraitLoading] = useState(false)
  const [portraitError, setPortraitError] = useState('')
  const [tagInput, setTagInput] = useState(
    editingNpc?.tags && editingNpc.tags.length > 0 ? editingNpc.tags.map(tag => `#${tag}`).join(' ') : ''
  )
  
  // Geheim-Attribute
  const [secretAlignment, setSecretAlignment] = useState<{ row: number; col: number } | undefined>(editingNpc?.npcSecretAlignment)
  const [secretAgenda, setSecretAgenda] = useState(editingNpc?.npcSecretAgenda || '')
  const [secretQuestGiver, setSecretQuestGiver] = useState(editingNpc?.npcSecretQuestGiver || false)
  const [secretHiddenHero, setSecretHiddenHero] = useState(editingNpc?.npcSecretHiddenHero || false)
  const [secretNemesis, setSecretNemesis] = useState(editingNpc?.npcSecretNemesis || '')
  const [secretPerpetrator, setSecretPerpetrator] = useState(editingNpc?.npcSecretPerpetrator || false)
  const [secretVictim, setSecretVictim] = useState(editingNpc?.npcSecretVictim || false)
  
  // Fixier-Flags für *-Attribute
  const [fixedName, setFixedName] = useState(!!editingNpc?.name)
  const [fixedRace, setFixedRace] = useState(!!editingNpc?.race)
  const [fixedClass, setFixedClass] = useState(!!editingNpc?.className)
  const [fixedGender, setFixedGender] = useState(!!editingNpc?.gender)
  const [fixedProfession, setFixedProfession] = useState(!!editingNpc?.npcProfession)

  // Berechne beste Fähigkeiten basierend auf Beruf und Rasse
  useEffect(() => {
    const skills = new Set<string>()
    
    if (profession && PROFESSION_SKILLS[profession]) {
      PROFESSION_SKILLS[profession].forEach(skill => skills.add(skill))
    }
    
    if (race && RACE_SKILLS[race]) {
      RACE_SKILLS[race].forEach(skill => skills.add(skill))
    }
    
    setBestSkills(Array.from(skills))
  }, [profession, race])

  // Zufalls-Auswahl für nicht-fixierte Attribute
  const randomizeUnfixed = () => {
    if (!fixedName) {
      // Name wird vom NameGenerator gesetzt
    }
    if (!fixedRace && RACES.length > 0) {
      setRace(RACES[Math.floor(Math.random() * RACES.length)])
    }
    if (!fixedClass && CLASSES.length > 0) {
      setClassName(CLASSES[Math.floor(Math.random() * CLASSES.length)])
    }
    if (!fixedGender && GENDERS.length > 0) {
      setGender(GENDERS[Math.floor(Math.random() * GENDERS.length)])
    }
    if (!fixedProfession && PROFESSIONS.length > 0) {
      setProfession(PROFESSIONS[Math.floor(Math.random() * PROFESSIONS.length)])
    }
  }

  const handleNameGenerated = (generatedName: string) => {
    setName(generatedName)
    // Wenn Name nicht fixiert ist, würfle auch andere Attribute
    if (!fixedName) {
      randomizeUnfixed()
    }
  }

  const handleGeneratePortrait = async () => {
    const traits = [
      profession,
      ...bestSkills,
    ].filter(Boolean)

    setPortraitLoading(true)
    setPortraitError('')
    try {
      const response = await fetch('/api/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'portrait',
          data: {
            name,
            entityType: 'npc',
            race,
            className,
            age: undefined,
            traits,
          },
        }),
      })
      const json = await response.json()
      if (response.ok && json?.imageUrl) {
        setPortraitUrl(json.imageUrl)
        setPortraitSaved(false)
      } else {
        const reason = typeof json?.error === 'string'
          ? json.error
          : json?.details || 'Bild konnte nicht generiert werden.'
        setPortraitError(reason)
      }
    } catch (error) {
      setPortraitError('Bildgenerierung fehlgeschlagen. Prüfe Internetverbindung und API-Key.')
    } finally {
      setPortraitLoading(false)
    }
  }

  const handleSave = () => {
    if (!name.trim()) {
      alert('Bitte gib einen Namen ein')
      return
    }

    const tagsFromHash = extractTagsFromText(tagInput)
    const tags = tagsFromHash.length > 0
      ? tagsFromHash
      : tagInput
          .split(/[,\s]+/)
          .map(tag => normalizeTag(tag))
          .filter(Boolean)

    const npc: Character = {
      id: editingNpc?.id || `npc-${Date.now()}`,
      name: name.trim(),
      playerName: 'NPC',
      isNPC: true,
      npcType: 'sonstiges',
      race: race || undefined,
      className: className || undefined,
      gender: gender || undefined,
      level: 1,
      attributes: {
        Reflexe: '2D',
        Koordination: '2D',
        Stärke: '2D',
        Wissen: '2D',
        Wahrnehmung: '2D',
        Ausstrahlung: '2D',
        Magie: '0D',
      },
      skills: [],
      inventory: [],
      npcProfession: profession || undefined,
      npcAffiliation: affiliation || undefined,
      npcLocation: location || undefined,
      npcAddress: address || undefined,
      npcBestSkills: bestSkills.length > 0 ? bestSkills : undefined,
      npcSecretAlignment: secretAlignment,
      npcSecretAgenda: secretAgenda || undefined,
      npcSecretQuestGiver: secretQuestGiver || undefined,
      npcSecretHiddenHero: secretHiddenHero || undefined,
      npcSecretNemesis: secretNemesis || undefined,
      npcSecretPerpetrator: secretPerpetrator || undefined,
      npcSecretVictim: secretVictim || undefined,
      profileImageUrl: portraitSaved ? portraitUrl || undefined : undefined,
      imageUrl: portraitSaved ? portraitUrl || undefined : undefined,
      tags: tags.length > 0 ? tags : undefined,
      createdDate: editingNpc?.createdDate || new Date(),
      lastPlayedDate: new Date(),
    }

    onComplete(npc)
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 rounded-xl p-6 border border-white/20 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white">
            {editingNpc ? 'NPC bearbeiten' : 'NPC erstellen'}
          </h2>
          <button
            onClick={onCancel}
            className="text-white/70 hover:text-white text-2xl"
          >
            ×
          </button>
        </div>

        <div className="space-y-6">
          {/* Name mit NameGenerator */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <label className="text-white/90 font-medium">Name *</label>
              <label className="flex items-center gap-2 text-white/70 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={fixedName}
                  onChange={(e) => setFixedName(e.target.checked)}
                  className="rounded"
                />
                <span>Fixieren</span>
              </label>
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="NPC-Name"
                className="flex-1 px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-primary-400"
              />
              <NameGenerator onNameSelected={handleNameGenerated} />
            </div>
          </div>

          {/* Rasse */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <label className="text-white/90 font-medium">Rasse *</label>
              <label className="flex items-center gap-2 text-white/70 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={fixedRace}
                  onChange={(e) => setFixedRace(e.target.checked)}
                  className="rounded"
                />
                <span>Fixieren</span>
              </label>
            </div>
            <select
              value={race}
              onChange={(e) => setRace(e.target.value)}
              className="w-full px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white focus:outline-none focus:ring-2 focus:ring-primary-400"
            >
              <option value="" className="bg-slate-800">-- Auswählen --</option>
              {RACES.map(r => (
                <option key={r} value={r} className="bg-slate-800">{r}</option>
              ))}
            </select>
          </div>

          {/* Klasse */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <label className="text-white/90 font-medium">Klasse *</label>
              <label className="flex items-center gap-2 text-white/70 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={fixedClass}
                  onChange={(e) => setFixedClass(e.target.checked)}
                  className="rounded"
                />
                <span>Fixieren</span>
              </label>
            </div>
            <select
              value={className}
              onChange={(e) => setClassName(e.target.value)}
              className="w-full px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white focus:outline-none focus:ring-2 focus:ring-primary-400"
            >
              <option value="" className="bg-slate-800">-- Auswählen --</option>
              {CLASSES.map(c => (
                <option key={c} value={c} className="bg-slate-800">{c}</option>
              ))}
            </select>
          </div>

          {/* Geschlecht */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <label className="text-white/90 font-medium">Geschlecht *</label>
              <label className="flex items-center gap-2 text-white/70 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={fixedGender}
                  onChange={(e) => setFixedGender(e.target.checked)}
                  className="rounded"
                />
                <span>Fixieren</span>
              </label>
            </div>
            <select
              value={gender}
              onChange={(e) => setGender(e.target.value)}
              className="w-full px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white focus:outline-none focus:ring-2 focus:ring-primary-400"
            >
              <option value="" className="bg-slate-800">-- Auswählen --</option>
              {GENDERS.map(g => (
                <option key={g} value={g} className="bg-slate-800">{g}</option>
              ))}
            </select>
          </div>

          {/* Beruf */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <label className="text-white/90 font-medium">Beruf *</label>
              <label className="flex items-center gap-2 text-white/70 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={fixedProfession}
                  onChange={(e) => setFixedProfession(e.target.checked)}
                  className="rounded"
                />
                <span>Fixieren</span>
              </label>
            </div>
            <select
              value={profession}
              onChange={(e) => setProfession(e.target.value)}
              className="w-full px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white focus:outline-none focus:ring-2 focus:ring-primary-400"
            >
              <option value="" className="bg-slate-800">-- Auswählen --</option>
              {PROFESSIONS.map(p => (
                <option key={p} value={p} className="bg-slate-800">{p}</option>
              ))}
            </select>
          </div>

          {/* Tags */}
          <div>
            <label className="text-white/90 font-medium block mb-2">Tags (z.B. #personen #monster #orte)</label>
            <input
              type="text"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              placeholder="#personen #monster #orte"
              className="w-full px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-primary-400"
            />
            {tagInput.trim() && (
              <div className="mt-2 flex flex-wrap gap-2">
                {(extractTagsFromText(tagInput).length > 0
                  ? extractTagsFromText(tagInput)
                  : tagInput
                      .split(/[,\s]+/)
                      .map(tag => normalizeTag(tag))
                      .filter(Boolean)
                ).map(tag => (
                  <span
                    key={tag}
                    className="inline-flex items-center px-2 py-0.5 rounded-full text-xs text-white/90 bg-gradient-to-br from-white/20 to-white/5 border border-white/20 backdrop-blur-md shadow-[inset_0_1px_0_rgba(255,255,255,0.25)]"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Beste Fähigkeiten (automatisch berechnet) */}
          {bestSkills.length > 0 && (
            <div>
              <label className="text-white/90 font-medium mb-2 block">Beste Fähigkeiten</label>
              <div className="flex flex-wrap gap-2">
                {bestSkills.map(skill => (
                  <span key={skill} className="px-3 py-1 bg-primary-600/30 text-primary-200 rounded-lg text-sm">
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Zugehörigkeit */}
          <div>
            <label className="text-white/90 font-medium mb-2 block">Zugehörigkeit</label>
            <input
              type="text"
              value={affiliation}
              onChange={(e) => setAffiliation(e.target.value)}
              placeholder="z.B. 'Die Gischt', 'Stadtwache der Hafenstadt'"
              className="w-full px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-primary-400"
            />
          </div>

          {/* Ort */}
          <div>
            <label className="text-white/90 font-medium mb-2 block">Ort</label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="z.B. 'Hafenstadt', 'Mondsteinhalle'"
              className="w-full px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-primary-400"
            />
          </div>

          {/* Adresse */}
          <div>
            <label className="text-white/90 font-medium mb-2 block">Adresse</label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="z.B. 'Nebeltorstraße 12'"
              className="w-full px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-primary-400"
            />
          </div>

          {/* Portrait */}
          <div className="bg-white/5 rounded-xl p-4 border border-white/10 space-y-4">
            <div className="flex flex-col gap-3">
              <button
                onClick={handleGeneratePortrait}
                disabled={portraitLoading}
                className="px-4 py-2 rounded-lg font-semibold bg-primary-600 hover:bg-primary-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white transition-all duration-300 hover:shadow-lg hover:shadow-primary-500/40"
              >
                {portraitLoading ? 'Generiere...' : 'Porträt generieren'}
              </button>
              {portraitError && (
                <div className="text-red-400 text-sm bg-white/5 rounded-lg p-3 border border-white/10">
                  <div className="font-semibold mb-1">Bild nicht generiert</div>
                  <div>{portraitError}</div>
                  <div className="text-white/60 mt-2">
                    Hinweis: Wenn der API-Key fehlt, bitte `GEMINI_API_KEY` setzen und den Server neu starten.
                  </div>
                </div>
              )}

              {portraitUrl && (
                <div className="space-y-3">
                  <div className="bg-white/5 p-3 rounded-lg border border-white/10">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={portraitUrl}
                      alt="Generiertes Porträt"
                      className="w-full max-w-sm rounded-lg border border-white/10"
                    />
                  </div>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <button
                      onClick={() => {
                        setPortraitUrl(null)
                        setPortraitSaved(false)
                      }}
                      className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white font-semibold transition-all duration-300 hover:shadow-lg hover:shadow-white/10"
                    >
                      Verwerfen / Neuer Versuch
                    </button>
                    <button
                      onClick={() => setPortraitSaved(true)}
                      className="px-4 py-2 rounded-lg bg-green-600 hover:bg-green-700 text-white font-semibold transition-all duration-300 hover:shadow-lg hover:shadow-green-500/30"
                    >
                      Speichern
                    </button>
                  </div>
                  {portraitSaved && (
                    <div className="text-green-400 text-sm">
                      Porträt wird beim Speichern des NPC übernommen.
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Geheim-Attribute */}
          <div className="border-t border-white/20 pt-6">
            <h3 className="text-lg font-semibold text-yellow-400 mb-4">
              🔒 Geheim-Attribute (nicht im Tagebuch)
            </h3>
            
            <div className="space-y-4">
              {/* Gesinnung */}
              <div>
                <label className="text-white/90 font-medium mb-2 block">Gesinnung</label>
                <div className="bg-white/5 rounded-lg p-4">
                  <AlignmentSelector
                    selectedAlignment={secretAlignment}
                    onSelect={(row, col) => setSecretAlignment({ row, col })}
                  />
                </div>
              </div>

              {/* Agenda */}
              <div>
                <label className="text-white/90 font-medium mb-2 block">Agenda</label>
                <textarea
                  value={secretAgenda}
                  onChange={(e) => setSecretAgenda(e.target.value)}
                  placeholder="Geheime Ziele und Motive des NPCs..."
                  rows={3}
                  className="w-full px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-primary-400"
                />
              </div>

              {/* Checkboxen */}
              <div className="grid grid-cols-2 gap-4">
                <label className="flex items-center gap-2 text-white/90 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={secretQuestGiver}
                    onChange={(e) => setSecretQuestGiver(e.target.checked)}
                    className="rounded"
                  />
                  <span>Questgeber</span>
                </label>
                <label className="flex items-center gap-2 text-white/90 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={secretHiddenHero}
                    onChange={(e) => setSecretHiddenHero(e.target.checked)}
                    className="rounded"
                  />
                  <span>Versteckter Held</span>
                </label>
                <label className="flex items-center gap-2 text-white/90 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={secretPerpetrator}
                    onChange={(e) => setSecretPerpetrator(e.target.checked)}
                    className="rounded"
                  />
                  <span>Täter</span>
                </label>
                <label className="flex items-center gap-2 text-white/90 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={secretVictim}
                    onChange={(e) => setSecretVictim(e.target.checked)}
                    className="rounded"
                  />
                  <span>Opfer</span>
                </label>
              </div>

              {/* Erzfeind */}
              <div>
                <label className="text-white/90 font-medium mb-2 block">Erzfeind</label>
                <input
                  type="text"
                  value={secretNemesis}
                  onChange={(e) => setSecretNemesis(e.target.value)}
                  placeholder="Name des Erzfeindes"
                  className="w-full px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-primary-400"
                />
              </div>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              onClick={onCancel}
              className="flex-1 px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-lg font-semibold transition-colors"
            >
              Abbrechen
            </button>
            <button
              onClick={handleSave}
              disabled={!name.trim()}
              className="flex-1 px-6 py-3 bg-primary-600 hover:bg-primary-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg font-semibold transition-colors"
            >
              {editingNpc ? 'Speichern' : 'NPC erstellen'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
