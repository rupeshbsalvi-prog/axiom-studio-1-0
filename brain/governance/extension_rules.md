---
Document ID: BX-STD-002
Version: 1.0
Release: AF-1.0
Status: Frozen
Owner: Platform / Cognition / Explainability / Telemetry / Experience / Product
Depends On: ADR-005
Validated By: MVR, EVR, TVR, UXR, PVR
Last Structural Change: 2026-06-21
---

# Layer Extension Rules

This document specifies the rules for extending the Axiom Studio and Brain X layers without violating the Single Extension Point policy (ADR-005).

## Extension Points Matrix

| Layer | Canonical Extension Point | Allowed Actions | Prohibited Actions |
|---|---|---|---|
| **Platform** | `StudioModule` subclass registration | - Create new Studios<br>- Listen to platform events | - Modify platform EventBus core<br>- Modify platform StateService |
| **Cognition** | `Mission` instances & custom steps | - Add custom execution steps<br>- Create new Mission scenarios | - Add custom cognitive node types<br>- Alter the 6 core Mission classes |
| **Explainability** | `ExplanationContractV1` fields | - Add view-specific derived fields | - Pass raw Mission state to UI<br>- Run async evaluations inside UI |
| **Telemetry** | `TelemetrySnapshotV1` metrics | - Add custom UI-bound metadata | - Run async queries inside TelemetryEngine<br>- Leak business metrics into UI |
| **Experience** | Custom layout components in `BrainXPanel` | - Implement visual state changes<br>- Add animation hooks | - Traverse raw state directly<br>- Perform metrics computation in React components |
| **Product** | New User Workflows | - Define new user scenarios<br>- Connect multiple Studios | - Add custom communication layers<br>- Override core cognitive boundaries |
