---
Document ID: BX-IDX-001
Version: 1.0
Release: AF-1.0
Status: Frozen
Owner: Brain X Architect
Depends On: BX-ARCH-001, BX-ARCH-002, BX-ARCH-003, BX-SPEC-IDX, BX-REF-001, BX-REF-002, BX-ADR-006, BX-STD-004
Validated By: PVR
Last Structural Change: 2026-06-21
---

# Brain X Architecture Index

This index serves as the entry point, canonical structural map, and dependency graph for the Brain X studio layers, contracts, and governance rules.

---

## Canonical Dependency Graph

```
Platform Runtime v5 (Layer 0)
        │
        ▼
Mission Architecture v1.0 (Layer 1)
        │
        ▼
Explanation Contract V1 (Layer 2)
        │
        ▼
Telemetry Snapshot V1 (Layer 3)
        │
        ▼
Mission Control Experience (Layer 4)
        │
        ▼
User Workflows (Layer 5)
```

---

## Execution Lifecycle

The system moves through a canonical execution lifecycle from user intent to telemetry and back to the experience layer:

```
User Intent
      │
      ▼
Mission (Cognition)
      │
      ▼
Reasoning (Graph Sort)
      │
      ▼
Delegation (Studio Action)
      │
      ▼
Observation (Events/Logs)
      │
      ▼
Judgment (Pauses/Promotions)
      │
      ▼
Reflection (State Capture)
      │
      ▼
Explanation (derived UI contract)
      │
      ▼
Telemetry (pure load metrics)
      │
      ▼
Experience (calm, pacing rules)
      │
      ▼
User
```

### Lifecycle Stage Descriptions
1. **User Intent**: The operator defines the goal or provides instruction.
2. **Mission**: Decoupled cognition builds objectives and stages.
3. **Reasoning**: Graph sorting organizes dependencies and active paths.
4. **Delegation**: Cognitive actions are dispatched as commands to specialized Studio modules via the platform `EventBus`.
5. **Observation**: Raw execution telemetry, events, and log streams are captured.
6. **Judgment**: Critical blocked stages prompt human override; learnings are promoted based on evidence.
7. **Reflection**: Cognitive state is captured in memory.
8. **Explanation**: Raw cognitive structures are translated into the versioned `ExplanationContractV1`.
9. **Telemetry**: Explanation and mission performance are analyzed to generate pure `TelemetrySnapshotV1` metrics.
10. **Experience**: The `BrainXPanel` renders calm visual representations enforcing visual, motion, and pacing rules.
11. **User**: The operator reviews progress and takes next action.

---

## Architectural Directories, Maps, & Reference

For detailed structural maps, validation ladders, and references, refer to:
- **[Runtime Map](file:///c:/Users/Rupesh%20Salvi/Downloads/Google%20Antigravity/Project%20Axiom%20Studio/Axiom%20Studio%201.0/brain/architecture/runtime-map.md)** (`brain/architecture/runtime-map.md`): Execution flow between the Platform, Studios, and Cognition.
- **[Dependency Map](file:///c:/Users/Rupesh%20Salvi/Downloads/Google%20Antigravity/Project%20Axiom%20Studio/Axiom%20Studio%201.0/brain/architecture/dependency-map.md)** (`brain/architecture/dependency-map.md`): Import hierarchies and functional rules in the cognitive layer.
- **[Validation Ladder](file:///c:/Users/Rupesh%20Salvi/Downloads/Google%20Antigravity/Project%20Axiom%20Studio/Axiom%20Studio%201.0/brain/architecture/validation-ladder.md)** (`brain/architecture/validation-ladder.md`): Gates, owners, criteria, and evidence for lifecycle testing.
- **[Glossary](file:///c:/Users/Rupesh%20Salvi/Downloads/Google%20Antigravity/Project%20Axiom%20Studio/Axiom%20Studio%201.0/brain/reference/glossary.md)** (`brain/reference/glossary.md`): Canonical terms, abbreviations, and validation gates.
- **[Decision Matrix](file:///c:/Users/Rupesh%20Salvi/Downloads/Google%20Antigravity/Project%20Axiom%20Studio/Axiom%20Studio%201.0/brain/reference/decision-matrix.md)** (`brain/reference/decision-matrix.md`): Lookup matrix mapping change intents to files, ownership, and governance rules.

---

## The Architecture Stack

### Layer 0 — Platform Runtime
* **Runtime Abstraction**: Decoupled studio modules, EventBus-driven pub-sub communication, and state storage.
* **Specification**: Frozen Platform Runtime v5.0.

### Layer 1 — Brain X Cognition
* **Core Cognition**: Structured `Mission` and graph representation of objectives, dependencies, and promotion.
* **API Contract**: [MissionTypes.ts](file:///c:/Users/Rupesh%20Salvi/Downloads/Google%20Antigravity/Project%20Axiom%20Studio/Axiom%20Studio%201.0/src/app/studios/brain-x/mission/MissionTypes.ts)
* **Engines**: ReasoningGraphEngine, MissionService, DelegationEngine, CognitivePromotionEngine.

### Layer 2 — Explainability
* **Explanation Boundary**: A clean versioned interface decoupling presentation rendering from raw cognitive structures.
* **API Contract**: [ExplanationContract.ts](file:///c:/Users/Rupesh%20Salvi/Downloads/Google%20Antigravity/Project%20Axiom%20Studio/Axiom%20Studio%201.0/src/app/studios/brain-x/mission/ExplanationContract.ts)
* **Engine**: [ExplanationEngine.ts](file:///c:/Users/Rupesh%20Salvi/Downloads/Google%20Antigravity/Project%20Axiom%20Studio/Axiom%20Studio%201.0/src/app/studios/brain-x/mission/ExplanationEngine.ts)

### Layer 3 — Telemetry
* **Telemetry Boundary**: Pure derived computation of user and system cognitive load and consistency.
* **API Contract**: [TelemetrySnapshotV1.ts](file:///c:/Users/Rupesh%20Salvi/Downloads/Google%20Antigravity/Project%20Axiom%20Studio/Axiom%20Studio%201.0/src/app/studios/brain-x/mission/TelemetrySnapshotV1.ts)
* **Engine**: [TelemetryEngineV1.ts](file:///c:/Users/Rupesh%20Salvi/Downloads/Google%20Antigravity/Project%20Axiom%20Studio/Axiom%20Studio%201.0/src/app/studios/brain-x/mission/TelemetryEngineV1.ts)

### Layer 4 — Experience
* **Visual Presentation**: Calm, responsive visual elements representing timeline stages, judgments, evolution, and next-action confidence.
* **Principle Guide**: [Brain X Experience Bible](file:///c:/Users/Rupesh%20Salvi/Downloads/Google%20Antigravity/Project%20Axiom%20Studio/Axiom%20Studio%201.0/brain/experience/experience_bible.md)
* **Panel UI**: [BrainXPanel.tsx](file:///c:/Users/Rupesh%20Salvi/Downloads/Google%20Antigravity/Project%20Axiom%20Studio/Axiom%20Studio%201.0/src/app/studios/brain-x/BrainXPanel.tsx)

### Layer 5 — Products
* **User Workflows**: Value adoption, client tasks, and custom creations.
* **Product Laws**: [Product Constitution v1.0](file:///c:/Users/Rupesh%20Salvi/Downloads/Google%20Antigravity/Project%20Axiom%20Studio/Axiom%20Studio%201.0/brain/governance/product_constitution.md)
* **Asset Standards**: [Asset Engineering Standard v1.0](file:///c:/Users/Rupesh%20Salvi/Downloads/Google%20Antigravity/Project%20Axiom%20Studio/Axiom%20Studio%201.0/brain/governance/asset_engineering_standard.md)

---

## Governance Decisions (ADRs)

Architectural rules and rationales are permanently frozen inside specific Architecture Decision Records:
- [ADR-001: Cognitive Freeze Policy for Brain X](file:///c:/Users/Rupesh%20Salvi/Downloads/Google%20Antigravity/Project%20Axiom%20Studio/Axiom%20Studio%201.0/brain/adr/ADR-001-Cognitive-Freeze.md) — Cognitive stability.
- [ADR-002: Explanation Boundary and UI Invariant](file:///c:/Users/Rupesh%20Salvi/Downloads/Google%20Antigravity/Project%20Axiom%20Studio/Axiom%20Studio%201.0/brain/adr/ADR-002-Explanation-Boundary.md) — UI separation of concerns.
- [ADR-003: Telemetry Boundary and Purity Rule](file:///c:/Users/Rupesh%20Salvi/Downloads/Google%20Antigravity/Project%20Axiom%20Studio/Axiom%20Studio%201.0/brain/adr/ADR-003-Telemetry-Boundary.md) — Pure and testable analytics.
- [ADR-004: Product Constitution and Layer Ownership](file:///c:/Users/Rupesh%20Salvi/Downloads/Google%20Antigravity/Project%20Axiom%20Studio/Axiom%20Studio%201.0/brain/adr/ADR-004-Product-Constitution.md) — Ownership freeze and governance.
- [ADR-005: Single Extension Point Policy](file:///c:/Users/Rupesh%20Salvi/Downloads/Google%20Antigravity/Project%20Axiom%20Studio/Axiom%20Studio%201.0/brain/adr/ADR-005-One-Extension-Point.md) — Prevention of structural sprawl.
- [ADR-006: Architecture Freeze 1.0](file:///c:/Users/Rupesh%20Salvi/Downloads/Google%20Antigravity/Project%20Axiom%20Studio/Axiom%20Studio%201.0/brain/adr/ADR-006-Architecture-Freeze.md) — Boundary freeze policy locking in v1.0 specifications.

---

## Validation Progression

The verification system scales up through a gated pipeline:
1. **FR (Platform)** ──> 2. **MVR (Cognition)** ──> 3. **EVR (Explainability)** ──> 4. **TVR (Telemetry)** ──> 5. **UXR (Experience)** ──> 6. **PVR (Product)**
