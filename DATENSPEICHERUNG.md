# Datenspeicherung und Handy-Zugriff

## Aktuelle Datenspeicherung

### ❗ WICHTIG: localStorage (nur lokal im Browser)

Die App verwendet aktuell **localStorage** zum Speichern der Daten. Das bedeutet:

- ✅ **Vorteile:**
  - Funktioniert sofort ohne Server
  - Keine Anmeldung nötig
  - Schnell und einfach

- ❌ **Nachteile:**
  - Daten sind **nur im Browser** gespeichert
  - Wenn Browser-Cache gelöscht wird → **alle Daten weg**
  - **Nicht synchronisiert** zwischen Geräten
  - **Nicht geteilt** zwischen Spielern
  - Jeder Spieler hat seine eigenen Daten

### Wo werden Daten gespeichert?

Die Daten werden im **Browser localStorage** gespeichert:
- `characters` - Alle Charaktere
- `deletedCharacters` - Gelöschte Charaktere
- `journalEntries` - Gruppentagebuch
- `sharedImages` - Geteilte Bilder
- `diceRolls` - Würfelwürfe
- `availableSkills` - Fertigkeiten-Liste
- `characterCreationSettings` - Einstellungen

### Warum verschwinden Charaktere?

Charaktere können verschwinden, wenn:
1. Browser-Cache gelöscht wird
2. Im Inkognito-Modus gespielt wird
3. Browser-Daten manuell gelöscht werden
4. Ein anderer Browser verwendet wird

## Lösung: App auf Handy bekommen

### Option 1: Lokales Netzwerk (Einfachste Lösung)

1. **PC/Server starten:**
   ```bash
   npm run dev
   ```
   Die App läuft auf: `http://localhost:3000`

2. **IP-Adresse finden:**
   - Windows: `ipconfig` → IPv4-Adresse (z.B. `192.168.1.100`)
   - Mac/Linux: `ifconfig` oder `ip addr`

3. **Server für Netzwerk öffnen:**
   ```bash
   npm run dev -- -H 0.0.0.0
   ```
   Oder in `package.json` ändern:
   ```json
   "dev": "next dev -H 0.0.0.0"
   ```

4. **Auf Handy öffnen:**
   - Handy und PC müssen im **gleichen WLAN** sein
   - Im Browser öffnen: `http://192.168.1.100:3000`
   - (IP-Adresse durch deine ersetzen)

**⚠️ Problem:** Jeder Spieler hat immer noch seine eigenen Daten (localStorage)

### Option 2: Online-Hosting (Empfohlen für echte Gruppen)

Für eine **echte Gruppen-Lösung** brauchst du:

1. **Hosting-Service:**
   - Vercel (kostenlos, einfach) - https://vercel.com
   - Netlify (kostenlos) - https://netlify.com
   - Railway (kostenlos) - https://railway.app

2. **Datenbank hinzufügen:**
   - Supabase (kostenlos) - https://supabase.com
   - Firebase (kostenlos) - https://firebase.google.com
   - MongoDB Atlas (kostenlos) - https://www.mongodb.com/cloud/atlas

3. **Code anpassen:**
   - localStorage durch Datenbank-API ersetzen
   - Authentifizierung hinzufügen
   - Gruppen-System implementieren

### Option 3: PWA (Progressive Web App)

Die App kann als PWA installiert werden:

1. **PWA-Funktionen hinzufügen:**
   - `manifest.json` erstellen
   - Service Worker für Offline-Funktionalität
   - Installierbar auf Handy

2. **Aber:** Daten bleiben lokal (localStorage)

## Empfohlene Lösung für Gruppen

### Kurzfristig (für Tests):
- Lokales Netzwerk verwenden (Option 1)
- Jeder Spieler erstellt seine Charaktere lokal
- Spielleiter kann alle sehen (wenn auf demselben Gerät)

### Langfristig (für echte Sessions):
1. **App auf Vercel deployen** (kostenlos)
2. **Supabase als Datenbank** hinzufügen (kostenlos)
3. **Gruppen-System implementieren:**
   - Spielleiter erstellt Gruppe
   - Spieler treten mit Code bei
   - Alle Daten in gemeinsamer Datenbank

## Nächste Schritte

Soll ich:
1. ✅ Die App für lokales Netzwerk konfigurieren?
2. ✅ PWA-Funktionen hinzufügen?
3. ✅ Eine Datenbank-Integration vorbereiten?
4. ✅ Ein Gruppen-System implementieren?













