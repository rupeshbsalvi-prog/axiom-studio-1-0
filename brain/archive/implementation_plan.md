# Brain X — Mission Architecture v1.0 (FROZEN)

**Specification Status:** ✅ Frozen — 2026-06-21
**Implementation Status:** ✅ Complete — 2026-06-21
**Validation Status:** ✅ Complete — MVR1, MVR2, EVR1 verified & Telemetry Refined

---

## Architecture Layer Status

| Layer | Status | Validation |
|-------|--------|------------|
| Platform Runtime | ✅ Feature-Frozen | FR (FR1.0 - FR1.2) |
| Mission Cognition | ✅ Feature-Frozen | MVR (MVR1 - MVR2) |
| Explainability Engine & UI | ✅ Feature-Frozen | EVR (EVR1) + UXR |
| Product & Workflows | ▶ Active | PVR |

---

## Structural Maturity Model

The same progression that matured Platform Runtime v5 now applies to Brain X:

```
Definition
    ↓
Implementation
    ↓
Validation (MVR1 / MVR2 / EVR1)
    ↓
Structural Property (Cognitive & Explainability Freezes)
```

Brain X achieves structural property status under the definition:
> **One cognitive architecture supports six fundamentally different reasoning patterns without structural modification.**

The Explainability Layer achieves structural property status under the definition:
> **One explanation model communicates multiple reasoning patterns without exposing implementation details.**

With the validation of the 6 core classes in the Mission Diversity Index and the Explanation Engine complete, the architecture is in **Cognitive & Explainability Freeze**: no new cognitive domains, promotion stages, reasoning primitives, or explanation contract fields are introduced until multiple independent product workflows demonstrate the exact same limitation.

---

## Long-Term Maturity Model

The project naturally divides into five layers:

| Layer          | Frozen  | Validation       |
| -------------- | ------- | ---------------- |
| Platform       | ✅       | FR               |
| Cognition      | ✅       | MVR              |
| Explainability | ✅       | EVR + UXR        |
| Product        | Active  | PVR              |
| Business       | Future  | Adoption metrics |

That is a complete engineering maturity model.

---

## Artifact Layer Ownership & Governance Rule

We establish and freeze the ownership of each public artifact:

| Artifact | Sole Owner |
| --- | --- |
| MissionTypes | Cognition |
| ExplanationContractV1 | Explainability |
| TelemetrySnapshotV1 | Telemetry |
| BrainXPanel | Experience |
| Product Constitution | Product |

### Governance Rule:
> Every public artifact has exactly one owner. Changes to a frozen artifact require approval from its owning layer and evidence from the next validation stage (EVR, UXR, TVR, or PVR).

This prevents cross-layer coupling and architectural erosion over time.

---

## Post-Phase 8 Architectural Prohibition

We prohibit new architectural work or extensions to any frozen layer until one of the following occurs:
1. **UXR** exposes comprehension failures.
2. **PVR** exposes workflow failures.
3. Multiple independent products require the same cognitive capability.
4. Runtime v5 evidence threshold is met.

Everything else becomes product implementation.

---

## Mission Diversity Index

Brain X's equivalent of the heterogeneous Studio count.

| Mission Class | Description | MVR |
|---------------|-------------|-----|
| Creative | Assets, campaigns, visual production | MVR1 |
| Development | Software features, architecture decisions | MVR2 |
| Research | Investigation, synthesis, comparison | MVR2 |
| Planning | Roadmaps, schedules, resource allocation | MVR2 |
| Operations | Deployments, process coordination | MVR2 |
| Decision Support | Trade-off analysis, recommendation | MVR2 |

A Mission Diversity Index of 6/6 with no architectural changes is the equivalent of three heterogeneous Studios.

---

## Explanation Contract & Invariant

We introduce the `ExplanationContractV1` as a formal boundary contract at the same level as `StudioModule` and `Mission`.

### The UI Invariant:
> **Every visible Brain X element must be derivable from exactly one `ExplanationContractV1`.**

The UI never reasons, never interprets, and only renders `ExplanationContractV1` payloads.

```
Mission
   ↓
Explanation Engine
   ↓
ExplanationContractV1
   ↓
Timeline / Graph / Delegations / Decision / Evolution
```

This clean separation separates **cognition failures** (when the Mission reasoning is incorrect) from **explanation failures** (when the explanation engine maps it incorrectly).

---

## Mission Validation Release 1 (MVR1)

**Purpose:** Can one Mission execute correctly from creation to completion?
**Scenario:** `"Create a marketing campaign for the Axiom Studio announcement"`
**Mission class:** Creative
**Validation file:** `src/app/studios/brain-x/tests/MVR1_MarketingCampaign.test.ts`

---

## Mission Validation Release 2 (MVR2)

**Purpose:** Can different kinds of Missions coexist without architectural changes?
**Validation file:** `src/app/studios/brain-x/tests/MVR2_MissionDiversity.test.ts`

---

## Explainability Validation Release 1 (EVR1)

**Purpose:** Can the Explanation Engine correctly derive the Explanation Contract across all lifecycle stages?
**Validation file:** `src/app/studios/brain-x/tests/EVR1_ExplanationCorrectness.test.ts`

---

## Explainability & Telemetry Refinement (Phase 8 Refinement)

### Goal Description
Introduce a versioned, pure `TelemetryEngineV1` returning `TelemetrySnapshotV1` based on `TelemetryInputV1` context object. Decouples metric computation from the presentation layer (`BrainXPanel.tsx`), making the UI purely declarative and enabling full unit testability of the cognitive telemetry metrics (`CTS`, `CLS`, `MCS`, `EES`).

### Design Decisions

1. **Separation of Concerns**:
   `TelemetrySnapshotV1` divides data into two namespaces:
   - `derivedState`: UI states (`healthState`, `cognitiveLoadLevel`, `nextActionConfidence`).
   - `productMetrics`: Analytical/UX scores (`cts`, `cls`, `mcs`, `ees`).

2. **Explanation Engine Ownership of Predictability**:
   `TelemetryEngineV1` consumes the canonical explanation contract output as part of `TelemetryInputV1`. Telemetry never independently infers predictability confidence, ensuring a single deterministic source of truth.

3. **Frozen Boundary, Mutable Calibration**:
   The boundary API contracts (`TelemetryInputV1`, `TelemetrySnapshotV1`, `TelemetryEngineV1`) are formally frozen as cognitive API contracts. The mathematical coefficients (e.g. `cls = delegations * 15`) are defined as mutable under `Telemetry Calibration v1` and can be adjusted without breaking API contracts.

4. **Telemetry Purity Rule**:
   `TelemetryEngineV1` is strictly deterministic, side-effect free, synchronous, cacheable, and persistence-free. It never publishes events, writes state, logs, mutates `Missions`, or performs asynchronous work. Its sole responsibility is pure derived calculation: `Input` → `Pure calculation` → `Snapshot`.

---

## Validation Programs (The Complete Validation Ladder)

The validation path is structured as a ladder checking engineering correctness, cognitive correctness, explanation correctness, telemetry correctness, human understanding, and business value:
1. **FR (Platform)**: Verify engineering contracts and runtime execution.
2. **MVR (Cognition)**: Verify cognitive models and reasoning engine correctness.
3. **EVR (Explainability)**: Verify that derived explanation contracts are semantically correct and map precisely to backend state.
4. **TVR (Telemetry)**: Verify telemetry snapshots remain deterministic, monotonic, calibrated, and bounded before exposing them to users.
5. **UXR (Explainability UX)**: Verify human explainability, predictability (CTS), and cognitive effort (CLS).
6. **PVR (Products)**: Verify user completion rates, efficiency, and product adoption.
