-- Add profile image URL to characters
ALTER TABLE characters
  ADD COLUMN IF NOT EXISTS profile_image_url TEXT;
