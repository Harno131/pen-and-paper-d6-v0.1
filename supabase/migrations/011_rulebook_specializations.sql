-- Rule-Book Master: Spezialisierungen und Review-Details

-- Zusätzliche Felder für Reviews
ALTER TABLE rulebook_reviews
  ADD COLUMN IF NOT EXISTS entry_type TEXT DEFAULT 'skill',
  ADD COLUMN IF NOT EXISTS spec_name TEXT;

CREATE INDEX IF NOT EXISTS idx_rulebook_reviews_entry_type ON rulebook_reviews(entry_type);

-- Globale Rule-Book-Spezialisierungen
CREATE TABLE IF NOT EXISTS rulebook_specializations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  skill_name TEXT NOT NULL,
  specialization_name TEXT NOT NULL,
  description TEXT,
  source_group_id UUID REFERENCES groups(id) ON DELETE SET NULL,
  source_player_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(skill_name, specialization_name)
);

CREATE INDEX IF NOT EXISTS idx_rulebook_specs_skill ON rulebook_specializations(skill_name);

ALTER TABLE rulebook_specializations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Rulebook specializations are public" ON rulebook_specializations;
CREATE POLICY "Rulebook specializations are public"
  ON rulebook_specializations
  FOR ALL
  USING (true)
  WITH CHECK (true);
