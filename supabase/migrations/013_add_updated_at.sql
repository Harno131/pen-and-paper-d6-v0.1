-- Add updated_at to characters for conflict resolution
ALTER TABLE characters
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
