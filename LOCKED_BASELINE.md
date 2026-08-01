# Locked Baseline Policy

[Back to docs index](docs/README.md)

## Purpose

The first documentation set is the baseline contract for Axiom Studio 1.0. It prevents drift while the product is built phase by phase.

> **Baseline Update (ADR-0004, 2026-08-01):** `creative/brand-system/` is accepted as a draft candidate/reference package. It is not a locked runtime brand authority; existing token, identity, and asset authorities remain unchanged pending explicit promotion.

> **Baseline Update (ADR-0005, 2026-08-01):** B9.2 is implemented and live-verified as a read-only, same-origin, session-bound workspace-policy bootstrap with explicit workspace context and no inferred automation. The approved B9 scope is complete; no B9.3 is defined.

> **Baseline Update (ADR-0006, 2026-08-01):** Auth UI A2 is implemented and live-verified as an app-level, server-session-backed entry gate with explicit local entry, explicit login/logout, and explicit membership selection. It cannot infer or remember a workspace. The approved Auth A1/A2 roadmap is complete; no A3 is defined.

> **Baseline Update (ADR-0007, amended 2026-08-01):** Render Free is the selected preview deployment target: one same-origin Docker web service with managed TLS and ephemeral runtime data. It is approved only for the live auth smoke checkpoint; durable production deployment remains unselected.

## Locked Documents

The following are locked after creation:

- `docs/architecture/*.md`
- `docs/product/*.md`
- `docs/enterprise/*.md`
- `docs/brain/*.md`
- `docs/components/*.md`
- `docs/studios/*.md`
- `docs/phases/*.md`
- `PROJECT_RULES.md`
- `LOCKED_BASELINE.md`

## Allowed Changes

Small typo fixes are allowed directly.

Meaningful changes require:

1. Create an ADR in `docs/adr/` using `ADR_TEMPLATE.md`.
2. Add a dated note to `docs/memory/decision-log.md`.
3. Update the affected document with a short "Baseline Update" note that references the ADR.

## Future Agent Instructions

Before implementation, read:

1. `README.md`
2. `PROJECT_RULES.md`
3. `LOCKED_BASELINE.md`
4. `docs/README.md`
5. The relevant phase, component, studio, and architecture documents.

Do not silently reinterpret the locked baseline. If implementation reveals a better design, record it as an ADR first.

## Locked Platform Baseline

Phase 17 — Product UI for Projection Apply/Rollback — Locked

Verified:
- 506 tests passed
- npx tsc --noEmit passed with 0 errors
- npm run build passed
- security scan passed for projection UI paths
- schemaVersion preserved at 0.5.0
- apply requires projection-scoped confirmation
- rollback is disabled for rolled_back mutations
- no dynamic import/moduleUrl/eval/new Function/script/iframe execution in apply/rollback path

Phase 18 — Motion Studio Runtime-Backed Studio MVP — Locked

Verified:
- 527 tests passed (exceeding Phase 17 baseline of 506)
- npx tsc --noEmit passed with 0 errors
- npm run build passed (Vite production bundle generated successfully)
- security scan passed (0 dynamic imports, moduleUrl, eval, new Function, script, or iframe tags in motion paths)
- schemaVersion preserved at 0.5.0
- canUseProviders is set to false in the motion manifest, blocking provider execution in Phase 18
- MotionPanel dispatches previews via dispatchDryRunAction only and uses active promoted runtime id mock-motion-studio
- If no active promoted runtime exists, MotionPanel renders a guarded banner and disables dispatch
- Denied or failed dispatch results do not enter the canvas preview review queue
- MotionPanel does not duplicate projection approval, apply, or rollback forms/code

Phase 19 — Vector Studio Runtime-Backed Transition MVP — Locked

Verified:
- Focused Vector tests: 23 / 23 passed
- Full suite: 68 files / 544 tests passed (exceeding Phase 18 baseline of 527)
- npx tsc --noEmit passed with 0 errors
- npm run build passed
- Security grep passed across src/app/studios/vector, src/runtime, and src/workspace

Security boundary:
- VectorPanel uses dispatchDryRunAction only
- VectorPanel does not call dispatchRuntimeAction
- mock-vector-studio exists in LOCAL_RUNTIME_ACTIONS
- mock-vector-studio was not added to LOCAL_RUNTIME_EXECUTORS
- provider-backed generation remains blocked by canUseProviders: false
- dry-run vector preview is allowed without provider execution
- primary AI composition no longer calls vectorApi generation directly
- manual shape editing remains available without promoted runtime activation
- successful dry-run intake updates canvasPreview/intake state only
- authoritative canvas mutation remains owned by projection apply/rollback flow

Phase 20 — Photo Studio Runtime-Backed Transition MVP — Locked

Verified:
- Focused Photo tests: 25 / 25 passed
- Focused Vector tests: 15 / 15 passed (includes fix for pre-existing test 5 mock mismatch)
- Full suite: 69 files / 569 tests passed (exceeding Phase 19 baseline of 544)
- npx tsc --noEmit passed with 0 errors
- npm run build passed
- Security grep passed across src/app/studios/photo, src/runtime, and src/workspace

Security boundary:
- PhotoPanel uses dispatchDryRunAction only (not dispatchRuntimeAction)
- mock-photo-studio exists in LOCAL_RUNTIME_ACTIONS only
- mock-photo-studio was NOT added to LOCAL_RUNTIME_EXECUTORS
- "Analyze Intent" (planPhotoComposition) is NOT gated — remains offline-safe
- Only "Approve & Generate Layout" is gated behind promoted Photo runtime activation
- PhotoPanel resolves the active promoted runtime via getAllActivatedRuntimes() — does not assume studio id equals runtime id
- dry-run photo layout dispatch uses actionId "generatePhotoLayout"
- successful dry-run intake routes preview through CanvasPreviewIntakeService
- intake updates canvasPreview / serializeCanvasPreviewState only — no authoritative canvas mutation
- PhotoPanel does not call applyCanvasProjectionToDraft or rollbackCanvasProjectionMutation
- provider-backed generation is blocked; no generatePhotoComposition() call in the gated path
- VectorPanel.tsx minor hardening: diagnostics access uses optional chaining to guard against absent diagnostics array

Phase 21 — Photo Provider Request Staging Contract — Locked

Verified:
- Focused Photo provider/request tests: 30 / 30 passed
- Focused Photo/provider/runtime regression: 60 / 60 passed
- npx tsc --noEmit passed with 0 errors
- npm run build passed
- Security grep passed across Phase 21 photo/runtime paths

Security boundary:
- PhotoPanel builds a `photo-provider-request.v1` manifest from the approved plan before dry-run dispatch
- Provider request manifests require user approval but are not approved for provider execution
- Provider request manifests preserve `dryRun: true`, `providerExecutionAllowed: false`, `providerExecuted: false`, and `noExecutionPerformed: true`
- `generatePhotoLayout` receives `{ plan, providerRequest }` and stages provider metadata only
- Runtime preview metadata records provider request staging without executing providers
- No call to `generatePhotoComposition()` was reintroduced in the gated Photo approval path
- `mock-photo-studio` remains outside `LOCAL_RUNTIME_EXECUTORS`

Phase 22 — Photo Provider Adapter Contract — Locked

Verified:
- Focused Photo adapter tests: 5 / 5 passed
- Focused Photo/provider/runtime regression: 65 / 65 passed
- Full suite: 71 files / 579 tests passed (exceeding Phase 21 baseline of 569)
- npx tsc --noEmit passed with 0 errors
- npm run build passed
- Security grep passed across Phase 22 photo/runtime paths

Security boundary:
- Added `photo-provider-adapter.v1` descriptor contract and `photo-provider-adapter-job.v1` job envelope
- Adapter descriptors must support image generation, transparent background, and layered output
- Adapter descriptors must require explicit approval, execute outside runtime mock, and store no secrets
- Adapter jobs require `userConfirmedProviderExecution: true` before `providerExecutionAllowed` can be true
- Adapter jobs are still non-executed envelopes at creation time: `providerExecuted: false`, `runtimeCodeLoaded: false`, and `moduleUrlExecuted: false`
- Phase 21 dry-run previews now declare `requiredAdapterContract: "photo-provider-adapter.v1"` in metadata
- No provider execution path was added to `mock-photo-studio` or `LOCAL_RUNTIME_EXECUTORS`

Phase 23 — Photo Provider Approval Gate — Locked

Verified:
- Focused Photo provider approval tests: 5 / 5 passed
- Focused Photo/provider/runtime/workspace regression: 90 / 90 passed
- Full suite: 72 files / 587 tests passed (exceeding Phase 22 baseline of 579)
- npx tsc --noEmit passed with 0 errors
- npm run build passed
- Security grep passed across Phase 23 photo/runtime/workspace paths

Security boundary:
- Added explicit `approvePhotoProviderRequest` gate for staged Photo provider requests
- Provider approval requires `userConfirmedProviderExecution: true`
- Successful approval creates a validated `photo-provider-adapter-job.v1` envelope
- Adapter jobs are persisted under `project.studios.photo.providerAdapterJobs` by the user-facing Projections Manager gate
- Approval requested/completed/failed events are recorded in workspace audit
- Replay panel shows provider approval events under Runtime, Projections, and Errors where appropriate
- Provider jobs still preserve `providerExecuted: false`, `runtimeCodeLoaded: false`, and `moduleUrlExecuted: false`
- No real provider execution path was added

Phase 24 — Photo Provider Job Persistence Schema — Locked

Verified:
- Focused persistence block tests: 8 / 8 passed
- Focused migration tests: 5 / 5 passed
- Focused import/sanitization tests: 5 / 5 passed
- Full suite: 73 files / 603 tests passed (exceeding Phase 23 baseline of 587)
- npx tsc --noEmit passed with 0 errors
- npm run build passed
- Security invariants validated and non-executed envelopes strictly preserved

Security boundary:
- Project schemaVersion bumped to 0.6.0
- Persistence block at `project.photoProvider` stores approved, non-executed provider adapter jobs
- Capped at maxPhotoProviderJobs (50), older records trimmed on import
- Legacy `providerAdapterJobs` in studios.photo lifted and stripped during 0.5.0 → 0.6.0 migration
- Validation checks contractVersion, ready status, and strict falseness of execution flags (providerExecuted, runtimeCodeLoaded, moduleUrlExecuted)
- No provider execution path added

Phase 25 — Photo Provider Sandbox Simulation Contract — Locked

Verified:
- Focused sandbox service tests: 10 / 10 passed
- Focused persistence block tests: 9 / 9 passed
- Focused projections panel tests: 5 / 5 passed
- Full suite: 74 files / 622 tests passed (exceeding Phase 24 baseline of 603)
- npx tsc --noEmit passed with 0 errors
- npm run build passed
- Security grep passed across src/app/studios/photo, src/app/projects, src/workspace, and src/runtime paths

Security boundary:
- Project schemaVersion bumped to 0.7.0
- Persistence block at `project.photoProvider.sandboxRuns` tracks sandbox run records
- Capped at maxPhotoProviderSandboxRuns (50), older records trimmed on import
- Offline sandbox simulation contract enforces that parent provider job and sandbox run flags remain false:
  - providerExecuted: false
  - runtimeCodeLoaded: false
  - moduleUrlExecuted: false
  - networkAccessed: false
  - providerApiCalled: false
- PhotoProviderSandboxService routes output preview layers through CanvasPreviewIntakeService
- Sandbox runs store metadata and candidate IDs only (no base64, bitmaps, or executable objects)
- PhotoProviderSandboxService does not write directly to authoritative canvas or canvasPreview.projections
- No calls from sandbox simulation to applyCanvasProjectionToDraft, rollbackCanvasProjectionMutation, dispatchRuntimeAction, or provider API calls (completely offline-safe)
- 0.6.0 migrates to 0.7.0 with jobs preserved, 0.5.0/legacy lifts old jobs into 0.7.0 jobs, and future 0.8.0 schemas are rejected

Phase 26 — Photo Provider Sandbox Result Review, Replay, and Provenance Hardening — Locked

Verified:
- TypeScript: 0 errors
- Full suite: 75 files / 634 tests passed
- Production build: passed
- Expanded security grep: passed with only allowed comments/tests/core definitions

Implemented:
- SandboxProvenanceV1 and isSandboxProvenanceV1
- Immutable candidate provenance candidateId injection
- Provenance propagation through candidate → assembly plan → projection → applied mutation/audit metadata
- WorkspaceProjectionsPanel sandbox evidence UI, candidate traceability, run comparison, invalid provenance warning, and non-sandbox fallback
- WorkspaceReplayPanel Sandbox filter and structured sandbox event details

Security boundary:
- No live provider execution
- No network calls
- No provider API calls
- No runtime package execution
- No dispatchRuntimeAction from sandbox flow
- No LOCAL_RUNTIME_EXECUTORS path from sandbox flow
- No direct canvas/projection mutation outside existing projection apply/rollback
- providerExecuted, runtimeCodeLoaded, moduleUrlExecuted, networkAccessed, and providerApiCalled remain false

Phase 27 — Photo Provider Live Readiness Policy Gate — Locked

Verified:
- TypeScript: 0 errors
- Full suite: 76 files / 646 tests passed (exceeding Phase 26 baseline of 634)
- Production build: passed
- Expanded security grep: passed (eligibleForExecution is absent; liveExecutionAvailable is false; executionBlockedByPhasePolicy is true)

Implemented:
- PhotoProviderReadinessPolicyTypes.ts and PhotoProviderReadinessPolicyService.ts
- In-memory transient mock credential staging registry (stageMockProviderCredential, clearMockProviderCredential, hasMockProviderCredential)
- verifyReadiness method implementing 10 policy-only safety check rules (Approved Job, User Consent, Status, Non-Execution, Sandbox Run, Sandbox Provenance, Risk Limits, Gated Capabilities, Mock Credential, Rollback ready target count, and Isolated Environment Policy)
- Projections Manager UI readiness checklist, credential staging controls, verify button, and policy block warning text
- WorkspaceReplayPanel readiness audit check events support (filters, counts, icons, and detailed card layout)

Security boundary:
- Dry-run policy-only readiness checking; no live provider adapter execution implemented or enabled
- Project schema version strictly conserved at 0.7.0 (no schema version bump)
- transient, in-memory mock credential storage only; no secrets or reports stored, written, logged, or exported
- liveExecutionAvailable remains false in all production code paths
- executionBlockedByPhasePolicy remains true in all production code paths
- providerExecuted, runtimeCodeLoaded, moduleUrlExecuted, networkAccessed, and providerApiCalled remain false in all production code paths

Phase 27S — Emergent Security Audit Before Phase 28A — Locked

Verified:
- Emergent security audit skill reviewed with five-pass launch/security checklist
- TypeScript: 0 errors
- Focused security regression tests: 3 files / 57 tests passed
- Full repository doctor: 100/100 health score
- Doctor gates passed: package build, Vitest suite, API Extractor, bundle budget, design token audit, manifest generation
- Python API compile check passed across `apps/api`
- API unit tests passed: 10 / 10
- High-confidence secret scan found no committed OpenAI, Google, GitHub, AWS, or private key material
- `.env` scan found no committed environment file in the project root

Implemented:
- Added a live authority invariant requiring both:
  - `executionBlockedByPhasePolicy === false`
  - `liveExecutionAvailable === true`
- Preserved Phase 27 production behavior where readiness may pass but live execution remains blocked
- Updated Projections Manager UI so a passed readiness report still shows `Execute Live (Phase 28 Policy Block)` when policy blocks live execution
- Added regression coverage preventing policy-blocked readiness from calling the live execution service or gateway fetch
- Hardened API CORS defaults from wildcard methods/headers to explicit method/header lists
- Added config validation rejecting wildcard CORS origins while credentialed CORS is enabled

Security boundary:
- Phase 28 live-provider service files may exist in source for contract development, but they are not production-authorized from Phase 27 readiness reports
- A readiness pass alone cannot authorize provider network execution
- Phase 28A must introduce an explicit live-enabled readiness/authority transition before any live adapter dispatch can be considered releasable
- CORS remains localhost-scoped by default and no longer allows wildcard methods or headers

Phase 28A — Photo Provider Adapter Live Integration MVP — Locked

Verified:
- TypeScript: 0 errors
- Focused Photo provider and workspace tests: 12 files / 139 tests passed
- Full suite: 240 suites / 717 tests passed (exceeding Phase 27 baseline of 646)
- Repository doctor and production build: passed
- Dependency audit: 0 vulnerabilities
- Security scan: live-policy activation exists only in `PhotoProviderLiveEnablementService`; gateway location remains environment-resolved

Implemented:
- Added `PhotoProviderLiveEnablementService` as the sole explicit transition from blocked readiness to live-enabled authority
- Added transient, job-bound `photo-provider-live-enablement.v1` evidence with actor, timestamp, and network acknowledgement
- Required valid enablement evidence in `PhotoProviderLiveAuthorityService`; mismatched or absent evidence fails closed
- Added an explicit `Enable Live Execution` UI action between readiness verification and provider execution
- Preserved separate second confirmation and Execute actions; enablement itself performs no network or provider call
- Added audit evidence for successful and denied enablement without credentials, endpoints, or request payloads

Security boundary:
- A readiness pass alone cannot authorize live execution
- Boolean live flags alone cannot authorize live execution without job-bound enablement evidence
- Enablement reports remain transient UI state and are not written to AXPKG
- Gateway calls remain route-allowlisted, environment-resolved, metadata-only, and fail closed when configuration is absent
- Parent job security flags and the authoritative canvas remain unchanged by enablement and live preview intake

Phase 28B — Authenticated First-Party Photo Gateway Contract — Locked

Verified:
- TypeScript and production build: passed
- Focused authenticated gateway tests: 2 files / 30 tests passed
- Python API tests: 15 / 15 passed, including 5 new gateway integration tests
- Full suite: 81 files / 721 tests passed (exceeding Phase 28A baseline of 717)
- Design-token audit and all 3 generated manifest gates: passed
- npm dependency audit: 0 vulnerabilities
- Python source compile: passed

Implemented:
- Added `/api/photo/provider-gateway` as the first-party, authenticated Photo gateway boundary
- Added constant-time bearer validation with fail-closed backend configuration
- Added strict Pydantic request bounds and rejection of extra or credential-bearing fields
- Added process-local, per-client fixed-window rate limiting with `Retry-After`
- Kept provider and asset-signing credentials exclusively in backend environment settings
- Added HMAC-signed, short-lived, same-origin asset references without absolute provider URLs
- Required a runtime access token at the frontend gateway and execution boundaries; no token is read from `VITE_*` configuration
- Rejected unsigned, absolute, data-URI, malformed, and expired asset references before canvas preview intake
- Prevented missing-auth attempts from creating live-run records or false network/provider execution evidence

Security boundary:
- No provider credential, signing secret, or gateway bearer token is written to request bodies, project state, audit metadata, or AXPKG
- Gateway dispatch fails closed when authentication, provider credential, signing secret, route, or endpoint configuration is absent
- The current rate limiter is process-local and must move to shared infrastructure before multi-worker deployment
- Phase 28B defines signed asset-reference intake; durable asset delivery/storage remains outside this phase
- Python dependency vulnerability scanning remains unverified because `pip-audit` is not installed in the workspace

Phase 28C — Authenticated Session and Signed Asset Delivery Integration — Locked

Verified:
- TypeScript and production build: passed
- Focused browser/session/workspace tests: 4 files / 63 tests passed
- Python API tests: 22 / 22 passed
- Full suite: 82 files / 726 tests passed (exceeding Phase 28B baseline of 721)
- Design-token architecture audit and manifest generation: passed
- npm dependency audit: 0 vulnerabilities
- Python source compile: passed
- Runtime cleanup check: API tests leave no SQLite or asset artifacts behind

Implemented:
- Added opaque, revocable Photo gateway sessions exchanged from the bootstrap bearer credential
- Added HttpOnly, SameSite=Strict session cookies with configurable Secure mode and TTL
- Added SQLite-backed session and rate-limit state shared across API workers on one host
- Added filesystem-backed SVG asset persistence with atomic writes and restart-safe lookup
- Added HMAC signature and expiry verification on `/api/photo/assets/{asset_id}` delivery
- Added logout/session revocation and private no-store asset responses
- Added browser session exchange and credentialed cookie dispatch without forwarding the bearer to generation
- Added forward-only `0001_photo_gateway.sql` and checksum-protected `schema_migrations` history
- Closed SQLite connections deterministically to prevent WAL locks and runtime debris

Security boundary:
- Bootstrap bearer credentials are used only for session exchange and never enter cookies, URLs, project state, or AXPKG
- Gateway sessions are opaque, hashed at rest, expire, and can be revoked
- Signed asset references expose no filesystem path or provider credential
- SQLite coordinates multiple workers sharing one runtime directory; multi-host deployment still requires external shared session/rate/object storage
Phase 29 — Async Photo Provider Job Lifecycle and Adapter Boundary — Locked

Verified:
- Focused async provider/adapter tests: 15 / 15 passed
- Full Python API test suite: 33 / 33 passed (exceeding Phase 28C baseline of 22)
- Full Vitest suite: 83 suites / 733 tests passed (exceeding Phase 28C baseline of 726)
- TypeScript: 0 errors (`npx tsc --noEmit` passed successfully)
- Production build: passed
- npm dependency audit: 0 vulnerabilities

Implemented:
- Added SQLite-backed asynchronous job queue (`0002_photo_provider_jobs.sql`) to track queued, processing, completed, failed, and cancelled job statuses.
- Added `MockProviderAdapter` and fail-closed `StubRealProviderAdapter` with dynamic resolver factory.
- Restored POST `/api/photo/provider-gateway` returning 202 Accepted for enqueuing jobs.
- Added session-isolated GET and DELETE `/api/photo/provider-jobs/{jobId}` for polling and cancellation.
- Added transient retry policy (max 2 retries) and stale job sweeper.
- Added frontend polling service (`PhotoProviderJobPollingService.ts`) and async lifecycle UI panel integrations.

Security boundary:
- No endpoint URL, provider credential, signing secret, prompt text, or raw provider response is stored in SQLite, logged, or returned in responses.
- Enqueue action fails closed with a 503 HTTP status immediately if required server secrets or provider API keys are missing.
- Access to jobs is session-isolated; mismatched caller hashes return a 404.
- Queued job cancellations return 204 and create no `liveRunRecord` in project draft history.
- Processing or terminal cancellations are rejected with a 409 Conflict.
- Polling timeouts do not mutate project draft history or issue cancellation requests.
- Parent job security flags (`providerExecuted`, `runtimeCodeLoaded`, `moduleUrlExecuted`) remain false until the provider boundary was actually attempted at terminal states.

Phase 29P — Ponytail Architecture and UX Simplification Review — Locked

Verified:
- TypeScript: 0 errors (`npx tsc --noEmit` passed successfully)
- Focused WorkspaceProjectionsPanel tests: 43 / 43 passed
- Full Vitest suite: 83 suites / 745 tests passed (exceeding Phase 29 baseline of 733)
- Production build: passed
- Production scope: Limited strictly to three approved files (`src/workspace/WorkspaceProjectionsPanel.tsx`, `src/styles.css`, and `src/workspace/tests/WorkspaceProjectionsPanel.test.tsx`)
- Manual accessibility and layout gates: Passed (keyboard summary disclosures via Enter/Space, focus outline visibility, independent expansion, narrow/wide usability, diagnostic wrapping, and text-based async statuses)

Implemented:
- Native HTML5 `<details>` and `<summary>` elements replacing custom React toggle states (`showPolicyDetails`, `compareJobsState`, `expandedSandboxRunId`).
- Selectively extracted stable repeated presentation styles from [WorkspaceProjectionsPanel.tsx](file:///c:/Users/Rupesh%20Salvi/Downloads/Google%20Antigravity/Project%20Axiom%20Studio/Axiom%20Studio%201.0/src/workspace/WorkspaceProjectionsPanel.tsx) to [styles.css](file:///c:/Users/Rupesh%20Salvi/Downloads/Google%20Antigravity/Project%20Axiom%20Studio/Axiom%20Studio%201.0/src/styles.css) under strictly namespaced `.workspace-projections-panel` CSS while retaining truly computed styles inline.
- Finite CSS modifier classes for job status pill coloring (`--queued`, `--processing`, `--completed`, `--failed`, `--cancelled`).
- Constrained diagnostic containers using overflow-wrap, word-break, and min-width safeguards to prevent horizontal overflow.
- Added regression coverage for native disclosure behavior, default collapsed states, keyboard accessibility, independent expansion, diagnostic wrapping, layout bounds, and async status rendering.

Security boundary:
- No changes to API routes, backend services, or project schema `0.8.0`.
- Preserved existing polling, timeout (120s), interval (2s), retry, and cancellation constraints.
- Ponytail was used only as an agent-review methodology. It was not installed, imported, added to package.json, or introduced as a production dependency.
