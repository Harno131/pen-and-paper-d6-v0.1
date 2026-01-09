import { createSupabaseClient } from './supabase'

// Debug-Funktionen für Supabase-Verbindung
export const testSupabaseConnection = async (): Promise<{ success: boolean; error?: string; details?: any }> => {
  const supabase = createSupabaseClient()
  
  if (!supabase) {
    return {
      success: false,
      error: 'Supabase-Client konnte nicht erstellt werden. Prüfe NEXT_PUBLIC_SUPABASE_URL und NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local'
    }
  }

  // Teste Verbindung durch einfache Abfrage
  try {
    const { data, error } = await supabase
      .from('groups')
      .select('count')
      .limit(1)

    if (error) {
      // Prüfe spezifische Fehler
      if (error.code === 'PGRST116') {
        return {
          success: false,
          error: 'Tabelle "groups" existiert nicht. Führe das SQL-Schema in Supabase SQL Editor aus.',
          details: error
        }
      }
      
      if (error.code === '42501' || error.message?.includes('permission denied')) {
        return {
          success: false,
          error: 'Berechtigungsfehler. Prüfe ob RLS-Policies korrekt gesetzt sind.',
          details: error
        }
      }

      return {
        success: false,
        error: `Verbindungsfehler: ${error.message || error.code || 'Unbekannter Fehler'}`,
        details: error
      }
    }

    return { success: true }
  } catch (err: any) {
    return {
      success: false,
      error: `Unerwarteter Fehler: ${err.message || 'Unbekannter Fehler'}`,
      details: err
    }
  }
}

export const checkTables = async (): Promise<{ tables: string[]; missing: string[] }> => {
  const supabase = createSupabaseClient()
  if (!supabase) return { tables: [], missing: [] }

  const requiredTables = ['groups', 'group_members', 'characters', 'available_skills', 'journal_entries', 'shared_images', 'dice_rolls']
  const existing: string[] = []
  const missing: string[] = []

  for (const table of requiredTables) {
    try {
      const { error } = await supabase.from(table).select('count').limit(1)
      if (error) {
        if (error.code === 'PGRST116') {
          missing.push(table)
        } else {
          // Anderer Fehler, aber Tabelle existiert wahrscheinlich
          existing.push(table)
        }
      } else {
        existing.push(table)
      }
    } catch {
      missing.push(table)
    }
  }

  return { tables: existing, missing }
}













