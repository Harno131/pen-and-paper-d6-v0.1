# 🔧 Vercel Deploy-Fehler beheben

## ❌ Fehler: "Repository does not contain the requested branch or commit"

### Ursache:
- Repository ist leer (keine Commits)
- Branch existiert nicht
- Code wurde nicht zu GitHub gepusht

---

## ✅ Lösung Schritt für Schritt:

### Schritt 1: Prüfe Git-Status

```powershell
git status
```

**Falls "not a git repository":**
```powershell
git init
```

---

### Schritt 2: Code committen

```powershell
git add .
git commit -m "Initial commit - Rollenspiel-App"
```

---

### Schritt 3: GitHub Repository erstellen (falls noch nicht)

1. Gehe zu https://github.com/new
2. Repository-Name: z.B. `PenAndPaperD6`
3. **WICHTIG:** Lass es **LEER** (keine README, keine .gitignore)
4. Klicke "Create repository"

---

### Schritt 4: Code zu GitHub pushen

```powershell
# Ersetze DEIN-USERNAME mit deinem GitHub-Username
git remote add origin https://github.com/DEIN-USERNAME/PenAndPaperD6.git
git branch -M main
git push -u origin main
```

**Falls Fehler:** Prüfe ob du eingeloggt bist:
```powershell
git config --global user.name "Dein Name"
git config --global user.email "deine@email.com"
```

---

### Schritt 5: In Vercel verbinden

1. Gehe zu https://vercel.com/dashboard
2. Klicke "Add New" → "Project"
3. Wähle dein GitHub Repository
4. **WICHTIG:** Wähle Branch `main` (nicht `master`)
5. Klicke "Deploy"

---

## 🔐 Umgebungsvariablen in Vercel eintragen:

### WICHTIG: Ja, du musst die env-Variablen in Vercel eintragen!

**Nach dem ersten Deploy:**

1. Gehe zu deinem Projekt in Vercel Dashboard
2. Klicke auf **Settings** → **Environment Variables**
3. Füge hinzu:
   - `NEXT_PUBLIC_SUPABASE_URL` = `https://vggbyiknwmxeyoglmfdt.supabase.co`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = `sb_publishable_dtCyr3ZRSamoBLK-zPqiMg_OJ9TKVXH`
   - `SUPABASE_SERVICE_ROLE_KEY` = (dein Service Role Key aus Supabase)

4. **WICHTIG:** Wähle für alle drei:
   - ✅ Production
   - ✅ Preview
   - ✅ Development

5. Klicke "Save"

6. **Redeploy:** Gehe zu "Deployments" → Klicke auf die drei Punkte → "Redeploy"

---

## 📋 Checkliste:

- [ ] Git Repository initialisiert (`git init`)
- [ ] Code committed (`git commit`)
- [ ] GitHub Repository erstellt (leer)
- [ ] Code zu GitHub gepusht (`git push`)
- [ ] In Vercel verbunden (Branch `main` gewählt)
- [ ] Umgebungsvariablen in Vercel eingetragen
- [ ] Redeploy ausgeführt

---

## 🆘 Falls es immer noch nicht funktioniert:

**Problem:** "Repository is empty"

**Lösung:**
1. Prüfe ob Code committed wurde: `git log`
2. Prüfe ob Code gepusht wurde: `git push -u origin main`
3. Prüfe auf GitHub: Siehst du deine Dateien?

**Problem:** "Branch not found"

**Lösung:**
1. Prüfe Branch-Name: `git branch`
2. In Vercel: Wähle den richtigen Branch (meist `main`, nicht `master`)

---

## 💡 Schnell-Check:

```powershell
# Prüfe ob alles OK ist:
git status          # Sollte "nothing to commit" zeigen
git branch          # Sollte "main" oder "master" zeigen
git remote -v       # Sollte GitHub-URL zeigen
git log --oneline   # Sollte Commits zeigen
```
