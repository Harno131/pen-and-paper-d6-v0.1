export type RulebookSkill = {
  id?: string
  name: string
  attribute: string
  description: string
  source_group_id?: string | null
  source_player_name?: string | null
}

export type RulebookReview = {
  id: string
  skill_name: string
  attribute: string
  description: string
  entry_type?: string
  spec_name?: string | null
  source_group_id?: string | null
  source_player_name?: string | null
  action: string
  created_at?: string
}

export type RulebookSpecialization = {
  id?: string
  skill_name: string
  specialization_name: string
  description?: string | null
}

export const loginRulebookMaster = async (payload: {
  playerName: string
  password: string
}) => {
  const response = await fetch('/api/rulebook/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!response.ok) {
    const text = await response.text()
    throw new Error(text || 'Login fehlgeschlagen.')
  }
}

const ensureRulebookLogin = async (playerName: string, password: string) => {
  if (!playerName || !password) {
    throw new Error('Bitte Rule-Book-Master-Passwort eingeben.')
  }
  await loginRulebookMaster({ playerName, password })
}

export const enqueueRulebookReview = async (payload: {
  skillName: string
  attribute: string
  description: string
  sourceGroupId?: string | null
  sourcePlayerName?: string | null
  entryType?: 'skill' | 'specialization'
  specName?: string
}) => {
  const response = await fetch('/api/rulebook/reviews', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!response.ok) {
    const text = await response.text()
    throw new Error(text || 'Review konnte nicht gespeichert werden.')
  }
}

export const getRulebookSkills = async (): Promise<RulebookSkill[]> => {
  const response = await fetch('/api/rulebook/skills', { cache: 'no-store' })
  if (!response.ok) {
    return []
  }
  const data = await response.json()
  return data.skills || []
}

export const getRulebookReviews = async (params: {
  playerName: string
  password: string
  action?: string
}): Promise<RulebookReview[]> => {
  await ensureRulebookLogin(params.playerName, params.password)
  const query = new URLSearchParams()
  if (params.action) {
    query.set('action', params.action)
  }
  const response = await fetch(`/api/rulebook/reviews?${query.toString()}`, { cache: 'no-store' })
  if (!response.ok) {
    const text = await response.text()
    throw new Error(text || 'Reviews konnten nicht geladen werden.')
  }
  const data = await response.json()
  return data.reviews || []
}

export const updateRulebookReview = async (payload: {
  id: string
  action: 'approved' | 'declined' | 'waiting'
  playerName: string
  password: string
  editedName?: string
  editedAttribute?: string
  editedDescription?: string
  editedSpecName?: string
}) => {
  await ensureRulebookLogin(payload.playerName, payload.password)
  const response = await fetch('/api/rulebook/reviews', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      id: payload.id,
      action: payload.action,
      editedName: payload.editedName,
      editedAttribute: payload.editedAttribute,
      editedDescription: payload.editedDescription,
      editedSpecName: payload.editedSpecName,
    }),
  })
  if (!response.ok) {
    const text = await response.text()
    throw new Error(text || 'Review konnte nicht aktualisiert werden.')
  }
}

export const importRulebookSkills = async (payload: {
  skills: RulebookSkill[]
  playerName: string
  password: string
}) => {
  await ensureRulebookLogin(payload.playerName, payload.password)
  const response = await fetch('/api/rulebook/skills', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ skills: payload.skills }),
  })
  if (!response.ok) {
    const text = await response.text()
    throw new Error(text || 'Rule-Book konnte nicht importiert werden.')
  }
  const data = await response.json()
  return data
}

export const importRulebookDefaults = async (payload: {
  playerName: string
  password: string
}) => {
  await ensureRulebookLogin(payload.playerName, payload.password)
  const response = await fetch('/api/rulebook/import-default', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({}),
  })
  if (!response.ok) {
    const text = await response.text()
    throw new Error(text || 'Rule-Book-Basis konnte nicht importiert werden.')
  }
  return response.json()
}

export const getRulebookSpecializations = async (): Promise<RulebookSpecialization[]> => {
  const response = await fetch('/api/rulebook/specializations', { cache: 'no-store' })
  if (!response.ok) {
    return []
  }
  const data = await response.json()
  return data.specializations || []
}
