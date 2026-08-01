# Verified Baseline - Axiom Platform Runtime

This document serves as the official platform checkpoint for verified modules, services, and core integrations.

---

## 1. Verified Modules & Status

| Module / Service | Type | Status | Features Verified |
| :--- | :--- | :--- | :--- |
| **Brain X runtime** | Studio Runtime | Active / Verified | Pre-generation planning, objectives generation, provider routing, intent analysis, mock backend. |
| **Photo Studio MVP** | Studio Runtime | Active / Verified | Layer manipulation, adjustments, 2D Canvas compositing, PNG export, authority checks. |
| **Vector Studio MVP** | Studio Runtime | Active / Verified | Shape adding/nudging, SVG serialization export, property validation checks, authority checks. |
| **Workspace Audit Service** | Platform Service | Active / Verified | Process-local event bus publishing (`workspace:audit:recorded`), immutable snapshots, 1000-event cap. |
| **Workspace Replay Panel** | Sidebar Component | Active / Verified | Filter tabs (All, Creative, Authority, Export, Lifecycle, Errors, Runtime), badge counters, unmount cleanup. |
| **Authority checks** | Security Gating | Active / Verified | Gated handlers in Photo/Vector/Brain X. Dual checks for declared vs granted scopes. |
| **AXPKG audit persistence** | Data Layer | Active / Verified | Schema version `0.2.0`, draft creation seeds, audit trail preservation in project drafts. |
| **FastAPI mock planner backend** | Backend API | Active / Verified | Mock endpoints for Brain X plan routing, Photo blueprints, Vector blueprints. UTC warning fixed. |
| **Runtime Manifest Loader** | Phase 04 | Active / Verified | Local-only `/runtime-manifests/index.json` loading, path traversal guard, JSON schema validation. |
| **Runtime Signature Verifier** | Phase 04 | Active / Verified | Fingerprint generation, development-context trust controls, manifest integrity checks. |
| **Runtime Registry** | Phase 04 | Active / Verified | Four-state lifecycle (`registered / disabled / rejected / untrusted`), reload idempotency via fingerprints. |
| **Runtime Authority Gate** | Phase 04 | Active / Verified | `evaluateExternalRuntimeAuthority`, `runtime_authority_blocked` audit events on denial. |
| **Runtime Activation Service** | Phase 05 | Active / Verified | Controlled activation via `LOCAL_RUNTIME_EXECUTORS`, capability preflight, activation audit trail. |
| **Runtime Action Dispatcher** | Phase 05 | Active / Verified | Dual capability gate, 8-second execution timeout, `JsonSafe` typed payloads, per-action audit events. |
| **Mock Runtime Executor** | Phase 05 | Active / Verified | `renderMotionFrame`, `applyMotionEffect`, `writeProjectTimeline` — all gated by capability declarations. |
| **Runtime Registry Panel** | Phase 05 | Active / Verified | Developer console: manifest table, sandbox action executor, activation log, reload controls. |

---

## 2. Verified Test Metrics — Phase 05 Final Baseline

> [!IMPORTANT]
> The following numbers are the authoritative verified metrics as of **2026-07-04 Phase 05 stabilization**. Supersedes all earlier records.

| Suite | Files | Tests | Status |
| :--- | ---: | ---: | :--- |
| Full Frontend Vitest (`npm test -- --run`) | **36** | **330** | ✅ All passed |
| Runtime targeted (`npx vitest run src/runtime/`) | **7** | **46** | ✅ All passed |
| Backend Python (`python -m pytest apps/api/tests`) | — | **10** | ✅ All passed |
| Production build (`npm run build`) | — | — | ✅ `tsc -b && vite build` clean |

---

## 3. Phase 05 JSX / TypeScript Stabilization Notes

The following fixes were applied during Phase 05 stabilization and are now part of the verified baseline:

| Fix | File | Description |
| :--- | :--- | :--- |
| JSX arrow parsing | `RuntimeRegistryPanel.tsx` | Raw `->` replaced with `{"→"}` string expression to avoid JSX `>` token ambiguity. |
| Context typing | `RuntimeActionDispatcher.test.ts` | `RuntimeActivationContext` explicit type on `defaultContext`/`restrictedContext` prevents `string[]` widening. |
| Registry status standardization | `RuntimeRegistry.ts` | `RuntimeRegistrationStatus` kept local to `RuntimeRegistry.ts`; removed invalid external import. |
| Missing icon import | `WorkspaceShell.tsx` | `Shield` restored to lucide-react import list. |
| Action map typing | `RuntimeRegistryPanel.tsx` | `LOCAL_RUNTIME_ACTIONS` import added; mapped callback typed as `RuntimeActionDefinition`. |
| JSDOM fetch timeout | `src/test/setup.ts` | Global `fetch` stub rejects immediately, preventing 8-second `AbortController` waits from blocking test assertions. |

---

## 4. Security Boundary — Preserved Through Phase 05

```text
✅  No dynamic import of external modules.
✅  No remote module loading.
✅  No script injection.
✅  No execution of manifest.entry.moduleUrl.
✅  All executable behavior lives exclusively in LOCAL_RUNTIME_EXECUTORS.
✅  All actions pass dual capability checks (manifest-declared + session-granted).
✅  All runtime events write to WorkspaceAuditService.
```

---

## 5. Command Baselines

For system validation:

* **Frontend Tests**: `npm test -- --run`
* **Runtime Tests**: `npx vitest run src/runtime/`
* **Backend Tests**: `python -m pytest apps/api/tests`
* **Vite Production Build**: `npm run build`
* **TypeScript Check**: `npx tsc --noEmit`
