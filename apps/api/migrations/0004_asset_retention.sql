ALTER TABLE assets ADD COLUMN owner_hash TEXT NULL;
ALTER TABLE assets ADD COLUMN expires_at INTEGER NULL;
CREATE INDEX assets_expiry_idx ON assets(expires_at);
