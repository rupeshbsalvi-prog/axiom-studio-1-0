# Axiom Studio 1.0

Axiom Studio 1.0 is an active React/Vite and FastAPI implementation of an AI-native creative operating system. It combines a cinematic public landing experience, a governed multi-studio workspace, portable AXPKG projects, and the human-controlled Axiom Imagine X planning layer.

## Authority Principle

AXPKG owns portable project durability. Axiom Imagine X proposes intelligence. Users and governed semantic runtime gates authorize state changes. Provider execution, preference learning, and projection apply/rollback remain explicit actions.

## Current Implementation

- Public Landing Experience with a persistent WebGL scene, scroll-driven Experience Director, reduced-motion handling, and Workspace entry.
- Workspace Hub and Mission Control with local project creation, AXPKG import/export, runtime registry, projections, apply/rollback, and replay/audit panels.
- Thirteen registered studio modes. Five have first-party runtime panels: Axiom AI, Brain X, Photo, Vector, and Motion; the remaining modes currently use the shared fallback canvas.
- Photo Studio is the flagship vertical with editable layers, governed provider-job boundaries, durable asset metadata, crash recovery, and a bounded FastAPI adapter. Live OpenAI image execution remains paused.
- Axiom Imagine X includes local planning, Guardian preflight, Photo proposal bridging, consent-gated preference candidates, reversible influence, read-only evaluation, the completed B8 decision gate, and the completed B9 effective workspace learning-authority enforcement and secure session bootstrap.
- Auth A1 provides server-side Supabase PKCE exchange, an independent opaque FastAPI session, logout/revocation, and RLS-scoped read-only workspace membership resolution. Auth UI A2 implements explicit public/local/login/session/workspace-selection/switch/logout entry without browser token storage or inferred workspace choice; its controlled live UI smoke passes. The approved Auth roadmap is closed at A2; no A3 is defined.
- Render Free is the live-verified preview target at `https://axiom-studio-58k2.onrender.com`: managed HTTPS, secure server-session cookies, explicit workspace policy read, logout, and denied post-logout access pass. Auth/photo sessions and asset binaries use Supabase persistence; provider-job coordination remains ephemeral, so the service stays preview-only.
- Production Security & Observability S1 is implemented locally: planner APIs require the configured workspace session, login starts are rate-limited per client, inputs are bounded, errors are correlated and sanitized, production docs are disabled, security headers and structured request logs are native, readiness checks Supabase, and generated assets have durable owner/expiry metadata plus authorized deletion. The Supabase migration and live Render smoke remain pending.
- The Ultimate Brand System is preserved under `creative/brand-system/` as a validated draft candidate; current production tokens, typography, logo, and runtime components remain authoritative until an explicit promotion checkpoint.
- `AX-CORE-001 v1.0.0` is frozen for the approved GLB/USDZ scope. Foundation Release 2 identity work is paused after the approved logomark integration.

## Verified Baseline — 2026-08-02

- Production build passes.
- TypeScript check passes with zero errors.
- Vitest: 95 suites / 825 tests pass.
- FastAPI pytest: 131 tests pass with 91% coverage.
- Production dependency audit reports zero vulnerabilities.
- PostCSS is patched to 8.5.25 through the existing Vite dependency graph.

## Current Boundaries

- The product is not public-launch ready: live production deployment verification, billing, marketplace, desktop packaging, collaboration, and most studios remain incomplete.
- Photo live-provider execution stays disabled until explicitly resumed and successfully verified against provider capacity.
- B7/B8 evaluation data cannot infer or execute learning, activation, or rollback decisions.
- B9.2 now exposes the B9.1 policy snapshot through an explicit-workspace, read-only, opaque-session-authenticated endpoint. Its controlled live login/policy/logout/denial checkpoint passes; missing, invalid, expired, and cross-workspace sessions fail closed, and bearer credentials no longer authorize the route.
- Unsupported Axiom Core exports such as FBX, SVG, Lottie, and WebM are deferred rather than fabricated.

## Run Locally

```powershell
npm install
npm run dev
```

Quality checks:

```powershell
npm run build
npm test
.\.venv\Scripts\python.exe -m pytest apps\api\tests -q
npm audit --omit=dev --audit-level=high
```

The read-only `GET /api/workspaces/{workspaceId}/learning-policy` endpoint uses the opaque Axiom application-session cookie and discloses policy only for an explicit active session membership. It accepts no bearer bootstrap credential, performs no workspace inference, and returns only the verified snapshot consumed by the trusted workspace host.

During local development, Vite proxies `/api` to the server origin derived from the configured `AXIOM_AUTH_CALLBACK_URL`; the value remains server-side and is not exposed to browser code.

## Documentation Map

- [Documentation Index](docs/README.md)
- [Locked Baseline Policy](LOCKED_BASELINE.md)
- [Project Rules](PROJECT_RULES.md)
- [Current Handoff](docs/memory/future-agent-memory.md)
- [Implementation Log](docs/memory/implementation-log.md)
- [Product Roadmap](docs/product/product-roadmap.md)
- [Runtime Compatibility Matrix](src/platform/COMPATIBILITY_MATRIX.md)

## Source References

The sibling prototype projects remain read-only references. Patterns may be extracted only through the governed phase and ADR process described in `PROJECT_RULES.md`.
