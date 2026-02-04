-- Rule-Book Master: globale Fertigkeiten und Review-Queue

-- Globale Rule-Book-Fertigkeiten
CREATE TABLE IF NOT EXISTS rulebook_skills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  attribute TEXT NOT NULL,
  description TEXT NOT NULL,
  source_group_id UUID REFERENCES groups(id) ON DELETE SET NULL,
  source_player_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(name, attribute)
);

-- Review-Queue für Rule-Book-Master
CREATE TABLE IF NOT EXISTS rulebook_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  skill_name TEXT NOT NULL,
  attribute TEXT NOT NULL,
  description TEXT NOT NULL,
  source_group_id UUID REFERENCES groups(id) ON DELETE SET NULL,
  source_player_name TEXT,
  action TEXT NOT NULL DEFAULT 'pending', -- pending | approved | declined | waiting
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_rulebook_skills_name ON rulebook_skills(name);
CREATE INDEX IF NOT EXISTS idx_rulebook_skills_attribute ON rulebook_skills(attribute);
CREATE INDEX IF NOT EXISTS idx_rulebook_reviews_action ON rulebook_reviews(action);

-- RLS aktivieren
ALTER TABLE rulebook_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE rulebook_reviews ENABLE ROW LEVEL SECURITY;

-- Policies (vereinfacht wie restliche App)
DROP POLICY IF EXISTS "Rulebook skills are public" ON rulebook_skills;
DROP POLICY IF EXISTS "Rulebook reviews are public" ON rulebook_reviews;

CREATE POLICY "Rulebook skills are public"
  ON rulebook_skills
  FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Rulebook reviews are public"
  ON rulebook_reviews
  FOR ALL
  USING (true)
  WITH CHECK (true);
