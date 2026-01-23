-- Fuegt Geld (Kupferbasis) zu Charakteren hinzu

ALTER TABLE characters
ADD COLUMN IF NOT EXISTS copper_coins INTEGER DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_characters_copper ON characters(copper_coins);
