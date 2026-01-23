import { NextRequest, NextResponse } from 'next/server'

export const revalidate = 0
import * as fs from 'fs'
import * as path from 'path'
import { JournalEntry } from '@/types'

// Pfad zum Datenordner
const DATA_BASE_PATH = process.env.PENANDPAPER_DATA_PATH || 'C:\\DEV\\PenAndPaperD6\\PenAndPaperD6_Data'

// Stelle sicher, dass der Pfad existiert
function ensureDirectoryExists(dirPath: string): void {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true })
  }
}

// Lade JSON-Datei
function loadJsonFile<T>(filePath: string, defaultValue: T): T {
  try {
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf-8')
      return JSON.parse(content) as T
    }
  } catch (error) {
    console.error(`Fehler beim Laden von ${filePath}:`, error)
  }
  return defaultValue
}

// Speichere JSON-Datei
function saveJsonFile<T>(filePath: string, data: T): boolean {
  try {
    ensureDirectoryExists(path.dirname(filePath))
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8')
    return true
  } catch (error) {
    console.error(`Fehler beim Speichern von ${filePath}:`, error)
    return false
  }
}

// Gruppen-Pfad
function getGroupPath(groupId: string): string {
  return path.join(DATA_BASE_PATH, 'groups', groupId)
}

// GET: Lade Journal-Einträge
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const groupId = searchParams.get('groupId')
    
    if (!groupId) {
      return NextResponse.json(
        { error: 'groupId ist erforderlich' },
        { status: 400, headers: { 'Cache-Control': 'no-store' } }
      )
    }
    
    const groupPath = getGroupPath(groupId)
    const entries = loadJsonFile<JournalEntry[]>(
      path.join(groupPath, 'tagebuch.json'),
      []
    )
    
    // Konvertiere Timestamps zu ISO-Strings
    const entriesWithDates = entries.map(entry => ({
      ...entry,
      timestamp: entry.timestamp instanceof Date 
        ? entry.timestamp.toISOString() 
        : new Date(entry.timestamp).toISOString(),
    }))
    
    return NextResponse.json(
      { entries: entriesWithDates },
      { headers: { 'Cache-Control': 'no-store' } }
    )
  } catch (error) {
    console.error('Fehler beim Laden der Journal-Einträge:', error)
    return NextResponse.json(
      { error: 'Fehler beim Laden der Journal-Einträge' },
      { status: 500, headers: { 'Cache-Control': 'no-store' } }
    )
  }
}

// POST: Speichere Journal-Einträge
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { groupId, entries } = body
    
    if (!groupId || !entries || !Array.isArray(entries)) {
      return NextResponse.json(
        { error: 'groupId und entries (Array) sind erforderlich' },
        { status: 400 }
      )
    }
    
    const groupPath = getGroupPath(groupId)
    ensureDirectoryExists(groupPath)
    
    // Konvertiere Timestamps zu Date-Objekten
    const entriesWithDates = entries.map((entry: JournalEntry) => ({
      ...entry,
      timestamp: entry.timestamp instanceof Date 
        ? entry.timestamp 
        : new Date(entry.timestamp),
    }))
    
    const success = saveJsonFile(
      path.join(groupPath, 'tagebuch.json'),
      entriesWithDates
    )
    
    if (success) {
      return NextResponse.json(
        { success: true },
        { headers: { 'Cache-Control': 'no-store' } }
      )
    } else {
      return NextResponse.json(
        { error: 'Fehler beim Speichern der Journal-Einträge' },
        { status: 500, headers: { 'Cache-Control': 'no-store' } }
      )
    }
  } catch (error) {
    console.error('Fehler beim Speichern der Journal-Einträge:', error)
    return NextResponse.json(
      { error: 'Fehler beim Speichern der Journal-Einträge' },
      { status: 500, headers: { 'Cache-Control': 'no-store' } }
    )
  }
}

