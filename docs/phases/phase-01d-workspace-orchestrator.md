# Phase 01D - Workspace Orchestrator Foundation

[Back to docs index](../README.md)

## Goal

Separate workspace orchestration from the root app component so Axiom Studio 1.0 can scale from a few real studios to the full studio registry without turning `App.tsx` into a fragile switchboard.

## Scope

Phase 01D introduces a product-level workspace orchestration layer. It does not modify Platform Runtime v5 contracts.

## Implemented Foundation

- `src/workspace/WorkspaceShell.tsx` owns workspace layout, studio navigation, draft creation, inspector metadata, and workspace metrics.
- `src/workspace/useStudioLifecycle.ts` owns initialize, activate, deactivate, and dispose behavior for concrete studio modules.
- `src/workspace/StudioPanelRouter.tsx` owns concrete studio panel routing and generic foundation fallback rendering.
- `src/workspace/StudioRuntimeRegistry.tsx` centralizes concrete studio runtime modules and panel components.
- `src/workspace/StudioRuntimeRegistry.tsx` now lazy-loads concrete studio runtime modules and panel components.
- `src/workspace/useStudioLifecycle.ts` now returns a studio runtime manifest with fallback, loading, loaded, registered-entry, and loaded-module state.
- `src/workspace/WorkspaceShell.tsx` now exposes the runtime manifest inside the Inspector Rail for implementation visibility.
- `src/workspace/studio-runtime.manifest.json` now declares implemented runtime capabilities outside the execution adapter.
- `src/workspace/studio-runtime.manifest.json` now declares runtime authority permissions for read/write/export/provider/approval governance.
- `src/workspace/StudioRuntimeManifest.ts` validates manifest records against known studio ids, runtime source, status, phase, capabilities, authority, and notes.
- `src/workspace/StudioRuntimeRegistry.tsx` now binds validated manifest records to first-party lazy runtime adapters.
- `src/workspace/useStudioLifecycle.ts` now exposes the active manifest record alongside lifecycle state.
- Inspector Rail now shows runtime source, runtime phase, manifest capabilities, and authority permissions for the active studio.
- `src/workspace/RuntimeAuthorityGate.ts` evaluates read project, write canvas, export, and provider-use actions against runtime authority metadata.
- Inspector Rail now shows authority gate decisions for the active studio.
- `src/app/studios/photo/PhotoRuntimeAuthority.ts` maps Photo Studio generation to provider-use plus canvas-write authority and maps Photo exports to export authority.
- `src/app/studios/photo/PhotoPanel.tsx` now checks runtime authority before generation, PNG export, and AXPKG export.
- `src/app/studios/vector/VectorRuntimeAuthority.ts` maps Vector Studio generation to provider-use plus canvas-write authority and maps Vector exports to export authority.
- `src/app/studios/vector/VectorPanel.tsx` now checks runtime authority before generation, SVG export, and AXPKG export.
- Photo and Vector runtime authority helpers now create `authority_blocked` audit events for denied actions.
- `src/app/components/ReplayAuditPanel.tsx` now renders `authority_blocked` events as rejected audit entries.
- `src/workspace/WorkspaceAuditService.ts` now records shared workspace audit events and publishes `workspace:audit:recorded` for future replay subscribers.
- Photo and Vector blocked authority events are now promoted into the shared workspace audit layer while preserving local studio audit history.
- `src/App.tsx` now owns landing experience and top-level view switching only.
- App tests now cover Photo Studio and Vector Studio routing through the workspace panel router.
- Registry tests now verify implemented runtime entries expose lifecycle contracts and panel components.

## Boundary

No Platform Runtime v5 services, registry contracts, EventBus semantics, or StateService contracts are changed.

## Acceptance Criteria

- Workspace Hub still opens from the landing page.
- Studio navigation still shows all 13 registered studios.
- UI/UX Studio still renders the generic foundation fallback.
- Photo Studio renders its concrete panel through the router.
- Vector Studio renders its concrete panel through the router.
- Lifecycle and panel routing both consume a single runtime registry.
- Concrete studio panels/modules load on demand when opened instead of increasing the initial workspace chunk.
- Inspector Rail shows whether the active studio uses a registered lazy runtime or the foundation fallback.
- Inspector Rail shows loaded runtime modules so future plugin and studio diagnostics have a visible home.
- Runtime registry entries are now derived from a manifest source before receiving lazy module/panel adapters.
- Runtime manifest tests catch unknown studio ids, missing capabilities, and missing manifest records before plugin work begins.
- Runtime manifest metadata is visible in the Inspector Rail for implemented runtimes and shows fallback metadata for foundation-only studios.
- Runtime authority metadata defines whether a studio can read project state, write canvas state, export, use providers, and whether approval is required.
- Runtime authority gate decisions are test-covered and visible in the Inspector Rail for runtime diagnostics.
- Photo Studio generation and export handlers now call runtime authority checks before guarded actions execute.
- Vector Studio generation and export handlers now call runtime authority checks before guarded actions execute.
- Blocked Photo and Vector authority decisions are recorded in the studio audit trail.
- Blocked Photo and Vector authority decisions are also recorded through the shared Workspace Audit Service.
- Mission Control draft creation still works.
- Existing WEOS landing behavior remains intact.

## Verification

- `npm test -- src/App.test.tsx`
- `npm test`
- `npm run build`
- `python -m pytest apps/api/tests`

## Known Risks

- Workspace Audit Service is process-local and event-published, but not yet persisted into AXPKG or a durable replay store.
- Photo and Vector studios are guarded and audit blocked actions; Brain X, Axiom AI, and future studios still need handler-level authority checks.
- Future plugin-style studios still need a signed/validated external manifest loading path beyond the current in-repo JSON source.
- API tests pass with one Python deprecation warning for `datetime.utcnow()` in the mock planner.

## Locked Baseline

Changes require an ADR.
