# ADR-0005: B9.2 Secure Server-Session Policy Bootstrap

- Status: Accepted and implemented
- Date: 2026-08-01

## Context

B9.1 can enforce a verified workspace learning-policy snapshot, but the browser cannot safely use the backend bearer credential required by the temporary policy endpoint. Auth A1 now provides a live-verified opaque application session and authoritative active workspace-membership snapshot.

## Decision

B9.2 is the smallest same-origin, read-only bridge between Auth A1 and B9.1:

1. Keep `GET /api/workspaces/{workspace_id}/learning-policy` and authenticate it with the `HttpOnly` Axiom application-session cookie.
2. Require the caller to provide the already-selected `workspace_id`. Never default to the first membership or infer workspace selection.
3. Return the existing `axiom-workspace-learning-authority.v1` contract only when the session is valid, unexpired, and contains an active membership for that exact workspace.
4. Keep policy authority server-side and read-only. For B9.2, the existing single-workspace server configuration remains the policy source; policy persistence and administration are deferred.
5. Replace the route's temporary bearer-token bootstrap rather than supporting ambiguous dual authentication. No policy credential enters browser code.
6. Mark responses `Cache-Control: no-store`. Missing, expired, or invalid sessions return `401`; valid sessions without the requested membership and unknown workspaces return `404`; unavailable or invalid required policy returns `503` and fails closed.
7. The workspace host may pass the verified snapshot to B9.1 only after authenticated session resolution and explicit workspace context. Fetching policy never changes learning scope or state.

## Security Invariants

- Session cookies remain opaque, hashed at rest, revocable, TTL-bound, `HttpOnly`, same-origin, `SameSite=Lax`, and `Secure` in production.
- Supabase tokens, session tokens, policy credentials, and membership overrides never enter browser storage, project state, diagnostics, audit payloads, test snapshots, or frontend environment variables.
- A session membership is a bounded login-time snapshot. B9.2 does not add refresh tokens, background refresh, or silent workspace switching; updated membership takes effect on a new session or expiry.
- Personal denial always disables learning. Verified workspace denial or scope exclusion overrides personal consent. Required-but-unavailable policy never falls back to personal authority.
- Read access cannot mutate membership, policy, consent, preferences, influences, evaluations, or provider state.

## Explicit Non-Goals

- Auth UI, onboarding, invitations, MFA, organization administration, billing, or membership mutation.
- Policy authoring, admin mutation routes, policy database schema, cross-workspace memory, cloud learning, or provider sharing.
- Automatic workspace selection, automatic learning activation, preference creation, influence activation, rollback, or provider calls.
- A frontend Supabase SDK or browser-readable provider/session token.

## Acceptance Gates

- TDD proves valid same-workspace disclosure and `401`, `404`, and `503` fail-closed paths.
- Tests prove bearer credentials no longer authorize the browser route and no secret appears in responses.
- Existing B9.1 denial precedence and user-control tests remain green.
- Live smoke proves login → explicit workspace policy read → logout → policy read denied.
- Production deployment verifies HTTPS and `Secure` cookie configuration before release.

## Consequences

B9.2 removes the temporary browser-ineligible credential bridge without adding an auth SDK, a second session, or policy administration. Its controlled live smoke passed; production HTTPS/secure-cookie verification remains a deployment gate.

## Affected Baseline Documents

- `docs/brain/auto-learner-mode.md`
- `docs/components/auth-user-system.md`
- `LOCKED_BASELINE.md`
