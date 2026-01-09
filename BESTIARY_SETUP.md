# Bestiary (Standard-Gegner) Setup

Dieses Dokument erklärt, wie du Standard-Gegner für dein Fallcrest-Pen&Paper-System in Supabase anlegst.

## 📋 Übersicht

Die Bestiary-Funktion ermöglicht es Spielleitern, vordefinierte Gegner (Zombies, Spinnen, Banditen, etc.) in ihre Gruppen einzufügen. Jeder Gegner hat:

- **Standard-Attribute** (angepasst an das D6-System)
- **Fertigkeiten** (wie bei Charakteren)
- **Inventar** (Waffen, Rüstung)
- **Fallcrest-Twist** (Besonderer Bezug zu Nässe, Dunst oder Artefakten)

## 🗄️ Datenbank-Setup

### 1. Migration ausführen

Führe die Migration in Supabase aus:

1. Gehe zu [Supabase SQL Editor](https://supabase.com/dashboard/project/_/sql)
2. Öffne die Datei `supabase/migrations/005_create_bestiary.sql`
3. Kopiere den Inhalt in den SQL Editor
4. Klicke auf "RUN"

Die Tabelle `bestiary` wird erstellt mit:
- `id` (UUID, Primary Key)
- `name` (TEXT)
- `type` (TEXT: "Untoter", "Bestie", "Humanoid", etc.)
- `level` (INTEGER)
- `race` (TEXT)
- `description` (TEXT)
- `attributes` (JSONB: D6-Attribute)
- `skills` (JSONB: Array von Skills)
- `inventory` (JSONB: Array von Items)
- `max_hp` (INTEGER)
- `fallcrest_twist` (TEXT: Besonderer Fallcrest-Bezug)
- `created_at`, `updated_at` (Timestamps)

## 📤 Gegner hochladen

### Option 1: Skript verwenden (Empfohlen)

1. **Installiere dotenv** (falls noch nicht vorhanden):
   ```bash
   npm install dotenv
   ```

2. **Stelle sicher, dass `.env.local` existiert** mit:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://dein-projekt.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=dein-anon-key
   ```

3. **Führe das Skript aus**:
   ```bash
   node scripts/upload_bestiary.js
   ```

Das Skript:
- Lädt `standard_enemies.json`
- Prüft, welche Gegner bereits existieren
- Lädt nur neue Gegner hoch
- Zeigt eine Zusammenfassung

### Option 2: Manuell über Supabase Dashboard

1. Gehe zu [Supabase Table Editor](https://supabase.com/dashboard/project/_/editor)
2. Wähle die Tabelle `bestiary`
3. Klicke auf "Insert" → "Insert row"
4. Fülle die Felder manuell aus

## 📝 Standard-Gegner

Die Datei `standard_enemies.json` enthält folgende Gegner:

1. **Gischt-Zombie** (Level 1, Untoter)
   - Explodiert in Nebelwolke bei Treffern
   
2. **Dunst-Spinne** (Level 1, Bestie)
   - Gift enthält magische Partikel, verursacht Visionen
   
3. **Nebel-Bandit** (Level 1, Humanoid)
   - Trägt Nebel-Amulett für Unsichtbarkeit
   
4. **Artefakt-Wächter** (Level 2, Konstrukt)
   - Aktiviert Nebel-Schutzschild bei niedrigen HP
   
5. **Nass-Geist** (Level 2, Geist)
   - Kann sich in Nebel auflösen, verursacht Ertrinkungsgefühl
   
6. **Dunst-Kobold** (Level 1, Humanoid)
   - Wirft Artefakt-Fragmente, die explodieren
   
7. **Gischt-Schleim** (Level 1, Ooze)
   - Wird von Artefakten angezogen, absorbiert deren Energie
   
8. **Nebel-Wolf** (Level 2, Bestie)
   - Jagd im Rudel, nutzt Nebel zur Tarnung

## 🎨 Fallcrest-Twists

Jeder Gegner hat einen **Fallcrest-Twist**, der ihn mit dem Setting verbindet:

- **Nässe**: Feuchter Nebel, tropfende Körper, Ertrinkungsgefühl
- **Dunst**: Magischer Nebel, Sichtbehinderung, Tarnung
- **Artefakte**: Energie-Absorption, Artefakt-Fragmente, magische Effekte

## 🔧 Anpassungen

### Neue Gegner hinzufügen

1. Öffne `standard_enemies.json`
2. Füge einen neuen Eintrag hinzu (siehe Struktur unten)
3. Führe `node scripts/upload_bestiary.js` aus

### Struktur eines Gegners

```json
{
  "name": "Gegner-Name",
  "type": "Untoter|Bestie|Humanoid|Geist|Ooze|Konstrukt",
  "level": 1,
  "race": "Rasse",
  "description": "Kurze Beschreibung",
  "attributes": {
    "Reflexe": "2D",
    "Koordination": "2D",
    "Stärke": "2D",
    "Wissen": "2D",
    "Wahrnehmung": "2D",
    "Ausstrahlung": "2D",
    "Magie": "0D"
  },
  "skills": [
    {
      "name": "Fertigkeit",
      "attribute": "Reflexe",
      "bonusDice": 1,
      "specializations": [],
      "isWeakened": false
    }
  ],
  "inventory": [],
  "maxHP": 20,
  "currentHP": 20,
  "fallcrestTwist": "Beschreibung des Fallcrest-Bezugs"
}
```

## 🎮 Verwendung in der App

Nach dem Hochladen können Spielleiter:

1. In der Spielleiter-Übersicht → "NPC hinzufügen"
2. Aus der Bestiary-Liste wählen
3. Gegner in die Gruppe einfügen

*(Diese Funktion muss noch in der App implementiert werden)*

## 📚 D&D 4e Anpassungen

Die Werte basieren auf typischen D&D 4e Level 1-2 Gegnern:

- **HP**: 12-40 (angepasst an D6-System)
- **Attribute**: 1D-4D (typisch 2D-3D für Level 1-2)
- **Skills**: +1D bis +2D Bonus
- **AC/Defense**: Wird durch Attribute und Rüstung repräsentiert

## ⚠️ Hinweise

- Die Gegner werden **global** gespeichert (für alle Gruppen)
- Spielleiter können Gegner aus der Bestiary in ihre Gruppen kopieren
- Änderungen an der Bestiary wirken sich nicht auf bereits eingefügte Gegner aus
