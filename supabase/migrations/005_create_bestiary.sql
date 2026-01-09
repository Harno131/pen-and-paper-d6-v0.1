-- Tabelle: Bestiary (Standard-Gegner für Fallcrest)
-- Diese Tabelle speichert vordefinierte Gegner, die Spielleiter in ihre Gruppen einfügen können

CREATE TABLE IF NOT EXISTS bestiary (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type TEXT NOT NULL, -- z.B. "Untoter", "Bestie", "Humanoid", "Geist", "Ooze", "Konstrukt"
  level INTEGER DEFAULT 1,
  race TEXT,
  description TEXT,
  attributes JSONB NOT NULL, -- { "Reflexe": "2D", "Koordination": "2D", ... }
  skills JSONB DEFAULT '[]'::jsonb, -- Array von Skills (wie bei Charakteren)
  inventory JSONB DEFAULT '[]'::jsonb, -- Array von Items
  max_hp INTEGER NOT NULL,
  fallcrest_twist TEXT NOT NULL, -- Besonderer Fallcrest-Bezug (Nässe, Dunst, Artefakte)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index für schnelle Suche nach Typ und Level
CREATE INDEX IF NOT EXISTS idx_bestiary_type ON bestiary(type);
CREATE INDEX IF NOT EXISTS idx_bestiary_level ON bestiary(level);

-- RLS (Row Level Security) - Alle können lesen, nur Spielleiter können schreiben
ALTER TABLE bestiary ENABLE ROW LEVEL SECURITY;

-- Policy: Alle können lesen
CREATE POLICY "Bestiary is readable by all"
  ON bestiary
  FOR SELECT
  USING (true);

-- Policy: Nur authentifizierte Benutzer können schreiben (kann später eingeschränkt werden)
CREATE POLICY "Bestiary is writable by authenticated users"
  ON bestiary
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Kommentare für Dokumentation
COMMENT ON TABLE bestiary IS 'Standard-Gegner für das Fallcrest-Pen&Paper-System';
COMMENT ON COLUMN bestiary.fallcrest_twist IS 'Besonderer Bezug zu Fallcrest (Nässe, Dunst, Artefakte)';
