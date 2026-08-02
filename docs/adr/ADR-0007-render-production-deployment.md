# ADR-0007: Render Preview Deployment

- Status: Accepted; free preview live-verified
- Date: 2026-08-01

## Context

Axiom Studio needs one HTTPS origin for the React application and FastAPI auth routes. The backend persists opaque sessions, provider jobs, and generated assets in SQLite and files under `AXIOM_RUNTIME_DATA_DIR`, so a disposable serverless filesystem is not a valid production target.

## Decision

Deploy one Docker-based Render Free web service in Singapore with one instance and ephemeral runtime data under `/tmp/axiom-runtime`. FastAPI serves the built React application after all `/api` routes, keeping authentication same-origin. Render manages TLS and HTTP-to-HTTPS redirection. The preview sets `AXIOM_SECURE_COOKIES=true`, keeps provider execution disabled, and supplies Supabase and origin settings only through Render environment configuration.

Deployments remain manual. Secrets and local `.env` files never enter the image or Blueprint.

## Consequences

The target supports a zero-subscription live HTTPS/auth checkpoint without a reverse proxy. Opaque auth/photo sessions and generated asset binaries now use Supabase Free persistence; the local provider-job queue can still disappear on idle spin-down, restart, or redeploy, so the target remains preview-only.

## Acceptance Gates

- Production image builds and dependency-aware `/api/ready` passes.
- The application loads from the service HTTPS origin and HTTP redirects to HTTPS.
- Google login returns an opaque application cookie with `Secure`, `HttpOnly`, and `SameSite=Lax`.
- Session read, exact-workspace policy read, logout, and denied post-logout reads pass on the deployed origin.
- No provider token, API key, session value, or local environment file is exposed.

## Affected Baseline Documents

- `README.md`
- `LOCKED_BASELINE.md`
- `docs/components/auth-user-system.md`

## Verification

The free service at `https://axiom-studio-58k2.onrender.com` passed HTTPS health, Google login, explicit workspace selection, policy disclosure, logout, and denied post-logout policy-read checks. Live auth headers include `Secure`, `HttpOnly`, and `SameSite`; the Render workspace has no payment method, paid instance, or disk.

## Follow-Up

S1 deployment, retention migration, and controlled HTTPS/auth/readiness/asset-deletion smoke are complete. Keep the target preview-only until provider-job coordination is durable.
