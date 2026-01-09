# Datei-basierte Speicherung - Zusammenfassung

## ✅ Was wurde umgesetzt

### 1. Datenordner erstellt
- **Pfad**: `C:\DEV\PenAndPaperD6\PenAndPaperD6_Data`
- **Struktur**:
  ```
  PenAndPaperD6_Data/
  ├── groups/
  │   └── {groupId}/
  │       ├── tagebuch.json
  │       ├── monster.json
  │       ├── spielerCharaktere.json
  │       └── nichtSpielerCharactere.json
  └── README.md
  ```

### 2. API-Routen erstellt
- `GET /api/file-storage/characters?groupId={groupId}` - Lade Charaktere
- `POST /api/file-storage/characters` - Speichere Charaktere
- `GET /api/file-storage/journal?groupId={groupId}` - Lade Journal-Einträge
- `POST /api/file-storage/journal` - Speichere Journal-Einträge

### 3. Datei-Storage-Service
- `lib/file-storage.ts` - Client-seitige Funktionen für API-Zugriff
- Automatische Trennung nach Typ:
  - **Spieler-Charaktere**: `isNPC: false`
  - **NPCs**: `isNPC: true, npcType != 'monster'`
  - **Monster**: `isNPC: true, npcType === 'monster'`

### 4. Integration in lib/data.ts
- `getCharactersAsync()` - Lädt zuerst aus Dateien, dann Supabase, dann localStorage
- `saveCharacterAsync()` - Speichert in Dateien, Supabase und localStorage
- `getJournalEntries()` - Lädt zuerst aus Dateien, dann Supabase, dann localStorage
- `saveJournalEntry()` - Speichert in Dateien, Supabase und localStorage

## 🔧 Aktivierung

### Option 1: Über localStorage (Client-seitig)
```javascript
localStorage.setItem('useFileStorage', 'true')
```

### Option 2: Über Umgebungsvariable (Server-seitig)
Erstelle `.env.local`:
```env
PENANDPAPER_DATA_PATH=C:\DEV\PenAndPaperD6\PenAndPaperD6_Data
```

## 📊 Datenfluss

```
App (Client)
    ↓
lib/data.ts
    ↓
lib/file-storage.ts (prüft useFileStorage)
    ↓
API-Route (/api/file-storage/*)
    ↓
Dateisystem (C:\DEV\PenAndPaperD6\PenAndPaperD6_Data)
```

## 🎯 Vorteile

- ✅ **Lokale Kontrolle**: Daten sind auf deinem Rechner
- ✅ **Einfache Sicherung**: Einfach den Ordner kopieren
- ✅ **Keine externe Abhängigkeit**: Funktioniert ohne Supabase
- ✅ **Einfacher Export/Import**: JSON-Dateien können manuell bearbeitet werden
- ✅ **Vollständig getrennt**: Eigener Ordner im Projekt-Verzeichnis, keine Überschneidungen mit GeoLogApp

## ⚠️ Wichtig

- **Nur lokal**: Keine Synchronisation zwischen Geräten
- **Server muss laufen**: Für Zugriff auf Dateien
- **Keine Echtzeit-Updates**: Änderungen werden nicht automatisch synchronisiert
- **Vollständig getrennt**: Die beiden Apps haben nichts miteinander zu tun, Daten liegen in separaten Verzeichnissen

## 📝 Nächste Schritte

1. **Testen**: App starten und Datei-Storage aktivieren
2. **Gruppe erstellen**: Daten sollten in Dateien gespeichert werden
3. **Dateien prüfen**: Im Ordner `C:\DEV\PenAndPaperD6\PenAndPaperD6_Data\groups\{groupId}\` sollten JSON-Dateien erscheinen

## 🔍 Analyse GeoLogApp

Die GeoLogApp verwendet:
- **SQLite** für lokale Datenbank
- **Google Sheets** für Cloud-Synchronisation
- **Flutter** als Framework

Die PenAndPaperD6-App verwendet:
- **JSON-Dateien** für lokale Speicherung
- **Next.js API-Routen** für Dateisystem-Zugriff
- **Optional Supabase** für Cloud-Synchronisation

**Beide Apps sind vollständig unabhängig voneinander!**

