# Datei-basierte Speicherung - Setup

## Übersicht

Die PenAndPaperD6-App kann Daten jetzt **datei-basiert** im GeoLogApp-Verzeichnis speichern. Dies ist eine Alternative zu Supabase und localStorage.

## Datenstruktur

Alle Daten werden im Ordner `C:\DEV\PenAndPaperD6\PenAndPaperD6_Data` gespeichert:

```
PenAndPaperD6_Data/
├── groups/                    # Gruppen-Daten (pro Gruppe ein Ordner)
│   └── {groupId}/
│       ├── tagebuch.json      # Journal-Einträge
│       ├── monster.json       # Alle Monster (isNPC: true, npcType: 'monster')
│       ├── spielerCharaktere.json  # Spieler-Charaktere (isNPC: false)
│       └── nichtSpielerCharactere.json  # NPCs (isNPC: true, npcType != 'monster')
└── README.md
```

## Aktivierung

### Option 1: Über Umgebungsvariable

Erstelle eine `.env.local` Datei im Projekt-Root:

```env
PENANDPAPER_DATA_PATH=C:\DEV\PenAndPaperD6\PenAndPaperD6_Data
```

### Option 2: Über localStorage (Client-seitig)

In der App kannst du Datei-Storage aktivieren:

```javascript
localStorage.setItem('useFileStorage', 'true')
```

## API-Routen

Die App verwendet API-Routen für den Dateisystem-Zugriff:

- `GET /api/file-storage/characters?groupId={groupId}` - Lade Charaktere
- `POST /api/file-storage/characters` - Speichere Charaktere
- `GET /api/file-storage/journal?groupId={groupId}` - Lade Journal-Einträge
- `POST /api/file-storage/journal` - Speichere Journal-Einträge

## Integration in lib/data.ts

Die Datei-Storage-Funktionen können in `lib/data.ts` integriert werden:

```typescript
import { loadCharactersFromFile, saveCharactersToFile } from '@/lib/file-storage'

// In getCharactersAsync():
if (isFileStorageEnabled()) {
  const fileChars = await loadCharactersFromFile(groupId)
  if (fileChars.length > 0) {
    return fileChars
  }
}
```

## Vorteile

- ✅ **Lokale Kontrolle**: Daten sind auf deinem Rechner
- ✅ **Einfache Sicherung**: Einfach den Ordner kopieren
- ✅ **Keine externe Abhängigkeit**: Funktioniert ohne Supabase
- ✅ **Einfacher Export/Import**: JSON-Dateien können manuell bearbeitet werden

## Nachteile

- ❌ **Nur lokal**: Keine Synchronisation zwischen Geräten
- ❌ **Nur im Netzwerk**: Server muss laufen für Zugriff
- ❌ **Keine Echtzeit-Updates**: Änderungen werden nicht automatisch synchronisiert

## Verwendung

1. **Aktiviere Datei-Storage** (siehe oben)
2. **Erstelle eine Gruppe** in der App
3. **Daten werden automatisch** in die Dateien geschrieben
4. **Dateien können manuell** bearbeitet/gesichert werden

## Wichtig

- Dieser Ordner liegt **im eigenen Projekt-Verzeichnis** (vollständig getrennt von GeoLogApp)
- Die beiden Apps haben **nichts miteinander zu tun**
- Daten werden **nur lokal** gespeichert (keine Cloud-Synchronisation)

