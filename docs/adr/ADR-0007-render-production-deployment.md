# ADR-0007: Render Preview Deployment

- Status: Accepted; implementation prepared, live verification pending
- Date: 2026-08-01

## Context

Axiom Studio needs one HTTPS origin for the React application and FastAPI auth routes. The backend persists opaque sessions, provider jobs, and generated assets in SQLite and files under `AXIOM_RUNTIME_DATA_DIR`, so a disposable serverless filesystem is not a valid production target.

## Decision

Deploy one Docker-based Render Free web service in Singapore with one instance and ephemeral runtime data under `/tmp/axiom-runtime`. FastAPI serves the built React application after all `/api` routes, keeping authentication same-origin. Render manages TLS and HTTP-to-HTTPS redirection. The preview sets `AXIOM_SECURE_COOKIES=true`, keeps provider execution disabled, and supplies Supabase and origin settings only through Render environment configuration.

Deployments remain manual. Secrets and local `.env` files never enter the image or Blueprint.

## Consequences

The target supports a zero-subscription live HTTPS/auth checkpoint without adding a database migration or reverse proxy. Runtime sessions, SQLite data, and generated files can disappear on idle spin-down, restart, or redeploy; this target is not approved for production or durable user data. A durable deployment requires an explicit migration to external persistence.

## Acceptance Gates

- Production image builds and `/api/health` passes.
- The application loads from the service HTTPS origin and HTTP redirects to HTTPS.
- Google login returns an opaque application cookie with `Secure`, `HttpOnly`, and `SameSite=Lax`.
- Session read, exact-workspace policy read, logout, and denied post-logout reads pass on the deployed origin.
- No provider token, API key, session value, or local environment file is exposed.

## Affected Baseline Documents

- `README.md`
- `LOCKED_BASELINE.md`
- `docs/components/auth-user-system.md`

## Follow-Up

Connect the controlled Git repository to a Render Free service, enter environment values without sharing them, deploy, and run the acceptance gates. No paid instance or disk is authorized.
