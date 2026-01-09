# 📅 Fantasie-Kalender Setup

## Datenbank-Migration ausführen

1. Gehe zu Supabase Dashboard → SQL Editor
2. Öffne die Datei `supabase/migrations/002_fantasy_calendar.sql`
3. Kopiere den gesamten Inhalt
4. Füge ihn in den SQL Editor ein
5. Klicke "Run"

**Wichtig:** Diese Migration erweitert die `journal_entries` Tabelle um:
- `fantasy_date` (JSONB) - Speichert das Fantasie-Datum
- `time_of_day` (TEXT) - Speichert die Tageszeit

## Start-Datum festlegen

1. Als Spielleiter: Gehe zu "⚙️ Einstellungen"
2. Oben siehst du "📅 Start-Datum des Abenteuers"
3. Wähle:
   - **Jahr** (z.B. 1)
   - **Monat** (z.B. Frostglanz)
   - **Tag** (z.B. 1)
4. Klicke "Start-Datum speichern"

**Hinweis:** Das Start-Datum wird in der Datenbank gespeichert und gilt für die gesamte Gruppe.

## Tagebucheinträge erstellen

Beim Erstellen eines Eintrags:

1. **Titel** eingeben
2. **Tageszeit** auswählen:
   - Frühgischt
   - Aufgang
   - Früh
   - Mittag
   - Spät
   - Untergang
   - Gischt
   - Nacht
3. **Inhalt** eingeben
4. "Eintrag hinzufügen" klicken

**Automatisch:**
- Das Fantasie-Datum wird basierend auf dem Start-Datum berechnet
- Die Tageszeit wird gespeichert
- Monats-Info wird angezeigt
- Spezielle Events werden hervorgehoben

## Anzeige im Tagebuch

Jeder Eintrag zeigt:
- **Fantasie-Datum** mit Tageszeit (z.B. "Mittag, Prismentag, 15. Sonnenspiegel, Jahr 1")
- **Monats-Info** mit Bedeutung und Besonderheit
- **Spezielle Events** (z.B. "Die Nacht der tanzenden Lichter")
- Real-Datum als kleine Info

## Tageszeiten

- **Frühgischt** - Frühe Morgenstunden, Dunst liegt noch über der Stadt
- **Aufgang** - Sonnenaufgang, erste Lichtbrechungen
- **Früh** - Vormittag, klare Sicht
- **Mittag** - Höchster Sonnenstand
- **Spät** - Nachmittag
- **Untergang** - Sonnenuntergang, letzte Lichtbrechungen
- **Gischt** - Abend, Dunst wird dichter
- **Nacht** - Dunkle Stunden, Prismen-Sterne

## Spezielle Events

**Die Nacht der tanzenden Lichter**
- Datum: 15. Sonnenspiegel
- Wird automatisch hervorgehoben
- Beschreibung wird angezeigt

## Datenbank-Struktur

Das Start-Datum wird in `groups.settings` gespeichert:
```json
{
  "fantasyCalendar": {
    "startDate": {
      "year": 1,
      "month": 1,
      "day": 1
    },
    "realStartDate": "2024-01-01T00:00:00.000Z"
  }
}
```

Journal-Einträge enthalten:
- `fantasy_date`: `{ year, month, day, weekday }`
- `time_of_day`: `"Mittag"` (oder eine andere Tageszeit)

## Berechnung

Das Fantasie-Datum wird berechnet:
1. Tage seit realem Start-Datum zählen
2. Vom Fantasie-Start-Datum aus vorwärts/reückwärts gehen
3. Wochentag basierend auf absolutem Tag berechnen

**Beispiel:**
- Start: 1. Frostglanz, Jahr 1 (entspricht heute)
- Nach 5 Tagen: 6. Frostglanz, Jahr 1
- Nach 30 Tagen: 1. Tauwacht, Jahr 1











