-- Rollenspiel-App Datenbank-Schema
-- Führe diese SQL-Befehle in Supabase SQL Editor aus

-- Tabelle: Gruppen
CREATE TABLE IF NOT EXISTS groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  code TEXT UNIQUE NOT NULL, -- Einladungscode für Spieler
  created_by TEXT NOT NULL, -- Spielleiter-Name
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  settings JSONB DEFAULT '{}'::jsonb -- Charaktererstellungs-Einstellungen
);

-- Tabelle: Spieler (Mitglieder einer Gruppe)
CREATE TABLE IF NOT EXISTS group_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID REFERENCES groups(id) ON DELETE CASCADE,
  player_name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('spielleiter', 'spieler')),
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(group_id, player_name)
);

-- Tabelle: Charaktere
CREATE TABLE IF NOT EXISTS characters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID REFERENCES groups(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  player_name TEXT NOT NULL,
  class_name TEXT,
  race TEXT,
  age TEXT,
  gender TEXT,
  level INTEGER DEFAULT 1,
  attributes JSONB NOT NULL, -- { "Reflexe": "2D", ... }
  skills JSONB DEFAULT '[]'::jsonb, -- Array von Skills
  inventory JSONB DEFAULT '[]'::jsonb, -- Array von Items
  alignment JSONB, -- { "row": 1, "col": 2 }
  notes TEXT,
  base_attributes JSONB, -- Grundwerte bei Erstellung
  base_skills JSONB,
  attribute_points_used INTEGER DEFAULT 0,
  skill_points_used INTEGER DEFAULT 0,
  blibs_used INTEGER DEFAULT 0,
  created_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_played_date TIMESTAMP WITH TIME ZONE,
  deleted_date TIMESTAMP WITH TIME ZONE,
  UNIQUE(group_id, player_name, name)
);

-- Tabelle: Fertigkeiten (globale Liste, verwaltet vom Spielleiter)
CREATE TABLE IF NOT EXISTS available_skills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID REFERENCES groups(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  attribute TEXT NOT NULL,
  is_weakened BOOLEAN DEFAULT FALSE,
  is_custom BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(group_id, name, attribute)
);

-- Tabelle: Gruppentagebuch
CREATE TABLE IF NOT EXISTS journal_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID REFERENCES groups(id) ON DELETE CASCADE,
  author TEXT NOT NULL,
  character_id UUID REFERENCES characters(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabelle: Geteilte Bilder
CREATE TABLE IF NOT EXISTS shared_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID REFERENCES groups(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  title TEXT,
  description TEXT,
  sent_by TEXT NOT NULL,
  sent_to TEXT[], -- Array von Spielernamen, leer = alle
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabelle: Würfelwürfe
CREATE TABLE IF NOT EXISTS dice_rolls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID REFERENCES groups(id) ON DELETE CASCADE,
  character_id UUID REFERENCES characters(id) ON DELETE CASCADE,
  attribute TEXT NOT NULL,
  dice_formula TEXT NOT NULL,
  dice_results INTEGER[] NOT NULL,
  red_die_result INTEGER,
  exploding_rolls INTEGER[],
  modifier INTEGER DEFAULT 0,
  result INTEGER NOT NULL,
  success BOOLEAN,
  target_value INTEGER,
  is_critical_failure BOOLEAN DEFAULT FALSE,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes für bessere Performance
CREATE INDEX IF NOT EXISTS idx_characters_group_id ON characters(group_id);
CREATE INDEX IF NOT EXISTS idx_characters_player_name ON characters(player_name);
CREATE INDEX IF NOT EXISTS idx_group_members_group_id ON group_members(group_id);
CREATE INDEX IF NOT EXISTS idx_journal_entries_group_id ON journal_entries(group_id);
CREATE INDEX IF NOT EXISTS idx_shared_images_group_id ON shared_images(group_id);
CREATE INDEX IF NOT EXISTS idx_dice_rolls_group_id ON dice_rolls(group_id);
CREATE INDEX IF NOT EXISTS idx_dice_rolls_character_id ON dice_rolls(character_id);

-- Row Level Security (RLS) aktivieren
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE characters ENABLE ROW LEVEL SECURITY;
ALTER TABLE available_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE journal_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE shared_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE dice_rolls ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Vereinfacht für den Start
-- Alle können alles lesen/schreiben (später können wir feinere Berechtigungen hinzufügen)
-- WICHTIG: "FOR ALL" bedeutet SELECT, INSERT, UPDATE, DELETE

-- Lösche alte Policies falls vorhanden (für Updates)
DROP POLICY IF EXISTS "Groups are public" ON groups;
DROP POLICY IF EXISTS "Group members are public" ON group_members;
DROP POLICY IF EXISTS "Characters are public" ON characters;
DROP POLICY IF EXISTS "Available skills are public" ON available_skills;
DROP POLICY IF EXISTS "Journal entries are public" ON journal_entries;
DROP POLICY IF EXISTS "Shared images are public" ON shared_images;
DROP POLICY IF EXISTS "Dice rolls are public" ON dice_rolls;

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

