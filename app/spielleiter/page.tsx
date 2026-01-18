'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
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
import { getAlignment } from '@/lib/alignments'
import FantasyCalendarStartDate from '@/components/FantasyCalendarStartDate'
import NameGenerator from '@/components/NameGenerator'
import NpcCreationExtended from '@/components/NpcCreationExtended'
import { extractTagsFromText, normalizeTag } from '@/lib/tags'

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
  const [selectedAuthor, setSelectedAuthor] = useState<string>('')
  const [editingEntry, setEditingEntry] = useState<JournalEntry | null>(null)
  const [newImage, setNewImage] = useState({ title: '', description: '', url: '' })
  const [journalIllustrationUrl, setJournalIllustrationUrl] = useState<string | null>(null)
  const [journalIllustrationSaved, setJournalIllustrationSaved] = useState(false)
  const [availableSkills, setAvailableSkills] = useState<Skill[]>([])
  const [newSkill, setNewSkill] = useState({ name: '', attribute: 'Reflexe', isWeakened: false, description: '' })
  const [editingSkill, setEditingSkill] = useState<Skill | null>(null)
  const [settings, setSettings] = useState<CharacterCreationSettings>(getCharacterCreationSettings())
  const [hiddenCharacters, setHiddenCharacters] = useState<Set<string>>(new Set())
  const [groupMembers, setGroupMembers] = useState<any[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [groupId, setGroupId] = useState<string | null>(null)
  const [showNpcCreation, setShowNpcCreation] = useState(false)
  const [editingNpc, setEditingNpc] = useState<Character | null>(null)
  const [npcTagFilter, setNpcTagFilter] = useState('')
  const [journalTagFilter, setJournalTagFilter] = useState('')
  const [journalCategory, setJournalCategory] = useState<'all' | 'personen' | 'monster' | 'orte'>('all')
  const [journalSortOrder, setJournalSortOrder] = useState<'desc' | 'asc'>('desc')

  const matchesTag = (tags: string[] | undefined, filter: string): boolean => {
    if (!filter) return true
    return (tags || []).some(tag => normalizeTag(tag) === filter)
  }
  const normalizedNpcTagFilter = normalizeTag(npcTagFilter)
  const normalizedJournalTagFilter = normalizeTag(journalTagFilter)
  const matchesJournalCategory = (entry: JournalEntry): boolean => {
    if (journalCategory === 'all') return true
    return matchesTag(entry.tags, journalCategory)
  }
  const journalWordCount = newJournalEntry.content.trim()
    ? newJournalEntry.content.trim().split(/\s+/).length
    : 0
  const canGenerateJournalIllustration = journalWordCount >= 50 && !journalIllustrationUrl

  useEffect(() => {
    if (editingEntry?.illustrationUrl) {
      setJournalIllustrationUrl(editingEntry.illustrationUrl)
      setJournalIllustrationSaved(true)
    } else {
      setJournalIllustrationUrl(null)
      setJournalIllustrationSaved(false)
    }
  }, [editingEntry])

  const validateGroupAccess = useCallback(async (groupId: string, playerName: string, role: string) => {
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
  }, [router])

  const loadData = useCallback(async () => {
    // Verwende getCharactersAsync() um aus Supabase zu laden (wenn verfügbar)
    const { getCharactersAsync } = await import('@/lib/data')
    const allCharacters = await getCharactersAsync()
    setCharacters(allCharacters)
    
    setDeletedCharacters(getDeletedCharacters())
    const entries = await getJournalEntries()
    setJournalEntries(entries)
    setSharedImages(getSharedImages())
    setDiceRolls(getDiceRolls())
    setAvailableSkills(getAvailableSkills())
    setSettings(getCharacterCreationSettings())
    
    // Lade Gruppenmitglieder
    const currentGroupId = groupId || (typeof window !== 'undefined' ? localStorage.getItem('groupId') : null)
    if (currentGroupId) {
      const members = await getGroupMembers(currentGroupId)
      setGroupMembers(members)
    }
  }, [groupId])

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
  }, [router, validateGroupAccess, loadData])

  // Automatisches Neuladen alle 5 Sekunden (Polling für Echtzeit-Synchronisation)
  useEffect(() => {
    const interval = setInterval(() => {
      loadData()
    }, 5000) // Alle 5 Sekunden

    return () => clearInterval(interval)
  }, [groupId, loadData])

  useEffect(() => {
    if (activeTab === 'journal' && typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }, [activeTab])

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
    if (!newJournalEntry.content.trim()) return

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

    // Bestimme Autor
    let author = 'Spielleiter'
    let characterId: string | undefined = undefined
    
    if (selectedAuthor) {
      if (selectedAuthor === 'spielleiter') {
        const playerName = typeof window !== 'undefined' ? localStorage.getItem('playerName') : null
        author = playerName || 'Spielleiter'
      } else {
        // Prüfe ob es ein Charakter ist
        const character = characters.find(c => c.id === selectedAuthor)
        if (character) {
          author = character.name
          characterId = character.id
        } else {
          author = selectedAuthor
        }
      }
    } else {
      // Fallback: Spielleiter-Name aus localStorage
      const playerName = typeof window !== 'undefined' ? localStorage.getItem('playerName') : null
      author = playerName || 'Spielleiter'
    }

    // Extrahiere Titel aus Content (alles vor dem ersten Doppelpunkt)
    const contentParts = newJournalEntry.content.split(':')
    const title = contentParts.length > 1 ? contentParts[0].trim() : 'Eintrag'
    const content = contentParts.length > 1 ? contentParts.slice(1).join(':').trim() : newJournalEntry.content.trim()

    const tags = extractTagsFromText(`${title} ${content}`)
    const entry: JournalEntry = {
      id: editingEntry?.id || Date.now().toString(),
      author,
      characterId,
      title,
      content,
      tags,
      illustrationUrl: journalIllustrationSaved ? journalIllustrationUrl || undefined : undefined,
      timestamp: editingEntry?.timestamp || now,
      fantasyDate,
      timeOfDay: selectedTimeOfDay as any,
    }

    if (editingEntry) {
      // Aktualisiere bestehenden Eintrag
      const updatedEntries = journalEntries.map(e => e.id === editingEntry.id ? entry : e)
      setJournalEntries(updatedEntries)
      // Speichere in Supabase/localStorage
      await saveJournalEntry(entry)
      setEditingEntry(null)
    } else {
      // Neuer Eintrag
      const entries = [...journalEntries, entry]
      setJournalEntries(entries)
      await saveJournalEntry(entry)
    }
    
    setNewJournalEntry({ title: '', content: '' })
    setSelectedAuthor('')
    setSelectedTimeOfDay('Mittag')
    setJournalIllustrationUrl(null)
    setJournalIllustrationSaved(false)
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
            <div className="space-y-4">
              <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-2xl font-bold text-white" style={{ fontSize: 'calc(1.5rem * var(--app-scale, 1))' }}>
                    NPCs verwalten
                  </h2>
                  <button
                    onClick={() => {
                      setEditingNpc(null)
                      setShowNpcCreation(true)
                    }}
                    className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg font-semibold transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-primary-500/50 backdrop-blur-sm"
                    style={{ fontSize: 'calc(1rem * var(--app-scale, 1))' }}
                  >
                    + Neuer NPC
                  </button>
                </div>
              </div>
            </div>

            {/* Charaktere-Übersicht - ZUERST */}
            <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
              <h2 className="text-2xl font-bold text-white mb-4">Charaktere-Übersicht</h2>
              <div className="overflow-x-auto">
              {(() => {
                const currentGroupId = groupId || (typeof window !== 'undefined' ? localStorage.getItem('groupId') : null)
                // Filtere Standard-Spieler raus: Kobi, Julia, JJ, Georg
                const groupCharacters = (groupId 
                  ? characters.filter(char => {
                      return true
                    })
                  : characters
                ).filter(char => 
                  !char.deletedDate && 
                  char.playerName !== 'Kobi' && 
                  char.playerName !== 'Julia' && 
                  char.playerName !== 'JJ' && 
                  char.playerName !== 'Georg'
                )
                
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

                // Hilfsfunktion: Finde Nahkampfwaffe
                const getMeleeWeapon = (char: Character) => {
                  const weapons = char.inventory.filter(item => 
                    item.category === 'weapon' || 
                    item.name.toLowerCase().includes('waffe') || 
                    item.name.toLowerCase().includes('schwert') ||
                    item.name.toLowerCase().includes('dolch') ||
                    item.name.toLowerCase().includes('hammer') ||
                    item.name.toLowerCase().includes('stab') ||
                    item.name.toLowerCase().includes('axt') ||
                    item.name.toLowerCase().includes('speer')
                  )
                  // Filtere Fernkampfwaffen raus
                  const meleeWeapons = weapons.filter(w => 
                    !w.name.toLowerCase().includes('bogen') &&
                    !w.name.toLowerCase().includes('wurf') &&
                    !w.name.toLowerCase().includes('schleuder')
                  )
                  return meleeWeapons[0] || null
                }

                // Hilfsfunktion: Finde Fernkampfwaffe
                const getRangedWeapon = (char: Character) => {
                  const weapons = char.inventory.filter(item => 
                    item.category === 'weapon' || 
                    item.name.toLowerCase().includes('bogen') ||
                    item.name.toLowerCase().includes('wurf') ||
                    item.name.toLowerCase().includes('schleuder') ||
                    item.name.toLowerCase().includes('armbrust')
                  )
                  return weapons[0] || null
                }

                // Hilfsfunktion: Finde Rüstung
                const getArmor = (char: Character) => {
                  const armor = char.inventory.filter(item => 
                    item.category === 'armor' || 
                    item.name.toLowerCase().includes('rüstung') || 
                    item.name.toLowerCase().includes('panzer') ||
                    item.name.toLowerCase().includes('schild') ||
                    item.name.toLowerCase().includes('helm') ||
                    item.name.toLowerCase().includes('brustpanzer')
                  )
                  return armor[0] || null
                }

                // Hilfsfunktion: Finde Ausweichen-Fertigkeit
                const getDodgeSkill = (char: Character) => {
                  // Suche nach "Ausweichen" oder ähnlichen Fertigkeiten
                  const dodgeSkill = char.skills.find(skill => 
                    skill.name.toLowerCase().includes('ausweichen') ||
                    skill.name.toLowerCase().includes('akrobatik')
                  )
                  if (dodgeSkill) {
                    const attributeValue = char.attributes[dodgeSkill.attribute] || '1D'
                    const isLearned = dodgeSkill.bonusDice > 0 || (dodgeSkill.specializations && dodgeSkill.specializations.some(s => s.blibs > 0))
                    const skillBlibs = dodgeSkill.specializations?.reduce((sum, s) => sum + s.blibs, 0) || 0
                    const skillDiceFormula = calculateSkillValue(
                      attributeValue,
                      dodgeSkill.bonusDice,
                      skillBlibs,
                      dodgeSkill.isWeakened,
                      isLearned
                    )
                    return skillDiceFormula
                  }
                  return null
                }

                // Hilfsfunktion: Finde Nahkampf-Fertigkeit (für Trefferwürfel)
                const getMeleeSkill = (char: Character) => {
                  const meleeSkill = char.skills.find(skill => 
                    skill.name === 'bewaffneter Nahkampf' ||
                    skill.name === 'unbewaffneter Kampf'
                  )
                  if (meleeSkill) {
                    const attributeValue = char.attributes[meleeSkill.attribute] || '1D'
                    const isLearned = meleeSkill.bonusDice > 0 || (meleeSkill.specializations && meleeSkill.specializations.some(s => s.blibs > 0))
                    const skillBlibs = meleeSkill.specializations?.reduce((sum, s) => sum + s.blibs, 0) || 0
                    const skillDiceFormula = calculateSkillValue(
                      attributeValue,
                      meleeSkill.bonusDice,
                      skillBlibs,
                      meleeSkill.isWeakened,
                      isLearned
                    )
                    return skillDiceFormula
                  }
                  return null
                }

                // Hilfsfunktion: Finde Fernkampf-Fertigkeit (für Trefferwürfel)
                const getRangedSkill = (char: Character) => {
                  const rangedSkill = char.skills.find(skill => 
                    skill.name === 'Fernkampf'
                  )
                  if (rangedSkill) {
                    const attributeValue = char.attributes[rangedSkill.attribute] || '1D'
                    const isLearned = rangedSkill.bonusDice > 0 || (rangedSkill.specializations && rangedSkill.specializations.some(s => s.blibs > 0))
                    const skillBlibs = rangedSkill.specializations?.reduce((sum, s) => sum + s.blibs, 0) || 0
                    const skillDiceFormula = calculateSkillValue(
                      attributeValue,
                      rangedSkill.bonusDice,
                      skillBlibs,
                      rangedSkill.isWeakened,
                      isLearned
                    )
                    return skillDiceFormula
                  }
                  return null
                }

                // Hilfsfunktion: Extrahiere Wucht/Präzision/Schadensreduktion aus description
                const extractWeaponStats = (item: any) => {
                  if (!item.description) return { wucht: null, praezision: null, schadensreduktion: null }
                  const desc = item.description.toLowerCase()
                  // Suche nach Wucht/Präzision/Schadensreduktion in description
                  const wuchtMatch = desc.match(/wucht[:\s]*(\d+d[\+\d]*|\d+)/i)
                  const praezisionMatch = desc.match(/präzision[:\s]*(\d+d[\+\d]*|\d+)/i)
                  const schadensreduktionMatch = desc.match(/schadensreduktion[:\s]*(\d+)/i)
                  
                  return {
                    wucht: wuchtMatch ? wuchtMatch[1] : null,
                    praezision: praezisionMatch ? praezisionMatch[1] : null,
                    schadensreduktion: schadensreduktionMatch ? schadensreduktionMatch[1] : null
                  }
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
                                        <div className="flex-1 relative group">
                                          <div className="text-sm font-semibold">
                                            {char.name}
                                          </div>
                                          {char.isNPC && (
                                            <>
                                              <div className="text-xs text-yellow-400">
                                                {char.npcType === 'händler' ? '🏪' : char.npcType === 'stadtwache' ? '🛡️' : char.npcType === 'monster' ? '👹' : '👤'}
                                              </div>
                                              {char.npcProfession && (
                                                <div className="text-xs text-white/70 mt-1">
                                                  {char.npcProfession}
                                                </div>
                                              )}
                                              
                                              {/* Hover-Info für NPCs */}
                                              {char.isNPC && (
                                                <div className="absolute left-0 top-full mt-2 w-80 bg-slate-800 rounded-lg p-4 border border-white/20 shadow-xl z-50 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
                                                  <div className="space-y-2 text-sm">
                                                    {char.race && <p><span className="text-white/70">Rasse:</span> <span className="text-white">{char.race}</span></p>}
                                                    {char.className && <p><span className="text-white/70">Klasse:</span> <span className="text-white">{char.className}</span></p>}
                                                    {char.gender && <p><span className="text-white/70">Geschlecht:</span> <span className="text-white">{char.gender}</span></p>}
                                                    {char.npcAffiliation && <p><span className="text-white/70">Zugehörigkeit:</span> <span className="text-white">{char.npcAffiliation}</span></p>}
                                                    {char.npcLocation && <p><span className="text-white/70">Ort:</span> <span className="text-white">{char.npcLocation}</span></p>}
                                                    {char.npcAddress && <p><span className="text-white/70">Adresse:</span> <span className="text-white">{char.npcAddress}</span></p>}
                                                    {char.npcBestSkills && char.npcBestSkills.length > 0 && (
                                                      <p>
                                                        <span className="text-white/70">Beste Fähigkeiten:</span>{' '}
                                                        <span className="text-white">{char.npcBestSkills.join(', ')}</span>
                                                      </p>
                                                    )}
                                                    
                                                    {/* Geheim-Attribute (nur für Spielleiter sichtbar) */}
                                                    {(char.npcSecretAlignment || char.npcSecretAgenda || char.npcSecretQuestGiver || char.npcSecretHiddenHero || char.npcSecretNemesis || char.npcSecretPerpetrator || char.npcSecretVictim) && (
                                                      <div className="border-t border-white/20 pt-2 mt-2">
                                                        <p className="text-yellow-400 text-xs font-semibold mb-1">🔒 Geheim:</p>
                                                        {char.npcSecretAlignment && (() => {
                                                          const alignment = getAlignment(char.npcSecretAlignment.row, char.npcSecretAlignment.col)
                                                          return alignment ? (
                                                            <p className="text-white/70 text-xs">Gesinnung: {alignment.name}</p>
                                                          ) : null
                                                        })()}
                                                        {char.npcSecretAgenda && (
                                                          <p className="text-white/70 text-xs">Agenda: {char.npcSecretAgenda}</p>
                                                        )}
                                                        {char.npcSecretQuestGiver && (
                                                          <p className="text-yellow-300 text-xs">✓ Questgeber</p>
                                                        )}
                                                        {char.npcSecretHiddenHero && (
                                                          <p className="text-yellow-300 text-xs">✓ Versteckter Held</p>
                                                        )}
                                                        {char.npcSecretNemesis && (
                                                          <p className="text-red-300 text-xs">Erzfeind: {char.npcSecretNemesis}</p>
                                                        )}
                                                        {char.npcSecretPerpetrator && (
                                                          <p className="text-red-300 text-xs">✓ Täter</p>
                                                        )}
                                                        {char.npcSecretVictim && (
                                                          <p className="text-red-300 text-xs">✓ Opfer</p>
                                                        )}
                                                      </div>
                                                    )}
                                                  </div>
                                                </div>
                                              )}
                                            </>
                                          )}
                                        </div>
                                        <div className="flex items-center gap-1">
                                          {char.isNPC && (
                                            <>
                                              <button
                                                onClick={() => {
                                                  setEditingNpc(char)
                                                  setShowNpcCreation(true)
                                                }}
                                                className="text-blue-400 hover:text-blue-300 text-sm"
                                                title="Bearbeiten"
                                              >
                                                ✏️
                                              </button>
                                              <button
                                                onClick={async () => {
                                                  // Übertrage NPC ins Tagebuch (ohne Geheim-Attribute)
                                                  const now = new Date()
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

                                                  const playerName = typeof window !== 'undefined' ? localStorage.getItem('playerName') : null
                                                  const author = playerName || 'Spielleiter'
                                                  
                                                  // Erstelle Tagebuch-Eintrag ohne Geheim-Attribute
                                                  const publicInfo = [
                                                    `Name: ${char.name}`,
                                                    char.race ? `Rasse: ${char.race}` : '',
                                                    char.className ? `Klasse: ${char.className}` : '',
                                                    char.gender ? `Geschlecht: ${char.gender}` : '',
                                                    char.npcProfession ? `Beruf: ${char.npcProfession}` : '',
                                                    char.npcAffiliation ? `Zugehörigkeit: ${char.npcAffiliation}` : '',
                                                    char.npcLocation ? `Ort: ${char.npcLocation}` : '',
                                                    char.npcAddress ? `Adresse: ${char.npcAddress}` : '',
                                                    char.npcBestSkills && char.npcBestSkills.length > 0 ? `Beste Fähigkeiten: ${char.npcBestSkills.join(', ')}` : '',
                                                  ].filter(Boolean).join('\n')

                                                  const tags = extractTagsFromText(publicInfo)
                                                  const entry: JournalEntry = {
                                                    id: Date.now().toString(),
                                                    author,
                                                    characterId: char.id,
                                                    title: `NPC: ${char.name}`,
                                                    content: publicInfo,
                                                    tags,
                                                    timestamp: now,
                                                    fantasyDate,
                                                    timeOfDay: selectedTimeOfDay as any,
                                                  }

                                                  const entries = [...journalEntries, entry]
                                                  setJournalEntries(entries)
                                                  await saveJournalEntry(entry)
                                                }}
                                                className="text-green-400 hover:text-green-300 text-sm"
                                                title="Ins Tagebuch übertragen"
                                              >
                                                📔
                                              </button>
                                            </>
                                          )}
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
                            Gesinnung
                          </td>
                          {visibleCharacters.map(char => {
                            const alignment = char.alignment ? getAlignment(char.alignment.row, char.alignment.col) : null
                            return (
                              <td key={char.id} className="text-white text-center p-2 border border-white/20 w-[180px]">
                                {alignment ? (
                                  <div className="text-sm">
                                    <div className="font-semibold">{alignment.name}</div>
                                    {alignment.nameEnglish && (
                                      <div className="text-white/70 text-xs">{alignment.nameEnglish}</div>
                                    )}
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
                        <tr>
                          <td className="bg-white/5 text-white p-2 border border-white/20 sticky left-0 z-10 w-[200px]">
                            Nahkampfwaffe
                          </td>
                          {visibleCharacters.map(char => {
                            const meleeWeapon = getMeleeWeapon(char)
                            const meleeSkill = getMeleeSkill(char)
                            const stats = meleeWeapon ? extractWeaponStats(meleeWeapon) : { wucht: null, praezision: null, schadensreduktion: null }
                            return (
                              <td key={char.id} className="text-white text-center p-2 border border-white/20 w-[180px]">
                                {meleeWeapon ? (
                                  <div className="text-xs">
                                    <div className="font-semibold">{meleeWeapon.name}</div>
                                    {meleeSkill && (
                                      <div className="text-white/70">Treffer: {formatD6Value(meleeSkill)}</div>
                                    )}
                                    {stats.wucht && (
                                      <div className="text-white/70">Wucht: {stats.wucht}</div>
                                    )}
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
                        <tr>
                          <td className="bg-white/5 text-white p-2 border border-white/20 sticky left-0 z-10 w-[200px]">
                            Fernkampfwaffe
                          </td>
                          {visibleCharacters.map(char => {
                            const rangedWeapon = getRangedWeapon(char)
                            const rangedSkill = getRangedSkill(char)
                            const stats = rangedWeapon ? extractWeaponStats(rangedWeapon) : { wucht: null, praezision: null, schadensreduktion: null }
                            return (
                              <td key={char.id} className="text-white text-center p-2 border border-white/20 w-[180px]">
                                {rangedWeapon ? (
                                  <div className="text-xs">
                                    <div className="font-semibold">{rangedWeapon.name}</div>
                                    {rangedSkill && (
                                      <div className="text-white/70">Treffer: {formatD6Value(rangedSkill)}</div>
                                    )}
                                    {stats.praezision && (
                                      <div className="text-white/70">Präzision: {stats.praezision}</div>
                                    )}
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
                        <tr>
                          <td className="bg-white/5 text-white p-2 border border-white/20 sticky left-0 z-10 w-[200px]">
                            Rüstung
                          </td>
                          {visibleCharacters.map(char => {
                            const armor = getArmor(char)
                            const stats = armor ? extractWeaponStats(armor) : { wucht: null, praezision: null, schadensreduktion: null }
                            return (
                              <td key={char.id} className="text-white text-center p-2 border border-white/20 w-[180px]">
                                {armor ? (
                                  <div className="text-xs">
                                    <div className="font-semibold">{armor.name}</div>
                                    {stats.schadensreduktion && (
                                      <div className="text-white/70">Schadensreduktion: {stats.schadensreduktion}</div>
                                    )}
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
                        <tr>
                          <td className="bg-white/5 text-white p-2 border border-white/20 sticky left-0 z-10 w-[200px]">
                            Ausweichen
                          </td>
                          {visibleCharacters.map(char => {
                            const dodgeSkill = getDodgeSkill(char)
                            return (
                              <td key={char.id} className="text-white text-center p-2 border border-white/20 w-[180px]">
                                {dodgeSkill ? (
                                  <div className="font-mono">{formatD6Value(dodgeSkill)}</div>
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
                      </tbody>
                    </table>
                  </div>
                )
              })()}
              </div>
            </div>

                    {/* NPC-Liste */}
                    {(() => {
                      const groupCharacters = (groupId 
                        ? characters.filter(char => {
                            return true
                          })
                        : characters
                      ).filter(char => 
                        !char.deletedDate && 
                        char.playerName !== 'Kobi' && 
                        char.playerName !== 'Julia' && 
                        char.playerName !== 'JJ' && 
                        char.playerName !== 'Georg'
                      )
                      const npcs = groupCharacters
                        .filter(char => char.isNPC)
                        .filter(npc => matchesTag(npc.tags, normalizedNpcTagFilter))
                      if (npcs.length === 0) return null

                      return (
                        <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
                          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
                            <h2 className="text-2xl font-bold text-white">NPCs</h2>
                            <input
                              type="text"
                              value={npcTagFilter}
                              onChange={(e) => setNpcTagFilter(e.target.value)}
                              placeholder="Tag filtern (z.B. #fallcrest)"
                              className="w-full md:w-72 px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-primary-400"
                            />
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {npcs.map(npc => {
                              const alignment = npc.npcSecretAlignment ? getAlignment(npc.npcSecretAlignment.row, npc.npcSecretAlignment.col) : null
                              return (
                                <div
                                  key={npc.id}
                                  className="bg-white/5 rounded-lg p-4 border border-white/10 hover:bg-white/10 transition-all group relative"
                                >
                                  {/* Sichtbare Info: Name und Beruf */}
                                  <div className="flex items-start justify-between mb-2">
                                    <div className="flex-1">
                                      <h3 className="text-white font-semibold text-lg">{npc.name}</h3>
                                      {npc.npcProfession && (
                                        <p className="text-white/70 text-sm mt-1">{npc.npcProfession}</p>
                                      )}
                                      {npc.tags && npc.tags.length > 0 && (
                                        <div className="mt-2 flex flex-wrap gap-2">
                                          {npc.tags.map(tag => (
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
                                    <div className="flex items-center gap-1">
                                      <button
                                        onClick={() => {
                                          setEditingNpc(npc)
                                          setShowNpcCreation(true)
                                        }}
                                        className="text-blue-400 hover:text-blue-300 text-sm opacity-0 group-hover:opacity-100 transition-opacity"
                                        title="Bearbeiten"
                                      >
                                        ✏️
                                      </button>
                                      <button
                                        onClick={async () => {
                                          const now = new Date()
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

                                          const playerName = typeof window !== 'undefined' ? localStorage.getItem('playerName') : null
                                          const author = playerName || 'Spielleiter'
                                          
                                          const publicInfo = [
                                            `Name: ${npc.name}`,
                                            npc.race ? `Rasse: ${npc.race}` : '',
                                            npc.className ? `Klasse: ${npc.className}` : '',
                                            npc.gender ? `Geschlecht: ${npc.gender}` : '',
                                            npc.npcProfession ? `Beruf: ${npc.npcProfession}` : '',
                                            npc.npcAffiliation ? `Zugehörigkeit: ${npc.npcAffiliation}` : '',
                                            npc.npcLocation ? `Ort: ${npc.npcLocation}` : '',
                                            npc.npcAddress ? `Adresse: ${npc.npcAddress}` : '',
                                            npc.npcBestSkills && npc.npcBestSkills.length > 0 ? `Beste Fähigkeiten: ${npc.npcBestSkills.join(', ')}` : '',
                                          ].filter(Boolean).join('\n')

                                          const tags = extractTagsFromText(publicInfo)
                                          const entry: JournalEntry = {
                                            id: Date.now().toString(),
                                            author,
                                            characterId: npc.id,
                                            title: `NPC: ${npc.name}`,
                                            content: publicInfo,
                                            tags,
                                            timestamp: now,
                                            fantasyDate,
                                            timeOfDay: selectedTimeOfDay as any,
                                          }

                                          const entries = [...journalEntries, entry]
                                          setJournalEntries(entries)
                                          await saveJournalEntry(entry)
                                        }}
                                        className="text-green-400 hover:text-green-300 text-sm opacity-0 group-hover:opacity-100 transition-opacity"
                                        title="Ins Tagebuch übertragen"
                                      >
                                        📔
                                      </button>
                                    </div>
                                  </div>

                                  {/* Hover-Info (erscheint beim Hovern) */}
                                  <div className="absolute left-0 top-full mt-2 w-80 bg-slate-800 rounded-lg p-4 border border-white/20 shadow-xl z-50 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
                                    <div className="space-y-2 text-sm">
                                      {npc.race && <p><span className="text-white/70">Rasse:</span> <span className="text-white">{npc.race}</span></p>}
                                      {npc.className && <p><span className="text-white/70">Klasse:</span> <span className="text-white">{npc.className}</span></p>}
                                      {npc.gender && <p><span className="text-white/70">Geschlecht:</span> <span className="text-white">{npc.gender}</span></p>}
                                      {npc.npcAffiliation && <p><span className="text-white/70">Zugehörigkeit:</span> <span className="text-white">{npc.npcAffiliation}</span></p>}
                                      {npc.npcLocation && <p><span className="text-white/70">Ort:</span> <span className="text-white">{npc.npcLocation}</span></p>}
                                      {npc.npcAddress && <p><span className="text-white/70">Adresse:</span> <span className="text-white">{npc.npcAddress}</span></p>}
                                      {npc.npcBestSkills && npc.npcBestSkills.length > 0 && (
                                        <p>
                                          <span className="text-white/70">Beste Fähigkeiten:</span>{' '}
                                          <span className="text-white">{npc.npcBestSkills.join(', ')}</span>
                                        </p>
                                      )}
                                      
                                      {/* Geheim-Attribute (nur für Spielleiter sichtbar) */}
                                      <div className="border-t border-white/20 pt-2 mt-2">
                                        <p className="text-yellow-400 text-xs font-semibold mb-1">🔒 Geheim:</p>
                                        {alignment && (
                                          <p className="text-white/70 text-xs">Gesinnung: {alignment.name}</p>
                                        )}
                                        {npc.npcSecretAgenda && (
                                          <p className="text-white/70 text-xs">Agenda: {npc.npcSecretAgenda}</p>
                                        )}
                                        {npc.npcSecretQuestGiver && (
                                          <p className="text-yellow-300 text-xs">✓ Questgeber</p>
                                        )}
                                        {npc.npcSecretHiddenHero && (
                                          <p className="text-yellow-300 text-xs">✓ Versteckter Held</p>
                                        )}
                                        {npc.npcSecretNemesis && (
                                          <p className="text-red-300 text-xs">Erzfeind: {npc.npcSecretNemesis}</p>
                                        )}
                                        {npc.npcSecretPerpetrator && (
                                          <p className="text-red-300 text-xs">✓ Täter</p>
                                        )}
                                        {npc.npcSecretVictim && (
                                          <p className="text-red-300 text-xs">✓ Opfer</p>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      )
                    })()}

                    {/* Fertigkeiten-Tabelle */}
                    <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
                      <h2 className="text-2xl font-bold text-white mb-4">Fertigkeiten-Übersicht</h2>
              <div className="overflow-x-auto overflow-y-auto" style={{ maxHeight: 'calc(100vh - 400px)' }}>
              {(() => {
                // Filtere nur Charaktere der aktuellen Gruppe
                const currentGroupId = groupId || (typeof window !== 'undefined' ? localStorage.getItem('groupId') : null)
                // Filtere Standard-Spieler raus: Kobi, Julia, JJ, Georg
                const groupCharacters = (groupId 
                  ? characters.filter(char => {
                      return true
                    })
                  : characters
                ).filter(char => 
                  !char.deletedDate && 
                  char.playerName !== 'Kobi' && 
                  char.playerName !== 'Julia' && 
                  char.playerName !== 'JJ' && 
                  char.playerName !== 'Georg'
                )
                
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
                              <thead className="sticky top-0 z-20 bg-slate-900">
                                {/* Kopf-Zeile: Spieler/Charakter nur einmal - FIXIERT */}
                                <tr>
                                  <th className="bg-white/10 text-white text-left p-3 border border-white/20 sticky left-0 z-30 w-[200px]">
                                    {attribute}
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
                {/* Autor-Auswahl */}
                <div className="flex items-center gap-3">
                  <label className="text-white/90 w-24">Autor:</label>
                  <select
                    value={selectedAuthor}
                    onChange={(e) => setSelectedAuthor(e.target.value)}
                    className="flex-1 px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white focus:outline-none focus:ring-2 focus:ring-primary-400"
                  >
                    <option value="" className="bg-slate-800">-- Auswählen --</option>
                    <optgroup label="Spieler-Charaktere" className="bg-slate-800">
                      {characters.filter(c => !c.isNPC && !c.deletedDate).map(char => (
                        <option key={char.id} value={char.id} className="bg-slate-800">
                          {char.name} ({char.playerName})
                        </option>
                      ))}
                    </optgroup>
                    <optgroup label="NPCs" className="bg-slate-800">
                      {characters.filter(c => c.isNPC && !c.deletedDate).map(char => (
                        <option key={char.id} value={char.id} className="bg-slate-800">
                          {char.name} {char.npcType ? `(${char.npcType})` : ''}
                        </option>
                      ))}
                    </optgroup>
                    <optgroup label="Spielleiter" className="bg-slate-800">
                      <option value="spielleiter" className="bg-slate-800">
                        Spielleiter
                      </option>
                    </optgroup>
                  </select>
                </div>
                
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

                {journalWordCount >= 50 && (
                  <div className="space-y-3">
                    <button
                      onClick={() => {
                        const label = encodeURIComponent(
                          `Illustration – ${newJournalEntry.content.trim().slice(0, 24)}...`
                        )
                        const placeholderUrl = `https://placehold.co/768x432/png?text=${label}`
                        setJournalIllustrationUrl(placeholderUrl)
                        setJournalIllustrationSaved(false)
                      }}
                      disabled={!canGenerateJournalIllustration}
                      className="w-full px-4 py-2 rounded-lg font-semibold bg-primary-600 hover:bg-primary-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white transition-all duration-300 hover:shadow-lg hover:shadow-primary-500/40"
                    >
                      Illustration generieren
                    </button>
                  </div>
                )}

                {journalIllustrationUrl && (
                  <div className="space-y-3">
                    <div className="bg-white/5 p-3 rounded-lg border border-white/10">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={journalIllustrationUrl}
                        alt="Generierte Illustration"
                        className="w-full rounded-lg border border-white/10"
                      />
                    </div>
                    <div className="flex flex-col sm:flex-row gap-3">
                      <button
                        onClick={() => {
                          setJournalIllustrationUrl(null)
                          setJournalIllustrationSaved(false)
                        }}
                        className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white font-semibold transition-all duration-300 hover:shadow-lg hover:shadow-white/10"
                      >
                        Verwerfen / Neuer Versuch
                      </button>
                      <button
                        onClick={() => setJournalIllustrationSaved(true)}
                        className="px-4 py-2 rounded-lg bg-green-600 hover:bg-green-700 text-white font-semibold transition-all duration-300 hover:shadow-lg hover:shadow-green-500/30"
                      >
                        Speichern
                      </button>
                    </div>
                    {journalIllustrationSaved && (
                      <div className="text-green-400 text-sm">
                        Illustration wird beim Speichern des Eintrags übernommen.
                      </div>
                    )}
                  </div>
                )}
                
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
                        setSelectedAuthor('')
                        setSelectedTimeOfDay('Mittag')
                        setJournalIllustrationUrl(null)
                        setJournalIllustrationSaved(false)
                      }}
                      className="px-6 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg font-semibold transition-colors"
                    >
                      Abbrechen
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Bereiche + Sortierung + Tag-Suche */}
            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10 space-y-3">
              <div className="flex flex-wrap gap-2">
                {[
                  { key: 'all', label: 'Journal' },
                  { key: 'personen', label: 'Personen' },
                  { key: 'monster', label: 'Monster' },
                  { key: 'orte', label: 'Orte' },
                ].map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setJournalCategory(tab.key as any)}
                    className={`px-3 py-2 rounded-full text-sm font-semibold transition-colors ${
                      journalCategory === tab.key
                        ? 'bg-primary-600 text-white'
                        : 'bg-white/10 text-white/70 hover:bg-white/20'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
                <button
                  onClick={() => setJournalSortOrder(journalSortOrder === 'desc' ? 'asc' : 'desc')}
                  className="ml-auto px-3 py-2 rounded-full text-sm font-semibold bg-white/10 text-white/80 hover:bg-white/20 transition-colors"
                >
                  {journalSortOrder === 'desc' ? 'Neueste zuerst' : 'Älteste zuerst'}
                </button>
              </div>
              <div>
                <label className="text-white/80 text-sm mb-2 block">Tag-Suche (z.B. #fallcrest)</label>
                <input
                  type="text"
                  value={journalTagFilter}
                  onChange={(e) => setJournalTagFilter(e.target.value)}
                  placeholder="#fallcrest"
                  className="w-full px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-primary-400"
                />
              </div>
            </div>

            {/* Einträge */}
            <div className="space-y-4">
              {journalEntries
                .filter(entry => matchesJournalCategory(entry))
                .filter(entry => matchesTag(entry.tags, normalizedJournalTagFilter))
                .sort((a, b) => journalSortOrder === 'desc'
                  ? b.timestamp.getTime() - a.timestamp.getTime()
                  : a.timestamp.getTime() - b.timestamp.getTime()
                )
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
                          {entry.tags && entry.tags.length > 0 && (
                            <div className="mt-2 flex flex-wrap gap-2">
                              {entry.tags.map(tag => (
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
                        {entry.illustrationUrl && (
                          <div className="mt-3">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={entry.illustrationUrl}
                              alt={`Illustration zu ${entry.title}`}
                              className="w-full max-w-2xl rounded-lg border border-white/10"
                            />
                          </div>
                        )}
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
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              setEditingEntry(entry)
                              setNewJournalEntry({ 
                                title: entry.title, 
                                content: `${entry.title}: ${entry.content}` 
                              })
                              setSelectedTimeOfDay(entry.timeOfDay || 'Mittag')
                              // Setze Autor
                              if (entry.characterId) {
                                const char = characters.find(c => c.id === entry.characterId)
                                setSelectedAuthor(char ? char.id : '')
                              } else {
                                setSelectedAuthor(entry.author === 'Spielleiter' ? 'spielleiter' : '')
                              }
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
                                // Lösche aus localStorage
                                localStorage.setItem('journalEntries', JSON.stringify(updatedEntries))
                                // TODO: Implementiere deleteJournalEntry in Supabase
                              }
                            }}
                            className="px-3 py-1 bg-red-600/50 hover:bg-red-700/70 text-white rounded text-sm transition-colors"
                          >
                            🗑️ Löschen
                          </button>
                        </div>
                      </div>
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
                    {/* eslint-disable-next-line @next/next/no-img-element */}
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
                        {/* eslint-disable-next-line @next/next/no-img-element */}
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
              
              {/* Neue Fertigkeit hinzufügen / Bearbeiten */}
              <div className="mb-6 p-4 bg-white/5 rounded-lg border border-white/10">
                <h3 className="text-lg font-semibold text-white mb-3">
                  {editingSkill ? 'Fertigkeit bearbeiten' : 'Neue Fertigkeit hinzufügen'}
                </h3>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <input
                      type="text"
                      placeholder="Fertigkeitsname"
                      value={editingSkill?.name || newSkill.name}
                      onChange={(e) => {
                        if (editingSkill) {
                          setEditingSkill({ ...editingSkill, name: e.target.value })
                        } else {
                          setNewSkill({ ...newSkill, name: e.target.value })
                        }
                      }}
                      className="px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-primary-400"
                    />
                    <select
                      value={editingSkill?.attribute || newSkill.attribute}
                      onChange={(e) => {
                        if (editingSkill) {
                          setEditingSkill({ ...editingSkill, attribute: e.target.value })
                        } else {
                          setNewSkill({ ...newSkill, attribute: e.target.value })
                        }
                      }}
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
                          checked={editingSkill?.isWeakened || newSkill.isWeakened}
                          onChange={(e) => {
                            if (editingSkill) {
                              setEditingSkill({ ...editingSkill, isWeakened: e.target.checked })
                            } else {
                              setNewSkill({ ...newSkill, isWeakened: e.target.checked })
                            }
                          }}
                          className="rounded"
                        />
                        <span>Geschwächt</span>
                      </label>
                    </div>
                  </div>
                  <div>
                    <label className="block text-white/90 mb-2">Hover-Over-Text / Beschreibung:</label>
                    <textarea
                      placeholder="Beschreibung der Fertigkeit (wird beim Hovern angezeigt)..."
                      value={editingSkill?.description || newSkill.description}
                      onChange={(e) => {
                        if (editingSkill) {
                          setEditingSkill({ ...editingSkill, description: e.target.value })
                        } else {
                          setNewSkill({ ...newSkill, description: e.target.value })
                        }
                      }}
                      rows={3}
                      className="w-full px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-primary-400"
                    />
                  </div>
                  <div className="flex gap-2">
                    {editingSkill ? (
                      <>
                        <button
                          onClick={() => {
                            if (editingSkill.name.trim()) {
                              updateSkill(editingSkill.id, {
                                name: editingSkill.name.trim(),
                                attribute: editingSkill.attribute,
                                isWeakened: editingSkill.isWeakened,
                                description: editingSkill.description || undefined,
                              })
                              setEditingSkill(null)
                              loadData()
                            }
                          }}
                          className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-semibold transition-colors"
                        >
                          Speichern
                        </button>
                        <button
                          onClick={() => {
                            setEditingSkill(null)
                            setNewSkill({ name: '', attribute: 'Reflexe', isWeakened: false, description: '' })
                          }}
                          className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg font-semibold transition-colors"
                        >
                          Abbrechen
                        </button>
                      </>
                    ) : (
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
                              description: newSkill.description || undefined,
                            })
                            setNewSkill({ name: '', attribute: 'Reflexe', isWeakened: false, description: '' })
                            loadData()
                          }
                        }}
                        className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-semibold transition-colors"
                      >
                        Hinzufügen
                      </button>
                    )}
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
                          <div key={skill.id} className="flex items-center justify-between bg-white/5 rounded p-3 group relative">
                            <div className="flex items-center gap-3 flex-1">
                              <span className="text-white font-medium">{skill.name}</span>
                              {skill.description && (
                                <span className="text-white/50 text-xs cursor-help" title={skill.description}>
                                  ℹ️
                                </span>
                              )}
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
                              {/* Hover-Over-Text */}
                              {skill.description && (
                                <div className="absolute left-0 top-full mt-2 w-80 bg-slate-800 rounded-lg p-3 border border-white/20 shadow-xl z-50 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
                                  <p className="text-white text-sm">{skill.description}</p>
                                </div>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => {
                                  setEditingSkill(skill)
                                }}
                                className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm"
                                title="Bearbeiten"
                              >
                                ✏️
                              </button>
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
                      const value = e.target.value
                      if (value === '') {
                        // Erlaube leeres Feld während der Eingabe
                        setSettings({ ...settings, maxAttributePoints: 0 })
                        return
                      }
                      const numValue = parseInt(value)
                      if (!isNaN(numValue) && numValue >= 1 && numValue <= 20) {
                        const newSettings = { ...settings, maxAttributePoints: numValue }
                        setSettings(newSettings)
                        saveCharacterCreationSettings(newSettings)
                      }
                    }}
                    onBlur={(e) => {
                      // Wenn Feld leer ist beim Verlassen, setze auf Standardwert
                      if (e.target.value === '' || parseInt(e.target.value) < 1) {
                        const newSettings = { ...settings, maxAttributePoints: 7 }
                        setSettings(newSettings)
                        saveCharacterCreationSettings(newSettings)
                      }
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
                      const value = e.target.value
                      if (value === '') {
                        setSettings({ ...settings, maxSkillPoints: 0 })
                        return
                      }
                      const numValue = parseInt(value)
                      if (!isNaN(numValue) && numValue >= 1 && numValue <= 20) {
                        const newSettings = { ...settings, maxSkillPoints: numValue }
                        setSettings(newSettings)
                        saveCharacterCreationSettings(newSettings)
                      }
                    }}
                    onBlur={(e) => {
                      if (e.target.value === '' || parseInt(e.target.value) < 1) {
                        const newSettings = { ...settings, maxSkillPoints: 8 }
                        setSettings(newSettings)
                        saveCharacterCreationSettings(newSettings)
                      }
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
                      const value = e.target.value
                      if (value === '') {
                        setSettings({ ...settings, maxBlibs: 0 })
                        return
                      }
                      const numValue = parseInt(value)
                      if (!isNaN(numValue) && numValue >= 1 && numValue <= 20) {
                        const newSettings = { ...settings, maxBlibs: numValue }
                        setSettings(newSettings)
                        saveCharacterCreationSettings(newSettings)
                      }
                    }}
                    onBlur={(e) => {
                      if (e.target.value === '' || parseInt(e.target.value) < 1) {
                        const newSettings = { ...settings, maxBlibs: 4 }
                        setSettings(newSettings)
                        saveCharacterCreationSettings(newSettings)
                      }
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

      {/* NPC-Erstellung/Edit Dialog */}
      {showNpcCreation && (
        <NpcCreationExtended
          editingNpc={editingNpc}
          onComplete={(npc) => {
            if (editingNpc) {
              // Aktualisiere bestehenden NPC
              const updated = characters.map(c => c.id === editingNpc.id ? npc : c)
              setCharacters(updated)
              saveCharacters(updated)
            } else {
              // Neuer NPC
              const updated = [...characters, npc]
              setCharacters(updated)
              saveCharacters(updated)
            }
            setShowNpcCreation(false)
            setEditingNpc(null)
            loadData()
          }}
          onCancel={() => {
            setShowNpcCreation(false)
            setEditingNpc(null)
          }}
        />
      )}
    </div>
  )
}

