-- Fix RLS Policies - EINFACHE VERSION
-- Diese Version erstellt Policies neu, auch wenn sie bereits existieren
-- Keine DROP-Befehle = keine Fehler

-- WICHTIG: Falls Policies bereits existieren, werden sie hier überschrieben
-- PostgreSQL erlaubt "CREATE OR REPLACE" nicht für Policies, daher müssen wir sie zuerst löschen

-- Schritt 1: Lösche nur die spezifischen Policies die wir neu erstellen wollen
DROP POLICY IF EXISTS "Groups are public" ON groups;
DROP POLICY IF EXISTS "Group members are public" ON group_members;
DROP POLICY IF EXISTS "Characters are public" ON characters;
DROP POLICY IF EXISTS "Available skills are public" ON available_skills;
DROP POLICY IF EXISTS "Journal entries are public" ON journal_entries;
DROP POLICY IF EXISTS "Shared images are public" ON shared_images;
DROP POLICY IF EXISTS "Dice rolls are public" ON dice_rolls;

-- Schritt 2: Erstelle neue Policies
-- Gruppen: Alle können alles
CREATE POLICY "Groups are public"
  ON groups
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Gruppenmitglieder: Alle können alles
CREATE POLICY "Group members are public"
  ON group_members
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Charaktere: Alle können alles
CREATE POLICY "Characters are public"
  ON characters
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Fertigkeiten: Alle können alles
CREATE POLICY "Available skills are public"
  ON available_skills
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Tagebuch: Alle können alles
CREATE POLICY "Journal entries are public"
  ON journal_entries
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Geteilte Bilder: Alle können alles
CREATE POLICY "Shared images are public"
  ON shared_images
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Würfelwürfe: Alle können alles
CREATE POLICY "Dice rolls are public"
  ON dice_rolls
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Schritt 3: Aktiviere RLS (falls noch nicht aktiviert)
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE characters ENABLE ROW LEVEL SECURITY;
ALTER TABLE available_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE journal_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE shared_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE dice_rolls ENABLE ROW LEVEL SECURITY;













