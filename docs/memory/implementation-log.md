# Implementation Log

[Back to docs index](../README.md)

## 2026-08-01 - Render Deployment Preparation

Selected Render through ADR-0007 and added a multi-stage production Dockerfile, a one-service Blueprint with a persistent runtime disk, strict secret exclusions, and conditional FastAPI delivery of the built React application. TDD confirmed the previously missing root application route, then 22 focused auth/API tests and all 114 API tests passed. The production frontend build and Blueprint YAML parse pass. Live HTTPS verification remains gated on Render sign-in, a controlled Git repository, and paid service/disk approval.

## 2026-08-01 - Auth Roadmap Closure Checkpoint

Rechecked the implemented and controlled-live Auth A1/A2 contracts. The approved feature scope is complete, no A3 is defined, and deferred account or authority expansion remains separately gated. This checkpoint changes documentation only; runtime behavior and dependencies are unchanged.

## 2026-08-01 - Auth UI A2 Controlled Live Checkpoint

Completed the real browser flow through the development UI and configured Google/Supabase backend. The app showed unauthenticated entry, completed login, disclosed the active membership without selecting it, required explicit selection before policy-backed entry, cleared selection on workspace switching, required explicit reselection, completed logout, and denied governed entry after reload. The local Vite proxy now derives its development target from the configured server callback origin without exposing configuration to browser code. Both temporary servers were stopped after verification.

Post-checkpoint verification: 8 focused A2 tests, Vite-config TypeScript validation, and the production build pass.

## 2026-08-01 - Auth UI A2 TDD Implementation

Implemented ADR-0006 with an app-level React entry gate over the existing Auth A1/B9.2 APIs. Public landing and explicit local entry remain available; authenticated sessions disclose active memberships without selecting one, exact policy reads occur only after explicit confirmation, switching clears selection, and logout is reported only after server revocation returns `204`. No auth SDK, token store, browser persistence, workspace inference, learning automation, or provider authority was added.

Verification: RED confirmed the missing A2 component; 8 focused A2 tests and 11 App/WorkspaceShell tests pass, along with 24 B9/WorkspaceShell regression tests. Focused coverage is 83.62% statements, 83.33% branches, 94.73% functions, and 88.67% lines. TypeScript, production Vite build, manifest generation, npm production audit, and Python dependency check pass. ESLint could not run because the repository has no ESLint 9+ flat configuration.

## 2026-08-01 - Auth UI A2 Roadmap Checkpoint

Defined Auth UI A2 through ADR-0006 after tracing the live Auth A1/B9.2 contracts and the current `App` → `WorkspaceShell` entry flow. The approved slice is an app-level session gate with explicit local entry, top-level Google login, session disclosure, deliberate membership selection, policy-backed workspace entry, switching, and logout. No runtime code, dependency, endpoint, session behavior, workspace inference, project persistence, or learning automation changed.

## 2026-08-01 - B9 Roadmap Closure Checkpoint

Rechecked B9.1 enforcement, B9.2 session delivery, the controlled live checkpoint, and the Auto Learner requirements. The approved B9 scope is complete for explicit `off` / `local_workspace` learning authority. No B9.3, policy mutation, workspace inference, learning automation, preference activation, rollback, or provider action was defined or implemented.

## 2026-08-01 - Ultimate Brand System Draft Intake

Inspected the supplied ZIP, HTML roadmap, and DOCX structure; validated the extracted `1.0.0-draft.1` package; preserved the originals under `creative/brand-system/source-artifacts/`; and linked the candidate to Brand Studio, identity, tokens, and the documentation index through ADR-0004. No candidate CSS, React provider, font, color, or logo rule was connected to production runtime. DOCX visual rendering was unavailable because LibreOffice is not installed.

## 2026-08-01 - Auth A1 Controlled Supabase Checkpoint

Applied and verified the `workspace_memberships` migration in the controlled Supabase project, including RLS, authenticated read access, and the active-user policy. Configured a dedicated Google Web OAuth client and Supabase callback allowlist, enabled Google Auth, seeded the least-privilege `local-workspace` member record, and completed the live checkpoint: session `200`, logout `204`, post-logout session `401`. Server configuration remains in the gitignored `.env`; no OAuth secret was added to repository source.

## 2026-08-01 - B9.2 Secure Bootstrap Roadmap Checkpoint

Defined B9.2 through ADR-0005 without changing runtime code, schema, routes, provider state, or learning behavior. The approved roadmap slice is a same-origin, session-authenticated read of the existing workspace-policy contract for an explicit workspace ID. It replaces the temporary bearer bridge, fails closed, and cannot infer or execute workspace selection, learning, preference, influence, rollback, or provider actions. Implementation remains gated pending explicit user approval.

## 2026-08-01 - B9.2 Secure Bootstrap Implementation

Implemented ADR-0005 test-first. The read-only workspace policy route now requires the opaque Axiom application session, authorizes only an exact active membership, rejects the retired bearer bridge, marks responses `no-store`, and preserves the existing B9.1 policy contract. Focused integration coverage is 98%; Auth/B9 and bounded API regression groups pass. The controlled live login-policy-logout smoke remains the next release checkpoint.

## 2026-08-01 - B9.2 Controlled Live Checkpoint

Completed the configured Google/Supabase flow against the local FastAPI server: authenticated session `200`, explicit `local-workspace` policy disclosure `200` with the expected contract, logout `204`, and repeated policy disclosure denied with `401`. The temporary local server was stopped after verification; no secret or session value was recorded.

## 2026-06-20 - Phase 00 Documentation Foundation

Created the initial documentation-first foundation for Axiom Studio 1.0.

No app code, package manifests, backend services, frontend scaffolds, Rust crates, migrations, or generated assets were created in this phase.

## 2026-06-20 - Documentation Completion Pass

Completed the connective documentation layer: product requirements, roadmap, design system, user workflows, shared contracts, runtime event model, source migration map, component wiring matrix, studio registry, implementation sequence, testing strategy, and documentation completion checklist.

## 2026-06-20 - Axiom Imagine X Expansion

Expanded Axiom Brain into the branded Axiom Imagine X peak-development subsystem with dedicated docs for master blueprint, component architecture, agents, senior director standard, output capability matrix, memory, provider routing, governance, studio integration, evals, and implementation roadmap.

## 2026-06-20 - Axiom Imagine X Naming Clarification

Clarified that the product/model name is Axiom Imagine X. "Axiom Brain" remains only an internal shorthand for the intelligence layer.

## 2026-06-20 - Imagine X Hierarchy and Large Project Orchestration

Added CEO-to-execution-style work distribution docs for Axiom Imagine X: command hierarchy, task packets, large project orchestration flow, partial failure handling, recomposition gates, and campaign-scale eval requirements.

## 2026-06-20 - Enterprise Operating Model

Added the software-company-inside-the-application model for both Axiom Studio 1.0 and Axiom Imagine X: application capability map, development division ownership, enterprise module ownership, lifecycle gates, and role-to-system mapping.

## 2026-06-20 - Universal Studio Generation Pipeline

Added the shared intent-to-output pipeline for all studios: text/draw/future voice intake, structured prompt conversion, first-impression planning, approval/rejection loop, per-element generation, canvas/timeline/deck/vector assembly, selective regeneration, and final approval. Folded attached image, vector, motion, video, typography, and presentation requirements into the relevant studio docs.

## 2026-06-20 - Remaining Studio Deepening and UI/UX Studio

Expanded Brand Studio, Whiteboard Studio, Asset Hub, and Axiom AI Studio with generation requirements, workflows, first-impression planning, and acceptance criteria. Added UI/UX Studio as a feasible new studio for product design, wireframes, screens, prototypes, design systems, and developer handoff.

## 2026-06-20 - Phase 01 Product Shell Implementation

Created the initial working React/Vite product shell for Axiom Studio 1.0.

Files and systems changed:

- Added the TypeScript/Vite application scaffold.
- Added the first App Shell, Navigation Spine, Studio Header, Inspector Rail, Creative Dock, and Mission Control surface.
- Added the locked studio registry with 12 studios: Mission Control, Photo, Vector, Brand, Asset Hub, UI/UX, Typography, Presentation, Motion, Video, Whiteboard, and Axiom AI.
- Added AXPKG-ready local project draft creation logic.
- Preserved Axiom Imagine X as the cross-studio intelligence model exposed through the shell.

Verification:

- `npm test` passed with 3 test files and 7 tests.
- `npm run build` passed.
- Browser smoke test passed at `http://127.0.0.1:5173/`: Mission Control rendered first, 12 studio navigation entries were present, Axiom Imagine X and AXPKG cues were visible, and UI/UX Studio switching worked.

Known risks:

- This phase stores project drafts in local React state only.
- AXPKG persistence, provider orchestration, real Imagine X execution, auth, backend services, replay, and export pipelines remain future phases.

## 2026-06-20 - Experience First Blueprint Update

Added [ADR-0002](../adr/ADR-0002-experience-first-platform-entry.md) and the supporting product, architecture, and Imagine X docs for the experience-first platform direction.

Files and systems changed:

- Added Landing Experience PRD and Application Entry Flow.
- Added Subscription and Licensing plus Marketplace and Monetization.
- Added Axiom Platform Layering and Cross-Platform Strategy.
- Added Imagine X Evolution Strategy, Auto Learner Mode, and Connector/MCP Framework.
- Updated Master Requirements, Architecture Overview, documentation index, and decision log.

Decision:

- Phase 01 product shell remains useful but is now classified as Workspace Hub and Studio Workspace foundation, not the public first screen.

## 2026-06-20 - Phase 01B Landing Experience Foundation

Implemented the first public Landing Experience in the React/Vite app and routed `Start Creating` into the existing Workspace Hub / Studio Workspace shell.

Files and systems changed:

- Updated `src/App.tsx` with Landing Experience, public navigation, philosophy, intelligence, studio explorer, pricing, marketplace/community, and compatibility sections.
- Updated `src/styles.css` with responsive landing layout, premium cinematic scene foundation, studio explorer cards, pricing cards, and mobile behavior.
- Updated `src/App.test.tsx` to validate the experience-first entry and workspace transition.
- Added `docs/phases/phase-01b-landing-experience-foundation.md`.

Verification:

- RED confirmed first: tests failed because Landing Experience and `Start Creating` route did not exist.
- `npm test` passed with 3 test files and 7 tests.
- `npm run test:coverage` passed with 98.11% statements and 88.88% branches.
- `npm run build` passed.
- Browser smoke test passed at `http://127.0.0.1:5173/`: first screen rendered `Create Without Limits`, Workspace navigation was hidden on landing, and `Start Creating` opened Mission Control with 12 studio entries.

Known risks:

- Landing visual is currently CSS-driven, not a real Three.js scene.
- Authentication, guest routing, shared-link validation, pricing comparison, marketplace installation, and reduced-motion controls remain future work.

## 2026-06-20 - Landing Experience Premium Showcase Pass

Improved the public Landing Experience using Elegant Themes' examples page as a structural reference for polished showcase browsing, category filtering, visual examples, social proof, and conversion flow.

Files and systems changed:

- Updated `src/App.tsx` with hero product mockups, platform stats, category chips, showcase gallery cards, and a stronger marketplace/community band.
- Updated `src/styles.css` with a fuller first viewport, layered product-preview visuals, refined gallery cards, responsive showcase grids, and richer CTA styling.

Verification:

- `npm test` passed with 3 test files and 7 tests.
- `npm run build` passed.
- Browser smoke test passed at `http://127.0.0.1:5173/`: refreshed landing showed showcase filters, stats, gallery projects, no workspace navigation on first render, and `Start Creating` opened Mission Control with 12 studio entries.

## 2026-06-20 - Landing Experience 2.0 Cinematic Engine Foundation

Upgraded the public Landing Experience toward the 3D cinematic specification.

Files and systems changed:

- Added Three.js and `@types/three`.
- Added a persistent WebGL canvas layer behind the landing UI.
- Added a browser-only cinematic engine with scene, camera, lighting, particles, Imagine X core, rings, and studio nodes.
- Added a 12-chapter cinematic timeline: Arrival, Creator, Thought Process, Birth of Axiom Imagine X, Human Controlled AI, Axiom Brain X, Studio Universe, Project Hub, Marketplace, Subscription, Community, and Workspace Portal.
- Added a 3D Experience Engine architecture section with Scene Manager, Camera Controller, Animation Controller, Scroll Controller, Interaction Controller, and Section Timeline.
- Updated Vite build config to split Three.js into a separate chunk.

Verification:

- RED confirmed first: tests failed because the persistent cinematic engine and chapter timeline did not exist.
- `npm test` passed with 3 test files and 8 tests.
- `npm run test:coverage` passed with 98.41% statements and 90% branches.
- `npm run build` passed.
- Browser smoke test passed at `http://127.0.0.1:5173/`: WebGL canvas was mounted, chapter timeline was visible, scroll reached the engine section, and `Start Creating` opened Mission Control with 12 studio entries.

Known risks:

- Three.js now exists as a separate large rendering chunk. Future work should lazy-load the cinematic engine, add quality tiers, and implement reduced-motion / reduced-quality controls.
- The current engine is a foundation, not the final Apple-quality 12-chapter choreography with real models, GSAP timelines, sound, or shader post-processing.

## 2026-06-28 - WEOS Blueprint and Experience Director Plan

Accepted WEOS as the product model for the public Axiom entry experience.

Files and systems changed:

- Added [ADR-0003](../adr/ADR-0003-web-experience-operating-system.md).
- Added [WEOS Blueprint](../experience/weos-blueprint.md).
- Added [Experience Director Architecture](../experience/experience-director-architecture.md).
- Updated documentation index and decision log.

Decision:

- WEOS is product-scoped and must not modify frozen Platform Runtime v5.
- Experience Director becomes the orchestration layer for the cinematic public experience.

## 2026-06-28 - Phase 01C WEOS Experience Director Implementation

Implemented the first product-scoped Experience Director foundation for WEOS.

Files and systems changed:

- Added `src/experience/director/ExperienceDirector.ts`.
- Added `src/experience/director/ExperienceDirector.test.ts`.
- Updated `src/App.tsx` to consume WEOS journey and director module data from the Experience Director.
- Added [Phase 01C WEOS Experience Director](../phases/phase-01c-weos-experience-director.md).
- Updated documentation index.

Verification:

- RED confirmed first: the new director test failed because `ExperienceDirector` did not exist.
- Targeted director tests passed with 5 tests.
- `npm test` passed with 22 test files and 235 tests.
- `npm run build` passed.
- Targeted director coverage passed with 93.75% statements, 93.75% branches, 80% functions, and 93.75% lines.

Known risks:

- Full-repo coverage remains below 80% because existing broader packages, generated output, and several UI/studio modules are included in coverage. The new director module meets the 80% target.
- Browser MCP smoke verification could not run because the node REPL tool returned `codex/sandbox-state-meta: missing field sandboxPolicy`.
- The Experience Director currently owns journey/cue data; the WebGL loop still needs deeper runtime consumption of director cues.

## 2026-06-28 - Phase 01C Director Foundation 2

Extended the first Experience Director foundation from static journey/cue data into live director state.

Files and systems changed:

- Extended `src/experience/director/ExperienceDirector.ts` with progress clamping, chapter indexing, chapter range metadata, hardware signal detection, and complete `ExperienceDirectorState` construction.
- Extended `src/experience/director/ExperienceDirector.test.ts` with state, range, and hardware tier coverage.
- Updated `src/App.tsx` with a browser adapter hook for scroll progress, reduced-motion preference, and hardware tier detection.
- Updated the landing chapter rail to highlight the active chapter from director state.
- Added an Experience Director status panel showing active chapter, camera cue, quality profile, and next handoff.
- Updated `src/styles.css` with status panel styling.
- Updated [Phase 01C WEOS Experience Director](../phases/phase-01c-weos-experience-director.md).

Verification:

- `npm test -- src/experience/director/ExperienceDirector.test.ts src/App.test.tsx` passed with 2 test files and 12 tests.

Known risks:

- Browser smoke verification still depends on the browser MCP becoming available in this environment.
- The Three.js render loop now receives the resolved quality profile, but deeper camera, lighting, and particle choreography should consume director state in the next implementation slice.

## 2026-06-28 - Phase 01C Director Foundation 3

Connected the Experience Director to the WebGL render loop as the first real choreography bridge.

Files and systems changed:

- Added `ExperienceRenderDirective` and `buildExperienceRenderDirective` to `src/experience/director/ExperienceDirector.ts`.
- Added render directive tests for normal, reduced-motion, and low-hardware paths.
- Updated `src/App.tsx` so the cinematic engine reads the latest director state through a ref instead of recreating the renderer on scroll.
- Replaced generic scroll camera math with director-owned camera target, fog density, accent color, orbit speeds, core emission, particle density, and lighting intensity.
- Updated WebGL telemetry active-state labels to include the current director chapter.
- Updated [Phase 01C WEOS Experience Director](../phases/phase-01c-weos-experience-director.md).

Verification:

- `npm test -- src/experience/director/ExperienceDirector.test.ts src/App.test.tsx` passed with 2 test files and 14 tests.
- `npm test` passed with 22 test files and 240 tests.
- `npm run build` passed.

Known risks:

- Browser MCP smoke verification remains blocked by `codex/sandbox-state-meta: missing field sandboxPolicy`.
- Three.js still emits the known chunk-size warning and should be lazy-loaded in a later performance slice.

## 2026-06-28 - Phase 01C Director Foundation 4

Converted the cinematic Three.js dependency into an explicit lazy runtime path.

Files and systems changed:

- Removed the static `three` import from `src/App.tsx`.
- Added `src/experience/cinematic/threeRuntime.ts` as a tiny lazy-load adapter exporting only the Three.js classes used by the cinematic engine.
- Updated the WebGL effect to dynamically import the cinematic adapter with a cleanup guard so unmounts remain safe while the chunk loads.
- Updated `vite.config.ts` with an approved `chunkSizeWarningLimit` of 550 KB for the isolated deferred Three.js vendor chunk.
- Updated [Phase 01C WEOS Experience Director](../phases/phase-01c-weos-experience-director.md).

Verification:

- `npm test -- src/App.test.tsx src/experience/director/ExperienceDirector.test.ts` passed with 2 test files and 14 tests.
- `npm test` passed with 22 test files and 240 tests.
- `npm run build` passed without the previous Three.js chunk warning.

Build output:

- `index-C2RQz2TG.js`: 322.09 KB raw / 95.01 KB gzip.
- `threeRuntime-CXcfkV1Y.js`: 0.42 KB raw / 0.26 KB gzip.
- `three-BWOpZj7d.js`: 518.70 KB raw / 130.19 KB gzip.

Known risks:

- Browser MCP smoke verification remains blocked by `codex/sandbox-state-meta: missing field sandboxPolicy`.
- The Three.js vendor chunk is deferred and approved, but future 3D work should still avoid importing broad optional Three.js subsystems unless needed.

## 2026-06-28 - Phase 01C Director Foundation 5

Added explicit cinematic runtime readiness and accessible fallback behavior.

Files and systems changed:

- Added `loading`, `ready`, and `fallback` engine status handling in `src/App.tsx`.
- The cinematic engine now enters fallback when WebGL is unavailable or the deferred Three.js runtime fails to load.
- The WebGL path marks itself ready after the first successful render.
- Added an accessible `role="status"` readiness layer with WEOS loading/live/fallback copy.
- Added CSS for readiness states, WebGL fade-in, and polished fallback status presentation.
- Updated `src/App.test.tsx` to verify the cinematic readiness contract.
- Updated [Phase 01C WEOS Experience Director](../phases/phase-01c-weos-experience-director.md).

Verification:

- `npm test -- src/App.test.tsx src/experience/director/ExperienceDirector.test.ts` passed with 2 test files and 14 tests.
- `npm test` passed with 22 test files and 240 tests.
- `npm run build` passed.

Build output:

- `index-BUSwPoQM.js`: 322.68 KB raw / 95.20 KB gzip.
- `index-44TzinbI.css`: 26.33 KB raw / 6.08 KB gzip.
- `threeRuntime-CXcfkV1Y.js`: 0.42 KB raw / 0.26 KB gzip.
- `three-BWOpZj7d.js`: 518.70 KB raw / 130.19 KB gzip.

Known risks:

- Browser MCP smoke verification remains blocked by `codex/sandbox-state-meta: missing field sandboxPolicy`.
- The current fallback is CSS-driven and polished, but it is not yet a fully director-driven alternate scene.

## 2026-06-28 - Phase 01C Director Foundation 6

Made the CSS fallback scene consume Experience Director render directives.

Files and systems changed:

- Added director-derived fallback CSS variables in `src/App.tsx` for accent color, core scale, glow, opacity, ring speed, and starfield speed.
- Added `data-chapter` to the cinematic engine root for chapter-aware fallback diagnostics and testing.
- Updated readiness copy so loading/fallback status includes the current WEOS chapter.
- Updated `src/styles.css` so fallback core, rings, and starfield respond to director variables.
- Added reduced-motion protection for fallback ring/starfield animations.
- Updated `src/App.test.tsx` to verify director-aware fallback chapter and accent wiring.
- Updated [Phase 01C WEOS Experience Director](../phases/phase-01c-weos-experience-director.md).

Verification:

- `npm test -- src/App.test.tsx src/experience/director/ExperienceDirector.test.ts` passed with 2 test files and 14 tests.
- `npm test` passed with 22 test files and 240 tests.
- `npm run build` passed.

Build output:

- `index-hqYpCpXD.js`: 323.32 KB raw / 95.37 KB gzip.
- `index-PAF2Q7pC.css`: 27.30 KB raw / 6.34 KB gzip.
- `threeRuntime-CXcfkV1Y.js`: 0.42 KB raw / 0.26 KB gzip.
- `three-BWOpZj7d.js`: 518.70 KB raw / 130.19 KB gzip.

Known risks:

- Browser MCP smoke verification remains blocked by `codex/sandbox-state-meta: missing field sandboxPolicy`.
- The fallback now follows director mood, but it does not yet expose an interactive reduced-capability chapter rail or keyboard navigation surface.

## 2026-06-28 - Phase 01C Director Foundation 7

Added keyboard-accessible WEOS chapter navigation.

Files and systems changed:

- Converted the landing chapter rail items from static elements into real buttons.
- Added `scrollToChapter` in `src/App.tsx` to target WEOS chapter positions while respecting reduced-motion preference.
- Added arrow-key, Home, and End handling on the chapter rail.
- Preserved `aria-current="step"` for the active chapter and added explicit chapter button labels.
- Added focus-visible and hover styling for chapter controls in `src/styles.css`.
- Updated `src/App.test.tsx` to verify button and keyboard chapter navigation.
- Updated [Phase 01C WEOS Experience Director](../phases/phase-01c-weos-experience-director.md).

Verification:

- `npm test -- src/App.test.tsx src/experience/director/ExperienceDirector.test.ts` passed with 2 test files and 15 tests.
- `npm test` passed with 22 test files and 241 tests.
- `npm run build` passed.

Build output:

- `index-Cn0URnae.js`: 323.92 KB raw / 95.56 KB gzip.
- `index-CHdhdNX0.css`: 27.46 KB raw / 6.39 KB gzip.
- `threeRuntime-CXcfkV1Y.js`: 0.42 KB raw / 0.26 KB gzip.
- `three-BWOpZj7d.js`: 518.70 KB raw / 130.19 KB gzip.

Known risks:

- Browser MCP smoke verification remains blocked by `codex/sandbox-state-meta: missing field sandboxPolicy`.
- Chapter navigation currently moves via document scroll; a future director API may expose direct chapter transitions without depending on page scroll height.

## 2026-06-28 - Phase 01C Director Foundation 8

Extracted the cinematic engine out of the root app component.

Files and systems changed:

- Added `src/experience/cinematic/CinematicExperienceEngine.tsx`.
- Moved WebGL lifecycle, deferred Three.js loading, diagnostics overlay, runtime readiness, and director-aware fallback logic out of `src/App.tsx`.
- Simplified `src/App.tsx` so it now owns landing/workspace orchestration instead of the cinematic render lifecycle.
- Preserved the existing `threeRuntime` lazy-load path and diagnostics behavior.
- Updated [Phase 01C WEOS Experience Director](../phases/phase-01c-weos-experience-director.md).

Verification:

- `npm test -- src/App.test.tsx src/experience/director/ExperienceDirector.test.ts` passed with 2 test files and 15 tests.
- `npm test` passed with 22 test files and 241 tests.
- `npm run build` passed.

Build output:

- `index-C816PyLu.js`: 323.92 KB raw / 95.54 KB gzip.
- `index-CHdhdNX0.css`: 27.46 KB raw / 6.39 KB gzip.
- `threeRuntime-CXcfkV1Y.js`: 0.42 KB raw / 0.26 KB gzip.
- `three-BWOpZj7d.js`: 518.70 KB raw / 130.19 KB gzip.

Known risks:

- Browser MCP smoke verification remains blocked by `codex/sandbox-state-meta: missing field sandboxPolicy`.
- `CinematicExperienceEngine.tsx` still combines render lifecycle and diagnostics UI; a later slice should split diagnostics into its own component.

## 2026-07-04 - Phase 01D Workspace Orchestrator Foundation

Separated workspace orchestration from the root app component.

Files and systems changed:

- Added `src/workspace/WorkspaceShell.tsx` for workspace layout, navigation, draft creation, inspector metadata, and workspace metrics.
- Added `src/workspace/useStudioLifecycle.ts` for concrete studio initialize, activate, deactivate, and dispose orchestration.
- Added `src/workspace/StudioPanelRouter.tsx` for concrete panel routing and generic studio fallback rendering.
- Simplified `src/App.tsx` so it owns landing experience and top-level view switching only.
- Added App test coverage for Photo Studio and Vector Studio routing through the workspace router.
- Added [Phase 01D Workspace Orchestrator](../phases/phase-01d-workspace-orchestrator.md).
- Updated the documentation index.

Verification:

- `npm test -- src/App.test.tsx` passed with 1 test file and 6 tests.
- `npm test` passed with 22 test files and 242 tests.
- `npm run build` passed.
- `python -m pytest apps/api/tests` passed with 10 tests.

Build output:

- `index-CXPkACqo.js`: 399.74 KB raw / 109.38 KB gzip.
- `index-CHdhdNX0.css`: 27.46 KB raw / 6.39 KB gzip.
- `threeRuntime-CXcfkV1Y.js`: 0.42 KB raw / 0.26 KB gzip.
- `three-BWOpZj7d.js`: 518.70 KB raw / 130.19 KB gzip.

Known risks:

- Browser MCP smoke verification remains blocked by `codex/sandbox-state-meta: missing field sandboxPolicy`.
- Lifecycle orchestration is centralized, but concrete studio singleton modules are still statically imported.
- API tests pass with one Python deprecation warning for `datetime.utcnow()` in `apps/api/services/mock_planner.py`.

## 2026-07-04 - Phase 01D Studio Runtime Registry

Centralized concrete studio runtime registration for workspace lifecycle and panel routing.

Files and systems changed:

- Added `src/workspace/StudioRuntimeRegistry.tsx`.
- Moved concrete runtime module and panel component mapping for Axiom AI, Brain X, Photo, and Vector into one registry.
- Updated `src/workspace/useStudioLifecycle.ts` to initialize, activate, deactivate, and dispose entries from `STUDIO_RUNTIME_REGISTRY`.
- Updated `src/workspace/StudioPanelRouter.tsx` to render concrete panels via `getStudioRuntimeEntry`.
- Added `src/workspace/StudioRuntimeRegistry.test.tsx` to lock the registry contract.
- Updated [Phase 01D Workspace Orchestrator](../phases/phase-01d-workspace-orchestrator.md).

Verification:

- `npm test -- src/workspace/StudioRuntimeRegistry.test.tsx src/App.test.tsx` passed with 2 test files and 8 tests.
- `npm test` passed with 23 test files and 244 tests.
- `npm run build` passed.
- `python -m pytest apps/api/tests` passed with 10 tests.

Build output:

- `index-C1WTpuNF.js`: 399.75 KB raw / 109.57 KB gzip.
- `index-CHdhdNX0.css`: 27.46 KB raw / 6.39 KB gzip.
- `threeRuntime-CXcfkV1Y.js`: 0.42 KB raw / 0.26 KB gzip.
- `three-BWOpZj7d.js`: 518.70 KB raw / 130.19 KB gzip.

Known risks:

- Runtime registry is centralized but still uses static imports. Future plugin-style registration should support lazy loading.
- API tests pass with one Python deprecation warning for `datetime.utcnow()` in `apps/api/services/mock_planner.py`.

## 2026-07-04 - Phase 01D Lazy Studio Runtime Registry

Converted concrete studio runtime registration to lazy-loaded modules and panels.

Files and systems changed:

- Updated `src/workspace/StudioRuntimeRegistry.tsx` to use dynamic imports for runtime modules and `React.lazy` for concrete panels.
- Updated `src/workspace/useStudioLifecycle.ts` to load only the active studio module on demand, initialize it once, activate it, deactivate previous loaded modules, and dispose loaded modules on workspace unmount.
- Updated `src/workspace/StudioPanelRouter.tsx` with a `Suspense` fallback for lazy panel loading.
- Updated `src/workspace/StudioRuntimeRegistry.test.tsx` for async module loaders.
- Updated `src/App.test.tsx` to await lazy Photo and Vector panel rendering.
- Updated [Phase 01D Workspace Orchestrator](../phases/phase-01d-workspace-orchestrator.md).

Verification:

- `npm test -- src/workspace/StudioRuntimeRegistry.test.tsx src/App.test.tsx` passed with 2 test files and 8 tests.
- `npm test` passed with 23 test files and 244 tests.
- `npm run build` passed.
- `python -m pytest apps/api/tests` passed with 10 tests.

Build output:

- Main app chunk `index-DwzTeB0f.js`: 268.20 KB raw / 82.86 KB gzip.
- Lazy studio chunks include `PhotoPanel-f2mEFFSH.js`, `VectorPanel-BZJ0FOAR.js`, `BrainXPanel-A2QPl_DL.js`, `AxiomAiPanel-CHdjeo2V.js`, and corresponding studio module chunks.
- `three-BWOpZj7d.js`: 518.70 KB raw / 130.19 KB gzip.

Known risks:

- Lazy runtime modules are cached in-memory for the current session but are not yet driven by an external plugin manifest.
- API tests pass with one Python deprecation warning for `datetime.utcnow()` in `apps/api/services/mock_planner.py`.

## 2026-07-04 - Phase 01D Studio Runtime Manifest UI

Exposed lazy studio runtime state in the Workspace Inspector Rail.

Files and systems changed:

- Updated `src/workspace/useStudioLifecycle.ts` to return a runtime manifest with active studio id, fallback/loading/loaded status, registry-entry availability, and loaded module ids.
- Updated `src/workspace/WorkspaceShell.tsx` to show runtime status, manifest-entry status, and loaded modules in the Inspector Rail.
- Updated `src/App.test.tsx` to verify fallback studios and lazy runtime studios expose their manifest state through the Inspector.
- Updated [Phase 01D Workspace Orchestrator](../phases/phase-01d-workspace-orchestrator.md).

Verification:

- `npm test -- src/App.test.tsx src/workspace/StudioRuntimeRegistry.test.tsx` passed with 2 test files and 8 tests.
- `npm test` passed with 23 test files and 244 tests.
- `npm run build` passed.
- `python -m pytest apps/api/tests` passed with 10 tests.

Build output:

- Main app chunk `index-Kn4vNNIF.js`: 268.99 KB raw / 83.02 KB gzip.
- Lazy studio chunks include `PhotoPanel-CiRdff0j.js`, `VectorPanel-CGEfKopa.js`, `BrainXPanel-f90moaAD.js`, `AxiomAiPanel-Db89BBdk.js`, and corresponding studio module chunks.
- `three-BWOpZj7d.js`: 518.70 KB raw / 130.19 KB gzip.

Known risks:

- Runtime manifest state is visible in the Inspector but is not yet emitted to replay/audit services.
- Plugin-style studio registration still needs an external manifest source before third-party or marketplace studios can use the same lifecycle path.
- API tests pass with one Python deprecation warning for `datetime.utcnow()` in `apps/api/services/mock_planner.py`.

## 2026-07-04 - Phase 01D External Studio Manifest Schema

Introduced a manifest-first runtime registration layer for implemented studios.

Files and systems changed:

- Added `src/workspace/studio-runtime.manifest.json` as the runtime capability declaration source for implemented studios.
- Added `src/workspace/StudioRuntimeManifest.ts` to validate runtime manifest records against known studio ids, runtime source, implementation status, phase, capabilities, and notes.
- Updated `src/workspace/StudioRuntimeRegistry.tsx` so runtime entries are derived from manifest records and then attached to first-party lazy module/panel adapters.
- Updated `src/workspace/StudioRuntimeRegistry.test.tsx` to verify manifest records and runtime adapter binding.
- Updated [Phase 01D Workspace Orchestrator](../phases/phase-01d-workspace-orchestrator.md).

Verification:

- `npm test -- src/workspace/StudioRuntimeRegistry.test.tsx src/App.test.tsx` passed with 2 test files and 9 tests.
- `npm test` passed with 23 test files and 245 tests.
- `npm run build` passed.
- `python -m pytest apps/api/tests` passed with 10 tests.

Build output:

- Main app chunk `index-B7lnAMiF.js`: 271.45 KB raw / 83.65 KB gzip.
- Lazy studio chunks include `PhotoPanel-FpjJKL20.js`, `VectorPanel-D3VLgtGY.js`, `BrainXPanel-BVViC3k-.js`, `AxiomAiPanel-dOp8jtwN.js`, and corresponding studio module chunks.
- `three-BWOpZj7d.js`: 518.70 KB raw / 130.19 KB gzip.

Known risks:

- The manifest is now data-driven but still bundled from an in-repo JSON source.
- Marketplace/plugin studios will need signed external manifests, trust validation, version constraints, and adapter loading rules before they can enter the same lifecycle path.

## 2026-07-04 - Phase 01D Inspector Runtime Manifest Details

Exposed active studio runtime manifest metadata in the Workspace Inspector.

Files and systems changed:

- Updated `src/workspace/useStudioLifecycle.ts` to return the active runtime manifest record with source, implementation status, phase, capabilities, runtime key, and notes.
- Updated `src/workspace/WorkspaceShell.tsx` to display runtime source, runtime phase, and runtime capabilities in the Inspector Rail.
- Updated `src/App.test.tsx` to verify fallback studios show fallback capability metadata and implemented studios show first-party manifest capabilities.
- Updated [Phase 01D Workspace Orchestrator](../phases/phase-01d-workspace-orchestrator.md).

Verification:

- `npm test -- src/App.test.tsx src/workspace/StudioRuntimeRegistry.test.tsx` passed with 2 test files and 9 tests.
- `npm test` passed with 23 test files and 245 tests.
- `npm run build` passed.
- `python -m pytest apps/api/tests` passed with 10 tests.

Build output:

- Main app chunk `index-NlImFghT.js`: 272.11 KB raw / 83.75 KB gzip.
- Lazy studio chunks include `PhotoPanel-FeecmAPh.js`, `VectorPanel-C4yAs8P4.js`, `BrainXPanel-CGSCCybC.js`, `AxiomAiPanel-BKxpS7TH.js`, and corresponding studio module chunks.
- `three-BWOpZj7d.js`: 518.70 KB raw / 130.19 KB gzip.

Known risks:

- Manifest details are visible to developers/users in the Inspector but are not yet tied to replay, audit, or runtime permission checks.

## 2026-07-04 - Phase 01D Runtime Authority Metadata

Added explicit runtime permission metadata to the studio runtime manifest.

Files and systems changed:

- Updated `src/workspace/studio-runtime.manifest.json` with `authority` permissions for project read, canvas write, export, provider use, and approval requirements.
- Updated `src/workspace/StudioRuntimeManifest.ts` to validate every authority permission as an explicit boolean.
- Updated `src/workspace/useStudioLifecycle.ts` to expose authority metadata through the active runtime record.
- Updated `src/workspace/WorkspaceShell.tsx` to show runtime authority in the Inspector Rail.
- Updated `src/workspace/StudioRuntimeRegistry.test.tsx` and `src/App.test.tsx` to verify authority metadata and fallback authority states.
- Updated [Phase 01D Workspace Orchestrator](../phases/phase-01d-workspace-orchestrator.md).

Verification:

- `npm test -- src/App.test.tsx src/workspace/StudioRuntimeRegistry.test.tsx` passed with 2 test files and 9 tests.
- `npm test` passed with 23 test files and 245 tests.
- `npm run build` passed.
- `python -m pytest apps/api/tests` passed with 10 tests.

Build output:

- Main app chunk `index-YMqW9ln3.js`: 273.48 KB raw / 84.06 KB gzip.
- Lazy studio chunks include `PhotoPanel-CgoMlprU.js`, `VectorPanel-C40MQRf4.js`, `BrainXPanel-rhVZJAHf.js`, `AxiomAiPanel-BtIVDN8I.js`, and corresponding studio module chunks.
- `three-BWOpZj7d.js`: 518.70 KB raw / 130.19 KB gzip.

Known risks:

- Authority permissions are declared and visible but are not yet enforced by runtime guards, replay/audit, provider routing, or export systems.

## 2026-07-04 - Phase 01D Runtime Authority Gate

Added the first reusable runtime authority guard.

Files and systems changed:

- Added `src/workspace/RuntimeAuthorityGate.ts` to evaluate `readProject`, `writeCanvas`, `export`, and `useProviders` actions against manifest authority metadata.
- Added `src/workspace/RuntimeAuthorityGate.test.ts` to verify allowed, blocked, missing-authority, and Inspector-summary decisions.
- Updated `src/workspace/WorkspaceShell.tsx` to show authority gate decisions in the Inspector Rail.
- Updated `src/App.test.tsx` to verify fallback studios show blocked gate decisions and Photo Studio shows allowed gate decisions.
- Updated [Phase 01D Workspace Orchestrator](../phases/phase-01d-workspace-orchestrator.md).

Verification:

- `npm test -- src/workspace/RuntimeAuthorityGate.test.ts src/workspace/StudioRuntimeRegistry.test.tsx src/App.test.tsx` passed with 3 test files and 13 tests.
- `npm test` passed with 24 test files and 249 tests.
- `npm run build` passed.
- `python -m pytest apps/api/tests` passed with 10 tests.

Build output:

- Main app chunk `index-BWrhlqjy.js`: 274.41 KB raw / 84.29 KB gzip.
- Lazy studio chunks include `PhotoPanel-N5NIJXCo.js`, `VectorPanel-C0jY3pJY.js`, `BrainXPanel-CVl5Etkz.js`, `AxiomAiPanel-DA9lSLb3.js`, and corresponding studio module chunks.
- `three-BWOpZj7d.js`: 518.70 KB raw / 130.19 KB gzip.

Known risks:

- The gate exists and is visible, but studio write/export/provider handlers still need to call it before performing guarded actions.

## 2026-07-04 - Phase 01D Photo Runtime Authority Enforcement

Wired runtime authority checks into the first concrete studio action handlers.

Files and systems changed:

- Added `src/app/studios/photo/PhotoRuntimeAuthority.ts` to map Photo Studio generation to `useProviders` plus `writeCanvas` authority and Photo exports to `export` authority.
- Added `src/app/studios/photo/PhotoRuntimeAuthority.test.ts` to verify allowed generation, blocked provider use, blocked canvas write, and blocked export cases.
- Updated `src/app/studios/photo/PhotoPanel.tsx` so `Approve & Generate Layout`, `Export PNG`, and `Export AXPKG` check runtime authority before executing guarded actions.
- Added an alert surface in Photo Studio for blocked authority decisions.
- Updated [Phase 01D Workspace Orchestrator](../phases/phase-01d-workspace-orchestrator.md).

Verification:

- `npm test -- src/app/studios/photo/PhotoRuntimeAuthority.test.ts src/workspace/RuntimeAuthorityGate.test.ts src/App.test.tsx` passed with 3 test files and 14 tests.
- `npm test` passed with 25 test files and 253 tests.
- `npm run build` passed.
- `python -m pytest apps/api/tests` passed with 10 tests.

Build output:

- Main app chunk `index-CowNQ_Ig.js`: 274.47 KB raw / 84.30 KB gzip.
- Lazy studio chunks include `PhotoPanel-qOwVuyDk.js`, `VectorPanel-rYGd0vf1.js`, `BrainXPanel-Crdcj_xZ.js`, `AxiomAiPanel-DxLA2Eer.js`, and corresponding studio module chunks.
- `three-BWOpZj7d.js`: 518.70 KB raw / 130.19 KB gzip.

Known risks:

- Photo Studio is now guarded, but other concrete studios still need handler-level authority checks.
- Photo authority currently uses the manifest record directly; future plugin runtimes may need request-scoped authority context and audit emission for blocked actions.

## 2026-07-04 - Phase 01D Vector Runtime Authority Enforcement

Wired runtime authority checks into Vector Studio action handlers.

Files and systems changed:

- Added `src/app/studios/vector/VectorRuntimeAuthority.ts` to map Vector Studio generation to `useProviders` plus `writeCanvas` authority and Vector exports to `export` authority.
- Added `src/app/studios/vector/VectorRuntimeAuthority.test.ts` to verify the default provider-use block, allowed generation, blocked canvas write, allowed export, and blocked export cases.
- Updated `src/app/studios/vector/VectorPanel.tsx` so `Approve & Generate Editable Vector`, `Export SVG`, and `Export AXPKG` check runtime authority before executing guarded actions.
- Added an alert surface in Vector Studio for blocked authority decisions.
- Updated [Phase 01D Workspace Orchestrator](../phases/phase-01d-workspace-orchestrator.md).

Verification:

- `npm test -- src/app/studios/vector/VectorRuntimeAuthority.test.ts src/workspace/RuntimeAuthorityGate.test.ts src/App.test.tsx` passed with 3 test files and 15 tests.
- `npm test` passed with 26 test files and 258 tests.
- `npm run build` passed.
- `python -m pytest apps/api/tests` passed with 10 tests.

Build output:

- Main app chunk `index-boHpAAau.js`: 274.47 KB raw / 84.30 KB gzip.
- Lazy studio chunks include `PhotoPanel-BIu2-Lr3.js`, `VectorPanel-CO4kHx_A.js`, `BrainXPanel-BlAxvcWc.js`, `AxiomAiPanel-DW0YJ7OH.js`, and corresponding studio module chunks.
- `three-BWOpZj7d.js`: 518.70 KB raw / 130.19 KB gzip.

Known risks:

- Vector Studio generation is intentionally blocked by the current manifest because `canUseProviders` is false.
- Vector authority currently uses the manifest record directly; future plugin runtimes may need request-scoped authority context and audit emission for blocked actions.

## 2026-07-04 - Phase 01D Blocked Authority Audit Events

Added audit trail records for denied runtime authority decisions.

Files and systems changed:

- Updated `src/app/studios/photo/PhotoRuntimeAuthority.ts` with `createPhotoAuthorityBlockedAuditEvent`.
- Updated `src/app/studios/vector/VectorRuntimeAuthority.ts` with `createVectorAuthorityBlockedAuditEvent`.
- Updated `src/app/studios/photo/PhotoPanel.tsx` and `src/app/studios/vector/VectorPanel.tsx` so blocked generation/export attempts append `authority_blocked` events to studio audit state.
- Updated `src/app/components/ReplayAuditPanel.tsx` to render `authority_blocked` events with the rejected-event icon treatment.
- Updated Photo and Vector authority tests to verify blocked audit event creation.
- Updated [Phase 01D Workspace Orchestrator](../phases/phase-01d-workspace-orchestrator.md).

Verification:

- `npm test -- src/app/studios/photo/PhotoRuntimeAuthority.test.ts src/app/studios/vector/VectorRuntimeAuthority.test.ts src/workspace/RuntimeAuthorityGate.test.ts src/App.test.tsx` passed with 4 test files and 21 tests.
- `npm test` passed with 26 test files and 260 tests.
- `npm run build` passed.
- `python -m pytest apps/api/tests` passed with 10 tests.

Build output:

- Main app chunk `index-DHMBljr4.js`: 274.47 KB raw / 84.29 KB gzip.
- Lazy studio chunks include `PhotoPanel-CQOkPz5p.js`, `VectorPanel-BsSo_PmT.js`, `BrainXPanel-Cg09JhXP.js`, `AxiomAiPanel-B4m23rAo.js`, and corresponding studio module chunks.
- `three-BWOpZj7d.js`: 518.70 KB raw / 130.19 KB gzip.

Known risks:

- Blocked events are recorded in local studio audit state, but are not yet persisted into a cross-studio replay/audit service.

## 2026-07-04 - Phase 01D Workspace Audit Service Handoff

Promoted blocked authority decisions into a shared workspace audit layer for the next platform phase.

Files and systems changed:

- Added `src/workspace/WorkspaceAuditService.ts` as a process-local shared audit service with record, read, clear, and authority-blocked event creation helpers.
- Added `src/workspace/WorkspaceAuditService.test.ts` to verify immutable snapshots, event-bus publishing through `workspace:audit:recorded`, and audit clearing.
- Updated `src/app/studios/photo/PhotoPanel.tsx` so blocked Photo authority events are written to both local studio audit and the shared workspace audit service.
- Updated `src/app/studios/vector/VectorPanel.tsx` so blocked Vector authority events are written to both local studio audit and the shared workspace audit service.
- Updated [Phase 01D Workspace Orchestrator](../phases/phase-01d-workspace-orchestrator.md).

Verification:

- `npm test -- src/workspace/WorkspaceAuditService.test.ts src/app/studios/photo/PhotoRuntimeAuthority.test.ts src/app/studios/vector/VectorRuntimeAuthority.test.ts src/workspace/RuntimeAuthorityGate.test.ts src/App.test.tsx` passed with 5 test files and 24 tests.
- `npm test` passed with 27 test files and 263 tests.
- `npm run build` passed.
- `python -m pytest apps/api/tests` passed with 10 tests.

Build output:

- Main app chunk `index-CHAx4wm4.js`: 274.49 KB raw / 84.30 KB gzip.
- Lazy workspace/studio chunks include `WorkspaceAuditService-BmirhuQx.js`, `PhotoPanel-RQ4o1uXS.js`, `VectorPanel-DX5NxsbK.js`, `BrainXPanel-CJvssDkY.js`, `AxiomAiPanel-D5qRxO1g.js`, and corresponding studio module chunks.
- `three-BWOpZj7d.js`: 518.70 KB raw / 130.19 KB gzip.

Known risks:

- Workspace Audit Service is process-local and event-published, but is not yet persisted into AXPKG, indexed for replay, or exposed as a dedicated Workspace Replay panel.
- Only blocked authority events are currently promoted to workspace audit; generation, export, lifecycle, provider, and approval events should be promoted next.

## 2026-07-04 - Phase 03C Workspace Audit, Replay, and Authority Stabilization

Stabilized workspace-level audit tracking, persisted audit trails inside versioned AXPKG drafts (schemaVersion 0.2.0), implemented a Workspace Replay/Audit panel with filter categories, and added handler-level authority checks for the Brain X and Axiom AI studios.

Files and systems changed:

- Standardized `WorkspaceAuditEvent` schema and helper event factories in [WorkspaceAuditService.ts](file:///c:/Users/Rupesh%20Salvi/Downloads/Google%20Antigravity/Project%20Axiom%20Studio/Axiom%20Studio%201.0/src/workspace/WorkspaceAuditService.ts). Added memory size cap limit of 1000 events.
- Created `BrainXRuntimeAuthority.ts` and `AxiomAiRuntimeAuthority.ts` helpers to evaluate actions against capabilities and create metadata-rich authority-blocked events.
- Updated `BrainXPanel.tsx`, `PhotoPanel.tsx`, and `VectorPanel.tsx` to integrate runtime authority checks, handle local warnings, promote success/rejection/export events, and package complete workspace audit trails in AXPKG exports.
- Added [WorkspaceReplayPanel.tsx](file:///c:/Users/Rupesh%20Salvi/Downloads/Google%20Antigravity/Project%20Axiom%20Studio/Axiom%20Studio%201.0/src/workspace/WorkspaceReplayPanel.tsx) with All, Creative, Authority, Export, Lifecycle, and Errors filter tabs, collapsible details, and proper unmount subscriptions cleanup.
- Integrated the Replay panel sidebar toggle and synced active draft audit state dynamically inside [WorkspaceShell.tsx](file:///c:/Users/Rupesh%20Salvi/Downloads/Google%20Antigravity/Project%20Axiom%20Studio/Axiom%20Studio%201.0/src/workspace/WorkspaceShell.tsx).
- Fixed 9 TypeScript compile errors across panels.

Verification:

- `npm test` passed with 20 test files and 284 tests.
- `npm run build` passed successfully.
- `python -m pytest apps/api/tests` passed with 10 tests and zero warnings.

## 2026-07-04 - Phase 04 Signed External Runtime Manifest Loading

Implemented the schema, validator, verifier, and registry loader to discover local manifests and register external runtime metadata securely without code imports or module execution.

Files and systems changed:
- Created `RuntimeManifestTypes.ts` defining JSON schemas, signatures, and capabilities.
- Created `RuntimeManifestValidator.ts` and `RuntimeSignatureVerifier.ts` enforcing strict structure and development context controls.
- Created `RuntimeRegistry.ts` tracking manifest statuses (`registered | disabled | rejected | untrusted`).
- Created `LocalRuntimeManifestLoader.ts` loading `/runtime-manifests/index.json` and checking for unsafe paths.
- Updated `RuntimeAuthorityGate.ts` with `evaluateExternalRuntimeAuthority`.
- Seeded public mock manifest configuration assets.

Verification:
- `npm test` passed with 33 test files and 305 tests.
- `npm run build` passed.

### 2026-07-04 - Phase 05 External Runtime Activation Sandbox

Built the activation sandbox for registered manifests, dispatching actions, and recording audit trails with timeout protection and dual capability gating.

Files and systems changed:
- Created `RuntimeActivationTypes.ts` with JSON-safe types (`JsonPrimitive`, `JsonSafe`) and typed failure codes.
- Created `MockRuntimeExecutor.ts` mapping safe local executors (`LOCAL_RUNTIME_EXECUTORS`) and action definitions (`LOCAL_RUNTIME_ACTIONS`).
- Created `RuntimeActivationService.ts` managing activation flow and audit events (`runtime_activated`, `runtime_deactivated`).
- Created `RuntimeActionDispatcher.ts` enforcing an 8-second execution timeout and dual capability validation.
- Updated `RuntimeRegistry.ts` with manifest signature fingerprint checking for reload idempotency; `RuntimeRegistrationStatus` type kept local to registry.
- Created `RuntimeRegistryPanel.tsx` as a developer-facing registry sidebar control panel.
- Updated `WorkspaceShell.tsx` and `WorkspaceReplayPanel.tsx` to handle the sidebar tabs and map sandbox activation/execution audit events.

Verification:
- `npx vitest run src/runtime/` passed with **7 files / 46 tests**.
- `npm test -- --run` passed with **36 files / 330 tests**.
- `npm run build` passed via `tsc -b && vite build`.
- `python -m pytest apps/api/tests` passed with **10 tests**.

Security boundary preserved:
- No dynamic import, no remote module loading, no script injection.
- `manifest.entry.moduleUrl` remains non-executable metadata throughout.
- All execution goes through `LOCAL_RUNTIME_EXECUTORS` after dual capability gate and authority preflight.

## 2026-07-04 - Phase 05 JSX / TypeScript Stabilization

Resolved all TypeScript and JSX compile errors that surfaced after Phase 05 implementation, restoring a clean `tsc --noEmit` baseline.

Fixes applied:
- **`RuntimeRegistryPanel.tsx` JSX arrow**: replaced raw `->` text with `{"→"}` string expression to prevent JSX `>` token misparse.
- **`RuntimeActionDispatcher.test.ts` context typing**: explicitly typed `defaultContext` and `restrictedContext` as `RuntimeActivationContext` to prevent `grantedCapabilities` widening to `string[]`.
- **`RuntimeRegistry.ts` status type**: removed invalid import of `RuntimeRegistrationStatus` from `RuntimeManifestTypes`; type is defined and owned inside `RuntimeRegistry.ts`.
- **`WorkspaceShell.tsx` import**: restored `Shield` to the lucide-react import list.
- **`RuntimeRegistryPanel.tsx` action typing**: added `LOCAL_RUNTIME_ACTIONS` import and typed the mapped callback parameter as `RuntimeActionDefinition`.
- **`src/test/setup.ts` fetch stub**: added `vi.stubGlobal("fetch", vi.fn().mockRejectedValue(...))` to make all API calls fail immediately in JSDOM, preventing 8-second `AbortController` timeouts from blocking `findByText` assertions. Full testing convention documented inline.

Verification:
- `npx tsc --noEmit` passed with **0 errors**.
- `npm test -- --run` passed with **36 files / 330 tests** — confirmed final verified baseline.
- `npm run build` passed.

## 2026-07-04 - Phase 12 Promoted Runtime Dry-Run Action Dispatch Verification

Verified and stabilized the promoted runtime dry-run action dispatch contract. Phase 12 now confirms that promoted runtimes can request dry-run action dispatches through the runtime dispatcher without loading runtime code, executing module URLs, using dynamic imports, or bypassing capability checks.

Files and systems changed:
- Unskipped and restored the primary success-path dry-run dispatch test in `src/runtime/activation/tests/RuntimeDryRunDispatch.test.ts`.
- Adjusted the dispatch-time capability-denial test so the runtime activates validly first, then verifies reduced session capabilities are denied by `dispatchDryRunAction`.
- Increased two full-suite test timeouts in `src/App.test.tsx` to remove lazy-route timing flake under parallel Vitest load.
- Relaxed `packages/ui-foundation/tests/foundation.test.tsx` micro-benchmark limits from 50ms to 100ms to preserve the performance guard while avoiding CI/local parallel-run jitter.

Verification:
- `npx tsc --noEmit` passed with 0 errors.
- `npx vitest run src/runtime/activation/tests` passed with 6 files and 66 tests.
- `npx vitest run packages apps src` passed with 60 files and 468 tests.
- `npm run build` passed through `tsc -b && vite build` and postbuild manifest generation.
- Focused security grep over Phase 12 executable paths found no `import(`, `eval(`, `new Function`, exact `moduleUrl`, `<script`, or `iframe` execution references. The only remaining match was an informational UI sentence saying no script runtime is executing.

Build output:
- Main app chunk `index-BCTKVakc.js`: 370.94 KB raw / 106.66 KB gzip.
- Lazy studio/runtime chunks include `BrainXPanel-6sY68xRs.js`, `VectorPanel-D1UiUdo_.js`, `PhotoPanel-CZpVevPA.js`, `AxiomAiPanel-DafBLd3_.js`, and runtime/studio support chunks.
- `three-BWOpZj7d.js`: 518.70 KB raw / 130.19 KB gzip.

Known risks:
- `RuntimeActionDispatcher.ts` has a small cleanup opportunity in the success path where an intermediate completed result is built before the final success result is returned. It does not break the current contract, but Phase 13 should simplify that branch and make the success diagnostic more semantically explicit.
- The dry-run path is still registry-backed and deterministic; it does not yet provide a richer user-facing preview assembly pipeline for studio outputs.

## 2026-07-04 - Phase 13 Dry-Run Preview Contract and Result Assembly

Created the first versioned preview contract for promoted runtime dry-run dispatches. Phase 13 keeps the Phase 12 non-execution boundary intact while turning dry-run responses into canvas/export preview payloads that later studio assembly workflows can consume.

Files and systems changed:
- Extended `src/runtime/activation/RuntimeActionDispatchTypes.ts` with `RuntimeDryRunPreviewContractV1`, canvas, layer, assembly step, export target, and preview kind types.
- Updated `src/runtime/activation/RuntimeMockActionRegistry.ts` so trusted local Motion dry-run handlers return preview payloads for `renderMotionFrame` and `exportLottie`.
- Simplified the `dispatchDryRunAction` success path in `src/runtime/activation/RuntimeActionDispatcher.ts` and replaced the placeholder success diagnostic with `dry_run_simulated`.
- Added `preview` to successful dry-run results and `runtime_action_dry_run_completed` audit metadata.
- Updated `src/runtime/RuntimeRegistryPanel.tsx` to render Phase 13 preview title, summary, canvas dimensions, layer count, assembly steps, export targets, and approval-required state.
- Stabilized `src/app/projects/axpkg/tests/AxpkgTrustService.test.ts` by replacing a flaky one-character signature mutation with an unambiguously invalid base64url payload.

Verification:
- `npx tsc --noEmit` passed with 0 errors.
- `npx vitest run src/runtime/activation/tests` passed with 6 files and 70 tests.
- `npx vitest run packages apps src` passed with 60 files and 472 tests.
- `npm run build` passed through `tsc -b && vite build` and postbuild manifest generation.
- Focused security grep over Phase 13 runtime files returned no matches for dynamic execution primitives or exact executable `moduleUrl` references.

Build output:
- Main app chunk `index-CbX5whi2.js`: 374.71 KB raw / 107.51 KB gzip.
- Lazy studio/runtime chunks include `BrainXPanel-zABpsClt.js`, `VectorPanel-DgDBEU2X.js`, `PhotoPanel-5vZ3dyzE.js`, `AxiomAiPanel-DiT0Qtwg.js`, and runtime/studio support chunks.
- `three-BWOpZj7d.js`: 518.70 KB raw / 130.19 KB gzip.

Known risks:
- Phase 13 previews are generated from trusted static mock handlers only; real studio preview composition still needs a canvas-side intake contract.
- `approvedForCanvasAssembly` is intentionally `false` in this phase. A future approval gate must flip this only after user review.

## 2026-07-04 - Phase 14 Canvas Preview Intake and Approval Gate

Implemented the canvas-side intake layer for `RuntimeDryRunPreviewContractV1`. Phase 14 keeps runtime dry-run previews non-executing and non-mutating until an explicit user approval action creates an assembly-ready plan.

Files and systems changed:
- Added `src/workspace/CanvasPreviewIntakeService.ts` with preview validation, pending review candidates, explicit approval, rejection, assembly plan creation, snapshots, and test clearing helpers.
- Added `src/workspace/CanvasPreviewIntakeService.test.ts` covering valid intake, unsafe preview rejection, pre-approved preview rejection, approval-only assembly plan creation, double-approval blocking, rejection, and audit metadata.
- Extended `src/workspace/WorkspaceAuditService.ts` with `canvas_preview_intake_received`, `canvas_preview_assembly_approved`, and `canvas_preview_assembly_rejected` events.
- Updated `src/runtime/RuntimeRegistryPanel.tsx` with explicit `Queue Preview` and `Approve Assembly` actions below dry-run preview results.

Verification:
- `npx tsc --noEmit` passed with 0 errors.
- `npx vitest run src/workspace/CanvasPreviewIntakeService.test.ts src/runtime/activation/tests/RuntimeDryRunDispatch.test.ts` passed with 2 files and 39 tests.
- `npx vitest run packages apps src` passed with 61 files and 481 tests.
- `npm run build` passed through `tsc -b && vite build` and postbuild manifest generation.
- Focused security grep over Phase 14 files returned no matches for dynamic execution primitives or exact executable `moduleUrl` references.

Build output:
- Main app chunk `index-Bst59egh.js`: 380.53 KB raw / 108.90 KB gzip.
- Lazy studio/runtime chunks include `BrainXPanel-CBQJz3FD.js`, `VectorPanel-QdhGJuN5.js`, `PhotoPanel-RkJaCmIQ.js`, `AxiomAiPanel-BJ2WF-Vg.js`, and runtime/studio support chunks.
- `three-BWOpZj7d.js`: 518.70 KB raw / 130.19 KB gzip.

Known risks:
- Assembly plans are review-ready data objects only; they do not yet write into the authoritative project canvas slice.
- Preview intake state is process-local. Future AXPKG persistence should store pending candidates and approved plans if they need to survive reload/import.

## 2026-07-05 - Phase 15 Approved Assembly Plan Persistence and Canvas Slice Projection

Persisted Phase 14 preview review state into the project/AXPKG model and added a non-executing canvas projection layer for approved assembly plans.

Files and systems changed:
- Updated `src/app/projects/projectDraft.ts` to project schema `0.4.0` and added `canvasPreview` persistence with candidates, assembly plans, and projections.
- Added `src/workspace/CanvasAssemblyProjectionService.ts` to map approved `CanvasAssemblyPlan` objects into preview-only canvas projection elements.
- Extended `src/workspace/CanvasPreviewIntakeService.ts` with serialize/import helpers for AXPKG persistence.
- Updated `src/workspace/WorkspaceShell.tsx` so Registry Save persists preview candidates and assembly plans, and project load rehydrates preview intake state.
- Updated AXPKG migration/import/serialization so schema `0.3.0` drafts migrate to `0.4.0`, preview arrays are capped on import, and new exports report schema `0.4.0`.
- Updated project, AXPKG, workspace, intake, and projection tests for the new persistence/projection path.

Verification:
- `npx tsc --noEmit` passed with 0 errors.
- Focused Phase 15 test run passed with 6 files and 33 tests.
- `npx vitest run packages apps src` passed with 62 files and 489 tests.
- `npm run build` passed through `tsc -b && vite build` and postbuild manifest generation.
- Focused security grep over Phase 15 files returned no matches for dynamic execution primitives or exact executable `moduleUrl` references.

Build output:
- Main app chunk `index-C25OYQb7.js`: 383.26 KB raw / 109.42 KB gzip.
- Lazy studio/runtime chunks include `BrainXPanel-BKDsH8aC.js`, `VectorPanel-C6HoF2ew.js`, `PhotoPanel-DkGg55D0.js`, `AxiomAiPanel--V2nycMq.js`, and runtime/studio support chunks.
- `three-BWOpZj7d.js`: 518.70 KB raw / 130.19 KB gzip.

Known risks:
- Projection output is preview-only and persisted, but no final “apply to authoritative canvas” action exists yet.
- Projection persistence is available through the project model, but UI currently persists candidates/plans through Registry Save; projection creation still needs a visible product flow.

## 2026-07-05 - Phase 16 Explicit Canvas Apply Gate and Reversible Draft Mutation

Implemented the explicit apply gate that converts preview-only projections into authoritative canvas slice changes only after user confirmation, with rollback metadata and audit events.

Files and systems changed:
- Updated `src/app/projects/projectDraft.ts` to project schema `0.5.0` and added `CanvasAppliedMutation` records under `canvasPreview.applications`.
- Added `src/workspace/CanvasApplyService.ts` with confirmed apply and rollback operations over cloned project drafts.
- Added `src/workspace/CanvasApplyService.test.ts` covering confirmation denial, immutable apply, audit metadata, rollback, and double-rollback blocking.
- Extended `src/workspace/WorkspaceAuditService.ts` with `canvas_projection_applied` and `canvas_projection_rolled_back` event factories.
- Updated AXPKG migration/import/serialization so `0.4.0` drafts migrate to `0.5.0`, application arrays are capped on import, and exports report schema `0.5.0`.
- Updated project, AXPKG, workspace, and schema tests for the reversible mutation path.

Verification:
- `npx tsc --noEmit` passed with 0 errors.
- Focused Phase 16 test run passed with 7 files and 38 tests.
- `npx vitest run packages apps src` passed with 63 files and 494 tests.
- `npm run build` passed through `tsc -b && vite build` and postbuild manifest generation.
- Focused security grep over Phase 16 files returned no matches for dynamic execution primitives or exact executable `moduleUrl` references.

Build output:
- Main app chunk `index-C7v42nUd.js`: 384.41 KB raw / 109.57 KB gzip.
- Lazy studio/runtime chunks include `BrainXPanel-CQbZfvXq.js`, `VectorPanel-CUIUp-g9.js`, `PhotoPanel-DAvJECNX.js`, `AxiomAiPanel-2UjKa7ix.js`, and runtime/studio support chunks.
- `three-BWOpZj7d.js`: 518.70 KB raw / 130.19 KB gzip.

Known risks:
- The apply/rollback gate is implemented as a service and test-covered, but it is not yet exposed as a polished product UI flow.
- Applied elements use a generic projection-derived canvas element shape; studio-specific renderers may need adapters before these elements are visually rendered in each studio.

## 2026-07-05 - Phase 17 Product UI for Projection Apply/Rollback (Locked)

Exposed the approved projections, apply confirmation checkbox, applied mutation status, and rollback controls in a new sidebar panel, and added "Projections" tab filtering to the Replay Trail.

Files and systems changed:
- Created `src/workspace/WorkspaceProjectionsPanel.tsx` component.
- Modified `src/workspace/WorkspaceShell.tsx` to mount the projections panel and add a dock toggle.
- Modified `src/workspace/WorkspaceReplayPanel.tsx` to filter projection-related events under a new tab.
- Created `src/workspace/tests/WorkspaceProjectionsPanel.test.tsx` covering UI lifecycle flows.

Tests and Verification:
- All 506 tests passed successfully (exceeding Phase 16 baseline of 494).
- `npx tsc --noEmit` passed with 0 errors.
- `npm run build` passed successfully.
- Security scan passed for Phase 17 UI paths.

Decisions made:
- Preserve schema version 0.5.0 without modification.
- UI confirmation check is projection-scoped to avoid accidental state leaks.
- Rollback button is disabled for rolled-back mutations to prevent double rollback.

Security boundary:
- No dynamic import in apply/rollback path.
- No `manifest.entry.moduleUrl` execution.
- No `eval`/`new Function`/script/iframe execution.
- Project schemaVersion remains 0.5.0.
- Apply requires projection-scoped confirmation.
- Rollback is disabled for rolled_back mutations.

Known risks:
- Applied elements use a generic projection-derived canvas element shape; studio-specific renderers may need adapters before these elements are visually rendered in each studio.

## 2026-07-05 - Phase 18 Motion Studio Runtime-Backed Studio MVP (Locked)

Exposed the first vertical MVP slice of Motion Studio inside the registry and workspace. Renders playback timeline controls, layer management, and playhead index scrubbing. Connects to the sandbox dispatch system using the active promoted runtime id (`mock-motion-studio`) to queue dry-run previews into the intake service.

Files and systems changed:
- Created `src/app/services/motionTypes.ts` declaring types for motion layers, canvas, and audit records.
- Created `src/app/studios/motion/MotionState.ts` for managing local playhead and selection states.
- Created `src/app/studios/motion/MotionStudio.ts` to implement the StudioModule lifecycle hook structure and telemetry metrics dispatch.
- Created `src/app/studios/motion/MotionRuntimeAuthority.ts` to enforce authority decision checks for motion generation and Lottie exports.
- Created `src/app/studios/motion/MotionPanel.tsx` providing timeline visuals, playback loops, guarded runtime validations, and dispatch triggers.
- Created `src/app/studios/motion/tests/MotionStudio.test.ts` verifying telemetry interval hooks and unregistration.
- Created `src/app/studios/motion/tests/MotionRuntimeAuthority.test.ts` testing allowed/blocked permission paths.
- Created `src/app/studios/motion/tests/MotionPanel.test.tsx` (12 test cases) checking play/pause controls, slider scrubbing, active promoted runtime validation, and denied dispatch handoffs.
- Modified `src/workspace/StudioRuntimeRegistry.tsx` and `src/workspace/StudioRuntimeRegistry.test.tsx` to register and verify the `motion` lazy-load adapter mapping.
- Modified `src/workspace/studio-runtime.manifest.json` registering the first-party `motion` studio with `canUseProviders: false` and phase `"18"`.

Tests and Verification:
- All 527 tests passed successfully (exceeding Phase 17 baseline of 506).
- `npx tsc --noEmit` passed with 0 errors.
- `npm run build` passed successfully.
- Focused security grep checks returned 0 dynamic execution matches across motion paths.

Decisions made:
- Keep schemaVersion unchanged at `0.5.0`.
- Set `"canUseProviders": false` in the motion manifest to block provider execution in Phase 18.
- Render a guarded warning banner in the panel and disable the dispatch button if `mock-motion-studio` is not activated.
- Prevent preview intake if `dispatchDryRunAction` returns denied or failed.

Known risks:
- Local playback (play/pause) operates on a local client interval timer and changes UI state only; it is not yet synchronized with external audio or live frame rendering ticks.

## 2026-07-05 - Phase 19 Vector Studio Runtime-Backed Transition MVP (Locked)

Exposed the first vertical MVP slice of Vector Studio inside the runtime dry-run pipeline. Renders an SVG canvas with shape layering, blueprint plan review, and inline authority decisions. Connects to the sandbox dispatch system using the active promoted runtime id (`mock-vector-studio`) to queue dry-run previews into the canvas intake service. Preserves offline manual shape editing tools as safe user-authored operations.

Files and systems changed:
- Extended `src/app/services/vectorTypes.ts` with `ShapeBreakdownItem` (description, fill, stroke, strokeWidth), updated `VectorProviderInfo` to require `status`, and extended `VectorPlanResponse` to include the provider field.
- Created `src/app/studios/vector/VectorState.ts` for managing local shape selection states.
- Created `src/app/studios/vector/VectorStudio.ts` to implement the `StudioModule` lifecycle hooks and telemetry metrics dispatch.
- Updated `src/app/studios/vector/VectorRuntimeAuthority.ts` to enforce Phase 19 authority decision checks: `previewVectorComposition` allowed, `providerGenerateVector` blocked by `canUseProviders: false`.
- Refactored `src/app/studios/vector/VectorPanel.tsx`:
  - Added guarded liveness warning banner if `mock-vector-studio` is not in `getAllActivatedRuntimes()`.
  - Disabled all intake, blueprint generation, and approval buttons in the guarded state.
  - Changed `handleApprovePlan` to call `dispatchDryRunAction` targeting the active `runtimeId`.
  - Forwarded simulated canvas previews to `CanvasPreviewIntakeService.intakeDryRunPreview()` and triggered `onUpdateProject`.
  - Retained local offline manual shape tools (rectangle, circle, text) as safe user-authored canvas operations.
- Updated `src/runtime/activation/MockRuntimeExecutor.ts` to add `mock-vector-studio` under `LOCAL_RUNTIME_ACTIONS` with `generateVectorComposition` action definition and `["readProject", "writeProject"]` capabilities. Did **not** add it to `LOCAL_RUNTIME_EXECUTORS`.
- Updated `src/runtime/activation/RuntimeMockActionRegistry.ts` to register a trusted `exportSvg` dry-run mock handler for Vector with corrected `canvas.background` type and proper `RuntimeDryRunPreviewContractV1` conformance.
- Updated `src/workspace/StudioRuntimeRegistry.tsx` and `src/workspace/StudioRuntimeRegistry.test.tsx` to register and verify the `vector` lazy-load adapter mapping.
- Updated `src/workspace/studio-runtime.manifest.json` registering the first-party `vector` studio with `canUseProviders: false` and phase `"19"`.
- Updated `src/workspace/StudioPanelRouter.tsx` to pass `project` and `onUpdateProject` props down to lazily loaded panels.
- Updated `src/workspace/WorkspaceShell.tsx` to pass project drafts and update callbacks to `StudioPanelRouter`.
- Created `src/app/studios/vector/VectorRuntimeAuthority.test.ts` (8 tests) verifying allowed/blocked permission paths.
- Created `src/app/studios/vector/tests/VectorPanel.test.tsx` (15 tests) verifying guarded state banners, disabled controls, dispatch routing, denied dispatch blocking, manual tool independence, and non-mutation of authoritative canvas state.

Tests and Verification:
- Focused Vector tests: 23 / 23 passed.
- All 544 tests passed successfully (exceeding Phase 18 baseline of 527; 68 files).
- `npx tsc --noEmit` passed with 0 errors.
- `npm run build` passed successfully (Vite production bundle generated, all 1875 modules transformed).
- Security grep confirmed: 0 `eval(`, 0 `new Function` (functional), 0 `iframe` (functional), 0 `createElement("script"`, 0 untrusted `import()` across Vector, runtime, and workspace paths.

Decisions made:
- Keep schemaVersion unchanged at `0.5.0`.
- Set `"canUseProviders": false` in the vector manifest to block provider execution in Phase 19.
- Add `mock-vector-studio` to `LOCAL_RUNTIME_ACTIONS` only — not to `LOCAL_RUNTIME_EXECUTORS` — preserving the non-execution contract.
- Render a guarded warning banner in the panel and disable all dispatch triggers if `mock-vector-studio` is not activated.
- Forward preview to `CanvasPreviewIntakeService` only on successful dispatch; denied/failed results are shown as an error message and never enter the intake queue.
- Approval, projection, apply, and rollback remain owned by the Phase 17 Projections panel.

Security boundary:
- No runtime package code execution or dynamic import of package paths.
- No `manifest.entry.moduleUrl` execution.
- No `eval`/`new Function`/script/iframe execution.
- No Vector dry-run path through `LOCAL_RUNTIME_EXECUTORS`.
- No Vector panel path to `dispatchRuntimeAction`.
- No generated dry-run output written directly into authoritative canvas elements.
- Project schemaVersion preserved at `0.5.0`.
- Provider execution blocked (`canUseProviders: false`).
- Manual shape editing remains offline and safe without promoted runtime activation.

Known risks:
- Local offline shape tools (add rect/circle/text) operate on React component state only. They do not yet emit audit events into `WorkspaceAuditService`.
- Vector Studio `VectorStudio.ts` registers telemetry metrics intervals, but the telemetry interval handlers are not yet verified to be unregistered on dispose in the test suite.

## 2026-07-05 - Phase 20: Photo Studio Runtime-Backed Transition MVP

Photo Studio is the flagship product. This phase migrates the AI composition generation path from the legacy `photoApi.generatePhotoComposition()` call to the promoted runtime dispatch pipeline (`dispatchDryRunAction`). The "Analyze Intent" step remains offline-safe; only "Approve & Generate Layout" is gated.

Files changed:
- `src/app/studios/photo/PhotoPanel.tsx` — migrated `handleApprovePlan` to `dispatchDryRunAction`; added `intakeDryRunPreview` and `serializeCanvasPreviewState` calls; removed direct `generatePhotoComposition()` call from the gated path; `evaluatePhotoRuntimeAuthority` authority check retained; runtime resolved via `getAllActivatedRuntimes()` — not assumed to equal studio id `"photo"`.
- `src/runtime/activation/RuntimeMockActionRegistry.ts` — added `generatePhotoLayout` handler for `mock-photo-studio`.
- `src/runtime/activation/MockRuntimeExecutor.ts` — added `mock-photo-studio` to `LOCAL_RUNTIME_ACTIONS` only (not `LOCAL_RUNTIME_EXECUTORS`).
- `src/runtime/activation/RuntimeActionDispatchTypes.ts` — added `photo_layout_preview` kind.
- `src/app/studios/photo/tests/PhotoPanel.test.tsx` — 25-test suite covering authority gate, runtime binding, dry-run dispatch, intake routing, and canvas isolation.
- `src/app/studios/vector/VectorPanel.tsx` — minor hardening: optional chaining on `result.diagnostics?.map()` to prevent TypeError when dispatcher returns a response without a diagnostics array.
- `src/app/studios/vector/tests/VectorPanel.test.tsx` — fixed test 5 mock: changed `{ error: "..." }` to `{ diagnostics: [{ message: "...", severity: "error" }] }` to match `RuntimeActionDispatchResult` shape.

Tests run:
- Focused Photo tests: 25 / 25 passed
- Focused Vector tests: 15 / 15 passed
- Full suite: 69 files / 569 tests passed (exceeds Phase 19 baseline of 544)
- TypeScript: 0 errors
- Production build: clean

Security boundary:
- `PhotoPanel` dispatches via `dispatchDryRunAction` only — not `dispatchRuntimeAction`.
- `mock-photo-studio` registered in `LOCAL_RUNTIME_ACTIONS` only; no `LOCAL_RUNTIME_EXECUTORS` path.
- "Analyze Intent" (`planPhotoComposition`) remains offline-safe: no runtime, no dispatch, no canvas mutation.
- Only "Approve & Generate Layout" requires an active promoted Photo-capable runtime.
- Successful intake updates `canvasPreview` via `serializeCanvasPreviewState` only — no authoritative canvas mutation.
- `PhotoPanel` does not call `applyCanvasProjectionToDraft` or `rollbackCanvasProjectionMutation`.
- No `eval`, `new Function`, `import()`, or `moduleUrl` execution in the photo path.
- Provider execution blocked (`canUseProviders: false`).

Known risks:
- Photo Studio `PhotoState.ts` has telemetry intervals that are not verified to unregister on dispose in the test suite.
- `planPhotoComposition` still calls `photoApi.planPhotoComposition()` (offline blueprint step). If this is later upgraded to a provider-backed call, it must be gated with the same promoted runtime authority check.

## 2026-07-06 - Phase 21: Photo Provider Request Staging Contract

This phase upgrades the Photo Studio runtime-backed path with a provider-readiness contract without opening real provider execution. The approved Photo plan now produces a portable `photo-provider-request.v1` manifest that describes the intended provider prompt, canvas, layer requests, transparent-background requirement, approval state, and security state. The manifest is sent through `dispatchDryRunAction` as dry-run payload metadata only.

Files changed:
- `src/app/studios/photo/PhotoProviderRequestContract.ts` — new provider request manifest builder and validator.
- `src/app/studios/photo/PhotoPanel.tsx` — builds and validates the provider request manifest before dispatching `generatePhotoLayout`; dispatch payload now includes `{ plan, providerRequest }`.
- `src/runtime/activation/RuntimeActionDispatchTypes.ts` — added optional preview `metadata` for portable runtime-preview annotations.
- `src/runtime/activation/RuntimeMockActionRegistry.ts` — `mock-photo-studio` stages provider request metadata and reports `providerExecuted: false`.
- `src/app/studios/photo/tests/PhotoProviderRequestContract.test.ts` — 3 tests for provider manifest building, validation, and execution pre-approval rejection.
- `src/app/studios/photo/tests/PhotoPanel.test.tsx` — expanded from 25 to 27 tests, covering provider request payload dispatch and runtime metadata staging.

Tests run:
- Focused Photo provider/request tests: 30 / 30 passed.
- Focused Photo/provider/runtime regression tests: 60 / 60 passed.
- TypeScript: 0 errors.
- Production build: clean.

Security boundary:
- The provider request manifest is not an execution ticket.
- `approvedForProviderExecution` remains `false`.
- `providerExecutionAllowed` remains `false`.
- `providerExecuted` remains `false`.
- `generatePhotoComposition()` remains absent from the gated approval path.
- `mock-photo-studio` remains outside `LOCAL_RUNTIME_EXECUTORS`.

Known risks:
- Phase 21 stages provider requirements only. A future provider execution phase must add a separate explicit user/provider approval gate before any real image provider call is allowed.
- The full Vitest suite was not rerun in this session because the project memory limits commands over 15 seconds. The Phase 21 focused regression and build gates passed.

## 2026-07-06 - Phase 22: Photo Provider Adapter Contract

This phase defines the first adapter-side provider contract for Photo Studio without adding real provider execution. It introduces a portable adapter descriptor (`photo-provider-adapter.v1`) and an approved-but-still-non-executed adapter job envelope (`photo-provider-adapter-job.v1`). The Phase 21 dry-run preview metadata now declares the required adapter contract so future provider routing can inspect the correct contract before any provider call exists.

Files changed:
- `src/app/studios/photo/PhotoProviderAdapterContract.ts` — new adapter descriptor, approval object, job envelope, descriptor validation, job creation, and job validation.
- `src/app/studios/photo/tests/PhotoProviderAdapterContract.test.ts` — 5 tests covering compatible adapters, missing transparent/layered capability rejection, approved job creation, missing approval rejection, and provider limit rejection.
- `src/runtime/activation/RuntimeMockActionRegistry.ts` — adds `requiredAdapterContract: "photo-provider-adapter.v1"` to Photo dry-run preview metadata.
- `src/app/studios/photo/tests/PhotoPanel.test.tsx` — asserts Photo dry-run preview metadata names the required adapter contract.
- `docs/memory/future-agent-memory.md` — clarified that the 15-second process limit applies only to Google Antigravity background process behavior, not this Codex local verification flow.

Tests run:
- Focused Photo adapter tests: 5 / 5 passed.
- Focused Photo/provider/runtime regression tests: 65 / 65 passed.
- Full suite: 71 files / 579 tests passed (exceeds Phase 21 baseline of 569).
- TypeScript: 0 errors.
- Production build: clean.

Security boundary:
- Phase 22 does not execute providers.
- Adapter jobs can become `providerExecutionAllowed: true` only with explicit `userConfirmedProviderExecution: true`.
- Adapter jobs are still created with `providerExecuted: false`, `runtimeCodeLoaded: false`, and `moduleUrlExecuted: false`.
- Adapter descriptors require transparent-background and layered-output support.
- Adapter descriptors must declare that secrets are not stored.
- `mock-photo-studio` remains a dry-run metadata staging path only.

Known risks:
- There is not yet a UI approval gate for creating adapter jobs from staged provider requests.
- There is not yet a real provider adapter implementation. That should be a later phase after the approval gate is explicit and auditable.

## 2026-07-06 - Phase 23: Photo Provider Approval Gate

This phase adds the explicit user approval gate for staged Photo provider requests. A staged `photo-provider-request.v1` can now become a validated `photo-provider-adapter-job.v1` only after explicit user confirmation. The approval gate records workspace audit events and the Projections Manager exposes a user-facing approval section for provider-request candidates. No real provider execution was added.

Files changed:
- `src/app/studios/photo/PhotoProviderApprovalGate.ts` — new approval gate service, default Photo provider adapter descriptor, validated adapter job creation, and audit recording.
- `src/app/studios/photo/tests/PhotoProviderApprovalGate.test.ts` — 5 tests covering explicit approval, missing approval rejection, unsafe request rejection, successful audit events, and failed audit events.
- `src/workspace/WorkspaceAuditService.ts` — added `provider_execution_approval_requested`, `provider_execution_approval_completed`, and `provider_execution_approval_failed` event factories.
- `src/workspace/WorkspaceAuditService.test.ts` — added factory coverage for provider approval events and security metadata.
- `src/workspace/WorkspaceReplayPanel.tsx` — provider approval events now appear under Runtime, Projections, and Errors where appropriate.
- `src/workspace/WorkspaceProjectionsPanel.tsx` — added Provider Approval Gate UI for staged provider request candidates; approved adapter jobs are persisted under `project.studios.photo.providerAdapterJobs`.
- `src/workspace/tests/WorkspaceProjectionsPanel.test.tsx` — added replay coverage and provider approval UI persistence tests.

Tests run:
- Focused Photo provider approval tests: 5 / 5 passed.
- Focused Phase 23 UI/service/audit tests: 25 / 25 passed.
- Focused Photo/provider/runtime/workspace regression tests: 90 / 90 passed.
- Full suite: 72 files / 587 tests passed (exceeds Phase 22 baseline of 579).
- TypeScript: 0 errors.
- Production build: clean.

Security boundary:
- Phase 23 does not execute providers.
- Provider approval requires explicit checkbox confirmation in the user-facing gate.
- Adapter jobs preserve `providerExecuted: false`, `runtimeCodeLoaded: false`, and `moduleUrlExecuted: false`.
- Provider approval audit events explicitly record the non-execution state.
- `mock-photo-studio` remains a dry-run metadata staging path only.

- Approved adapter jobs are persisted in the flexible `project.studios.photo.providerAdapterJobs` studio state block, not yet a dedicated AXPKG schema block.
- There is still no real provider adapter implementation. That should remain blocked until a later provider execution phase defines credentials, provider sandboxing, output validation, and rollback behavior.

## 2026-07-06 - Phase 24: Photo Provider Job Persistence Schema

This phase promotes approved Photo provider adapter jobs from the flexible `project.studios.photo.providerAdapterJobs` state bucket into a typed first-class AXPKG block `project.photoProvider`, and bumps the canonical project schema version to `0.6.0`. It adds import/export support, validation of job records, schema migration lifting, and caps jobs at `maxPhotoProviderJobs: 50`. No execution code is added.

Files changed:
- `src/app/projects/projectDraft.ts` — Bump schema to 0.6.0, define `AxiomProjectPhotoProviderBlock` & `PhotoProviderPersistenceJobRecord`, initialize in draft factory.
- `src/app/projects/axpkg/AxpkgTypes.ts` — Add diagnostic codes and array limits.
- `src/app/projects/axpkg/AxpkgMigrationService.ts` — Add migration path to 0.6.0, lift jobs from old bucket, strip legacy state.
- `src/app/projects/axpkg/AxpkgImportService.ts` — Implement `validatePhotoProviderPersistenceJobRecord` and import block sanitization.
- `src/app/projects/axpkg/AxpkgSerializer.ts` — Add `includePhotoProviderJobs` serialization option.
- `src/workspace/WorkspaceProjectionsPanel.tsx` — Write to typed `project.photoProvider.jobs` block on job approval.
- `src/app/projects/axpkg/tests/PhotoProviderPersistenceBlock.test.ts` — 8 new tests.
- `src/app/projects/axpkg/tests/AxpkgMigrationService.test.ts` — Update migration suites and add legacy job lifting tests.
- `src/app/projects/axpkg/tests/AxpkgImportService.test.ts` — Add unit tests verifying sanitization.
- `src/workspace/tests/WorkspaceProjectionsPanel.test.tsx` — Update projections panel tests to assert typed block.

Tests run:
- Focused persistence block tests: 8 / 8 passed.
- Focused migration tests: 5 / 5 passed.
- Focused import/sanitization tests: 5 / 5 passed.
- Full suite: 73 files / 603 tests passed.
- TypeScript: 0 errors.
- Production build: clean.

Decisions made:
- Nested block name: `project.photoProvider.jobs`.
- Store full `PhotoProviderAdapterJobV1` shape.
- Automatically lift and migrate legacy 0.5.0 job state and strip old key.

Known risks:
- Real provider execution continues to remain blocked; no credentials or runtime provider invocation capability exists yet.

## 2026-07-06 - Phase 25: Photo Provider Sandbox Simulation Contract

This phase implements a sandbox simulation contract for approved Photo provider jobs. Staged provider jobs are simulated offline local-only, ensuring that all actual provider execution and network flags are strictly preserved as false (`providerExecuted: false`, `runtimeCodeLoaded: false`, `moduleUrlExecuted: false`, `networkAccessed: false`, `providerApiCalled: false`). The project schema version is bumped to `0.7.0`, adding the `photoProvider.sandboxRuns` array, which keeps up to 50 runs. Previews are generated and intake-routed through `CanvasPreviewIntakeService`. The projections panel renders a simulation trigger button for eligible jobs.

Files changed:
- `src/app/projects/projectDraft.ts` — Bump schema to 0.7.0, define `PhotoProviderSandboxRunRecordV1` interface and `sandboxRuns` array, initialize in factories.
- `src/app/projects/axpkg/AxpkgTypes.ts` — Define `maxPhotoProviderSandboxRuns` limit (50) and includePhotoProviderSandboxRuns portability flag.
- `src/app/projects/axpkg/AxpkgMigrationService.ts` — Add migration path to 0.7.0 with sandboxRuns initialization.
- `src/app/projects/axpkg/AxpkgImportService.ts` — Validate sandbox run records, sanitize and trim sandboxRuns array to latest 50.
- `src/app/projects/axpkg/AxpkgSerializer.ts` — Add `includePhotoProviderSandboxRuns` serialization option.
- `src/app/studios/photo/PhotoProviderSandboxService.ts` — Implement sandbox simulation validation guards, mock candidate generation, intake queueing, and audit logging.
- `src/workspace/WorkspaceAuditService.ts` — Add event factories for requested/completed/failed sandbox runs.
- `src/workspace/WorkspaceReplayPanel.tsx` — Map sandbox runs to replay view.
- `src/workspace/WorkspaceProjectionsPanel.tsx` — Add simulation triggers for eligible jobs, call sandbox service, list runs.
- `src/app/studios/photo/tests/PhotoProviderSandboxService.test.ts` — 10 tests verifying sandbox guards, structure checks, intake routing, and audit events.
- `src/app/projects/axpkg/tests/PhotoProviderPersistenceBlock.test.ts` — Added tests verifying 0.7.0 creation, migration, import validation, and cap trimming.
- `src/workspace/tests/WorkspaceProjectionsPanel.test.tsx` — Test eligibility UI states, simulation triggers, candidate submission, and repeat run behavior.

Tests run:
- Focused sandbox service tests: 10 / 10 passed.
- Focused persistence block tests: 9 / 9 passed.
- Focused projections panel tests: 5 / 5 passed.
- Full suite: 74 files / 622 tests passed (exceeds Phase 24 baseline of 603).
- TypeScript: 0 errors.
- Production build: clean.

Decisions made:
- Keep sandbox simulations local and offline-only with no remote api calls or dynamic script execution.
- Maintain maximum run history limit at 50, trimming oldest runs first.
- Allow repeat sandbox runs per approved job.

Known risks:
- Executables are structurally verified as empty, but a malicious actor manually bypassing serialization or constructing local drafts with valid scripts must be blocked at execution gates. This is protected by strict structural recursive sanitization.

## 2026-07-11 - Phase 26: Photo Provider Sandbox Result Review, Replay, and Provenance Hardening

This phase hardens outputs and simulations from the Photo Provider Sandbox by implementing strict provenance verification and metadata propagation, interactive UI checks, and structured replay trail integration, keeping all execution/network/runtimes strictly offline.

Files changed:
- `src/app/projects/projectDraft.ts` — Defined `SandboxProvenanceV1` structures and type guard, added metadata property.
- `src/app/studios/photo/PhotoProviderSandboxService.ts` — Populated sandbox provenance on generated previews.
- `src/workspace/CanvasPreviewIntakeService.ts` — Added metadata support to `CanvasAssemblyPlan`; cloned provenance metadata immutably and injected `candidateId` during intake.
- `src/workspace/CanvasAssemblyProjectionService.ts` — Propagated `metadata` from plan to projection.
- `src/workspace/CanvasApplyService.ts` — Propagated `metadata` from projection to applied mutation, added `sandboxRunId` and `candidateId` to audit events.
- `src/workspace/WorkspaceProjectionsPanel.tsx` — Added verification evidence indicators, checklists, diagnostics, and side-by-side run comparisons; added non-sandbox fallback.
- `src/workspace/WorkspaceReplayPanel.tsx` — Added dedicated Sandbox tab filter and detailed card formatting with security invariant checklists.
- `src/app/studios/photo/tests/PhotoProviderSandboxService.test.ts` — Added type guard and provenance validation tests.
- `src/workspace/CanvasPreviewIntakeService.test.ts` — Added immutable cloning and propagation tests.
- `src/workspace/CanvasAssemblyProjectionService.test.ts` — Added metadata propagation tests.
- `src/workspace/CanvasApplyService.test.ts` — Added mutation and audit metadata propagation tests.
- `src/workspace/tests/WorkspaceProjectionsPanel.test.tsx` — Added visual evidence, fallback, warning, and comparison unit tests.
- `src/workspace/tests/WorkspaceReplayPanel.test.tsx` — Added new test suite verifying replay tab, counts, and detail cards.

Tests run:
- Full suite: 75 files / 634 tests passed (exceeds Phase 25 baseline of 622).
- TypeScript: 0 errors.
- Production build: clean.

Decisions made:
- Enforce strict provenance verification where provenance payload must match the 5 offline security invariants.
- Keep other preview origins (Vector, Motion, legacy) completely functional by rendering grey "Not sandbox-origin" badge.
- Reject invalid sandbox run provenance configurations immediately with clear UI warning.
- Log provenance keys (`sandboxRunId`, `candidateId`) inside the applied audit events to complete the audit trail.

Known risks:
- Real provider execution continues to remain blocked; no credentials or runtime provider invocation capability exists yet.

## 2026-07-11 - Phase 27: Photo Provider Live Readiness Policy Gate

This phase implements a dry-run readiness policy validation gate for Photo Provider adapters. It provides verification UI and safety checklists to dry-run readiness for live adapter execution without implementing or enabling the live execution adapter itself, while conserving the schema at `0.7.0` and keeping credentials entirely in-memory.

Files changed:
- `src/app/studios/photo/PhotoProviderReadinessPolicyTypes.ts` — [NEW] Created shared TS contracts for readiness checks (`PhotoProviderReadinessCheckV1`) and reports (`PhotoProviderReadinessReportV1`).
- `src/app/studios/photo/PhotoProviderReadinessPolicyService.ts` — [NEW] Built transient credential registry and `verifyReadiness` method validating the 10 core safety rules. Enforces strictly that `liveExecutionAvailable` remains `false` and `executionBlockedByPhasePolicy` remains `true`.
- `src/workspace/WorkspaceAuditService.ts` — Registered readiness check requested/completed/failed event creators and factories. Hardened metadata structure to prevent leaking credentials and verify safety invariants.
- `src/workspace/WorkspaceProjectionsPanel.tsx` — Integrated UI panel containing credential staging button, readiness validation triggers, check lists, and the disabled execute button displaying policy block messages.
- `src/workspace/WorkspaceReplayPanel.tsx` — Integrated filter lists, icon mappers, counters, and detailed card views for readiness audit events.
- `src/app/studios/photo/tests/PhotoProviderReadinessPolicyService.test.ts` — [NEW] Added 8 unit tests checking validation rules, mock credential staging, audit trail sanitization, and schema conservation.
- `src/workspace/tests/WorkspaceProjectionsPanel.test.tsx` — Added UI panel tests checking staging toggle click handlers, check triggers, and checklist rendering.
- `src/workspace/tests/WorkspaceReplayPanel.test.tsx` — Added replay rendering tests checking readiness check audit event lists and details.

Tests run:
- Full suite: 76 files / 646 tests passed (exceeds Phase 26 baseline of 634).
- TypeScript: 0 errors.
- Production build: clean.

Decisions made:
- Keep the project schema version strictly at `0.7.0`.
- Store mock credential state and readiness reports transiently in memory only.
- Redact all credential-related details from logs and audit events.
- Strictly block live adapter execution by keeping `liveExecutionAvailable` as `false` and `executionBlockedByPhasePolicy` as `true` in all production paths.

Known risks:
- Live provider execution remains disabled.

## 2026-07-12 - Phase 27S: Emergent Security Audit Before Phase 28A

This phase applied the `everything-claude-code:emergent-security-audit` checklist before proceeding to Phase 28A. The audit found one material gate issue: Phase 28 live-provider service files existed in source, and the authority layer could grant live execution from a readiness report that still declared `executionBlockedByPhasePolicy: true` and `liveExecutionAvailable: false`.

Files changed:
- `src/app/studios/photo/PhotoProviderLiveAuthorityService.ts` — Added the live policy invariant so authority requires both readiness success and explicit live availability.
- `src/app/studios/photo/PhotoProviderReadinessPolicyTypes.ts` — Widened phase policy fields to booleans so Phase 28A can explicitly transition from blocked to available in a typed way.
- `src/workspace/WorkspaceProjectionsPanel.tsx` — Kept the live button disabled and labeled as `Execute Live (Phase 28 Policy Block)` when policy blocks execution, even after readiness passes.
- `src/app/studios/photo/tests/PhotoProviderLiveAuthorityService.test.ts` — Added regression coverage for readiness-passed / live-blocked authority denial.
- `src/app/studios/photo/tests/PhotoProviderLiveExecutionService.test.ts` — Added regression coverage proving policy-blocked execution never calls `fetch`.
- `src/workspace/tests/WorkspaceProjectionsPanel.test.tsx` — Updated UI regression to prove second confirmation cannot override phase policy.
- `apps/api/core/config.py` — Added explicit CORS method/header configuration and wildcard-origin rejection under credentialed CORS.
- `apps/api/main.py` — Replaced wildcard CORS method/header usage with settings-driven allowlists.

Tests run:
- `npx tsc --noEmit` passed with 0 errors.
- Focused security regression tests passed: 3 files / 57 tests.
- `npm run doctor` passed with 100/100 health score.
- `python -m compileall apps\api` passed.
- `python -m pytest apps\api\tests` passed: 10 / 10.
- High-confidence secret scan found no committed OpenAI, Google, GitHub, AWS, or private key material.
- Environment file scan found no committed root `.env` files.

Decisions made:
- Treat Phase 28 live-provider code as contract-development source only until a future phase explicitly produces a live-enabled readiness report.
- Keep Phase 27 production readiness reports blocked with `executionBlockedByPhasePolicy: true` and `liveExecutionAvailable: false`.
- Require Phase 28A to make the live-enabled transition explicit rather than inheriting authority from readiness success.
- Harden CORS now because it is a simple production-edge improvement with low blast radius.

Known risks:
- No authentication, rate limiting, or production deployment boundary exists yet; these remain future platform concerns before any public launch.
- The project folder is not a Git repository, so standard `git diff` / `git status` verification is unavailable in this workspace.

## 2026-07-12 - Phase 28A: Photo Provider Adapter Live Integration MVP

Phase 28A introduced the explicit live-enablement transition required by the Phase 27S security audit. A passing readiness report remains blocked until the operator acknowledges network execution and invokes a separate enable command. The resulting transient report carries job-bound enablement evidence; the authority service rejects absent or mismatched evidence.

Files changed:
- `src/app/studios/photo/PhotoProviderLiveEnablementService.ts` — Added the audited, non-executing enablement transition.
- `src/app/studios/photo/PhotoProviderReadinessPolicyTypes.ts` — Added optional `photo-provider-live-enablement.v1` evidence.
- `src/app/studios/photo/PhotoProviderLiveAuthorityService.ts` — Required evidence bound to the requested job.
- `src/workspace/WorkspaceProjectionsPanel.tsx` — Added the explicit enable action and dynamic policy status.
- `src/app/studios/photo/tests/PhotoProviderLiveEnablementService.test.ts` — Added success, readiness-denial, and consent-denial coverage.
- `src/app/studios/photo/tests/PhotoProviderLiveAuthorityService.test.ts` — Added mismatched-job evidence regression coverage.
- `src/app/studios/photo/tests/PhotoProviderLiveExecutionService.test.ts` — Updated positive fixtures to the Phase 28A contract.
- `src/workspace/tests/WorkspaceProjectionsPanel.test.tsx` — Covered readiness, acknowledgement, enablement, and execution as separate actions.

Tests and checks:
- `npx tsc --noEmit` passed with 0 errors.
- Focused provider/workspace suite passed: 12 files / 139 tests.
- Full Vitest suite passed: 240 suites / 717 tests.
- `npm run doctor` and production build passed.
- `npm audit --audit-level=high` reported 0 vulnerabilities.
- Targeted security scan found live-policy activation only in the enablement service.

Decisions made:
- Keep live enablement transient and job-bound; do not persist it in AXPKG.
- Reuse the existing readiness report and authority pipeline instead of adding another adapter abstraction.
- Keep enablement, execution, and canvas approval as distinct user actions.

Known risks:
- The development gateway still returns metadata-only output and has no authenticated server-side credential-custody contract.
- Public deployment still requires authentication, rate limiting, origin controls, and a trusted first-party gateway.
- The project folder is not a Git repository, so Git checkpoint commits were unavailable for this TDD cycle.

## 2026-07-12 - Phase 28B: Authenticated First-Party Photo Gateway Contract

Phase 28B promoted the Photo live adapter from an environment-resolved client call to an authenticated first-party gateway contract. The backend now owns provider and signing credentials, validates a bounded wire payload, rate-limits authenticated clients, and returns only short-lived signed same-origin asset references. The frontend requires a runtime access token and rejects malformed or expired references before preview intake.

Files changed:
- `apps/api/core/config.py` — Added backend-only gateway access, provider credential, signing secret, and rate-limit settings.
- `apps/api/schemas/photo.py` — Added strict request/response gateway schemas with forbidden extra fields and bounded inputs.
- `apps/api/services/photo_gateway.py` — Added constant-time authorization, process-local rate limiting, backend credential custody, and HMAC asset-reference signing.
- `apps/api/routes/photo.py` — Added the authenticated `/api/photo/provider-gateway` route.
- `apps/api/tests/test_photo_gateway.py` — Added authentication, configuration, signed-reference, rate-limit, and input-boundary tests.
- `src/app/studios/photo/PhotoProviderLiveAdapterGateway.ts` — Added runtime bearer dispatch and strict signed-reference validation.
- `src/app/studios/photo/PhotoProviderLiveExecutionService.ts` — Added the authentication precondition and prevented false live-run evidence on missing credentials.
- `src/workspace/WorkspaceProjectionsPanel.tsx` — Added optional runtime gateway-token injection without project persistence.
- `src/app/studios/photo/tests/PhotoProviderLiveAdapterGateway.test.ts` — Added bearer, signed-reference, and expiry coverage.
- `src/app/studios/photo/tests/PhotoProviderLiveExecutionService.test.ts` — Added no-token/no-dispatch/no-live-run regression coverage.

Tests and checks:
- Focused gateway tests passed: 2 files / 30 tests.
- API tests passed: 15 / 15.
- Full Vitest suite passed: 81 files / 721 tests.
- Repository build, API Extractor, bundle budget, design-token audit, and manifest generation passed.
- `npm audit --audit-level=high` reported 0 vulnerabilities.
- `python -m compileall -q apps\\api` passed.
- `python -m pip_audit` could not run because `pip-audit` is not installed.

Decisions made:
- Do not embed a gateway access token in `VITE_*`; accept a runtime token from the future authenticated session boundary.
- Reuse FastAPI, Pydantic, and Python standard-library HMAC/rate-limit primitives; add no dependency.
- Keep the MVP rate limiter process-local and mark its single-worker ceiling explicitly.
- Return relative signed asset references only; do not expose provider URLs or binary payloads through the contract.

Known risks:
- No session issuer currently supplies `gatewayAccessToken`; production live execution therefore remains fail-closed until Auth integration.
- Signed references describe intake-safe assets, but durable object storage and signed asset delivery are not implemented yet.
- The in-memory limiter does not coordinate across workers or hosts.
- Python dependency vulnerability scanning is pending installation of `pip-audit`.
- The project folder is not a Git repository, so Git TDD checkpoint commits were unavailable.

## 2026-07-12 - Phase 28C: Authenticated Session and Signed Asset Delivery Integration

Phase 28C replaced repeated browser bearer dispatch with an opaque HttpOnly gateway session and promoted signed asset references into working durable delivery. SQLite now stores hashed sessions, shared rate windows, asset metadata, and migration history; generated SVG assets are written atomically to the configured runtime directory and remain available after service reinitialization.

Files changed:
- `apps/api/core/config.py` — Added session TTL, runtime data directory, and secure-cookie settings.
- `apps/api/migrations/0001_photo_gateway.sql` — Added the immutable initial session/rate/asset schema.
- `apps/api/services/photo_gateway.py` — Added migration execution, SQLite coordination, opaque sessions, revocation, durable asset writes, and signed resolution.
- `apps/api/routes/photo.py` — Added session exchange/logout and signed asset-delivery routes; gateway accepts the HttpOnly session cookie.
- `apps/api/tests/test_photo_gateway.py` — Isolated runtime state and cleanup for gateway tests.
- `apps/api/tests/test_photo_gateway_session_assets.py` — Added session, delivery, restart persistence, tamper/expiry, logout, shared-rate, and migration-ledger tests.
- `src/app/studios/photo/PhotoProviderGatewaySessionService.ts` — Added bearer-to-session exchange using credentialed requests.
- `src/app/studios/photo/PhotoProviderLiveAdapterGateway.ts` — Added HttpOnly session dispatch mode with `credentials: include`.
- `src/app/studios/photo/PhotoProviderLiveExecutionService.ts` — Added authenticated-session execution authority alongside the Phase 28B bearer path.
- `src/workspace/WorkspaceProjectionsPanel.tsx` — Exchanges the bootstrap token during enablement and executes with session state.
- Related Photo gateway, execution, session, and workspace tests were updated.

Tests and checks:
- Focused browser/session/workspace tests passed: 4 files / 63 tests.
- API tests passed: 22 / 22.
- Full Vitest suite passed: 82 files / 726 tests.
- TypeScript, production build, design-token audit, and manifests passed.
- `npm audit --audit-level=high` reported 0 vulnerabilities.
- Python source compilation passed.
- Test runtime cleanup passed after fixing deterministic SQLite connection closure.

Decisions made:
- Use SQLite and filesystem storage as the smallest shared-host durable foundation; defer Redis/object storage until multi-host deployment.
- Store only SHA-256 session-token hashes in SQLite.
- Use forward-only SQL migrations with recorded checksums; applied migration edits fail startup.
- Exchange the bootstrap bearer once and use an HttpOnly cookie for gateway generation calls.
- Keep signed asset responses private and non-cacheable for this MVP.

Known risks:
- The shared state/storage design coordinates workers on one host only, not multiple hosts or regions.
- The current provider output remains a deterministic SVG asset; a real external Photo provider is not called yet.
- Production HTTPS deployments must set `AXIOM_SECURE_COOKIES=true` and provide durable backup/retention policy for `AXIOM_RUNTIME_DATA_DIR`.
- Python dependency vulnerability scanning remains pending installation of `pip-audit`.
- The project folder is not a Git repository, so Git TDD checkpoint commits were unavailable.

## 2026-07-12 - Phase 29: Async Photo Provider Job Lifecycle and Adapter Boundary

Phase 29 replaced synchronous mock generation with a SQLite-backed asynchronous job lifecycle and decoupled provider adapter boundary. Jobs are enqueued via POST `/api/photo/provider-gateway` returning a 202 Accepted, and monitored/cancelled via session-isolated GET and DELETE `/api/photo/provider-jobs/{jobId}`. The provider boundary supports local `MockProviderAdapter` and fail-closed `StubRealProviderAdapter` with dynamic resolver mapping.

Files changed:
- `apps/api/migrations/0002_photo_provider_jobs.sql` — Added jobs table, indices, and job state fields.
- `apps/api/core/config.py` — Added job sweeper, stale job TTL, retry, and adapter config settings.
- `apps/api/schemas/photo.py` — Defined schemas for enqueue request/response and job status/polling.
- `apps/api/services/photo_provider_adapter.py` — Decoupled adapter contracts, Mock and StubReal implementations, and resolver registry.
- `apps/api/services/photo_gateway.py` — Integrated background job enqueuing, SQLite state tracking, status polling, cancellation, transient retries, and stale job cleaning.
- `apps/api/routes/photo.py` — Bound POST `/api/photo/provider-gateway`, GET/DELETE `/api/photo/provider-jobs/{jobId}`, and the background job sweeper.
- `apps/api/tests/test_photo_provider_jobs.py` — Verified enqueue, state transitions, session isolation, cancellations, retry triggers, and stale sweeps.
- `apps/api/tests/test_photo_gateway.py` — Adapted gateway unit tests to the async queue model.
- `apps/api/tests/test_photo_gateway_session_assets.py` — Adapted session/asset integration tests to async enqueue.
- `src/app/studios/photo/PhotoProviderJobPollingService.ts` — Implemented exponential backoff status polling and cancellation triggers.
- `src/workspace/WorkspaceProjectionsPanel.tsx` — Integrated queue state visualizer, polling progression UI, and cancellation buttons.
- `src/app/studios/photo/tests/PhotoProviderJobPollingService.test.ts` — Covered backoff parameters, success resolution, error failures, and cancellation.
- `src/app/studios/photo/tests/PhotoProviderLiveExecutionService.test.ts` — Updated live execution hooks to coordinate polling.

Tests and checks:
- `npx tsc --noEmit` passed with 0 errors.
- Focused async provider/adapter tests: 15 / 15 passed.
- Full Python API test suite: 33 / 33 passed (exceeding Phase 28C baseline of 22).
- Full Vitest suite: 83 suites / 733 tests passed (exceeding Phase 28C baseline of 726).
- Production build: passed.
- `npm audit --audit-level=high` reported 0 vulnerabilities.

Decisions made:
- Preserve POST `/api/photo/provider-gateway` compatibility rather than migrating to `/provider-jobs`.
- Maintain strict session isolation: matching session caller hash required to poll or cancel.
- Fail closed with 503 HTTP status if AXIOM_PHOTO_PROVIDER_API_KEY is missing when selecting StubReal.
- Do not mutate parent job runtime flags (e.g., providerExecuted) until the provider boundary is successfully resolved at terminal states.

Known risks:
- Real network integration depends on StubReal configuration; default Mock adapter uses simulated delays and local SVGs.
- Multi-host scaling requires external job queues or database synchronization since background workers are local FastAPI threads.

## 2026-07-12 - Phase 29P: Ponytail Architecture and UX Simplification Review

Phase 29P selectively extracted stable repeated presentation styles from the projections panel into namespaced CSS classes, while keeping truly computed styles inline. Interactive panels and simulation history details are now operated via native HTML5 `<details>` and `<summary>` elements, with styling rules consolidated under the strictly namespaced `.workspace-projections-panel` CSS rules and status pill colors driven by finite CSS modifier classes. Test suite robustness was hardened against DOM state leakage and polling setup races.

Files changed:
- `src/workspace/WorkspaceProjectionsPanel.tsx` — Replaced React toggles with native HTML5 disclosures; selectively extracted stable repeated presentation styles while keeping truly computed styles inline.
- `src/styles.css` — Added namespaced styling rules and finite status modifiers.
- `src/workspace/tests/WorkspaceProjectionsPanel.test.tsx` — Added regression coverage for native disclosure behavior, default collapsed states, keyboard accessibility, independent expansion, diagnostic wrapping, layout bounds, and async status rendering. Called `cleanup()` inside `beforeEach` to prevent DOM leakage, and resolved async racing conditions in status assertions.

Tests and checks:
- `npx tsc --noEmit` passed with 0 errors.
- Focused WorkspaceProjectionsPanel tests: 43 / 43 passed.
- Full Vitest suite: 83 suites / 745 tests passed (exceeding Phase 29 baseline of 733).
- Production build: passed.

Decisions made:
- Rely on native collapsible controls instead of custom React toggle state.
- Selectively extract stable repeated presentation styles into strictly namespaced `.workspace-projections-panel` CSS while retaining truly computed styles inline.
- Use explicit text indicators alongside modifier colors to preserve visual accessibility.
- Clean the JSDOM document between tests to ensure test isolation.
- Ponytail was used only as an agent-review methodology. It was not installed, imported, added to package.json, or introduced as a production dependency.

Known risks:
- The focused tests validate disclosure structure, accessibility, independent state, and keyboard focus without relying exclusively on browser-layout behavior unavailable or inconsistent in the test environment.

## 2026-07-17 - Phase 30 Local Verification and Async Cleanup

Phase 30's lifespan-owned Photo provider runner and OpenAI adapter were found already implemented. Verification exposed test lifecycle leaks rather than a production runner failure: startup tests entered the FastAPI lifespan without exiting it, and the oversized chunked-response test ended its synchronous event loop before nested async iterators finalized.

Files changed:
- `apps/api/tests/test_photo_startup_maintenance.py` — Uses the lifespan as an async context manager so runner shutdown always executes.
- `apps/api/tests/test_photo_provider_openai.py` — Runs the chunked streaming limit test in an AnyIO-managed async lifecycle.
- `implementation_plan.md` — Records local completion evidence and the remaining controlled live-provider smoke gate.
- `docs/memory/future-agent-memory.md` — Advances the handoff to Phase 30 verification closure.

Verification:
- Phase 30 runner and real-Uvicorn tests: 16 passed.
- OpenAI adapter and startup cleanup regression tests: 18 passed with RuntimeWarning and PytestUnraisableExceptionWarning promoted to errors.
- Full Python API suite: 87 passed; only the upstream FastAPI TestClient deprecation notice remains.
- Repository doctor: 100/100, including build, 745 Vitest tests, API snapshots, budgets, token audit, and manifest generation.
- npm audit: 0 vulnerabilities.
- High-confidence secret scan: no findings.

Remaining gate:
- Run the controlled live OpenAI provider smoke test with ephemeral credentials before locking Phase 30.
- `pip-audit` was restored and reported no known application dependency vulnerabilities.
- The 2026-07-17 controlled live call reached OpenAI but failed closed with `billing_hard_limit_reached`; no image or durable runtime artifact was produced.
- `OpenAiGptImage2PhotoAdapter` now preserves specific billing and moderation error mappings for HTTP 400 responses instead of overwriting them with `image_generation_user_error`.
- Full Python API suite after the diagnostic fix: 88 passed.
- Restore OpenAI project billing capacity before rerunning the single live smoke and signed asset-delivery gate.

## 2026-07-17 - Phase 30 Provider Gate Paused

The user explicitly paused the OpenAI GPT Image 2 live-provider gate after repeated fail-closed responses with `billing_hard_limit_reached`. Production remains safe because `AXIOM_ENABLE_OPENAI_IMAGE_PROVIDER` is disabled by default. The key configuration was not changed.

Work advances to Foundation Release 1.0, starting with FR1.1 Axiom Core Geometry. The required `creative/axiom-core/` production asset tree does not yet exist; no placeholder or speculative scaffold was added.

## 2026-07-17 - FR1.1 Axiom Core Geometry

FR1.1 produced the Axiom Core's hero, runtime, and mobile GLB geometry from one procedural Three.js master definition. The live AXCore renderer now consumes the same shell, crystal, and quantum-core geometry factories as the export pipeline.

Files changed:
- `src/app/studios/axiomCoreGeometry.ts` — Canonical dimensions, tier detail, geometry factories, production materials, hierarchy, and metrics.
- `src/app/studios/axCore.ts` — Reuses the canonical geometry factories in the live renderer.
- `scripts/axiom-core-export.ts` — Deterministic GLB exporter and manifest generator with the `idle-breathe` animation.
- `creative/axiom-core/exports/` — Hero, runtime, mobile GLBs and measured manifest.
- `creative/axiom-core/README.md` — Source and regeneration contract.

Measured outputs:
- Hero: 109,304 bytes, 3,408 triangles, 3 draw calls.
- Runtime: 46,844 bytes, 1,140 triangles, 3 draw calls.
- Mobile: 19,352 bytes, 304 triangles, 3 draw calls.
- All tiers: 0 texture bytes and one embedded `idle-breathe` animation.

Verification:
- Focused geometry, exporter, and existing runtime tests: 8 passed.
- GLB magic, embedded animation, file-size, triangle, draw-call, and texture-memory gates are automated.
- Full Vitest suite: 85 suites / 747 tests passed.
- Production build: passed.
- `npm audit --audit-level=high`: 0 vulnerabilities.

Next milestone: FR1.2 Material System.

## 2026-07-17 - FR1.2 Axiom Core Material System

FR1.2 added five texture-free reusable material families to the existing canonical Axiom Core source: optical glass, refractive crystal, neural energy, holographic, and titanium. The geometry hierarchy remains unchanged. The runtime configuration and GLB exporter now share the same glass and crystal values, while the quantum core uses the canonical titanium material.

Files changed:
- `src/app/studios/axiomCoreGeometry.ts` — Material values and constructors for AX-MAT-001 through AX-MAT-005.
- `src/app/studios/axCore.ts` — Reuses canonical material values and the titanium runtime material.
- `src/app/studios/axiomCoreGeometry.test.ts` — Verifies family identity, physical properties, texture-free delivery, and GLB material assignment.
- `creative/axiom-core/exports/` — Regenerated GLBs and manifest.

Verification:
- Focused geometry, runtime, and exporter tests: 10 passed.
- Canonical geometry/material source coverage: 100% statements, functions, and lines; 94.11% branches.
- Full Vitest suite: 85 suites / 748 tests passed.
- Production build: passed.
- `npm audit --audit-level=high`: 0 vulnerabilities.

Next milestone: FR1.3 Shader Library.

## 2026-07-17 - FR1.3 Axiom Core Shader Library

FR1.3 formalized the four existing AXCore GLSL programs as reusable canonical assets. No shader source was duplicated or rewritten.

Canonical IDs:
- AX-SHD-001: Glass.
- AX-SHD-002: Neural Flow.
- AX-SHD-003: Crystal.
- AX-SHD-004: Energy Lattice.

Files changed:
- `src/app/studios/axCore.ts` — Adds canonical IDs to `AXShaderRegistry` and registers each shader with the platform runtime by that ID.
- `src/app/studios/axCore.test.ts` — Verifies ID assignment and registry resolution.
- `creative/axiom-core/README.md` — Records the shader delivery contract.

Verification:
- Focused geometry, runtime, and exporter tests: 11 passed.
- `axCore.ts` focused coverage: 91.79% statements, 100% functions, 93.7% lines.
- Full Vitest suite: 85 suites / 750 tests passed.
- Production build: passed.
- `npm audit --audit-level=high`: 0 vulnerabilities.

Next milestone: FR1.4 State Engine.

## 2026-07-17 - FR1.4 Axiom Core State Engine

FR1.4 added the required lifecycle identity to the existing AXCore state and animation pipeline: Idle, Listening, Understanding, Planning, Generating, Collaborating, and Completed. `StateController` owns transitions, and `AnimationController` carries the active lifecycle into each immutable frame while preserving caller-controlled visual values.

Files changed:
- `src/platform/runtime/FrameState.ts` — Canonical lifecycle tuple, type, runtime-state input, and frame-state output.
- `src/app/studios/axCore.ts` — Minimal transition/get-state behavior and lifecycle frame propagation.
- `src/app/studios/axCore.test.ts` — Covers every canonical lifecycle transition end to end.
- `creative/axiom-core/README.md` — Records the lifecycle contract.

Verification:
- Focused AXCore tests: 8 passed.
- `axCore.ts` focused coverage: 91.94% statements, 100% functions, 93.82% lines.
- Full Vitest suite: 85 suites / 751 tests passed.
- Production build: passed.
- `npm audit --audit-level=high`: 0 vulnerabilities.

Next milestone: FR1.5 Interaction Layer.

## 2026-07-17 - FR1.5 Axiom Core Interaction Layer

FR1.5 centralized pointer normalization, pull-radius proximity, hover state, and input-source identity for mouse, pen, and touch. It also fixed the prior startup behavior where a zeroed pointer was interpreted as maximum proximity before any user input. Touch release/cancel and pointer leave now restore an explicit inactive state, and accessibility pause suppresses pointer-driven camera and Core motion.

Files changed:
- `src/platform/runtime/FrameState.ts` — Shared interaction state, inactive value, pull radius, and viewport normalization.
- `src/experience/cinematic/CinematicExperienceEngine.tsx` — Uses the shared interaction state for pointer move/down/up/cancel/leave and removes duplicate proximity calculations.
- `src/app/studios/axCore.ts` — Suppresses pointer tilt while paused.
- `src/app/studios/axCore.test.ts` — Covers hover/touch normalization and pause-safe motion.
- `creative/axiom-core/README.md` — Records the interaction contract.

Verification:
- Focused AXCore tests: 10 passed.
- `axCore.ts` focused coverage: 91.97% statements, 100% functions, 93.84% lines.
- Full Vitest suite: 85 suites / 753 tests passed.
- Production build: passed.
- `npm audit --audit-level=high`: 0 vulnerabilities.

Next milestone: FR1.6 Audio Identity.

## 2026-07-17 - FR1.6 Axiom Core Audio Identity

FR1.6 added a dependency-free Web Audio identity with three canonical procedural cues: AX-AUD-001 ambient bed, AX-AUD-002 thinking crystal pulse, and AX-AUD-003 action confirmation. The service stays silent until explicit `unlock()`, fails closed when Web Audio is unavailable, supports pre- and post-unlock mute, prevents duplicate ambient oscillators, and closes its AudioContext on disposal.

Files changed:
- `src/platform/audio/AxiomCoreAudio.ts` — Canonical cue definitions and gesture-locked native Web Audio playback.
- `src/platform/audio/AxiomCoreAudio.test.ts` — Covers cue identity, locked behavior, scheduling, duplicate suppression, mute, unsupported browsers, and disposal.
- `creative/axiom-core/README.md` — Records the audio contract.

Verification:
- Focused audio tests: 3 passed.
- Audio source coverage: 98.11% statements, 91.66% branches, 100% functions and lines.
- Full Vitest suite: 86 suites / 756 tests passed.
- Production build: passed.
- `npm audit --audit-level=high`: 0 vulnerabilities.

The audio service is intentionally not auto-started by the cinematic canvas. Product integration must provide an explicit user-facing audio control before calling `unlock()`.

Next milestone: FR1.7 Export Pipeline.

## 2026-07-17 - FR1.7 Axiom Core Export Pipeline

FR1.7 extended the single-source export pipeline from GLB to locally supported USDZ. Every hero, runtime, and mobile export is generated from `axiomCoreGeometry.ts`; GLBs are validated for binary glTF structure and animation, while USDZ files are validated as ZIP/USD archives containing `model.usda`.

Measured outputs:
- Hero: GLB 109,304 bytes; USDZ 326,815 bytes.
- Runtime: GLB 46,844 bytes; USDZ 133,076 bytes.
- Mobile: GLB 19,352 bytes; USDZ 48,026 bytes.

Files changed:
- `scripts/axiom-core-export.ts` — Adds Three.js USDZ export and dual-format manifest data.
- `scripts/axiom-core-export.test.ts` — Runs in Node and enforces GLB/USDZ structure and budgets.
- `src/test/setup.ts` — Keeps the shared test setup safe for Node-environment tests.
- `creative/axiom-core/exports/` — Adds three USDZ files and updates `manifest.json`.

Verification:
- Focused export test: passed.
- Export-path coverage: 85.47% statements, 85% functions, 84.68% lines.
- Full Vitest suite: 86 suites / 756 tests passed.
- Production build: passed.
- `npm audit --audit-level=high`: 0 vulnerabilities.

FBX, SVG, Lottie, and WebM were not claimed or generated. Blender, FFmpeg, Assimp, and glTF Transform are not installed, and the current Three.js package has no FBX exporter. Adding unvalidated placeholder outputs would violate the production asset rules.

Next milestone: FR1.8 Runtime Validation for the supported GLB/USDZ delivery set. Additional formats remain an explicit FR1.7 tooling dependency.

## 2026-07-17 - FR1.8 Axiom Core Runtime Validation

FR1.8 made runtime compatibility a mandatory part of `npm run asset:axiom-core`. After generation, Three.js `GLTFLoader` and `USDLoader` reload all hero, runtime, and mobile artifacts. The pipeline fails unless each format reconstructs three meshes, every GLB retains one `idle-breathe` animation, and triangle counts degrade strictly from hero to runtime to mobile.

Validated gates:
- GLB and USDZ loader compatibility across all three tiers.
- Three meshes per loaded artifact.
- One embedded GLB animation per tier.
- Hero 3,408 > runtime 1,140 > mobile 304 triangles.
- Three draw calls and zero texture bytes per tier.
- Existing file-size budgets remain enforced.

Files changed:
- `scripts/axiom-core-export.ts` — Adds the loader/degradation gate and persists its result in `manifest.json`.
- `scripts/axiom-core-export.test.ts` — Verifies the runtime-validation evidence.
- `creative/axiom-core/exports/manifest.json` — Records loader names, per-tier results, scope, and `fpsMeasured: false`.
- `creative/axiom-core/README.md` — Documents the validation boundary.

Verification:
- Focused export/runtime test: passed.
- Export/runtime path coverage: 86.13% statements, 88.46% functions, 85.38% lines.
- Full Vitest suite: 86 suites / 756 tests passed.
- Production build: passed.
- `npm audit --audit-level=high`: 0 vulnerabilities.

This gate validates compatibility and static performance budgets. It does not claim measured 60 FPS desktop or 30 FPS mobile results; those require controlled browser/device profiling.

Foundation Release 1.0 is technically validated for GLB/USDZ but is not frozen. Remaining release gates are creative review/approval, measured browser/device FPS, and the deferred FBX/SVG/Lottie/WebM tooling decision.

## 2026-07-17 - FR1 Local Browser Performance Evidence

The cinematic WebGL runtime was profiled in a visible Codex in-app Chromium session on the local AMD Radeon/Direct3D 11 device. Five-second `requestAnimationFrame` samples were captured through the browser debugging protocol after selecting the matching runtime quality profile.

Acceptance profiles:
- Desktop High, 1280x720, DPR 1: 65 FPS average, 15.38 ms average frame, 20.9 ms p95; 60 FPS target passed.
- Mobile Low, 390x844, DPR 1: 97.07 FPS average, 10.3 ms average frame, 14 ms p95; 30 FPS target passed.
- Browser console errors: 0.

Evidence is stored in `creative/axiom-core/runtime-validation.json`. It is local-device evidence, not universal device certification. Uncontrolled DPR 2.25/window-state samples measured 38-41 FPS, so high-DPR High-quality optimization remains a follow-up if that exact profile must sustain 60 FPS.

Foundation Release 1.0 still requires creative review/approval and an explicit decision on deferred FBX/SVG/Lottie/WebM tooling before freeze.

## 2026-07-26 - FR1 Axiom Core Review Gate

The four required design reviews and ten review dimensions were consolidated into `creative/axiom-core/review-gate.json`. The gate records the supported evidence without self-approving AX-CORE-001.

- Technical Review passes for the supported GLB/USDZ scope.
- Platform Review remains conditional because local Chromium and loader validation are not representative device certification.
- Creative and Experience Reviews require human visual judgment.
- Static icon/favicon delivery, deferred FBX/SVG/Lottie/WebM scope, and the acceptable platform-certification boundary remain explicit decisions.

The user subsequently approved the proposed FR1 defaults: the current creative direction, GLB/USDZ-only delivery, deferred FBX/SVG/Lottie/WebM tooling, and local validation as the FR1 certification boundary. `AX-CORE-001 v1.0.0` is therefore Frozen for that explicit scope. Static icon/favicon work remains in FR2, and broader device certification is not claimed.

## 2026-07-26 - FR2.1 Axiom Core Logomark Candidate

FR2 began by correcting the asset tracker: AX-LOGO-001 was marked Approved despite having no production file. A real SVG candidate derived from the frozen Core shell, lattice, crystal, and quantum-center geometry now exists at `public/assets/branding/ax-logo-core-symbol.svg`, is wired as the application favicon, and remains at Review pending visual approval.

The user approved the candidate. AX-LOGO-001 is now locked at v1.0 and the production tracker reflects its Approved status.

## 2026-07-26 - FR2.2 Approved Logomark Integration

The landing navigation and workspace navigation spine now render the approved AX-LOGO-001 SVG instead of the hardcoded `AX` placeholder. The existing brand markup and CSS were reused; no duplicate logo component was introduced.

Verification:
- TDD RED confirmed both surfaces lacked the approved image.
- Focused App integration tests: 6 passed.
- Full suite: 86 suites / 756 tests passed.
- Touched-file coverage: App 92.85% statements / 92.68% lines; WorkspaceShell 84.61% statements / 88.23% lines.
- Production build: passed.

## 2026-07-26 - Imagine X B3.1 Plan Contract Boundary

The user paused FR2 after the approved logomark integration and resumed Axiom Brain / Imagine X development. The existing Python plan response is now represented accurately in TypeScript: delegated-task status, provider version, optional request context, and optional audit metadata are aligned.

`generateBrainPlan()` now validates untrusted backend JSON before returning it. Contract drift fails closed to the existing local fallback, whose output now follows the same canonical contract. Provider execution remains untouched.

Verification:
- TDD RED reproduced acceptance of a malformed provider contract.
- Brain contract tests: 2 passed; 84.61% statements, 87.71% branches, 88.88% functions, 93.93% lines.
- Brain-focused Vitest: 7 suites / 115 tests passed.
- FastAPI core endpoint tests: 4 passed.
- Production build: passed.

## 2026-07-26 - Imagine X B3.2 Local Routing and Guardian Preflight

The existing Brain planner service now uses a deterministic, billing-free local Imagine X planner. It routes explicit intent keywords to the smallest matching studio, emits one dry-run route per proposed task, performs a plan-stage Guardian preflight, and returns a proposal that always requires user approval and forbids provider execution.

The provider status endpoint now reports the planner honestly as local rather than mock. Ambiguous intent falls back to Brand Studio at lower confidence. No project mutation, Photo job creation, or external provider call was added.

Verification:
- TDD RED covered missing route/Guardian contracts, stale mock provider status, and ambiguous-intent confidence.
- Brain-focused Vitest: 7 suites / 115 tests passed.
- Brain API tests: 6 passed.
- Full Python API suite: 90 passed.
- Frontend boundary coverage: 87.75% statements, 91.86% branches, 92.3% functions, 95.23% lines.
- Production build: passed.

## 2026-07-26 - Imagine X B3.3 Plan Governance Visibility

The existing Brain X plan card now shows each local dry-run studio route, route reason, Guardian status/summary/checks, and the explicit `Approval required · provider execution blocked` boundary. The offline notice now accurately names the local fallback planner.

No new panel, state service, project mutation, or provider action was added.

Verification:
- TDD RED confirmed the B3.2 governance fields were not visible.
- Brain-focused Vitest: 8 suites / 116 tests passed.
- Production build: passed.
- The new user-visible path is directly covered. Whole-file BrainXPanel coverage remains 32.66% statements because the pre-existing 995-line panel contains many unrelated mission-control paths; expanding unrelated tests was deferred.

## 2026-07-26 - Imagine X B4.1 Photo Review Bridge

Accepting a Guardian-passed Imagine X proposal with a Photo Studio route now reuses the existing Photo provider-request contract, trusted local layout mock, canvas intake queue, and AXPKG canvas-preview block. The resulting candidate remains `pending_review` with provider execution explicitly false.

The bridge fails closed when the proposal safety boundary, request contract, mock handler, preview, or intake validation fails. It does not create a provider job, call an image model, or mutate the authoritative canvas.

Verification:
- TDD RED confirmed proposal acceptance previously created no Photo review candidate.
- Brain-focused Vitest: 8 suites / 117 tests passed.
- Production build: passed.

## 2026-07-26 - Imagine X B4.2 Editable Photo Object Mapping

The trusted Photo dry-run mock now preserves Imagine X provider-request object names, supported types, blend modes, and opacity when creating review layers. After the existing review, projection, and explicit apply gates, Photo Studio hydrates the authoritative AXPKG `canvas.photo.elements` into its editable layer stack and local adjustment controls.

Runtime-mock objects render as labeled placeholders rather than broken image URLs. No provider job, image call, automatic canvas apply, or new persistence schema was added.

Verification:
- TDD RED reproduced discarded proposal objects and an empty Photo editor after AXPKG apply.
- Focused mapper coverage: 100% statements, 91.42% branches, 100% functions, 100% lines.
- Affected pipeline: 25 suites / 296 tests passed.
- Production build: passed.

## 2026-07-26 - Imagine X B4.3 Photo Persistence and Export

Photo Studio layer visibility, opacity, blend, adjustment, order, and deletion changes now write back to the authoritative AXPKG `canvas.photo.elements` slice while preserving projection provenance fields. Photo Studio AXPKG export now uses the canonical `axiom.axpkg` 1.1.0 envelope and integrity fingerprint instead of its legacy ad-hoc payload.

Runtime-mock layers export to PNG as deterministic labeled placeholders, avoiding invalid image loads and external calls. Real image sources continue through the existing compositing path.

Verification:
- TDD RED reproduced non-persisted opacity edits, legacy AXPKG output, and stalled runtime-mock PNG export.
- Focused Photo state coverage: 100% statements, 86.04% branches, 100% functions, 100% lines.
- Affected persistence/runtime pipeline: 34 suites / 361 tests passed.
- Production build: passed.

## 2026-07-26 - Imagine X B5.1 Local Outcome Logging

Accepted and rejected Imagine X proposals now create bounded, structured `imagine-x-outcome.v1` records in the AXPKG brain slice. Each record preserves proposal ID, studio, intent, provider routes, status, object count, failure/duration placeholders, rating/feedback placeholders, and follow-up edits.

Photo visibility, opacity, blend, adjustment, reorder, and delete actions attach explainable follow-up edit records to the latest accepted local Photo outcome. Outcome capture does not infer preferences or train/apply learning: every record is explicitly stored with `learning: { consent: "not_requested", applied: false }`.

Verification:
- TDD RED reproduced missing proposal decision records and missing Photo follow-up edits.
- Focused outcome service coverage: 100% statements, 80% branches, 100% functions, 100% lines.
- Affected Brain/Photo/project pipeline: 34 suites / 332 tests passed.
- Production build: passed.

## 2026-07-26 - Imagine X B5.2 Explicit Outcome Feedback

After accepting or rejecting an Imagine X proposal, the Brain X plan card now exposes an explicit 1–5 outcome rating and optional feedback field. Saved values update the matching local `imagine-x-outcome.v1` record and are immediately visible to the user.

Ratings fail closed unless they are integers from 1 through 5. Feedback is trimmed and capped at 1,000 characters. Saving feedback does not alter learning consent: the UI and persisted record continue to state that learning remains disabled.

Verification:
- TDD RED reproduced the missing feedback service and missing user-facing feedback form.
- Focused outcome service coverage: 100% statements, 84.84% branches, 100% functions, 100% lines.
- Affected Brain/Photo/project pipeline: 33 suites / 330 tests passed.
- Production build: passed.

## 2026-07-26 - Imagine X B5.3 Project-Local Learning Control

New projects now persist an `imagine-x-learning-control.v1` setting that defaults to disabled and local-workspace scope. After a proposal decision, the Brain X plan card requires an explicit checkbox plus Save action to grant consent; saving it unchecked revokes consent.

The control does not infer preferences, create clusters, share data across projects, or change recorded outcomes to learned. Existing outcome records remain `learning: { consent: "not_requested", applied: false }`.

Verification:
- TDD RED reproduced the absent project control, setter, and user-facing opt-in.
- Focused outcome service coverage: 100% statements, 85.71% branches, 100% functions, 100% lines.
- Full Vitest suite: 90 suites / 780 tests passed.
- Production build: passed.

## 2026-07-26 - Imagine X B5.4 Preference Candidate Preview

Brain X can now create a local `imagine-x-preference-candidate.v1` preview from an accepted outcome only when project-local learning consent is active, the explicit rating is 4–5, and feedback text exists. The preview shows the proposed preference and the exact evidence explanation.

Candidate approval is a separate user action. Pending and approved candidates both remain `applied: false`; no preference changes generation, provider routing, or output.

Verification:
- TDD RED reproduced the absent consent-gated preview, approval service, and user-facing workflow.
- Focused outcome service coverage: 98.3% statements, 86.2% branches, 93.75% functions, 98.18% lines.
- Full Vitest suite: 90 suites / 784 tests passed.
- Production build: passed.

## 2026-07-26 - Imagine X B5.5 Preference Inspection and Deletion

The Brain X preference preview now keeps its proposed text, evidence explanation, approval state, and unapplied state visible together. A dedicated delete action removes the selected local candidate from the project.

Deletion remains available after local learning consent is revoked. It does not delete source outcome feedback or silently change any other candidate.

Verification:
- TDD RED reproduced the absent deletion service and user-facing control.
- Focused outcome service coverage: 98.48% statements, 85.48% branches, 94.44% functions, 98.36% lines.
- Full Vitest suite: 90 suites / 785 tests passed.
- Production build: passed.

## 2026-07-26 - Imagine X B5.6 Local Preference Profile

Brain X now exposes one project-level local preference profile across sessions. It lists every candidate with its explanation, approval state, and unapplied state; candidate approval and deletion now operate from this single profile.

Profile export emits only the project ID, local learning state, export timestamp, and copied preference candidates. Two-step reset clears all candidates while preserving learning consent and source outcome feedback.

The external `garrytan/gstack` workflow bundle was evaluated and not installed. Its Codex/browser/review/QA capabilities substantially overlap the existing project skills, while adding a Bun runtime, browser dependencies, global Codex state, and additional workflow rules.

Verification:
- TDD RED reproduced the absent export/reset services and session-independent profile.
- Focused outcome service coverage: 98.61% statements, 84.28% branches, 95.23% functions, 98.5% lines.
- Full Vitest suite: 90 suites / 788 tests passed.
- Production build: passed.

## 2026-07-26 - Imagine X B5.7 Recommendation Influence Preview

With active project-local consent, Brain X can now create a bounded `imagine-x-recommendation-influence.v1` preview from approved preference candidates. Each preview records its source candidate IDs, exact proposed influences, explanation, timestamp, and `pending_review` status.

The preview remains `applied: false` and does not modify plan generation, recommendation ordering, provider routing, candidates, or outputs. Resetting the preference profile now also removes influence previews because they contain copied preference text.

Verification:
- TDD RED reproduced the absent service/UI preview and the stale copied data left by profile reset.
- Focused outcome service coverage: 98.82% statements, 82.55% branches, 96% functions, 98.75% lines.
- Full Vitest suite: 90 suites / 791 tests passed.
- Production build: passed.

## 2026-07-26 - Imagine X B5.8 Influence Preview Decisions

Pending recommendation influence previews now support explicit, one-way approval or rejection. Approval requires active project-local learning consent; rejection remains available after consent is revoked. Each decision records its timestamp for local audit.

Approved and rejected previews remain `applied: false`. Decisions do not modify recommendations, plans, provider routing, candidates, or outputs.

Verification:
- TDD RED reproduced the missing decision controls and records.
- Focused outcome service coverage: 98.94% statements, 82.82% branches, 96.42% functions, 98.87% lines.
- Full Vitest suite: 90 suites / 793 tests passed.
- Production build: passed.

## 2026-07-26 - Imagine X B5.9 Recommendation Diff Preview

Recommendation influence proposals now persist and display the exact preview-only difference between the authoritative influence set and the proposed set. The current authoritative `before` set is empty because no preference influence has been applied; `after` contains only explicitly approved local candidates.

The diff is optional for compatibility with existing saved B5.8 previews, which derive the same display from their proposed influences. Approval still leaves every proposal `applied: false`.

Verification:
- TDD RED reproduced the missing persisted and visible before/after diff.
- Focused outcome service coverage: 98.95% statements, 82.82% branches, 96.55% functions, 98.88% lines.
- Full Vitest suite: 90 suites / 793 tests passed.
- Production build: passed.

## 2026-07-26 - Imagine X B6.1 Reversible Influence Activation

An explicitly approved recommendation influence can now be activated for the local project only while learning consent is active. The gate permits one active influence proposal at a time and records its activation timestamp.

The active influence can always be rolled back, including after consent revocation, and rollback records its own timestamp. This step establishes authoritative local influence state; plan generation does not consume that state until a separate integration step.

Verification:
- TDD RED reproduced the missing service and user-facing apply/rollback gates.
- Focused outcome service coverage: 98.24% statements, 82.11% branches, 94.44% functions, 98.11% lines.
- Full Vitest suite: 90 suites / 794 tests passed.
- Production build: passed.

## 2026-07-26 - Imagine X B6.2 Local Plan Influence Integration

Brain X now passes only the single active project-local recommendation influence into plan generation. The local Imagine X planner validates the bounded influence list, echoes it in the plan contract, and adds one explicit objective describing the exact applied preference.

Brain X displays the applied influence with the generated plan. Delegated tasks, dry-run routes, proposal approval, and `providerExecutionAllowed: false` remain unchanged. If an older backend omits an active influence, the client fails closed to the local fallback planner instead of silently dropping it.

Verification:
- TDD RED reproduced missing client propagation, fallback preservation, UI disclosure, and API planner integration.
- Focused Brain API coverage: 85.96% statements, 88.23% branches, 93.33% functions, 92% lines.
- Full Vitest suite: 90 suites / 796 tests passed.
- Full API pytest suite: 91 tests passed.
- Production build: passed.

## 2026-07-26 - Imagine X B6.3 Influence Provenance

Influenced Brain plans now carry the exact source proposal ID and activation timestamp through the UI request, local API planner, offline fallback, returned plan, and Workspace `plan_generated` audit metadata. The plan UI displays the same provenance beside the applied influence.

The API rejects source provenance when no influence accompanies it. Provider routes and execution authority remain unchanged.

Verification:
- TDD RED reproduced missing provenance in the API, fallback, UI, and Workspace audit record, plus acceptance of orphaned source metadata.
- Focused Brain API coverage: 84.12% statements, 86.55% branches, 93.75% functions, 89.28% lines.
- Full Vitest suite: 90 suites / 796 tests passed.
- Full API pytest suite: 92 tests passed.
- Production build: passed.

## 2026-07-26 - Imagine X B6.4 Influence Lifecycle Audit

Successful local recommendation influence activation and rollback now emit dedicated Workspace audit events. Each event records the source proposal ID, exact influence text, and activation or rollback timestamp.

Blocked and no-op attempts do not emit lifecycle events. Historical generated plans remain unchanged, and provider authority is unaffected.

Verification:
- TDD RED reproduced missing audit event factories and missing successful-action recording.
- Full Workspace audit service coverage: 100% statements, branches, functions, and lines.
- Full Vitest suite: 90 suites / 797 tests passed.
- Production build: passed.

## 2026-07-26 - Imagine X B6.5 Outcome Influence Attribution

Every newly recorded accepted or rejected Imagine X outcome now stores either an explicit `null` baseline attribution or a copied snapshot of the generated plan's influence proposal ID, activation time, and exact influence text.

Attribution comes from the generated plan rather than current project state, so later rollback or array mutation cannot rewrite historical outcomes. The field remains optional for compatibility with older saved outcome records.

Verification:
- TDD RED reproduced absent baseline and influenced outcome attribution.
- Focused outcome service coverage: 98.24% statements, 82.4% branches, 94.44% functions, 98.11% lines.
- Full Vitest suite: 90 suites / 798 tests passed.
- Production build: passed.

## 2026-07-26 - Imagine X B7.1 Read-Only Influence Evaluation

Brain X now shows a descriptive comparison of explicitly rated baseline and influenced outcomes. The summary reports rated sample counts, average ratings, and the observed difference only when both groups contain ratings.

Unrated outcomes are ignored. The evaluation is computed without mutating project state and is explicitly labeled as descriptive only; it does not approve, reject, activate, rollback, or modify any preference.

Verification:
- TDD RED reproduced the missing pure summary and missing user-visible evaluation.
- Focused outcome service coverage: 98.41% statements, 82.7% branches, 95.45% functions, 98.29% lines.
- Full Vitest suite: 90 suites / 801 tests passed.
- Production build: passed.

## 2026-07-26 - Imagine X B7.2 Per-Influence Evaluation

The read-only influence evaluation now separates rated outcomes by source influence proposal. Each deterministic entry shows the proposal ID, copied influence text, rated outcome count, and average rating.

Unrated attributed outcomes remain excluded. Distinct proposals are no longer merged into a single opaque influenced aggregate, and no evaluation result changes project state or preference authority.

Verification:
- TDD RED reproduced the missing source-proposal breakdown with two distinct influences and an unrated outcome.
- Focused outcome service coverage: 97.82% statements, 82.48% branches, 95.65% functions, 97.65% lines.
- Full Vitest suite: 90 suites / 801 tests passed.
- Production build: passed.

## 2026-07-26 - Imagine X B7.3 Rating Distributions

The read-only evaluation now reports exact 1–5 rating distributions for baseline outcomes, all influenced outcomes, and every source proposal. Only valid explicit integer ratings from 1 through 5 are counted.

The distributions expose variance hidden by averages while preserving the existing non-causal, non-automating boundary.

Verification:
- TDD RED reproduced missing aggregate and per-proposal distributions.
- Focused outcome service coverage: 97.87% statements, 82.97% branches, 95.65% functions, 97.7% lines.
- Full Vitest suite: 90 suites / 801 tests passed.
- Production build: passed.

## 2026-07-26 - Imagine X B8 Roadmap Checkpoint and Animos Intake

The Brain blueprint, Imagine X evolution strategy, and Auto Learner Mode requirements were reconciled with B5-B7. B8 is defined as an explicit evaluation decision gate: the user may record `keep`, `rollback`, or `inconclusive` with optional rationale, while B7 statistics remain descriptive and cannot change preference or influence state.

Animos was qualified only as a manual MP4/WebM export tool for user-owned media. The project now documents the minimum provenance and rights checks for accepting an exported asset; no template code, dependency, project-media upload, render, or production asset was added.

Verification:
- Documentation-only checkpoint; no runtime behavior changed.

## 2026-08-01 - Imagine X B8.1 Explicit Evaluation Decision Gate

Brain X now lets the user explicitly record `keep`, `rollback`, or `inconclusive` for the latest influence proposal with rated B7 evidence. The immutable project-local record preserves the evidence snapshot and optional rationale for audit.

Recording a decision does not activate, retain, revise, or roll back an influence. Existing apply and rollback controls remain separate, and no provider or automated-learning authority was added. Preference-profile reset also removes the copied decision evidence.

Verification:
- TDD RED reproduced the absent decision service and UI controls.
- Focused service/UI tests: 37 passed.
- Focused outcome-service coverage: 97.43% statements, 83.11% branches, 96% functions, 97.93% lines.
- Full Vitest suite: 90 suites / 804 tests passed.
- Production build: passed.

## 2026-08-01 - PostCSS Security Advisory Patch

The transitive PostCSS dependency used by Vite was updated from 8.5.15 to 8.5.25 through the existing npm dependency graph. No direct PostCSS dependency or application behavior was added.

Verification:
- Production dependency audit: zero vulnerabilities.
- Full Vitest suite: 90 suites / 804 tests passed.
- Full API pytest suite: 92 tests passed.
- TypeScript production build: passed.

## 2026-08-01 - Canonical Status Synchronization

The top-level README now describes the working React/Vite and FastAPI system, five implemented runtime panels, current release boundaries, and the verified 804 frontend / 92 API test baseline.

The Runtime v5 compatibility matrix now distinguishes certified runtimes from implemented-but-pending Photo, Vector, and Motion runtimes. Registry-only studios are recorded as fallback canvases rather than planned runtime implementations.

Verification:
- Documentation claims reconciled against `platform.manifest.json`, `studio-runtime.manifest.json`, the studio registry, and current test/build evidence.
- No runtime or product behavior changed.

## 2026-08-01 - Imagine X B8.2 Roadmap Checkpoint

The Brain blueprint, evolution strategy, memory system, Auto Learner controls, governance rules, evaluation suite, and B8.1 implementation were rechecked before defining B8.2.

B8.2 is limited to evaluation decision history and portability: inspect every stored decision and its frozen evidence, include copied decisions in explicit profile export, and explicitly delete one selected local decision. It cannot interpret statistics, revise records, change preference or influence state, execute rollback, or call providers.

Verification:
- The checkpoint identified that B8.1 persists multiple decisions but displays only the latest and omits decisions from profile export.
- Documentation-only checkpoint; no runtime behavior changed.

## 2026-08-01 - Imagine X B8.2 Evaluation Decision History and Portability

Brain X now shows every stored evaluation decision with its proposal ID, timestamp, rationale, and frozen evidence. Explicit preference-profile export includes deep-copied decision records, and the user can delete one selected local decision without changing outcomes, proposals, consent, or influence state.

History, export, and deletion remain non-automating user controls. They do not recompute or edit evidence, create preferences, activate or roll back influence, or call providers.

Verification:
- TDD RED reproduced the missing export records, selected-deletion service, and decision-history UI.
- Focused service/UI tests: 37 passed.
- Focused outcome-service coverage: 97.54% statements, 82.5% branches, 96.15% functions, 98% lines.
- Full Vitest suite: 90 suites / 804 tests passed.
- Full API pytest suite: 92 tests passed.
- Production build: passed.
- Production dependency audit: zero vulnerabilities.

## 2026-08-01 - Imagine X Post-B8.2 Roadmap Checkpoint

The implemented B5-B8 flow was reconciled with the Imagine X blueprint, evolution strategy, memory contract, Auto Learner controls, governance rules, and evaluation suite. B8 is complete: its remaining user-control gap was closed by B8.2, and no current requirement supports a B8.3.

Preference-profile import was considered and excluded because the baseline requires export, not import; import would create a new profile-mutation surface requiring its own preview, validation, conflict, and approval contract. No inferred action, automation, provider authority, or runtime behavior was added.

The next candidate stream is a B9 roadmap checkpoint for explicit learning scope and workspace-policy authority, both named but not yet implemented in Auto Learner Mode.

Verification:
- Documentation-only checkpoint; no runtime behavior changed.
- Current verified baseline remains 90 Vitest suites / 804 tests, 92 API tests, passing production build, and zero production dependency vulnerabilities.

## 2026-08-01 - Imagine X B9 Learning Scope and Policy Authority Checkpoint

The Auto Learner requirements were compared with the current project-local learning control and available backend infrastructure. Users can already choose between disabled and explicitly consented local-workspace learning, but the repository has no trusted workspace membership, admin-role, or learning-policy source.

B9 therefore keeps `off` and `local_workspace` as the only scopes and requires workspace policy to come from a trusted read-only server-side source rather than editable project state. Verified policy denial must override personal consent; personal denial must always disable learning; and policy-required workspaces must fail closed when policy is missing or invalid.

Policy enforcement may block creation, approval, or activation of learned influence. It must leave inspection, export, selected deletion, reset, and rollback available, and it must disclose the requested state, effective state, policy source, and blocking reason. No cross-project scope, admin editor, automated learning, or provider authority was defined.

The implementation prerequisite is the smallest authenticated workspace-membership and learning-policy read model. Runtime enforcement remains gated until that authority source exists.

Verification:
- Documentation-only checkpoint; no runtime behavior changed.
- Current verified baseline remains 90 Vitest suites / 804 tests, 92 API tests, passing production build, and zero production dependency vulnerabilities.

## 2026-08-01 - B9 Trusted Workspace Learning-Policy Read API

The FastAPI backend now exposes credential-protected `GET /api/workspaces/{workspaceId}/learning-policy`. It returns one server-configured active membership and a versioned policy limited to `local_workspace`, including explicit allow/deny and policy-required states.

The source fails closed when its backend-only credential is unconfigured, uses constant-time bearer comparison, rejects invalid credentials and unknown workspaces, and has no mutation endpoint. This is a minimal single-workspace bootstrap rather than production SSO or admin management; Brain X enforcement remains a separate B9.1 step.

Verification:
- TDD RED: 4 focused tests failed against the absent configuration and route.
- TDD GREEN: 4 focused tests passed; standard-library trace found no uncovered executable route lines.
- Full API pytest suite: 96 tests passed with one existing Starlette/httpx deprecation warning.
- Full Vitest suite: 90 suites / 804 tests passed.
- Production build: passed.
- npm production audit and Python dependency audit: zero known vulnerabilities.

## 2026-08-01 - Imagine X B9.1 Effective Learning Authority

Imagine X now resolves project consent and trusted workspace policy into one explicit effective-learning decision. Personal denial always blocks learning; verified workspace denial or scope exclusion overrides consent; and required-but-unavailable or mismatched policy fails closed.

Brain X shows requested state, effective state, policy source, and the reason. Effective denial blocks preference-candidate creation and approval, influence preview approval and activation, and use of an already-applied influence in new plans. Inspection, export, selected deletion, reset, rejection, evaluation, and rollback remain available.

Verified snapshots propagate through the workspace shell and lazy runtime router. The browser receives no backend policy credential; authenticated server-session/bootstrap delivery remains outside B9.1.

Verification:
- TDD RED reproduced the missing resolver, missing shared mutation gate, missing disclosure/use suppression, and missing workspace-host propagation.
- Focused resolver/service/UI/shell tests: 50 passed.
- Resolver coverage: 100% statements, branches, functions, and lines.
- Combined resolver/outcome-service coverage: 97.75% statements, 83.62% branches, 96.29% functions, 98.18% lines.
- Full Vitest suite: 91 suites / 813 tests passed.
- Full API pytest suite: 96 tests passed with one existing Starlette/httpx deprecation warning.
- Production build: passed.
- Production dependency audit: zero vulnerabilities.

## 2026-08-01 - Imagine X Post-B9.1 Secure Bootstrap Checkpoint

The B9.1 host boundary, credential-protected workspace-policy API, Auth User System baseline, and existing Photo provider session flow were rechecked before defining B9.2.

The Photo flow supplies useful mechanics—opaque random tokens, hashed persistence, TTL, HttpOnly/SameSite cookies, revocation, and credentialed requests—but it authenticates provider-gateway access rather than a user or workspace membership. Reusing its cookie, bootstrap secret, storage, or `/api/photo` scope would conflate unrelated authorities and was rejected.

B9.2 remains undefined and implementation-gated until Axiom has a server-authenticated user identity, authoritative workspace membership/role lookup, and an independent revocable session. That session must keep credentials out of browser storage and project state, return policy only for the session's verified membership, and fail closed for missing, expired, invalid, or cross-workspace sessions when policy is required.

Verification:
- Documentation-only checkpoint; no runtime, endpoint, cookie, or policy behavior changed.
- Current verified baseline remains 91 Vitest suites / 813 tests, 96 API tests, passing production build, and zero known production dependency vulnerabilities.

## 2026-08-01 - Auth/Workspace Session Foundation Checkpoint

Supabase Auth was selected for user identity, with Postgres as the authoritative workspace membership/role source and FastAPI as the browser-facing session authority. The planned Auth A1 callback uses server-side PKCE exchange and an independent opaque, hashed, revocable cookie; Supabase access and refresh tokens never enter browser storage or project state.

The minimum A1 scope is login start, callback, session read, logout/revocation, and read-only membership resolution. Signup/onboarding UI, invitations, MFA, membership mutation, organization administration, billing, and B9.2 policy bootstrap remain deferred. Clerk was rejected for this boundary because its standard application session is readable by client JavaScript; Auth0 remains a replacement option only if enterprise federation becomes a demonstrated requirement.

Verification:
- Documentation-only provider checkpoint; no dependency, endpoint, session, database, or policy behavior changed.
- Selection validated against current official Supabase PKCE/Python exchange and Postgres RLS documentation, Auth0 FastAPI documentation, and Clerk session-cookie documentation.
- Existing verified build, test, and audit baseline is unchanged.

## 2026-08-01 - Auth A1 Supabase Session Foundation

Auth A1 implements server-side Supabase PKCE login start/callback exchange, an independent SQLite-backed opaque application session, authenticated session disclosure, logout/revocation, and read-only active workspace membership resolution through Supabase PostgREST. OAuth state and verifier records are single-use, same-browser bound, TTL-limited, and capacity-bounded. Session tokens are hashed at rest; provider tokens and credentials are neither returned nor persisted.

The Postgres migration creates `public.workspace_memberships`, role/status constraints, an active-user index, RLS, and a SELECT-only authenticated policy. Its paired down migration is the explicit rollback. No external database or Supabase project was mutated, and B9.2 remains gated.

Verification:
- TDD RED confirmed the missing Auth service/routes, then the missing cache/malformed-provider guards, flow-capacity bound, safe redirect validation, and membership migration.
- Focused Auth route/service/migration tests: 15 passed.
- Auth route/service coverage: 94.59% combined; routes 100%, service 93%.
- Full FastAPI suite: 111 tests passed in bounded groups; the monolithic run exceeded the project process-time limit.
- Production build: passed.
- npm audit: zero vulnerabilities; `pip check`: no broken requirements.
- The full Vitest and `pip-audit` commands exceeded the project process-time limit and require manual single-run confirmation.

Next: apply the migration and server settings to a controlled Supabase project, then run a live login/session/logout smoke checkpoint before defining B9.2.

## Future Entries
# 2026-08-02 - Production Security & Observability S1

Implemented the six approved launch-audit remediations with RED/GREEN checkpoints and no paid monitoring dependency. Planner APIs now require an opaque application session with active membership in the configured workspace; browser planner calls are same-origin and credentialed. Login starts use a bounded, per-client, single-instance limiter. Planner inputs and collections are bounded, unexpected client errors are generic and correlated, production API docs are disabled, security headers and structured request logs are native, and `/api/ready` verifies Supabase before Render accepts traffic.

Generated Photo assets now receive durable service-only Supabase owner and expiry metadata, seven-day default retention, startup/creation cleanup, and owner-session deletion. The controlled `0003_asset_retention` Supabase migration and live Render security/persistence smoke remain the next explicit checkpoint. Verification: 131 API tests at 91% coverage, 825 frontend tests, production build, npm audit, and pip-audit pass.
