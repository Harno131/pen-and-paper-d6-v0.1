'use client'

import { useState } from 'react'
import { createGroup, getGroupByCode, getAllGroups } from '@/lib/supabase-data'

interface CreateGroupDialogProps {
  onGroupCreated: (groupId: string, groupCode: string) => void
  onCancel: () => void
}

export default function CreateGroupDialog({ onGroupCreated, onCancel }: CreateGroupDialogProps) {
  const [groupName, setGroupName] = useState('')
  const [groupCode, setGroupCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [checkingName, setCheckingName] = useState(false)

  const generateCode = () => {
    return Math.random().toString(36).substring(2, 6).toUpperCase()
  }

  const checkGroupName = async () => {
    if (!groupName.trim()) return

    setCheckingName(true)
    // Prüfe ob Name bereits vergeben ist
    const allGroups = await getAllGroups()
    const nameExists = allGroups.some(g => g.name.toLowerCase() === groupName.trim().toLowerCase())
    
    if (nameExists) {
      setError('Dieser Gruppen-Name ist bereits vergeben. Bitte wähle einen anderen.')
    } else {
      setError('')
    }
    setCheckingName(false)
  }

  const handleCreateGroup = async () => {
    if (!groupName.trim()) {
      setError('Bitte gib einen Gruppen-Namen ein')
      return
    }

    setLoading(true)
    setError('')

    // Prüfe ob Code bereits existiert
    const code = groupCode.trim() || generateCode()
    if (code.trim()) {
      const existingGroup = await getGroupByCode(code)
      if (existingGroup) {
        setError('Dieser Code ist bereits vergeben. Bitte wähle einen anderen.')
        setLoading(false)
        return
      }
    }

    // Erstelle Gruppe OHNE Spielleiter-Name (wird später in der Übersicht eingegeben)
    const tempPlayerName = 'temp-' + Date.now()
    const result = await createGroup(groupName, tempPlayerName, code)

    if (result.groupId) {
      onGroupCreated(result.groupId, code)
    } else {
      setError(result.error || 'Fehler beim Erstellen der Gruppe.')
    }

    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
      <div className="bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl p-8 w-full max-w-md border border-white/20">
        <h2 className="text-2xl font-bold text-white mb-6 text-center">
          Gruppe neu erstellen
        </h2>

        {error && (
          <div className="mb-4 p-3 bg-red-600/20 border border-red-600 rounded-lg">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="block text-white/90 mb-2 font-medium">
              Gruppen-Name: *
            </label>
            <input
              type="text"
              value={groupName}
              onChange={(e) => {
                setGroupName(e.target.value)
                checkGroupName()
              }}
              placeholder="z.B. 'Die Gischt'"
              className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-primary-400"
            />
            {checkingName && (
              <p className="text-white/60 text-xs mt-1">Prüfe Name...</p>
            )}
          </div>

          <div>
            <label className="block text-white/90 mb-2 font-medium">
              Gruppen-Code (optional):
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={groupCode}
                onChange={(e) => setGroupCode(e.target.value.toUpperCase())}
                placeholder="Wird automatisch generiert"
                maxLength={20}
                className="flex-1 px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-primary-400 uppercase"
              />
              <button
                onClick={() => setGroupCode(generateCode())}
                className="px-4 py-3 bg-white/10 hover:bg-white/20 text-white rounded-lg"
                title="Code generieren"
              >
                🎲
              </button>
            </div>
            <p className="text-white/60 text-xs mt-1">
              Teile diesen Code mit deinen Spielern
            </p>
          </div>

          <p className="text-white/70 text-sm">
            💡 Deinen Spielleiter-Namen kannst du später in der Gruppen-Übersicht eingeben.
          </p>

          <div className="flex gap-3 pt-4">
            <button
              onClick={onCancel}
              className="flex-1 px-4 py-3 bg-white/10 hover:bg-white/20 text-white rounded-lg font-semibold transition-colors"
            >
              Zurück
            </button>
            <button
              onClick={handleCreateGroup}
              disabled={loading || !groupName.trim()}
              className="flex-1 px-4 py-3 bg-primary-600 hover:bg-primary-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg font-semibold transition-colors"
            >
              {loading ? '...' : 'Gruppe erstellen'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
