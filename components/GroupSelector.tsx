'use client'

import { useState, useEffect } from 'react'
import { getAllGroups, joinGroup, getGroupMembers } from '@/lib/supabase-data'
import { testSupabaseConnection, checkTables } from '@/lib/supabase-debug'

interface GroupSelectorProps {
  onGroupSelected: (groupId: string, groupCode: string, playerName: string, role: 'spielleiter' | 'spieler') => void
  onCancel: () => void
}

export default function GroupSelector({ onGroupSelected, onCancel }: GroupSelectorProps) {
  const MASTER_PASSWORD = '1313'
  const [groups, setGroups] = useState<any[]>([])
  const [selectedGroupId, setSelectedGroupId] = useState('')
  const [groupPassword, setGroupPassword] = useState('')
  const [passwordVerified, setPasswordVerified] = useState(false)
  const [passwordError, setPasswordError] = useState('')
  const [groupPlayers, setGroupPlayers] = useState<any[]>([])
  const [selectedPlayerName, setSelectedPlayerName] = useState('')
  const [newPlayerName, setNewPlayerName] = useState('')
  const [showNewPlayer, setShowNewPlayer] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [debugInfo, setDebugInfo] = useState<string>('')

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

  useEffect(() => {
    const loadGroups = async () => {
      const allGroups = await getAllGroups()
      setGroups(allGroups)
    }
    loadGroups()
  }, [])

  const handleVerifyPassword = async () => {
    setPasswordError('')
    const selectedGroup = groups.find(g => g.id === selectedGroupId)
    if (!selectedGroup) {
      setPasswordError('Bitte wähle eine Gruppe')
      return
    }
    if (!groupPassword.trim()) {
      setPasswordError('Bitte gib das Gruppen-Passwort ein')
      return
    }
    const normalizedPassword = groupPassword.trim()
    const normalizedCode = String(selectedGroup.code || '').toUpperCase()
    if (normalizedPassword !== MASTER_PASSWORD && normalizedPassword.toUpperCase() !== normalizedCode) {
      setPasswordError('Falsches Passwort')
      return
    }
    setPasswordVerified(true)
    const members = await getGroupMembers(selectedGroupId)
    setGroupPlayers(members.filter((m: any) => m.role === 'spieler'))
  }

  const handleJoinAsExistingPlayer = () => {
    const selectedGroup = groups.find(g => g.id === selectedGroupId)
    if (!selectedGroup || !selectedPlayerName) return
    onGroupSelected(selectedGroup.id, selectedGroup.code, selectedPlayerName, 'spieler')
  }

  const handleJoinAsNewPlayer = async () => {
    const selectedGroup = groups.find(g => g.id === selectedGroupId)
    if (!selectedGroup) return
    if (!newPlayerName.trim()) {
      setError('Bitte gib einen Spielernamen ein')
      return
    }
    setLoading(true)
    setError('')
    const success = await joinGroup(selectedGroup.id, newPlayerName.trim(), 'spieler')
    if (success) {
      onGroupSelected(selectedGroup.id, selectedGroup.code, newPlayerName.trim(), 'spieler')
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

        <p className="text-white/80 text-center mb-6">
          Gruppe beitreten
        </p>

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
          {/* Gruppen-Auswahl */}
          <div>
            <label className="block text-white/90 mb-2 font-medium">
              Gruppe auswählen:
            </label>
            <select
              value={selectedGroupId}
              onChange={(e) => {
                setSelectedGroupId(e.target.value)
                setPasswordVerified(false)
                setGroupPassword('')
                setPasswordError('')
                setGroupPlayers([])
                setSelectedPlayerName('')
                setNewPlayerName('')
                setShowNewPlayer(false)
              }}
              className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white focus:outline-none focus:ring-2 focus:ring-primary-400"
            >
              <option value="" className="bg-slate-800">-- Gruppe auswählen --</option>
              {groups.map(group => (
                <option key={group.id} value={group.id} className="bg-slate-800">
                  {group.name}
                </option>
              ))}
            </select>
          </div>

          {/* Passwort */}
          {selectedGroupId && !passwordVerified && (
            <div>
              <label className="block text-white/90 mb-2 font-medium">
                Gruppen-Passwort:
              </label>
              <input
                type="text"
                value={groupPassword}
                onChange={(e) => setGroupPassword(e.target.value)}
                placeholder="Passwort (sichtbar)"
                className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-primary-400"
              />
              {passwordError && (
                <p className="text-red-400 text-sm mt-2">{passwordError}</p>
              )}
              <button
                onClick={handleVerifyPassword}
                className="mt-3 w-full px-4 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-semibold transition-colors"
              >
                Weiter
              </button>
            </div>
          )}

          {/* Spieler-Auswahl */}
          {passwordVerified && (
            <div className="space-y-3">
              <div className="text-white/80 text-sm">Bestehende Spieler:</div>
              {groupPlayers.length === 0 ? (
                <div className="text-white/60 text-sm">Noch keine Spieler angelegt.</div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {groupPlayers.map((player: any) => (
                    <button
                      key={player.id}
                      onClick={() => {
                        setSelectedPlayerName(player.player_name)
                        setShowNewPlayer(false)
                      }}
                      className={`px-3 py-2 rounded-lg text-sm border transition-colors ${
                        selectedPlayerName === player.player_name
                          ? 'bg-primary-600 text-white border-primary-400'
                          : 'bg-white/10 text-white/70 border-white/20 hover:bg-white/20'
                      }`}
                    >
                      {player.player_name}
                    </button>
                  ))}
                </div>
              )}

              <div className="pt-2">
                <button
                  onClick={() => {
                    setShowNewPlayer(true)
                    setSelectedPlayerName('')
                  }}
                  className="px-3 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white text-sm"
                >
                  + Neuen Spieler anlegen
                </button>
              </div>

              {showNewPlayer && (
                <div className="space-y-2">
                  <input
                    type="text"
                    value={newPlayerName}
                    onChange={(e) => setNewPlayerName(e.target.value)}
                    placeholder="Neuer Spielername"
                    className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-primary-400"
                  />
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  onClick={onCancel}
                  className="flex-1 px-4 py-3 bg-white/10 hover:bg-white/20 text-white rounded-lg font-semibold transition-colors"
                >
                  Abbrechen
                </button>
                {showNewPlayer ? (
                  <button
                    onClick={handleJoinAsNewPlayer}
                    disabled={loading || !newPlayerName.trim()}
                    className="flex-1 px-4 py-3 bg-primary-600 hover:bg-primary-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg font-semibold transition-colors"
                  >
                    {loading ? '...' : 'Beitreten'}
                  </button>
                ) : (
                  <button
                    onClick={handleJoinAsExistingPlayer}
                    disabled={!selectedPlayerName}
                    className="flex-1 px-4 py-3 bg-primary-600 hover:bg-primary-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg font-semibold transition-colors"
                  >
                    Weiter
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="mt-6 pt-6 border-t border-white/10">
          <p className="text-white/60 text-xs text-center">
            💡 Gruppe auswählen → Passwort eingeben → Spieler auswählen
          </p>
        </div>
      </div>
    </div>
  )
}

