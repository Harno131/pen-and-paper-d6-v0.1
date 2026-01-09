# 🚀 Git Setup für Vercel - Schnell-Anleitung

## ❌ Problem:
Vercel sagt: "Repository does not contain the requested branch or commit"

**Ursache:** Es gibt noch kein Git-Repository oder Code wurde nicht zu GitHub gepusht.

---

## ✅ Lösung (5 Minuten):

### Schritt 1: Git initialisieren

```powershell
git init
```

### Schritt 2: Code committen

```powershell
git add .
git commit -m "Initial commit - Rollenspiel-App"
```

### Schritt 3: GitHub Repository erstellen

1. Gehe zu https://github.com/new
2. Repository-Name: `PenAndPaperD6` (oder wie du willst)
3. **WICHTIG:** Lass es **LEER** (keine README, keine .gitignore, keine License)
4. Klicke "Create repository"

### Schritt 4: Code zu GitHub pushen

```powershell
# Ersetze DEIN-USERNAME mit deinem GitHub-Username
git remote add origin https://github.com/DEIN-USERNAME/PenAndPaperD6.git
git branch -M main
git push -u origin main
```

**Falls du noch nicht eingeloggt bist:**
```powershell
git config --global user.name "Dein Name"
git config --global user.email "deine@email.com"
```

---

## 🔐 Umgebungsvariablen in Vercel eintragen:

### **JA, du musst die env-Variablen in Vercel eintragen!**

`.env.local` wird **NICHT** zu GitHub gepusht (ist in `.gitignore`).

**Nach dem ersten Deploy:**

1. Gehe zu https://vercel.com/dashboard
2. Wähle dein Projekt
3. Klicke **Settings** → **Environment Variables**
4. Füge hinzu (klicke "Add New"):
   
   **Variable 1:**
   - Name: `NEXT_PUBLIC_SUPABASE_URL`
   - Value: `https://vggbyiknwmxeyoglmfdt.supabase.co`
   - Environment: ✅ Production, ✅ Preview, ✅ Development
   
   **Variable 2:**
   - Name: `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - Value: `sb_publishable_dtCyr3ZRSamoBLK-zPqiMg_OJ9TKVXH`
   - Environment: ✅ Production, ✅ Preview, ✅ Development
   
   **Variable 3:**
   - Name: `SUPABASE_SERVICE_ROLE_KEY`
   - Value: (dein Service Role Key aus Supabase Dashboard)
   - Environment: ✅ Production, ✅ Preview, ✅ Development

5. Klicke "Save" bei jeder Variable

6. **Redeploy:**
   - Gehe zu "Deployments"
   - Klicke auf die drei Punkte (⋯) beim letzten Deployment
   - Klicke "Redeploy"

---

## ✅ Prüfen ob es funktioniert:

Nach dem Redeploy:
1. Öffne deine Vercel-URL (z.B. `https://deine-app.vercel.app`)
2. Prüfe Browser-Konsole (F12)
3. Sollte keine Supabase-Fehler zeigen

---

## 📝 Zusammenfassung:

1. ✅ Git initialisieren: `git init`
2. ✅ Code committen: `git add .` + `git commit`
3. ✅ GitHub Repository erstellen (leer)
4. ✅ Code pushen: `git push -u origin main`
5. ✅ In Vercel verbinden (Branch `main` wählen)
6. ✅ **Umgebungsvariablen in Vercel eintragen** (wichtig!)
7. ✅ Redeploy ausführen

**Die env-Variablen müssen in Vercel eingetragen werden, da `.env.local` nicht ins Repository kommt!**
