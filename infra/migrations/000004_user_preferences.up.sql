CREATE TABLE IF NOT EXISTS user_preferences (
  user_id uuid PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  theme_preference text NOT NULL DEFAULT 'system'
    CHECK (theme_preference IN ('system', 'light', 'dark')),
  locale text NOT NULL DEFAULT 'ru'
    CHECK (locale IN ('ru', 'en')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER user_preferences_set_updated_at
  BEFORE UPDATE ON user_preferences
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();

INSERT INTO user_preferences (user_id, theme_preference, locale)
SELECT id, 'system', default_locale
FROM users
WHERE deleted_at IS NULL
ON CONFLICT (user_id) DO NOTHING;
