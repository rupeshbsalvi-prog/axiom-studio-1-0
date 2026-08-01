CREATE TABLE IF NOT EXISTS sessions (
    token_hash TEXT PRIMARY KEY,
    expires_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS rate_windows (
    client_key TEXT PRIMARY KEY,
    window_start REAL NOT NULL,
    request_count INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS assets (
    asset_id TEXT PRIMARY KEY,
    file_name TEXT NOT NULL,
    created_at INTEGER NOT NULL
);
