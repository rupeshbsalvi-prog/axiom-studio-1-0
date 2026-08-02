CREATE TABLE public.axiom_auth_flows (
    flow_hash TEXT PRIMARY KEY,
    state_hash TEXT NOT NULL,
    code_verifier TEXT NOT NULL,
    expires_at BIGINT NOT NULL
);

CREATE TABLE public.axiom_sessions (
    session_kind TEXT NOT NULL CHECK (session_kind IN ('auth', 'photo')),
    token_hash TEXT NOT NULL,
    payload JSONB NOT NULL DEFAULT '{}'::jsonb,
    expires_at BIGINT NOT NULL,
    PRIMARY KEY (session_kind, token_hash)
);

CREATE INDEX axiom_sessions_expiry_idx ON public.axiom_sessions (expires_at);

ALTER TABLE public.axiom_auth_flows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.axiom_sessions ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.axiom_auth_flows FROM anon, authenticated;
REVOKE ALL ON public.axiom_sessions FROM anon, authenticated;
GRANT ALL ON public.axiom_auth_flows TO service_role;
GRANT ALL ON public.axiom_sessions TO service_role;

CREATE FUNCTION public.axiom_create_auth_flow(
    p_flow_hash TEXT,
    p_state_hash TEXT,
    p_code_verifier TEXT,
    p_expires_at BIGINT,
    p_capacity INTEGER
) RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
    LOCK TABLE public.axiom_auth_flows IN SHARE ROW EXCLUSIVE MODE;
    DELETE FROM public.axiom_auth_flows WHERE expires_at <= extract(epoch FROM now())::BIGINT;
    IF (SELECT count(*) FROM public.axiom_auth_flows) >= p_capacity THEN
        RETURN FALSE;
    END IF;
    INSERT INTO public.axiom_auth_flows(flow_hash, state_hash, code_verifier, expires_at)
    VALUES (p_flow_hash, p_state_hash, p_code_verifier, p_expires_at);
    RETURN TRUE;
END;
$$;

CREATE FUNCTION public.axiom_consume_auth_flow(p_flow_hash TEXT, p_state_hash TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    consumed public.axiom_auth_flows%ROWTYPE;
BEGIN
    DELETE FROM public.axiom_auth_flows
    WHERE flow_hash = p_flow_hash
    RETURNING * INTO consumed;
    IF consumed.flow_hash IS NULL OR consumed.expires_at <= extract(epoch FROM now())::BIGINT
       OR consumed.state_hash <> p_state_hash THEN
        RETURN NULL;
    END IF;
    RETURN consumed.code_verifier;
END;
$$;

REVOKE ALL ON FUNCTION public.axiom_create_auth_flow(TEXT, TEXT, TEXT, BIGINT, INTEGER) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.axiom_consume_auth_flow(TEXT, TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.axiom_create_auth_flow(TEXT, TEXT, TEXT, BIGINT, INTEGER) TO service_role;
GRANT EXECUTE ON FUNCTION public.axiom_consume_auth_flow(TEXT, TEXT) TO service_role;

INSERT INTO storage.buckets (id, name, public)
VALUES ('axiom-photo-assets', 'axiom-photo-assets', false)
ON CONFLICT (id) DO UPDATE SET public = false;
