CREATE TABLE public.axiom_assets (
    asset_id TEXT PRIMARY KEY,
    extension TEXT NOT NULL CHECK (extension IN ('png', 'svg')),
    mime_type TEXT NOT NULL,
    owner_hash TEXT NOT NULL,
    expires_at BIGINT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX axiom_assets_expiry_idx ON public.axiom_assets (expires_at);
ALTER TABLE public.axiom_assets ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.axiom_assets FROM anon, authenticated;
GRANT ALL ON public.axiom_assets TO service_role;
