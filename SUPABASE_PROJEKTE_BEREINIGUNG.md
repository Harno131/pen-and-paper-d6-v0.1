# 🧹 Supabase-Projekte bereinigen: Alte APIs entfernen

## 📋 Situation:

Du hast zwei Supabase-Projekte:
- **"Harno131's Projekt"** (alt) → Soll nicht mehr verwendet werden
- **"Fallcrest"** (neu) → Soll verwendet werden

## ✅ Was ich gefunden habe:

### Aktuelle Keys in `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=https://zwoiwfkzvxvcbfncztmx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_BjWODH2zrJQsyGB2Ip92pg_ydiQTv5P
SUPABASE_SERVICE_ROLE_KEY=sb_secret_X5pRh8bkBgdaooJSiyPQHg_NmevCRMC
```

**Diese Keys gehören zu:** `zwoiwfkzvxvcbfncztmx.supabase.co`

---

## 🔍 Schritt 1: Prüfe welches Projekt die aktuellen Keys hat

1. Gehe zu https://supabase.com
2. Öffne **"Harno131's Projekt"**:
   - Settings → API
   - Prüfe Project URL
3. Öffne **"Fallcrest"**:
   - Settings → API
   - Prüfe Project URL
4. **Frage:** Welches Projekt hat `zwoiwfkzvxvcbfncztmx.supabase.co`?

---

## 🔄 Schritt 2: Neue Keys aus "Fallcrest" holen

1. Öffne **"Fallcrest"** Projekt in Supabase
2. Gehe zu **Settings → API**
3. Kopiere alle drei Keys:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **Publishable key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **Secret key** → `SUPABASE_SERVICE_ROLE_KEY` (klicke auf 👁️)

---

## ✏️ Schritt 3: Keys aktualisieren

### Option A: Automatisch (empfohlen)

Führe das PowerShell-Skript aus:
```powershell
.\update-supabase-keys.ps1
```

Das Skript:
- ✅ Erstellt automatisch ein Backup
- ✅ Fragt nach den neuen Keys
- ✅ Aktualisiert `.env.local`

### Option B: Manuell

1. Öffne `.env.local` im Editor
2. Ersetze die drei Zeilen:

**Alt:**
```env
NEXT_PUBLIC_SUPABASE_URL=https://zwoiwfkzvxvcbfncztmx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_BjWODH2zrJQsyGB2Ip92pg_ydiQTv5P
SUPABASE_SERVICE_ROLE_KEY=sb_secret_X5pRh8bkBgdaooJSiyPQHg_NmevCRMC
```

**Neu (mit Fallcrest-Keys):**
```env
NEXT_PUBLIC_SUPABASE_URL=https://FALLCREST-PROJECT-URL.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_FALLCREST-KEY
SUPABASE_SERVICE_ROLE_KEY=sb_secret_FALLCREST-KEY
```

**Wichtig:** Ersetze `FALLCREST-PROJECT-URL` und `FALLCREST-KEY` mit den echten Werten!

---

## 🗑️ Schritt 4: Altes Projekt löschen (optional)

**Nur wenn du sicher bist, dass das alte Projekt nicht mehr gebraucht wird!**

1. Gehe zu https://supabase.com
2. Öffne **"Harno131's Projekt"**
3. Gehe zu **Settings → General**
4. Scrolle nach unten → **Delete Project**
5. Bestätige die Löschung

**⚠️ Achtung:** Alle Daten werden gelöscht!

**Alternative:** Einfach ignorieren (kostet nichts, wenn nicht verwendet)

---

## ✅ Schritt 5: Prüfen

1. Starte App neu:
   ```powershell
   npm run dev
   ```
2. Öffne Browser: http://localhost:3000
3. Prüfe Browser-Konsole (F12):
   - Sollte keine Supabase-Fehler zeigen
   - Sollte Verbindung zu "Fallcrest" herstellen

---

## 🔍 Schritt 6: Andere Stellen prüfen

### Vercel (falls deployed)

Falls du die App bereits auf Vercel deployed hast:

1. Gehe zu https://vercel.com/dashboard
2. Wähle dein Projekt
3. **Settings → Environment Variables**
4. Prüfe ob dort alte Keys sind
5. Aktualisiere:
   - `NEXT_PUBLIC_SUPABASE_URL` → Neue "Fallcrest" URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` → Neuer "Fallcrest" Key
   - `SUPABASE_SERVICE_ROLE_KEY` → Neuer "Fallcrest" Key
6. **Redeploy** (Vercel macht das automatisch)

---

## 📝 Checkliste:

- [ ] Prüfe welches Projekt die aktuellen Keys hat
- [ ] Hole neue Keys aus "Fallcrest" Projekt
- [ ] Aktualisiere `.env.local` (automatisch oder manuell)
- [ ] (Optional) Lösche altes Projekt
- [ ] Teste App (sollte funktionieren)
- [ ] Aktualisiere Vercel (falls deployed)

---

## 🆘 Falls Probleme:

**Problem:** App zeigt Fehler nach Key-Austausch

**Lösung:**
1. Prüfe ob Keys korrekt kopiert wurden (keine Leerzeichen!)
2. Prüfe ob "Fallcrest" Projekt aktiv ist
3. Prüfe ob Datenbank-Schema in "Fallcrest" eingerichtet ist
   - Gehe zu SQL Editor
   - Führe `supabase/migrations/001_initial_schema.sql` aus
4. Starte App neu: `npm run dev`

**Problem:** Altes Projekt kann nicht gelöscht werden

**Lösung:**
- Das ist OK! Du kannst es einfach ignorieren
- Wichtig ist nur, dass die App die neuen "Fallcrest" Keys verwendet
