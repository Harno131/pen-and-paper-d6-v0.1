# 🚀 Vercel Deployment manuell starten

## ✅ Lösung: Manuelles Deployment auslösen

### Methode 1: Über Vercel Dashboard (einfachste Methode)

#### Schritt 1: Gehe zu Deployments

1. **Gehe zu:** https://vercel.com/dashboard
2. **Klicke** auf dein Projekt
3. **Klicke:** "Deployments" (oben in der Navigation)

#### Schritt 2: Neues Deployment starten

**Option A: Letztes Deployment neu deployen**
1. **Klicke** auf die **drei Punkte (⋯)** beim letzten Deployment
2. **Klicke:** "Redeploy"
3. **WICHTIG:** Aktiviere **NICHT** "Use existing Build Cache"
4. **Klicke:** "Redeploy"

**Option B: Neues Deployment von GitHub**
1. **Klicke:** "Deploy" (rechts oben, grüner Button)
2. **Wähle:** Branch `main`
3. **Klicke:** "Deploy"

---

### Methode 2: Über GitHub (automatisch)

**Falls automatische Deployments nicht funktionieren:**

#### Schritt 1: Prüfe Vercel-Integration

1. **Gehe zu:** https://github.com/Harno131/pen-and-paper-d6-v0.1/settings/hooks
2. **Prüfe** ob Vercel-Webhooks existieren
3. **Falls nicht:** Siehe Schritt 2

#### Schritt 2: Vercel mit GitHub verbinden

1. **Gehe zu:** https://vercel.com/dashboard
2. **Klicke** auf dein Projekt
3. **Gehe zu:** Settings → Git
4. **Prüfe:** "Connected Repository"
5. **Falls nicht verbunden:**
   - Klicke "Connect Git Repository"
   - Wähle `Harno131/pen-and-paper-d6-v0.1`
   - Wähle Branch `main`

#### Schritt 3: Neuen Commit pushen

**Falls Webhooks funktionieren, startet ein Push automatisch ein Deployment:**

```powershell
# Mache einen kleinen Änderung (z.B. Leerzeile in README)
git add .
git commit -m "Trigger deployment"
git push origin main
```

**Vercel sollte automatisch deployen!**

---

### Methode 3: Vercel CLI (für Fortgeschrittene)

**Falls du die Vercel CLI installiert hast:**

```powershell
# Installiere Vercel CLI (falls noch nicht installiert)
npm i -g vercel

# Login
vercel login

# Deploy
vercel --prod
```

**Aber:** Dashboard-Methode ist einfacher!

---

## 🆘 Problem: Automatische Deployments funktionieren nicht

### Prüfe Vercel-Integration

1. **Gehe zu:** https://vercel.com/dashboard
2. **Klicke** auf dein Projekt
3. **Gehe zu:** Settings → Git
4. **Prüfe:**
   - ✅ "Connected Repository" zeigt: `Harno131/pen-and-paper-d6-v0.1`
   - ✅ "Production Branch" zeigt: `main`
   - ✅ "Automatic deployments" ist aktiviert

### Falls nicht verbunden:

1. **Klicke:** "Connect Git Repository"
2. **Wähle:** `Harno131/pen-and-paper-d6-v0.1`
3. **Wähle:** Branch `main`
4. **Klicke:** "Save"

### Prüfe GitHub-Webhooks

1. **Gehe zu:** https://github.com/Harno131/pen-and-paper-d6-v0.1/settings/hooks
2. **Prüfe** ob Vercel-Webhooks existieren
3. **Falls nicht:**
   - Gehe zu Vercel → Settings → Git
   - Trenne und verbinde Repository neu

---

## ✅ Empfehlung:

**Verwende Methode 1 (Dashboard):**
- ✅ Einfachste Methode
- ✅ Funktioniert immer
- ✅ Du siehst sofort den Status

**Für automatische Deployments:**
- Prüfe Vercel-Integration (Settings → Git)
- Prüfe GitHub-Webhooks
- Falls nötig: Repository neu verbinden

---

## 📋 Schnell-Checkliste:

- [ ] Gehe zu Vercel Dashboard
- [ ] Klicke auf Projekt
- [ ] Gehe zu "Deployments"
- [ ] Klicke "Redeploy" oder "Deploy"
- [ ] Warte auf Build (2-3 Minuten)

**Fertig!** ✅
