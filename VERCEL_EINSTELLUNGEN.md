# ⚙️ Vercel-Einstellungen: Was du eingeben musst

## ✅ Für Next.js-Projekte (Standard-Werte)

### Was du wirklich brauchst:

**Meistens kannst du alles leer lassen!** Vercel erkennt Next.js automatisch und verwendet die Standardwerte.

---

## 📋 Falls Vercel die Felder anzeigt:

### 1. **Root Directory**
```
(leer lassen)
```
**Oder:** `.` (Punkt)

**Warum:** Dein Projekt liegt direkt im Root des Repositories, nicht in einem Unterordner.

---

### 2. **Build Command**
```
npm run build
```

**Warum:** Das ist der Standard-Build-Befehl aus deiner `package.json`.

**Alternative:** Falls du einen anderen Build-Befehl hast, verwende diesen.

---

### 3. **Output Directory**
```
(leer lassen)
```

**Warum:** Next.js hat kein separates Output-Verzeichnis. Es baut alles in `.next` und Vercel weiß das automatisch.

**WICHTIG:** Für Next.js **NIEMALS** ein Output Directory angeben! Das würde den Build kaputt machen.

---

### 4. **Install Command**
```
npm install
```

**Warum:** Standard-Befehl zum Installieren der Dependencies.

**Alternative:** Falls du `yarn` oder `pnpm` verwendest:
- `yarn install` (für Yarn)
- `pnpm install` (für pnpm)

---

## 🎯 Zusammenfassung: Was du eingibst

### Option A: Alles leer lassen (empfohlen)
- ✅ Root Directory: **(leer)**
- ✅ Build Command: **(leer)** → Vercel verwendet automatisch `npm run build`
- ✅ Output Directory: **(leer)** → Vercel weiß, dass Next.js kein Output-Dir hat
- ✅ Install Command: **(leer)** → Vercel verwendet automatisch `npm install`

**Vercel erkennt Next.js automatisch und verwendet die richtigen Werte!**

---

### Option B: Explizit angeben (falls Vercel fragt)

Wenn Vercel die Felder anzeigt und du sie ausfüllen musst:

```
Root Directory:     (leer lassen)
Build Command:      npm run build
Output Directory:   (leer lassen)
Install Command:    npm install
```

---

## ⚠️ Wichtige Hinweise:

### ❌ Output Directory NICHT angeben!
**Falsch:**
```
Output Directory: .next
```

**Richtig:**
```
Output Directory: (leer lassen)
```

**Warum:** Next.js verwaltet das Output-Verzeichnis selbst. Wenn du es angibst, funktioniert der Build nicht.

---

### ✅ Node.js Version
Vercel verwendet automatisch die neueste LTS-Version von Node.js (aktuell 20.x).

Falls du eine spezifische Version brauchst, erstelle eine `.nvmrc` Datei:
```
20
```

---

## 🔍 Prüfen ob es funktioniert:

Nach dem Deploy:
1. Öffne deine Vercel-URL (z.B. `https://deine-app.vercel.app`)
2. Prüfe ob die App lädt
3. Falls Fehler: Siehe Build-Logs in Vercel Dashboard

---

## 📝 Beispiel-Konfiguration:

**Für dein Projekt (`PenAndPaperD6`):**

```
Framework Preset:     Next.js (automatisch erkannt)
Root Directory:       (leer)
Build Command:        npm run build
Output Directory:     (leer)
Install Command:      npm install
Node.js Version:      20.x (automatisch)
```

---

## 🚀 Schnell-Checkliste:

- [ ] Root Directory: **Leer lassen** (oder `.`)
- [ ] Build Command: **`npm run build`** (oder leer lassen)
- [ ] Output Directory: **Leer lassen** (wichtig!)
- [ ] Install Command: **`npm install`** (oder leer lassen)
- [ ] Umgebungsvariablen: **Hinzufügen** (Supabase-Keys)

---

## 💡 Tipp:

**Meistens reicht es, alles leer zu lassen!** Vercel ist sehr intelligent und erkennt Next.js-Projekte automatisch. Nur wenn Vercel explizit nach den Werten fragt, gibst du sie an.
