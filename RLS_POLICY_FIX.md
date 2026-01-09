# RLS-Policy Fehler beheben

## ❌ Fehler: "new row violates row-level security policy"

Dieser Fehler tritt auf, wenn RLS (Row Level Security) aktiviert ist, aber die Policies nicht korrekt gesetzt sind.

## ✅ Lösung: RLS-Policies neu setzen

### Schritt 1: Öffne Supabase SQL Editor

1. Gehe zu deinem Supabase Dashboard
2. Klicke auf **SQL Editor** (links im Menü)
3. Klicke auf **New Query**

### Schritt 2: Führe das Fix-Script aus

1. Öffne die Datei `supabase/fix_rls_policies.sql` in deinem Projekt
2. Kopiere den **gesamten Inhalt**
3. Füge ihn in den SQL Editor ein
4. Klicke auf **Run** (oder drücke Strg+Enter)

### Schritt 3: Prüfe ob es funktioniert hat

Führe diesen Test aus:

```sql
-- Test: Gruppe erstellen
INSERT INTO groups (name, code, created_by)
VALUES ('Test-Gruppe', 'TEST01', 'Test-Spielleiter')
RETURNING *;
```

Wenn das funktioniert, sollte die App jetzt auch funktionieren!

### Schritt 4: Aufräumen (optional)

Lösche die Test-Gruppe:

```sql
DELETE FROM groups WHERE code = 'TEST01';
```

## 🔍 Alternative: RLS temporär deaktivieren (nur für Tests)

⚠️ **Nur für Entwicklung!** Nicht für Produktion verwenden!

```sql
-- RLS deaktivieren (nur für Tests)
ALTER TABLE groups DISABLE ROW LEVEL SECURITY;
ALTER TABLE group_members DISABLE ROW LEVEL SECURITY;
ALTER TABLE characters DISABLE ROW LEVEL SECURITY;
ALTER TABLE available_skills DISABLE ROW LEVEL SECURITY;
ALTER TABLE journal_entries DISABLE ROW LEVEL SECURITY;
ALTER TABLE shared_images DISABLE ROW LEVEL SECURITY;
ALTER TABLE dice_rolls DISABLE ROW LEVEL SECURITY;
```

## 📋 Prüfe bestehende Policies

Falls du sehen willst, welche Policies aktuell gesetzt sind:

```sql
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename IN ('groups', 'group_members', 'characters', 'available_skills', 'journal_entries', 'shared_images', 'dice_rolls')
ORDER BY tablename, policyname;
```

## 🐛 Noch immer Probleme?

1. **Prüfe ob Tabellen existieren:**
   ```sql
   SELECT table_name 
   FROM information_schema.tables 
   WHERE table_schema = 'public' 
   AND table_name IN ('groups', 'group_members');
   ```

2. **Prüfe RLS-Status:**
   ```sql
   SELECT tablename, rowsecurity 
   FROM pg_tables 
   WHERE schemaname = 'public' 
   AND tablename = 'groups';
   ```

3. **Lösche alle Policies und erstelle neu:**
   ```sql
   -- Alle Policies löschen
   DO $$ 
   DECLARE
     r RECORD;
   BEGIN
     FOR r IN (SELECT policyname, tablename FROM pg_policies WHERE schemaname = 'public') 
     LOOP
       EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON ' || quote_ident(r.tablename);
     END LOOP;
   END $$;
   ```
   
   Dann führe `supabase/fix_rls_policies.sql` erneut aus.













