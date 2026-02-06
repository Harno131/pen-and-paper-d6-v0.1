import { NextResponse } from 'next/server'
import { GoogleGenerativeAI } from "@google/generative-ai"
import * as fs from 'fs'
import * as path from 'path'

export const revalidate = 0

type GenerateImageRequest = {
  type: 'portrait' | 'event' | 'monster'
  data: Record<string, any>
  fallcrestFilter?: boolean
  promptOverride?: string
  promptItems?: string[]
  background?: string
}

// Hilfsfunktion für die Stimmung
const inferMood = (text: string): string => {
  const lower = text.toLowerCase()
  if (/(düster|blut|tod|schatten|angst|kälte|grau|nebel)/.test(lower)) return 'dark and oppressive'
  if (/(freude|hell|sonne|hoffnung|warm|fest|lachen)/.test(lower)) return 'warm and hopeful'
  if (/(kampf|sturm|gefahr|alarm|hast|panik)/.test(lower)) return 'dramatic and tense'
  return 'mystical and calm'
}

// Baut den deutschen Prompt zusammen
const buildPrompt = (payload: GenerateImageRequest): string => {
  const { type, data } = payload
  const fallcrest = (payload.fallcrestFilter ?? data?.fallcrestFilter)
    ? 'Style: Fallcrest-Filter, subtle mist, wet reflections, mystical artifact glow, cinematic atmosphere.'
    : ''

  if (type === 'portrait') {
    const traits = Array.isArray(data?.traits) ? data.traits.filter(Boolean).join(', ') : data?.traits || ''
    return `Portrait of a ${data?.race || 'fantasy'} ${data?.className || 'character'}. Age: ${data?.age || 'unknown'}. Traits: ${traits}. ${fallcrest} Style: digital painting, high fantasy, realistic faces, epic lighting.`
  }

  if (type === 'monster') {
    return `Beastiary illustration of a ${data?.name || 'monster'} (${data?.monsterType || 'creature'}). ${fallcrest} Style: dark, dramatic, highly textured.`
  }

  return `Atmospheric scene: ${data?.text || 'mysterious event'}. Mood: ${inferMood(String(data?.text || ''))}. ${fallcrest} Style: cinematic, detailed, mystical.`
}

const IMAGE_DIR = path.join(process.cwd(), 'public', 'images')

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

const fetchWithTimeout = async (url: string, init: RequestInit, timeoutMs: number) => {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs)
  try {
    return await fetch(url, { ...init, signal: controller.signal })
  } finally {
    clearTimeout(timeoutId)
  }
}

const ensureDirectoryExists = (dirPath: string) => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true })
  }
}

const normalizeSlug = (value: string) => {
  const trimmed = value.trim().toLowerCase()
  const withUmlauts = trimmed
    .replace(/ä/g, 'ae')
    .replace(/ö/g, 'oe')
    .replace(/ü/g, 'ue')
    .replace(/ß/g, 'ss')
  const withoutDiacritics = withUmlauts
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
  const slug = withoutDiacritics
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
  return slug || 'bild'
}

const getBaseImageName = (payload: GenerateImageRequest) => {
  const data = payload.data || {}
  if (payload.type === 'event') {
    const dateLabel = String(data.dateLabel || data.date || '').trim()
    return dateLabel ? `journal-${dateLabel}` : 'journal'
  }
  const name = String(data.name || data.title || '').trim()
  const entityType = String(data.entityType || payload.type || '').trim()
  if (name && entityType) return `${entityType}-${name}`
  if (name) return name
  return entityType || payload.type
}

const getNextVersion = (dirPath: string, baseSlug: string) => {
  try {
    const entries = fs.existsSync(dirPath) ? fs.readdirSync(dirPath) : []
    const matcher = new RegExp(`^${baseSlug}_v(\\d+)\\.png$`, 'i')
    const versions = entries
      .map((entry) => entry.match(matcher))
      .filter(Boolean)
      .map((match) => Number((match as RegExpMatchArray)[1]))
      .filter((value) => Number.isFinite(value))
    const currentMax = versions.length > 0 ? Math.max(...versions) : 0
    return currentMax + 1
  } catch (error) {
    console.warn('Konnte Bildversion nicht lesen', error)
    return 1
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as GenerateImageRequest
    const apiKey = process.env.GEMINI_API_KEY

    if (!apiKey) {
      return NextResponse.json({ error: 'GEMINI_API_KEY fehlt.' }, { status: 500 })
    }

    // 1. Gemini als Übersetzer & Prompt-Optimierer nutzen
    const genAI = new GoogleGenerativeAI(apiKey)
    const model = genAI.getGenerativeModel(
		{ model: "gemini-2.5-flash" }, 
	);
    
    const rawPrompt =
      typeof body.promptOverride === 'string' && body.promptOverride.trim()
        ? body.promptOverride.trim()
        : Array.isArray(body.promptItems) && body.promptItems.length > 0
          ? `${body.promptItems.join(', ')}${body.background ? `. Hintergrund: ${body.background}` : ''}`
          : buildPrompt(body)
    const geminiInstruction = `Act as an expert AI image prompter. Expand this description into a professional, highly detailed English image prompt for a high-quality AI generator: "${rawPrompt}". Output ONLY the final prompt text.`
    
    const result = await model.generateContent(geminiInstruction)
    const optimizedPrompt = result.response.text().trim()

    // 2. Pollinations URL generieren (Kostenlos & ohne Key-Probleme)
    const seed = Math.floor(Math.random() * 999999)
    const encodedPrompt = encodeURIComponent(optimizedPrompt)
    const candidates = [
      `https://image.pollinations.ai/prompt/${encodedPrompt}?width=768&height=432&model=flux&seed=${seed}&nologo=true`,
      `https://image.pollinations.ai/prompt/${encodedPrompt}?width=768&height=432&model=flux&seed=${seed}&nologo=true&format=png`,
      `https://image.pollinations.ai/prompt/${encodedPrompt}.png?width=768&height=432&model=flux&seed=${seed}&nologo=true`,
    ]

    let imageBuffer: Buffer | null = null
    let contentType = ''
    let lastErrorText = ''
    for (const url of candidates) {
      for (let attempt = 0; attempt < 2; attempt += 1) {
        try {
          const response = await fetchWithTimeout(
            url,
            { cache: 'no-store', headers: { Accept: 'image/*' } },
            15000
          )
          if (!response.ok) {
            const errorText = await response.text()
            lastErrorText = `${response.status} ${response.statusText}: ${errorText}`.slice(0, 2000)
            await delay(400)
            continue
          }
          contentType = response.headers.get('content-type') || ''
          const buffer = Buffer.from(await response.arrayBuffer())
          if (!contentType.startsWith('image/') || buffer.length < 10_000) {
            const fallbackText = buffer.toString('utf-8')
            lastErrorText = `Unerwartete Antwort (${contentType || 'unknown'}), size=${buffer.length}. ${fallbackText.slice(0, 500)}`
            await delay(400)
            continue
          }
          imageBuffer = buffer
          break
        } catch (error: any) {
          lastErrorText = `Bilddienst nicht erreichbar: ${error?.message || 'Unbekannter Fehler'}`
          await delay(400)
        }
      }
      if (imageBuffer) break
    }

    if (!imageBuffer) {
      return NextResponse.json(
        {
          error: 'Bild konnte nicht korrekt geladen werden.',
          details: lastErrorText || 'Keine Antwort von Bilddienst.',
        },
        { status: 500, headers: { 'Cache-Control': 'no-store' } }
      )
    }

    const baseName = getBaseImageName(body)
    const baseSlug = normalizeSlug(baseName)
    ensureDirectoryExists(IMAGE_DIR)
    const nextVersion = getNextVersion(IMAGE_DIR, baseSlug)
    const versionTag = String(nextVersion).padStart(3, '0')
    const fileName = `${baseSlug}_v${versionTag}.png`
    const filePath = path.join(IMAGE_DIR, fileName)

    fs.writeFileSync(filePath, imageBuffer)

    return NextResponse.json({
      imageUrl: `/images/${fileName}`,
      fileName,
      prompt: optimizedPrompt
    }, {
      headers: { 'Cache-Control': 'no-store' }
    })

  } catch (error: any) {
    console.error("Fehler:", error)
    return NextResponse.json(
      { error: 'Bildgenerierung fehlgeschlagen', details: error.message },
      { status: 500 }
    )
  }
}