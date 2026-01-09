# 🚀 Nächste Schritte: GitHub Repository erstellen und pushen

## ✅ Was ich bereits gemacht habe:

1. ✅ Git Repository initialisiert
2. ✅ Code committed
3. ✅ Branch auf `main` umbenannt

---

## 📋 Was du noch machen musst:

### Schritt 1: GitHub Repository erstellen (2 Minuten)

1. Gehe zu https://github.com/new
2. Repository-Name: `PenAndPaperD6` (oder wie du willst)
3. **WICHTIG:** 
   - ✅ Lass es **PRIVAT** (wenn du willst)
   - ❌ **KEINE** README hinzufügen
   - ❌ **KEINE** .gitignore hinzufügen
   - ❌ **KEINE** License hinzufügen
   - **Lass es komplett LEER!**
4. Klicke "Create repository"

---

### Schritt 2: Code zu GitHub pushen

**GitHub zeigt dir dann Befehle an, aber hier sind sie:**

```powershell
# Ersetze DEIN-USERNAME mit deinem GitHub-Username
git remote add origin https://github.com/DEIN-USERNAME/PenAndPaperD6.git
git push -u origin main
```

**Falls du noch nicht eingeloggt bist:**
```powershell
git config --global user.name "Dein Name"
git config --global user.email "deine@email.com"
```

---

### Schritt 3: In Vercel verbinden

1. Gehe zu https://vercel.com/dashboard
2. Klicke "Add New" → "Project"
3. Wähle dein GitHub Repository (`PenAndPaperD6`)
4. **WICHTIG:** Wähle Branch `main` (nicht `master`)
5. Klicke "Deploy"

---

### Schritt 4: Umgebungsvariablen in Vercel eintragen

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
   - Value: (dein Service Role Key aus Supabase Dashboard - Settings → API → Secret key)
   - Environment: ✅ Production, ✅ Preview, ✅ Development
   - Klicke "Save"

4. **Redeploy:**
   - Gehe zu "Deployments"
   - Klicke auf die drei Punkte (⋯) beim letzten Deployment
   - Klicke "Redeploy"

---

## ✅ Prüfen ob es funktioniert:

Nach dem Redeploy:
1. Öffne deine Vercel-URL (z.B. `https://deine-app.vercel.app`)
2. Prüfe Browser-Konsole (F12)
3. Sollte keine Supabase-Fehler zeigen
4. Startbildschirm sollte zwei Knöpfe zeigen: "Spielleiter" / "Spieler"

---

## 📝 Zusammenfassung:

- ✅ Git initialisiert und committed (erledigt)
- ⏳ GitHub Repository erstellen (du musst machen)
- ⏳ Code zu GitHub pushen (du musst machen)
- ⏳ In Vercel verbinden (du musst machen)
- ⏳ Umgebungsvariablen eintragen (du musst machen)
- ⏳ Redeploy (du musst machen)

**Die env-Variablen sind wichtig - ohne sie funktioniert Supabase nicht!**
