---
Document ID: BX-ARCH-002
Version: 1.0
Release: AF-1.0
Status: Frozen
Owner: Cognition
Depends On: ADR-001, ADR-005
Validated By: MVR1, MVR2
Last Structural Change: 2026-06-21
---

# Brain X Dependency Map

This map defines the strict dependency direction within the Brain X cognitive layer, preventing circular references and maintaining boundary isolation.

---

## Diagram

```mermaid
graph TD
    MissionTypes["MissionTypes.ts (Types & Schema)"]
    ReasoningGraph["ReasoningGraphEngine.ts (Pure operations)"]
    MissionService["MissionService.ts (Lifecycle & Decisions)"]
    ExplanationEngine["ExplanationEngine.ts (Derived explanation)"]
    TelemetryEngine["TelemetryEngineV1.ts (Pure telemetry metrics)"]
    BrainXPanel["BrainXPanel.tsx (Declarative UI views)"]

    ReasoningGraph -->|Imports| MissionTypes
    MissionService -->|Imports| ReasoningGraph
    ExplanationEngine -->|Imports| MissionService
    TelemetryEngine -->|Imports| ExplanationEngine
    TelemetryEngine -->|Imports| MissionTypes
    BrainXPanel -->|Imports| TelemetryEngine
    BrainXPanel -->|Imports| ExplanationEngine
```

---

## Layer Rules

1. **Dependency Direction**: Downward imports are strictly prohibited. The UI depends on Telemetry and Explanation, which depend on Cognition, which depend on core types.
2. **Pure Engines**: `ReasoningGraphEngine` and `TelemetryEngine` are purely functional libraries with zero side effects, enabling 100% test coverage.
