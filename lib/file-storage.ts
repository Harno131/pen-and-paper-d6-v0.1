import { Character, JournalEntry } from '@/types'

// Client-seitige Funktionen für Datei-Storage über API-Routen
// Die eigentliche Datei-Speicherung erfolgt serverseitig über API-Routen

// Nur Export (Backup): Speichere Charaktere in Dateien. Lesen aus Datei wird nicht mehr verwendet.
export async function saveCharactersToFile(groupId: string, characters: Character[]): Promise<boolean> {
  try {
    const response = await fetch('/api/file-storage/characters', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ groupId, characters }),
    })
    
    if (!response.ok) {
      console.error('Fehler beim Speichern der Charaktere:', response.statusText)
      return false
    }
    
    const data = await response.json()
    return data.success === true
  } catch (error) {
    console.error('Fehler beim Speichern der Charaktere:', error)
    return false
  }
}

// Nur Export (Backup): Speichere Journal-Einträge in Dateien.
export async function saveJournalEntriesToFile(groupId: string, entries: JournalEntry[]): Promise<boolean> {
  try {
    const response = await fetch('/api/file-storage/journal', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ groupId, entries }),
    })
    
    if (!response.ok) {
      console.error('Fehler beim Speichern der Journal-Einträge:', response.statusText)
      return false
    }
    
    const data = await response.json()
    return data.success === true
  } catch (error) {
    console.error('Fehler beim Speichern der Journal-Einträge:', error)
    return false
  }
}

// Prüfe ob Datei-Speicherung aktiviert ist
export function isFileStorageEnabled(): boolean {
  if (typeof window === 'undefined') return false
  // Prüfe ob Datei-Storage aktiviert ist (kann über localStorage gesteuert werden)
  return localStorage.getItem('useFileStorage') === 'true'
}

