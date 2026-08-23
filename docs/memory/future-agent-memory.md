# Future Agent Memory

[Back to docs index](../README.md)

## Read First

> [!CRITICAL]
> **Google Antigravity Process Execution Limit Rule**: The 15-second stop rule applies only inside Google Antigravity background processes where long-running commands do not return results. In this Codex workspace, local verification commands such as tests and builds may run to completion.

> [!IMPORTANT]
> **Ecosystem Product Strategy**: Axiom Studio must not launch as a single tool platform. It is designed as an ecosystem where **Photo Studio** is the fully operational flagship product available today, and other studios (Video, Motion, Vector, Presentation, etc.) are upcoming modules integrated into the ecosystem.

Start with `README.md`, `PROJECT_RULES.md`, `LOCKED_BASELINE.md`, and `docs/README.md`.

## Current State

The project now has both the locked documentation foundation and an initial Phase 01 React/Vite Workspace Hub / Studio Workspace shell.

The public product direction changed after Phase 01 through [ADR-0002](../adr/ADR-0002-experience-first-platform-entry.md). Do not treat the current shell as the final public first screen.

### Latest Landing Handoff — 2026-08-23

ADR-0008 adopts the approved V3 Luxury prototype as a visual reference, not runtime source. The persistent navigation, three-state responsive hero, and Brain X + Imagine X chapter now use the atelier-editorial direction. The two intelligence roles remain distinct and human approval is explicit in the visible route to specialist craft and editable output. Do not copy the prototype's bundled runtime, embedded media, internal prompt language, long essays, or unsupported capability claims.

The existing Experience Director, WEOS chapter route, AuthWorkspaceGate, optimized AVIF/WebP sequence, reduced-motion fallback, and Workspace/Studio shell remain intact. Axiom Sans source masters are not a public webfont binary; continue using native fallbacks until the font approval gate completes.

Next landing slice: create the condensed Studio Atlas with dedicated Studio routes. Automated Lighthouse budgets remain after visual migration closure.

### Latest Quality Checkpoint — 2026-08-01

The high-severity PostCSS advisory was cleared by updating the existing Vite dependency graph to PostCSS 8.5.25. The production audit reports zero vulnerabilities, the last complete Vitest baseline remains 91 suites / 813 tests, all 114 API tests pass, and the production build passes.

The top-level README and Runtime v5 compatibility matrix are now synchronized with the verified implementation. Implemented Photo, Vector, and Motion runtimes remain correctly marked certification-pending rather than certified.

The Auth A1 controlled Supabase checkpoint is complete: migration/RLS verified, Google OAuth enabled, server settings configured locally, active `local-workspace` membership seeded, session returned `200`, logout returned `204`, and post-logout session returned `401`.

B9.2 is implemented through ADR-0005 as a read-only, same-origin, opaque-session-authenticated policy request for an explicitly selected workspace. No workspace selection, learning, preference, influence, rollback, or provider action may be inferred.

The controlled B9.2 live smoke passes: authenticated session `200`, explicit `local-workspace` policy read `200`, logout `204`, and the repeated policy read `401`.

The B9 roadmap checkpoint closes the approved `off` / `local_workspace` learning-authority scope. Do not define B9.3 or infer new learning automation.

Auth UI A2 is implemented and live-verified through ADR-0006. It preserves public and explicit local entry, uses only the existing server session, and requires deliberate membership selection before policy-backed governed workspace entry. No workspace may be inferred or remembered.

The Auth roadmap closure checkpoint is complete. No A3 is defined; do not infer onboarding, remembered workspace, membership mutation, or silent authentication. Production release remains gated on HTTPS and `Secure` cookie verification.

Render is selected through ADR-0007. The production Dockerfile, same-origin static delivery, persistent-disk Blueprint, secret exclusions, production build, and all 114 API tests pass locally. Live service creation remains gated on Render sign-in, a controlled Git repository, and approval for the paid Starter service plus 1 GB persistent disk.

Recommended next step: explicitly approve the Render Google sign-in and paid service/disk creation, then connect the controlled source repository and run the live HTTPS/auth smoke.

The user-supplied Ultimate Brand System is now preserved under `creative/brand-system/` as a validated `1.0.0-draft.1` candidate. ADR-0004 keeps it separate from production tokens, typography, logo assets, CSS, and React runtime until an explicit promotion checkpoint.

### Latest Platform Handoff — 2026-07-17 (Phase 30 Locally Verified)

Phase 30's lifespan-owned Photo provider job runner, crash recovery, bounded OpenAI adapter, asset persistence, and real-Uvicorn lifecycle integration are implemented. The repository doctor reports 100/100, all 87 Python API tests pass, and npm audit reports zero vulnerabilities.

Two test-only async cleanup defects were fixed: FastAPI lifespan contexts now always exit, and the oversized streaming-response test uses an AnyIO-managed event loop. Do not change production runner or adapter behavior to suppress test teardown warnings.

Phase 30 is not yet locked. `pip-audit` is restored and clean, and all 88 Python API tests pass. A controlled live request reached OpenAI but failed closed with `billing_hard_limit_reached`; no image or durable runtime artifact was produced. The user paused the live-provider gate on 2026-07-17. Keep `AXIOM_ENABLE_OPENAI_IMAGE_PROVIDER` disabled until the user explicitly resumes it.

### Prior Platform Handoff — 2026-07-12 (Phase 29 & 29P Locked)

Phase 29 (Async Photo Provider Job Lifecycle and Adapter Boundary) and Phase 29P (Ponytail Architecture and UX Simplification Review) are **fully locked and stabilized**.

**What Phase 29P added:**
- Integrated native HTML5 `<details>` and `<summary>` elements to replace custom React state toggles (`showPolicyDetails`, `compareJobsState`, `expandedSandboxRunId`).
- Selectively extracted stable repeated presentation styles from [WorkspaceProjectionsPanel.tsx](file:///c:/Users/Rupesh%20Salvi/Downloads/Google%20Antigravity/Project%20Axiom%20Studio/Axiom%20Studio%201.0/src/workspace/WorkspaceProjectionsPanel.tsx) into [styles.css](file:///c:/Users/Rupesh%20Salvi/Downloads/Google%20Antigravity/Project%20Axiom%20Studio/Axiom%20Studio%201.0/src/styles.css) under strictly namespaced `.workspace-projections-panel` CSS while retaining truly computed styles inline.
- Added finite CSS modifier classes for status pills (`--queued`, `--processing`, `--completed`, `--failed`, `--cancelled`).
- Implemented constrained diagnostic containers using overflow-wrap, word-break, and min-width safeguards to prevent horizontal overflow.
- Added regression coverage for native disclosure behavior, default collapsed states, keyboard accessibility, independent expansion, diagnostic wrapping, layout bounds, and async status rendering.
- Cleared JSDOM state leakages by introducing `cleanup()` inside `beforeEach`, and eliminated undefined `triggerUpdate` race conditions using explicit `waitFor` hooks.

**Files changed in 29P:**
- `src/workspace/WorkspaceProjectionsPanel.tsx`
- `src/styles.css`
- `src/workspace/tests/WorkspaceProjectionsPanel.test.tsx`

**Verification metrics:**
- Standalone TypeScript check: `npx tsc --noEmit` passed with 0 errors.
- Focused WorkspaceProjectionsPanel tests: 43 / 43 passed.
- Full Vitest suite: 83 suites / 745 tests passed.
- Production build: passed.

**Security & Business Logic Preservation:**
- Preserved existing polling intervals (2s), timeout thresholds (120s), queued-only cancellation, and retry constraints.
- No changes made to API endpoints, backend services, or project schema `0.8.0`.
- Ponytail was used only as an agent-review methodology. It was not installed, imported, added to package.json, or introduced as a production dependency.

## Expected Next Phase

Auth A1, the complete approved B9 scope, and Auth UI A2 are live-verified. Their approved roadmaps are closed; no B9.3 or Auth A3 is defined. Render is selected and locally prepared as the production target; live HTTPS/`Secure` cookie verification awaits controlled account, repository, and paid-resource approval. Foundation Release 2 and Phase 30 live-provider work remain independently paused until the user explicitly resumes either stream.
The canonical platform manifest remains frozen at **Axiom Platform Runtime v5.0**; no v6.0 proposal is recorded. The planning era is complete.

> [!CRITICAL]
> **Planning Freeze Rule**: No new document may be created unless it directly enables production, testing, deployment, or user documentation. The next review will evaluate production assets and software, not specifications.

The program has transitioned to **Phase 0 – Axiom Creative Production** guided by the [Master Production Schedule](file:///c:/Users/Rupesh%20Salvi/Downloads/Google%20Antigravity/Project%20Axiom%20Studio/Axiom%20Studio%201.0/docs/runtime/master-production-schedule.md).

### Creative Library Releases:
- **Foundation Release 1.0 (Axiom Core)** (Active ▶)
  - *Goal*: Build the master **Axiom Core** platform component across eight milestones:
    - **FR1.1 (Core Geometry)**: High/low poly, runtime, and mobile meshes.
    - **FR1.2 (Material System)**: Specular properties for glass, crystal, neural energy, holographic, and metals.
    - **FR1.3 (Shader Library)**: Reusable definitions (AX-SHD-001 Glass, AX-SHD-002 Neural Flow, etc.).
    - **FR1.4 (State Engine)**: State machine model (Idle, Listening, Understanding, Planning, Generating, Collaborating, Completed).
    - **FR1.5 (Interaction Layer)**: Cursor pull radius, hover triggers, touch dynamics, accessibility modes.
    - **FR1.6 (Audio Identity)**: Ambient, thinking crystal pulse, and action sounds.
    - **FR1.7 (Export Pipeline)**: Master asset format outputs (GLB, USDZ, FBX, SVG, Lottie, WebM).
    - **FR1.8 (Runtime Validation)**: Cross-platform checks (performance budgets, degradation).
  - *Directory Structure*: `creative/axiom-core/` (sources, geometry, materials, shaders, exports, previews).
  - *Asset Rule*: **Single Source Asset Rule** (every export must originate from a single master file).
  - *Performance Targets*: Hero GLB ≤ 5MB, Runtime GLB ≤ 1MB, Texture Memory < 16MB, Draw Calls < 10, FPS: 60 (Desktop) / 30 (Mobile).
  - *Success Metrics*: Asset Reuse ≥ 90%, Compatibility 100%, Placeholders 0.

### Current Handoff — 2026-07-17

- FR1.1 Core Geometry is implemented and locally verified.
- Canonical master: `src/app/studios/axiomCoreGeometry.ts`.
- Regeneration: `npm run asset:axiom-core`.
- Delivery: `creative/axiom-core/exports/` with hero, runtime, mobile GLBs and `manifest.json`.
- The live AXCore renderer reuses the same geometry factories; do not create a parallel model source.
- FR1.2 Material System is implemented in the same canonical source with AX-MAT-001 through AX-MAT-005; the approved FR1.1 hierarchy is unchanged.
- FR1.3 Shader Library is implemented by assigning canonical AX-SHD-001 through AX-SHD-004 IDs to the existing `AXShaderRegistry` definitions and registering those IDs with the platform runtime.
- FR1.4 State Engine is implemented across `FrameState.ts` and the existing AXCore controllers. Lifecycle identity flows from runtime input to computed frame output without duplicating visual profiles.
- FR1.5 Interaction Layer is implemented in the shared frame-state module and cinematic engine. The inactive interaction value prevents false startup hover; touch and accessibility pause reset motion safely.
- FR1.6 Audio Identity is implemented as three canonical native Web Audio cues in `src/platform/audio/AxiomCoreAudio.ts`. It is gesture-locked, mute-safe, dependency-free, and not auto-started.
- FR1.7 now delivers validated GLB and USDZ hero/runtime/mobile tiers from the single master source. The manifest declares only these two formats.
- FBX, SVG, Lottie, and WebM remain deferred because the required local conversion/render tooling is unavailable; do not fabricate these outputs.
- FR1.8 Runtime Validation is implemented as a mandatory generation gate. All GLB/USDZ tiers reload successfully with Three.js and preserve hierarchy, animation, and strict degradation.
- The deterministic export manifest reports `fpsMeasured: false` for its Node gate. Separate local-device evidence now exists in `creative/axiom-core/runtime-validation.json`: desktop High 65 FPS at 1280x720/DPR 1 and mobile Low 97.07 FPS at 390x844/DPR 1, with zero browser console errors.
- These measurements are not universal certification; uncontrolled DPR 2.25 samples were 38-41 FPS.
- `AX-CORE-001 v1.0.0` is Frozen for the approved Foundation Release 1.0 scope: GLB/USDZ delivery and local Chromium/loader certification. FBX/SVG/Lottie/WebM, static icon/favicon work, high-DPR High optimization, and broader device certification remain deferred and must not be claimed as FR1 deliverables.
- **Foundation Release 2.0 (Identity System)**
  - *Goal*: Build the complete brand logos, custom typography tokens, colors, glass language, cursors, and icons.
  - *Current*: FR2.2 integrates approved AX-LOGO-001 across the favicon, landing navigation, and workspace spine. The user paused FR2 on 2026-07-26; the ADLS/token color mismatch remains when identity work resumes.
- **Imagine X B4 (First Vertical Workflow)** (Complete ✓)
  - *Current*: B4.3 completes the local Photo vertical: governed proposal, explicit review/apply gates, editable Photo layers, authoritative AXPKG persistence, canonical AXPKG export, and deterministic placeholder PNG export. Provider jobs and paid image execution remain behind their separate paused approval gates.
- **Imagine X B5 (Learning Engine Preview & Control Baseline)** (Complete ✓)
  - *Current*: B5.9 completes consent, candidate review, influence review, and persisted before/after preview controls.
- **Imagine X B6 (Reversible Recommendation Influence)** (Complete ✓)
  - *Current*: B6.5 completes consent-gated activation, rollback, plan integration, provenance, lifecycle audit, and immutable outcome attribution without expanding provider authority.
- **Imagine X B7 (Influence Evaluation)** (Complete ✓)
  - *Current*: B7.3 completes the read-only evaluation baseline with aggregate averages, per-source proposal separation, sample counts, and exact 1–5 distributions. No result changes preference state or authority.
- **Imagine X Roadmap Checkpoint** (Revalidated after B8.2 ✓)
  - *Decision*: B8 is complete. The implemented flow covers immutable evaluation decisions, complete local history, copied export, and selected deletion without granting automated authority. No unmet B8 requirement justifies B8.3.
  - *Excluded*: Preference-profile import is not required by the current export-portability requirement and would introduce a new profile-mutation surface. Do not add it without an explicit requirement and preview/approval design.
- **Imagine X B8 (Explicit Evaluation Decision Gate)** (Complete ✓)
  - *Current*: The user can record immutable `keep`, `rollback`, or `inconclusive` decisions, inspect every stored record with its proposal ID, timestamp, rationale, and frozen B7 evidence, include copied records in explicit profile export, and delete one selected local decision.
  - *Boundary*: Statistics never select a decision, create or revise a preference, activate an influence, or execute rollback. Existing activation and rollback controls remain separate explicit actions, and provider authority does not change.
  - *B8.2 Boundary*: History, export, and deletion are user controls only. They do not recompute evidence, edit a decision, change outcomes or proposals, create preferences, activate or roll back influence, call a provider, or infer any action from ratings or decision labels.
  - *Next*: Do not define B8.3. Run a B9 roadmap checkpoint against the unmet explicit learning-scope and workspace-policy controls in Auto Learner Mode.
- **Imagine X B9 Roadmap Checkpoint** (Complete ✓)
  - *Current*: `GET /api/workspaces/{workspaceId}/learning-policy` returns the versioned learning policy only for an explicit workspace with an exact active membership in a valid opaque application session. It fails closed, supports only `local_workspace`, accepts no bearer credential, and exposes no mutation route.
  - *B9.1*: A pure resolver now computes requested and effective local-learning authority. Personal denial always blocks learning; verified workspace denial or scope exclusion overrides consent; required-but-unavailable or mismatched policy fails closed. Brain X discloses requested state, effective state, source, and reason.
  - *Enforcement*: Effective denial blocks candidate creation and approval, influence preview approval and activation, and use of an already-applied influence in new plans. Inspection, export, selected deletion, reset, rejection, evaluation, and rollback remain available.
  - *Host boundary*: Verified snapshots propagate through `WorkspaceShell` and the lazy Studio runtime router. B9.2 replaces the temporary bearer bridge with the opaque Axiom session cookie; no policy credential enters browser code.
  - *Scope decision*: Keep `off` and `local_workspace` as the only supported choices. Do not add cross-project, organization, cloud, or provider-sharing scopes in B9.
  - *Authority decision*: Workspace learning policy must be read-only application input from a trusted server-side source. A verified workspace denial overrides personal consent; personal denial always disables learning; a workspace that requires policy fails closed when policy is missing or invalid.
  - *User-control boundary*: Policy may block creation, approval, or activation of learned influence, but must not block inspection, export, selected deletion, reset, or rollback. The UI must show requested state, effective state, policy source, and the blocking reason.
  - *B9.1 prerequisite*: Complete. Policy snapshots enter through the trusted workspace host boundary; no credential is returned to browser code.
  - *Post-B9.1 checkpoint*: Complete. Auth A1's controlled Supabase checkpoint and ADR-0005 B9.2 controlled live smoke both pass.
  - *Existing-session finding*: Photo provider sessions demonstrate opaque tokens, hashed storage, TTL, HttpOnly cookies, SameSite protection, revocation, and credentialed fetches. They authenticate provider-gateway access only; do not reuse their cookie, secret, storage, or `/api/photo` path as user/workspace identity.
  - *B9.2*: Complete and live-verified. Server-authenticated identity, authoritative membership lookup, opaque revocable session cookie, and same-origin exact-workspace policy disclosure are implemented. Production `Secure` cookie verification remains a deployment gate.
  - *Fail-closed contract*: Missing, expired, invalid, or cross-workspace sessions must never fall back to personal authority when workspace policy is required. No policy credential, session token, membership override, or admin mutation may enter project state, browser storage, diagnostics, or frontend environment variables.
  - *Auth/Workspace foundation decision*: Use Supabase Auth for user identity and a Postgres membership table for workspace/role authority. FastAPI is the backend-for-frontend and owns an independent opaque, hashed, revocable application session; the browser receives only its `Secure`, `HttpOnly`, same-origin cookie. Supabase access and refresh tokens remain server-side and must not enter local storage, project state, diagnostics, or frontend environment variables.
  - *Why this provider*: Supabase supports server-side PKCE code exchange and pairs identity with Postgres Row Level Security. Auth0 remains a viable replacement if enterprise federation becomes a demonstrated requirement. Clerk is not selected because its standard application session cookie is readable by client JavaScript, which conflicts with this checkpoint's HttpOnly browser boundary.
  - *Auth A1 scope*: Complete locally. Login start, callback, session read, logout/revocation, and read-only membership/role resolution are implemented. OAuth state and the PKCE verifier are bound to a single-use same-browser flow; the opaque application session is hashed, TTL-bound, capacity-bounded, revocable, and returns no provider token or policy credential.
  - *Membership migration*: `apps/api/migrations/postgres/0001_workspace_memberships.up.sql` creates the authoritative table, active-user RLS SELECT policy, and no browser mutation grant. It is applied and verified in the controlled Supabase project; the paired down migration remains the explicit rollback.
  - *Deferred*: Signup/onboarding UI, invitations, MFA, membership mutation, policy administration, organization administration, billing, retention controls, and provider-sharing rules. Do not add a frontend auth SDK or infer workspace selection.
  - *Next*: B9 is closed for its approved scope. Do not define B9.3 without a new explicit requirement.
- **Auth UI A2** (Complete ✓)
  - *Current*: ADR-0006 maps the existing Auth A1 and B9.2 APIs into an app-level entry gate without adding a frontend auth provider or token store.
  - *Flow*: Preserve public entry and explicit local/offline entry; offer top-level Google login; disclose the authenticated session; require membership selection and confirmation; then load the exact workspace policy before governed entry. Switching and logout remain explicit actions.
  - *Boundary*: Never default, remember, infer, or project-bind a workspace. Identity, membership, selected workspace, and policy context remain out of AXPKG, browser storage, URLs, diagnostics, and audit payloads. A2 adds no learning automation or provider authority.
  - *Verification*: 8 focused A2 tests pass above 80% coverage; App/WorkspaceShell, B9 authority regressions, TypeScript, production build, manifests, and dependency checks pass. The controlled live login/selection/policy/switch/reselection/logout/denial UI flow also passes.
  - *Closure*: The approved Auth A1/A2 scope is complete. No unmet requirement justifies A3; deferred account and authority capabilities require a separate explicit roadmap decision.
  - *Next*: Approve the controlled Render paid deployment, then verify HTTPS plus `Secure` session-cookie behavior live.
- **External Motion Export Intake**
  - *Current*: Animos is approved only as a manual browser export tool for user-owned media. Accept MP4/WebM outputs through the normal asset pipeline after rights and metadata review; do not copy its templates or code, automate uploads/exports, or treat it as a runtime dependency.
- **Foundation Release 3.0 (Creative Libraries)**
  - *Goal*: Produce reusable assets, sound packages, and visual material shaders.
- **Experience Release 1.0 (Landing Experience Kit)**
  - *Goal*: Produce landing storyboard scenes, camera paths, light rigs, and environment shaders.
- **Platform Release 1.0 (Runtime & Rendering)**
  - *Goal*: Implement core runtime APIs, rendering abstraction adapters, state services, and the event bus.
- **Studio Release 1.0 (Photo Studio)**
  - *Goal*: Launch Photo Studio as the flagship operating studio.

### Git Branching Model:
- `main` ──> `release` ──> `develop` ──> `creative` / `runtime` / `photo-studio` / `landing`

### Production & Quality KPIs:
- **Asset Reuse**: >85% | **Shared Components**: >90%
- **Performance & Accessibility Compliance**: 100%
- **Placeholder & Duplicate Assets**: 0

### Asset Tiers:
- **Tier 1 (Signature)**: Axiom Core, Logo, Hero, Brain X, Imagine X (Highest quality).
- **Tier 2 (System)**: Icons, panels, studio nodes, cards, glass (Highly reusable).
- **Tier 3 (Context)**: Backgrounds, illustrations, marketing graphics (Supplemental).

### Dynamic Review & Delivery Workflows:
Every asset is evaluated across **10 Review Dimensions** (Identity, Function, Reusability, Technical, Performance, Accessibility, Cross-platform, Motion, Emotion, Future-proofing) through a **5-Step Session Workflow**:
1. **Session A (Creative Direction)**: Establish visual, motion, and audio targets.
2. **Session B (Production)**: Asset generation and platform-specific exports.
3. **Session C (Review)**: Core assessment against the 10 dimensions.
4. **Session D (Refinement)**: Target improvements matching feedback.
5. **Session E (Freeze)**: Seal asset (e.g. `AX-CORE-001 v1.0.0 Frozen`).

### Axiom Core Success Criteria:
The Core is complete only when:
- It is instantly recognizable without text.
- It communicates intelligence without intimidating.
- It scales from a favicon to a full-screen 3D hero.
- It works as a static icon, animated object, loader, and interactive canvas centerpiece.
- It anchors the visual systems of Brain X, Imagine X, and the broader workspace.

### Creative Freeze Policy
- Assets progress through: *Research ──> Exploration ──> Concept ──> Review ──> Approval ──> Production ──> Optimization ──> Integration ──> Frozen*.
- Once an asset is **Frozen**, modifications are permitted only for critical defects, accessibility corrections, performance adjustments, or compatibility.

### Immutable Operational Rule
- **No Placeholders in Production**: No production code should introduce placeholder visuals, placeholder motion, placeholder audio, or temporary branding unless it is explicitly marked as a development-only artifact. All code must grow around approved assets from the creative library.
- **Architectural Adherence**: If a new asset, feature, or Studio cannot inherit from an existing system, improve the system—not the exception.

Work is structured into **seven master program streams**:
1. **Brand & Identity**: Core logos, wordmarks, app icon, splash logo.
2. **Creative Asset Production**: Geometry, video loops, audio library, and shaders.
3. **Experience Design**: Storyboards, interface layouts, ADLS transitions.
4. **Platform Engineering**: Axiom Runtime, Event Bus, State, Renderer abstraction.
5. **Studio Engineering**: Decoupled studio modules (starting with Photo Studio).
6. **AI & Intelligence**: Brain and Imagine runtimes, capability detection.
7. **Quality & Release**: Automation validation, regression testing.

Before continuing, read:

- `docs/product/master-requirements.md`
- `docs/product/application-entry-flow.md`
- `docs/product/landing-experience-prd.md`
- `docs/product/subscription-and-licensing.md`
- `docs/product/marketplace-and-monetization.md`
- `docs/architecture/axiom-platform-layering.md`
- `docs/architecture/cross-platform-strategy.md`
- `docs/brain/brain-master-blueprint.md`
- `docs/brain/imagine-x-evolution-strategy.md`
- `docs/brain/auto-learner-mode.md`
- `docs/brain/connector-and-mcp-framework.md`
- `docs/components/component-wiring-matrix.md`
- `docs/studios/studio-registry.md`
- `docs/architecture/shared-contracts.md`
- `docs/phases/phase-01b-landing-experience-foundation.md`
- `docs/phases/implementation-sequence.md`

## Important Warning

Do not copy large prototype files wholesale. Extract patterns and interfaces from source projects, then implement the clean Axiom Studio 1.0 version.

Do not remove the current Workspace/Studio shell when adding the Landing Experience. Add routing so public users see Landing Experience first, while authenticated or development routes can still open Workspace Hub.
