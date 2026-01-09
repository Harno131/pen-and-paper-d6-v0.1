# 🔗 Vercel mit GitHub verbinden

## ✅ Repository-Name aktualisiert:

**Neuer Name:** `pen-and-paper-d6-v0.1`  
**URL:** https://github.com/Harno131/pen-and-paper-d6-v0.1.git

---

## 📋 In Vercel verbinden:

### Schritt 1: Projekt hinzufügen

1. Gehe zu https://vercel.com/dashboard
2. Klicke "Add New" → "Project"
3. Wähle dein GitHub Repository: `Harno131/pen-and-paper-d6-v0.1`
4. **WICHTIG:** Wähle Branch `main` (nicht `master`)
5. Klicke "Deploy"

---

### Schritt 2: Vercel-Einstellungen prüfen

Vercel sollte automatisch erkennen:
- **Framework Preset:** Next.js
- **Root Directory:** `./` (Standard)
- **Build Command:** `npm run build` (Standard)
- **Output Directory:** `.next` (Standard)
- **Install Command:** `npm install` (Standard)

**Falls nicht automatisch erkannt:**
- Framework Preset: **Next.js** auswählen
- Rest auf Standard lassen

---

### Schritt 3: Umgebungsvariablen eintragen ⚠️ WICHTIG!

**Nach dem ersten Deploy:**

1. Gehe zu deinem Projekt in Vercel Dashboard
2. Klicke **Settings** → **Environment Variables**
3. Füge hinzu (klicke "Add New" für jede):

   **Variable 1:**
   - Name: `NEXT_PUBLIC_SUPABASE_URL`
   - Value: `https://vggbyiknwmxeyoglmfdt.supabase.co`
   - Environment: ✅ Production, ✅ Preview, ✅ Development
   - Klicke "Save"

   **Variable 2:**
   - Name: `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - Value: `sb_publishable_dtCyr3ZRSamoBLK-zPqiMg_OJ9TKVXH`
   - Environment: ✅ Production, ✅ Preview, ✅ Development
   - Klicke "Save"

   **Variable 3:**
   - Name: `SUPABASE_SERVICE_ROLE_KEY`
   - Value: (dein Service Role Key aus Supabase)
     - Gehe zu: https://supabase.com/dashboard/project/vggbyiknwmxeyoglmfdt/settings/api
     - Kopiere den "service_role" Key (Secret key - beginnt mit `eyJ...`)
   - Environment: ✅ Production, ✅ Preview, ✅ Development
   - Klicke "Save"

4. **Redeploy:**
   - Gehe zu "Deployments"
   - Klicke auf die drei Punkte (⋯) beim letzten Deployment
   - Klicke "Redeploy"

---

## ✅ Prüfen ob es funktioniert:

Nach dem Redeploy:
1. Öffne deine Vercel-URL (z.B. `https://pen-and-paper-d6-v0-1.vercel.app`)
2. Prüfe Browser-Konsole (F12)
3. Sollte keine Supabase-Fehler zeigen
4. Startbildschirm sollte zwei Knöpfe zeigen: "Spielleiter" / "Spieler"

---

## 🆘 Falls Fehler auftreten:

**Build-Fehler:**
- Prüfe ob alle Dateien committed wurden: `git status`
- Prüfe ob Code gepusht wurde: `git log --oneline`

**Supabase-Fehler:**
- Prüfe ob alle 3 Umgebungsvariablen eingetragen sind
- Prüfe ob Redeploy ausgeführt wurde
- Prüfe Browser-Konsole für genaue Fehlermeldung

**Repository nicht gefunden:**
- Prüfe ob Repository-Name korrekt ist: `pen-and-paper-d6-v0.1`
- Prüfe ob Repository auf GitHub sichtbar ist
