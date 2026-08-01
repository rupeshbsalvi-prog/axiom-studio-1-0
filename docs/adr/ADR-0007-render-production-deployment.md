# ADR-0007: Render Production Deployment

- Status: Accepted; implementation prepared, live verification pending
- Date: 2026-08-01

## Context

Axiom Studio needs one HTTPS origin for the React application and FastAPI auth routes. The backend persists opaque sessions, provider jobs, and generated assets in SQLite and files under `AXIOM_RUNTIME_DATA_DIR`, so a disposable serverless filesystem is not a valid production target.

## Decision

Deploy one Docker-based Render web service in Singapore on the Starter plan with one instance and a 1 GB persistent disk mounted at `/var/data`. FastAPI serves the built React application after all `/api` routes, keeping authentication same-origin. Render manages TLS and HTTP-to-HTTPS redirection. Production sets `AXIOM_SECURE_COOKIES=true`, keeps provider execution disabled, and supplies Supabase and origin settings only through Render environment configuration.

Deployments remain manual. Secrets and local `.env` files never enter the image or Blueprint.

## Consequences

The target fits the current persistence model without adding a database migration or reverse proxy. The attached disk requires paid Render capacity, restricts the service to one instance, and disables zero-downtime deploys. Horizontal scaling requires a future explicit migration away from local SQLite/file persistence.

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

Connect a controlled Git repository to Render, approve the paid Starter service and persistent disk, enter the production environment values without sharing them, deploy, and run the acceptance gates.
