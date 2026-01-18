'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createSupabaseClient } from '@/lib/supabase'
import { validateGroupMembership } from '@/lib/supabase-data'
import GmGroupSelector from '@/components/GmGroupSelector'
import LoadGroupDialog from '@/components/LoadGroupDialog'
import CreateGroupDialog from '@/components/CreateGroupDialog'
import GroupSelector from '@/components/GroupSelector'

type ViewState = 
  | 'home'
  | 'spielleiter'
  | 'spieler'
  | 'gm-load-group'
  | 'gm-create-group'

export default function Home() {
  const [viewState, setViewState] = useState<ViewState>('home')
  const [hasSupabase, setHasSupabase] = useState(false)
  const [isChecking, setIsChecking] = useState(true)
  const router = useRouter()

  const checkExistingGroup = useCallback(async () => {
    if (typeof window === 'undefined') {
      setIsChecking(false)
      return
    }
    
    setIsChecking(true)
    
    // Prüfe ob groupId und playerName im localStorage vorhanden sind
    const groupId = localStorage.getItem('groupId')
    const playerName = localStorage.getItem('playerName')
    const role = localStorage.getItem('userRole') as 'spielleiter' | 'spieler' | null

    if (groupId && playerName && role) {
      // Validiere ob der Spieler noch Mitglied der Gruppe ist
      const validation = await validateGroupMembership(groupId, playerName)
      
      if (validation.valid && validation.role === role) {
        // Gruppe ist gültig, weiterleiten zur entsprechenden Seite
        if (role === 'spielleiter') {
          router.push('/spielleiter')
        } else {
          router.push('/spieler')
        }
        return
      } else {
        // Gruppe existiert nicht mehr oder Spieler ist nicht mehr Mitglied
        // Lösche gespeicherte Daten
        localStorage.removeItem('groupId')
        localStorage.removeItem('groupCode')
        localStorage.removeItem('userRole')
        localStorage.removeItem('playerName')
      }
    }
    
    setIsChecking(false)
  }, [router])

  useEffect(() => {
    // Prüfe ob Supabase konfiguriert ist
    const supabase = createSupabaseClient()
    setHasSupabase(supabase !== null)

    // Wenn Supabase verfügbar ist, prüfe ob bereits eine Gruppe ausgewählt ist
    if (supabase) {
      checkExistingGroup()
    } else {
      setIsChecking(false)
    }
  }, [checkExistingGroup])

  const handleGroupSelected = (groupId: string, groupCode: string, playerName: string, role: 'spielleiter' | 'spieler') => {
    if (typeof window === 'undefined') return
    
    // Speichere Gruppen-Info im localStorage
    localStorage.setItem('groupId', groupId)
    localStorage.setItem('groupCode', groupCode)
    localStorage.setItem('userRole', role)
    localStorage.setItem('playerName', playerName)

    // Weiterleitung zur entsprechenden Seite
    if (role === 'spielleiter') {
      router.push('/spielleiter')
    } else {
      router.push('/spieler')
    }
  }

  const handleGmGroupCreated = (groupId: string, groupCode: string) => {
    if (typeof window === 'undefined') return
    
    // Speichere Gruppen-Info (ohne Spielleiter-Name - wird später eingegeben)
    localStorage.setItem('groupId', groupId)
    localStorage.setItem('groupCode', groupCode)
    localStorage.setItem('userRole', 'spielleiter')
    localStorage.setItem('playerName', 'Spielleiter')

    // Weiterleitung zur Spielleiter-Seite
    router.push('/spielleiter')
  }

  if (isChecking) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl p-8 w-full max-w-md border border-white/20">
          <h1 className="text-4xl font-bold text-white mb-2 text-center">
            🎲 Rollenspiel-App
          </h1>
          <p className="text-white/80 text-center">
            Lade Gruppen-Daten...
          </p>
        </div>
      </div>
    )
  }

  // Spielleiter: Gruppe laden
  if (viewState === 'gm-load-group') {
    return (
      <LoadGroupDialog
        onGroupSelected={handleGroupSelected}
        onCancel={() => setViewState('spielleiter')}
      />
    )
  }

  // Spielleiter: Gruppe neu erstellen
  if (viewState === 'gm-create-group') {
    return (
      <CreateGroupDialog
        onGroupCreated={handleGmGroupCreated}
        onCancel={() => setViewState('spielleiter')}
      />
    )
  }

  // Spielleiter: Auswahl (Gruppe laden / neu erstellen)
  if (viewState === 'spielleiter') {
    return (
      <GmGroupSelector
        onLoadGroup={() => setViewState('gm-load-group')}
        onCreateGroup={() => setViewState('gm-create-group')}
        onCancel={() => setViewState('home')}
      />
    )
  }

  // Spieler: Gruppe beitreten
  if (viewState === 'spieler') {
    return (
      <GroupSelector
        onGroupSelected={handleGroupSelected}
        onCancel={() => setViewState('home')}
      />
    )
  }

  // Startbildschirm: Nur zwei Knöpfe
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
      <div className="bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl p-8 w-full max-w-md border border-white/20">
        <h1 className="text-4xl font-bold text-white mb-2 text-center">
          🎲 Rollenspiel-App
        </h1>
        <p className="text-white/80 text-center mb-8">
          Willkommen, Abenteurer!
        </p>

        {!hasSupabase && (
          <div className="mb-6 p-4 bg-yellow-600/20 border border-yellow-600 rounded-lg">
            <p className="text-yellow-400 text-sm mb-2">
              ⚠️ Supabase nicht konfiguriert
            </p>
            <p className="text-white/70 text-xs">
              Erstelle eine .env.local Datei mit deinen Supabase-Keys für Gruppen-Funktionen.
              Siehe QUICK_START.md für Anleitung.
            </p>
          </div>
        )}

        <div className="space-y-4">
          <button
            onClick={() => setViewState('spielleiter')}
            className="w-full bg-primary-600 hover:bg-primary-700 text-white font-semibold py-4 rounded-lg transition-all duration-300 hover:scale-105 hover:shadow-lg"
          >
            Spielleiter
          </button>

          <button
            onClick={() => setViewState('spieler')}
            className="w-full bg-primary-600 hover:bg-primary-700 text-white font-semibold py-4 rounded-lg transition-all duration-300 hover:scale-105 hover:shadow-lg"
          >
            Spieler
          </button>
        </div>
      </div>
    </div>
  )
}
