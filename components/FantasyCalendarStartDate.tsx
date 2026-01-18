'use client'

import { useState, useEffect, useCallback } from 'react'
import { FantasyCalendarSettings } from '@/types'
import { MONTHS } from '@/lib/fantasy-calendar'
import { getGroupSettings, saveGroupSettings } from '@/lib/supabase-data'

interface FantasyCalendarStartDateProps {
  groupId: string
}

export default function FantasyCalendarStartDate({ groupId }: FantasyCalendarStartDateProps) {
  const [startDate, setStartDate] = useState<{ year: number; month: number; day: number } | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const loadStartDate = useCallback(async () => {
    setLoading(true)
    const settings = await getGroupSettings(groupId)
    if (settings?.fantasyCalendar?.startDate) {
      setStartDate(settings.fantasyCalendar.startDate)
    } else {
      // Standard: 1. Frostglanz, Jahr 1
      setStartDate({ year: 1, month: 1, day: 1 })
    }
    setLoading(false)
  }, [groupId])

  useEffect(() => {
    loadStartDate()
  }, [loadStartDate])

  const handleSave = async () => {
    if (!startDate) return
    
    setSaving(true)
    const settings = await getGroupSettings(groupId)
    if (settings) {
      const updatedSettings = {
        ...settings,
        fantasyCalendar: {
          ...settings.fantasyCalendar,
          startDate,
          realStartDate: new Date().toISOString(),
        },
      }
      const success = await saveGroupSettings(groupId, updatedSettings)
      if (success) {
        alert('Start-Datum gespeichert!')
      } else {
        alert('Fehler beim Speichern des Start-Datums.')
      }
    }
    setSaving(false)
  }

  if (loading) {
    return <div className="text-white/70">Lade Start-Datum...</div>
  }

  return (
    <div className="bg-white/10 rounded-lg p-4 border border-white/20">
      <h3 className="text-lg font-semibold text-white mb-3">
        📅 Start-Datum des Abenteuers
      </h3>
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <label className="text-white/90 w-20">Jahr:</label>
          <input
            type="number"
            value={startDate?.year || 1}
            onChange={(e) => setStartDate({ ...startDate!, year: parseInt(e.target.value) || 1 })}
            min="1"
            className="w-24 px-3 py-2 rounded bg-white/10 border border-white/20 text-white"
          />
        </div>
        <div className="flex items-center gap-3">
          <label className="text-white/90 w-20">Monat:</label>
          <select
            value={startDate?.month || 1}
            onChange={(e) => setStartDate({ ...startDate!, month: parseInt(e.target.value) })}
            className="flex-1 px-3 py-2 rounded bg-white/10 border border-white/20 text-white"
          >
            {MONTHS.map(month => (
              <option key={month.number} value={month.number}>
                {month.number}. {month.name}
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-3">
          <label className="text-white/90 w-20">Tag:</label>
          <input
            type="number"
            value={startDate?.day || 1}
            onChange={(e) => setStartDate({ ...startDate!, day: parseInt(e.target.value) || 1 })}
            min="1"
            max="30"
            className="w-24 px-3 py-2 rounded bg-white/10 border border-white/20 text-white"
          />
        </div>
        {startDate && (
          <div className="text-white/70 text-sm mt-2">
            Start: {startDate.day}. {MONTHS.find(m => m.number === startDate.month)?.name}, Jahr {startDate.year}
          </div>
        )}
        <button
          onClick={handleSave}
          disabled={saving || !startDate}
          className="w-full bg-primary-600 hover:bg-primary-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg font-semibold transition-colors"
        >
          {saving ? 'Speichere...' : 'Start-Datum speichern'}
        </button>
      </div>
    </div>
  )
}











