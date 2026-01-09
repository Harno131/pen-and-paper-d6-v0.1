# 🚀 Deployment: Nur 3 Schritte!

## ⚡ Schnellversion

Nach Änderungen am Code:

### Option 1: Script verwenden (am einfachsten)

**Windows:**
```bash
deploy.bat "Meine Änderung"
```

**PowerShell:**
```powershell
.\deploy.ps1 "Meine Änderung"
```

**Oder mit npm:**
```bash
npm run deploy
```
(Dann Commit-Nachricht eingeben)

### Option 2: Manuell (3 Befehle)

```bash
git add .
git commit -m "Meine Änderung"
git push
```

## ✅ Fertig!

- Vercel deployt automatisch (1-2 Minuten)
- Spieler sehen automatisch die neue Version
- Keine weiteren Schritte nötig!

---

## 📋 Einmalige Einrichtung (nur 1x)

Falls noch nicht geschehen:

1. **Git Repository:**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   ```

2. **GitHub Repository erstellen** (https://github.com/new)

3. **Mit GitHub verbinden:**
   ```bash
   git remote add origin https://github.com/DEIN-USERNAME/PenAndPaperD6.git
   git push -u origin main
   ```

4. **Vercel mit GitHub verbinden:**
   - https://vercel.com/dashboard
   - "Add New" → "Project"
   - Repository auswählen
   - Fertig!

**Danach: Nur noch die 3 Schritte oben!** 🎉

---

## 📖 Detaillierte Anleitung

Siehe `DEPLOYMENT_WORKFLOW.md` für:
- Erweiterte Optionen
- Troubleshooting
- Rollback-Anleitung
- Tipps & Tricks












