---
Document ID: BX-ADR-005
Version: 1.0
Release: AF-1.0
Status: Frozen
Owner: Platform / Cognition / Explainability / Telemetry / Experience / Product
Depends On: None
Validated By: FR, MVR, EVR, TVR, UXR, PVR
Last Structural Change: 2026-06-21
---

# ADR-005: Single Extension Point Policy

## Status
✅ Accepted (Frozen) — 2026-06-21

## Context
Architectural sprawl is a primary source of codebase decay. If developers can extend a system by adding new services, custom event types, new base classes, or side-channel communication protocols, the architecture rapidly degrades. Enforcing a strict "single extension point" policy per layer ensures that all new capabilities are structured around uniform interfaces.

## Alternatives considered
1. **Multi-Point Extension**: Allow new Studios to introduce custom state management hooks, database tables, or custom helper APIs.
   - *Reason for rejection*: Destroys the repeatable verification model. We would have to write custom test suites for every studio rather than reusing the unified MVR and EVR frameworks.

## Decision
We enforce a **Single Extension Point** per layer:
- **Platform**: extended exclusively via `StudioModule`
- **Cognition**: extended exclusively via `Mission` instances
- **Explainability**: extended exclusively via the versioned contract (`ExplanationContractV1`)
- **Telemetry**: extended exclusively via the versioned snapshot (`TelemetrySnapshotV1`)
- **Experience**: extended exclusively via custom layout components inside `BrainXPanel`
- **Product**: extended exclusively via new User Workflows

All new capabilities must map to these standard interfaces. Adding new files to the cognitive core is strictly prohibited.

## Consequences
- Clean, minimal conceptual footprint.
- All new Studios or product workflows are structured identically, promoting high reuse.
- Simplifies onboarding and makes the codebase highly maintainable.

## Future reconsideration trigger
Reconsideration occurs if a new, fundamentally different Studio or product line cannot map to the established single extension points after exhaustive design verification.
