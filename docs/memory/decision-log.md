# Decision Log

[Back to docs index](../README.md)

## 2026-08-01 - Render Production Target

Accepted [ADR-0007](../adr/ADR-0007-render-production-deployment.md). Render is the smallest target compatible with the current same-origin React/FastAPI application and persistent SQLite/file runtime. Use one paid Starter web service in Singapore with a 1 GB disk, managed TLS, `Secure` cookies, manual deploys, and provider execution disabled. Live creation remains gated on account, repository, and billing approval.

## 2026-08-01 - Auth Roadmap Closure

Closed the approved Auth scope after live verification of Auth A1 and Auth UI A2. No unmet requirement justifies A3. Deferred account, onboarding, membership, organization, and silent-auth capabilities require a separate explicit roadmap decision; production HTTPS and `Secure` cookie verification remain a deployment gate.

## 2026-08-01 - Auth UI A2 Explicit Entry Roadmap

Accepted, implemented, and live-verified [ADR-0006](../adr/ADR-0006-auth-ui-a2-explicit-session-workspace-entry.md). A2 preserves public and explicit local entry, uses only the existing opaque server session, and requires deliberate membership selection before governed workspace entry. It adds no frontend auth SDK, remembered/default workspace, membership mutation, or inferred learning behavior.

## 2026-08-01 - B9 Roadmap Closure

Closed the approved B9 scope after verified B9.1 effective-authority enforcement and B9.2 session-bound policy delivery. `off` and `local_workspace` remain the only learning scopes; no B9.3 or inferred learning automation is defined. Broader enterprise policy administration requires a separate explicit roadmap decision.

## 2026-08-01 - Brand System Accepted as a Draft Candidate

Accepted [ADR-0004](../adr/ADR-0004-brand-system-draft-intake.md). The complete Ultimate Brand System is preserved under `creative/brand-system/` and linked to Brand Studio and identity documentation, but its conflicting draft tokens, typography, logo rules, CSS, and optional React implementation are not runtime authorities.

## 2026-08-01 - B9.2 Secure Session Policy Bootstrap Roadmap

Accepted and implemented [ADR-0005](../adr/ADR-0005-b9-2-secure-session-policy-bootstrap.md). B9.2 replaces the temporary bearer-authenticated browser bridge with one same-origin, opaque-session-authenticated, read-only policy request for an explicitly selected workspace. It cannot infer workspace selection or automate learning, preferences, influence, rollback, or provider execution.

## 2026-06-20 - Use Axiom Studio 1.0 as Canonical Name

The new project folder and product baseline are named Axiom Studio 1.0.

## 2026-06-20 - Documentation First

The project begins with locked documents before app code.

## 2026-06-20 - ADR Updates for Locked Docs

Locked baseline documents may evolve only through dated decision records.

## 2026-06-20 - Experience First Platform Entry

Accepted [ADR-0002](../adr/ADR-0002-experience-first-platform-entry.md). Axiom Studio 1.0 now uses Landing Experience, Workspace Hub, and Studio Workspace as distinct entry layers. Phase 01 shell is reclassified as Workspace/Studio foundation.

## 2026-06-20 - Platform Layer Separation

Accepted the separation of Axiom OS Core, Axiom Brain X, Axiom Imagine X, Universal Canvas Engine, and Studios so that platform services, reasoning infrastructure, user-facing creative intelligence, and creation runtime can scale independently.

## 2026-06-20 - Monetization as Product Surface

Subscription, licensing, marketplace, and AI/compute usage are first-class product surfaces and must be represented in the Landing Experience and Workspace Hub.

## 2026-06-21 - Brain X Governance and Architecture v1.0 Close

Accepted ADR-001 through ADR-005.

### ADR-001: Cognitive Freeze
- **Decision**: Freeze the cognitive core contracts in `MissionTypes.ts` and cognitive engines.
- **Reason**: Downstream contracts must rely on a stable, non-divergent representation of cognitive truth.

### ADR-002: Explanation Boundary
- **Decision**: Introduce `ExplanationContractV1` and the UI Invariant.
- **Reason**: Decouple UI rendering from raw cognitive structures to prevent parsing and sequencing logic from leaking into presentation.

### ADR-003: Telemetry Boundary
- **Decision**: Telemetry is now derived synchronously through a pure `TelemetryEngineV1` returning `TelemetrySnapshotV1`.
- **Reason**: Prevent business metrics from leaking into the UI and ensure full unit testability.

### ADR-004: Product Constitution
- **Decision**: Enforce Product Constitution v1.0 and Artifact Layer Ownership.
- **Reason**: Protect the user's cognitive flow with immutable laws and prevent cross-layer coupling.

### ADR-005: One Extension Point
- **Decision**: Enforce a single extension point per layer.
- **Reason**: Prevent architectural sprawl and codebase decay.

## 2026-06-21 - Brain X Architecture Freeze 1.0 Complete

Accepted ADR-006.

### ADR-006: Architecture Freeze 1.0
- **Decision**: Declare Architecture Freeze 1.0 complete, locking in Platform Runtime v5, Mission v1.0, Explainability v1.0, and Telemetry v1.0. Future work is product execution.
- **Reason**: Transition engineering focus from platform evolution to product delivery and empirical UXR/PVR validation.

## 2026-06-28 - Web Experience Operating System

Accepted [ADR-0003](../adr/ADR-0003-web-experience-operating-system.md). Axiom's public entry is now defined as WEOS, a product-scoped browser-native experience operating system rather than a website or landing page.

### Experience Director Boundary

- **Decision**: Add Experience Director as a product/experience orchestration layer, not a Platform Runtime v5 service.
- **Reason**: WEOS needs coherent camera, lighting, particles, audio, chapter, quality, accessibility, and portal cues without reopening the frozen platform runtime.

## 2026-07-06 - Phase 25: Photo Provider Sandbox Simulation Contract

- **Decision**: Restrict provider job simulation to offline sandbox runs, keeping all parent execution and network flags strictly `false`. Introduce `project.photoProvider.sandboxRuns[]` under AXPKG schema version `0.7.0`.
- **Reason**: Preserve the locked non-execution invariant for provider jobs while offering safe local UI dry-run simulation capability routed through the Canvas Intake pipeline.

## 2026-07-11 - Phase 26: Photo Provider Sandbox Result Review, Replay, and Provenance Hardening

- **Decision**: Enforce strict provenance verification on sandbox-origin candidates (SandboxProvenanceV1 and isSandboxProvenanceV1 guard) and propagate it all the way to applied mutations and audit logs. Introduce offline evidence badges, safety checklists, diagnostic logs, side-by-side run comparisons, and a dedicated Sandbox replay filter tab.
- **Reason**: Hardens simulation outputs and ensures their reviewability and trace-safety, without introducing live provider execution or altering existing projection apply/rollback authorities.

## 2026-07-11 - Phase 27: Photo Provider Live Readiness Policy Gate

- **Decision**: Implement a policy-only, dry-run readiness checking engine. Manage mock provider credentials using an in-memory, transient registry. Retain the project schema version at `0.7.0` (schema conservation). Keep `liveExecutionAvailable` strictly `false` and `executionBlockedByPhasePolicy` strictly `true`. Add verify controls and safety checklists in the Projections Manager and Replay panels.
- **Reason**: Establish safety rules and policy verification at the execution boundary without executing runtime code, introducing real secrets, or altering the database schema.

## 2026-07-12 - Phase 29: Async Photo Provider Job Lifecycle and Adapter Boundary

- **Decision**: Restructure live provider execution into a fully asynchronous enqueued architecture. Retain the project schema version at `0.8.0`. Restored and migrated the POST `/api/photo/provider-gateway` endpoint to behave asynchronously and return `202 Accepted` with a `jobId`, while creating dedicated, session-isolated endpoints under `/api/photo/provider-jobs/{jobId}` for status polling and queued cancellations.
- **Reason**: Keep the POST contract compatible with Phase 28C while implementing robust async queueing, retry limits, stale job sweeping, and stateless frontend polling without leaking credentials or mutability state.

## 2026-07-12 - Phase 29P: Ponytail Architecture and UX Simplification Review

- **Decision**: Refactor presentation layout in the projections panel to utilize native HTML5 `<details>` and `<summary>` elements for collapsibles, selectively extract stable repeated presentation styles into strictly namespaced `.workspace-projections-panel` CSS while retaining truly computed styles inline, and use text-based async status modifiers instead of inline style colors. Fix JSDOM test leakages by calling `cleanup()` in `beforeEach` and waiting for async setup actions before asserting state.
- **Reason**: Adhere to Ponytail architecture principles of using browser-native capabilities before introducing React toggle states, strictly isolating stylesheet boundaries, and maintaining resilient test suites, without changing any backend enqueuing, polling, or schema boundaries.

## 2026-08-01 - Auth/Workspace Session Foundation

- **Decision**: Select Supabase Auth for user identity and Postgres for authoritative workspace membership. FastAPI will exchange the PKCE callback server-side and issue a separate opaque, hashed, revocable application-session cookie. Provider tokens remain server-side; B9.2 remains gated until this Auth A1 foundation is implemented and verified.
- **Reason**: This gives Axiom one identity-to-membership authority while preserving the required `HttpOnly` browser boundary and fail-closed workspace checks. It avoids adding a frontend auth SDK or placing provider tokens in browser or project state.
