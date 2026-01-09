# Quick Start: Vercel + Supabase Setup

## Was du brauchst (kostenlos):

1. ✅ **GitHub Account** (kostenlos) - https://github.com
2. ✅ **Vercel Account** (kostenlos) - https://vercel.com
3. ✅ **Supabase Account** (kostenlos) - https://supabase.com

## Schritt-für-Schritt:

### 1. Accounts erstellen (5 Minuten)

1. **GitHub:**
   - Gehe zu https://github.com
   - Klicke "Sign up"
   - Erstelle Account

2. **Vercel:**
   - Gehe zu https://vercel.com
   - Klicke "Sign Up"
   - Melde dich mit GitHub an

3. **Supabase:**
   - Gehe zu https://supabase.com
   - Klicke "Start your project"
   - Melde dich mit GitHub an

### 2. Supabase Projekt erstellen (5 Minuten)

1. In Supabase: Klicke "New Project"
2. Projekt-Name: `PenAndPaperD6` (oder wie du willst)
3. Datenbank-Passwort: **WICHTIG - Notiere es!**
4. Region: `West Europe (Frankfurt)` (oder nächstgelegene)
5. Klicke "Create new project"
6. Warte 2-3 Minuten

### 3. API-Keys kopieren (2 Minuten)

1. In Supabase: Gehe zu "Settings" → "API"
2. Du siehst mehrere Keys:
   - **Project URL** (ganz oben, z.B. `https://xxxxx.supabase.co`)
   - **Publishable key** (im Abschnitt "Your new API keys are here")
   - **Secret key** (im Abschnitt "Secret keys", standardmäßig ausgeblendet)
3. Kopiere alle drei:
   - Project URL (für `NEXT_PUBLIC_SUPABASE_URL`)
   - Publishable key (für `NEXT_PUBLIC_SUPABASE_ANON_KEY`)
   - Secret key (für `SUPABASE_SERVICE_ROLE_KEY`) - **WICHTIG: Dieser Key ist geheim!**

**Hinweis:** Der Secret key ist standardmäßig ausgeblendet (zeigt `••••••••`). Klicke auf das Augensymbol oder "Reveal" um ihn anzuzeigen.

### 4. Lokale Umgebungsvariablen (2 Minuten)

1. Erstelle Datei `.env.local` im Projektordner
2. Füge ein:
   ```
   NEXT_PUBLIC_SUPABASE_URL=deine-project-url-hier
   NEXT_PUBLIC_SUPABASE_ANON_KEY=deine-publishable-key-hier
   SUPABASE_SERVICE_ROLE_KEY=deine-secret-key-hier
   ```
3. Ersetze die Platzhalter mit deinen echten Werten

### 5. Pakete installieren (1 Minute)

```bash
npm install
```

### 6. Datenbank-Schema erstellen (3 Minuten)

1. In Supabase: Gehe zu "SQL Editor"
2. Öffne `supabase/migrations/001_initial_schema.sql`
3. Kopiere den gesamten Inhalt
4. Füge in SQL Editor ein
5. Klicke "Run"

### 7. GitHub Repository (optional, 5 Minuten)

1. Gehe zu https://github.com/new
2. Repository-Name: `PenAndPaperD6`
3. Klicke "Create repository"
4. Führe aus:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/DEIN-USERNAME/PenAndPaperD6.git
   git push -u origin main
   ```

### 8. Vercel Deployment (5 Minuten)

1. Gehe zu https://vercel.com/dashboard
2. Klicke "Add New" → "Project"
3. Wähle dein GitHub Repository
4. **Vercel-Einstellungen** (meistens kannst du alles leer lassen):
   - **Root Directory:** (leer lassen)
   - **Build Command:** `npm run build` (oder leer lassen)
   - **Output Directory:** (leer lassen - **wichtig!**)
   - **Install Command:** `npm install` (oder leer lassen)
   
   **Hinweis:** Vercel erkennt Next.js automatisch. Nur wenn explizit nach den Werten gefragt wird, gibst du sie an.
5. Füge Umgebungsvariablen hinzu:
   - `NEXT_PUBLIC_SUPABASE_URL` = deine Project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = deine Publishable key
   - `SUPABASE_SERVICE_ROLE_KEY` = deine Secret key
6. Klicke "Deploy"
7. Fertig! 🎉

**Detaillierte Anleitung:** Siehe `VERCEL_EINSTELLUNGEN.md`

## Nach dem Setup

Sag mir Bescheid, dann:
1. ✅ Installiere ich die Pakete
2. ✅ Ersetze localStorage durch Supabase
3. ✅ Implementiere das Gruppen-System
4. ✅ Teste alles

## Gesamtzeit: ~30 Minuten

## Kosten: 0 €/Monat

