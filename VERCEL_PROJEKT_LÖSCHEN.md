# 🗑️ Vercel-Projekt löschen - Anleitung

## ❓ Wann solltest du ein Vercel-Projekt löschen?

**Normalerweise NICHT nötig!** Du kannst:
- ✅ Ein bestehendes Projekt neu deployen
- ✅ Ein Repository mit einem neuen Projekt verbinden
- ✅ Ein Projekt umbenennen

**Nur löschen wenn:**
- ❌ Du das Projekt wirklich nicht mehr brauchst
- ❌ Du einen komplett neuen Start willst
- ❌ Du den Namen ändern willst (einfacher: neues Projekt erstellen)

---

## 🗑️ Vercel-Projekt löschen (falls nötig):

### Schritt 1: Gehe zu Vercel Dashboard

1. **Gehe zu:** https://vercel.com/dashboard
2. **Logge dich ein**

### Schritt 2: Projekt finden

1. **Suche** nach deinem Projekt (z.B. `pen-and-paper-d6-v0-1`)
2. **Klicke** auf das Projekt

### Schritt 3: Settings öffnen

1. **Klicke:** "Settings" (oben in der Navigation)
2. **Scrolle** ganz nach unten
3. **Suche** nach "Danger Zone" oder "Delete Project"

### Schritt 4: Projekt löschen

1. **Klicke:** "Delete Project" oder "Remove Project"
2. **Gib** den Projekt-Namen zur Bestätigung ein
3. **Klicke:** "Delete" oder "Remove"

**⚠️ WARNUNG:** Das löscht alle Deployments und Einstellungen!

---

## ✅ BESSER: Neues Projekt erstellen (empfohlen)

**Statt zu löschen, erstelle einfach ein neues Projekt:**

### Schritt 1: Neues Projekt erstellen

1. **Gehe zu:** https://vercel.com/dashboard
2. **Klicke:** "Add New" → "Project"
3. **Wähle:** Repository `Harno131/pen-and-paper-d6-v0.1`
4. **Wähle:** Branch `main`
5. **Klicke:** "Deploy"

**Vercel erstellt automatisch einen neuen Projekt-Namen** (z.B. `pen-and-paper-d6-v0-1-xyz`)

---

## 🔄 ODER: Bestehendes Projekt neu deployen

**Falls du schon ein Vercel-Projekt hast:**

### Schritt 1: Projekt öffnen

1. **Gehe zu:** https://vercel.com/dashboard
2. **Klicke** auf dein Projekt

### Schritt 2: Neu verbinden

1. **Gehe zu:** Settings → Git
2. **Klicke:** "Disconnect" (falls verbunden)
3. **Klicke:** "Connect Git Repository"
4. **Wähle:** `Harno131/pen-and-paper-d6-v0.1`
5. **Wähle:** Branch `main`

### Schritt 3: Neu deployen

1. **Gehe zu:** Deployments
2. **Klicke:** "Redeploy" beim letzten Deployment
3. **ODER:** Mache einen neuen Commit und pushe zu GitHub (Vercel deployt automatisch)

---

## 🆘 Problem: "Repository already connected"

**Falls Vercel sagt, das Repository ist schon verbunden:**

### Lösung 1: Bestehendes Projekt verwenden

1. **Gehe zu:** https://vercel.com/dashboard
2. **Suche** nach einem Projekt, das mit `pen-and-paper-d6-v0.1` verbunden ist
3. **Klicke** darauf
4. **Prüfe:** Settings → Git → Connected Repository
5. **Falls es das richtige ist:** Einfach neu deployen!

### Lösung 2: Repository trennen und neu verbinden

1. **Gehe zu:** Settings → Git
2. **Klicke:** "Disconnect"
3. **Warte** 1-2 Minuten
4. **Klicke:** "Connect Git Repository"
5. **Wähle:** `Harno131/pen-and-paper-d6-v0.1`

---

## ✅ Empfehlung:

**LÖSCHE NICHT das alte Projekt!**

**Stattdessen:**
1. ✅ Prüfe ob ein Projekt mit diesem Repository existiert
2. ✅ Falls ja: Verwende es und deploye neu
3. ✅ Falls nein: Erstelle neues Projekt
4. ✅ Falls Fehler: Trenne Repository und verbinde neu

**Warum?**
- Alte Deployments bleiben erhalten
- Einstellungen bleiben erhalten
- Einfacher zu debuggen

---

## 📋 Checkliste:

- [ ] Prüfe ob Projekt mit Repository existiert
- [ ] Falls ja: Verwende es
- [ ] Falls nein: Erstelle neues Projekt
- [ ] Umgebungsvariablen eintragen
- [ ] Neu deployen

---

## 💡 Tipp:

**Falls du wirklich löschen willst:**
- Warte bis neues Projekt funktioniert
- Dann kannst du das alte löschen
- Oder lass es einfach (kostet nichts, wenn nicht aktiv)
