CREATE TABLE IF NOT EXISTS public.workspace_memberships (
    workspace_id TEXT NOT NULL CHECK (length(workspace_id) BETWEEN 1 AND 128),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('owner', 'admin', 'member', 'viewer')),
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (workspace_id, user_id)
);

CREATE INDEX IF NOT EXISTS workspace_memberships_active_user_idx
    ON public.workspace_memberships (user_id)
    WHERE status = 'active';

ALTER TABLE public.workspace_memberships ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.workspace_memberships FROM anon, authenticated;
GRANT SELECT ON public.workspace_memberships TO authenticated;

CREATE POLICY "Members can read their active workspace memberships"
    ON public.workspace_memberships
    FOR SELECT
    TO authenticated
    USING ((select auth.uid()) = user_id AND status = 'active');
