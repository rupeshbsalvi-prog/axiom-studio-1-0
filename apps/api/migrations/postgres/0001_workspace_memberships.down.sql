DROP POLICY IF EXISTS "Members can read their active workspace memberships"
    ON public.workspace_memberships;

DROP TABLE IF EXISTS public.workspace_memberships;
