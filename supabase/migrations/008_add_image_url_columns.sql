-- Add generic image_url to support Gemini images
ALTER TABLE characters
  ADD COLUMN IF NOT EXISTS image_url TEXT;

ALTER TABLE journal_entries
  ADD COLUMN IF NOT EXISTS image_url TEXT;

ALTER TABLE bestiary
  ADD COLUMN IF NOT EXISTS image_url TEXT;
