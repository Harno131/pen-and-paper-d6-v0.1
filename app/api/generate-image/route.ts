import { NextResponse } from 'next/server'

type GenerateImageRequest = {
  type: 'portrait' | 'event' | 'monster'
  data: Record<string, any>
  fallcrestFilter?: boolean
}

const inferMood = (text: string): string => {
  const lower = text.toLowerCase()
  if (/(düster|blut|tod|schatten|angst|kälte|grau|nebel)/.test(lower)) return 'düster und bedrückend'
  if (/(freude|hell|sonne|hoffnung|warm|fest|lachen)/.test(lower)) return 'warm und hoffnungsvoll'
  if (/(kampf|sturm|gefahr|alarm|hast|panik)/.test(lower)) return 'dramatisch und angespannt'
  return 'mystisch und ruhig'
}

const buildPrompt = (payload: GenerateImageRequest): string => {
  const { type, data } = payload
  const fallcrest = (payload.fallcrestFilter ?? data?.fallcrestFilter)
    ? 'Fallcrest-Filter: feiner Nebel, nasse Reflexe, Artefakt-Schimmer, mystische Atmosphäre.'
    : ''

  if (type === 'portrait') {
    const traits = Array.isArray(data?.traits) ? data.traits.filter(Boolean).join(', ') : data?.traits || ''
    const equipment = data?.equipment ? `Sichtbare Ausrüstung: ${data.equipment}.` : ''
    const topAttributes = data?.topAttributes ? `Stärkste Attribute: ${data.topAttributes}.` : ''
    return [
      'Erzeuge ein detailliertes Porträt einer Person (halbkörper, Fantasy-Rollenspiel).',
      `Rasse: ${data?.race || 'unbekannt'}.`,
      `Klasse: ${data?.className || 'unbekannt'}.`,
      data?.age ? `Alter: ${data.age}.` : '',
      traits ? `Merkmale: ${traits}.` : '',
      equipment,
      topAttributes,
      fallcrest,
      'Stil: hochdetailliert, stimmig, realistisch, sanftes Licht.',
    ].filter(Boolean).join(' ')
  }

  if (type === 'monster') {
    const abilities = Array.isArray(data?.abilities) ? data.abilities.filter(Boolean).join(', ') : data?.abilities || ''
    return [
      'Erzeuge eine bedrohliche Bestiarium-Illustration.',
      `Monster-Name: ${data?.name || 'unbekannt'}.`,
      `Typ: ${data?.monsterType || 'unbekannt'}.`,
      abilities ? `Fähigkeiten: ${abilities}.` : '',
      fallcrest,
      'Stil: düster, dramatisch, texturreich.',
    ].filter(Boolean).join(' ')
  }

  const mood = inferMood(String(data?.text || ''))
  return [
    'Erzeuge eine atmosphärische Szene aus einem Tagebuch-Ereignis.',
    `Stimmung: ${mood}.`,
    data?.text ? `Beschreibung: ${data.text}` : '',
    fallcrest,
    'Stil: filmisch, mystisch, detailreich.',
  ].filter(Boolean).join(' ')
}

const buildPlaceholderUrl = (prompt: string) => {
  const label = encodeURIComponent(prompt.slice(0, 80))
  return `https://placehold.co/768x432/png?text=${label}`
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as GenerateImageRequest
    if (!body?.type || !body?.data) {
      return NextResponse.json({ error: 'type und data sind erforderlich' }, { status: 400 })
    }

    const prompt = buildPrompt(body)
    const apiKey = process.env.GEMINI_API_KEY

    if (!apiKey) {
      return NextResponse.json({ imageUrl: buildPlaceholderUrl(prompt), prompt, warning: 'GEMINI_API_KEY fehlt' })
    }

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-001:generateImages?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: { text: prompt },
          safetySettings: [{ category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' }],
        }),
      }
    )

    if (!response.ok) {
      const errorText = await response.text()
      return NextResponse.json({ imageUrl: buildPlaceholderUrl(prompt), prompt, warning: errorText }, { status: 200 })
    }

    const data = await response.json()
    const imageBytes =
      data?.generatedImages?.[0]?.image?.imageBytes ||
      data?.generatedImages?.[0]?.imageBytes ||
      null

    if (!imageBytes) {
      return NextResponse.json({ imageUrl: buildPlaceholderUrl(prompt), prompt, warning: 'Keine Bilddaten erhalten' })
    }

    const imageUrl = `data:image/png;base64,${imageBytes}`
    return NextResponse.json({ imageUrl, prompt })
  } catch (error) {
    return NextResponse.json({ error: 'Bildgenerierung fehlgeschlagen' }, { status: 500 })
  }
}
