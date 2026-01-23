-- Tabellen: injury_templates und character_injuries (EGO_ULTRA)

CREATE TABLE IF NOT EXISTS injury_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slot TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS character_injuries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  character_id UUID NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
  slot TEXT NOT NULL,
  template_id UUID NOT NULL REFERENCES injury_templates(id) ON DELETE RESTRICT,
  current_severity INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_character_injuries_group ON character_injuries(group_id);
CREATE INDEX IF NOT EXISTS idx_character_injuries_character ON character_injuries(character_id);
CREATE INDEX IF NOT EXISTS idx_injury_templates_slot ON injury_templates(slot);

ALTER TABLE injury_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE character_injuries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Injury templates readable by all"
  ON injury_templates
  FOR SELECT
  USING (true);

CREATE POLICY "Injury templates writable by authenticated users"
  ON injury_templates
  FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Character injuries readable by all"
  ON character_injuries
  FOR SELECT
  USING (true);

CREATE POLICY "Character injuries writable by authenticated users"
  ON character_injuries
  FOR ALL
  USING (true)
  WITH CHECK (true);
