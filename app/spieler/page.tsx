'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Character, JournalEntry, SharedImage } from '@/types'
import { 
  getCharacters, 
  getJournalEntries, 
  getSharedImages, 
  saveCharacters,
  saveJournalEntry,
  deleteCharacter,
  updateLastPlayedDate,
  calculateCharacterPoints,
  getCharacterCreationSettings,
  calculateHitPoints,
} from '@/lib/data'
import { getGroupSettings } from '@/lib/supabase-data'
import { calculateSkillValue } from '@/lib/skills'
import { formatD6Value } from '@/lib/dice'
import { realDateToFantasyDate, formatFantasyDate, TIMES_OF_DAY, getSpecialEvent, getMonthInfo } from '@/lib/fantasy-calendar'
import DiceRoller from '@/components/DiceRoller'
import AlignmentSelector from '@/components/AlignmentSelector'
import CharacterCreationExtended from '@/components/CharacterCreationExtended'
import SkillDiceRoller from '@/components/SkillDiceRoller'

export default function SpielerPage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<'characters' | 'character' | 'skills' | 'equipment' | 'journal' | 'images'>('characters')
  const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(null)
  const [playerCharacters, setPlayerCharacters] = useState<Character[]>([])
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>([])
  const [sharedImages, setSharedImages] = useState<SharedImage[]>([])
  const [newJournalEntry, setNewJournalEntry] = useState({ title: '', content: '' })
  const [selectedTimeOfDay, setSelectedTimeOfDay] = useState<string>('Mittag')
  const [editingEntry, setEditingEntry] = useState<JournalEntry | null>(null)
  const [showCharacterCreation, setShowCharacterCreation] = useState(false)
  const [playerName, setPlayerName] = useState('')
  const [selectedSkillForRoll, setSelectedSkillForRoll] = useState<{ skill: any; specialization?: any } | null>(null)
  const groupId = typeof window !== 'undefined' ? localStorage.getItem('groupId') : null

  useEffect(() => {
    const role = localStorage.getItem('userRole')
    const name = localStorage.getItem('playerName')
    const groupId = localStorage.getItem('groupId')
    
    if (role !== 'spieler' || !name || !groupId) {
      router.push('/')
      return
    }

    // Validiere Gruppen-Mitgliedschaft beim Laden
    validateGroupAccess(groupId, name, role)
    setPlayerName(name)
    loadData()
  }, [router])

  const validateGroupAccess = async (groupId: string, playerName: string, role: string) => {
    const { validateGroupMembership } = await import('@/lib/supabase-data')
    const validation = await validateGroupMembership(groupId, playerName)
    
    if (!validation.valid || validation.role !== role) {
      // Gruppe existiert nicht mehr oder Spieler ist nicht mehr Mitglied
      localStorage.removeItem('groupId')
      localStorage.removeItem('groupCode')
      localStorage.removeItem('userRole')
      localStorage.removeItem('playerName')
      router.push('/')
    }
  }

  const loadData = async () => {
    const name = localStorage.getItem('playerName') || ''
    
    // Verwende getCharactersAsync() um aus Supabase zu laden (wenn verfügbar)
    const { getCharactersAsync } = await import('@/lib/data')
    const allCharacters = await getCharactersAsync()
    const myCharacters = allCharacters.filter(c => c.playerName === name)
    setPlayerCharacters(myCharacters)
    
    // Wenn ein Charakter ausgewählt ist, aktualisiere ihn
    if (selectedCharacter) {
      const updated = myCharacters.find(c => c.id === selectedCharacter.id)
      if (updated) {
        setSelectedCharacter(updated)
      } else {
        setSelectedCharacter(null)
        setActiveTab('characters')
      }
    }

    const entries = await getJournalEntries()
    setJournalEntries(entries)
    setSharedImages(getSharedImages())
  }

  // Automatisches Neuladen alle 5 Sekunden (Polling für Echtzeit-Synchronisation)
  useEffect(() => {
    const interval = setInterval(() => {
      loadData()
    }, 5000) // Alle 5 Sekunden

    return () => clearInterval(interval)
  }, [])

  const handleCharacterSelect = (character: Character) => {
    setSelectedCharacter(character)
    setActiveTab('character')
    updateLastPlayedDate(character.id)
  }

  const handleCharacterDelete = (characterId: string) => {
    if (!confirm('Möchtest du diesen Charakter wirklich löschen? Der Spielleiter kann ihn wiederherstellen.')) {
      return
    }

    if (deleteCharacter(characterId)) {
      loadData()
      if (selectedCharacter?.id === characterId) {
        setSelectedCharacter(null)
        setActiveTab('characters')
      }
    }
  }

  const handleAddJournalEntry = async () => {
    if (!newJournalEntry.content.trim()) return

    const name = localStorage.getItem('playerName') || 'Unbekannt'
    const now = new Date()
    
    // Lade Start-Datum aus Settings
    let fantasyDate
    if (groupId) {
      const groupSettings = await getGroupSettings(groupId)
      const startDate = groupSettings?.fantasyCalendar?.startDate
      const realStartDate = groupSettings?.fantasyCalendar?.realStartDate 
        ? new Date(groupSettings.fantasyCalendar.realStartDate)
        : undefined
      fantasyDate = realDateToFantasyDate(now, startDate, realStartDate)
    } else {
      fantasyDate = realDateToFantasyDate(now)
    }

    // Extrahiere Titel aus Content (alles vor dem ersten Doppelpunkt)
    const contentParts = newJournalEntry.content.split(':')
    const title = contentParts.length > 1 ? contentParts[0].trim() : 'Eintrag'
    const content = contentParts.length > 1 ? contentParts.slice(1).join(':').trim() : newJournalEntry.content.trim()
    
    const entry: JournalEntry = {
      id: editingEntry?.id || Date.now().toString(),
      author: name,
      characterId: selectedCharacter?.id || editingEntry?.characterId,
      title,
      content,
      timestamp: editingEntry?.timestamp || now,
      fantasyDate,
      timeOfDay: selectedTimeOfDay as any,
    }

    if (editingEntry) {
      // Aktualisiere bestehenden Eintrag
      const updatedEntries = journalEntries.map(e => e.id === editingEntry.id ? entry : e)
      setJournalEntries(updatedEntries)
      await saveJournalEntry(entry)
      setEditingEntry(null)
    } else {
      // Neuer Eintrag
      const entries = [...journalEntries, entry]
      setJournalEntries(entries)
      await saveJournalEntry(entry)
    }
    
    setNewJournalEntry({ title: '', content: '' })
    setSelectedTimeOfDay('Mittag')
  }

  const handleAlignmentSelect = (row: number, col: number) => {
    if (!selectedCharacter) return

    const characters = getCharacters()
    const updated = characters.map((char) => {
      if (char.id === selectedCharacter.id) {
        return {
          ...char,
          alignment: { row, col },
        }
      }
      return char
    })
    saveCharacters(updated)
    setSelectedCharacter({ ...selectedCharacter, alignment: { row, col } })
    loadData()
  }

  const addItemToCharacter = (item: { name: string; description?: string; quantity?: number }) => {
    if (!selectedCharacter) return

    const characters = getCharacters()
    const updated = characters.map((char) => {
      if (char.id === selectedCharacter.id) {
        return {
          ...char,
          inventory: [
            ...char.inventory,
            {
              id: Date.now().toString(),
              ...item,
            },
          ],
        }
      }
      return char
    })
    saveCharacters(updated)
    loadData()
  }

  const removeItemFromCharacter = (itemId: string) => {
    if (!selectedCharacter) return

    const characters = getCharacters()
    const updated = characters.map((char) => {
      if (char.id === selectedCharacter.id) {
        return {
          ...char,
          inventory: char.inventory.filter(item => item.id !== itemId),
        }
      }
      return char
    })
    saveCharacters(updated)
    loadData()
  }

  const handleCharacterCreated = (newCharacter: Character) => {
    setShowCharacterCreation(false)
    // Charakter auswählen und Daten laden
    setSelectedCharacter(newCharacter)
    loadData()
    // Nach Erstellung zum Ausrüstungs-Screen springen
    setTimeout(() => {
      setActiveTab('equipment')
    }, 100)
  }

  // Wenn Character-Erstellung angezeigt werden soll
  if (showCharacterCreation) {
    return (
      <CharacterCreationExtended
        playerName={playerName}
        onComplete={handleCharacterCreated}
        onCancel={() => setShowCharacterCreation(false)}
      />
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-white mb-1">
              ⚔️ Spieler: {playerName}
            </h1>
            <p className="text-white/70">
              {playerCharacters.length} Charakter{playerCharacters.length !== 1 ? 'e' : ''}
            </p>
          </div>
          <button
            onClick={() => {
              localStorage.removeItem('userRole')
              localStorage.removeItem('playerName')
              router.push('/')
            }}
            className="text-white/70 hover:text-white"
          >
            Abmelden
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 flex-wrap">
          <button
            onClick={() => setActiveTab('characters')}
            className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
              activeTab === 'characters'
                ? 'bg-primary-600 text-white'
                : 'bg-white/10 text-white/70 hover:bg-white/20'
            }`}
          >
            👥 Meine Charaktere
          </button>
          {selectedCharacter && (
            <>
              <button
                onClick={() => setActiveTab('character')}
                className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                  activeTab === 'character'
                    ? 'bg-primary-600 text-white'
                    : 'bg-white/10 text-white/70 hover:bg-white/20'
                }`}
              >
                ⚔️ Übersicht
              </button>
              <button
                onClick={() => setActiveTab('skills')}
                className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                  activeTab === 'skills'
                    ? 'bg-primary-600 text-white'
                    : 'bg-white/10 text-white/70 hover:bg-white/20'
                }`}
              >
                🎯 Fertigkeiten
              </button>
              <button
                onClick={() => setActiveTab('equipment')}
                className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                  activeTab === 'equipment'
                    ? 'bg-primary-600 text-white'
                    : 'bg-white/10 text-white/70 hover:bg-white/20'
                }`}
              >
                🎒 Ausrüstung
              </button>
            </>
          )}
          <button
            onClick={() => setActiveTab('journal')}
            className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
              activeTab === 'journal'
                ? 'bg-primary-600 text-white'
                : 'bg-white/10 text-white/70 hover:bg-white/20'
            }`}
          >
            📖 Gruppentagebuch
          </button>
          <button
            onClick={() => setActiveTab('images')}
            className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
              activeTab === 'images'
                ? 'bg-primary-600 text-white'
                : 'bg-white/10 text-white/70 hover:bg-white/20'
            }`}
          >
            🖼️ Bilder ({sharedImages.length})
          </button>
        </div>

        {/* Characters List Tab */}
        {activeTab === 'characters' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-white">Meine Charaktere</h2>
              <button
                onClick={() => setShowCharacterCreation(true)}
                className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-2 rounded-lg font-semibold transition-colors"
              >
                + Neuen Charakter erstellen
              </button>
            </div>

            {playerCharacters.length === 0 ? (
              <div className="bg-white/10 backdrop-blur-lg rounded-xl p-8 border border-white/20 text-center">
                <p className="text-white/70 mb-4">
                  Du hast noch keine Charaktere erstellt.
                </p>
                <button
                  onClick={() => setShowCharacterCreation(true)}
                  className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-2 rounded-lg font-semibold transition-colors"
                >
                  Ersten Charakter erstellen
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {playerCharacters.map((character) => (
                  <div
                    key={character.id}
                    className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20 hover:border-primary-400 transition-colors cursor-pointer"
                    onClick={() => handleCharacterSelect(character)}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="text-xl font-bold text-white mb-1">
                          {character.name}
                        </h3>
                        {character.createdDate && (
                          <p className="text-white/60 text-sm">
                            Erstellt: {new Date(character.createdDate).toLocaleDateString('de-DE')}
                          </p>
                        )}
                        {character.lastPlayedDate && (
                          <p className="text-white/60 text-sm">
                            Zuletzt gespielt: {new Date(character.lastPlayedDate).toLocaleDateString('de-DE')}
                          </p>
                        )}
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleCharacterDelete(character.id)
                        }}
                        className="text-red-400 hover:text-red-300 p-2"
                        title="Charakter löschen"
                      >
                        🗑️
                      </button>
                    </div>
                    <div className="text-white/70 text-sm mb-2">
                      <p>Attribute: {Object.keys(character.attributes).length}</p>
                      <p>Fertigkeiten: {character.skills.length}</p>
                      <p>Inventar: {character.inventory.length} Gegenstände</p>
                    </div>
                    <div className="mt-4 pt-4 border-t border-white/20">
                      <p className="text-white/50 text-xs">
                        💡 Hinweis: Gelöschte Charaktere können vom Spielleiter wiederhergestellt werden.
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Character Detail Tab - Übersichtsseite */}
        {activeTab === 'character' && selectedCharacter && (
          <div className="space-y-6">
            {/* Header mit Charaktername, Rasse, Klasse */}
            <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-3xl font-bold text-white mb-2">
                    {selectedCharacter.name}
                  </h2>
                  <div className="text-white/70 text-lg space-y-1">
                    {selectedCharacter.race && (
                      <p><span className="font-semibold">Rasse:</span> {selectedCharacter.race}</p>
                    )}
                    {selectedCharacter.className && (
                      <p><span className="font-semibold">Klasse:</span> {selectedCharacter.className}</p>
                    )}
                    {selectedCharacter.alignment && (() => {
                      const { getAlignment } = require('@/lib/alignments')
                      const alignment = getAlignment(selectedCharacter.alignment.row, selectedCharacter.alignment.col)
                      return alignment ? (
                        <p>
                          <span className="font-semibold">Gesinnung:</span> {alignment.name}
                          {alignment.nameEnglish && (
                            <span className="text-white/60 text-sm ml-2">({alignment.nameEnglish})</span>
                          )}
                        </p>
                      ) : null
                    })()}
                  </div>
                </div>
                <button
                  onClick={() => setActiveTab('characters')}
                  className="text-white/70 hover:text-white"
                >
                  ← Zurück zur Übersicht
                </button>
              </div>
              
              {/* Trefferpunkte */}
              <div className="mt-4 p-4 rounded-lg border bg-white/5 border-white/10">
                <h3 className="text-white font-semibold mb-2">Trefferpunkte (HP)</h3>
                <div className="flex items-center gap-4">
                  <div className="text-lg text-white">
                    <span className="font-mono text-3xl">
                      {selectedCharacter.currentHP !== undefined ? selectedCharacter.currentHP : calculateHitPoints(selectedCharacter)}
                    </span>
                    <span className="text-white/70 text-sm ml-2">
                      / {selectedCharacter.maxHP !== undefined ? selectedCharacter.maxHP : calculateHitPoints(selectedCharacter)}
                    </span>
                  </div>
                  <button
                    onClick={() => {
                      const characters = getCharacters()
                      const updated = characters.map((char) => {
                        if (char.id === selectedCharacter.id) {
                          const maxHP = char.maxHP || calculateHitPoints(char)
                          const currentHP = char.currentHP !== undefined ? char.currentHP : maxHP
                          return {
                            ...char,
                            currentHP: Math.max(0, currentHP - 1),
                            maxHP: maxHP,
                          }
                        }
                        return char
                      })
                      saveCharacters(updated)
                      loadData()
                    }}
                    className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-sm"
                  >
                    -1
                  </button>
                  <button
                    onClick={() => {
                      const characters = getCharacters()
                      const updated = characters.map((char) => {
                        if (char.id === selectedCharacter.id) {
                          const maxHP = char.maxHP || calculateHitPoints(char)
                          const currentHP = char.currentHP !== undefined ? char.currentHP : maxHP
                          return {
                            ...char,
                            currentHP: Math.min(maxHP, currentHP + 1),
                            maxHP: maxHP,
                          }
                        }
                        return char
                      })
                      saveCharacters(updated)
                      loadData()
                    }}
                    className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded text-sm"
                  >
                    +1
                  </button>
                </div>
              </div>

              {/* Verwundungen */}
              <div className="mt-4 p-4 rounded-lg border bg-white/5 border-white/10">
                <h3 className="text-white font-semibold mb-2">Verwundungen</h3>
                {selectedCharacter.wounds && selectedCharacter.wounds.length > 0 ? (
                  <ul className="list-disc list-inside text-white/70 space-y-1 mb-2">
                    {selectedCharacter.wounds.map((wound, idx) => (
                      <li key={idx} className="flex items-center justify-between">
                        <span>{wound}</span>
                        <button
                          onClick={() => {
                            const characters = getCharacters()
                            const updated = characters.map((char) => {
                              if (char.id === selectedCharacter.id) {
                                return {
                                  ...char,
                                  wounds: (char.wounds || []).filter((_, i) => i !== idx),
                                }
                              }
                              return char
                            })
                            saveCharacters(updated)
                            loadData()
                          }}
                          className="ml-2 text-red-400 hover:text-red-300 text-sm"
                        >
                          ×
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-white/60 mb-2">Keine Verwundungen</p>
                )}
                <input
                  type="text"
                  placeholder="Verwundung hinzufügen..."
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                      const characters = getCharacters()
                      const updated = characters.map((char) => {
                        if (char.id === selectedCharacter.id) {
                          return {
                            ...char,
                            wounds: [...(char.wounds || []), e.currentTarget.value.trim()],
                          }
                        }
                        return char
                      })
                      saveCharacters(updated)
                      e.currentTarget.value = ''
                      loadData()
                    }
                  }}
                  className="w-full px-3 py-2 rounded bg-white/10 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-primary-400"
                />
              </div>

              {/* Punkte-Status (immer neu berechnet) */}
              {(() => {
                const settings = getCharacterCreationSettings()
                const pointsStatus = calculateCharacterPoints(selectedCharacter)
                const hasRemainingPoints = pointsStatus.remainingAttributePoints > 0 || 
                                          pointsStatus.remainingSkillPoints > 0 || 
                                          pointsStatus.remainingBlibs > 0
                return (
                  <div className={`mt-4 p-4 rounded-lg border ${
                    hasRemainingPoints
                      ? 'bg-green-600/20 border-green-600'
                      : 'bg-white/5 border-white/10'
                  }`}>
                    <h3 className="text-white font-semibold mb-2">Punkte-Status</h3>
                    <div className="text-sm text-white/70 space-y-1">
                      <p>
                        Attributspunkte: {pointsStatus.usedAttributePoints} / {settings.maxAttributePoints}
                        {pointsStatus.remainingAttributePoints > 0 && (
                          <span className="text-green-400 ml-2">
                            ({pointsStatus.remainingAttributePoints} übrig)
                          </span>
                        )}
                      </p>
                      <p>
                        Fertigkeitspunkte: {pointsStatus.usedSkillPoints} / {settings.maxSkillPoints}
                        {pointsStatus.remainingSkillPoints > 0 && (
                          <span className="text-green-400 ml-2">
                            ({pointsStatus.remainingSkillPoints} übrig)
                          </span>
                        )}
                      </p>
                      <p>
                        Blibs: {pointsStatus.usedBlibs} / {settings.maxBlibs}
                        {pointsStatus.remainingBlibs > 0 && (
                          <span className="text-green-400 ml-2">
                            ({pointsStatus.remainingBlibs} übrig)
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                )
              })()}
            </div>

            {/* Waffen */}
            {(() => {
              const weapons = selectedCharacter.inventory.filter(item => 
                item.category === 'weapon' || 
                item.name.toLowerCase().includes('waffe') || 
                item.name.toLowerCase().includes('schwert') ||
                item.name.toLowerCase().includes('dolch') ||
                item.name.toLowerCase().includes('bogen') ||
                item.name.toLowerCase().includes('hammer') ||
                item.name.toLowerCase().includes('stab')
              )
              if (weapons.length === 0) return null
              return (
                <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
                  <h2 className="text-2xl font-bold text-white mb-4">⚔️ Waffen</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {weapons.map((item) => (
                      <div
                        key={item.id}
                        className="bg-white/5 rounded-lg p-4 border border-white/10"
                      >
                        <h3 className="font-semibold text-white">
                          {item.name}
                          {item.quantity && item.quantity > 1 && (
                            <span className="text-white/60 ml-2">x{item.quantity}</span>
                          )}
                        </h3>
                        {item.description && (
                          <p className="text-white/70 text-sm mt-1">{item.description}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )
            })()}

            {/* Bekleidung / Rüstung */}
            {(() => {
              const armor = selectedCharacter.inventory.filter(item => 
                item.category === 'armor' || 
                item.name.toLowerCase().includes('rüstung') || 
                item.name.toLowerCase().includes('panzer') ||
                item.name.toLowerCase().includes('schild') ||
                item.name.toLowerCase().includes('helm') ||
                item.name.toLowerCase().includes('brustpanzer')
              )
              if (armor.length === 0) return null
              return (
                <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
                  <h2 className="text-2xl font-bold text-white mb-4">🛡️ Bekleidung / Rüstung</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {armor.map((item) => (
                      <div
                        key={item.id}
                        className="bg-white/5 rounded-lg p-4 border border-white/10"
                      >
                        <h3 className="font-semibold text-white">
                          {item.name}
                          {item.quantity && item.quantity > 1 && (
                            <span className="text-white/60 ml-2">x{item.quantity}</span>
                          )}
                        </h3>
                        {item.description && (
                          <p className="text-white/70 text-sm mt-1">{item.description}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )
            })()}

            {/* Passende Kampffertigkeiten */}
            {(() => {
              const combatSkills = selectedCharacter.skills.filter(skill => 
                skill.name === 'unbewaffneter Kampf' ||
                skill.name === 'bewaffneter Nahkampf' ||
                skill.name === 'Fernkampf'
              )
              if (combatSkills.length === 0) return null
              return (
                <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
                  <h2 className="text-2xl font-bold text-white mb-4">⚔️ Kampffertigkeiten</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {combatSkills.map((skill) => {
                      const attributeValue = selectedCharacter.attributes[skill.attribute] || '1D'
                      const isLearned = skill.bonusDice > 0 || (skill.specializations && skill.specializations.some(s => s.blibs > 0))
                      const skillBlibs = skill.specializations?.reduce((sum, s) => sum + s.blibs, 0) || 0
                      const skillDiceFormula = calculateSkillValue(
                        attributeValue,
                        skill.bonusDice,
                        skillBlibs,
                        skill.isWeakened,
                        isLearned
                      )
                      return (
                        <div
                          key={skill.id}
                          className="bg-white/5 rounded-lg p-4 border border-white/10"
                        >
                          <h3 className="font-semibold text-white">{skill.name}</h3>
                          <p className="text-white/70 text-sm mt-1">
                            Attribut: {skill.attribute} ({formatD6Value(attributeValue)})
                          </p>
                          <p className="text-white/70 text-sm">
                            Fertigkeit: {formatD6Value(skillDiceFormula)}
                          </p>
                          {skill.specializations && skill.specializations.length > 0 && (
                            <p className="text-white/60 text-xs mt-1">
                              Spezialisierungen: {skill.specializations.map(s => s.name).join(', ')}
                            </p>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })()}

            {/* Ausrüstung / Gepäck */}
            {(() => {
              const equipment = selectedCharacter.inventory.filter(item => 
                item.category !== 'weapon' && 
                item.category !== 'armor' &&
                !item.name.toLowerCase().includes('waffe') && 
                !item.name.toLowerCase().includes('schwert') &&
                !item.name.toLowerCase().includes('dolch') &&
                !item.name.toLowerCase().includes('bogen') &&
                !item.name.toLowerCase().includes('hammer') &&
                !item.name.toLowerCase().includes('stab') &&
                !item.name.toLowerCase().includes('rüstung') && 
                !item.name.toLowerCase().includes('panzer') &&
                !item.name.toLowerCase().includes('schild') &&
                !item.name.toLowerCase().includes('helm') &&
                !item.name.toLowerCase().includes('brustpanzer')
              )
              if (equipment.length === 0) return null
              return (
                <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
                  <h2 className="text-2xl font-bold text-white mb-4">🎒 Ausrüstung / Gepäck</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {equipment.map((item) => (
                      <div
                        key={item.id}
                        className="bg-white/5 rounded-lg p-4 border border-white/10"
                      >
                        <h3 className="font-semibold text-white">
                          {item.name}
                          {item.quantity && item.quantity > 1 && (
                            <span className="text-white/60 ml-2">x{item.quantity}</span>
                          )}
                        </h3>
                        {item.description && (
                          <p className="text-white/70 text-sm mt-1">{item.description}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )
            })()}
          </div>
        )}

        {/* Skills Tab - Fertigkeiten-Seite */}
        {activeTab === 'skills' && selectedCharacter && (
          <div className="space-y-6">
            <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-white">
                  🎯 Fertigkeiten: {selectedCharacter.name}
                </h2>
                <button
                  onClick={() => setActiveTab('character')}
                  className="text-white/70 hover:text-white"
                >
                  ← Zurück zur Übersicht
                </button>
              </div>

              {/* Alle Fertigkeiten gruppiert nach Attribut */}
              <div className="space-y-6">
                {Object.keys(selectedCharacter.attributes).map((attribute) => {
                  const skillsForAttribute = selectedCharacter.skills.filter(
                    skill => skill.attribute === attribute
                  )
                  
                  if (skillsForAttribute.length === 0) return null

                  const attributeValue = selectedCharacter.attributes[attribute] || '1D'

                  return (
                    <div key={attribute} className="bg-white/5 rounded-lg p-4 border border-white/10">
                      <h3 className="text-xl font-bold text-white mb-3">
                        {attribute} ({formatD6Value(attributeValue)})
                      </h3>
                      <div className="space-y-2">
                        {skillsForAttribute.map((skill) => {
                          const isLearned = skill.bonusDice > 0 || (skill.specializations && skill.specializations.some(s => s.blibs > 0))
                          const skillBlibs = skill.specializations?.reduce((sum, s) => sum + s.blibs, 0) || 0
                          const skillDiceFormula = calculateSkillValue(
                            attributeValue,
                            skill.bonusDice,
                            skillBlibs,
                            skill.isWeakened,
                            isLearned
                          )

                          return (
                            <div key={skill.id} className="space-y-2">
                              {/* Hauptfertigkeit */}
                              <button
                                onClick={() => setSelectedSkillForRoll({ skill })}
                                className="w-full text-left bg-white/10 hover:bg-white/20 rounded-lg p-4 border border-white/20 transition-colors"
                              >
                                <div className="flex items-center justify-between">
                                  <div>
                                    <div className="font-semibold text-white text-lg">
                                      {skill.name}
                                    </div>
                                    <div className="text-white/70 text-sm mt-1">
                                      {formatD6Value(skillDiceFormula)}
                                      {skill.isWeakened && !isLearned && (
                                        <span className="text-yellow-400 ml-2">(geschwächt)</span>
                                      )}
                                    </div>
                                  </div>
                                  <div className="text-2xl">🎲</div>
                                </div>
                              </button>

                              {/* Spezialisierungen */}
                              {skill.specializations && skill.specializations.length > 0 && (
                                <div className="ml-6 space-y-2">
                                  {skill.specializations.map((spec) => {
                                    const specBlibs = spec.blibs
                                    const specDiceFormula = calculateSkillValue(
                                      attributeValue,
                                      skill.bonusDice,
                                      specBlibs,
                                      skill.isWeakened,
                                      isLearned
                                    )
                                    return (
                                      <button
                                        key={spec.id}
                                        onClick={() => setSelectedSkillForRoll({ skill, specialization: spec })}
                                        className="w-full text-left bg-white/5 hover:bg-white/15 rounded-lg p-3 border border-white/10 transition-colors"
                                      >
                                        <div className="flex items-center justify-between">
                                          <div>
                                            <div className="font-semibold text-white">
                                              {spec.name}
                                            </div>
                                            <div className="text-white/70 text-sm mt-1">
                                              {formatD6Value(specDiceFormula)}
                                              {specBlibs > 0 && (
                                                <span className="text-yellow-400 ml-2">
                                                  ({specBlibs} Blibs)
                                                </span>
                                              )}
                                            </div>
                                          </div>
                                          <div className="text-xl">🎲</div>
                                        </div>
                                      </button>
                                    )
                                  })}
                                </div>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )}

        {/* Equipment Tab */}
        {activeTab === 'equipment' && selectedCharacter && (
          <div className="space-y-6">
            <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-white">
                  🎒 Ausrüstung: {selectedCharacter.name}
                </h2>
                <button
                  onClick={() => setActiveTab('character')}
                  className="text-white/70 hover:text-white"
                >
                  ← Zurück zum Charakter
                </button>
              </div>

              {/* Neuen Gegenstand hinzufügen */}
              <div className="mb-6 p-4 bg-white/5 rounded-lg border border-white/10">
                <h3 className="text-lg font-semibold text-white mb-3">Neuen Gegenstand hinzufügen</h3>
                <div className="space-y-3">
                  <input
                    type="text"
                    placeholder="Gegenstandsname"
                    id="newItemName"
                    className="w-full px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-primary-400"
                  />
                  <textarea
                    placeholder="Beschreibung (optional)"
                    id="newItemDescription"
                    rows={2}
                    className="w-full px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-primary-400"
                  />
                  <div className="flex items-center gap-4">
                    <input
                      type="number"
                      placeholder="Anzahl (optional)"
                      id="newItemQuantity"
                      min="1"
                      className="w-32 px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-primary-400"
                    />
                    <button
                      onClick={() => {
                        const nameInput = document.getElementById('newItemName') as HTMLInputElement
                        const descInput = document.getElementById('newItemDescription') as HTMLTextAreaElement
                        const qtyInput = document.getElementById('newItemQuantity') as HTMLInputElement
                        
                        if (nameInput && nameInput.value.trim()) {
                          addItemToCharacter({
                            name: nameInput.value.trim(),
                            description: descInput?.value.trim() || undefined,
                            quantity: qtyInput?.value ? parseInt(qtyInput.value) : undefined,
                          })
                          
                          // Felder leeren
                          nameInput.value = ''
                          if (descInput) descInput.value = ''
                          if (qtyInput) qtyInput.value = ''
                        }
                      }}
                      className="px-6 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-semibold transition-colors"
                    >
                      Hinzufügen
                    </button>
                  </div>
                </div>
              </div>

              {/* Gegenstände-Liste */}
              <div>
                <h3 className="text-lg font-semibold text-white mb-3">
                  Inventar ({selectedCharacter.inventory.length} Gegenstände)
                </h3>
                {selectedCharacter.inventory.length === 0 ? (
                  <div className="bg-white/5 rounded-lg p-8 border border-white/10 text-center">
                    <p className="text-white/70">Noch keine Gegenstände im Inventar.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {selectedCharacter.inventory.map((item) => (
                      <div
                        key={item.id}
                        className="bg-white/5 rounded-lg p-4 border border-white/10"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className="font-semibold text-white">
                              {item.name}
                              {item.quantity && item.quantity > 1 && (
                                <span className="text-white/60 ml-2">
                                  x{item.quantity}
                                </span>
                              )}
                            </h4>
                            {item.description && (
                              <p className="text-white/70 text-sm mt-1">
                                {item.description}
                              </p>
                            )}
                          </div>
                          <button
                            onClick={() => {
                              if (confirm(`Möchtest du "${item.name}" wirklich entfernen?`)) {
                                removeItemFromCharacter(item.id)
                              }
                            }}
                            className="ml-2 text-red-400 hover:text-red-300 p-1"
                            title="Gegenstand entfernen"
                          >
                            🗑️
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Journal Tab */}
        {activeTab === 'journal' && (
          <div className="space-y-6">
            {/* Neue Eintrag hinzufügen */}
            <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
              <h2 className="text-2xl font-bold text-white mb-4">
                {editingEntry ? 'Eintrag bearbeiten' : 'Neuer Eintrag'}
              </h2>
              <div className="space-y-4">
                {/* Tageszeit */}
                <div className="flex items-center gap-3">
                  <label className="text-white/90 w-24">Tageszeit:</label>
                  <select
                    value={selectedTimeOfDay}
                    onChange={(e) => setSelectedTimeOfDay(e.target.value)}
                    className="flex-1 px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white focus:outline-none focus:ring-2 focus:ring-primary-400"
                  >
                    {TIMES_OF_DAY.map(time => (
                      <option key={time} value={time} className="bg-slate-800">
                        {time}
                      </option>
                    ))}
                  </select>
                </div>
                
                {/* Text-Eingabe (Titel: Inhalt Format) */}
                <textarea
                  placeholder="Titel: Inhalt... (z.B. 'Begegnung: Wir trafen einen Händler auf dem Markt')"
                  value={newJournalEntry.content}
                  onChange={(e) =>
                    setNewJournalEntry({ ...newJournalEntry, content: e.target.value })
                  }
                  rows={4}
                  className="w-full px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-primary-400"
                />
                
                <div className="flex gap-3">
                  <button
                    onClick={handleAddJournalEntry}
                    className="flex-1 bg-primary-600 hover:bg-primary-700 text-white px-6 py-2 rounded-lg font-semibold transition-colors"
                  >
                    {editingEntry ? 'Speichern' : 'Eintrag hinzufügen'}
                  </button>
                  {editingEntry && (
                    <button
                      onClick={() => {
                        setEditingEntry(null)
                        setNewJournalEntry({ title: '', content: '' })
                        setSelectedTimeOfDay('Mittag')
                      }}
                      className="px-6 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg font-semibold transition-colors"
                    >
                      Abbrechen
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Einträge */}
            <div className="space-y-4">
              {journalEntries
                .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
                .map((entry) => {
                  const fantasyDate = entry.fantasyDate 
                    ? formatFantasyDate(entry.fantasyDate, true)
                    : entry.timestamp 
                      ? formatFantasyDate(realDateToFantasyDate(entry.timestamp), true)
                      : null
                  const specialEvent = entry.fantasyDate ? getSpecialEvent(entry.fantasyDate) : null
                  const monthInfo = entry.fantasyDate ? getMonthInfo(entry.fantasyDate.month) : null
                  
                  return (
                    <div
                      key={entry.id}
                      className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <p className="text-white text-lg">
                            <span className="font-bold">{entry.title}:</span> {entry.content}
                          </p>
                        </div>
                        <div className="text-right ml-4">
                          {fantasyDate && (
                            <div className="text-white/90 text-sm font-semibold mb-1">
                              {fantasyDate}
                            </div>
                          )}
                          <span className="text-white/60 text-xs">
                            {entry.timestamp.toLocaleDateString('de-DE')}
                          </span>
                        </div>
                      </div>
                      {monthInfo && (
                        <div className="mb-2 p-2 bg-white/5 rounded border border-white/10">
                          <div className="text-white/80 text-sm">
                            <span className="font-semibold">{monthInfo.name}:</span> {monthInfo.meaning}
                          </div>
                          {monthInfo.special && (
                            <div className="text-white/70 text-xs mt-1">
                              💡 {monthInfo.special}
                            </div>
                          )}
                        </div>
                      )}
                      {specialEvent && (
                        <div className="mb-2 p-3 bg-yellow-600/20 rounded border border-yellow-600/50">
                          <div className="text-yellow-300 font-bold text-sm mb-1">
                            ✨ {specialEvent.name}
                          </div>
                          <div className="text-yellow-200 text-xs">
                            {specialEvent.description}
                          </div>
                        </div>
                      )}
                      <div className="flex items-center justify-between">
                        <p className="text-white/80">Von: {entry.author}</p>
                        {/* Nur eigene Einträge können bearbeitet werden */}
                        {entry.author === (typeof window !== 'undefined' ? localStorage.getItem('playerName') : '') && (
                          <div className="flex gap-2">
                            <button
                              onClick={() => {
                                setEditingEntry(entry)
                                setNewJournalEntry({ 
                                  title: entry.title, 
                                  content: `${entry.title}: ${entry.content}` 
                                })
                                setSelectedTimeOfDay(entry.timeOfDay || 'Mittag')
                                // Scrolle zum Formular
                                window.scrollTo({ top: 0, behavior: 'smooth' })
                              }}
                              className="px-3 py-1 bg-blue-600/50 hover:bg-blue-700/70 text-white rounded text-sm transition-colors"
                            >
                              ✏️ Bearbeiten
                            </button>
                            <button
                              onClick={async () => {
                                if (confirm('Möchtest du diesen Eintrag wirklich löschen?')) {
                                  const updatedEntries = journalEntries.filter(e => e.id !== entry.id)
                                  setJournalEntries(updatedEntries)
                                  localStorage.setItem('journalEntries', JSON.stringify(updatedEntries))
                                }
                              }}
                              className="px-3 py-1 bg-red-600/50 hover:bg-red-700/70 text-white rounded text-sm transition-colors"
                            >
                              🗑️ Löschen
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
            </div>
          </div>
        )}

        {/* Images Tab */}
        {activeTab === 'images' && (
          <div className="space-y-4">
            {sharedImages.length === 0 ? (
              <div className="bg-white/10 backdrop-blur-lg rounded-xl p-8 border border-white/20 text-center">
                <p className="text-white/70">
                  Noch keine Bilder vom Spielleiter erhalten.
                </p>
              </div>
            ) : (
              sharedImages.map((image) => (
                <div
                  key={image.id}
                  className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20"
                >
                  {image.title && (
                    <h3 className="text-xl font-bold text-white mb-2">
                      {image.title}
                    </h3>
                  )}
                  {image.description && (
                    <p className="text-white/80 mb-4">{image.description}</p>
                  )}
                  <div className="bg-black/20 rounded-lg p-4 border border-white/10">
                    <img
                      src={image.url}
                      alt={image.title || 'Geteiltes Bild'}
                      className="max-w-full h-auto rounded-lg"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement
                        target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="300"%3E%3Crect fill="%23333" width="400" height="300"/%3E%3Ctext fill="%23999" font-family="sans-serif" font-size="20" x="50%25" y="50%25" text-anchor="middle" dy=".3em"%3EBild nicht verfügbar%3C/text%3E%3C/svg%3E'
                      }}
                    />
                  </div>
                  <p className="text-white/60 text-sm mt-2">
                    Von {image.sentBy} am{' '}
                    {image.timestamp.toLocaleDateString('de-DE')}
                  </p>
                </div>
              ))
            )}
          </div>
        )}

        {/* Skill Dice Roller Modal */}
        {selectedSkillForRoll && selectedCharacter && (
          <SkillDiceRoller
            character={selectedCharacter}
            skill={selectedSkillForRoll.skill}
            specialization={selectedSkillForRoll.specialization}
            onClose={() => setSelectedSkillForRoll(null)}
          />
        )}
      </div>
    </div>
  )
}
