'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Character, JournalEntry, SharedImage, Item, EquipmentSlot, Skill, ShopItem } from '@/types'
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
  getAvailableSkills,
  saveAvailableSkills,
  getStorageError,
  clearStorageError,
} from '@/lib/data'
import { getGroupSettings, getInjuryTemplates, getCharacterInjuries } from '@/lib/supabase-data'
import { getSupabaseDiagnostics } from '@/lib/supabase-debug'
import { createSupabaseClient } from '@/lib/supabase'
import { calculateSkillValue } from '@/lib/skills'
import { d6ToBlips, formatD6Value, parseD6Value } from '@/lib/dice'
import { realDateToFantasyDate, formatFantasyDate, TIMES_OF_DAY, getSpecialEvent, getMonthInfo } from '@/lib/fantasy-calendar'
import { formatCopper, formatCurrency } from '@/lib/money'
import DiceRoller from '@/components/DiceRoller'
import AlignmentSelector from '@/components/AlignmentSelector'
import CharacterCreationExtended from '@/components/CharacterCreationExtended'
import SkillDiceRoller from '@/components/SkillDiceRoller'
import { extractTagsFromText, normalizeTag } from '@/lib/tags'
import { getCharacterSkillPenaltyBlips } from '@/lib/injuries'
import { getRulebookSkills, getRulebookSpecializations } from '@/lib/rulebook'
import { getInventoryItems, saveInventoryItem } from '@/lib/supabase-data'
import { getDefaultShopItems } from '@/lib/shop'

const normalizeSkillKey = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/ä/g, 'ae')
    .replace(/ö/g, 'oe')
    .replace(/ü/g, 'ue')
    .replace(/ß/g, 'ss')

const getSkillMapKey = (name: string, attribute: string) =>
  `${normalizeSkillKey(attribute)}::${normalizeSkillKey(name)}`

const buildSkillDescriptionMap = (skills: Skill[]) => {
  const map: Record<string, string> = {}
  skills.forEach((skill) => {
    const desc = (skill.description || '').trim()
    if (!desc) return
    map[normalizeSkillKey(skill.name)] = desc
  })
  return map
}

export default function SpielerPage() {
  const parseSkillName = (name: string) => {
    const trimmed = name.trim()
    const match = trimmed.match(/^\s*(\d+)[\).\s-]+(.+)$/)
    if (!match) return trimmed
    return match[2].trim()
  }
  const BASE_EQUIPMENT_SLOTS: { id: EquipmentSlot; label: string; hint: string }[] = [
    { id: 'head', label: 'Kopf', hint: 'Helme, Hute, Stirnbander' },
    { id: 'neck', label: 'Hals', hint: 'Amulette, Ketten' },
    { id: 'ears', label: 'Ohren', hint: 'Ohrringe, Siegel-Ohrstecker' },
    { id: 'torso', label: 'Oberkorper', hint: 'Rustungen, Roben, Hemden' },
    { id: 'legs', label: 'Unterkorper', hint: 'Hosen, Beinschienen' },
    { id: 'feet', label: 'Fusse', hint: 'Stiefel, Sandalen' },
    { id: 'back', label: 'Rucken', hint: 'Umhange, Mantel' },
    { id: 'finger_l', label: 'Finger (L)', hint: 'Ringe' },
    { id: 'finger_r', label: 'Finger (R)', hint: 'Ringe' },
    { id: 'wrists', label: 'Handgelenke', hint: 'Armschienen, Armreifen' },
    { id: 'ankles', label: 'Fussgelenke', hint: 'Knochelketten' },
    { id: 'main_hand', label: 'Rechte Hand', hint: 'Waffen, Fackeln' },
    { id: 'off_hand', label: 'Linke Hand', hint: 'Schilde, Zweitwaffen' },
    { id: 'belt', label: 'Gurtel', hint: 'Taschen, Kocher, Tranke' },
  ]
  const PAPERDOLL_LAYOUT: { id: EquipmentSlot; col: number; row: number }[] = [
    { id: 'head', col: 3, row: 1 },
    { id: 'ears', col: 4, row: 1 },
    { id: 'neck', col: 3, row: 2 },
    { id: 'wrists', col: 1, row: 2 },
    { id: 'back', col: 2, row: 3 },
    { id: 'torso', col: 3, row: 3 },
    { id: 'main_hand', col: 5, row: 3 },
    { id: 'off_hand', col: 1, row: 3 },
    { id: 'finger_l', col: 1, row: 4 },
    { id: 'finger_r', col: 5, row: 4 },
    { id: 'legs', col: 3, row: 4 },
    { id: 'belt', col: 3, row: 5 },
    { id: 'ankles', col: 2, row: 5 },
    { id: 'feet', col: 3, row: 6 },
  ]

  const BASE_VALUES: Record<string, string> = {
    Reflexe: '2D',
    Koordination: '2D',
    Stärke: '2D',
    Wissen: '2D',
    Wahrnehmung: '2D',
    Ausstrahlung: '2D',
    Magie: '0D',
  }
  const getStepsFromD6 = (value: string): number => {
    const { diceCount, modifier } = parseD6Value(value)
    return diceCount * 3 + modifier
  }
  const calculateStepCost = (totalSteps: number): number => {
    let totalBlips = 0
    for (let i = 1; i <= totalSteps; i += 1) {
      totalBlips += Math.ceil(i / 3)
    }
    return totalBlips
  }
  const getAttributeCost = (attribute: string, value: string): number => {
    const base = BASE_VALUES[attribute] || '2D'
    const steps = Math.max(0, getStepsFromD6(value) - getStepsFromD6(base))
    return calculateStepCost(steps)
  }
  const [customSlots, setCustomSlots] = useState<{ id: EquipmentSlot; label: string }[]>([])
  const [newSlotId, setNewSlotId] = useState('')
  const [newSlotLabel, setNewSlotLabel] = useState('')

  useEffect(() => {
    if (typeof window === 'undefined') return
    const stored = localStorage.getItem('customEquipmentSlots')
    if (stored) {
      try {
        const parsed = JSON.parse(stored)
        if (Array.isArray(parsed)) {
          setCustomSlots(parsed)
        }
      } catch {
        console.warn('Failed to parse customEquipmentSlots from localStorage.')
      }
    }
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') return
    localStorage.setItem('customEquipmentSlots', JSON.stringify(customSlots))
  }, [customSlots])

  const equipmentSlots: Array<{ id: EquipmentSlot; label: string; hint?: string }> = [
    ...BASE_EQUIPMENT_SLOTS,
    ...customSlots,
  ]
  const getSlotMeta = (slotId: EquipmentSlot) =>
    equipmentSlots.find((slot) => slot.id === slotId)

  const getItemAllowedSlots = (item: Item): EquipmentSlot[] => {
    if (!item.slot) return []
    return Array.isArray(item.slot) ? item.slot : [item.slot]
  }
  const getEquippedSlots = (inventory: Item[]) => {
    const equipped: Partial<Record<EquipmentSlot, Item>> = {}
    inventory.forEach((item) => {
      if (!item.equippedSlots) return
      item.equippedSlots.forEach((slot) => {
        if (!equipped[slot]) {
          equipped[slot] = item
        }
      })
    })
    return equipped
  }
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
  const getInjurySkillPenalty = (character: Character, skillName: string): number => {
    return getCharacterSkillPenaltyBlips(characterInjuries, character.id, skillName)
  }
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<'characters' | 'character' | 'skills' | 'equipment' | 'journal' | 'images' | 'shop'>('characters')
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
  const [journalTagFilter, setJournalTagFilter] = useState('')
  const [journalIllustrationUrl, setJournalIllustrationUrl] = useState<string | null>(null)
  const [journalIllustrationSaved, setJournalIllustrationSaved] = useState(false)
  const [journalIllustrationLoading, setJournalIllustrationLoading] = useState(false)
  const [journalIllustrationError, setJournalIllustrationError] = useState('')
  const [isSavingJournal, setIsSavingJournal] = useState(false)
  const [storageError, setStorageError] = useState('')
  const [injuryTemplates, setInjuryTemplates] = useState<any[]>([])
  const [characterInjuries, setCharacterInjuries] = useState<any[]>([])
  const [showSyncIndicator, setShowSyncIndicator] = useState(false)
  const [debugOpen, setDebugOpen] = useState(false)
  const [debugLoading, setDebugLoading] = useState(false)
  const [debugData, setDebugData] = useState<any | null>(null)
  const [debugError, setDebugError] = useState('')
  const [debugSyncMessage, setDebugSyncMessage] = useState('')
  const [supabaseUrl, setSupabaseUrl] = useState('')
  const [journalFallcrestFilter, setJournalFallcrestFilter] = useState(true)
  const [journalCategory, setJournalCategory] = useState<'all' | 'personen' | 'monster' | 'orte'>('all')
  const [journalSortOrder, setJournalSortOrder] = useState<'desc' | 'asc'>('desc')
  const [showSkillOptions, setShowSkillOptions] = useState(false)
  const [sortSkillsByBlips, setSortSkillsByBlips] = useState(false)
  const [showPossibleSpecializations, setShowPossibleSpecializations] = useState(false)
  const [rulebookSpecializations, setRulebookSpecializations] = useState<any[]>([])
  const [shopItems, setShopItems] = useState<ShopItem[]>([])
  const [shopError, setShopError] = useState('')
  const [newShopItem, setNewShopItem] = useState({
    name: '',
    category: 'equipment' as ShopItem['category'],
    priceCopper: 0,
    slot: '',
    twoHanded: false,
    description: '',
  })
  const [fantasyCalendarStart, setFantasyCalendarStart] = useState<{
    startDate?: { year: number; month: number; day: number }
    realStartDate?: string
  } | null>(null)
  const isUserEditingRef = useRef(false)
  const lastInputAtRef = useRef(0)
  const syncIndicatorTimeoutRef = useRef<number | null>(null)
  const isSavingRef = useRef(false)
  const saveCooldownRef = useRef<number | null>(null)
  const groupId = typeof window !== 'undefined' ? localStorage.getItem('groupId') : null

  const matchesTag = (tags: string[] | undefined, filter: string): boolean => {
    if (!filter) return true
    return (tags || []).some(tag => normalizeTag(tag) === filter)
  }
  const normalizedJournalTagFilter = normalizeTag(journalTagFilter)
  const matchesJournalCategory = (entry: JournalEntry): boolean => {
    if (journalCategory === 'all') return true
    return matchesTag(entry.tags, journalCategory)
  }
  const journalWordCount = newJournalEntry.content.trim()
    ? newJournalEntry.content.trim().split(/\s+/).length
    : 0
  const canGenerateJournalIllustration = journalWordCount >= 50 && !journalIllustrationUrl

  const markSaving = useCallback((cooldownMs = 1500) => {
    if (typeof window === 'undefined') return
    isSavingRef.current = true
    if (saveCooldownRef.current) {
      window.clearTimeout(saveCooldownRef.current)
    }
    saveCooldownRef.current = window.setTimeout(() => {
      isSavingRef.current = false
    }, cooldownMs)
  }, [])

  useEffect(() => {
    return () => {
      if (saveCooldownRef.current) {
        window.clearTimeout(saveCooldownRef.current)
      }
    }
  }, [])

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
    const name = (localStorage.getItem('playerName') || '').trim()
    
    // Verwende getCharactersAsync() um aus Supabase zu laden (wenn verfügbar)
    const { getCharactersAsync } = await import('@/lib/data')
    const allCharacters = await getCharactersAsync()
    const normalizedName = name.toLowerCase()
    const myCharacters = allCharacters.filter(c => (c.playerName || '').trim().toLowerCase() === normalizedName)
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
    const storageError = getStorageError()
    if (storageError) {
      setStorageError(storageError)
    }

    if (groupId) {
      const localSkills = getAvailableSkills()
      const templates = await getInjuryTemplates()
      setInjuryTemplates(templates)
      const injuries = await getCharacterInjuries(groupId)
      setCharacterInjuries(injuries)
      const shopItems = await getInventoryItems(groupId)
      setShopItems(shopItems.length > 0 ? shopItems : getDefaultShopItems())

      const groupSettings = await getGroupSettings(groupId)
      if (groupSettings?.fantasyCalendar) {
        setFantasyCalendarStart({
          startDate: groupSettings.fantasyCalendar.startDate,
          realStartDate: groupSettings.fantasyCalendar.realStartDate,
        })
      } else {
        setFantasyCalendarStart(null)
      }
      const persistedDescriptions = groupSettings?.skillDescriptions || {}
      const localDescriptions = buildSkillDescriptionMap(localSkills)
      const rulebookSkills = await getRulebookSkills()
      const rulebookSpecs = await getRulebookSpecializations()
      setRulebookSpecializations(rulebookSpecs)
      const rulebookDescriptions = rulebookSkills.reduce<Record<string, string>>((acc, skill) => {
        const desc = (skill.description || '').trim()
        if (!desc) return acc
        acc[normalizeSkillKey(skill.name)] = desc
        return acc
      }, {})
      const mergedDescriptions = {
        ...rulebookDescriptions,
        ...persistedDescriptions,
        ...localDescriptions,
      }
      if (Object.keys(mergedDescriptions).length > 0) {
        const mergedSkills: Skill[] = [...localSkills]
        const existingKeys = new Set(localSkills.map((skill) => getSkillMapKey(skill.name, skill.attribute)))
        rulebookSkills.forEach((skill) => {
          const key = getSkillMapKey(skill.name, skill.attribute)
          if (existingKeys.has(key)) return
          mergedSkills.push({
            id: `rulebook-${normalizeSkillKey(skill.attribute)}-${key}`,
            name: skill.name,
            attribute: skill.attribute,
            bonusDice: 0,
            bonusSteps: 0,
            specializations: [],
            isWeakened: false,
            isCustom: false,
            description: skill.description,
          })
        })
        const withDescriptions = mergedSkills.map((skill) => {
          if (skill.description) return skill
          const key = normalizeSkillKey(skill.name)
          const desc = mergedDescriptions[key]
          return desc ? { ...skill, description: desc } : skill
        })
        saveAvailableSkills(withDescriptions)
      }
    } else {
      setInjuryTemplates([])
      setCharacterInjuries([])
      setRulebookSpecializations([])
      setShopItems([])
    }
  }, [selectedCharacter, groupId])

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
    setPlayerName(name.trim())
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

  useEffect(() => {
    setSupabaseUrl(process.env.NEXT_PUBLIC_SUPABASE_URL || '')
  }, [])

  const handleToggleDebug = async () => {
    if (debugOpen) {
      setDebugOpen(false)
      return
    }
    setDebugOpen(true)
    setDebugLoading(true)
    setDebugError('')
    setDebugSyncMessage('')
    try {
      const currentPlayerName = typeof window !== 'undefined' ? localStorage.getItem('playerName') || '' : ''
      const currentGroupId = typeof window !== 'undefined' ? localStorage.getItem('groupId') || '' : ''
      const diagnostics = await getSupabaseDiagnostics({ playerName: currentPlayerName, groupId: currentGroupId })
      setDebugData(diagnostics)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unbekannter Fehler'
      setDebugError(message)
    } finally {
      setDebugLoading(false)
    }
  }

  const handleBuyItem = (item: ShopItem) => {
    setShopError('')
    if (!selectedCharacter) {
      setShopError('Bitte zuerst einen Charakter auswählen.')
      return
    }
    const currentCopper = selectedCharacter.copperCoins ?? 0
    if (currentCopper < item.priceCopper) {
      setShopError('Nicht genug Geld für diesen Kauf.')
      return
    }
    const inventoryItem: Item = {
      id: `shop-${Date.now()}`,
      name: item.name,
      description: item.description,
      category: item.category,
      slot: item.slot ? item.slot : undefined,
      twoHanded: item.twoHanded,
      stats: item.stats,
    }
    const characters = getCharacters()
    const updated = characters.map((char) => {
      if (char.id !== selectedCharacter.id) return char
      return {
        ...char,
        copperCoins: Math.max(0, currentCopper - item.priceCopper),
        inventory: [...(char.inventory || []), inventoryItem],
      }
    })
    markSaving()
    saveCharacters(updated, { touchedIds: [selectedCharacter.id] })
    loadData()
  }

  const handleAddShopItem = async () => {
    setShopError('')
    if (!newShopItem.name.trim()) {
      setShopError('Bitte einen Namen eingeben.')
      return
    }
    const groupId = typeof window !== 'undefined' ? localStorage.getItem('groupId') : null
    const createdBy = typeof window !== 'undefined' ? localStorage.getItem('playerName') : null
    const item: ShopItem = {
      id: `shop-${Date.now()}`,
      name: newShopItem.name.trim(),
      category: newShopItem.category,
      priceCopper: Math.max(0, Number(newShopItem.priceCopper) || 0),
      slot: newShopItem.slot ? newShopItem.slot.split(',').map((s) => s.trim()).filter(Boolean) : undefined,
      twoHanded: newShopItem.twoHanded,
      description: newShopItem.description.trim() || undefined,
      isCustom: true,
      createdBy: createdBy || undefined,
      groupId: groupId || undefined,
    }
    const ok = await saveInventoryItem(item, groupId)
    if (!ok) {
      setShopError('Gegenstand konnte nicht gespeichert werden.')
      return
    }
    setNewShopItem({
      name: '',
      category: 'equipment',
      priceCopper: 0,
      slot: '',
      twoHanded: false,
      description: '',
    })
    const items = await getInventoryItems(groupId)
    setShopItems(items)
  }

  const handleSyncLocalCharacters = async () => {
    setDebugSyncMessage('')
    const currentGroupId = typeof window !== 'undefined' ? localStorage.getItem('groupId') || '' : ''
    if (!currentGroupId) {
      setDebugSyncMessage('Kein groupId gefunden. Bitte zuerst einer Gruppe beitreten.')
      return
    }
    try {
      const { saveCharacterToSupabase } = await import('@/lib/supabase-data')
      const characters = getCharacters().filter((char) => !char.deletedDate)
      if (characters.length === 0) {
        setDebugSyncMessage('Keine lokalen Charaktere gefunden.')
        return
      }
      for (const character of characters) {
        await saveCharacterToSupabase(currentGroupId, character)
      }
      setDebugSyncMessage(`Lokale Charaktere synchronisiert: ${characters.length}`)
      const currentPlayerName = typeof window !== 'undefined' ? localStorage.getItem('playerName') || '' : ''
      const diagnostics = await getSupabaseDiagnostics({ playerName: currentPlayerName, groupId: currentGroupId })
      setDebugData(diagnostics)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unbekannter Fehler'
      setDebugSyncMessage(`Sync-Fehler: ${message}`)
    }
  }

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

  // Automatisches Neuladen alle 5 Sekunden (Polling für Echtzeit-Synchronisation)
  useEffect(() => {
    const interval = setInterval(() => {
      const activeEl = typeof document !== 'undefined' ? document.activeElement : null
      const isEditingElement = activeEl instanceof HTMLInputElement
        || activeEl instanceof HTMLTextAreaElement
        || activeEl instanceof HTMLSelectElement
        || (activeEl instanceof HTMLElement && activeEl.isContentEditable)
      if (Date.now() - lastInputAtRef.current < 1500) return
      if (isSavingRef.current) return
      if (isUserEditingRef.current || isEditingElement || showCharacterCreation) return
      loadData()
    }, 5000) // Alle 5 Sekunden

    return () => clearInterval(interval)
  }, [loadData, showCharacterCreation])

  useEffect(() => {
    if (activeTab === 'journal' && typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }, [activeTab])

  useEffect(() => {
    const supabase = createSupabaseClient()
    if (!supabase || !groupId) return
    const channel = supabase.channel(`realtime-group-${groupId}`)
    const handleRealtimeChange = () => {
      if (showCharacterCreation) return
      if (isUserEditingRef.current) return
      if (isSavingRef.current) return
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
  }, [groupId, loadData, showCharacterCreation])

  useEffect(() => {
    if (editingEntry?.illustrationUrl) {
      setJournalIllustrationUrl(editingEntry.illustrationUrl)
      setJournalIllustrationSaved(true)
    } else {
      setJournalIllustrationUrl(null)
      setJournalIllustrationSaved(false)
    }
  }, [editingEntry])

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
    if (isSavingJournal) return
    setIsSavingJournal(true)

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
    
    const tags = extractTagsFromText(`${title} ${content}`)
    const entry: JournalEntry = {
      id: editingEntry?.id || Date.now().toString(),
      author: name,
      characterId: selectedCharacter?.id || editingEntry?.characterId,
      title,
      content,
      tags,
      illustrationUrl: journalIllustrationSaved ? journalIllustrationUrl || undefined : undefined,
      imageUrl: journalIllustrationSaved ? journalIllustrationUrl || undefined : undefined,
      timestamp: editingEntry?.timestamp || now,
      fantasyDate,
      timeOfDay: selectedTimeOfDay as any,
    }

    try {
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
      setJournalIllustrationUrl(null)
      setJournalIllustrationSaved(false)
    } finally {
      setIsSavingJournal(false)
    }
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
    markSaving()
    saveCharacters(updated, { touchedIds: [selectedCharacter.id] })
    setSelectedCharacter({ ...selectedCharacter, alignment: { row, col } })
    loadData()
  }

  const addItemToCharacter = (item: {
    name: string
    description?: string
    quantity?: number
    slot?: EquipmentSlot
    twoHanded?: boolean
    stats?: Record<string, number>
  }) => {
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
    markSaving()
    saveCharacters(updated, { touchedIds: [selectedCharacter.id] })
    loadData()
  }

  const updateCharacterInventory = (nextInventory: Item[]) => {
    if (!selectedCharacter) return
    const characters = getCharacters()
    const updated = characters.map((char) => {
      if (char.id === selectedCharacter.id) {
        return { ...char, inventory: nextInventory }
      }
      return char
    })
    markSaving()
    saveCharacters(updated, { touchedIds: [selectedCharacter.id] })
    setSelectedCharacter({ ...selectedCharacter, inventory: nextInventory })
    loadData()
  }

  const handleEquipItem = (slot: EquipmentSlot, itemId: string) => {
    if (!selectedCharacter) return
    const inventory = selectedCharacter.inventory.map((item) => ({ ...item }))
    const targetItem = inventory.find((item) => item.id === itemId)
    if (!targetItem) return
    const allowedSlots = getItemAllowedSlots(targetItem)
    if (!allowedSlots.includes(slot)) {
      alert('Gegenstand passt nicht in diesen Slot.')
      return
    }
    if (targetItem.twoHanded && slot !== 'main_hand' && slot !== 'off_hand') {
      alert('Zweihandige Gegenstande konnen nur in Hand-Slots ausgerustet werden.')
      return
    }

    const targetSlots: EquipmentSlot[] = targetItem.twoHanded && (slot === 'main_hand' || slot === 'off_hand')
      ? ['main_hand', 'off_hand']
      : [slot]

    inventory.forEach((item) => {
      if (!item.equippedSlots || item.id === targetItem.id) return
      if (item.twoHanded && (targetSlots.includes('main_hand') || targetSlots.includes('off_hand'))) {
        item.equippedSlots = item.equippedSlots.filter((s) => s !== 'main_hand' && s !== 'off_hand')
      } else {
        item.equippedSlots = item.equippedSlots.filter((s) => !targetSlots.includes(s))
      }
      if (item.equippedSlots.length === 0) {
        delete item.equippedSlots
      }
    })

    targetItem.equippedSlots = targetSlots
    updateCharacterInventory(inventory)
  }

  const handleUnequipSlot = (slot: EquipmentSlot) => {
    if (!selectedCharacter) return
    const inventory = selectedCharacter.inventory.map((item) => ({ ...item }))
    inventory.forEach((item) => {
      if (!item.equippedSlots) return
      if (item.equippedSlots.includes(slot)) {
        if (item.twoHanded && (slot === 'main_hand' || slot === 'off_hand')) {
          item.equippedSlots = item.equippedSlots.filter((s) => s !== 'main_hand' && s !== 'off_hand')
        } else {
          item.equippedSlots = item.equippedSlots.filter((s) => s !== slot)
        }
        if (item.equippedSlots.length === 0) {
          delete item.equippedSlots
        }
      }
    })
    updateCharacterInventory(inventory)
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
    markSaving()
    saveCharacters(updated, { touchedIds: [selectedCharacter.id] })
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

  const handleForceRefresh = async () => {
    if (!confirm('Cache jetzt löschen und Daten neu laden?')) return
    const keys = ['characters', 'journalEntries', 'sharedImages', 'availableSkills', 'diceRolls']
    keys.forEach((key) => localStorage.removeItem(key))
    await loadData()
  }

  // Wenn Character-Erstellung angezeigt werden soll
  if (showCharacterCreation) {
    return (
      <CharacterCreationExtended
        playerName={playerName}
        onComplete={handleCharacterCreated}
        onCancel={() => setShowCharacterCreation(false)}
        existingCharacter={selectedCharacter}
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
                localStorage.removeItem('playerName')
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
        <div className="mb-6">
          <button
            onClick={handleToggleDebug}
            className="w-full px-4 py-3 rounded-lg bg-white/10 hover:bg-white/20 text-white text-sm font-semibold transition-colors"
          >
            {debugOpen ? 'Debug ausblenden' : 'Debug anzeigen'}
          </button>
          {debugOpen && (
            <div className="mt-3 rounded-lg border border-white/20 bg-white/5 p-4 text-xs text-white/80 space-y-3">
              <div className="text-white font-semibold text-sm">Supabase Debug</div>
              {debugLoading && <div>Debug-Daten werden geladen…</div>}
              {debugError && <div className="text-red-300">Fehler: {debugError}</div>}
              {!debugLoading && !debugError && (
                <>
                  <div>
                    <span className="text-white/70">Supabase URL:</span> {supabaseUrl || '—'}
                  </div>
                  <div>
                    <span className="text-white/70">groupId:</span>{' '}
                    {typeof window !== 'undefined' ? localStorage.getItem('groupId') || '—' : '—'}
                  </div>
                  <div>
                    <span className="text-white/70">playerName:</span>{' '}
                    {typeof window !== 'undefined' ? localStorage.getItem('playerName') || '—' : '—'}
                  </div>
                  <div>
                    <span className="text-white/70">role:</span>{' '}
                    {typeof window !== 'undefined' ? localStorage.getItem('userRole') || '—' : '—'}
                  </div>
                  <div>
                    <span className="text-white/70">Connection:</span>{' '}
                    {debugData?.connection?.success ? 'OK' : debugData?.connection?.error || 'Fehler'}
                  </div>
                  {debugData?.tables?.missing?.length > 0 && (
                    <div>
                      <span className="text-white/70">Fehlende Tabellen:</span>{' '}
                      {debugData.tables.missing.join(', ')}
                    </div>
                  )}
                  <div>
                    <span className="text-white/70">Counts:</span>
                    <div>
                      groups: {(debugData?.counts?.groups?.count ?? debugData?.counts?.groups?.error) ?? '—'}
                    </div>
                    <div>
                      group_members:{' '}
                      {(debugData?.counts?.groupMembers?.count ?? debugData?.counts?.groupMembers?.error) ?? '—'}
                    </div>
                    <div>
                      characters:{' '}
                      {(debugData?.counts?.characters?.count ?? debugData?.counts?.characters?.error) ?? '—'}
                    </div>
                    {debugData?.counts?.groupCharacters && (
                      <div>
                        characters (groupId):{' '}
                        {(debugData.counts.groupCharacters.count ?? debugData.counts.groupCharacters.error) ?? '—'}
                      </div>
                    )}
                    {debugData?.counts?.playerCharacters && (
                      <div>
                        characters (playerName):{' '}
                        {(debugData.counts.playerCharacters.count ?? debugData.counts.playerCharacters.error) ?? '—'}
                      </div>
                    )}
                  </div>
                  <div className="pt-2">
                    <button
                      onClick={handleSyncLocalCharacters}
                      className="w-full px-3 py-2 rounded bg-white/10 hover:bg-white/20 text-white text-xs font-semibold transition-colors"
                    >
                      Lokale Charaktere nach Supabase synchronisieren
                    </button>
                    {debugSyncMessage && (
                      <div className="mt-2 text-white/70">{debugSyncMessage}</div>
                    )}
                  </div>
                </>
              )}
            </div>
          )}
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
          {selectedCharacter && (
            <button
              onClick={() => setActiveTab('shop')}
              className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                activeTab === 'shop'
                  ? 'bg-primary-600 text-white'
                  : 'bg-white/10 text-white/70 hover:bg-white/20'
              }`}
            >
              🛒 Shop
            </button>
          )}
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
                      <p>Geld: {formatCopper(character.copperCoins)}</p>
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
                    <p>
                      <span className="font-semibold">Geld:</span>{' '}
                      {formatCopper(selectedCharacter.copperCoins)}
                    </p>
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
                      markSaving()
                      saveCharacters(updated, { touchedIds: [selectedCharacter.id] })
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
                      markSaving()
                      saveCharacters(updated, { touchedIds: [selectedCharacter.id] })
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
                            markSaving()
                            saveCharacters(updated, { touchedIds: [selectedCharacter.id] })
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
                      markSaving()
                      saveCharacters(updated, { touchedIds: [selectedCharacter.id] })
                      e.currentTarget.value = ''
                      loadData()
                    }
                  }}
                  className="w-full px-3 py-2 rounded bg-white/10 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-primary-400"
                />
              </div>

              {/* Blip-Status (immer neu berechnet) */}
              {(() => {
                const pointsStatus = calculateCharacterPoints(selectedCharacter)
                const hasRemainingPoints = pointsStatus.remainingBlips > 0
                return (
                  <div className={`mt-4 p-4 rounded-lg border ${
                    hasRemainingPoints
                      ? 'bg-green-600/20 border-green-600'
                      : 'bg-white/5 border-white/10'
                  }`}>
                    <h3 className="text-white font-semibold mb-2">Blip-Status</h3>
                    <div className="text-sm text-white/70 space-y-1">
                      <p>
                        Blips: Komplett {pointsStatus.totalBlipBudget} / Verbraucht {pointsStatus.usedBlips}
                        {pointsStatus.remainingBlips > 0 && (
                          <span className="text-green-400 ml-2">
                            ({pointsStatus.remainingBlips} übrig)
                          </span>
                        )}
                      </p>
                    </div>
                    <button
                      onClick={() => setShowCharacterCreation(true)}
                      className="mt-3 px-4 py-2 rounded-lg bg-primary-600 hover:bg-primary-700 text-white font-semibold transition-colors"
                    >
                      Charakter steigern
                    </button>
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
              const combatSkills = selectedCharacter.skills.filter(skill => {
                const normalized = parseSkillName(skill.name)
                return (
                  normalized === 'unbewaffneter Kampf' ||
                  normalized === 'bewaffneter Nahkampf' ||
                  normalized === 'Fernkampf'
                )
              })
              if (combatSkills.length === 0) return null
              return (
                <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
                  <h2 className="text-2xl font-bold text-white mb-4">⚔️ Kampffertigkeiten</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {combatSkills.map((skill) => {
                      const attributeValue = selectedCharacter.attributes[skill.attribute] || '1D'
                      const isLearned = skill.bonusDice > 0 || (skill.specializations && skill.specializations.some(s => s.blibs > 0))
                      const equipmentBonus = getEquipmentSkillBonus(selectedCharacter, skill.name)
                      const injuryPenalty = getInjurySkillPenalty(selectedCharacter, skill.name)
                      const baseSkillFormula = calculateSkillValue(
                        attributeValue,
                        skill.bonusDice,
                        skill.bonusSteps || 0,
                        skill.isWeakened,
                        isLearned
                      )
                      const totalBlips =
                        d6ToBlips(baseSkillFormula) + equipmentBonus - injuryPenalty
                      const finalSkillFormula = formatD6Value(totalBlips)
                      return (
                        <div
                          key={skill.id}
                          className="bg-white/5 rounded-lg p-4 border border-white/10"
                        >
                          <h3 className="font-semibold text-white">{parseSkillName(skill.name)}</h3>
                          <p className="text-white/70 text-sm mt-1">
                            Attribut: {skill.attribute} ({formatD6Value(attributeValue)})
                          </p>
                          <p className="text-white/70 text-sm">
                            Fertigkeit:{' '}
                            <span className={injuryPenalty > 0 ? 'text-red-300' : ''}>
                              {finalSkillFormula}
                            </span>
                            {equipmentBonus > 0 && (
                              <span className="text-blue-300 ml-2">+{equipmentBonus}</span>
                            )}
                            {injuryPenalty > 0 && (
                              <span className="text-red-300 ml-2">-{injuryPenalty}</span>
                            )}
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
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setShowSkillOptions((prev) => !prev)}
                    className="text-white/70 hover:text-white text-lg"
                    title="Optionen"
                  >
                    ⚙️
                  </button>
                  <button
                    onClick={() => setActiveTab('character')}
                    className="text-white/70 hover:text-white"
                  >
                    ← Zurück zur Übersicht
                  </button>
                </div>
              </div>

              {showSkillOptions && (
                <div className="mb-4 bg-white/5 rounded-lg p-4 border border-white/10 space-y-3">
                  <label className="flex items-center gap-2 text-white/80 text-sm">
                    <input
                      type="checkbox"
                      checked={sortSkillsByBlips}
                      onChange={(e) => setSortSkillsByBlips(e.target.checked)}
                      className="rounded"
                    />
                    Attribute nach Blibs sortieren
                  </label>
                  <label className="flex items-center gap-2 text-white/80 text-sm">
                    <input
                      type="checkbox"
                      checked={showPossibleSpecializations}
                      onChange={(e) => setShowPossibleSpecializations(e.target.checked)}
                      className="rounded"
                    />
                    Mögliche Spezialisierungen anzeigen
                  </label>
                </div>
              )}

              {/* Alle Fertigkeiten gruppiert nach Attribut */}
              <div className="space-y-6">
                {Object.keys(selectedCharacter.attributes)
                  .sort((a, b) => {
                    if (!sortSkillsByBlips) return 0
                    const aCost = getAttributeCost(a, selectedCharacter.attributes[a] || '1D')
                    const bCost = getAttributeCost(b, selectedCharacter.attributes[b] || '1D')
                    if (bCost !== aCost) return bCost - aCost
                    return a.localeCompare(b, 'de')
                  })
                  .map((attribute) => {
                  const skillsForAttribute = selectedCharacter.skills.filter(
                    skill => skill.attribute === attribute
                  )
                  
                  if (skillsForAttribute.length === 0) return null

                  const attributeValue = selectedCharacter.attributes[attribute] || '1D'
                  const attributeCost = getAttributeCost(attribute, attributeValue)

                  return (
                    <div key={attribute} className="bg-white/5 rounded-lg p-4 border border-white/10">
                      <h3 className="text-xl font-bold text-white mb-3">
                        {attribute} ({formatD6Value(attributeValue)})
                        <span className="ml-2 text-sky-300 text-sm font-semibold">({attributeCost} Blibs)</span>
                      </h3>
                      <div className="space-y-2">
                        {skillsForAttribute.map((skill) => {
                          const isLearned = skill.bonusDice > 0 || (skill.specializations && skill.specializations.some(s => s.blibs > 0))
                          const equipmentBonus = getEquipmentSkillBonus(selectedCharacter, skill.name)
                          const injuryPenalty = getInjurySkillPenalty(selectedCharacter, skill.name)
                          const baseSkillFormula = calculateSkillValue(
                            attributeValue,
                            skill.bonusDice,
                            skill.bonusSteps || 0,
                            skill.isWeakened,
                            isLearned
                          )
                          const totalBlips =
                            d6ToBlips(baseSkillFormula) + equipmentBonus - injuryPenalty
                          const finalSkillFormula = formatD6Value(totalBlips)

                          const existingSpecs = (skill.specializations || []).filter((spec) =>
                            showPossibleSpecializations ? true : spec.blibs > 0
                          )
                          const suggestionSpecs = rulebookSpecializations
                            .filter((spec) => normalizeSkillKey(spec.skill_name) === normalizeSkillKey(skill.name))
                            .filter((spec) =>
                              !existingSpecs.some((existing) =>
                                normalizeSkillKey(existing.name) === normalizeSkillKey(spec.specialization_name)
                              )
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
                                      {parseSkillName(skill.name)}
                                    </div>
                                    <div className="text-white/70 text-sm mt-1">
                                      <span className={injuryPenalty > 0 ? 'text-red-300' : ''}>
                                        {finalSkillFormula}
                                      </span>
                                      {equipmentBonus > 0 && (
                                        <span className="text-blue-300 ml-2">+{equipmentBonus}</span>
                                      )}
                                      {injuryPenalty > 0 && (
                                        <span className="text-red-300 ml-2">-{injuryPenalty}</span>
                                      )}
                                      {skill.isWeakened && !isLearned && (
                                        <span className="text-yellow-400 ml-2">(geschwächt)</span>
                                      )}
                                    </div>
                                  </div>
                                  <div className="text-2xl">🎲</div>
                                </div>
                              </button>

                              {/* Spezialisierungen */}
                              {(existingSpecs.length > 0 || (showPossibleSpecializations && suggestionSpecs.length > 0)) && (
                                <div className="ml-6 space-y-2">
                                  {existingSpecs.map((spec) => {
                                    const specBlibs = spec.blibs
                                    const baseSpecFormula = calculateSkillValue(
                                      attributeValue,
                                      skill.bonusDice,
                                      specBlibs,
                                      skill.isWeakened,
                                      isLearned
                                    )
                                    const specTotalBlips =
                                      d6ToBlips(baseSpecFormula) + equipmentBonus - injuryPenalty
                                    const finalSpecFormula = formatD6Value(specTotalBlips)
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
                                              <span className={injuryPenalty > 0 ? 'text-red-300' : ''}>
                                                {finalSpecFormula}
                                              </span>
                                              {specBlibs > 0 && (
                                                <span className="text-yellow-400 ml-2">
                                                  ({specBlibs} Blibs)
                                                </span>
                                              )}
                                              {equipmentBonus > 0 && (
                                                <span className="text-blue-300 ml-2">+{equipmentBonus}</span>
                                              )}
                                              {injuryPenalty > 0 && (
                                                <span className="text-red-300 ml-2">-{injuryPenalty}</span>
                                              )}
                                            </div>
                                          </div>
                                          <div className="text-xl">🎲</div>
                                        </div>
                                      </button>
                                    )
                                  })}
                                  {showPossibleSpecializations && suggestionSpecs.map((spec) => (
                                    <div
                                      key={`suggested-${spec.specialization_name}`}
                                      className="w-full text-left bg-white/5 rounded-lg p-3 border border-white/10 opacity-80"
                                    >
                                      <div className="flex items-center justify-between">
                                        <div>
                                          <div className="font-semibold text-white">
                                            {spec.specialization_name}
                                          </div>
                                          <div className="text-white/60 text-sm mt-1">
                                            Vorschlag aus Rule-Book
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  ))}
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
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <input
                      type="number"
                      placeholder="Anzahl (optional)"
                      id="newItemQuantity"
                      min="1"
                      className="w-full px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-primary-400"
                    />
                    <select
                      id="newItemSlot"
                      defaultValue=""
                      className="w-full px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white focus:outline-none focus:ring-2 focus:ring-primary-400"
                    >
                      <option value="" className="bg-slate-800">Slot (optional)</option>
                      {equipmentSlots.map((slot) => (
                        <option key={slot.id} value={slot.id} className="bg-slate-800">
                          {slot.label}
                        </option>
                      ))}
                    </select>
                    <label className="flex items-center gap-2 text-white/70">
                      <input id="newItemTwoHanded" type="checkbox" className="rounded" />
                      Zweihandig
                    </label>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <input
                      type="text"
                      id="newItemBonusSkill"
                      placeholder="Bonus-Fertigkeit (z.B. Schloss knacken)"
                      className="w-full px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-primary-400"
                    />
                    <input
                      type="number"
                      id="newItemBonusValue"
                      placeholder="Bonus-Wert (z.B. 3)"
                      className="w-full px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-primary-400"
                    />
                  </div>
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => {
                        const nameInput = document.getElementById('newItemName') as HTMLInputElement
                        const descInput = document.getElementById('newItemDescription') as HTMLTextAreaElement
                        const qtyInput = document.getElementById('newItemQuantity') as HTMLInputElement
                        const slotInput = document.getElementById('newItemSlot') as HTMLSelectElement
                        const bonusSkillInput = document.getElementById('newItemBonusSkill') as HTMLInputElement
                        const bonusValueInput = document.getElementById('newItemBonusValue') as HTMLInputElement
                        const twoHandedInput = document.getElementById('newItemTwoHanded') as HTMLInputElement
                        
                        if (nameInput && nameInput.value.trim()) {
                          const bonusSkill = bonusSkillInput?.value.trim()
                          const bonusValue = bonusValueInput?.value ? Number(bonusValueInput.value) : 0
                          const stats = bonusSkill && Number.isFinite(bonusValue) && bonusValue !== 0
                            ? { [bonusSkill]: bonusValue }
                            : undefined
                          addItemToCharacter({
                            name: nameInput.value.trim(),
                            description: descInput?.value.trim() || undefined,
                            quantity: qtyInput?.value ? parseInt(qtyInput.value) : undefined,
                            slot: slotInput?.value ? (slotInput.value as EquipmentSlot) : undefined,
                            twoHanded: Boolean(twoHandedInput?.checked),
                            stats,
                          })
                          
                          // Felder leeren
                          nameInput.value = ''
                          if (descInput) descInput.value = ''
                          if (qtyInput) qtyInput.value = ''
                          if (slotInput) slotInput.value = ''
                          if (bonusSkillInput) bonusSkillInput.value = ''
                          if (bonusValueInput) bonusValueInput.value = ''
                          if (twoHandedInput) twoHandedInput.checked = false
                        }
                      }}
                      className="px-6 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-semibold transition-colors"
                    >
                      Hinzufügen
                    </button>
                  </div>
                </div>
              </div>

              {/* Slot-Ausrustung */}
              <div className="mb-6 p-4 bg-white/5 rounded-lg border border-white/10">
                <h3 className="text-lg font-semibold text-white mb-3">Ausrustung (Slots)</h3>
                <div className="mb-4 relative">
                  <div className="grid grid-cols-5 gap-3">
                    <div className="col-span-5 row-span-6">
                      <div className="grid grid-cols-5 gap-3">
                        <div className="col-start-2 col-span-3 row-start-2 row-span-4 bg-white/5 border border-white/10 rounded-2xl min-h-[200px] flex items-center justify-center text-white/40 text-sm">
                          Paperdoll
                        </div>
                        {PAPERDOLL_LAYOUT.map((slot) => {
                          const slotMeta = getSlotMeta(slot.id)
                          if (!slotMeta) return null
                          const equippedSlots = getEquippedSlots(selectedCharacter.inventory)
                          const equippedItem = equippedSlots[slot.id]
                          return (
                            <div
                              key={`drop-${slot.id}`}
                              style={{ gridColumn: slot.col, gridRow: slot.row }}
                              onDragOver={(e) => e.preventDefault()}
                              onDrop={(e) => {
                                const itemId = e.dataTransfer.getData('text/plain')
                                if (itemId) {
                                  handleEquipItem(slot.id, itemId)
                                }
                              }}
                              className="bg-black/30 border border-white/10 rounded-lg p-2 text-center"
                              title={slotMeta.hint}
                            >
                              <div className="text-[10px] text-white/60">{slotMeta.label}</div>
                              <div className="text-white text-xs mt-1 min-h-[1rem]">
                                {equippedItem ? (
                                  <span
                                    draggable
                                    onDragStart={(e) => {
                                      e.dataTransfer.setData('text/plain', equippedItem.id)
                                    }}
                                    className="cursor-move"
                                    title={equippedItem.description || equippedItem.name}
                                  >
                                    {equippedItem.name}
                                  </span>
                                ) : (
                                  'leer'
                                )}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  </div>
                  <div className="text-white/50 text-xs mt-2">
                    Tipp: Ziehe Items aus dem Inventar direkt auf einen Slot.
                  </div>
                </div>
                <div className="space-y-3">
                  {(() => {
                    const equippedSlots = getEquippedSlots(selectedCharacter.inventory)
                    return equipmentSlots.map((slot) => {
                      const equippedItem = equippedSlots[slot.id]
                      const eligibleItems = selectedCharacter.inventory.filter((item) =>
                        getItemAllowedSlots(item).includes(slot.id)
                      )
                      return (
                        <div key={slot.id} className="grid grid-cols-1 md:grid-cols-3 gap-3 items-center">
                          <div className="text-white/80">
                            {slot.label}
                            {('hint' in slot) && (slot as { hint?: string }).hint && (
                              <div className="text-white/50 text-xs">{(slot as { hint?: string }).hint}</div>
                            )}
                          </div>
                          <select
                            value={equippedItem?.id || ''}
                            onChange={(e) => {
                              const itemId = e.target.value
                              if (!itemId) {
                                handleUnequipSlot(slot.id)
                                return
                              }
                              handleEquipItem(slot.id, itemId)
                            }}
                            className="w-full px-3 py-2 rounded bg-white/10 border border-white/20 text-white focus:outline-none focus:ring-2 focus:ring-primary-400"
                          >
                            <option value="" className="bg-slate-800">— leer —</option>
                            {eligibleItems.map((item) => (
                              <option key={item.id} value={item.id} className="bg-slate-800">
                                {item.name}
                              </option>
                            ))}
                          </select>
                          <div className="flex items-center gap-2 text-white/60 text-sm">
                            {equippedItem ? (
                              <>
                                <span>{equippedItem.twoHanded ? 'Zweihandig' : 'Ausgerustet'}</span>
                                <button
                                  onClick={() => handleUnequipSlot(slot.id)}
                                  className="text-red-300 hover:text-red-200 text-xs"
                                >
                                  Entfernen
                                </button>
                              </>
                            ) : (
                              <span>—</span>
                            )}
                          </div>
                        </div>
                      )
                    })
                  })()}
                </div>
                <div className="mt-4 pt-4 border-t border-white/10">
                  <div className="text-white/80 text-sm mb-2">Neuen Slot hinzufugen</div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-center">
                    <input
                      type="text"
                      value={newSlotId}
                      onChange={(e) => setNewSlotId(e.target.value.trim())}
                      placeholder="Slot-ID (z.B. backpack)"
                      className="w-full px-3 py-2 rounded bg-white/10 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-primary-400"
                    />
                    <input
                      type="text"
                      value={newSlotLabel}
                      onChange={(e) => setNewSlotLabel(e.target.value)}
                      placeholder="Anzeige-Name (z.B. Rucksack)"
                      className="w-full px-3 py-2 rounded bg-white/10 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-primary-400"
                    />
                    <button
                      onClick={() => {
                        if (!newSlotId || !newSlotLabel) return
                        const exists = equipmentSlots.some((slot) => slot.id === newSlotId)
                        if (exists) {
                          alert('Slot-ID existiert bereits.')
                          return
                        }
                        setCustomSlots((prev) => [...prev, { id: newSlotId, label: newSlotLabel }])
                        setNewSlotId('')
                        setNewSlotLabel('')
                      }}
                      className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-semibold transition-colors"
                    >
                      Slot hinzufugen
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
                        draggable
                        onDragStart={(e) => {
                          e.dataTransfer.setData('text/plain', item.id)
                        }}
                        className="bg-white/5 rounded-lg p-4 border border-white/10 cursor-move"
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
                            {item.equippedSlots && item.equippedSlots.length > 0 && (
                              <p className="text-blue-300 text-xs mt-1">
                                Ausgerustet: {item.equippedSlots.map((slot) => {
                                  const label = equipmentSlots.find(s => s.id === slot)?.label || slot
                                  return label
                                }).join(', ')}
                              </p>
                            )}
                            {item.stats && Object.keys(item.stats).length > 0 && (
                              <p className="text-blue-300 text-xs mt-1">
                                Bonus: {Object.entries(item.stats).map(([key, value]) => `${key} +${value}`).join(', ')}
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

        {/* Shop Tab */}
        {activeTab === 'shop' && selectedCharacter && (
          <div className="space-y-6">
            <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-white">
                  🛒 Shop: {selectedCharacter.name}
                </h2>
                <button
                  onClick={() => setActiveTab('character')}
                  className="text-white/70 hover:text-white"
                >
                  ← Zurück zum Charakter
                </button>
              </div>
              <div className="text-white/70 mb-4">
                Gold: {formatCurrency(selectedCharacter.copperCoins)}
              </div>
              {shopError && (
                <div className="mb-4 text-red-300 text-sm">{shopError}</div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {shopItems.map((item) => (
                  <div key={item.id} className="bg-white/5 rounded-lg p-4 border border-white/10">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-white font-semibold">{item.name}</div>
                        <div className="text-white/70 text-sm">
                          {formatCurrency(item.priceCopper)}
                        </div>
                      </div>
                      <button
                        onClick={() => handleBuyItem(item)}
                        className="px-3 py-1.5 rounded bg-primary-600 hover:bg-primary-700 text-white text-sm font-semibold"
                      >
                        Kaufen
                      </button>
                    </div>
                    {item.description && (
                      <div className="text-white/60 text-sm mt-2">{item.description}</div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
              <h3 className="text-xl font-semibold text-white mb-3">Neuen Gegenstand vorschlagen</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <input
                  type="text"
                  placeholder="Name"
                  value={newShopItem.name}
                  onChange={(e) => setNewShopItem({ ...newShopItem, name: e.target.value })}
                  className="px-3 py-2 rounded bg-white/10 border border-white/20 text-white"
                />
                <select
                  value={newShopItem.category}
                  onChange={(e) => setNewShopItem({ ...newShopItem, category: e.target.value as any })}
                  className="px-3 py-2 rounded bg-white/10 border border-white/20 text-white"
                >
                  <option value="weapon" className="bg-slate-800">Waffe</option>
                  <option value="armor" className="bg-slate-800">Rüstung</option>
                  <option value="equipment" className="bg-slate-800">Ausrüstung</option>
                </select>
                <input
                  type="number"
                  placeholder="Preis (Kupfer)"
                  value={newShopItem.priceCopper}
                  onChange={(e) => setNewShopItem({ ...newShopItem, priceCopper: Number(e.target.value) })}
                  className="px-3 py-2 rounded bg-white/10 border border-white/20 text-white"
                />
                <input
                  type="text"
                  placeholder="Slot (z.B. head, torso, main_hand)"
                  value={newShopItem.slot}
                  onChange={(e) => setNewShopItem({ ...newShopItem, slot: e.target.value })}
                  className="px-3 py-2 rounded bg-white/10 border border-white/20 text-white"
                />
                <label className="flex items-center gap-2 text-white/80 text-sm">
                  <input
                    type="checkbox"
                    checked={newShopItem.twoHanded}
                    onChange={(e) => setNewShopItem({ ...newShopItem, twoHanded: e.target.checked })}
                    className="rounded"
                  />
                  Zweihändig
                </label>
                <div />
                <textarea
                  placeholder="Beschreibung"
                  value={newShopItem.description}
                  onChange={(e) => setNewShopItem({ ...newShopItem, description: e.target.value })}
                  rows={2}
                  className="md:col-span-2 px-3 py-2 rounded bg-white/10 border border-white/20 text-white"
                />
              </div>
              <button
                onClick={handleAddShopItem}
                className="mt-3 px-4 py-2 rounded bg-primary-600 hover:bg-primary-700 text-white font-semibold"
              >
                Vorschlag speichern
              </button>
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
                                dateLabel: new Date().toISOString().slice(0, 10),
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
                    ? formatFantasyDate(entry.fantasyDate, true)
                    : entry.timestamp 
                      ? formatFantasyDate(
                          realDateToFantasyDate(
                            entry.timestamp,
                            fantasyCalendarStart?.startDate,
                            fantasyCalendarStart?.realStartDate ? new Date(fantasyCalendarStart.realStartDate) : undefined
                          ),
                          true
                        )
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
            injuryPenaltyBlips={getInjurySkillPenalty(selectedCharacter, selectedSkillForRoll.skill.name)}
            onClose={() => setSelectedSkillForRoll(null)}
          />
        )}
      </div>
    </div>
  )
}
