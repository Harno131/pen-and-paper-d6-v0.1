# Setup-Anleitung: Vercel + Supabase

## Schritt 1: Accounts erstellen (kostenlos)

### 1.1 Vercel Account
1. Gehe zu: https://vercel.com
2. Klicke auf "Sign Up"
3. Melde dich mit GitHub an (empfohlen) oder E-Mail
4. **Kostenlos** - keine Kreditkarte nötig

### 1.2 Supabase Account
1. Gehe zu: https://supabase.com
2. Klicke auf "Start your project"
3. Melde dich mit GitHub an (empfohlen) oder E-Mail
4. **Kostenlos** - keine Kreditkarte nötig

## Schritt 2: Supabase Projekt erstellen

1. Nach Anmeldung: Klicke auf "New Project"
2. Wähle eine Organisation (oder erstelle eine)
3. Projekt-Name: z.B. "PenAndPaperD6"
4. Datenbank-Passwort: **WICHTIG - Notiere dir das Passwort!**
5. Region: Wähle die nächstgelegene (z.B. "West Europe (Frankfurt)")
6. Klicke auf "Create new project"
7. Warte 2-3 Minuten bis das Projekt erstellt ist

## Schritt 3: Supabase API-Keys holen

1. Im Supabase Dashboard: Gehe zu "Settings" → "API"
2. Notiere dir:
   - **Project URL** (z.B. `https://xxxxx.supabase.co`)
   - **Publishable key** (beginnt mit `sb_publishable_`)
   - **Secret key** (beginnt mit `sb_secret_`, NICHT öffentlich teilen!)
   
**Hinweis:** Der Secret key ist standardmäßig ausgeblendet. Klicke auf das Augensymbol 👁️ um ihn anzuzeigen.

## Schritt 4: Umgebungsvariablen einrichten

1. Erstelle eine Datei `.env.local` im Projektordner:
   ```
   NEXT_PUBLIC_SUPABASE_URL=deine-project-url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=deine-publishable-key
   SUPABASE_SERVICE_ROLE_KEY=deine-secret-key
   ```
   
   **Hinweis:** 
   - Publishable key beginnt mit `sb_publishable_`
   - Secret key beginnt mit `sb_secret_` (muss erst durch Klick auf 👁️ sichtbar gemacht werden)

2. **WICHTIG:** Füge `.env.local` zu `.gitignore` hinzu (wird automatisch gemacht)

## Schritt 5: GitHub Repository (optional, aber empfohlen)

1. Erstelle ein GitHub Repository: https://github.com/new
2. Repository-Name: z.B. "PenAndPaperD6"
3. Lade deinen Code hoch:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/DEIN-USERNAME/PenAndPaperD6.git
   git push -u origin main
   ```

## Schritt 6: Vercel Deployment

1. Gehe zu: https://vercel.com/dashboard
2. Klicke auf "Add New" → "Project"
3. Verbinde dein GitHub Repository (oder lade Code hoch)
4. Vercel erkennt automatisch Next.js
5. Füge Umgebungsvariablen hinzu:
   - `NEXT_PUBLIC_SUPABASE_URL` = deine Project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = deine Publishable key
   - `SUPABASE_SERVICE_ROLE_KEY` = deine Secret key
6. Klicke auf "Deploy"
7. Fertig! Deine App ist online

## Schritt 7: Datenbank-Schema erstellen

Nach dem Setup führe ich dich durch die Datenbank-Tabellen.

## Was wird installiert?

- `@supabase/supabase-js` - Supabase Client
- Keine weiteren Downloads nötig!

## Kosten

- **Vercel:** Kostenlos (bis 100 GB Bandbreite/Monat)
- **Supabase:** Kostenlos (bis 500 MB Datenbank, 2 GB Bandbreite)
- **Gesamt:** 0 €/Monat für den Start

## Nächste Schritte

Nachdem du die Accounts erstellt hast, sag Bescheid und ich:
1. Installiere die notwendigen Pakete
2. Erstelle die Datenbank-Tabellen
3. Ersetze localStorage durch Supabase
4. Implementiere das Gruppen-System

