import { NextRequest, NextResponse } from 'next/server'
import * as fs from 'fs'
import * as path from 'path'
import { createSupabaseAdmin } from '@/lib/supabase'

export const revalidate = 0

const MASTER_NAME = 'Flori'

const validateMaster = (playerName?: string | null, password?: string | null) => {
  const expected = process.env.RBM_PASSWORD || ''
  if (!expected) {
    return { ok: false, error: 'RBM_PASSWORD fehlt in der Umgebung.' }
  }
  if (!playerName || playerName.trim() !== MASTER_NAME) {
    return { ok: false, error: 'Nicht als Rule-Book-Master angemeldet.' }
  }
  if (!password || password !== expected) {
    return { ok: false, error: 'Rule-Book-Master-Passwort ist falsch.' }
  }
  return { ok: true }
}

const normalizeKey = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/ä/g, 'ae')
    .replace(/ö/g, 'oe')
    .replace(/ü/g, 'ue')
    .replace(/ß/g, 'ss')

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { playerName, password } = body || {}
    const auth = validateMaster(playerName, password)
    if (!auth.ok) {
      return NextResponse.json(
        { error: auth.error },
        { status: 401, headers: { 'Cache-Control': 'no-store' } }
      )
    }

    const descriptionsPath = path.join(process.cwd(), 'Extern', 'skill_descriptions.json')
    const structurePath = path.join(process.cwd(), 'skills_structure.json')
    if (!fs.existsSync(descriptionsPath) || !fs.existsSync(structurePath)) {
      return NextResponse.json(
        { error: 'Basisdateien fehlen (Extern/skill_descriptions.json oder skills_structure.json).' },
        { status: 500, headers: { 'Cache-Control': 'no-store' } }
      )
    }

    const descriptionsRaw = fs.readFileSync(descriptionsPath, 'utf-8')
    const structureRaw = fs.readFileSync(structurePath, 'utf-8')
    const descriptionsJson = JSON.parse(descriptionsRaw) as { descriptions?: Record<string, string> }
    const structureJson = JSON.parse(structureRaw) as { skills?: Array<{ name: string; attribute: string }> }

    const descriptions = descriptionsJson.descriptions || {}
    const skills = structureJson.skills || []

    const attributeMap = new Map<string, string>()
    skills.forEach((skill) => {
      const name = String(skill.name || '').trim()
      const attribute = String(skill.attribute || '').trim()
      if (!name || !attribute || name === '…') return
      attributeMap.set(normalizeKey(name), attribute)
    })

    const rows = Object.entries(descriptions).map(([name, description]) => {
      const attribute = attributeMap.get(normalizeKey(name))
      if (!attribute) return null
      return {
        name: String(name).trim(),
        attribute,
        description: String(description).trim(),
        source_group_id: null,
        source_player_name: 'Rule-Book-Master',
        updated_at: new Date().toISOString(),
      }
    }).filter(Boolean) as Array<{ name: string; attribute: string; description: string }>

    if (rows.length === 0) {
      return NextResponse.json(
        { error: 'Keine gültigen Einträge für den Import gefunden.' },
        { status: 400, headers: { 'Cache-Control': 'no-store' } }
      )
    }

    const supabase = createSupabaseAdmin()
    if (!supabase) {
      return NextResponse.json(
        { error: 'Supabase Admin ist nicht verfügbar.' },
        { status: 500, headers: { 'Cache-Control': 'no-store' } }
      )
    }

    const { error } = await supabase
      .from('rulebook_skills')
      .upsert(rows, { onConflict: 'name,attribute' })

    if (error) {
      console.error('Failed to import rulebook defaults:', error)
      return NextResponse.json(
        { error: 'Import fehlgeschlagen.' },
        { status: 500, headers: { 'Cache-Control': 'no-store' } }
      )
    }

    return NextResponse.json(
      { success: true, count: rows.length },
      { headers: { 'Cache-Control': 'no-store' } }
    )
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unbekannter Fehler'
    return NextResponse.json(
      { error: 'Import fehlgeschlagen.', details: message },
      { status: 500, headers: { 'Cache-Control': 'no-store' } }
    )
  }
}
