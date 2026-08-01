# ADR-0006: Auth UI A2 Explicit Session and Workspace Entry

- Status: Accepted, implemented, and live-verified
- Date: 2026-08-01

## Context

Auth A1 and B9.2 provide live-verified server APIs for login, session disclosure, logout, active memberships, and exact-workspace learning-policy reads. The React application still enters `WorkspaceShell` without representing authentication or selecting a governed workspace.

## Decision

Auth UI A2 is the smallest browser UI over the existing server contracts:

1. Keep the public landing experience accessible without authentication. Entering the workspace opens an app-level entry gate with explicit local and authenticated choices.
2. Preserve an explicit **Continue locally** path for offline/local project work. Local entry has no authenticated workspace authority; any required workspace-learning policy remains unavailable and fails closed.
3. **Sign in with Google** performs a top-level navigation to `GET /api/auth/login`. Do not add a frontend Supabase SDK, popup token flow, or browser-readable identity credential.
4. On workspace entry and after the OAuth callback redirect, read `GET /api/auth/session` with same-origin credentials and represent checking, unauthenticated, authenticated, offline, and error states.
5. Show every active membership returned by the session contract, including its workspace ID and role. Require the user to select one and confirm entry. Never select the first, only, previous, project-associated, or URL-supplied membership automatically.
6. Keep the selected workspace ID in app memory only. Do not write it, session data, membership data, or policy data to AXPKG state, browser storage, diagnostics, analytics, or audit payloads.
7. After explicit confirmation, request `GET /api/workspaces/{workspace_id}/learning-policy` with same-origin credentials and pass only its verified snapshot to the existing workspace host. `401` returns to unauthenticated state; `404` rejects that selection; unavailable required policy enters the workspace only with B9.1's fail-closed unavailable-policy state.
8. Expose user identity, selected workspace/role, **Switch workspace**, and **Sign out** in the workspace shell. Switching always returns to explicit selection. Sign out calls `DELETE /api/auth/session`; only a confirmed `204` is presented as signed out, while failure remains visible and retryable.

## Security and Authority Invariants

- The opaque `HttpOnly` application cookie remains the only browser session credential and is never inspected by React.
- No access token, refresh token, session token, policy credential, or membership override enters JavaScript state, local/session storage, project state, URLs, logs, diagnostics, or test snapshots.
- Workspace selection grants no role or membership; the server reauthorizes the exact selected workspace for every policy read.
- Authentication and selection never enable learning, create preferences, activate influence, execute rollback, or call a provider.
- Session expiry or revocation clears in-memory workspace and policy context before another governed action.

## Explicit Non-Goals

- Signup, onboarding, invitations, MFA, profile editing, account deletion, membership mutation, or organization administration.
- Remembered/default workspace selection, silent reauthentication, refresh-token handling, background membership refresh, or cross-tab synchronization.
- Policy administration, learning-scope expansion, billing, entitlements, or provider authorization.
- Replacing the current routing system or adding a frontend auth dependency.

## Acceptance Gates

- TDD covers session checking, unauthenticated/local entry, login navigation, authenticated disclosure, explicit selection, switching, logout, and fail-closed error states.
- Tests prove no membership is selected without confirmation, including a one-membership session.
- Tests prove only the selected exact workspace is used for policy reads and policy credentials never enter browser code.
- Existing App, WorkspaceShell, B9.1, B9.2, build, and dependency checks remain green.
- A controlled live smoke proves login → session disclosure → explicit workspace selection → policy-backed workspace entry → logout → governed entry denied.
- Production deployment verifies HTTPS and `Secure` cookies before release.

## Consequences

A2 makes the existing Auth A1/B9.2 foundation usable without adding another identity authority or weakening local-first access. Its controlled live UI smoke passes; production HTTPS/secure-cookie verification remains a deployment gate.

## Affected Baseline Documents

- `README.md`
- `LOCKED_BASELINE.md`
- `docs/components/auth-user-system.md`
- `docs/components/app-shell.md`
