---
Document ID: BX-REF-002
Version: 1.0
Release: AF-1.0
Status: Frozen
Owner: Brain X Architect
Depends On: BX-IDX-001, BX-STD-002
Validated By: PVR
Last Structural Change: 2026-06-21
---

# Brain X Architectural Decision Matrix

This document provides a lookup matrix to determine the correct location and governance rule for any proposed changes or extensions to the Brain X codebase.

---

## Decision Matrix

When a developer wants to make a change or extend the platform, they must locate their intent in the matrix below to identify the correct target file, ownership, and governance rules.

| I want to change or add... | Target Location | Owner Layer | Governance Rule | Validation Gate |
|---|---|---|---|---|
| **Platform Runtime** (modules, EventBus, StateService) | `src/platform/` or `brain/adr/` | Platform | Requiring new ADR and consensus across all Studios | FR (Platform) |
| **Cognitive Types** (objectives, schema, state parameters) | `MissionTypes.ts` or `brain/contracts/MissionTypes.md` | Cognition | Strictly frozen; thawing requires MVR validation and cross-layer ADR | MVR (Cognitive) |
| **Cognitive Algorithms** (sorting, path analysis, promotions) | `ReasoningGraphEngine.ts` or `CognitivePromotionEngine.ts` | Cognition | Strictly frozen; only bug fixes permitted | MVR (Cognitive) |
| **Derived UI Data Contracts** (explanation schema, timeline representation) | `ExplanationContract.ts` or `brain/contracts/ExplanationContractV1.md` | Explainability | Decoupled boundary contract; modifications require EVR test validation | EVR (Explainability) |
| **Calm UI Renderers** (Timeline, Graph View, Judgment Console) | `BrainXPanel.tsx` or `brain/experience/` | Experience | Must strictly adhere to the Experience Bible and product pacing rules | UXR (Experience) |
| **Telemetry Calculations** (scoring formulas, CLS/MCS logic) | `TelemetryEngineV1.ts` or `brain/contracts/TelemetrySnapshotV1.md` | Telemetry | Formulas are mutable under Telemetry Calibration, but the interface schema is frozen | TVR (Telemetry) |
| **Product Behavior & Core Laws** (The Six Laws, user controls) | `brain/governance/product_constitution.md` | Product | Immutable product laws; thawing requires empirical UXR/PVR evidence | PVR (Product) |
| **New Studio Modules** (Photo, Vector, Brand extensions) | A new subdirectory under `src/app/studios/` | Respective Studio | Allowed under Single Extension Point; must implement the `StudioModule` interface | FR (Platform) |
| **New Mission Scenarios** (task flows, custom steps) | Custom JSON configurations or unit test scenarios | Cognition | Allowed; must be expressed through dynamic Mission instances, not new types | MVR (Cognitive) |
| **Visual & AI Assets** (prompts, SVG icons, WebP illustrations) | `creative/` or `brain/governance/asset_engineering_standard.md` | Experience / Creative | Governed by AES-1.0; updates require style harmony and WCAG AA audits | PVR (Product) |


---

## Extension Guidelines

* **Immutable Core**: The core engines and contracts in `src/app/studios/brain-x/mission/` are frozen. Extension is achieved by injecting new dynamic payloads, registering new `StudioModule`s, or writing new User Workflows.
* **Single Extension Point Rule**: Refer to [ADR-005: Single Extension Point Policy](file:///c:/Users/Rupesh%20Salvi/Downloads/Google%20Antigravity/Project%20Axiom%20Studio/Axiom%20Studio%201.0/brain/adr/ADR-005-One-Extension-Point.md) to ensure structural sprawl is prevented.
