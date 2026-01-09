import { NextRequest, NextResponse } from 'next/server'
import * as fs from 'fs'
import * as path from 'path'
import { Character } from '@/types'

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

// GET: Lade alle Charaktere einer Gruppe
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const groupId = searchParams.get('groupId')
    
    if (!groupId) {
      return NextResponse.json(
        { error: 'groupId ist erforderlich' },
        { status: 400 }
      )
    }
    
    const groupPath = getGroupPath(groupId)
    
    // Lade Spieler-Charaktere
    const playerChars = loadJsonFile<Character[]>(
      path.join(groupPath, 'spielerCharaktere.json'),
      []
    )
    
    // Lade NPCs
    const npcs = loadJsonFile<Character[]>(
      path.join(groupPath, 'nichtSpielerCharactere.json'),
      []
    )
    
    // Lade Monster
    const monsters = loadJsonFile<Character[]>(
      path.join(groupPath, 'monster.json'),
      []
    )
    
    // Kombiniere alle und konvertiere Timestamps
    const allCharacters = [...playerChars, ...npcs, ...monsters].map(char => ({
      ...char,
      createdDate: char.createdDate ? new Date(char.createdDate).toISOString() : undefined,
      lastPlayedDate: char.lastPlayedDate ? new Date(char.lastPlayedDate).toISOString() : undefined,
      deletedDate: char.deletedDate ? new Date(char.deletedDate).toISOString() : undefined,
    }))
    
    return NextResponse.json({ characters: allCharacters })
  } catch (error) {
    console.error('Fehler beim Laden der Charaktere:', error)
    return NextResponse.json(
      { error: 'Fehler beim Laden der Charaktere' },
      { status: 500 }
    )
  }
}

// POST: Speichere Charaktere
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { groupId, characters } = body
    
    if (!groupId || !characters || !Array.isArray(characters)) {
      return NextResponse.json(
        { error: 'groupId und characters (Array) sind erforderlich' },
        { status: 400 }
      )
    }
    
    const groupPath = getGroupPath(groupId)
    ensureDirectoryExists(groupPath)
    
    // Trenne nach Typ
    const playerChars: Character[] = []
    const npcs: Character[] = []
    const monsters: Character[] = []
    
    characters.forEach((char: Character) => {
      if (char.isNPC) {
        if (char.npcType === 'monster') {
          monsters.push(char)
        } else {
          npcs.push(char)
        }
      } else {
        playerChars.push(char)
      }
    })
    
    // Speichere in separate Dateien
    const success1 = saveJsonFile(
      path.join(groupPath, 'spielerCharaktere.json'),
      playerChars
    )
    const success2 = saveJsonFile(
      path.join(groupPath, 'nichtSpielerCharactere.json'),
      npcs
    )
    const success3 = saveJsonFile(
      path.join(groupPath, 'monster.json'),
      monsters
    )
    
    if (success1 && success2 && success3) {
      return NextResponse.json({ success: true })
    } else {
      return NextResponse.json(
        { error: 'Fehler beim Speichern der Charaktere' },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('Fehler beim Speichern der Charaktere:', error)
    return NextResponse.json(
      { error: 'Fehler beim Speichern der Charaktere' },
      { status: 500 }
    )
  }
}

