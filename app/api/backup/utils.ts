import { createSupabaseAdmin } from '@/lib/supabase'

export const BACKUP_BUCKET = 'd6-backups'

export const getAdminClient = () => {
  const supabase = createSupabaseAdmin()
  if (!supabase) {
    throw new Error('Supabase Admin ist nicht verfügbar.')
  }
  return supabase
}

export const ensureSpielleiter = async (groupId: string, playerName: string) => {
  const supabase = getAdminClient()
  const { data, error } = await supabase
    .from('group_members')
    .select('role')
    .eq('group_id', groupId)
    .eq('player_name', playerName)
    .single()

  if (error || !data || data.role !== 'spielleiter') {
    throw new Error('Nur Spielleiter dürfen Backups verwalten.')
  }
}

export const loadSqlJs = async () => {
  const initSqlJs = (await import('sql.js')).default
  return await initSqlJs({
    locateFile: (file: string) => `https://sql.js.org/dist/${file}`,
  })
}

export const getStoragePath = (groupId: string, fileName: string) => {
  return `${groupId}/${fileName}`
}

export const getBackupFileBuffer = async (groupId: string, fileName: string) => {
  const supabase = getAdminClient()
  const path = getStoragePath(groupId, fileName)
  const { data, error } = await supabase.storage
    .from(BACKUP_BUCKET)
    .download(path)
  if (error || !data) {
    throw new Error('Backup-Datei konnte nicht geladen werden.')
  }
  const arrayBuffer = await data.arrayBuffer()
  return new Uint8Array(arrayBuffer)
}

export const assertValidBackupFileName = (fileName: string) => {
  if (!fileName || fileName.includes('/') || fileName.includes('\\')) {
    throw new Error('Ungültiger Backup-Dateiname.')
  }
  if (!fileName.endsWith('.sqlite')) {
    throw new Error('Backup-Datei muss .sqlite enden.')
  }
}
