# Platform Compatibility Matrix

**Maintained by:** Platform team
**Last updated:** 2026-08-01

This matrix tracks which Studios have been certified against which Runtime versions.
It is the authoritative source for release management and regression tracking.

---

## How to Read This Matrix

| Symbol | Meaning |
|--------|---------|
| ✅ Certified | Studio has passed all validation gates against this Runtime version |
| 🔄 Pending | Studio exists but validation is in progress |
| ⚠️ Degraded | Studio operates but with known behavioral differences |
| ❌ Incompatible | Studio cannot run on this Runtime version |
| — | Not applicable (Studio did not exist at this Runtime version) |

---

## Compatibility Table

| Studio | v5.0 | Notes |
|--------|------|-------|
| AX-CORE | ✅ Certified | `AX-CORE-001 v1.0.0` frozen for the approved GLB/USDZ scope; broader device certification is not claimed. |
| Axiom AI | ✅ Certified | FR1.1 lifecycle and namespace validation; first-party runtime panel remains registered. |
| Brain X | ✅ Certified | FR1.2 orchestration validation; Imagine X through B9.1 preserves explicit user and workspace-policy authority. |
| Photo Studio | 🔄 Pending | First-party runtime and Phase 20–30 local pipeline are implemented. Final certification waits on a resumed live-provider gate and broader release validation. |
| Vector Studio | 🔄 Pending | First-party runtime, editable SVG workspace, export, and governed dry-run preview are implemented; provider use remains disabled. |
| Motion Studio | 🔄 Pending | Phase 18 first-party timeline MVP and dry-run preview are implemented; production rendering/export certification remains open. |
| Mission Control | — | Workspace-owned product surface rather than a separate StudioRuntime adapter. |
| Brand Studio | — | Registered fallback canvas only; no runtime adapter. |
| Asset Hub | — | Registered fallback canvas only; no runtime adapter. |
| UI/UX Studio | — | Registered fallback canvas only; no runtime adapter. |
| Typography Studio | — | Registered fallback canvas only; no runtime adapter. |
| Presentation Studio | — | Registered fallback canvas only; no runtime adapter. |
| Video Studio | — | Registered fallback canvas only; no runtime adapter. |
| Whiteboard Studio | — | Registered fallback canvas only; no runtime adapter. |

## Current Implementation Snapshot

- The canonical manifest remains Platform Runtime `PR-5.0`; no v6.0 proposal is recorded here.
- Five first-party StudioRuntime adapters are registered: Axiom AI, Brain X, Photo, Vector, and Motion.
- Thirteen modes are present in the studio registry, including Mission Control.
- Current verification: 813 Vitest tests and 96 FastAPI tests pass; the production build and dependency audits pass.
- `implemented` in the runtime manifest means a runnable adapter exists. It does not replace the stricter `✅ Certified` gate in this matrix.

---

## Validation Gate Requirements

A Studio must pass all of the following gates to achieve **Certified** status against a Runtime version:

| Gate | Requirement |
|------|------------|
| Unit tests | All Studio-specific tests pass |
| Platform integrity | Zero modifications to `src/platform/` |
| Studio independence | All code contained in `src/app/studios/<id>/` |
| Three.js gate | Zero Three.js imports (for non-rendering Studios) |
| Lifecycle contract | initialize / activate / deactivate / dispose implemented |
| Provider contract | DiagnosticsProvider id / initialize / collect / dispose implemented |
| Namespace isolation | State writes use Studio-specific key prefix only |
| Dispose residue | Zero platform references remaining after dispose() |

---

## Runtime Release History

| Runtime Version | Release Date | Status | Change Type |
|----------------|--------------|--------|-------------|
| v5.0 | 2026-06-21 | Feature-frozen | Initial certified release |

---

## v5.x Patch Log

_No patches recorded._

---

## v6.0 Proposals

_No proposals filed._

A v6.0 proposal is required for any change meeting the trigger criteria defined in
`PLATFORM_RUNTIME_V5_SPEC.md` under **v6.0 Triggers — Explicit**.

---

## Update Protocol

When a new Studio completes validation:

1. Add a row to the Compatibility Table with status ✅ Certified.
2. Record the Foundation Release or Product Release that certified it.
3. Add the certification date to the Notes column.

When a new Runtime patch (v5.x) is released:

1. Add a row to the Runtime Release History table.
2. Re-run validation gates for all Certified Studios.
3. Update the matrix with any status changes.

When a v6.0 proposal is filed:

1. Add a row to the v6.0 Proposals section.
2. Describe the trigger and the rationale.
3. The proposal requires architectural review before implementation begins.
