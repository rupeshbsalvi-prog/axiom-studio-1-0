CREATE TABLE IF NOT EXISTS provider_jobs (
    job_id       TEXT    PRIMARY KEY,
    session_hash TEXT    NOT NULL,
    status       TEXT    NOT NULL DEFAULT 'queued',
    asset_id     TEXT,
    retry_count  INTEGER NOT NULL DEFAULT 0,
    created_at   INTEGER NOT NULL,
    updated_at   INTEGER NOT NULL,
    diagnostics  TEXT    NOT NULL DEFAULT '[]'
);
