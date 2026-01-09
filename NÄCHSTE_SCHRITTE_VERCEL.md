# 🚀 Nächste Schritte: Vercel verbinden

**Status:** ✅ GitHub Repository erstellt und Code gepusht

---

## 🎯 Jetzt: Vercel verbinden (5 Minuten)

### Schritt 1: In Vercel verbinden (2 Min)

1. **Gehe zu:** https://vercel.com/dashboard
   - Falls du noch keinen Account hast: Klicke "Sign Up" (kostenlos)

2. **Klicke:** "Add New" → "Project"

3. **Import Git Repository:**
   - Du siehst eine Liste deiner GitHub-Repositories
   - **Wähle:** `Harno131/pen-and-paper-d6-v0.1`
   - Falls nicht sichtbar: Klicke "Adjust GitHub App Permissions" und erlaube Zugriff

4. **Konfiguration:**
   - **Framework Preset:** Next.js (sollte automatisch erkannt werden)
   - **Root Directory:** `./` (Standard - lass es so)
   - **Build Command:** `npm run build` (Standard - lass es so)
   - **Output Directory:** `.next` (Standard - lass es so)
   - **Install Command:** `npm install` (Standard - lass es so)

5. **Klicke:** "Deploy" (blauer Button)

6. **Warte:** Vercel baut jetzt deine App (dauert 2-3 Minuten)

---

### Schritt 2: Umgebungsvariablen eintragen (3 Min) ⚠️ WICHTIG!

**Nach dem ersten Deploy (wenn "Building" fertig ist):**

1. **Gehe zu:** Dein Projekt in Vercel Dashboard

2. **Klicke:** "Settings" (oben in der Navigation)

3. **Klicke:** "Environment Variables" (links im Menü)

4. **Füge 3 Variablen hinzu** (für jede "Add New" klicken):

   **Variable 1:**
   - **Name:** `NEXT_PUBLIC_SUPABASE_URL`
   - **Value:** `https://vggbyiknwmxeyoglmfdt.supabase.co`
   - **Environment:** ✅ Production, ✅ Preview, ✅ Development
   - **Klicke:** "Save"

   **Variable 2:**
   - **Name:** `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **Value:** `sb_publishable_dtCyr3ZRSamoBLK-zPqiMg_OJ9TKVXH`
   - **Environment:** ✅ Production, ✅ Preview, ✅ Development
   - **Klicke:** "Save"

   **Variable 3:**
   - **Name:** `SUPABASE_SERVICE_ROLE_KEY`
   - **Value:** (dein Service Role Key aus Supabase)
     - **Wo findest du ihn?**
     - Gehe zu: https://supabase.com/dashboard/project/vggbyiknwmxeyoglmfdt/settings/api
     - Scrolle zu "Project API keys"
     - Kopiere den **"service_role"** Key (Secret key - beginnt mit `eyJ...`)
   - **Environment:** ✅ Production, ✅ Preview, ✅ Development
   - **Klicke:** "Save"

5. **Redeploy ausführen:**
   - Gehe zu: "Deployments" (oben in der Navigation)
   - Klicke auf die **drei Punkte (⋯)** beim letzten Deployment
   - Klicke: "Redeploy"
   - **WICHTIG:** Aktiviere **NICHT** "Use existing Build Cache"
   - Klicke: "Redeploy"

---

### Schritt 3: Prüfen ob es funktioniert (2 Min)

**Nach dem Redeploy:**

1. **Öffne deine App:**
   - Vercel zeigt dir eine URL (z.B. `https://pen-and-paper-d6-v0-1.vercel.app`)
   - Klicke darauf oder kopiere die URL

2. **Debug-Seite aufrufen:**
   - Gehe zu: `https://deine-app.vercel.app/debug`
   - Prüfe ob:
     - ✅ Umgebungsvariablen gesetzt sind
     - ✅ Supabase-Verbindung funktioniert
     - ✅ Keine Fehler angezeigt werden

3. **Startbildschirm testen:**
   - Gehe zu: `https://deine-app.vercel.app`
   - Du solltest sehen:
     - ✅ Zwei Knöpfe: "Spielleiter" / "Spieler"
     - ✅ Keine Fehler in der Browser-Konsole (F12)

---

## 🆘 Falls Probleme auftreten:

### Problem: "404 not found"

**Lösung:**
1. Prüfe Debug-Seite: `/debug`
2. Prüfe ob Umgebungsvariablen eingetragen sind
3. Prüfe Vercel-Logs (Deployments → Runtime Logs)

**Siehe auch:** `404_FEHLER_BEHEBEN.md`

---

### Problem: "Supabase-Fehler"

**Lösung:**
1. Prüfe ob alle 3 Umgebungsvariablen eingetragen sind
2. Prüfe ob Keys korrekt sind
3. Prüfe ob Supabase-Tabellen existieren (siehe nächster Schritt)

---

## 📋 Checkliste:

- [ ] Vercel Account erstellt/eingeloggt
- [ ] Projekt in Vercel erstellt
- [ ] Erster Deploy erfolgreich
- [ ] 3 Umgebungsvariablen eingetragen
- [ ] Redeploy ausgeführt
- [ ] Debug-Seite funktioniert (`/debug`)
- [ ] Startbildschirm funktioniert

---

## ✅ Nach Vercel-Setup:

**Dann noch zu prüfen:**
1. Supabase-Tabellen (falls noch nicht erstellt)
2. RLS-Policies (falls noch nicht erstellt)

**Siehe:** `STATUS_ÜBERSICHT.md` für vollständige Checkliste

---

## 💡 Tipp:

**Falls du Hilfe brauchst:**
- Prüfe Debug-Seite: `/debug`
- Prüfe Vercel-Logs
- Siehe `404_FEHLER_BEHEBEN.md` für häufige Probleme
