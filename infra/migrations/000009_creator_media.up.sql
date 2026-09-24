CREATE TABLE media_assets (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 owner_user_id uuid NOT NULL REFERENCES users(id),
 purpose text NOT NULL CHECK(purpose IN ('creator_avatar','creator_banner')),
 status text NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','ready')),
 created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX media_assets_owner_idx ON media_assets(owner_user_id,created_at);
CREATE TRIGGER media_assets_updated BEFORE UPDATE ON media_assets FOR EACH ROW EXECUTE FUNCTION set_updated_at();
