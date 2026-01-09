# 🔗 Repository bereits verbunden - Was tun?

## ❌ Problem: "Repository already connected"

**Das bedeutet:** Das GitHub Repository ist schon mit einem Vercel-Projekt verbunden.

---

## ✅ Lösung 1: Bestehendes Projekt finden und verwenden (empfohlen)

### Schritt 1: Projekt finden

1. **Gehe zu:** https://vercel.com/dashboard
2. **Suche** in der Projekt-Liste nach:
   - `pen-and-paper-d6-v0-1`
   - `pen-and-paper-d6-v0.1`
   - Oder ähnliche Namen

3. **ODER:** Gehe zu Settings → Git → Connected Repository
   - Dort siehst du alle verbundenen Repositories

### Schritt 2: Projekt öffnen

1. **Klicke** auf das Projekt
2. **Prüfe:** Settings → Git → Connected Repository
3. **Sollte zeigen:** `Harno131/pen-and-paper-d6-v0.1`

### Schritt 3: Neu deployen

1. **Gehe zu:** Deployments
2. **Klicke:** "Redeploy" beim letzten Deployment
3. **ODER:** Mache einen neuen Commit:
   ```powershell
   git add .
   git commit -m "Update"
   git push origin main
   ```
   Vercel deployt automatisch!

---

## ✅ Lösung 2: Repository trennen und neu verbinden

**Falls du ein neues Projekt willst:**

### Schritt 1: Altes Projekt öffnen

1. **Gehe zu:** https://vercel.com/dashboard
2. **Finde** das Projekt mit dem Repository
3. **Klicke** darauf

### Schritt 2: Repository trennen

1. **Gehe zu:** Settings → Git
2. **Klicke:** "Disconnect" (oder "Remove")
3. **Bestätige** die Trennung

### Schritt 3: Neues Projekt erstellen

1. **Gehe zu:** Dashboard
2. **Klicke:** "Add New" → "Project"
3. **Wähle:** `Harno131/pen-and-paper-d6-v0.1`
4. **Klicke:** "Deploy"

---

## ✅ Lösung 3: Bestehendes Projekt verwenden (einfachste Lösung)

**Warum neu erstellen? Nutze einfach das bestehende!**

1. **Finde** das Projekt in Vercel
2. **Öffne** es
3. **Prüfe** ob Umgebungsvariablen eingetragen sind
4. **Falls nicht:** Eintragen (siehe `NÄCHSTE_SCHRITTE_VERCEL.md`)
5. **Redeploy** ausführen

**Fertig!** ✅

---

## 🆘 Problem: Projekt nicht gefunden

**Falls du das Projekt nicht findest:**

### Schritt 1: Alle Projekte anzeigen

1. **Gehe zu:** https://vercel.com/dashboard
2. **Scrolle** durch alle Projekte
3. **Prüfe** auch gelöschte Projekte (falls sichtbar)

### Schritt 2: Über GitHub prüfen

1. **Gehe zu:** https://github.com/Harno131/pen-and-paper-d6-v0.1/settings/hooks
2. **Prüfe** ob Vercel-Webhooks existieren
3. **Falls ja:** Klicke darauf → Siehst du das Vercel-Projekt

### Schritt 3: Neues Projekt erstellen

**Falls wirklich nichts gefunden:**
1. **Trenne** alle Webhooks in GitHub (falls vorhanden)
2. **Erstelle** neues Projekt in Vercel
3. **Verbinde** Repository

---

## ✅ Empfehlung:

**Verwende das bestehende Projekt!**

**Warum?**
- ✅ Einfacher
- ✅ Alte Deployments bleiben
- ✅ Einstellungen bleiben
- ✅ Keine doppelten Projekte

**Nur wenn:**
- ❌ Projekt komplett kaputt ist
- ❌ Du den Namen ändern willst
- ❌ Du einen komplett neuen Start willst

---

## 📋 Checkliste:

- [ ] Prüfe ob Projekt in Vercel existiert
- [ ] Falls ja: Öffne und redeploy
- [ ] Falls nein: Erstelle neues Projekt
- [ ] Prüfe Umgebungsvariablen
- [ ] Teste App
