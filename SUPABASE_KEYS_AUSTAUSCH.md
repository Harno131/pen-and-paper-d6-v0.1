# 🔄 Supabase-Keys austauschen: Altes Projekt entfernen

## 📋 Aktuelle Situation:

Du hast zwei Supabase-Projekte:
1. **"Harno131's Projekt"** (alt) → Soll gelöscht/entfernt werden
2. **"Fallcrest"** (neu) → Soll verwendet werden

## ✅ Aktuelle Keys in .env.local:

```
NEXT_PUBLIC_SUPABASE_URL=https://zwoiwfkzvxvcbfncztmx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_BjWODH2zrJQsyGB2Ip92pg_ydiQTv5P
SUPABASE_SERVICE_ROLE_KEY=sb_secret_X5pRh8bkBgdaooJSiyPQHg_NmevCRMC
```

**Diese Keys gehören zu:** `zwoiwfkzvxvcbfncztmx.supabase.co`

---

## 🔍 Schritt 1: Prüfe welches Projekt die aktuellen Keys sind

1. Gehe zu https://supabase.com
2. Öffne beide Projekte:
   - "Harno131's Projekt"
   - "Fallcrest"
3. In jedem Projekt: Gehe zu **Settings → API**
4. Vergleiche die **Project URL**:
   - Welches Projekt hat `https://zwoiwfkzvxvcbfncztmx.supabase.co`?

---

## 🔄 Schritt 2: Neue Keys aus "Fallcrest" holen

1. Öffne das **"Fallcrest"** Projekt in Supabase
2. Gehe zu **Settings → API**
3. Kopiere:
   - **Project URL** (z.B. `https://xxxxx.supabase.co`)
   - **Publishable key** (beginnt mit `sb_publishable_`)
   - **Secret key** (beginnt mit `sb_secret_`, klicke auf 👁️ um zu sehen)

---

## ✏️ Schritt 3: .env.local aktualisieren

Ersetze die alten Keys durch die neuen "Fallcrest" Keys:

```env
NEXT_PUBLIC_SUPABASE_URL=https://FALLCREST-PROJECT-URL.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_FALLCREST-KEY
SUPABASE_SERVICE_ROLE_KEY=sb_secret_FALLCREST-KEY
```

**Wichtig:** Ersetze `FALLCREST-PROJECT-URL`, `FALLCREST-KEY` mit den echten Werten!

---

## 🗑️ Schritt 4: Altes Projekt löschen (optional)

**WICHTIG:** Nur wenn du sicher bist, dass das alte Projekt nicht mehr gebraucht wird!

1. Gehe zu https://supabase.com
2. Öffne "Harno131's Projekt"
3. Gehe zu **Settings → General**
4. Scrolle nach unten → **Delete Project**
5. Bestätige die Löschung

**⚠️ Achtung:** Alle Daten im alten Projekt werden gelöscht!

---

## ✅ Schritt 5: Prüfen ob es funktioniert

1. Starte die App neu:
   ```powershell
   npm run dev
   ```
2. Öffne die App im Browser
3. Prüfe Browser-Konsole (F12):
   - Sollte keine Supabase-Fehler zeigen
   - Sollte Verbindung zu "Fallcrest" Projekt herstellen

---

## 🔍 Schritt 6: Andere Stellen prüfen

### Vercel (falls bereits deployed)

Falls du die App bereits auf Vercel deployed hast:

1. Gehe zu https://vercel.com/dashboard
2. Wähle dein Projekt
3. Gehe zu **Settings → Environment Variables**
4. Prüfe ob dort alte Keys sind
5. Aktualisiere die Keys:
   - `NEXT_PUBLIC_SUPABASE_URL` → Neue "Fallcrest" URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` → Neuer "Fallcrest" Key
   - `SUPABASE_SERVICE_ROLE_KEY` → Neuer "Fallcrest" Key
6. **Redeploy** die App (Vercel macht das automatisch)

---

## 📝 Zusammenfassung:

1. ✅ Prüfe welches Projekt die aktuellen Keys hat
2. ✅ Hole neue Keys aus "Fallcrest" Projekt
3. ✅ Aktualisiere `.env.local` mit neuen Keys
4. ✅ (Optional) Lösche altes Projekt
5. ✅ Prüfe ob App funktioniert
6. ✅ Aktualisiere Vercel (falls deployed)

---

## 🆘 Falls Probleme:

**Problem:** App zeigt Fehler nach Key-Austausch

**Lösung:**
1. Prüfe ob Keys korrekt kopiert wurden (keine Leerzeichen!)
2. Prüfe ob "Fallcrest" Projekt aktiv ist
3. Prüfe ob Datenbank-Schema in "Fallcrest" eingerichtet ist
4. Starte App neu: `npm run dev`

**Problem:** Altes Projekt kann nicht gelöscht werden

**Lösung:**
- Das ist OK! Du kannst es einfach ignorieren
- Wichtig ist nur, dass die App die neuen "Fallcrest" Keys verwendet
