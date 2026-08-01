---
Document ID: BX-ADR-003
Version: 1.0
Release: AF-1.0
Status: Frozen
Owner: Telemetry
Depends On: ADR-002
Validated By: TVR (EVR1 Telemetry)
Last Structural Change: 2026-06-21
---

# ADR-003: Telemetry Boundary and Purity Rule

## Status
✅ Accepted (Frozen) — 2026-06-21

## Context
Brain X tracks user-centric and system-centric health metrics (CTS, CLS, MCS, EES) to evaluate explainability efficacy and cognitive load. Calculating these metrics inside the UI component mixes business metric definition with React render cycles, making the metrics untestable and preventing serialization or historical analytics. Furthermore, allowing the Telemetry Engine to run async queries or write state introduces side effects that corrupt cognitive invariants.

## Alternatives considered
1. **Inline Component Calculation**: Calculate CTS, CLS, MCS, and EES inline in `BrainXPanel.tsx` using local UI state.
   - *Reason for rejection*: Inhibits unit testing of telemetry accuracy, prevents snapshot caching, and results in duplicated predictability logic.

## Decision
We establish a pure versioned boundary: `TelemetryInputV1` $\rightarrow$ `TelemetryEngineV1` $\rightarrow$ `TelemetrySnapshotV1`.

We enforce the **Telemetry Purity Rule**:
- `TelemetryEngineV1` must be strictly deterministic, side-effect free, synchronous, cacheable, and persistence-free.
- It must never publish events, write state, log, mutate `Missions`, or perform asynchronous work.
- Predictability confidence must be consumed directly from `ExplanationContractV1` to guarantee single-source correctness.
- We split UI-bound semantics (`derivedState`) from analytical metrics (`productMetrics`) in `TelemetrySnapshotV1`.
- The contract boundary is frozen, but mathematical weights remain mutable under `Telemetry Calibration v1`.

## Consequences
- Telemetry metrics are fully testable via unit tests.
- UI components perform zero calculations and remain purely declarative.
- Telemetry snapshots are serializable for historical dashboards.

## Future reconsideration trigger
Reconsideration occurs if TVR or UXR evidence demonstrates that telemetry scores fail to correlate with actual observed user comprehension levels or cognitive fatigue.
