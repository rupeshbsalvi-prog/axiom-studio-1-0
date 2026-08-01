---
Document ID: BX-ADR-002
Version: 1.0
Release: AF-1.0
Status: Frozen
Owner: Explainability
Depends On: None
Validated By: EVR1
Last Structural Change: 2026-06-21
---

# ADR-002: Explanation Boundary and UI Invariant

## Status
✅ Accepted (Frozen) — 2026-06-21

## Context
Exposing the raw, complex execution states of the cognitive engines directly to the UI components causes severe coupling. The presentation components begin to implement parsing, sequencing, and filtering logic, making the UI a shadow-engine of cognitive processing. This prevents clean structural upgrades to the cognitive engine and leads to "vibe-based" UX adjustments that introduce inconsistencies across views.

## Alternatives considered
1. **Direct UI Querying**: Allow UI components to import and directly traverse the raw `Mission` state.
   - *Reason for rejection*: Highly fragile. If the graph node structure or delegation schema changes, all UI components break. Separating rendering bugs from cognitive logic bugs becomes impossible.

## Decision
We introduce a versioned boundary contract: `ExplanationContractV1`. We enforce the **UI Invariant**: *Every visible element in the dashboard is derived dynamically and exclusively from exactly one `ExplanationContractV1` payload*. 

The [BrainXPanel.tsx](file:///c:/Users/Rupesh%20Salvi/Downloads/Google%20Antigravity/Project%20Axiom%20Studio/Axiom%20Studio%201.0/src/app/studios/brain-x/BrainXPanel.tsx) is prohibited from parsing raw `Mission` properties. It must render only fields exposed in [ExplanationContract.ts](file:///c:/Users/Rupesh%20Salvi/Downloads/Google%20Antigravity/Project%20Axiom%20Studio/Axiom%20Studio%201.0/src/app/studios/brain-x/mission/ExplanationContract.ts) via [ExplanationEngine.ts](file:///c:/Users/Rupesh%20Salvi/Downloads/Google%20Antigravity/Project%20Axiom%20Studio/Axiom%20Studio%201.0/src/app/studios/brain-x/mission/ExplanationEngine.ts).

## Consequences
- UI remains completely decoupled from raw cognitive schemas and logic.
- We can run automated EVR1 tests directly against `deriveExplanation` to verify correctness of mapped concepts without rendering any React components.
- Presentation layout and interaction code remains declarative.

## Future reconsideration trigger
Reconsideration occurs if UXR exposes systemic user comprehension failures that require new visual paradigms not expressible within the `ExplanationContractV1` structure.
