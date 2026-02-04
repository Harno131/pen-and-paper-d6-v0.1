'use client'

import { useEffect, useMemo, useState } from 'react'
import { getRulebookReviews, getRulebookSkills, importRulebookDefaults, importRulebookSkills, updateRulebookReview } from '@/lib/rulebook'

type ReviewEditState = {
  name: string
  attribute: string
  description: string
  specName?: string
}

export default function RulebookMasterPage() {
  const [playerName, setPlayerName] = useState('')
  const [password, setPassword] = useState('')
  const [reviews, setReviews] = useState<any[]>([])
  const [editState, setEditState] = useState<Record<string, ReviewEditState>>({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [importMessage, setImportMessage] = useState('')
  const [showRulebookSkills, setShowRulebookSkills] = useState(false)
  const [rulebookSkills, setRulebookSkills] = useState<any[]>([])
  const [rulebookSkillEdits, setRulebookSkillEdits] = useState<Record<string, { name: string; attribute: string; description: string }>>({})

  useEffect(() => {
    if (typeof window === 'undefined') return
    setPlayerName(localStorage.getItem('rbmName') || localStorage.getItem('playerName') || '')
    setPassword(localStorage.getItem('rbmPassword') || '')
  }, [])

  const isMaster = useMemo(() => playerName.trim() === 'Flori', [playerName])

  const loadReviews = async () => {
    setError('')
    if (!password.trim()) {
      setError('Bitte Rule-Book-Master-Passwort eingeben.')
      return
    }
    try {
      setLoading(true)
      const data = await getRulebookReviews({ playerName, password })
      setReviews(data)
      if (typeof window !== 'undefined') {
        localStorage.setItem('rbmReviewCount', String(data.length))
      }
      const nextState: Record<string, ReviewEditState> = {}
      data.forEach((review: any) => {
        nextState[review.id] = {
          name: review.skill_name,
          attribute: review.attribute,
          description: review.description,
          specName: review.spec_name || '',
        }
      })
      setEditState(nextState)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unbekannter Fehler'
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  const updateReview = async (id: string, action: 'approved' | 'declined' | 'waiting') => {
    setError('')
    try {
      const edit = editState[id]
      await updateRulebookReview({
        id,
        action,
        playerName,
        password,
        editedName: edit?.name,
        editedAttribute: edit?.attribute,
        editedDescription: edit?.description,
        editedSpecName: edit?.specName,
      })
      await loadReviews()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unbekannter Fehler'
      setError(message)
    }
  }

  const handleImportDefaults = async () => {
    setImportMessage('')
    setError('')
    try {
      const result = await importRulebookDefaults({ playerName, password })
      setImportMessage(`Basis importiert: ${result.count || 0}`)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unbekannter Fehler'
      setError(message)
    }
  }

  const loadRulebookSkills = async () => {
    setError('')
    if (!password.trim()) {
      setError('Bitte Rule-Book-Master-Passwort eingeben.')
      return
    }
    try {
      setLoading(true)
      const data = await getRulebookSkills()
      setRulebookSkills(data)
      const nextEdits: Record<string, { name: string; attribute: string; description: string }> = {}
      data.forEach((skill: any) => {
        const key = skill.id || `${skill.name}-${skill.attribute}`
        nextEdits[key] = {
          name: skill.name,
          attribute: skill.attribute,
          description: skill.description,
        }
      })
      setRulebookSkillEdits(nextEdits)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unbekannter Fehler'
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  const handleSaveRulebookSkills = async () => {
    setError('')
    try {
      const payload = Object.values(rulebookSkillEdits)
      await importRulebookSkills({ skills: payload, playerName, password })
      await loadRulebookSkills()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unbekannter Fehler'
      setError(message)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6 text-white">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="bg-white/10 rounded-xl p-6 border border-white/20">
          <h1 className="text-3xl font-bold mb-2">Rule-Book-Master</h1>
          <p className="text-white/70">Prüfe neue Fertigkeiten und Beschreibungen.</p>
          {!isMaster && (
            <div className="mt-3 text-yellow-300 text-sm">
              Hinweis: Zugriff ist nur für den Rule-Book-Master (Flori).
            </div>
          )}
          <div className="mt-4 flex flex-col md:flex-row gap-3">
            <button
              onClick={loadReviews}
              className="px-4 py-2 rounded-lg bg-primary-600 hover:bg-primary-700 text-white font-semibold"
              disabled={loading}
            >
              {loading ? 'Lade...' : 'Reviews laden'}
            </button>
            <button
              onClick={handleImportDefaults}
              className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white font-semibold"
            >
              Basis aus Extern importieren
            </button>
          </div>
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
            <button
              className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white font-semibold"
              onClick={() => {
                setShowRulebookSkills((prev) => !prev)
                if (!showRulebookSkills) {
                  loadRulebookSkills()
                }
              }}
            >
              Fertigkeiten-Liste
            </button>
            <button className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white font-semibold">
              Marktplatz
            </button>
            <button className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white font-semibold">
              Orte
            </button>
            <button className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white font-semibold">
              Berühmte NPCs
            </button>
            <button className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white font-semibold">
              Monster
            </button>
            <button className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white font-semibold">
              Abenteuer / Questen
            </button>
          </div>
          {showRulebookSkills && (
            <div className="mt-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="text-white/70 text-sm">Globale Rule-Book-Fertigkeiten</div>
                <button
                  onClick={handleSaveRulebookSkills}
                  className="px-3 py-1.5 rounded bg-primary-600 hover:bg-primary-700 text-white text-sm font-semibold"
                >
                  Speichern
                </button>
              </div>
              <div className="space-y-2 max-h-[360px] overflow-y-auto pr-2">
                {rulebookSkills.map((skill) => {
                  const key = skill.id || `${skill.name}-${skill.attribute}`
                  const edit = rulebookSkillEdits[key]
                  return (
                    <div key={key} className="bg-white/5 rounded-lg p-3 border border-white/10 space-y-2">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        <input
                          type="text"
                          value={edit?.name || ''}
                          onChange={(e) => setRulebookSkillEdits((prev) => ({
                            ...prev,
                            [key]: { ...prev[key], name: e.target.value },
                          }))}
                          className="px-3 py-2 rounded bg-white/10 border border-white/20 text-white"
                        />
                        <input
                          type="text"
                          value={edit?.attribute || ''}
                          onChange={(e) => setRulebookSkillEdits((prev) => ({
                            ...prev,
                            [key]: { ...prev[key], attribute: e.target.value },
                          }))}
                          className="px-3 py-2 rounded bg-white/10 border border-white/20 text-white"
                        />
                      </div>
                      <textarea
                        rows={2}
                        value={edit?.description || ''}
                        onChange={(e) => setRulebookSkillEdits((prev) => ({
                          ...prev,
                          [key]: { ...prev[key], description: e.target.value },
                        }))}
                        className="w-full px-3 py-2 rounded bg-white/10 border border-white/20 text-white"
                      />
                    </div>
                  )
                })}
              </div>
            </div>
          )}
          {importMessage && <div className="mt-3 text-green-300">{importMessage}</div>}
          {error && <div className="mt-3 text-red-300">{error}</div>}
        </div>

        <div className="space-y-4">
          {reviews.length === 0 ? (
            <div className="bg-white/5 rounded-xl p-6 border border-white/10 text-white/70">
              Keine offenen Reviews.
            </div>
          ) : (
            reviews.map((review: any) => {
              const edit = editState[review.id]
              return (
                <div key={review.id} className="bg-white/5 rounded-xl p-6 border border-white/10 space-y-3">
                  <div className="text-sm text-white/60">
                    Quelle: {review.source_player_name || 'Unbekannt'} • Gruppe: {review.source_group_id || '—'}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                    <input
                      type="text"
                      value={edit?.name || ''}
                      onChange={(e) => setEditState((prev) => ({
                        ...prev,
                        [review.id]: { ...prev[review.id], name: e.target.value },
                      }))}
                      className="px-3 py-2 rounded bg-white/10 border border-white/20 text-white"
                      placeholder="Fertigkeitsname"
                    />
                    <input
                      type="text"
                      value={edit?.attribute || ''}
                      onChange={(e) => setEditState((prev) => ({
                        ...prev,
                        [review.id]: { ...prev[review.id], attribute: e.target.value },
                      }))}
                      className="px-3 py-2 rounded bg-white/10 border border-white/20 text-white"
                      placeholder="Attribut"
                    />
                    <input
                      type="text"
                      value={edit?.specName || ''}
                      onChange={(e) => setEditState((prev) => ({
                        ...prev,
                        [review.id]: { ...prev[review.id], specName: e.target.value },
                      }))}
                      className="px-3 py-2 rounded bg-white/10 border border-white/20 text-white"
                      placeholder="Spezialisierung (optional)"
                      disabled={review.entry_type !== 'specialization'}
                    />
                    <input
                      type="text"
                      value={review.entry_type || 'skill'}
                      disabled
                      className="px-3 py-2 rounded bg-white/5 border border-white/10 text-white/60"
                    />
                  </div>
                  <textarea
                    value={edit?.description || ''}
                    onChange={(e) => setEditState((prev) => ({
                      ...prev,
                      [review.id]: { ...prev[review.id], description: e.target.value },
                    }))}
                    rows={3}
                    className="w-full px-3 py-2 rounded bg-white/10 border border-white/20 text-white"
                  />
                  <div className="flex flex-wrap gap-3">
                    <button
                      onClick={() => updateReview(review.id, 'approved')}
                      className="px-4 py-2 rounded-lg bg-green-600 hover:bg-green-700 text-white font-semibold"
                    >
                      Übernehmen
                    </button>
                    <button
                      onClick={() => updateReview(review.id, 'waiting')}
                      className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white font-semibold"
                    >
                      Warten
                    </button>
                    <button
                      onClick={() => updateReview(review.id, 'declined')}
                      className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white font-semibold"
                    >
                      Ablehnen
                    </button>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}
