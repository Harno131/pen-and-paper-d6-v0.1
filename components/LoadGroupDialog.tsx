'use client'

import { useState, useEffect } from 'react'
import { getAllGroups, getGroupByCode, joinGroup } from '@/lib/supabase-data'

interface LoadGroupDialogProps {
  onGroupSelected: (groupId: string, groupCode: string, playerName: string, role: 'spielleiter' | 'spieler') => void
  onCancel: () => void
}

export default function LoadGroupDialog({ onGroupSelected, onCancel }: LoadGroupDialogProps) {
  const MASTER_PASSWORD = '1313'
  const [groups, setGroups] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedGroupId, setSelectedGroupId] = useState<string>('')
  const [groupCode, setGroupCode] = useState('')
  const gmName = 'Spielleiter'
  const [error, setError] = useState('')

  useEffect(() => {
    loadGroups()
  }, [])

  const loadGroups = async () => {
    setLoading(true)
    const allGroups = await getAllGroups()
    setGroups(allGroups)
    setLoading(false)
  }

  const handleLoadByCode = async () => {
    if (!groupCode.trim()) {
      setError('Bitte gib einen Code ein')
      return
    }

    setLoading(true)
    setError('')

    const trimmedCode = groupCode.trim().toUpperCase()
    if (trimmedCode === MASTER_PASSWORD) {
      const resolvedGroupId = selectedGroupId || (groups.length === 1 ? groups[0].id : '')
      if (!resolvedGroupId) {
        setError('Bitte wähle eine Gruppe für das Master-Passwort.')
        setLoading(false)
        return
      }
      const group = groups.find(g => g.id === resolvedGroupId)
      if (!group) {
        setError('Gruppe nicht gefunden')
        setLoading(false)
        return
      }
      const success = await joinGroup(group.id, gmName, 'spielleiter')
      if (success) {
        onGroupSelected(group.id, group.code, gmName, 'spielleiter')
      } else {
        setError('Fehler beim Laden der Gruppe.')
      }
      setLoading(false)
      return
    }
    const isGmCode = trimmedCode.startsWith('X') && trimmedCode.endsWith('X') && trimmedCode.length >= 3
    
    let actualCode = trimmedCode
    let role: 'spielleiter' | 'spieler' = 'spielleiter'
    
    if (isGmCode) {
      actualCode = trimmedCode.slice(1, -1)
    }

    const group = await getGroupByCode(actualCode)

    if (!group) {
      setError('Gruppe nicht gefunden. Prüfe den Code.')
      setLoading(false)
      return
    }

    // Prüfe ob bereits Mitglied
    const success = await joinGroup(group.id, gmName, role)

    if (success) {
      onGroupSelected(group.id, group.code, gmName, role)
    } else {
      setError('Fehler beim Laden der Gruppe.')
    }

    setLoading(false)
  }

  const handleSelectGroup = async () => {
    if (!selectedGroupId) {
      setError('Bitte wähle eine Gruppe')
      return
    }

    setLoading(true)
    setError('')

    const group = groups.find(g => g.id === selectedGroupId)
    if (!group) {
      setError('Gruppe nicht gefunden')
      setLoading(false)
      return
    }

    const success = await joinGroup(group.id, gmName, 'spielleiter')

    if (success) {
      onGroupSelected(group.id, group.code, gmName, 'spielleiter')
    } else {
      setError('Fehler beim Laden der Gruppe.')
    }

    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
      <div className="bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl p-8 w-full max-w-md border border-white/20">
        <h2 className="text-2xl font-bold text-white mb-6 text-center">
          Gruppe laden
        </h2>

        {error && (
          <div className="mb-4 p-3 bg-red-600/20 border border-red-600 rounded-lg">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        <div className="space-y-4">
          {/* Gruppen-Liste */}
          {groups.length > 0 && (
            <div>
              <label className="block text-white/90 mb-2 font-medium">
                Wähle eine Gruppe:
              </label>
              <select
                value={selectedGroupId}
                onChange={(e) => setSelectedGroupId(e.target.value)}
                className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white focus:outline-none focus:ring-2 focus:ring-primary-400"
              >
                <option value="" className="bg-slate-800">-- Gruppe auswählen --</option>
                {groups.map(group => (
                  <option key={group.id} value={group.id} className="bg-slate-800">
                    {group.name} ({group.code})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Oder Code-Eingabe */}
          <div className="border-t border-white/10 pt-4">
            <p className="text-white/70 text-sm mb-3 text-center">oder</p>
            <div>
              <label className="block text-white/90 mb-2 font-medium">
                Gruppen-Code eingeben:
              </label>
              <input
                type="text"
                value={groupCode}
                onChange={(e) => setGroupCode(e.target.value.toUpperCase())}
                placeholder="4-stelliger Code oder xXXXXx für Spielleiter"
                maxLength={20}
                className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-primary-400 uppercase"
              />
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              onClick={onCancel}
              className="flex-1 px-4 py-3 bg-white/10 hover:bg-white/20 text-white rounded-lg font-semibold transition-colors"
            >
              Zurück
            </button>
            {selectedGroupId ? (
              <button
                onClick={handleSelectGroup}
                disabled={loading}
                className="flex-1 px-4 py-3 bg-primary-600 hover:bg-primary-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg font-semibold transition-colors"
              >
                {loading ? '...' : 'Laden'}
              </button>
            ) : (
              <button
                onClick={handleLoadByCode}
                disabled={loading || !groupCode.trim()}
                className="flex-1 px-4 py-3 bg-primary-600 hover:bg-primary-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg font-semibold transition-colors"
              >
                {loading ? '...' : 'Laden'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
