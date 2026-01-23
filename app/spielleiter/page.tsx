'use client'

import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Character, JournalEntry, SharedImage, DiceRoll, DeletedCharacter, Skill, CharacterCreationSettings, Bestiary } from '@/types'
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
  getStorageError,
  clearStorageError,
} from '@/lib/data'
import { getGroupSettings, saveGroupSettings, getBestiary, upsertBestiary, removeBestiary, getInjuryTemplates, getCharacterInjuries, upsertCharacterInjury, removeCharacterInjury } from '@/lib/supabase-data'
import DiceRoller from '@/components/DiceRoller'
import AlignmentSelector from '@/components/AlignmentSelector'
import { calculateSkillValue } from '@/lib/skills'
import { d6ToBlips, formatD6Value } from '@/lib/dice'
import { realDateToFantasyDate, formatFantasyDate, getSpecialEvent, getWeekdayInfo, TIMES_OF_DAY, MONTHS, createFantasyDate, type FantasyDate } from '@/lib/fantasy-calendar'
import { formatCopper } from '@/lib/money'
import { getAlignment } from '@/lib/alignments'
import FantasyCalendarStartDate from '@/components/FantasyCalendarStartDate'
import NameGenerator from '@/components/NameGenerator'
import NpcCreationExtended from '@/components/NpcCreationExtended'
import { extractTagsFromText, normalizeTag } from '@/lib/tags'
import { createSupabaseClient } from '@/lib/supabase'
import { getCharacterSkillPenaltyBlips } from '@/lib/injuries'

const BESTIARY_ATTRIBUTES = ['Reflexe', 'Koordination', 'Stärke', 'Wissen', 'Wahrnehmung', 'Ausstrahlung', 'Magie'] as const
const DEFAULT_MONSTER_ATTRIBUTES = {
  Reflexe: '1D',
  Koordination: '1D',
  Stärke: '1D',
  Wissen: '1D',
  Wahrnehmung: '1D',
  Ausstrahlung: '1D',
  Magie: '0D',
}

export default function SpielleiterPage() {
  const MAX_SHARED_IMAGE_BYTES = 2 * 1024 * 1024
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<'overview' | 'deleted' | 'journal' | 'images' | 'skills' | 'settings' | 'bestiary'>('overview')
  const [characters, setCharacters] = useState<Character[]>([])
  const [deletedCharacters, setDeletedCharacters] = useState<DeletedCharacter[]>([])
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>([])
  const [sharedImages, setSharedImages] = useState<SharedImage[]>([])
  const [sharedImageError, setSharedImageError] = useState('')
  const [diceRolls, setDiceRolls] = useState<DiceRoll[]>([])
  const [newJournalEntry, setNewJournalEntry] = useState({ title: '', content: '' })
  const [selectedTimeOfDay, setSelectedTimeOfDay] = useState<string>('Mittag')
  const [journalTimeJump, setJournalTimeJump] = useState<'immediately' | 'next_time' | 'jump_evening' | 'jump_next_morning' | 'custom'>('next_time')
  const [customJumpDate, setCustomJumpDate] = useState<{ year: number; month: number; day: number } | null>(null)
  const [customJumpTime, setCustomJumpTime] = useState<string>(TIMES_OF_DAY[0])
  const [rewardGroupReason, setRewardGroupReason] = useState('')
  const [editingEntry, setEditingEntry] = useState<JournalEntry | null>(null)
  const [newImage, setNewImage] = useState({ title: '', description: '', url: '' })
  const [journalIllustrationUrl, setJournalIllustrationUrl] = useState<string | null>(null)
  const [journalIllustrationSaved, setJournalIllustrationSaved] = useState(false)
  const [journalIllustrationLoading, setJournalIllustrationLoading] = useState(false)
  const [journalIllustrationError, setJournalIllustrationError] = useState('')
  const [isSavingJournal, setIsSavingJournal] = useState(false)
  const [showSyncIndicator, setShowSyncIndicator] = useState(false)
  const [storageError, setStorageError] = useState('')
  const [injuryTemplates, setInjuryTemplates] = useState<any[]>([])
  const [characterInjuries, setCharacterInjuries] = useState<any[]>([])
  const [selectedInjuryCharacterId, setSelectedInjuryCharacterId] = useState('')
  const [selectedInjurySlot, setSelectedInjurySlot] = useState('')
  const [selectedInjuryTemplateId, setSelectedInjuryTemplateId] = useState('')
  const [selectedInjurySeverity, setSelectedInjurySeverity] = useState<1 | 3>(1)
  const [printNotes, setPrintNotes] = useState('')
  const [rewardGroupBlips, setRewardGroupBlips] = useState('')
  const [rewardSingleBlips, setRewardSingleBlips] = useState('')
  const [rewardSingleReason, setRewardSingleReason] = useState('')
  const [rewardCharacterId, setRewardCharacterId] = useState('')
  const [availableSkills, setAvailableSkills] = useState<Skill[]>([])
  const [newSkill, setNewSkill] = useState({ name: '', attribute: 'Reflexe', isWeakened: false, description: '' })
  const [editingSkill, setEditingSkill] = useState<Skill | null>(null)
  const [bestiary, setBestiary] = useState<Bestiary[]>([])
  const [editingMonster, setEditingMonster] = useState<Bestiary | null>(null)
  const [monsterForm, setMonsterForm] = useState({
    name: '',
    type: 'Bestie',
    level: 1,
    race: '',
    description: '',
    abilities: '',
    maxHp: 1,
    tags: '',
    attributes: { ...DEFAULT_MONSTER_ATTRIBUTES },
  })
  const [monsterImageUrl, setMonsterImageUrl] = useState<string | null>(null)
  const [monsterImageSaved, setMonsterImageSaved] = useState(false)
  const [monsterImageLoading, setMonsterImageLoading] = useState(false)
  const [monsterImageError, setMonsterImageError] = useState('')
  const [bestiaryTagFilter, setBestiaryTagFilter] = useState('')
  const [expandedMonsterId, setExpandedMonsterId] = useState<string | null>(null)
  const [settings, setSettings] = useState<CharacterCreationSettings>(getCharacterCreationSettings())
  const [fantasyCalendarStart, setFantasyCalendarStart] = useState<{
    startDate?: { year: number; month: number; day: number }
    realStartDate?: string
  } | null>(null)
  const [hiddenCharacters, setHiddenCharacters] = useState<Set<string>>(new Set())
  const fileInputRef = useRef<HTMLInputElement>(null)
  const journalBottomRef = useRef<HTMLDivElement>(null)
  const skillDescriptionRef = useRef<HTMLTextAreaElement>(null)
  const isUserEditingRef = useRef(false)
  const lastInputAtRef = useRef(0)
  const syncIndicatorTimeoutRef = useRef<number | null>(null)
  const [groupId, setGroupId] = useState<string | null>(null)
  const [showNpcCreation, setShowNpcCreation] = useState(false)
  const [editingNpc, setEditingNpc] = useState<Character | null>(null)
  const [npcTagFilter, setNpcTagFilter] = useState('')
  const [journalTagFilter, setJournalTagFilter] = useState('')
  const [journalFallcrestFilter, setJournalFallcrestFilter] = useState(true)
  const [journalCategory, setJournalCategory] = useState<'all' | 'personen' | 'monster' | 'orte'>('all')
  const [journalSortOrder, setJournalSortOrder] = useState<'desc' | 'asc'>('asc')

  const matchesTag = (tags: string[] | undefined, filter: string): boolean => {
    if (!filter) return true
    return (tags || []).some(tag => normalizeTag(tag) === filter)
  }
  const normalizedNpcTagFilter = normalizeTag(npcTagFilter)
  const normalizedJournalTagFilter = normalizeTag(journalTagFilter)
  const normalizedBestiaryTagFilter = normalizeTag(bestiaryTagFilter)
  const filteredBestiary = bestiary.filter(monster => matchesTag(monster.tags, normalizedBestiaryTagFilter))
  const matchesJournalCategory = (entry: JournalEntry): boolean => {
    if (journalCategory === 'all') return true
    return matchesTag(entry.tags, journalCategory)
  }
  const journalWordCount = newJournalEntry.content.trim()
    ? newJournalEntry.content.trim().split(/\s+/).length
    : 0
  const canGenerateJournalIllustration = journalWordCount >= 50 && !journalIllustrationUrl

  const parseSkillName = (name: string) => {
    const trimmed = name.trim()
    const match = trimmed.match(/^\s*(\d+)[\).\s-]+(.+)$/)
    if (!match) {
      return { sortOrder: null as number | null, displayName: trimmed }
    }
    return { sortOrder: Number(match[1]), displayName: match[2].trim() }
  }

  const getSkillDisplayName = (name: string) => parseSkillName(name).displayName

  const normalizeSkillKey = (value: string) =>
    value
      .trim()
      .toLowerCase()
      .replace(/ä/g, 'ae')
      .replace(/ö/g, 'oe')
      .replace(/ü/g, 'ue')
      .replace(/ß/g, 'ss')
  const getEquipmentSkillBonus = (character: Character, skillName: string): number => {
    const target = normalizeSkillKey(skillName)
    let total = 0
    character.inventory.forEach((item) => {
      if (!item.equippedSlots || !item.stats) return
      Object.entries(item.stats).forEach(([key, value]) => {
        if (normalizeSkillKey(key) === target && Number.isFinite(value)) {
          total += Number(value)
        }
      })
    })
    return total
  }

  const [gmName, setGmName] = useState('')
  const gmNameLabel = gmName.trim() || 'Spielleiter'

  const resolveRealStartDate = useMemo(() => {
    return fantasyCalendarStart?.realStartDate
      ? new Date(fantasyCalendarStart.realStartDate)
      : undefined
  }, [fantasyCalendarStart?.realStartDate])

  const getEntryFantasyDate = useCallback((entry: JournalEntry): FantasyDate | null => {
    if (entry.fantasyDate) return entry.fantasyDate
    if (!entry.timestamp) return null
    return realDateToFantasyDate(entry.timestamp, fantasyCalendarStart?.startDate, resolveRealStartDate)
  }, [fantasyCalendarStart?.startDate, resolveRealStartDate])

  const lastJournalEntry = useMemo(() => {
    if (journalEntries.length === 0) return null
    return journalEntries.reduce((latest, entry) =>
      entry.timestamp.getTime() > latest.timestamp.getTime() ? entry : latest
    )
  }, [journalEntries])

  const lastEntryFantasyDate = useMemo(
    () => (lastJournalEntry ? getEntryFantasyDate(lastJournalEntry) : null),
    [lastJournalEntry, getEntryFantasyDate]
  )

  const normalizeTimeOfDay = (time?: string): string => {
    if (time && TIMES_OF_DAY.includes(time as any)) return time
    return 'Mittag'
  }

  const lastEntryTimeOfDay = normalizeTimeOfDay(lastJournalEntry?.timeOfDay)

  const baseFantasyDate = useMemo(() => {
    if (lastEntryFantasyDate) return lastEntryFantasyDate
    return realDateToFantasyDate(new Date(), fantasyCalendarStart?.startDate, resolveRealStartDate)
  }, [lastEntryFantasyDate, fantasyCalendarStart, resolveRealStartDate])

  const addFantasyDays = (date: FantasyDate, days: number): FantasyDate => {
    let { year, month, day } = date
    let remaining = days
    while (remaining > 0) {
      day += 1
      if (day > 30) {
        day = 1
        month += 1
        if (month > 12) {
          month = 1
          year += 1
        }
      }
      remaining -= 1
    }
    while (remaining < 0) {
      day -= 1
      if (day < 1) {
        day = 30
        month -= 1
        if (month < 1) {
          month = 12
          year = Math.max(1, year - 1)
        }
      }
      remaining += 1
    }
    return createFantasyDate(year, month, day)
  }

  const resolveNextJournalDate = (): { fantasyDate: FantasyDate; timeOfDay: string } => {
    const timeOrder = TIMES_OF_DAY
    const baseTimeIndex = timeOrder.indexOf(lastEntryTimeOfDay as any)
    const eveningTime = timeOrder.includes('Untergang' as any) ? 'Untergang' : timeOrder[timeOrder.length - 2]
    const morningTime = timeOrder.includes('Früh' as any) ? 'Früh' : timeOrder[0]

    if (journalTimeJump === 'immediately') {
      return { fantasyDate: baseFantasyDate, timeOfDay: lastEntryTimeOfDay }
    }

    if (journalTimeJump === 'next_time') {
      if (baseTimeIndex >= 0 && baseTimeIndex < timeOrder.length - 1) {
        return { fantasyDate: baseFantasyDate, timeOfDay: timeOrder[baseTimeIndex + 1] }
      }
      return { fantasyDate: addFantasyDays(baseFantasyDate, 1), timeOfDay: timeOrder[0] }
    }

    if (journalTimeJump === 'jump_evening') {
      const eveningIndex = timeOrder.indexOf(eveningTime as any)
      const shouldAdvance = baseTimeIndex >= 0 && eveningIndex >= 0 && baseTimeIndex >= eveningIndex
      return {
        fantasyDate: shouldAdvance ? addFantasyDays(baseFantasyDate, 1) : baseFantasyDate,
        timeOfDay: eveningTime,
      }
    }

    if (journalTimeJump === 'jump_next_morning') {
      return { fantasyDate: addFantasyDays(baseFantasyDate, 1), timeOfDay: morningTime }
    }

    if (customJumpDate) {
      return {
        fantasyDate: createFantasyDate(customJumpDate.year, customJumpDate.month, customJumpDate.day),
        timeOfDay: customJumpTime,
      }
    }

    return { fantasyDate: baseFantasyDate, timeOfDay: lastEntryTimeOfDay }
  }

  const previewJournalDate = resolveNextJournalDate()
  const lastEntryLabel = lastEntryFantasyDate
    ? formatFantasyDate(lastEntryFantasyDate, true, lastEntryTimeOfDay)
    : 'Noch kein Eintrag'
  const previewEntryLabel = formatFantasyDate(previewJournalDate.fantasyDate, true, previewJournalDate.timeOfDay)

  const updateCustomJumpDate = (updates: Partial<{ year: number; month: number; day: number }>) => {
    setCustomJumpDate((prev) => {
      const fallback = prev || {
        year: baseFantasyDate.year,
        month: baseFantasyDate.month,
        day: baseFantasyDate.day,
      }
      return { ...fallback, ...updates }
    })
  }

  useEffect(() => {
    if (typeof window === 'undefined') return
    const storedGmName = localStorage.getItem('gmName')
    if (storedGmName) {
      setGmName(storedGmName)
    }
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') return
    let blurTimeout: number | undefined
    const isEditableTarget = (target: EventTarget | null) => {
      if (!(target instanceof HTMLElement)) return false
      const tag = target.tagName
      return target.isContentEditable || tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT'
    }
    const handleFocusIn = (event: FocusEvent) => {
      if (!isEditableTarget(event.target)) return
      if (blurTimeout) window.clearTimeout(blurTimeout)
      isUserEditingRef.current = true
    }
    const handleFocusOut = (event: FocusEvent) => {
      if (!isEditableTarget(event.target)) return
      blurTimeout = window.setTimeout(() => {
        isUserEditingRef.current = false
      }, 200)
    }
    const handleInput = () => {
      lastInputAtRef.current = Date.now()
    }
    const handlePointerDown = () => {
      lastInputAtRef.current = Date.now()
      isUserEditingRef.current = true
      window.setTimeout(() => {
        isUserEditingRef.current = false
      }, 400)
    }
    document.addEventListener('focusin', handleFocusIn)
    document.addEventListener('focusout', handleFocusOut)
    document.addEventListener('input', handleInput, true)
    document.addEventListener('pointerdown', handlePointerDown, true)
    return () => {
      if (blurTimeout) window.clearTimeout(blurTimeout)
      document.removeEventListener('focusin', handleFocusIn)
      document.removeEventListener('focusout', handleFocusOut)
      document.removeEventListener('input', handleInput, true)
      document.removeEventListener('pointerdown', handlePointerDown, true)
    }
  }, [])

  useEffect(() => {
    if (journalTimeJump !== 'custom') return
    if (!customJumpDate) {
      const nextDay = addFantasyDays(baseFantasyDate, 1)
      setCustomJumpDate({ year: nextDay.year, month: nextDay.month, day: nextDay.day })
    }
    if (!customJumpTime) {
      setCustomJumpTime(TIMES_OF_DAY[0])
    }
  }, [journalTimeJump, customJumpDate, customJumpTime, baseFantasyDate])

  useEffect(() => {
    if (journalTimeJump === 'custom') {
      setSelectedTimeOfDay(customJumpTime)
    } else {
      setSelectedTimeOfDay(previewJournalDate.timeOfDay)
    }
  }, [journalTimeJump, previewJournalDate.timeOfDay, customJumpTime])

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
    const storageError = getStorageError()
    if (storageError) {
      setStorageError(storageError)
    }
    const bestiaryData = await getBestiary()
    setBestiary(bestiaryData)
    
    // Lade Gruppenmitglieder und Kalender-Startdaten
    const currentGroupId = groupId || (typeof window !== 'undefined' ? localStorage.getItem('groupId') : null)
    if (currentGroupId) {
      const templates = await getInjuryTemplates()
      setInjuryTemplates(templates)
      const injuries = await getCharacterInjuries(currentGroupId)
      setCharacterInjuries(injuries)

      const groupSettings = await getGroupSettings(currentGroupId)
      if (groupSettings?.fantasyCalendar) {
        setFantasyCalendarStart({
          startDate: groupSettings.fantasyCalendar.startDate,
          realStartDate: groupSettings.fantasyCalendar.realStartDate,
        })
      } else {
        setFantasyCalendarStart(null)
      }
      setPrintNotes(groupSettings?.printNotes || '')
    } else {
      setInjuryTemplates([])
      setCharacterInjuries([])
      setPrintNotes('')
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

  useEffect(() => {
    if (typeof window === 'undefined') return
    const handleStorageError = (event: Event) => {
      const detail = (event as CustomEvent<string>).detail
      if (detail) {
        setStorageError(detail)
      }
    }
    window.addEventListener('storage-error', handleStorageError as EventListener)
    return () => {
      window.removeEventListener('storage-error', handleStorageError as EventListener)
    }
  }, [])

  // Automatisches Neuladen alle 5 Sekunden (Polling für Echtzeit-Synchronisation)
  useEffect(() => {
    const interval = setInterval(() => {
      const activeEl = typeof document !== 'undefined' ? document.activeElement : null
      const isEditingElement = activeEl instanceof HTMLInputElement
        || activeEl instanceof HTMLTextAreaElement
        || activeEl instanceof HTMLSelectElement
        || (activeEl instanceof HTMLElement && activeEl.isContentEditable)
      if (Date.now() - lastInputAtRef.current < 1500) return
      if (isUserEditingRef.current || isEditingElement || showNpcCreation || Boolean(editingMonster)) return
      loadData()
    }, 5000) // Alle 5 Sekunden

    return () => clearInterval(interval)
  }, [groupId, loadData, showNpcCreation, editingMonster])

  useEffect(() => {
    const supabase = createSupabaseClient()
    if (!supabase || !groupId) return
    const channel = supabase.channel(`realtime-group-${groupId}`)
    const handleRealtimeChange = () => {
      if (showNpcCreation || Boolean(editingMonster)) return
      if (isUserEditingRef.current) return
      loadData()
      setShowSyncIndicator(true)
      if (syncIndicatorTimeoutRef.current) {
        window.clearTimeout(syncIndicatorTimeoutRef.current)
      }
      syncIndicatorTimeoutRef.current = window.setTimeout(() => {
        setShowSyncIndicator(false)
      }, 1500)
    }
    channel.on(
      'postgres_changes',
      { event: 'UPDATE', schema: 'public', table: 'characters', filter: `group_id=eq.${groupId}` },
      handleRealtimeChange
    )
    channel.on(
      'postgres_changes',
      { event: 'UPDATE', schema: 'public', table: 'journal_entries', filter: `group_id=eq.${groupId}` },
      handleRealtimeChange
    )
    channel.on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'character_injuries', filter: `group_id=eq.${groupId}` },
      handleRealtimeChange
    )
    channel.subscribe()
    return () => {
      if (syncIndicatorTimeoutRef.current) {
        window.clearTimeout(syncIndicatorTimeoutRef.current)
      }
      supabase.removeChannel(channel)
    }
  }, [groupId, loadData, showNpcCreation, editingMonster])

  useEffect(() => {
    if (activeTab === 'journal') {
      setTimeout(() => {
        journalBottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
      }, 0)
    }
  }, [activeTab, journalEntries.length])

  const applyBlipRewards = (updater: (char: Character) => Character) => {
    const updated = characters.map((char) => {
      if (char.deletedDate || char.isNPC) return char
      return updater(char)
    })
    setCharacters(updated)
    saveCharacters(updated)
  }

  const parseRewardValue = (value: string): number | null => {
    const amount = parseInt(value)
    if (!Number.isFinite(amount) || amount <= 0) {
      alert('Bitte eine gültige Blip-Zahl eingeben.')
      return null
    }
    return amount
  }

  const resetMonsterForm = () => {
    setEditingMonster(null)
    setMonsterForm({
      name: '',
      type: 'Bestie',
      level: 1,
      race: '',
      description: '',
      abilities: '',
      maxHp: 1,
      tags: '',
      attributes: { ...DEFAULT_MONSTER_ATTRIBUTES },
    })
    setMonsterImageUrl(null)
    setMonsterImageSaved(false)
  }

  const handleGenerateMonsterImage = async () => {
    setMonsterImageLoading(true)
    setMonsterImageError('')
    try {
      const response = await fetch('/api/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'monster',
          data: {
            name: monsterForm.name,
            monsterType: monsterForm.type,
            abilities: monsterForm.abilities.split(/[,\n;]/).map(a => a.trim()).filter(Boolean),
          },
        }),
      })
      const json = await response.json()
      if (response.ok && json?.imageUrl) {
        setMonsterImageUrl(json.imageUrl)
        setMonsterImageSaved(false)
      } else {
        const reason = typeof json?.error === 'string'
          ? json.error
          : json?.details || 'Bild konnte nicht generiert werden.'
        setMonsterImageError(reason)
      }
    } catch (error) {
      setMonsterImageError('Bildgenerierung fehlgeschlagen. Prüfe Internetverbindung und API-Key.')
    } finally {
      setMonsterImageLoading(false)
    }
  }

  const handleSaveMonster = async () => {
    if (!monsterForm.name.trim()) {
      alert('Bitte gib einen Namen an.')
      return
    }
    const abilities = monsterForm.abilities.split(/[,\n;]/).map(a => a.trim()).filter(Boolean)
    const tags = extractTagsFromText(monsterForm.tags)
    const attributes = BESTIARY_ATTRIBUTES.reduce((acc, attr) => {
      const value = monsterForm.attributes[attr] || '0D'
      return { ...acc, [attr]: value }
    }, {} as Record<string, string>)
    const monster: Bestiary = {
      id: editingMonster?.id || `monster-${Date.now()}`,
      name: monsterForm.name.trim(),
      type: monsterForm.type,
      level: Number(monsterForm.level) || 1,
      race: monsterForm.race.trim() || undefined,
      description: monsterForm.description.trim() || undefined,
      abilities,
      tags,
      attributes,
      maxHp: Number(monsterForm.maxHp) || 1,
      fallcrestTwist: '',
      imageUrl: monsterImageSaved ? monsterImageUrl || undefined : undefined,
    }
    const success = await upsertBestiary(monster)
    if (success) {
      await loadData()
      resetMonsterForm()
    } else {
      alert('Fehler beim Speichern des Monsters.')
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
    if (file.size > MAX_SHARED_IMAGE_BYTES) {
      setSharedImageError(`Bild zu groß. Maximal erlaubt: ${Math.floor(MAX_SHARED_IMAGE_BYTES / 1024 / 1024)} MB.`)
      e.target.value = ''
      setNewImage({ ...newImage, url: '' })
      return
    }

    const reader = new FileReader()
    reader.onload = (event) => {
      const url = event.target?.result as string
      setNewImage({ ...newImage, url })
    }
    reader.readAsDataURL(file)
  }

  const handleShareImage = () => {
    setSharedImageError('')
    if (!newImage.url.trim()) {
      alert('Bitte wähle ein Bild aus oder gib eine URL ein')
      return
    }

    const image: SharedImage = {
      id: Date.now().toString(),
      url: newImage.url,
      title: newImage.title || undefined,
      description: newImage.description || undefined,
      sentBy: gmNameLabel,
      timestamp: new Date(),
    }

    const success = saveSharedImage(image)
    if (!success) {
      setSharedImageError('Bild konnte nicht gespeichert werden. Bitte kleinere Datei wählen oder Speicher prüfen.')
      return
    }
    const images = [...sharedImages, image]
    setSharedImages(images)
    setNewImage({ title: '', description: '', url: '' })
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleAddJournalEntry = async () => {
    if (!newJournalEntry.content.trim()) return
    if (isSavingJournal) return
    setIsSavingJournal(true)

    const now = new Date()
    const resolvedJournalDate = previewJournalDate
    const fantasyDate = editingEntry?.fantasyDate || resolvedJournalDate.fantasyDate
    const timeOfDay = editingEntry?.timeOfDay || resolvedJournalDate.timeOfDay

    // Bestimme Autor (Spielleiter bzw. vorhandener Eintrag)
    const author = editingEntry?.author || gmNameLabel
    const characterId = editingEntry?.characterId

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
      imageUrl: journalIllustrationSaved ? journalIllustrationUrl || undefined : undefined,
      timestamp: editingEntry?.timestamp || now,
      fantasyDate,
      timeOfDay: timeOfDay as any,
    }

    try {
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
      setSelectedTimeOfDay('Mittag')
      setJournalIllustrationUrl(null)
      setJournalIllustrationSaved(false)
    } finally {
      setIsSavingJournal(false)
    }
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

  const handleForceRefresh = async () => {
    if (!confirm('Cache jetzt löschen und Daten neu laden?')) return
    const keys = ['characters', 'journalEntries', 'sharedImages', 'availableSkills', 'diceRolls', 'bestiary']
    keys.forEach((key) => localStorage.removeItem(key))
    await loadData()
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
          {showSyncIndicator && (
            <div className="text-green-400 text-sm font-semibold">✓ Daten synchronisiert</div>
          )}
          <div className="flex items-center gap-3">
            <button
              onClick={handleForceRefresh}
              className="text-white/70 hover:text-white"
              title="Force-Refresh"
            >
              🔄
            </button>
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
        </div>
        {storageError && (
          <div className="mb-6 rounded-lg border border-red-500/40 bg-red-500/10 p-4 text-red-200">
            <div className="font-semibold mb-1">Speicher-Problem</div>
            <div className="text-sm">{storageError}</div>
            <button
              onClick={() => {
                clearStorageError()
                setStorageError('')
              }}
              className="mt-3 px-3 py-1.5 rounded bg-white/10 hover:bg-white/20 text-white text-xs font-semibold"
            >
              Hinweis schließen
            </button>
          </div>
        )}

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
            onClick={() => setActiveTab('bestiary')}
            className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
              activeTab === 'bestiary'
                ? 'bg-primary-600 text-white'
                : 'bg-white/10 text-white/70 hover:bg-white/20'
            }`}
          >
            🐲 Bestiarium
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

            {/* Verletzungen */}
            <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
              <h2 className="text-2xl font-bold text-white mb-4">Verletzungs-Menü</h2>
              {(() => {
                const currentGroupId = groupId || (typeof window !== 'undefined' ? localStorage.getItem('groupId') : null)
                const groupCharacters = (groupId ? characters : characters).filter(char =>
                  !char.deletedDate && !char.isNPC
                )
                if (groupCharacters.length === 0) {
                  return <p className="text-white/70">Noch keine Spieler-Charaktere vorhanden.</p>
                }
                const templateById = new Map(injuryTemplates.map(t => [t.id, t]))
                const filteredTemplates = selectedInjurySlot
                  ? injuryTemplates.filter(t => t.slot === selectedInjurySlot)
                  : injuryTemplates
                const injuriesForSelected = characterInjuries.filter(i => i.characterId === selectedInjuryCharacterId)
                return (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                      <select
                        value={selectedInjuryCharacterId}
                        onChange={(e) => setSelectedInjuryCharacterId(e.target.value)}
                        className="w-full px-3 py-2 rounded bg-white/10 border border-white/20 text-white focus:outline-none focus:ring-2 focus:ring-primary-400"
                      >
                        <option value="" className="bg-slate-800">Charakter wählen...</option>
                        {groupCharacters.map(char => (
                          <option key={char.id} value={char.id} className="bg-slate-800">
                            {char.name} ({char.playerName})
                          </option>
                        ))}
                      </select>
                      <select
                        value={selectedInjurySlot}
                        onChange={(e) => setSelectedInjurySlot(e.target.value)}
                        className="w-full px-3 py-2 rounded bg-white/10 border border-white/20 text-white focus:outline-none focus:ring-2 focus:ring-primary-400"
                      >
                        <option value="" className="bg-slate-800">Slot wählen...</option>
                        {[
                          'head', 'neck', 'ears', 'torso', 'legs', 'feet', 'back',
                          'finger_l', 'finger_r', 'wrists', 'ankles', 'main_hand', 'off_hand', 'belt', 'psyche'
                        ].map(slot => (
                          <option key={slot} value={slot} className="bg-slate-800">{slot}</option>
                        ))}
                      </select>
                      <select
                        value={selectedInjuryTemplateId}
                        onChange={(e) => setSelectedInjuryTemplateId(e.target.value)}
                        className="w-full px-3 py-2 rounded bg-white/10 border border-white/20 text-white focus:outline-none focus:ring-2 focus:ring-primary-400"
                      >
                        <option value="" className="bg-slate-800">Verletzung wählen...</option>
                        {filteredTemplates.map(template => (
                          <option key={template.id} value={template.id} className="bg-slate-800">
                            {template.name}
                          </option>
                        ))}
                      </select>
                      <select
                        value={selectedInjurySeverity}
                        onChange={(e) => setSelectedInjurySeverity(Number(e.target.value) as 1 | 3)}
                        className="w-full px-3 py-2 rounded bg-white/10 border border-white/20 text-white focus:outline-none focus:ring-2 focus:ring-primary-400"
                      >
                        <option value={1} className="bg-slate-800">Ladiert (-1)</option>
                        <option value={3} className="bg-slate-800">Verwundet (-3)</option>
                      </select>
                      <button
                        onClick={async () => {
                          if (!currentGroupId) {
                            alert('Kein groupId gefunden.')
                            return
                          }
                          if (!selectedInjuryCharacterId || !selectedInjurySlot || !selectedInjuryTemplateId) {
                            alert('Bitte Charakter, Slot und Verletzung auswahlen.')
                            return
                          }
                          const existingForSlot = injuriesForSelected.filter(
                            (injury) => injury.slot === selectedInjurySlot
                          )
                          const countLight = existingForSlot.filter(i => i.currentSeverity === 1).length
                          const countHeavy = existingForSlot.filter(i => i.currentSeverity === 3).length
                          if (selectedInjurySeverity === 1 && countLight >= 3) {
                            alert('Maximal 3x Ladiert pro Slot erlaubt.')
                            return
                          }
                          if (selectedInjurySeverity === 3 && countHeavy >= 3) {
                            alert('Maximal 3x Verwundet pro Slot erlaubt.')
                            return
                          }
                          const success = await upsertCharacterInjury({
                            groupId: currentGroupId,
                            characterId: selectedInjuryCharacterId,
                            slot: selectedInjurySlot as any,
                            templateId: selectedInjuryTemplateId,
                            currentSeverity: selectedInjurySeverity,
                          })
                          if (!success) {
                            console.warn('Failed to upsert character injury.', {
                              characterId: selectedInjuryCharacterId,
                              slot: selectedInjurySlot,
                              templateId: selectedInjuryTemplateId,
                            })
                          }
                          await loadData()
                        }}
                        className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-semibold transition-colors"
                      >
                        Verletzung zuweisen
                      </button>
                    </div>
                    {selectedInjuryCharacterId && (
                      <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                        <div className="text-white/80 text-sm mb-2">Aktive Verletzungen</div>
                        {injuriesForSelected.length === 0 ? (
                          <div className="text-white/60 text-sm">Keine Verletzungen gesetzt.</div>
                        ) : (
                          <div className="space-y-2">
                            {injuriesForSelected.map((injury) => {
                              const template = templateById.get(injury.templateId)
                              return (
                                <div key={injury.id} className="flex items-center justify-between bg-white/5 rounded p-2">
                                  <div className="text-white text-sm">
                                    {template?.name || injury.templateId} • {injury.slot} • {injury.currentSeverity === 3 ? 'Verwundet' : 'Ladiert'}
                                  </div>
                                  <button
                                    onClick={async () => {
                                      const success = await removeCharacterInjury(injury.id)
                                      if (!success) {
                                        console.warn('Failed to remove character injury.', { injuryId: injury.id })
                                      }
                                      await loadData()
                                    }}
                                    className="text-red-300 hover:text-red-200 text-xs"
                                  >
                                    Entfernen
                                  </button>
                                </div>
                              )
                            })}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )
              })()}
            </div>

            {/* Geldverwaltung */}
            <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
              <h2 className="text-2xl font-bold text-white mb-4">Geldverwaltung</h2>
              {(() => {
                const groupCharacters = characters.filter(char => !char.deletedDate && !char.isNPC)
                if (groupCharacters.length === 0) {
                  return <p className="text-white/70">Noch keine Spieler-Charaktere vorhanden.</p>
                }
                return (
                  <div className="space-y-3">
                    {groupCharacters.map((char) => (
                      <div key={char.id} className="grid grid-cols-1 md:grid-cols-3 gap-3 items-center bg-white/5 rounded-lg p-3">
                        <div className="text-white">
                          {char.name} <span className="text-white/60">({char.playerName})</span>
                        </div>
                        <div className="text-white/70">
                          {formatCopper(char.copperCoins)}
                        </div>
                        <input
                          type="number"
                          min="0"
                          value={char.copperCoins ?? 0}
                          onChange={(e) => {
                            const next = Math.max(0, Number(e.target.value || 0))
                            const updated = characters.map((c) =>
                              c.id === char.id ? { ...c, copperCoins: next } : c
                            )
                            setCharacters(updated)
                            saveCharacters(updated)
                          }}
                          className="w-full px-3 py-2 rounded bg-white/10 border border-white/20 text-white focus:outline-none focus:ring-2 focus:ring-primary-400"
                          placeholder="Kupfer"
                        />
                      </div>
                    ))}
                  </div>
                )
              })()}
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
                    const equipmentBonus = getEquipmentSkillBonus(char, dodgeSkill.name)
                    const injuryPenalty = getCharacterSkillPenaltyBlips(characterInjuries, char.id, dodgeSkill.name)
                    const baseSkillFormula = calculateSkillValue(
                      attributeValue,
                      dodgeSkill.bonusDice,
                      dodgeSkill.bonusSteps || 0,
                      dodgeSkill.isWeakened,
                      isLearned
                    )
                    const totalBlips =
                      d6ToBlips(baseSkillFormula) + equipmentBonus - injuryPenalty
                    return formatD6Value(totalBlips)
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
                    const equipmentBonus = getEquipmentSkillBonus(char, meleeSkill.name)
                    const injuryPenalty = getCharacterSkillPenaltyBlips(characterInjuries, char.id, meleeSkill.name)
                    const baseSkillFormula = calculateSkillValue(
                      attributeValue,
                      meleeSkill.bonusDice,
                      meleeSkill.bonusSteps || 0,
                      meleeSkill.isWeakened,
                      isLearned
                    )
                    const totalBlips =
                      d6ToBlips(baseSkillFormula) + equipmentBonus - injuryPenalty
                    return formatD6Value(totalBlips)
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
                    const equipmentBonus = getEquipmentSkillBonus(char, rangedSkill.name)
                    const injuryPenalty = getCharacterSkillPenaltyBlips(characterInjuries, char.id, rangedSkill.name)
                    const baseSkillFormula = calculateSkillValue(
                      attributeValue,
                      rangedSkill.bonusDice,
                      rangedSkill.bonusSteps || 0,
                      rangedSkill.isWeakened,
                      isLearned
                    )
                    const totalBlips =
                      d6ToBlips(baseSkillFormula) + equipmentBonus - injuryPenalty
                    return formatD6Value(totalBlips)
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
                                                  const author = playerName || gmNameLabel
                                                  
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
                              placeholder="Tag filtern (z.B. #personen)"
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

                                          const author = gmNameLabel
                                          
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
                const allSkillsMap = new Map<string, Map<string, { character: Character; skill: any; specialization?: any; value: string; injuryPenalty: number }[]>>()
                
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
                    const equipmentBonus = getEquipmentSkillBonus(character, skill.name)
                    const injuryPenalty = getCharacterSkillPenaltyBlips(characterInjuries, character.id, skill.name)
                    const baseSkillFormula = calculateSkillValue(
                      attributeValue,
                      skill.bonusDice,
                      skill.bonusSteps || 0,
                      skill.isWeakened,
                      isLearned
                    )
                    const totalBlips =
                      d6ToBlips(baseSkillFormula) + equipmentBonus - injuryPenalty
                    const skillDiceFormula = formatD6Value(totalBlips)
                    
                    if (!skillsMap.has(skill.name)) {
                      skillsMap.set(skill.name, [])
                    }
                    skillsMap.get(skill.name)!.push({
                      character,
                      skill,
                      value: skillDiceFormula,
                      injuryPenalty
                    })
                    
                    // Spezialisierungen
                    if (skill.specializations && skill.specializations.length > 0) {
                      skill.specializations.forEach((spec: any) => {
                        const specBlibs = spec.blibs
                        const baseSpecFormula = calculateSkillValue(
                          attributeValue,
                          skill.bonusDice,
                          (skill.bonusSteps || 0) + specBlibs,
                          skill.isWeakened,
                          isLearned
                        )
                        const specTotalBlips =
                          d6ToBlips(baseSpecFormula) + equipmentBonus - injuryPenalty
                        const specDiceFormula = formatD6Value(specTotalBlips)
                        const specKey = `${skill.name} - ${spec.name}`
                        if (!skillsMap.has(specKey)) {
                          skillsMap.set(specKey, [])
                        }
                        skillsMap.get(specKey)!.push({
                          character,
                          skill,
                          specialization: spec,
                          value: specDiceFormula,
                          injuryPenalty
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
                                            <div className={`font-mono ${entry.injuryPenalty > 0 ? 'text-red-300' : ''}`}>
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
            {/* Blip-Belohnungen */}
            <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
              <h2 className="text-2xl font-bold text-white mb-4">Blip-Belohnungen</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                  <h3 className="text-white font-semibold mb-3">Gruppen-Belohnung</h3>
                  <div className="flex gap-3">
                    <input
                      type="number"
                      min="1"
                      placeholder="z.B. 3"
                      value={rewardGroupBlips}
                      onChange={(e) => setRewardGroupBlips(e.target.value)}
                      className="flex-1 px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-primary-400"
                    />
                    <button
                      onClick={() => {
                        const amount = parseRewardValue(rewardGroupBlips)
                        if (!amount) return
                        applyBlipRewards((char) => ({
                          ...char,
                          earnedBlips: (char.earnedBlips || 0) + amount,
                        }))
                        setRewardGroupBlips('')
                        setRewardGroupReason('')
                      }}
                      className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-semibold"
                    >
                      Alle belohnen
                    </button>
                  </div>
                  <input
                    type="text"
                    placeholder="Begründung (optional)"
                    value={rewardGroupReason}
                    onChange={(e) => setRewardGroupReason(e.target.value)}
                    className="mt-3 w-full px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-primary-400"
                  />
                  <p className="text-white/60 text-sm mt-2">
                    Fügt Blips zu allen Spieler-Charakteren hinzu.
                  </p>
                </div>

                <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                  <h3 className="text-white font-semibold mb-3">Einzel-Belohnung</h3>
                  <div className="space-y-3">
                    <select
                      value={rewardCharacterId}
                      onChange={(e) => setRewardCharacterId(e.target.value)}
                      className="w-full px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white focus:outline-none focus:ring-2 focus:ring-primary-400"
                    >
                      <option value="" className="bg-slate-800">Charakter auswählen</option>
                      {characters.filter(c => !c.deletedDate && !c.isNPC).map((char) => (
                        <option key={char.id} value={char.id} className="bg-slate-800">
                          {char.name}
                        </option>
                      ))}
                    </select>
                    <div className="flex gap-3">
                      <input
                        type="number"
                        min="1"
                        placeholder="z.B. 2"
                        value={rewardSingleBlips}
                        onChange={(e) => setRewardSingleBlips(e.target.value)}
                        className="flex-1 px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-primary-400"
                      />
                      <button
                        onClick={() => {
                          const amount = parseRewardValue(rewardSingleBlips)
                          if (!amount || !rewardCharacterId) {
                            alert('Bitte Charakter wählen und Blips angeben.')
                            return
                          }
                          applyBlipRewards((char) => (
                            char.id === rewardCharacterId
                              ? { ...char, earnedBlips: (char.earnedBlips || 0) + amount }
                              : char
                          ))
                          setRewardSingleBlips('')
                          setRewardCharacterId('')
                          setRewardSingleReason('')
                        }}
                        className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-semibold"
                      >
                        Einzel belohnen
                      </button>
                    </div>
                    <input
                      type="text"
                      placeholder="Begründung (optional)"
                      value={rewardSingleReason}
                      onChange={(e) => setRewardSingleReason(e.target.value)}
                      className="w-full px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-primary-400"
                    />
                  </div>
                  <p className="text-white/60 text-sm mt-2">
                    Für besondere Leistungen eines einzelnen Charakters.
                  </p>
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
                <label className="text-white/80 text-sm mb-2 block">Tag-Suche (z.B. #orte)</label>
                <input
                  type="text"
                  value={journalTagFilter}
                  onChange={(e) => setJournalTagFilter(e.target.value)}
                  placeholder="#orte"
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
                      ? formatFantasyDate(
                          realDateToFantasyDate(
                            entry.timestamp,
                            fantasyCalendarStart?.startDate,
                            fantasyCalendarStart?.realStartDate ? new Date(fantasyCalendarStart.realStartDate) : undefined
                          ),
                          true,
                          entry.timeOfDay
                        )
                      : null
                  const specialEvent = entry.fantasyDate ? getSpecialEvent(entry.fantasyDate) : null
                  const realDateLabel = entry.timestamp.toLocaleDateString('de-DE', {
                    day: '2-digit',
                    month: 'long',
                    year: 'numeric',
                  })
                  
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
                            <div className="relative group text-white/90 text-sm font-semibold mb-1">
                              {fantasyDate}
                              <div className="absolute right-0 top-full mt-2 w-64 bg-slate-800 rounded-lg p-3 border border-white/20 shadow-xl z-50 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 delay-1000">
                                <div className="text-white text-sm font-semibold">{fantasyDate}</div>
                                <div className="text-white/70 text-xs mt-1">
                                  Reales Datum: {realDateLabel}
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
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
                              // Scrolle zum Formular
                              journalBottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
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

            {/* Neuer Eintrag hinzufügen */}
            <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
              <h2 className="text-2xl font-bold text-white mb-4">
                {editingEntry ? 'Eintrag bearbeiten' : 'Neuer Eintrag'}
              </h2>
              <div className="space-y-4">
                {/* Abenteuer-Datum Fortschritt */}
                <div className="space-y-2">
                  <div className="text-white/70 text-sm">
                    Letzter Eintrag: <span className="text-white">{lastEntryLabel}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <label className="text-white/90 w-32">Datum-Fortschritt:</label>
                    <select
                      value={journalTimeJump}
                      onChange={(e) => setJournalTimeJump(e.target.value as any)}
                      className="flex-1 px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white focus:outline-none focus:ring-2 focus:ring-primary-400"
                    >
                      <option value="immediately" className="bg-slate-800">unmittelbar</option>
                      <option value="next_time" className="bg-slate-800">nächste Tageszeit</option>
                      <option value="jump_evening" className="bg-slate-800">Sprung zum Abend</option>
                      <option value="jump_next_morning" className="bg-slate-800">Sprung zur nächsten Früh</option>
                      <option value="custom" className="bg-slate-800">x Tage später</option>
                    </select>
                  </div>
                  {journalTimeJump === 'custom' && (
                    <div className="bg-white/5 rounded-lg p-3 border border-white/10">
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                        <input
                          type="number"
                          min="1"
                          value={customJumpDate?.year ?? baseFantasyDate.year}
                          onChange={(e) => updateCustomJumpDate({ year: Number(e.target.value) })}
                          className="px-3 py-2 rounded bg-white/10 border border-white/20 text-white"
                          placeholder="Jahr"
                        />
                        <select
                          value={customJumpDate?.month ?? baseFantasyDate.month}
                          onChange={(e) => updateCustomJumpDate({ month: Number(e.target.value) })}
                          className="px-3 py-2 rounded bg-white/10 border border-white/20 text-white"
                        >
                          {MONTHS.map((month) => (
                            <option key={month.number} value={month.number} className="bg-slate-800">
                              {month.name}
                            </option>
                          ))}
                        </select>
                        <select
                          value={customJumpDate?.day ?? baseFantasyDate.day}
                          onChange={(e) => updateCustomJumpDate({ day: Number(e.target.value) })}
                          className="px-3 py-2 rounded bg-white/10 border border-white/20 text-white"
                        >
                          {Array.from({ length: 30 }, (_, idx) => idx + 1).map((day) => (
                            <option key={day} value={day} className="bg-slate-800">
                              {day}
                            </option>
                          ))}
                        </select>
                        <select
                          value={customJumpTime}
                          onChange={(e) => setCustomJumpTime(e.target.value)}
                          className="px-3 py-2 rounded bg-white/10 border border-white/20 text-white"
                        >
                          {TIMES_OF_DAY.map(time => (
                            <option key={time} value={time} className="bg-slate-800">
                              {time}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  )}
                  <div className="text-white/70 text-sm">
                    Neuer Eintrag: <span className="text-white">{previewEntryLabel}</span>
                  </div>
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
                    <label className="flex items-center gap-2 text-white/80 text-sm">
                      <input
                        type="checkbox"
                        checked={journalFallcrestFilter}
                        onChange={(e) => setJournalFallcrestFilter(e.target.checked)}
                        className="rounded"
                      />
                      Fallcrest-Artefakt-Nässe aktivieren
                    </label>
                    <button
                      onClick={async () => {
                        setJournalIllustrationLoading(true)
                        setJournalIllustrationError('')
                        try {
                          const response = await fetch('/api/generate-image', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                              type: 'event',
                              data: {
                                text: newJournalEntry.content,
                              },
                              fallcrestFilter: journalFallcrestFilter,
                            }),
                          })
                          const json = await response.json()
                          if (response.ok && json?.imageUrl) {
                            setJournalIllustrationUrl(json.imageUrl)
                            setJournalIllustrationSaved(false)
                          } else {
                            const reason = typeof json?.error === 'string'
                              ? json.error
                              : json?.details || 'Illustration konnte nicht generiert werden.'
                            setJournalIllustrationError(reason)
                          }
                        } catch (error) {
                          setJournalIllustrationError('Illustration konnte nicht generiert werden. Prüfe Internetverbindung und API-Key.')
                        } finally {
                          setJournalIllustrationLoading(false)
                        }
                      }}
                      disabled={!canGenerateJournalIllustration || journalIllustrationLoading}
                      className="w-full px-4 py-2 rounded-lg font-semibold bg-primary-600 hover:bg-primary-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white transition-all duration-300 hover:shadow-lg hover:shadow-primary-500/40"
                    >
                      {journalIllustrationLoading ? 'Generiere...' : 'Illustration generieren'}
                    </button>
                    {journalIllustrationError && (
                      <div className="text-red-400 text-sm bg-white/5 rounded-lg p-3 border border-white/10">
                        <div className="font-semibold mb-1">Illustration nicht generiert</div>
                        <div>{journalIllustrationError}</div>
                        <div className="text-white/60 mt-2">
                          Hinweis: Wenn der API-Key fehlt, bitte `GEMINI_API_KEY` setzen und den Server neu starten.
                        </div>
                      </div>
                    )}
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
                      disabled={isSavingJournal}
                      className="flex-1 bg-primary-600 hover:bg-primary-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-6 py-2 rounded-lg font-semibold transition-colors"
                  >
                      {isSavingJournal ? 'Speichere...' : (editingEntry ? 'Speichern' : 'Eintrag hinzufügen')}
                  </button>
                  {editingEntry && (
                    <button
                      onClick={() => {
                        setEditingEntry(null)
                        setNewJournalEntry({ title: '', content: '' })
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
            <div ref={journalBottomRef} />
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
                  <p className="text-white/60 text-xs mt-2">
                    Max. Uploadgröße: {Math.floor(MAX_SHARED_IMAGE_BYTES / 1024 / 1024)} MB
                  </p>
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
                {sharedImageError && (
                  <div className="text-red-400 text-sm bg-white/5 rounded-lg p-3 border border-white/10">
                    {sharedImageError}
                  </div>
                )}
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
                      ref={skillDescriptionRef}
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
                            const created = addSkill({
                              name: newSkill.name.trim(),
                              attribute: newSkill.attribute,
                              bonusDice: 0,
                              specializations: [],
                              isWeakened: newSkill.isWeakened,
                              isCustom: true,
                              description: newSkill.description || undefined,
                            })
                            if (!created) {
                              const storageError = getStorageError()
                              setStorageError(storageError || 'Fertigkeit konnte nicht gespeichert werden.')
                              return
                            }
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
                  const attrSkills = availableSkills
                    .filter(s => s.attribute === attr)
                    .sort((a, b) => {
                      const aParsed = parseSkillName(a.name)
                      const bParsed = parseSkillName(b.name)
                      if (aParsed.sortOrder !== null && bParsed.sortOrder !== null) {
                        if (aParsed.sortOrder !== bParsed.sortOrder) {
                          return aParsed.sortOrder - bParsed.sortOrder
                        }
                        return aParsed.displayName.localeCompare(bParsed.displayName, 'de')
                      }
                      if (aParsed.sortOrder !== null) return -1
                      if (bParsed.sortOrder !== null) return 1
                      return aParsed.displayName.localeCompare(bParsed.displayName, 'de')
                    })
                  if (attrSkills.length === 0) return null

                  return (
                    <div key={attr} className="bg-white/5 rounded-lg p-4 border border-white/10">
                      <h3 className="text-lg font-semibold text-white mb-3">{attr}</h3>
                      <div className="space-y-2">
                        {attrSkills.map(skill => (
                          <div key={skill.id} className="flex items-center justify-between bg-white/5 rounded p-3 group relative">
                            <div className="flex items-center gap-3 flex-1">
                              <span className="text-white font-medium">{getSkillDisplayName(skill.name)}</span>
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
                                  setTimeout(() => {
                                    skillDescriptionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
                                    skillDescriptionRef.current?.focus()
                                  }, 0)
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

        {/* Bestiary Tab */}
        {activeTab === 'bestiary' && (
          <div className="space-y-6">
            <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
              <h2 className="text-2xl font-bold text-white mb-4">Bestiarium verwalten</h2>

              <div className="mb-6 p-4 bg-white/5 rounded-lg border border-white/10">
                <h3 className="text-lg font-semibold text-white mb-3">
                  {editingMonster ? 'Monster bearbeiten' : 'Neues Monster hinzufügen'}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input
                    type="text"
                    placeholder="Name"
                    value={monsterForm.name}
                    onChange={(e) => setMonsterForm({ ...monsterForm, name: e.target.value })}
                    className="px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-primary-400"
                  />
                  <select
                    value={monsterForm.type}
                    onChange={(e) => setMonsterForm({ ...monsterForm, type: e.target.value })}
                    className="px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white focus:outline-none focus:ring-2 focus:ring-primary-400"
                  >
                    {['Bestie', 'Untoter', 'Humanoid', 'Geist', 'Konstrukt', 'Drache', 'Elementar', 'Dämon', 'Ooze', 'Pflanze'].map(type => (
                      <option key={type} value={type} className="bg-slate-800">{type}</option>
                    ))}
                  </select>
                  <input
                    type="number"
                    min={1}
                    placeholder="Level"
                    value={monsterForm.level}
                    onChange={(e) => setMonsterForm({ ...monsterForm, level: Number(e.target.value) })}
                    className="px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-primary-400"
                  />
                  <input
                    type="number"
                    min={1}
                    placeholder="Max HP"
                    value={monsterForm.maxHp}
                    onChange={(e) => setMonsterForm({ ...monsterForm, maxHp: Number(e.target.value) })}
                    className="px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-primary-400"
                  />
                  <input
                    type="text"
                    placeholder="Rasse (optional)"
                    value={monsterForm.race}
                    onChange={(e) => setMonsterForm({ ...monsterForm, race: e.target.value })}
                    className="px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-primary-400"
                  />
                  <textarea
                    placeholder="Fähigkeiten / Skill-Pools (kommagetrennt oder neue Zeile)"
                    value={monsterForm.abilities}
                    onChange={(e) => setMonsterForm({ ...monsterForm, abilities: e.target.value })}
                    rows={2}
                    className="px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-primary-400"
                  />
                  <input
                    type="text"
                    placeholder="Tags mit # (z.B. #monster #orte)"
                    value={monsterForm.tags}
                    onChange={(e) => setMonsterForm({ ...monsterForm, tags: e.target.value })}
                    className="px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-primary-400"
                  />
                </div>
                <div className="mt-4">
                  <textarea
                    placeholder="Kurzbeschreibung"
                    value={monsterForm.description}
                    onChange={(e) => setMonsterForm({ ...monsterForm, description: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-primary-400"
                  />
                </div>
                <div className="mt-4">
                  <h4 className="text-white/90 font-semibold mb-2">Attribute</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {BESTIARY_ATTRIBUTES.map((attr) => (
                      <div key={attr} className="flex flex-col gap-1">
                        <label className="text-white/70 text-xs">{attr}</label>
                        <input
                          type="text"
                          value={monsterForm.attributes[attr]}
                          onChange={(e) =>
                            setMonsterForm({
                              ...monsterForm,
                              attributes: { ...monsterForm.attributes, [attr]: e.target.value },
                            })
                          }
                          className="px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-primary-400"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-4 space-y-3">
                  <button
                    onClick={handleGenerateMonsterImage}
                    disabled={monsterImageLoading || !monsterForm.name.trim()}
                    className="px-4 py-2 rounded-lg font-semibold bg-primary-600 hover:bg-primary-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white transition-all duration-300 hover:shadow-lg hover:shadow-primary-500/40"
                  >
                    {monsterImageLoading ? 'Generiere...' : 'Monster-Bild generieren'}
                  </button>
                  {monsterImageError && (
                    <div className="text-red-400 text-sm bg-white/5 rounded-lg p-3 border border-white/10">
                      <div className="font-semibold mb-1">Bild nicht generiert</div>
                      <div>{monsterImageError}</div>
                      <div className="text-white/60 mt-2">
                        Hinweis: Wenn der API-Key fehlt, bitte `GEMINI_API_KEY` setzen und den Server neu starten.
                      </div>
                    </div>
                  )}

                  {monsterImageUrl && (
                    <div className="space-y-3">
                      <div className="bg-white/5 p-3 rounded-lg border border-white/10">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={monsterImageUrl}
                          alt="Generiertes Monsterbild"
                          className="w-full max-w-sm rounded-lg border border-white/10"
                        />
                      </div>
                      <div className="flex flex-col sm:flex-row gap-3">
                        <button
                          onClick={() => {
                            setMonsterImageUrl(null)
                            setMonsterImageSaved(false)
                          }}
                          className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white font-semibold transition-all duration-300 hover:shadow-lg hover:shadow-white/10"
                        >
                          Verwerfen / Neuer Versuch
                        </button>
                        <button
                          onClick={() => setMonsterImageSaved(true)}
                          className="px-4 py-2 rounded-lg bg-green-600 hover:bg-green-700 text-white font-semibold transition-all duration-300 hover:shadow-lg hover:shadow-green-500/30"
                        >
                          Speichern
                        </button>
                      </div>
                      {monsterImageSaved && (
                        <div className="text-green-400 text-sm">Bild wird beim Speichern des Monsters übernommen.</div>
                      )}
                    </div>
                  )}
                </div>

                <div className="mt-4 flex gap-2">
                  <button
                    onClick={handleSaveMonster}
                    className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-semibold transition-colors"
                  >
                    {editingMonster ? 'Änderungen speichern' : 'Monster anlegen'}
                  </button>
                  {editingMonster && (
                    <button
                      onClick={resetMonsterForm}
                      className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg font-semibold transition-colors"
                    >
                      Abbrechen
                    </button>
                  )}
                </div>
              </div>

              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
                <h3 className="text-lg font-semibold text-white">Monsterliste</h3>
                <input
                  type="text"
                  value={bestiaryTagFilter}
                  onChange={(e) => setBestiaryTagFilter(e.target.value)}
                  placeholder="Tag filtern (z.B. #monster)"
                  className="w-full md:w-72 px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-primary-400"
                />
              </div>

              <div className="space-y-4">
                {bestiary.length === 0 ? (
                  <div className="text-white/60">Noch keine Monster angelegt.</div>
                ) : filteredBestiary.length === 0 ? (
                  <div className="text-white/60">Keine Monster für diesen Tag gefunden.</div>
                ) : (
                  filteredBestiary.map((monster) => (
                    <div key={monster.id} className="bg-white/5 rounded-lg p-4 border border-white/10">
                      <div className="flex flex-col md:flex-row md:items-start gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 flex-wrap">
                            <h3 className="text-lg font-semibold text-white">{monster.name}</h3>
                            <span className="text-xs bg-white/10 text-white/80 px-2 py-1 rounded-full">{monster.type}</span>
                            {monster.level && (
                              <span className="text-xs bg-white/10 text-white/80 px-2 py-1 rounded-full">Stufe {monster.level}</span>
                            )}
                          </div>
                          {monster.description && (
                            <p className="text-white/70 mt-2">{monster.description}</p>
                          )}
                          {monster.abilities && monster.abilities.length > 0 && (
                            <div className="mt-2 flex flex-wrap gap-2">
                              {monster.abilities.map((ability) => (
                                <span key={ability} className="text-xs bg-white/10 text-white/80 px-2 py-1 rounded-full border border-white/10">
                                  {ability}
                                </span>
                              ))}
                            </div>
                          )}
                          {monster.tags && monster.tags.length > 0 && (
                            <div className="mt-2 flex flex-wrap gap-2">
                              {monster.tags.map(tag => (
                                <span
                                  key={tag}
                                  className="inline-flex items-center px-2 py-0.5 rounded-full text-xs text-white/90 bg-gradient-to-br from-white/20 to-white/5 border border-white/20 backdrop-blur-md shadow-[inset_0_1px_0_rgba(255,255,255,0.25)]"
                                >
                                  #{tag}
                                </span>
                              ))}
                            </div>
                          )}
                          {expandedMonsterId === monster.id && (
                            <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-2 text-sm text-white/80">
                              {Object.entries(monster.attributes || {}).map(([key, value]) => (
                                <div key={key} className="bg-white/5 rounded-lg px-3 py-2 border border-white/10">
                                  <span className="text-white/70">{key}:</span> {value}
                                </div>
                              ))}
                              <div className="bg-white/5 rounded-lg px-3 py-2 border border-white/10">
                                <span className="text-white/70">Max HP:</span> {monster.maxHp}
                              </div>
                            </div>
                          )}
                        </div>
                        {monster.imageUrl && (
                          <div className="bg-white/5 p-2 rounded-lg border border-white/10">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={monster.imageUrl}
                              alt={`Monsterbild ${monster.name}`}
                              className="w-full max-w-xs rounded-lg border border-white/10"
                            />
                          </div>
                        )}
                      </div>
                      <div className="mt-4 flex gap-2">
                        <button
                          onClick={() => setExpandedMonsterId(expandedMonsterId === monster.id ? null : monster.id)}
                          className="px-3 py-1 bg-white/10 hover:bg-white/20 text-white rounded text-sm"
                        >
                          {expandedMonsterId === monster.id ? 'Details ausblenden' : 'Details anzeigen'}
                        </button>
                        <button
                          onClick={() => {
                            setEditingMonster(monster)
                            setMonsterForm({
                              name: monster.name,
                              type: monster.type,
                              level: monster.level || 1,
                              race: monster.race || '',
                              description: monster.description || '',
                              abilities: (monster.abilities || []).join(', '),
                              maxHp: monster.maxHp || 1,
                              tags: (monster.tags || []).map(tag => `#${tag}`).join(' '),
                              attributes: { ...DEFAULT_MONSTER_ATTRIBUTES, ...(monster.attributes || {}) },
                            })
                            setMonsterImageUrl(monster.imageUrl || null)
                            setMonsterImageSaved(!!monster.imageUrl)
                          }}
                          className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm"
                        >
                          Bearbeiten
                        </button>
                        <button
                          onClick={async () => {
                            if (confirm(`"${monster.name}" wirklich löschen?`)) {
                              const ok = await removeBestiary(monster.id)
                              if (ok) {
                                await loadData()
                              }
                            }
                          }}
                          className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-sm"
                        >
                          Löschen
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* Settings Tab */}
        {activeTab === 'settings' && (
          <div className="space-y-6">
            {/* Spielleiter-Name */}
            {groupId && (
              <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20 shadow-xl">
                <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
                  <span className="text-3xl">🧙</span>
                  <span>Spielleiter-Name</span>
                </h2>
                <p className="text-white/70 mb-4">
                  Dieser Name wird als Autor für Tagebuch-Einträge genutzt.
                </p>
                <div className="flex flex-col md:flex-row gap-3">
                  <input
                    type="text"
                    value={gmName}
                    onChange={(e) => setGmName(e.target.value)}
                    placeholder="Spielleiter-Name"
                    className="flex-1 px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-primary-400"
                  />
                  <button
                    onClick={() => {
                      const nextName = gmName.trim() || 'Spielleiter'
                      setGmName(nextName)
                      if (typeof window !== 'undefined') {
                        localStorage.setItem('gmName', nextName)
                      }
                    }}
                    className="px-5 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-semibold transition-all duration-300"
                  >
                    Speichern
                  </button>
                </div>
              </div>
            )}

            {/* Fantasie-Kalender Start-Datum */}
            {groupId && (
              <FantasyCalendarStartDate groupId={groupId} />
            )}

            {/* Druckblatt Anpassungen */}
            {groupId && (
              <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20 shadow-xl">
                <h2 className="text-2xl font-bold text-white mb-4">Druckblatt-Anpassung</h2>
                <p className="text-white/70 mb-4">
                  Hinweise fuer die Druckversion (z.B. Preisliste, Verwundungssystem, Sonderregeln).
                </p>
                <textarea
                  value={printNotes}
                  onChange={(e) => setPrintNotes(e.target.value)}
                  rows={4}
                  placeholder="z.B. Stand 2026-01: Neue Verwundungen + Shop-Preise..."
                  className="w-full px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-primary-400"
                />
                <div className="mt-3 flex gap-3">
                  <button
                    onClick={async () => {
                      if (!groupId) return
                      const current = await getGroupSettings(groupId)
                      const nextSettings = {
                        ...(current || settings),
                        printNotes: printNotes.trim(),
                      }
                      const ok = await saveGroupSettings(groupId, nextSettings)
                      if (!ok) {
                        console.warn('Failed to save print notes to group settings.')
                      }
                    }}
                    className="px-5 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-semibold transition-all duration-300"
                  >
                    Speichern
                  </button>
                </div>
              </div>
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
                    Max. Würfel pro Attribut (Standard 2):
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={settings.maxAttributeDicePerAttribute}
                    onChange={(e) => {
                      const value = e.target.value
                      if (value === '') {
                        setSettings({ ...settings, maxAttributeDicePerAttribute: 0 })
                        return
                      }
                      const numValue = parseInt(value)
                      if (!isNaN(numValue) && numValue >= 1 && numValue <= 10) {
                        const newSettings = { ...settings, maxAttributeDicePerAttribute: numValue }
                        setSettings(newSettings)
                        saveCharacterCreationSettings(newSettings)
                      }
                    }}
                    onBlur={(e) => {
                      if (e.target.value === '' || parseInt(e.target.value) < 1) {
                        const newSettings = { ...settings, maxAttributeDicePerAttribute: 2 }
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
                    Max. Würfel pro Fertigkeit (Standard 2):
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={settings.maxSkillDicePerSkill}
                    onChange={(e) => {
                      const value = e.target.value
                      if (value === '') {
                        setSettings({ ...settings, maxSkillDicePerSkill: 0 })
                        return
                      }
                      const numValue = parseInt(value)
                      if (!isNaN(numValue) && numValue >= 1 && numValue <= 10) {
                        const newSettings = { ...settings, maxSkillDicePerSkill: numValue }
                        setSettings(newSettings)
                        saveCharacterCreationSettings(newSettings)
                      }
                    }}
                    onBlur={(e) => {
                      if (e.target.value === '' || parseInt(e.target.value) < 1) {
                        const newSettings = { ...settings, maxSkillDicePerSkill: 2 }
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

                <div>
                  <label className="block text-white/90 mb-2 font-medium">
                    Max. Blibs je Spezialisierung (Standard 2):
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="6"
                    value={settings.maxBlibsPerSpecialization}
                    onChange={(e) => {
                      const value = e.target.value
                      if (value === '') {
                        setSettings({ ...settings, maxBlibsPerSpecialization: 0 })
                        return
                      }
                      const numValue = parseInt(value)
                      if (!isNaN(numValue) && numValue >= 1 && numValue <= 6) {
                        const newSettings = { ...settings, maxBlibsPerSpecialization: numValue }
                        setSettings(newSettings)
                        saveCharacterCreationSettings(newSettings)
                      }
                    }}
                    onBlur={(e) => {
                      if (e.target.value === '' || parseInt(e.target.value) < 1) {
                        const newSettings = { ...settings, maxBlibsPerSpecialization: 2 }
                        setSettings(newSettings)
                        saveCharacterCreationSettings(newSettings)
                      }
                    }}
                    className="w-full px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white focus:outline-none focus:ring-2 focus:ring-primary-400"
                  />
                </div>

                <div>
                  <label className="block text-white/90 mb-2 font-medium">
                    Default Start-Blips (Standard 67):
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="200"
                    value={settings.defaultStartBlips}
                    onChange={(e) => {
                      const value = e.target.value
                      if (value === '') {
                        setSettings({ ...settings, defaultStartBlips: 0 })
                        return
                      }
                      const numValue = parseInt(value)
                      if (!isNaN(numValue) && numValue >= 1 && numValue <= 200) {
                        const newSettings = { ...settings, defaultStartBlips: numValue }
                        setSettings(newSettings)
                        saveCharacterCreationSettings(newSettings)
                      }
                    }}
                    onBlur={(e) => {
                      if (e.target.value === '' || parseInt(e.target.value) < 1) {
                        const newSettings = { ...settings, defaultStartBlips: 67 }
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
              <h2 className="text-2xl font-bold text-white mb-4">Blip-Status der Charaktere</h2>
              <div className="space-y-4">
                {characters.map(character => {
                  const pointsStatus = calculateCharacterPoints(character)
                  const hasRemainingPoints = pointsStatus.remainingBlips > 0
                  return (
                    <div key={character.id} className="bg-white/5 rounded-lg p-4 border border-white/10">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="text-lg font-semibold text-white mb-2">
                            {character.name} ({character.playerName})
                          </h3>
                          <div className="text-sm text-white/70 space-y-1">
                            <p>
                              Blips: {pointsStatus.usedBlips} / {pointsStatus.totalBlipBudget}
                              {pointsStatus.remainingBlips > 0 && (
                                <span className="text-green-400 ml-2">
                                  (+{pointsStatus.remainingBlips} übrig)
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

