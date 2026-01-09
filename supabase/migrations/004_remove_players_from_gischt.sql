-- Migration: Entferne Spieler Kobi, Julia, JJ, Georg aus der Gruppe "Die Gischt"
-- Führe diese SQL-Befehle in Supabase SQL Editor aus

-- Finde die Gruppe "Die Gischt"
-- Entferne die Spieler aus group_members
DELETE FROM group_members
WHERE group_id IN (
  SELECT id FROM groups WHERE name = 'Die Gischt'
)
AND player_name IN ('Kobi', 'Julia', 'JJ', 'Georg');

-- Entferne die Charaktere dieser Spieler aus der Gruppe
DELETE FROM characters
WHERE group_id IN (
  SELECT id FROM groups WHERE name = 'Die Gischt'
)
AND player_name IN ('Kobi', 'Julia', 'JJ', 'Georg');

-- Entferne Journal-Einträge dieser Spieler (optional, falls gewünscht)
-- DELETE FROM journal_entries
-- WHERE group_id IN (
--   SELECT id FROM groups WHERE name = 'Die Gischt'
-- )
-- AND author IN ('Kobi', 'Julia', 'JJ', 'Georg');











