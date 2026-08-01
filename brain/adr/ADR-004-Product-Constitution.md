---
Document ID: BX-ADR-004
Version: 1.0
Release: AF-1.0
Status: Frozen
Owner: Product
Depends On: None
Validated By: PVR
Last Structural Change: 2026-06-21
---

# ADR-004: Product Constitution and Layer Ownership

## Status
✅ Accepted (Frozen) — 2026-06-21

## Context
As Brain X transitions from architectural verification to product experience engineering, there is a risk that product features introduce visual noise, inconsistent user control options, or convoluted navigation. We need explicit governing laws for product behavior to protect the user's cognitive flow, along with clear layer ownership to prevent cross-layer coupling and architectural erosion over time.

## Alternatives considered
1. **Feature-Led Design**: Allow visual layouts and interaction models to evolve freely based on incoming product requests.
   - *Reason for rejection*: Leads to visual noise, cognitive overhead, and violations of predictability. The system quickly ceases to behave like a calm product and reverts to a chaotic engineering display.

## Decision
We enforce **Product Constitution v1.0** containing six immutable laws of UX behavior:
- **Law 1 — Intent First**: Brain X derives structure from user intent; users never model tasks manually.
- **Law 2 — Explain Before Asking**: Every interruption details why a choice matters and Brain X's recommended action.
- **Law 3 — Human Override**: Humans always own the mission; Brain X never silently alters goals.
- **Law 4 — Progressive Disclosure**: Show outcomes by default; show reasoning graphs and details only on request.
- **Law 5 — Cognitive Calm**: Actively reduce uncertainty, never increase it.
- **Law 6 — Stable Mental Model**: One state maps to exactly one representation everywhere.

We establish and freeze **Artifact Layer Ownership**:

| Artifact | Sole Owner |
| --- | --- |
| MissionTypes | Cognition |
| ExplanationContractV1 | Explainability |
| TelemetrySnapshotV1 | Telemetry |
| BrainXPanel | Experience |
| Product Constitution | Product |

We add the following **Governance Rule**:
> Every public artifact has exactly one owner. Changes to a frozen artifact require approval from its owning layer and evidence from the next validation stage (EVR, UXR, TVR, or PVR).

## Consequences
- Clean boundaries regulate product growth.
- UX consistency is protected by immutable laws.
- Layer ownership and the governance rule prevent regression and cross-layer coupling.

## Future reconsideration trigger
Reconsideration occurs if PVR evidence exposes behavioral contradictions or systemic user friction that cannot be resolved under the six laws.
