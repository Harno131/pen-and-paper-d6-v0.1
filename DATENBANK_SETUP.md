# Datenbank-Setup in Supabase

## Schritt 1: SQL Editor öffnen

1. Gehe zu deinem Supabase Projekt
2. Klicke auf "SQL Editor" im linken Menü
3. Klicke auf "New query"

## Schritt 2: Schema erstellen

1. Öffne die Datei `supabase/migrations/001_initial_schema.sql`
2. Kopiere den gesamten Inhalt
3. Füge ihn in den SQL Editor ein
4. Klicke auf "Run" (oder Strg+Enter)

## Schritt 3: Überprüfen

1. Gehe zu "Table Editor" im linken Menü
2. Du solltest folgende Tabellen sehen:
   - `groups`
   - `group_members`
   - `characters`
   - `available_skills`
   - `journal_entries`
   - `shared_images`
   - `dice_rolls`

## Schritt 4: Test-Gruppe erstellen (optional)

Falls du testen möchtest, kannst du eine Test-Gruppe erstellen:

```sql
INSERT INTO groups (name, code, created_by)
VALUES ('Test-Gruppe', 'TEST123', 'Spielleiter');

INSERT INTO group_members (group_id, player_name, role)
VALUES (
  (SELECT id FROM groups WHERE code = 'TEST123'),
  'Spielleiter',
  'spielleiter'
);
```

## Wichtig

- Die Datenbank ist jetzt bereit
- Row Level Security (RLS) ist aktiviert
- Alle Gruppenmitglieder können die Daten ihrer Gruppe sehen













