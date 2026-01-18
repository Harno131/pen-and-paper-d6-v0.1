'use client'

import { useState, useEffect, useCallback } from 'react'
import { getGroupsByPlayer, getGroupById } from '@/lib/supabase-data'

interface GroupManagerProps {
  playerName: string
  onGroupSelected: (groupId: string, groupCode: string, playerName: string, role: 'spielleiter' | 'spieler') => void
}

export default function GroupManager({ playerName, onGroupSelected }: GroupManagerProps) {
  const [groups, setGroups] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const loadGroups = useCallback(async () => {
    setLoading(true)
    const playerGroups = await getGroupsByPlayer(playerName)
    setGroups(playerGroups)
    setLoading(false)
  }, [playerName])

  useEffect(() => {
    loadGroups()
  }, [loadGroups])

  const handleSelectGroup = async (group: any) => {
    // Hole vollständige Gruppen-Daten
    const fullGroup = await getGroupById(group.id)
    if (fullGroup) {
      onGroupSelected(group.id, fullGroup.code, playerName, group.role)
    }
  }

  if (loading) {
    return (
      <div className="p-4">
        <p className="text-white/70 text-center">Lade Gruppen...</p>
      </div>
    )
  }

  if (groups.length === 0) {
    return (
      <div className="p-4">
        <p className="text-white/70 text-center mb-4">
          Du bist noch keiner Gruppe beigetreten.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <h3 className="text-white font-semibold text-lg mb-4">
        Deine Gruppen ({groups.length})
      </h3>
      <div className="space-y-2">
        {groups.map((group) => (
          <button
            key={group.id}
            onClick={() => handleSelectGroup(group)}
            className="w-full text-left bg-white/10 hover:bg-white/20 rounded-lg p-4 border border-white/20 transition-colors"
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="font-semibold text-white">{group.name}</div>
                <div className="text-white/70 text-sm mt-1">
                  Code: {group.code} • {group.role === 'spielleiter' ? '👑 Spielleiter' : '👤 Spieler'}
                </div>
                {group.joined_at && (
                  <div className="text-white/60 text-xs mt-1">
                    Beigetreten: {new Date(group.joined_at).toLocaleDateString('de-DE')}
                  </div>
                )}
              </div>
              <div className="text-2xl">→</div>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}











