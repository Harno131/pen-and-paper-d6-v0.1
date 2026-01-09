-- Migration: Entferne alle Spieler außer "Test"
-- Führe diese SQL-Befehle in Supabase SQL Editor aus

-- Entferne alle Charaktere von Spielern außer "Test"
DELETE FROM characters
WHERE player_name != 'Test';

-- Entferne alle Gruppen-Mitglieder außer "Test"
DELETE FROM group_members
WHERE player_name != 'Test';

-- Entferne alle Journal-Einträge von Spielern außer "Test"
DELETE FROM journal_entries
WHERE author != 'Test' AND author != 'Spielleiter';

-- Entferne alle Würfelwürfe von Spielern außer "Test"
DELETE FROM dice_rolls
WHERE character_id IN (
  SELECT id FROM characters WHERE player_name != 'Test'
);











