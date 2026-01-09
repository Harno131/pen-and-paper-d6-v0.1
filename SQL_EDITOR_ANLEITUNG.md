# SQL-Datei in Supabase ausführen - Schritt für Schritt

## Schritt 1: SQL-Datei lokal öffnen

1. Öffne die Datei in deinem Editor:
   - Pfad: `supabase/migrations/001_initial_schema.sql`
   - Oder im Explorer: `supabase` → `migrations` → `001_initial_schema.sql`

2. **Markiere den gesamten Inhalt** (Strg+A)
3. **Kopiere alles** (Strg+C)

## Schritt 2: Supabase SQL Editor öffnen

1. Gehe zu https://supabase.com
2. Melde dich an
3. Wähle dein Projekt aus
4. Im **linken Menü** klicke auf **"SQL Editor"** (Icon: </> oder SQL-Symbol)
5. Klicke auf **"New query"** (oben rechts, grüner Button)

## Schritt 3: SQL einfügen und ausführen

1. **Füge den kopierten SQL-Code ein** (Strg+V) in das große Textfeld
2. **Prüfe den Code** - sollte mit `-- Rollenspiel-App Datenbank-Schema` beginnen
3. Klicke auf **"Run"** (rechts oben, grüner Button)
   - Oder drücke **Strg+Enter**

## Schritt 4: Erfolg prüfen

1. Du solltest eine Erfolgsmeldung sehen: "Success. No rows returned"
2. Gehe zu **"Table Editor"** im linken Menü
3. Du solltest jetzt folgende Tabellen sehen:
   - ✅ `groups`
   - ✅ `group_members`
   - ✅ `characters`
   - ✅ `available_skills`
   - ✅ `journal_entries`
   - ✅ `shared_images`
   - ✅ `dice_rolls`

## Falls Fehler auftreten

- **"relation already exists"** → Tabellen existieren bereits (OK, überspringen)
- **"permission denied"** → Prüfe, ob du Admin-Rechte hast
- **Syntax-Fehler** → Prüfe, ob der gesamte Code kopiert wurde
- **"violates row-level security policy"** → Siehe `RLS_POLICY_FIX.md` - führe `supabase/fix_rls_policies.sql` aus

## Alternative: Datei direkt öffnen

Falls du die Datei direkt öffnen möchtest:
- **VS Code / Cursor:** Rechtsklick auf Datei → "Open"
- **Notepad:** Rechtsklick → "Öffnen mit" → Notepad
- **PowerShell:** `notepad supabase/migrations/001_initial_schema.sql`

