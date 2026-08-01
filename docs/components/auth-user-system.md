# Auth User System

[Back to docs index](../README.md)

## Purpose

Represent user identity, sessions, roles, permissions, and onboarding state.

## User-Facing Behavior

Auth A1 supports backend login start, Supabase callback completion, authenticated session reads, sign-out/revocation, and active workspace membership disclosure. Auth UI A2 provides explicit login, session disclosure, workspace selection, switching, and logout. Signup and onboarding remain deferred.

## Required UI Regions

Auth modal/page, profile menu, onboarding flow, permission messages.

## Required Data/State

User identity, opaque application session, active workspace membership, role, and auth status. Supabase access tokens are transient callback inputs and are never stored in browser or project state.

## Events/Actions It Emits

Implemented API actions: login start, callback, session read, and logout. Refresh, profile update, and onboarding remain deferred.

## Dependencies

FastAPI, Supabase Auth, the `workspace_memberships` Postgres table, and its RLS SELECT policy.

## Wiring Notes

Auth does not block local documentation or offline project inspection. The application cookie is opaque, hashed at rest, revocable, bounded by TTL, `HttpOnly`, `SameSite=Lax`, and `Secure` when configured. OAuth state, the PKCE verifier, and a same-browser flow cookie are single-use. Provider tokens and the publishable key are not returned or persisted in the Axiom session database.

Routes:
- `GET /api/auth/login`
- `GET /api/auth/callback`
- `GET /api/auth/session`
- `DELETE /api/auth/session`

Required deployment configuration:
- `AXIOM_SUPABASE_URL`
- `AXIOM_SUPABASE_PUBLISHABLE_KEY`
- `AXIOM_AUTH_CALLBACK_URL`
- `AXIOM_AUTH_POST_LOGIN_REDIRECT`
- `AXIOM_SECURE_COOKIES=true` in production

Apply `apps/api/migrations/postgres/0001_workspace_memberships.up.sql` to the selected Supabase project before live login testing. The paired `.down.sql` file is the explicit rollback; deployed migrations are immutable.

## Phase Status

Auth A1 and its controlled live Supabase login/session/logout checkpoint are complete. B9.2 implements the [ADR-0005](../adr/ADR-0005-b9-2-secure-session-policy-bootstrap.md) read-only, same-origin, session-bound policy bridge, and its controlled live smoke passes. Auth UI A2 implements [ADR-0006](../adr/ADR-0006-auth-ui-a2-explicit-session-workspace-entry.md), and its controlled live UI smoke passes. The approved Auth roadmap is closed at A2; no A3 is defined.

## Auth UI A2 Roadmap Boundary

A2 keeps the public landing page and explicit local/offline workspace entry available. It adds an app-level session gate over the existing Auth A1 routes, top-level Google login navigation, authenticated identity disclosure, explicit membership selection and confirmation, explicit workspace switching, and logout.

No workspace is selected automatically, even when the session has one membership. The selected workspace and verified B9.2 policy snapshot remain in memory only and never enter AXPKG, browser storage, navigation URLs, diagnostics, or audit records. A2 adds no frontend auth SDK, account administration, membership mutation, policy editor, learning automation, or provider authority.

## Auth Roadmap Closure

Auth A1 and Auth UI A2 complete the approved identity, opaque-session, explicit workspace-entry, switching, and logout scope. Signup/onboarding, invitations, MFA, profile or account administration, membership mutation, organization administration, silent reauthentication, and remembered/default workspace behavior require a separate explicit roadmap decision. Production HTTPS and `Secure` cookie verification remain a deployment gate, not an A3 feature milestone.

[ADR-0007](../adr/ADR-0007-render-production-deployment.md) selects a single same-origin Render Free preview service with managed TLS and ephemeral runtime data. HTTPS, secure-cookie login, explicit workspace selection, policy read, logout, and denied post-logout access are live-verified; production persistence is not certified.

## Acceptance Criteria

Auth A1 returns an explicit authenticated contract or a fail-closed HTTP error. Auth UI A2 represents loading, authenticated, unauthenticated, offline, and error states.

## Locked Baseline

Changes require an ADR.
