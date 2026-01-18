-- Add illustration URL to journal entries
ALTER TABLE journal_entries
  ADD COLUMN IF NOT EXISTS illustration_url TEXT;
