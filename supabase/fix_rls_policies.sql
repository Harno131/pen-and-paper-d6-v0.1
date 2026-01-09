-- Fix RLS Policies für Rollenspiel-App
-- Führe dieses Script aus, wenn du den Fehler "violates row-level security policy" bekommst

-- 1. Lösche ALLE existierenden Policies für diese Tabellen
-- (Verwende DO-Block um Fehler zu vermeiden, falls Policies nicht existieren)
DO $$ 
DECLARE
  r RECORD;
BEGIN
  -- Lösche alle Policies für groups
  FOR r IN (SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = 'groups') 
  LOOP
    EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON groups';
  END LOOP;
  
  -- Lösche alle Policies für group_members
  FOR r IN (SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = 'group_members') 
  LOOP
    EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON group_members';
  END LOOP;
  
  -- Lösche alle Policies für characters
  FOR r IN (SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = 'characters') 
  LOOP
    EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON characters';
  END LOOP;
  
  -- Lösche alle Policies für available_skills
  FOR r IN (SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = 'available_skills') 
  LOOP
    EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON available_skills';
  END LOOP;
  
  -- Lösche alle Policies für journal_entries
  FOR r IN (SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = 'journal_entries') 
  LOOP
    EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON journal_entries';
  END LOOP;
  
  -- Lösche alle Policies für shared_images
  FOR r IN (SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = 'shared_images') 
  LOOP
    EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON shared_images';
  END LOOP;
  
  -- Lösche alle Policies für dice_rolls
  FOR r IN (SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = 'dice_rolls') 
  LOOP
    EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON dice_rolls';
  END LOOP;
END $$;

-- 2. Erstelle neue Policies mit korrekter Syntax
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

-- 3. Prüfe ob RLS aktiviert ist
-- (Sollte bereits aktiviert sein, aber zur Sicherheit)
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE characters ENABLE ROW LEVEL SECURITY;
ALTER TABLE available_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE journal_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE shared_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE dice_rolls ENABLE ROW LEVEL SECURITY;

-- 4. Test: Versuche eine Gruppe zu erstellen
-- (Dies sollte jetzt funktionieren)
-- INSERT INTO groups (name, code, created_by) 
-- VALUES ('Test', 'TEST01', 'Test') 
-- RETURNING *;

