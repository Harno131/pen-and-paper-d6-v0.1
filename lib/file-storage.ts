import { Character, JournalEntry } from '@/types'

// Client-seitige Funktionen für Datei-Storage über API-Routen
// Die eigentliche Datei-Speicherung erfolgt serverseitig über API-Routen

// Lade alle Charaktere einer Gruppe aus Dateien
export async function loadCharactersFromFile(groupId: string): Promise<Character[]> {
  try {
    const response = await fetch(`/api/file-storage/characters?groupId=${encodeURIComponent(groupId)}`)
    if (!response.ok) {
      console.error('Fehler beim Laden der Charaktere:', response.statusText)
      return []
    }
    const data = await response.json()
    const characters = data.characters || []
    
    // Konvertiere ISO-Strings zurück zu Date-Objekten
    return characters.map((char: any) => ({
      ...char,
      createdDate: char.createdDate ? new Date(char.createdDate) : undefined,
      lastPlayedDate: char.lastPlayedDate ? new Date(char.lastPlayedDate) : undefined,
      deletedDate: char.deletedDate ? new Date(char.deletedDate) : undefined,
    }))
  } catch (error) {
    console.error('Fehler beim Laden der Charaktere:', error)
    return []
  }
}

// Speichere Charaktere in Dateien
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

// Lade Journal-Einträge aus Dateien
export async function loadJournalEntriesFromFile(groupId: string): Promise<JournalEntry[]> {
  try {
    const response = await fetch(`/api/file-storage/journal?groupId=${encodeURIComponent(groupId)}`)
    if (!response.ok) {
      console.error('Fehler beim Laden der Journal-Einträge:', response.statusText)
      return []
    }
    const data = await response.json()
    const entries = data.entries || []
    
    // Konvertiere ISO-Strings zurück zu Date-Objekten
    return entries.map((entry: any) => ({
      ...entry,
      timestamp: new Date(entry.timestamp),
    }))
  } catch (error) {
    console.error('Fehler beim Laden der Journal-Einträge:', error)
    return []
  }
}

// Speichere Journal-Einträge in Dateien
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

