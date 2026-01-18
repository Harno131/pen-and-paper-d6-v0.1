-- Add earned_blips to characters for blip reward system
ALTER TABLE characters
  ADD COLUMN IF NOT EXISTS earned_blips INTEGER DEFAULT 0;
