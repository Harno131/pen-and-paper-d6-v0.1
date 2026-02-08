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

const FATE_ADJECTIVES = [
  'gezeichnet von einer alten Narbe',
  'umgeben von einem Hauch von Verfall',
  'mit einem stechenden Blick',
  'getragen von schwerer Entschlossenheit',
  'von stiller Trauer durchdrungen',
  'mit der Ruhe eines erfahrenen Veteranen',
  'unter einem Fluch der Vergangenheit',
]

const getFateAdjective = () => {
  const idx = Math.floor(Math.random() * FATE_ADJECTIVES.length)
  return FATE_ADJECTIVES[idx]
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

    // 1. Gemini als "Regisseur" für den perfekten Fallcrest-Prompt
    const genAI = new GoogleGenerativeAI(apiKey)
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    
    const promptExtras = Array.isArray(body.promptItems) && body.promptItems.length > 0
      ? `${body.promptItems.join(', ')}${body.background ? `. Hintergrund: ${body.background}` : ''}`
      : ''
    const basePrompt =
      typeof body.promptOverride === 'string' && body.promptOverride.trim()
        ? body.promptOverride.trim()
        : buildPrompt(body)
    const fateAdjective = getFateAdjective()
    const rawPrompt = promptExtras
      ? `${basePrompt}. Zusätze: ${promptExtras}. Schicksal: ${fateAdjective}.`
      : `${basePrompt}. Schicksal: ${fateAdjective}.`
    const geminiInstruction = `
  Role: Expert Cinematic Concept Artist & Dark Fantasy Author.
  Task: Transform minimal RPG character data into a professional, highly descriptive English image prompt for the FLUX.1 model.
  
  Style-Bible 'Fallcrest':
  - Aesthetic: Grimdark Fantasy, moody, mysterious. 
  - Lighting: Chiaroscuro (deep shadows, single light sources), volumetric fog, amber or cold blue accents.
  - Textures: Emphasize 'The Used Look'. Gear should be scratched, leather weathered, skin soot-stained or scarred.
  
  Creative Freedom:
  - If the input is "Dwarf, Warrior", don't just say that. Describe his braided, salt-and-pepper beard, the notch in his iron pauldron, and the way he grips his war-hammer.
  - Add incidental details: A crow in the background, a faint magical shimmer, or mud on the boots.
  - Environment: Integrate the chosen background (e.g., 'Gasthof') with details like 'smoke-filled rafters' or 'spilled ale on rough oak tables'.

  Input Data: "${rawPrompt}"
  
  Output: ONLY the final, epic, cinematic English prompt. No "Here is your prompt", no quotes.
`
    
    const result = await model.generateContent(geminiInstruction)
    const optimizedPrompt = result.response.text().trim()

    // 2. Pollinations URL generieren (Kostenlos & ohne Key-Probleme)
    let pollinationsBuffer: Buffer | null = null
    let pollinationsContentType = ''
    let lastErrorText = ''
    try {
      const seed = Math.floor(Math.random() * 999999)
      const encodedPrompt = encodeURIComponent(optimizedPrompt)
      const candidates = [
        `https://image.pollinations.ai/prompt/${encodedPrompt}?width=768&height=432&model=flux&seed=${seed}&nologo=true`,
        `https://image.pollinations.ai/prompt/${encodedPrompt}?width=768&height=432&model=flux&seed=${seed}&nologo=true&format=png`,
        `https://image.pollinations.ai/prompt/${encodedPrompt}.png?width=768&height=432&model=flux&seed=${seed}&nologo=true`,
      ]
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
            pollinationsContentType = response.headers.get('content-type') || ''
            const buffer = Buffer.from(await response.arrayBuffer())
            if (!pollinationsContentType.startsWith('image/') || buffer.length < 10_000) {
              const fallbackText = buffer.toString('utf-8')
              lastErrorText = `Unerwartete Antwort (${pollinationsContentType || 'unknown'}), size=${buffer.length}. ${fallbackText.slice(0, 500)}`
              await delay(400)
              continue
            }
            pollinationsBuffer = buffer
            break
          } catch (error: any) {
            lastErrorText = `Bilddienst nicht erreichbar: ${error?.message || 'Unbekannter Fehler'}`
            await delay(400)
          }
        }
        if (pollinationsBuffer) break
      }
    } catch (error: any) {
      lastErrorText = `Pollinations fehlgeschlagen: ${error?.message || 'Unbekannter Fehler'}`
    }

    if (pollinationsBuffer) {
      const baseName = getBaseImageName(body)
      const baseSlug = normalizeSlug(baseName)
      ensureDirectoryExists(IMAGE_DIR)
      const nextVersion = getNextVersion(IMAGE_DIR, baseSlug)
      const versionTag = String(nextVersion).padStart(3, '0')
      const fileName = `${baseSlug}_v${versionTag}.png`
      const filePath = path.join(IMAGE_DIR, fileName)

      fs.writeFileSync(filePath, pollinationsBuffer)

      return NextResponse.json({
        imageUrl: `/images/${fileName}`,
        fileName,
        prompt: optimizedPrompt
      }, {
        headers: { 'Cache-Control': 'no-store' }
      })
    }

    // 3. Fallback: Hugging Face Inference API (SDXL)
    const hfToken = process.env.HF_ACCESS_TOKEN
    if (!hfToken) {
      return NextResponse.json(
        {
          error: 'Bild konnte nicht korrekt geladen werden.',
          details: 'HF_ACCESS_TOKEN fehlt für den Fallback.',
        },
        { status: 500, headers: { 'Cache-Control': 'no-store' } }
      )
    }

    const hfResponse = await fetchWithTimeout(
      'https://router.huggingface.co/hf-inference/models/black-forest-labs/FLUX.1-schnell',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${hfToken}`,
          Accept: 'image/png',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ inputs: optimizedPrompt }),
      },
      30000
    )

    if (!hfResponse.ok) {
      const errorText = await hfResponse.text()
      return NextResponse.json(
        {
          error: 'Bild konnte nicht korrekt geladen werden.',
          details: `HF ${hfResponse.status} ${hfResponse.statusText}: ${errorText}`.slice(0, 2000),
        },
        { status: 500, headers: { 'Cache-Control': 'no-store' } }
      )
    }

    const hfContentType = hfResponse.headers.get('content-type') || ''
    const hfBuffer = Buffer.from(await hfResponse.arrayBuffer())
    if (!hfContentType.startsWith('image/') || hfBuffer.length < 10_000) {
      const fallbackText = hfBuffer.toString('utf-8')
      return NextResponse.json(
        {
          error: 'Bild konnte nicht korrekt geladen werden.',
          details: `HF Antwort nicht als Bild erkannt (${hfContentType || 'unknown'}), size=${hfBuffer.length}. ${fallbackText.slice(0, 1000)}`,
        },
        { status: 500, headers: { 'Cache-Control': 'no-store' } }
      )
    }
    const base64 = hfBuffer.toString('base64')
    const dataUrl = `data:${hfContentType};base64,${base64}`

    return NextResponse.json({
      imageUrl: dataUrl,
      fileName: null,
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