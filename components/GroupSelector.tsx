'use client'

import { useState, useEffect } from 'react'
import { getGroupByCode, joinGroup, getGroupsByPlayer } from '@/lib/supabase-data'
import { testSupabaseConnection, checkTables } from '@/lib/supabase-debug'
import GroupManager from './GroupManager'

interface GroupSelectorProps {
  onGroupSelected: (groupId: string, groupCode: string, playerName: string, role: 'spielleiter' | 'spieler') => void
  onCancel: () => void
}

export default function GroupSelector({ onGroupSelected, onCancel }: GroupSelectorProps) {
  const [groupCode, setGroupCode] = useState('')
  const [playerName, setPlayerName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [debugInfo, setDebugInfo] = useState<string>('')
  const [showExistingGroups, setShowExistingGroups] = useState(false)

  useEffect(() => {
    // Teste Supabase-Verbindung beim Laden
    const testConnection = async () => {
      const connectionTest = await testSupabaseConnection()
      if (!connectionTest.success) {
        setDebugInfo(`⚠️ ${connectionTest.error}`)
      } else {
        const tables = await checkTables()
        if (tables.missing.length > 0) {
          setDebugInfo(`⚠️ Fehlende Tabellen: ${tables.missing.join(', ')}. Führe das SQL-Schema aus.`)
        }
      }
    }
    testConnection()
  }, [])

  const handleJoinGroup = async () => {
    if (!groupCode.trim() || !playerName.trim()) {
      setError('Bitte fülle alle Felder aus')
      return
    }

    setLoading(true)
    setError('')

    // Prüfe ob es ein Spielleiter-Code ist (beginnt und endet mit 'x')
    // Entschärft für Entwicklung: Akzeptiert auch andere Längen
    const trimmedCode = groupCode.trim().toUpperCase()
    const isGmCode = trimmedCode.startsWith('X') && trimmedCode.endsWith('X') && trimmedCode.length >= 3
    
    let actualCode = trimmedCode
    let role: 'spielleiter' | 'spieler' = 'spieler'
    
    if (isGmCode) {
      // Entferne x am Anfang und Ende für die Datenbank-Suche
      actualCode = trimmedCode.slice(1, -1)
      role = 'spielleiter'
    }

    const group = await getGroupByCode(actualCode)

    if (!group) {
      setError('Gruppe nicht gefunden. Prüfe den Code.')
      setLoading(false)
      return
    }

    const success = await joinGroup(group.id, playerName, role)

    if (success) {
      onGroupSelected(group.id, group.code, playerName, role)
    } else {
      setError('Fehler beim Beitreten. Vielleicht ist der Name bereits vergeben?')
    }

    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
      <div className="bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl p-8 w-full max-w-md border border-white/20">
        <h1 className="text-4xl font-bold text-white mb-2 text-center">
          🎲 Rollenspiel-App
        </h1>
        <p className="text-white/80 text-center mb-8">
          Gruppe erstellen oder beitreten
        </p>

        {/* Spieler: Nur beitreten */}
        <p className="text-white/80 text-center mb-6">
          Gruppe beitreten
        </p>

        {/* Bestehende Gruppen anzeigen */}
        {playerName.trim() && (
          <div className="mb-6">
            <button
              onClick={() => setShowExistingGroups(!showExistingGroups)}
              className="w-full py-2 rounded-lg font-semibold transition-colors bg-white/5 text-white/70 hover:bg-white/10"
            >
              {showExistingGroups ? '▼' : '▶'} Meine Gruppen anzeigen
            </button>
            {showExistingGroups && (
              <div className="mt-4">
                <GroupManager
                  playerName={playerName}
                  onGroupSelected={onGroupSelected}
                />
              </div>
            )}
          </div>
        )}

        {debugInfo && (
          <div className="mb-4 p-3 bg-yellow-600/20 border border-yellow-600 rounded-lg">
            <p className="text-yellow-400 text-sm">{debugInfo}</p>
          </div>
        )}

        {error && (
          <div className="mb-4 p-3 bg-red-600/20 border border-red-600 rounded-lg">
            <p className="text-red-400 text-sm font-semibold mb-1">Fehler:</p>
            <p className="text-red-400 text-sm whitespace-pre-wrap">{error}</p>
          </div>
        )}

        <div className="space-y-4">
          {/* Spielername (immer) */}
          <div>
            <label className="block text-white/90 mb-2 font-medium">
              Dein Name: *
            </label>
            <input
              type="text"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              placeholder="Spielername"
              className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-primary-400"
            />
          </div>

          {/* Gruppe beitreten (Spieler) */}
          <div>
            <label className="block text-white/90 mb-2 font-medium">
              Gruppen-Code: *
            </label>
            <input
              type="text"
              value={groupCode}
              onChange={(e) => setGroupCode(e.target.value.toUpperCase())}
              placeholder="4-stelliger Code"
              maxLength={20}
              className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-primary-400 uppercase"
            />
            <p className="text-white/60 text-xs mt-1">
              Frage den Spielleiter nach dem Gruppen-Code
            </p>
          </div>



          <div className="flex gap-3 pt-4">
            <button
              onClick={onCancel}
              className="flex-1 px-4 py-3 bg-white/10 hover:bg-white/20 text-white rounded-lg font-semibold transition-colors"
            >
              Abbrechen
            </button>
            <button
              onClick={handleJoinGroup}
              disabled={loading || !playerName.trim() || !groupCode.trim()}
              className="flex-1 px-4 py-3 bg-primary-600 hover:bg-primary-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg font-semibold transition-colors"
            >
              {loading ? '...' : 'Beitreten'}
            </button>
          </div>
        </div>

        <div className="mt-6 pt-6 border-t border-white/10">
          <p className="text-white/60 text-xs text-center">
            💡 Tipp: Der Spielleiter erstellt eine Gruppe und teilt den Code mit den Spielern
          </p>
        </div>
      </div>
    </div>
  )
}

