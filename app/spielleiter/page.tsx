'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Character, JournalEntry, SharedImage, DiceRoll, DeletedCharacter, Skill, CharacterCreationSettings } from '@/types'
import {
  getCharacters,
  saveCharacters,
  getJournalEntries,
  saveJournalEntry,
  getSharedImages,
  saveSharedImage,
  getDiceRolls,
  getDeletedCharacters,
  restoreCharacter,
  getAvailableSkills,
  saveAvailableSkills,
  addSkill,
  removeSkill,
  updateSkill,
  getCharacterCreationSettings,
  saveCharacterCreationSettings,
  calculateCharacterPoints,
  calculateHitPoints,
} from '@/lib/data'
import { getGroupSettings, getGroupMembers, removePlayerFromGroup } from '@/lib/supabase-data'
import DiceRoller from '@/components/DiceRoller'
import AlignmentSelector from '@/components/AlignmentSelector'
import { calculateSkillValue } from '@/lib/skills'
import { formatD6Value } from '@/lib/dice'
import { realDateToFantasyDate, formatFantasyDate, getSpecialEvent, getMonthInfo, getWeekdayInfo, TIMES_OF_DAY } from '@/lib/fantasy-calendar'
import FantasyCalendarStartDate from '@/components/FantasyCalendarStartDate'

export default function SpielleiterPage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<'overview' | 'deleted' | 'journal' | 'images' | 'skills' | 'settings'>('overview')
  const [characters, setCharacters] = useState<Character[]>([])
  const [deletedCharacters, setDeletedCharacters] = useState<DeletedCharacter[]>([])
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>([])
  const [sharedImages, setSharedImages] = useState<SharedImage[]>([])
  const [diceRolls, setDiceRolls] = useState<DiceRoll[]>([])
  const [newJournalEntry, setNewJournalEntry] = useState({ title: '', content: '' })
  const [selectedTimeOfDay, setSelectedTimeOfDay] = useState<string>('Mittag')
  const [newImage, setNewImage] = useState({ title: '', description: '', url: '' })
  const [availableSkills, setAvailableSkills] = useState<Skill[]>([])
  const [newSkill, setNewSkill] = useState({ name: '', attribute: 'Reflexe', isWeakened: false })
  const [settings, setSettings] = useState<CharacterCreationSettings>(getCharacterCreationSettings())
  const [hiddenCharacters, setHiddenCharacters] = useState<Set<string>>(new Set())
  const [groupMembers, setGroupMembers] = useState<any[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [groupId, setGroupId] = useState<string | null>(null)

  useEffect(() => {
    if (typeof window === 'undefined') return
    setGroupId(localStorage.getItem('groupId'))
    if (typeof window === 'undefined') return
    
    const role = localStorage.getItem('userRole')
    const name = localStorage.getItem('playerName')
    const groupId = localStorage.getItem('groupId')
    
    if (role !== 'spielleiter' || !name || !groupId) {
      router.push('/')
      return
    }

    // Validiere Gruppen-Mitgliedschaft beim Laden
    validateGroupAccess(groupId, name, role)
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
    setCharacters(getCharacters())
    setDeletedCharacters(getDeletedCharacters())
    const entries = await getJournalEntries()
    setJournalEntries(entries)
    setSharedImages(getSharedImages())
    setDiceRolls(getDiceRolls())
    setAvailableSkills(getAvailableSkills())
    setSettings(getCharacterCreationSettings())
    
    // Lade Gruppenmitglieder
    if (groupId) {
      const members = await getGroupMembers(groupId)
      setGroupMembers(members)
    }
  }

  const handleRestoreCharacter = (characterId: string) => {
    if (restoreCharacter(characterId)) {
      loadData()
    }
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      const url = event.target?.result as string
      setNewImage({ ...newImage, url })
    }
    reader.readAsDataURL(file)
  }

  const handleShareImage = () => {
    if (!newImage.url.trim()) {
      alert('Bitte wähle ein Bild aus oder gib eine URL ein')
      return
    }

    const image: SharedImage = {
      id: Date.now().toString(),
      url: newImage.url,
      title: newImage.title || undefined,
      description: newImage.description || undefined,
      sentBy: 'Spielleiter',
      timestamp: new Date(),
    }

    const images = [...sharedImages, image]
    setSharedImages(images)
    saveSharedImage(image)
    setNewImage({ title: '', description: '', url: '' })
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleAddJournalEntry = async () => {
    if (!newJournalEntry.title.trim() || !newJournalEntry.content.trim()) return

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

    const entry: JournalEntry = {
      id: Date.now().toString(),
      author: 'Spielleiter',
      title: newJournalEntry.title,
      content: newJournalEntry.content,
      timestamp: now,
      fantasyDate,
      timeOfDay: selectedTimeOfDay as any,
    }

    const entries = [...journalEntries, entry]
    setJournalEntries(entries)
    await saveJournalEntry(entry)
    setNewJournalEntry({ title: '', content: '' })
  }

  const updateCharacterAttribute = (
    characterId: string,
    attribute: string,
    diceFormula: string
  ) => {
    const updated = characters.map((char) => {
      if (char.id === characterId) {
        return {
          ...char,
          attributes: {
            ...char.attributes,
            [attribute]: diceFormula,
          },
        }
      }
      return char
    })
    setCharacters(updated)
    saveCharacters(updated)
  }

  const addItemToCharacter = (characterId: string, item: { name: string; description?: string; quantity?: number }) => {
    const updated = characters.map((char) => {
      if (char.id === characterId) {
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
    setCharacters(updated)
    saveCharacters(updated)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-white mb-1">
              👑 Spielleiter-Übersicht
            </h1>
            <p className="text-white/70">
              {characters.length} Spieler • {diceRolls.length} Würfelwürfe
            </p>
          </div>
          <button
            onClick={() => {
              localStorage.removeItem('userRole')
              router.push('/')
            }}
            className="text-white/70 hover:text-white"
          >
            Abmelden
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
              activeTab === 'overview'
                ? 'bg-primary-600 text-white'
                : 'bg-white/10 text-white/70 hover:bg-white/20'
            }`}
          >
            👥 Übersicht
          </button>
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
            onClick={() => setActiveTab('deleted')}
            className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
              activeTab === 'deleted'
                ? 'bg-primary-600 text-white'
                : 'bg-white/10 text-white/70 hover:bg-white/20'
            }`}
          >
            🗑️ Gelöschte Charaktere ({deletedCharacters.length})
          </button>
          <button
            onClick={() => setActiveTab('images')}
            className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
              activeTab === 'images'
                ? 'bg-primary-600 text-white'
                : 'bg-white/10 text-white/70 hover:bg-white/20'
            }`}
          >
            🖼️ Bilder senden
          </button>
          <button
            onClick={() => setActiveTab('skills')}
            className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
              activeTab === 'skills'
                ? 'bg-primary-600 text-white'
                : 'bg-white/10 text-white/70 hover:bg-white/20'
            }`}
          >
            ⚔️ Fertigkeiten verwalten
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
              activeTab === 'settings'
                ? 'bg-primary-600 text-white'
                : 'bg-white/10 text-white/70 hover:bg-white/20'
            }`}
          >
            ⚙️ Einstellungen
          </button>
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* NPC hinzufügen */}
            <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
              <h2 className="text-2xl font-bold text-white mb-4">NPC hinzufügen</h2>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <input
                  type="text"
                  placeholder="NPC-Name"
                  id="npcName"
                  className="px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-primary-400"
                />
                <select
                  id="npcType"
                  className="px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white focus:outline-none focus:ring-2 focus:ring-primary-400"
                >
                  <option value="händler">Händler</option>
                  <option value="stadtwache">Stadtwache</option>
                  <option value="monster">Monster</option>
                  <option value="sonstiges">Sonstiges</option>
                </select>
                <button
                  onClick={() => {
                    const nameInput = document.getElementById('npcName') as HTMLInputElement
                    const typeInput = document.getElementById('npcType') as HTMLSelectElement
                    
                    if (nameInput && nameInput.value.trim()) {
                      const npc: Character = {
                        id: `npc-${Date.now()}`,
                        name: nameInput.value.trim(),
                        playerName: 'NPC',
                        isNPC: true,
                        npcType: typeInput.value as any,
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
                        level: 1,
                      }
                      const updated = [...characters, npc]
                      setCharacters(updated)
                      saveCharacters(updated)
                      nameInput.value = ''
                    }
                  }}
                  className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg font-semibold transition-colors"
                >
                  + NPC hinzufügen
                </button>
              </div>
            </div>

            {/* Fertigkeiten-Tabelle */}
            <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
              <h2 className="text-2xl font-bold text-white mb-4">Fertigkeiten-Übersicht</h2>
              <div className="overflow-x-auto max-h-[70vh] overflow-y-auto">
              {(() => {
                // Filtere nur Charaktere der aktuellen Gruppe
                const currentGroupId = groupId || (typeof window !== 'undefined' ? localStorage.getItem('groupId') : null)
                const groupCharacters = (groupId 
                  ? characters.filter(char => {
                      return true
                    })
                  : characters
                ).filter(char => !char.deletedDate)
                
                if (groupCharacters.length === 0) {
                  return <p className="text-white/70">Noch keine Charaktere in dieser Gruppe vorhanden.</p>
                }
                
                // Gruppiere Charaktere nach Spieler
                const charactersByPlayer = new Map<string, Character[]>()
                groupCharacters.forEach(char => {
                  const player = char.playerName
                  if (!charactersByPlayer.has(player)) {
                    charactersByPlayer.set(player, [])
                  }
                  charactersByPlayer.get(player)!.push(char)
                })
                
                // Erstelle flache Liste mit sichtbaren/versteckten Charakteren
                const visibleCharacters = groupCharacters.filter(char => !hiddenCharacters.has(char.id))
                const hiddenChars = groupCharacters.filter(char => hiddenCharacters.has(char.id))
                
                // Sammle alle Fertigkeiten aus allen Charakteren
                const allSkillsMap = new Map<string, Map<string, { character: Character; skill: any; specialization?: any; value: string }[]>>()
                
                groupCharacters.forEach(character => {
                  character.skills.forEach(skill => {
                    const attribute = skill.attribute
                    if (!allSkillsMap.has(attribute)) {
                      allSkillsMap.set(attribute, new Map())
                    }
                    const skillsMap = allSkillsMap.get(attribute)!
                    
                    // Hauptfertigkeit
                    const attributeValue = character.attributes[attribute] || '1D'
                    const isLearned = skill.bonusDice > 0 || (skill.specializations && skill.specializations.some((s: any) => s.blibs > 0))
                    const skillBlibs = skill.specializations?.reduce((sum: number, s: any) => sum + s.blibs, 0) || 0
                    const skillDiceFormula = calculateSkillValue(
                      attributeValue,
                      skill.bonusDice,
                      skillBlibs,
                      skill.isWeakened,
                      isLearned
                    )
                    
                    if (!skillsMap.has(skill.name)) {
                      skillsMap.set(skill.name, [])
                    }
                    skillsMap.get(skill.name)!.push({
                      character,
                      skill,
                      value: skillDiceFormula
                    })
                    
                    // Spezialisierungen
                    if (skill.specializations && skill.specializations.length > 0) {
                      skill.specializations.forEach((spec: any) => {
                        const specBlibs = spec.blibs
                        const specDiceFormula = calculateSkillValue(
                          attributeValue,
                          skill.bonusDice,
                          specBlibs,
                          skill.isWeakened,
                          isLearned
                        )
                        const specKey = `${skill.name} - ${spec.name}`
                        if (!skillsMap.has(specKey)) {
                          skillsMap.set(specKey, [])
                        }
                        skillsMap.get(specKey)!.push({
                          character,
                          skill,
                          specialization: spec,
                          value: specDiceFormula
                        })
                      })
                    }
                  })
                })
                
                if (allSkillsMap.size === 0) {
                  return <p className="text-white/70">Noch keine Fertigkeiten vorhanden.</p>
                }
                
                // Standard-Attribute in der richtigen Reihenfolge
                const STANDARD_ATTRIBUTES = ['Reflexe', 'Koordination', 'Stärke', 'Wissen', 'Wahrnehmung', 'Ausstrahlung', 'Magie']
                
                // Funktion zum Erstellen von Initialen
                const getInitials = (name: string) => {
                  return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2)
                }
                
                return (
                  <div className="space-y-6">
                    {STANDARD_ATTRIBUTES.map((attribute) => {
                      const skillsMap = allSkillsMap.get(attribute)
                      if (!skillsMap || skillsMap.size === 0) return null
                      
                      return (
                        <div key={attribute} className="mb-6">
                          <div className="overflow-x-auto">
                            <table className="w-full border-collapse">
                              <thead className="sticky top-0 z-20">
                                {/* Attribut-Zeile mit Spieler/Charakter nur einmal */}
                                <tr>
                                  <th className="bg-white/10 text-white text-left p-3 border border-white/20 sticky left-0 z-30 w-[200px]">
                                    {attribute}
                                  </th>
                                  {Array.from(charactersByPlayer.entries()).map(([playerName, playerChars]) => (
                                    playerChars.map((char, idx) => {
                                      const isHidden = hiddenCharacters.has(char.id)
                                      const colSpan = idx === 0 ? playerChars.length : 0
                                      
                                      if (idx > 0 && !isHidden) return null
                                      
                                      return (
                                        <th
                                          key={char.id}
                                          colSpan={idx === 0 && !isHidden ? playerChars.length : 1}
                                          className={`bg-white/10 text-white text-center p-3 border border-white/20 ${
                                            isHidden ? 'w-[60px]' : 'w-[140px]'
                                          }`}
                                        >
                                          {isHidden ? (
                                            <div className="flex flex-col items-center gap-1">
                                              <button
                                                onClick={() => {
                                                  const newHidden = new Set(hiddenCharacters)
                                                  newHidden.delete(char.id)
                                                  setHiddenCharacters(newHidden)
                                                }}
                                                className="text-white/70 hover:text-white text-lg"
                                                title="Einblenden"
                                              >
                                                +
                                              </button>
                                              <div className="text-xs font-semibold">
                                                {getInitials(char.name)}
                                              </div>
                                            </div>
                                          ) : (
                                            <>
                                              {idx === 0 && (
                                                <div className="text-xs text-white/70 mb-1">
                                                  {playerName}
                                                </div>
                                              )}
                                              <div className="flex items-center justify-center gap-2">
                                                <div className="flex-1">
                                                  <div className="font-mono text-lg">
                                                    {formatD6Value(char.attributes[attribute] || '1D')}
                                                  </div>
                                                  <div className="text-xs text-white/70 mt-1">
                                                    {char.name}
                                                  </div>
                                                </div>
                                                <button
                                                  onClick={() => {
                                                    const newHidden = new Set(hiddenCharacters)
                                                    newHidden.add(char.id)
                                                    setHiddenCharacters(newHidden)
                                                  }}
                                                  className="text-white/70 hover:text-white text-sm"
                                                  title="Ausblenden"
                                                >
                                                  ×
                                                </button>
                                              </div>
                                            </>
                                          )}
                                        </th>
                                      )
                                    })
                                  ))}
                                </tr>
                                {/* Fertigkeiten-Header */}
                                <tr>
                                  <th className="bg-white/5 text-white text-left p-2 border border-white/20 sticky left-0 z-30 w-[200px]">
                                    Fertigkeit
                                  </th>
                                  {visibleCharacters.map(char => (
                                    <th key={char.id} className="bg-white/5 text-white text-center p-2 border border-white/20 w-[140px]">
                                      {char.isNPC && (
                                        <span className="text-xs text-yellow-400">
                                          {char.npcType === 'händler' ? '🏪' : char.npcType === 'stadtwache' ? '🛡️' : char.npcType === 'monster' ? '👹' : '👤'}
                                        </span>
                                      )}
                                    </th>
                                  ))}
                                  {hiddenChars.map(char => (
                                    <th key={char.id} className="bg-white/5 text-white text-center p-2 border border-white/20 w-[60px]">
                                      <div className="text-xs font-semibold">
                                        {getInitials(char.name)}
                                      </div>
                                    </th>
                                  ))}
                                </tr>
                              </thead>
                              <tbody>
                                {Array.from(skillsMap.entries()).map(([skillName, entries]) => (
                                  <tr key={skillName} className="hover:bg-white/5">
                                    <td className="bg-white/5 text-white p-2 border border-white/20 sticky left-0 z-10 w-[200px]">
                                      {skillName}
                                    </td>
                                    {visibleCharacters.map(char => {
                                      const entry = entries.find(e => e.character.id === char.id)
                                      return (
                                        <td key={char.id} className="text-white text-center p-2 border border-white/20 w-[140px]">
                                          {entry ? (
                                            <div className="font-mono">
                                              {formatD6Value(entry.value)}
                                            </div>
                                          ) : (
                                            <span className="text-white/30">-</span>
                                          )}
                                        </td>
                                      )
                                    })}
                                    {hiddenChars.map(char => (
                                      <td key={char.id} className="text-white/30 text-center p-2 border border-white/20 w-[60px]">
                                        -
                                      </td>
                                    ))}
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )
              })()}
              </div>
            </div>

            {/* Charaktere-Übersicht */}
            <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
              <h2 className="text-2xl font-bold text-white mb-4">Charaktere-Übersicht</h2>
              <div className="overflow-x-auto max-h-[70vh] overflow-y-auto">
              {(() => {
                const currentGroupId = groupId || (typeof window !== 'undefined' ? localStorage.getItem('groupId') : null)
                const groupCharacters = (groupId 
                  ? characters.filter(char => {
                      return true
                    })
                  : characters
                ).filter(char => !char.deletedDate)
                
                if (groupCharacters.length === 0) {
                  return <p className="text-white/70">Noch keine Charaktere in dieser Gruppe vorhanden.</p>
                }
                
                // Gruppiere Charaktere nach Spieler
                const charactersByPlayer = new Map<string, Character[]>()
                groupCharacters.forEach(char => {
                  const player = char.playerName
                  if (!charactersByPlayer.has(player)) {
                    charactersByPlayer.set(player, [])
                  }
                  charactersByPlayer.get(player)!.push(char)
                })
                
                const visibleCharacters = groupCharacters.filter(char => !hiddenCharacters.has(char.id))
                const hiddenChars = groupCharacters.filter(char => hiddenCharacters.has(char.id))
                
                // Funktion zum Erstellen von Initialen
                const getInitials = (name: string) => {
                  return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2)
                }
                
                return (
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                      <thead className="sticky top-0 z-20 bg-slate-900">
                        <tr>
                          <th className="bg-white/10 text-white text-left p-3 border border-white/20 sticky left-0 z-30 w-[200px]">
                            Charakter
                          </th>
                          {Array.from(charactersByPlayer.entries()).map(([playerName, playerChars]) => (
                            playerChars.map((char, idx) => {
                              const isHidden = hiddenCharacters.has(char.id)
                              
                              if (idx > 0 && !isHidden) return null
                              
                              return (
                                <th
                                  key={char.id}
                                  colSpan={idx === 0 && !isHidden ? playerChars.filter(c => !hiddenCharacters.has(c.id)).length : 1}
                                  className={`bg-white/10 text-white text-center p-3 border border-white/20 ${
                                    isHidden ? 'w-[60px]' : 'w-[180px]'
                                  }`}
                                >
                                  {isHidden ? (
                                    <div className="flex flex-col items-center gap-1">
                                      <button
                                        onClick={() => {
                                          const newHidden = new Set(hiddenCharacters)
                                          newHidden.delete(char.id)
                                          setHiddenCharacters(newHidden)
                                        }}
                                        className="text-white/70 hover:text-white text-lg"
                                        title="Einblenden"
                                      >
                                        +
                                      </button>
                                      <div className="text-xs font-semibold">
                                        {getInitials(char.name)}
                                      </div>
                                    </div>
                                  ) : (
                                    <>
                                      {idx === 0 && (
                                        <div className="text-xs text-white/70 mb-1">
                                          {playerName}
                                        </div>
                                      )}
                                      <div className="flex items-center justify-center gap-2">
                                        <div className="flex-1">
                                          <div className="text-sm font-semibold">
                                            {char.name}
                                          </div>
                                          {char.isNPC && (
                                            <div className="text-xs text-yellow-400">
                                              {char.npcType === 'händler' ? '🏪' : char.npcType === 'stadtwache' ? '🛡️' : char.npcType === 'monster' ? '👹' : '👤'}
                                            </div>
                                          )}
                                        </div>
                                        <button
                                          onClick={() => {
                                            const newHidden = new Set(hiddenCharacters)
                                            newHidden.add(char.id)
                                            setHiddenCharacters(newHidden)
                                          }}
                                          className="text-white/70 hover:text-white text-sm"
                                          title="Ausblenden"
                                        >
                                          ×
                                        </button>
                                      </div>
                                    </>
                                  )}
                                </th>
                              )
                            })
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td className="bg-white/5 text-white p-2 border border-white/20 sticky left-0 z-10 w-[200px]">
                            Spieler
                          </td>
                          {visibleCharacters.map(char => (
                            <td key={char.id} className="text-white text-center p-2 border border-white/20 w-[180px]">
                              {char.playerName}
                            </td>
                          ))}
                          {hiddenChars.map(char => (
                            <td key={char.id} className="text-white/30 text-center p-2 border border-white/20 w-[60px]">
                              -
                            </td>
                          ))}
                        </tr>
                        <tr>
                          <td className="bg-white/5 text-white p-2 border border-white/20 sticky left-0 z-10 w-[200px]">
                            Klasse / Rasse
                          </td>
                          {visibleCharacters.map(char => (
                            <td key={char.id} className="text-white text-center p-2 border border-white/20 w-[180px]">
                              {char.className || '-'} / {char.race || '-'}
                            </td>
                          ))}
                          {hiddenChars.map(char => (
                            <td key={char.id} className="text-white/30 text-center p-2 border border-white/20 w-[60px]">
                              -
                            </td>
                          ))}
                        </tr>
                        <tr>
                          <td className="bg-white/5 text-white p-2 border border-white/20 sticky left-0 z-10 w-[200px]">
                            Level
                          </td>
                          {visibleCharacters.map(char => (
                            <td key={char.id} className="text-white text-center p-2 border border-white/20 w-[180px]">
                              {char.level || 1}
                            </td>
                          ))}
                          {hiddenChars.map(char => (
                            <td key={char.id} className="text-white/30 text-center p-2 border border-white/20 w-[60px]">
                              -
                            </td>
                          ))}
                        </tr>
                        <tr>
                          <td className="bg-white/5 text-white p-2 border border-white/20 sticky left-0 z-10 w-[200px]">
                            HP
                          </td>
                          {visibleCharacters.map(char => {
                            const hp = calculateHitPoints(char)
                            return (
                              <td key={char.id} className="text-white text-center p-2 border border-white/20 w-[180px]">
                                {char.currentHP !== undefined ? char.currentHP : hp} / {char.maxHP !== undefined ? char.maxHP : hp}
                              </td>
                            )
                          })}
                          {hiddenChars.map(char => (
                            <td key={char.id} className="text-white/30 text-center p-2 border border-white/20 w-[60px]">
                              -
                            </td>
                          ))}
                        </tr>
                        {['Reflexe', 'Koordination', 'Stärke', 'Wissen', 'Wahrnehmung', 'Ausstrahlung', 'Magie'].map(attr => (
                          <tr key={attr}>
                            <td className="bg-white/5 text-white p-2 border border-white/20 sticky left-0 z-10 w-[200px]">
                              {attr}
                            </td>
                            {visibleCharacters.map(char => (
                              <td key={char.id} className="text-white text-center p-2 border border-white/20 w-[180px]">
                                {formatD6Value(char.attributes[attr] || '1D')}
                              </td>
                            ))}
                            {hiddenChars.map(char => (
                              <td key={char.id} className="text-white/30 text-center p-2 border border-white/20 w-[60px]">
                                -
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )
              })()}
              </div>
            </div>

          </div>
        )}

        {/* Journal Tab */}
        {activeTab === 'journal' && (
          <div className="space-y-6">
            {/* Neue Eintrag hinzufügen */}
            <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
              <h2 className="text-2xl font-bold text-white mb-4">Neuer Eintrag</h2>
              <div className="space-y-4">
                <input
                  type="text"
                  placeholder="Titel"
                  value={newJournalEntry.title}
                  onChange={(e) =>
                    setNewJournalEntry({ ...newJournalEntry, title: e.target.value })
                  }
                  className="w-full px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-primary-400"
                />
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
                <textarea
                  placeholder="Inhalt..."
                  value={newJournalEntry.content}
                  onChange={(e) =>
                    setNewJournalEntry({ ...newJournalEntry, content: e.target.value })
                  }
                  rows={4}
                  className="w-full px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-primary-400"
                />
                <button
                  onClick={handleAddJournalEntry}
                  className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-2 rounded-lg font-semibold transition-colors"
                >
                  Eintrag hinzufügen
                </button>
              </div>
            </div>

            {/* Einträge */}
            <div className="space-y-4">
              {journalEntries
                .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
                .map((entry) => {
                  const fantasyDate = entry.fantasyDate 
                    ? formatFantasyDate(entry.fantasyDate, true, entry.timeOfDay)
                    : entry.timestamp 
                      ? formatFantasyDate(realDateToFantasyDate(entry.timestamp), true, entry.timeOfDay)
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
                      <p className="text-white/80 mb-2">Von: {entry.author}</p>
                    </div>
                  )
                })}
            </div>
          </div>
        )}

        {/* Deleted Characters Tab */}
        {activeTab === 'deleted' && (
          <div className="space-y-6">
            <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
              <h2 className="text-2xl font-bold text-white mb-4">
                Gelöschte Charaktere
              </h2>
              <p className="text-white/70 mb-6">
                Hier findest du alle von Spielern gelöschten Charaktere. Du kannst sie wiederherstellen, wenn nötig.
              </p>

              {deletedCharacters.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-white/70">Keine gelöschten Charaktere vorhanden.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {deletedCharacters
                    .sort((a, b) => b.deletedDate.getTime() - a.deletedDate.getTime())
                    .map((character) => (
                      <div
                        key={character.id}
                        className="bg-white/5 rounded-xl p-6 border border-white/10"
                      >
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <h3 className="text-xl font-bold text-white mb-2">
                              {character.name}
                            </h3>
                            <div className="text-white/70 text-sm space-y-1">
                              <p>
                                <strong>Spieler:</strong> {character.playerName}
                              </p>
                              {character.createdDate && (
                                <p>
                                  <strong>Erstellt am:</strong>{' '}
                                  {new Date(character.createdDate).toLocaleDateString('de-DE', {
                                    day: '2-digit',
                                    month: '2-digit',
                                    year: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })}
                                </p>
                              )}
                              {character.lastPlayedDate && (
                                <p>
                                  <strong>Zuletzt gespielt am:</strong>{' '}
                                  {new Date(character.lastPlayedDate).toLocaleDateString('de-DE', {
                                    day: '2-digit',
                                    month: '2-digit',
                                    year: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })}
                                </p>
                              )}
                              <p className="text-red-400">
                                <strong>Gelöscht am:</strong>{' '}
                                {new Date(character.deletedDate).toLocaleDateString('de-DE', {
                                  day: '2-digit',
                                  month: '2-digit',
                                  year: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </p>
                            </div>
                          </div>
                          <button
                            onClick={() => handleRestoreCharacter(character.id)}
                            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-semibold transition-colors ml-4"
                          >
                            Wiederherstellen
                          </button>
                        </div>

                        {/* Charakterdetails (kollabierbar) */}
                        <div className="mt-4 pt-4 border-t border-white/10">
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div>
                              <p className="text-white/60">Attribute</p>
                              <p className="text-white">{Object.keys(character.attributes).length}</p>
                            </div>
                            <div>
                              <p className="text-white/60">Fertigkeiten</p>
                              <p className="text-white">{character.skills.length}</p>
                            </div>
                            <div>
                              <p className="text-white/60">Inventar</p>
                              <p className="text-white">{character.inventory.length}</p>
                            </div>
                            <div>
                              <p className="text-white/60">Gesinnung</p>
                              <p className="text-white">
                                {character.alignment
                                  ? `${character.alignment.row}, ${character.alignment.col}`
                                  : 'Nicht gesetzt'}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Images Tab */}
        {activeTab === 'images' && (
          <div className="space-y-6">
            {/* Bild hochladen */}
            <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
              <h2 className="text-2xl font-bold text-white mb-4">Bild an Spieler senden</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-white/90 mb-2 font-medium">
                    Bild auswählen oder URL eingeben:
                  </label>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="w-full px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-primary-600 file:text-white hover:file:bg-primary-700"
                  />
                </div>
                <input
                  type="text"
                  placeholder="Bild-URL (optional, wenn Datei hochgeladen)"
                  value={newImage.url}
                  onChange={(e) => setNewImage({ ...newImage, url: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-primary-400"
                />
                <input
                  type="text"
                  placeholder="Titel (optional)"
                  value={newImage.title}
                  onChange={(e) => setNewImage({ ...newImage, title: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-primary-400"
                />
                <textarea
                  placeholder="Beschreibung (optional)"
                  value={newImage.description}
                  onChange={(e) =>
                    setNewImage({ ...newImage, description: e.target.value })
                  }
                  rows={3}
                  className="w-full px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-primary-400"
                />
                {newImage.url && (
                  <div className="bg-black/20 rounded-lg p-4 border border-white/10">
                    <img
                      src={newImage.url}
                      alt="Vorschau"
                      className="max-w-full h-auto rounded-lg max-h-64"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement
                        target.style.display = 'none'
                      }}
                    />
                  </div>
                )}
                <button
                  onClick={handleShareImage}
                  className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-2 rounded-lg font-semibold transition-colors"
                >
                  Bild senden
                </button>
              </div>
            </div>

            {/* Gesendete Bilder */}
            <div>
              <h2 className="text-2xl font-bold text-white mb-4">Gesendete Bilder</h2>
              <div className="space-y-4">
                {sharedImages
                  .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
                  .map((image) => (
                    <div
                      key={image.id}
                      className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20"
                    >
                      {image.title && (
                        <h3 className="text-xl font-bold text-white mb-2">{image.title}</h3>
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
                        Gesendet am {image.timestamp.toLocaleDateString('de-DE')}
                      </p>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        )}

        {/* Skills Management Tab */}
        {activeTab === 'skills' && (
          <div className="space-y-6">
            <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
              <h2 className="text-2xl font-bold text-white mb-4">Fertigkeiten verwalten</h2>
              
              {/* Neue Fertigkeit hinzufügen */}
              <div className="mb-6 p-4 bg-white/5 rounded-lg border border-white/10">
                <h3 className="text-lg font-semibold text-white mb-3">Neue Fertigkeit hinzufügen</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <input
                    type="text"
                    placeholder="Fertigkeitsname"
                    value={newSkill.name}
                    onChange={(e) => setNewSkill({ ...newSkill, name: e.target.value })}
                    className="px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-primary-400"
                  />
                  <select
                    value={newSkill.attribute}
                    onChange={(e) => setNewSkill({ ...newSkill, attribute: e.target.value })}
                    className="px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white focus:outline-none focus:ring-2 focus:ring-primary-400"
                  >
                    {['Reflexe', 'Koordination', 'Stärke', 'Wissen', 'Wahrnehmung', 'Ausstrahlung', 'Magie'].map(attr => (
                      <option key={attr} value={attr} className="bg-slate-800">{attr}</option>
                    ))}
                  </select>
                  <div className="flex items-center gap-2">
                    <label className="flex items-center gap-2 text-white/70 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={newSkill.isWeakened}
                        onChange={(e) => setNewSkill({ ...newSkill, isWeakened: e.target.checked })}
                        className="rounded"
                      />
                      <span>Geschwächt</span>
                    </label>
                    <button
                      onClick={() => {
                        if (newSkill.name.trim()) {
                          addSkill({
                            name: newSkill.name.trim(),
                            attribute: newSkill.attribute,
                            bonusDice: 0,
                            specializations: [],
                            isWeakened: newSkill.isWeakened,
                            isCustom: false,
                          })
                          setNewSkill({ name: '', attribute: 'Reflexe', isWeakened: false })
                          loadData()
                        }
                      }}
                      className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-semibold transition-colors"
                    >
                      Hinzufügen
                    </button>
                  </div>
                </div>
              </div>

              {/* Fertigkeiten-Liste */}
              <div className="space-y-4">
                {['Reflexe', 'Koordination', 'Stärke', 'Wissen', 'Wahrnehmung', 'Ausstrahlung', 'Magie'].map(attr => {
                  const attrSkills = availableSkills.filter(s => s.attribute === attr)
                  if (attrSkills.length === 0) return null

                  return (
                    <div key={attr} className="bg-white/5 rounded-lg p-4 border border-white/10">
                      <h3 className="text-lg font-semibold text-white mb-3">{attr}</h3>
                      <div className="space-y-2">
                        {attrSkills.map(skill => (
                          <div key={skill.id} className="flex items-center justify-between bg-white/5 rounded p-3">
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
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => {
                                  updateSkill(skill.id, { isWeakened: !skill.isWeakened })
                                  loadData()
                                }}
                                className={`px-3 py-1 rounded text-sm ${
                                  skill.isWeakened
                                    ? 'bg-yellow-600 hover:bg-yellow-700 text-white'
                                    : 'bg-white/10 hover:bg-white/20 text-white'
                                }`}
                              >
                                {skill.isWeakened ? 'Geschwächt' : 'Schwächen'}
                              </button>
                              <button
                                onClick={() => {
                                  if (confirm(`Möchtest du "${skill.name}" wirklich löschen?`)) {
                                    removeSkill(skill.id)
                                    loadData()
                                  }
                                }}
                                className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-sm"
                              >
                                Löschen
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )}

        {/* Settings Tab */}
        {activeTab === 'settings' && (
          <div className="space-y-6">
            {/* Spieler verwalten */}
            {groupId && (
              <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20 shadow-xl">
                <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                  <span className="text-3xl">👥</span>
                  <span>Spieler verwalten</span>
                </h2>
                <div className="space-y-4">
                  {groupMembers.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-white/60 text-lg">Keine Spieler in dieser Gruppe.</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {groupMembers.map((member) => {
                        const playerCharacters = characters.filter(c => c.playerName === member.player_name && !c.deletedDate)
                        const isGM = member.role === 'spielleiter'
                        
                        return (
                          <div
                            key={member.id}
                            className="bg-white/5 backdrop-blur-sm rounded-xl p-5 border border-white/10 hover:border-white/20 hover:bg-white/10 transition-all duration-300 shadow-lg hover:shadow-xl"
                          >
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-3 mb-2 flex-wrap">
                                  <span className="text-white font-bold text-lg">
                                    {member.player_name}
                                  </span>
                                  {isGM && (
                                    <span className="text-xs bg-gradient-to-r from-purple-500/30 to-indigo-500/30 text-purple-200 px-3 py-1.5 rounded-full border border-purple-400/30 backdrop-blur-sm font-semibold shadow-lg">
                                      ✨ Spielleiter
                                    </span>
                                  )}
                                  <span className="text-white/50 text-sm font-medium">
                                    ({playerCharacters.length} Charakter{playerCharacters.length !== 1 ? 'e' : ''})
                                  </span>
                                </div>
                                {playerCharacters.length > 0 && (
                                  <div className="mt-3 pt-3 border-t border-white/10">
                                    <div className="flex flex-wrap gap-2">
                                      {playerCharacters.map((c, idx) => (
                                        <span
                                          key={c.id}
                                          className="text-white/80 text-sm px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 backdrop-blur-sm hover:bg-white/10 hover:border-white/20 transition-all duration-200"
                                        >
                                          {c.name}
                                        </span>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                              {!isGM && (
                                <button
                                  onClick={async () => {
                                    if (confirm(`Möchtest du ${member.player_name} wirklich aus der Gruppe entfernen? Alle Charaktere werden gelöscht.`)) {
                                      const success = await removePlayerFromGroup(groupId!, member.player_name)
                                      if (success) {
                                        await loadData()
                                        alert(`${member.player_name} wurde aus der Gruppe entfernt.`)
                                      } else {
                                        alert('Fehler beim Entfernen des Spielers.')
                                      }
                                    }
                                  }}
                                  className="px-5 py-2.5 bg-gradient-to-r from-red-600/80 to-red-700/80 hover:from-red-500 hover:to-red-600 text-white rounded-lg font-semibold transition-all duration-300 shadow-lg hover:shadow-red-500/50 hover:scale-105 border border-red-400/30 backdrop-blur-sm flex-shrink-0"
                                >
                                  🗑️ Entfernen
                                </button>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Fantasie-Kalender Start-Datum */}
            {groupId && (
              <FantasyCalendarStartDate groupId={groupId} />
            )}
            
            <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
              <h2 className="text-2xl font-bold text-white mb-4">Charaktererstellungs-Einstellungen</h2>
              <p className="text-white/70 mb-6">
                Diese Einstellungen gelten dauerhaft für alle Charaktere. Änderungen werden bei der nächsten Charaktererstellung wirksam.
              </p>

              <div className="space-y-4">
                <div>
                  <label className="block text-white/90 mb-2 font-medium">
                    Maximale Attributspunkte (D6):
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="20"
                    value={settings.maxAttributePoints}
                    onChange={(e) => {
                      const newSettings = { ...settings, maxAttributePoints: parseInt(e.target.value) || 7 }
                      setSettings(newSettings)
                      saveCharacterCreationSettings(newSettings)
                    }}
                    className="w-full px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white focus:outline-none focus:ring-2 focus:ring-primary-400"
                  />
                </div>

                <div>
                  <label className="block text-white/90 mb-2 font-medium">
                    Maximale Fertigkeitspunkte (D6):
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="20"
                    value={settings.maxSkillPoints}
                    onChange={(e) => {
                      const newSettings = { ...settings, maxSkillPoints: parseInt(e.target.value) || 8 }
                      setSettings(newSettings)
                      saveCharacterCreationSettings(newSettings)
                    }}
                    className="w-full px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white focus:outline-none focus:ring-2 focus:ring-primary-400"
                  />
                </div>

                <div>
                  <label className="block text-white/90 mb-2 font-medium">
                    Maximale Blibs:
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="20"
                    value={settings.maxBlibs}
                    onChange={(e) => {
                      const newSettings = { ...settings, maxBlibs: parseInt(e.target.value) || 4 }
                      setSettings(newSettings)
                      saveCharacterCreationSettings(newSettings)
                    }}
                    className="w-full px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white focus:outline-none focus:ring-2 focus:ring-primary-400"
                  />
                </div>
              </div>
            </div>

            {/* Charaktere mit Punkte-Status */}
            <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
              <h2 className="text-2xl font-bold text-white mb-4">Punkte-Status der Charaktere</h2>
              <div className="space-y-4">
                {characters.map(character => {
                  const pointsStatus = calculateCharacterPoints(character)
                  const hasRemainingPoints = pointsStatus.remainingAttributePoints > 0 || 
                                            pointsStatus.remainingSkillPoints > 0 || 
                                            pointsStatus.remainingBlibs > 0
                  return (
                    <div key={character.id} className="bg-white/5 rounded-lg p-4 border border-white/10">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="text-lg font-semibold text-white mb-2">
                            {character.name} ({character.playerName})
                          </h3>
                          <div className="text-sm text-white/70 space-y-1">
                            <p>
                              Attributspunkte: {pointsStatus.usedAttributePoints} / {settings.maxAttributePoints}
                              {pointsStatus.remainingAttributePoints > 0 && (
                                <span className="text-green-400 ml-2">
                                  (+{pointsStatus.remainingAttributePoints} übrig)
                                </span>
                              )}
                            </p>
                            <p>
                              Fertigkeitspunkte: {pointsStatus.usedSkillPoints} / {settings.maxSkillPoints}
                              {pointsStatus.remainingSkillPoints > 0 && (
                                <span className="text-green-400 ml-2">
                                  (+{pointsStatus.remainingSkillPoints} übrig)
                                </span>
                              )}
                            </p>
                            <p>
                              Blibs: {pointsStatus.usedBlibs} / {settings.maxBlibs}
                              {pointsStatus.remainingBlibs > 0 && (
                                <span className="text-green-400 ml-2">
                                  (+{pointsStatus.remainingBlibs} übrig)
                                </span>
                              )}
                            </p>
                          </div>
                        </div>
                        {hasRemainingPoints && (
                          <div className="bg-green-600/20 border border-green-600 rounded-lg px-4 py-2">
                            <p className="text-green-400 font-semibold">✓ Punkte verfügbar</p>
                          </div>
                        )}
                        {!hasRemainingPoints && (
                          <div className="bg-white/10 border border-white/20 rounded-lg px-4 py-2">
                            <p className="text-white/70 font-semibold">Alle Punkte verwendet</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

