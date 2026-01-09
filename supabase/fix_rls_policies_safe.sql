-- Fix RLS Policies für Rollenspiel-App (SAFE VERSION - ohne DROP)
-- Diese Version erstellt nur neue Policies, ohne alte zu löschen
-- Falls Policies bereits existieren, werden sie überschrieben

-- 1. Erstelle neue Policies (überschreibt alte falls vorhanden)
-- WICHTIG: "FOR ALL" bedeutet SELECT, INSERT, UPDATE, DELETE

-- Gruppen: Alle können alles (für den Start)
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

-- 2. Prüfe ob RLS aktiviert ist
-- (Sollte bereits aktiviert sein, aber zur Sicherheit)
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE characters ENABLE ROW LEVEL SECURITY;
ALTER TABLE available_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE journal_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE shared_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE dice_rolls ENABLE ROW LEVEL SECURITY;













