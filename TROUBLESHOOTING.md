# Troubleshooting: Fehler beim Erstellen der Gruppe

## 🔍 Schritt-für-Schritt Fehlerbehebung

### 1. Prüfe die Browser-Konsole

Öffne die Browser-Entwicklertools (F12) und schaue in die Konsole nach Fehlermeldungen.

### 2. Prüfe Supabase-Verbindung

Die App zeigt jetzt automatisch Warnungen an, wenn:
- Supabase-Keys fehlen
- Tabellen nicht existieren
- Verbindungsprobleme auftreten

### 3. Häufige Fehler und Lösungen

#### ❌ "Tabelle 'groups' existiert nicht"

**Lösung:**
1. Öffne Supabase Dashboard → SQL Editor
2. Kopiere den gesamten Inhalt von `supabase/migrations/001_initial_schema.sql`
3. Führe das SQL-Script aus
4. Prüfe ob alle Tabellen erstellt wurden:
   ```sql
   SELECT table_name 
   FROM information_schema.tables 
   WHERE table_schema = 'public' 
   AND table_name IN ('groups', 'group_members', 'characters', 'available_skills', 'journal_entries', 'shared_images', 'dice_rolls');
   ```

#### ❌ "Berechtigungsfehler" oder "permission denied"

**Lösung:**
Die RLS-Policies sind möglicherweise nicht korrekt gesetzt. Führe diese SQL-Befehle aus:

```sql
-- Lösche alte Policies (falls vorhanden)
DROP POLICY IF EXISTS "Groups are public" ON groups;
DROP POLICY IF EXISTS "Group members are public" ON group_members;
DROP POLICY IF EXISTS "Characters are public" ON characters;
DROP POLICY IF EXISTS "Available skills are public" ON available_skills;
DROP POLICY IF EXISTS "Journal entries are public" ON journal_entries;
DROP POLICY IF EXISTS "Shared images are public" ON shared_images;
DROP POLICY IF EXISTS "Dice rolls are public" ON dice_rolls;

-- Erstelle neue Policies
CREATE POLICY "Groups are public"
  ON groups FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Group members are public"
  ON group_members FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Characters are public"
  ON characters FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Available skills are public"
  ON available_skills FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Journal entries are public"
  ON journal_entries FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Shared images are public"
  ON shared_images FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Dice rolls are public"
  ON dice_rolls FOR ALL
  USING (true)
  WITH CHECK (true);
```

#### ❌ "Supabase-Client konnte nicht erstellt werden"

**Lösung:**
1. Prüfe ob `.env.local` existiert im Projekt-Root
2. Prüfe ob die Keys korrekt sind:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_xxxxx
   ```
3. **Wichtig:** Nach Änderungen an `.env.local` den Dev-Server neu starten:
   ```powershell
   # Stoppe den Server (Strg+C)
   npm run dev
   ```

#### ❌ "Dieser Code ist bereits vergeben"

**Lösung:**
- Der Gruppen-Code existiert bereits
- Wähle einen anderen Code oder lösche die alte Gruppe in Supabase

### 4. Manuelle Prüfung in Supabase

#### Tabellen prüfen:
```sql
SELECT * FROM groups LIMIT 5;
SELECT * FROM group_members LIMIT 5;
```

#### RLS-Status prüfen:
```sql
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('groups', 'group_members', 'characters');
```

#### Policies prüfen:
```sql
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE tablename IN ('groups', 'group_members', 'characters');
```

### 5. Test-Script für Supabase

Führe dieses SQL aus, um zu testen ob alles funktioniert:

```sql
-- Test: Gruppe erstellen
INSERT INTO groups (name, code, created_by)
VALUES ('Test-Gruppe', 'TEST01', 'Test-Spielleiter')
RETURNING *;

-- Test: Mitglied hinzufügen
INSERT INTO group_members (group_id, player_name, role)
SELECT id, 'Test-Spielleiter', 'spielleiter'
FROM groups WHERE code = 'TEST01'
RETURNING *;

-- Aufräumen
DELETE FROM group_members WHERE player_name = 'Test-Spielleiter';
DELETE FROM groups WHERE code = 'TEST01';
```

Wenn diese Tests funktionieren, sollte auch die App funktionieren.

### 6. Noch immer Probleme?

1. **Browser-Cache leeren:** Strg+Shift+R (Hard Reload)
2. **Node-Module neu installieren:**
   ```powershell
   rm -r node_modules
   npm install
   ```
3. **Next.js Cache leeren:**
   ```powershell
   rm -r .next
   npm run dev
   ```
4. **Prüfe Supabase-Logs:** Dashboard → Logs → API Logs

### 7. Debug-Modus aktivieren

Öffne die Browser-Konsole und führe aus:
```javascript
// Teste Supabase-Verbindung
const { createSupabaseClient } = require('./lib/supabase')
const supabase = createSupabaseClient()
console.log('Supabase Client:', supabase)

// Teste Abfrage
supabase.from('groups').select('*').limit(1).then(console.log)
```













