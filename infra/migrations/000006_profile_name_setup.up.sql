ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS name_confirmed_at timestamptz;

UPDATE profiles
SET name_confirmed_at = updated_at
WHERE name_confirmed_at IS NULL
  AND deleted_at IS NULL;