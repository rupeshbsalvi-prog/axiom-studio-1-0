-- Phase 30 Database Migration: Photo Asset Metadata and Worker Claims

ALTER TABLE assets ADD COLUMN mime_type TEXT NULL;
ALTER TABLE assets ADD COLUMN byte_size INTEGER NULL;
ALTER TABLE assets ADD COLUMN width INTEGER NULL;
ALTER TABLE assets ADD COLUMN height INTEGER NULL;
ALTER TABLE assets ADD COLUMN sha256 TEXT NULL;
ALTER TABLE assets ADD COLUMN availability_status TEXT NULL CHECK (
    availability_status IS NULL OR
    availability_status IN ('available', 'missing', 'invalid')
);

ALTER TABLE provider_jobs ADD COLUMN worker_id TEXT NULL;
