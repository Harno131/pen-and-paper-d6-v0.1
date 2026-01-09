# 📚 GitHub für Anfänger - Einfach erklärt

## 🤔 Was ist GitHub?

**GitHub** ist wie ein "Cloud-Speicher" für deinen Code.

- ✅ Du speicherst deinen Code online
- ✅ Andere können ihn sehen (wenn du willst)
- ✅ Vercel kann den Code automatisch von GitHub holen
- ✅ Du kannst Änderungen verfolgen

**Vergleich:**
- **Git** = Lokales Versionskontrollsystem (auf deinem PC)
- **GitHub** = Online-Plattform, wo du deinen Code speicherst
- **Repository** = Ein "Ordner" für dein Projekt auf GitHub

---

## 🎯 Warum brauchen wir GitHub?

**Vercel** (wo deine App läuft) braucht den Code von **GitHub**:
1. Du lädst Code zu GitHub hoch
2. Vercel holt Code von GitHub
3. Vercel baut und startet deine App

**Ohne GitHub → Vercel kann nicht deployen!**

---

## 📋 Schritt-für-Schritt: GitHub Repository erstellen

### Schritt 1: GitHub-Account erstellen (falls noch nicht)

1. Gehe zu https://github.com/signup
2. Gib deine E-Mail-Adresse ein
3. Wähle einen Benutzernamen (z.B. `Harno131`)
4. Wähle ein Passwort
5. Klicke "Create account"
6. Bestätige deine E-Mail

**Falls du schon einen Account hast:** Einfach einloggen!

---

### Schritt 2: Neues Repository erstellen

1. **Gehe zu:** https://github.com/new
   - Oder: Klicke auf das **"+"** oben rechts → "New repository"

2. **Repository-Name eingeben:**
   - Name: `pen-and-paper-d6-v0.1`
   - (Kannst du ändern, aber dieser Name ist schon konfiguriert)

3. **Beschreibung (optional):**
   - Z.B. "Rollenspiel-App für Pen&Paper"

4. **Sichtbarkeit wählen:**
   - ✅ **Private** = Nur du siehst es (empfohlen)
   - ⭕ **Public** = Jeder kann es sehen

5. **WICHTIG - Lass diese Felder LEER:**
   - ❌ **KEINE** "Add a README file" anhaken
   - ❌ **KEINE** "Add .gitignore" auswählen
   - ❌ **KEINE** "Choose a license" auswählen
   - **Warum?** Der Code ist schon lokal vorhanden!

6. **Klicke:** "Create repository" (grüner Button)

---

### Schritt 3: Was du danach siehst

GitHub zeigt dir eine Seite mit Befehlen. **Das ist normal!**

Du siehst etwas wie:
```
Quick setup — if you've done this kind of thing before
…or create a new repository on the command line
```

**Das brauchst du NICHT!** Dein Code ist schon vorbereitet.

---

### Schritt 4: Code zu GitHub hochladen

**Jetzt musst du den Code von deinem PC zu GitHub hochladen:**

1. **Öffne PowerShell** (oder Terminal)
2. **Gehe in dein Projekt-Verzeichnis:**
   ```powershell
   cd C:\DEV\PenAndPaperD6
   ```

3. **Führe diesen Befehl aus:**
   ```powershell
   git push -u origin main
   ```

4. **Falls GitHub nach Login fragt:**
   - Gib deinen GitHub-Benutzernamen ein
   - Gib dein Passwort ein (oder Token)
   - **Hinweis:** Bei Passwort wird nichts angezeigt - das ist normal!

5. **Fertig!** Du solltest sehen:
   ```
   * [new branch]      main -> main
   ```

---

### Schritt 5: Prüfen ob es funktioniert hat

1. **Gehe zu:** https://github.com/Harno131/pen-and-paper-d6-v0.1
   - (Ersetze `Harno131` mit deinem GitHub-Benutzernamen)

2. **Du solltest sehen:**
   - ✅ Alle deine Dateien
   - ✅ `app/`, `components/`, `lib/` Ordner
   - ✅ `package.json`, `README.md`, etc.

**Wenn du das siehst → Erfolg! ✅**

---

## 🆘 Häufige Probleme:

### Problem 1: "Repository not found"

**Ursache:** Repository wurde noch nicht erstellt

**Lösung:**
- Gehe zu Schritt 2 und erstelle das Repository

---

### Problem 2: "Authentication failed"

**Ursache:** Falscher Benutzername/Passwort

**Lösung:**
- Prüfe ob du eingeloggt bist: https://github.com
- Falls nötig: Erstelle einen Personal Access Token
  - GitHub → Settings → Developer settings → Personal access tokens → Generate new token
  - Scopes: `repo` aktivieren
  - Token als Passwort verwenden

---

### Problem 3: "Repository already exists"

**Ursache:** Repository mit diesem Namen existiert schon

**Lösung:**
- Wähle einen anderen Namen (z.B. `pen-and-paper-d6-v0.2`)
- Oder lösche das alte Repository (Settings → Delete repository)

---

### Problem 4: "Permission denied"

**Ursache:** Keine Berechtigung für dieses Repository

**Lösung:**
- Prüfe ob du der Besitzer bist
- Prüfe ob Repository-Name korrekt ist

---

## ✅ Checkliste:

- [ ] GitHub-Account erstellt/eingeloggt
- [ ] Neues Repository erstellt (`pen-and-paper-d6-v0.1`)
- [ ] Repository ist **LEER** (keine README, etc.)
- [ ] Code gepusht: `git push -u origin main`
- [ ] Repository auf GitHub sichtbar mit allen Dateien

---

## 💡 Nach dem Push:

**Dann kannst du:**
1. In Vercel verbinden (siehe `NÄCHSTER_SCHRITT.md`)
2. App deployen
3. App nutzen!

---

## 📚 Weitere Hilfe:

- **GitHub Docs:** https://docs.github.com
- **Git Tutorial:** https://git-scm.com/docs/gittutorial

**Falls du Hilfe brauchst:** Sag einfach Bescheid! 😊
