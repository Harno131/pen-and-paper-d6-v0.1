/**
 * Skript zum Hochladen von Standard-Gegnern in Supabase
 * 
 * Verwendung:
 * 1. Stelle sicher, dass .env.local die Supabase-Keys enthält
 * 2. Führe aus: node scripts/upload_bestiary.js
 */

// Versuche dotenv zu laden (optional)
try {
  require('dotenv').config({ path: '.env.local' })
} catch (e) {
  // dotenv nicht installiert, verwende Umgebungsvariablen direkt
}

const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Fehler: Supabase-Keys fehlen in .env.local')
  console.error('Bitte füge NEXT_PUBLIC_SUPABASE_URL und NEXT_PUBLIC_SUPABASE_ANON_KEY hinzu')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function uploadBestiary() {
  console.log('📖 Lade Standard-Gegner...')
  
  // Lade JSON-Datei
  const enemiesPath = path.join(__dirname, '..', 'standard_enemies.json')
  if (!fs.existsSync(enemiesPath)) {
    console.error(`❌ Fehler: Datei nicht gefunden: ${enemiesPath}`)
    process.exit(1)
  }

  const enemiesData = JSON.parse(fs.readFileSync(enemiesPath, 'utf-8'))
  console.log(`✅ ${enemiesData.length} Gegner geladen`)

  // Konvertiere zu Supabase-Format
  const bestiaryEntries = enemiesData.map(enemy => ({
    name: enemy.name,
    type: enemy.type,
    level: enemy.level,
    race: enemy.race,
    description: enemy.description,
    attributes: enemy.attributes,
    skills: enemy.skills,
    inventory: enemy.inventory,
    max_hp: enemy.maxHP,
    fallcrest_twist: enemy.fallcrestTwist,
  }))

  console.log('\n🔄 Prüfe bestehende Einträge...')
  
  // Prüfe, welche Gegner bereits existieren
  const { data: existing, error: fetchError } = await supabase
    .from('bestiary')
    .select('name')

  if (fetchError) {
    console.error('❌ Fehler beim Abrufen bestehender Einträge:', fetchError)
    process.exit(1)
  }

  const existingNames = new Set(existing?.map(e => e.name) || [])
  const newEntries = bestiaryEntries.filter(e => !existingNames.has(e.name))
  const existingEntries = bestiaryEntries.filter(e => existingNames.has(e.name))

  console.log(`   ${existingEntries.length} Gegner bereits vorhanden`)
  console.log(`   ${newEntries.length} neue Gegner zum Hinzufügen`)

  if (newEntries.length === 0) {
    console.log('\n✅ Alle Gegner sind bereits in der Datenbank')
    return
  }

  console.log('\n📤 Lade neue Gegner hoch...')
  
  // Lade neue Einträge hoch
  const { data, error } = await supabase
    .from('bestiary')
    .insert(newEntries)
    .select()

  if (error) {
    console.error('❌ Fehler beim Hochladen:', error)
    process.exit(1)
  }

  console.log(`\n✅ Erfolgreich ${data.length} Gegner hochgeladen:`)
  data.forEach(enemy => {
    console.log(`   - ${enemy.name} (Level ${enemy.level}, ${enemy.type})`)
  })

  console.log('\n🎉 Fertig! Die Gegner sind jetzt in Supabase verfügbar.')
  console.log('   Spielleiter können sie jetzt in ihre Gruppen einfügen.')
}

// Führe Upload aus
uploadBestiary()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('❌ Unerwarteter Fehler:', error)
    process.exit(1)
  })
