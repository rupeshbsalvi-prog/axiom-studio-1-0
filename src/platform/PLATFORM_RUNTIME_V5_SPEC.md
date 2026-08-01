# Platform Runtime v5 — Formal Specification

**Status: Feature-Frozen**
**Certified: 2026-06-21**
**Semantic Version: v5.0 (locked)**

---

## Governance Policy

Platform Runtime v5 is **feature-frozen**. The following are permitted:

| Permitted                    | Not Permitted              |
|------------------------------|----------------------------|
| Bug fixes                    | New contracts              |
| Performance improvements     | New services               |
| Security fixes               | Lifecycle changes          |
| Documentation clarifications | Interface changes          |

### Semantic Versioning

| Version | Meaning                                          |
|---------|--------------------------------------------------|
| v5.x    | Bug fixes, documentation, optimizations only     |
| v6.0    | New contracts or breaking architectural changes  |

### v6.0 Triggers — Explicit

A change to `src/platform/` requires a formal **v6.0 proposal** if it does any of the following:

| Trigger | Example |
|---------|---------|
| Breaking lifecycle change | Adding a 5th StudioModule method; changing argument signatures |
| New runtime service | Adding a SchedulerService, RouterService, or similar |
| Event contract change | Changing EventBus from synchronous to asynchronous; adding replay |
| State semantics change | Changing setState() to publish deltas instead of full snapshots; adding transactions |
| Registry interface change | Modifying StudioDefinition shape; changing getStudioById signature |
| DiagnosticsProvider contract change | Modifying the `collect()` return type; adding required fields |

Everything that does not appear on this list is a v5.x change. When in doubt: if downstream Studios would need to update their code, it is a v6.0 trigger.

Any change to `src/platform/` that introduces a new service, modifies an existing contract, or adds a lifecycle method requires a formal v6.0 proposal.

### v6.0 Evidence Threshold

A v6.0 proposal is only valid when all four conditions are met:

| Evidence Required | Condition |
|-------------------|-----------|
| Independent exposure | At least two independent Studios encounter the same limitation |
| Boundary failure | The limitation cannot be resolved within Studio boundaries |
| Contract gap | Existing contracts cannot express the required behavior |
| Platform scope | The change benefits the platform broadly, not a single Studio |

A limitation encountered by only one Studio is a Studio problem, not a platform problem. It belongs in the Studio — not in a v6.0 proposal.

---

## Validation History

| Foundation Release | Validation Goal                             | Result   |
|--------------------|---------------------------------------------|----------|
| FR1.0              | Rendering consumer (WebGL / Three.js)       | ✅ Passed |
| FR1.1              | Heterogeneous non-WebGL consumer            | ✅ Passed |
| FR1.2              | Concurrent heterogeneous orchestration      | ✅ Passed |

### Execution Models Validated

| Studio   | Execution Model                       |
|----------|---------------------------------------|
| AX-CORE  | GPU rendering / WebGL / frame loop    |
| Axiom AI | Data & intelligence / zero rendering  |
| Brain X  | Concurrent orchestration & workflows  |

Three fundamentally different execution models exercised the same runtime contracts across FR1.0–FR1.2 without requiring runtime evolution. This is the evidence base for the "Architecturally Mature" classification.

---

## Architectural Certification

| Capability               | Status      |
|--------------------------|-------------|
| Rendering Platform       | ✅ Certified |
| Multi-Studio Runtime     | ✅ Certified |
| Event Architecture       | ✅ Certified |
| State Architecture       | ✅ Certified |
| Registry Pattern         | ✅ Certified |
| Diagnostics Framework    | ✅ Certified |
| Service-Oriented Runtime | ✅ Certified |
| Consumer Generality      | ✅ Certified |
| Concurrent Execution     | ✅ Certified |
| Rendering Integration    | ✅ Certified |
| Non-Rendering Integration| ✅ Certified |
| Governance Model         | ✅ Certified |
| Product Boundary         | ✅ Certified |

**Certification Date:** 2026-06-21
**Certified by:** Platform Foundation Phase closure review, FR1.0–FR1.2.

---

## Core Contracts (Frozen)

### StudioModule Lifecycle

Every Studio must implement exactly these four methods, in this order:

```
initialize()   — register with platform, seed state, register provider
activate()     — begin Studio-specific work (observers, timers, rendering)
deactivate()   — pause Studio-specific work, clean subscriptions
dispose()      — full teardown, zero platform residue
```

No orchestration-specific, rendering-specific, or domain-specific lifecycle methods may be added to this contract.

### Registration

Studios register with `platformRuntime.registerStudio(this)`.
Studios deregister with `platformRuntime.unregisterStudio(this)`.
The runtime has no knowledge of any specific Studio type.

### DiagnosticsProvider Contract

```typescript
interface DiagnosticsProvider {
  readonly id: string;
  initialize(): void;
  collect(): Record<string, unknown>;
  dispose(): void;
}
```

Providers are registered additively. The DiagnosticsService has no knowledge of any specific provider.

### EventBus Characteristics

- **Delivery:** Synchronous. Subscribers receive events in the order they are published.
- **FIFO:** Guaranteed within a single publish call.
- **Replay:** EventBus does NOT replay historical events to late subscribers.
- **Scope:** Process-wide. Any code with access to the `eventBus` singleton can publish or subscribe.

### StudioId and CanvasMode

Defined in `src/app/studios/registry.ts`. Extending these unions is additive and does not require a platform change.

---

## StateService Behavioral Contract

### RT-001 — Full Snapshot Semantics

**Observation**

`StateService.setState()` merges the provided partial state with the existing state, then publishes the **complete immutable merged snapshot** as the `state:changed` event.

```
setState(partial)
  ↓
merge into full state
  ↓
publish complete immutable state snapshot as "state:changed"
  ↓
all subscribers receive the full snapshot
```

**Consequence**

Subscribers that also perform state writes will receive their own published snapshot as a new event. If the subscriber's guard condition (`if key === undefined return`) passes on the full snapshot, infinite recursion results.

**Required Convention — Reactive Observer Rule**

> Subscribers must be considered **reactive observers**. If a subscriber performs state mutations, it must explicitly guard against recursive publication.

The canonical pattern:

```typescript
private isProcessingX = false;

eventBus.subscribe("state:changed", (state) => {
  if (this.isProcessingX) return;         // re-entrancy guard
  if (/* condition not met */) return;    // early exit

  try {
    this.isProcessingX = true;
    stateService.setState({ ... });       // safe write
  } finally {
    this.isProcessingX = false;           // always reset
  }
});
```

**Classification:** Documented behavioral contract. Not a defect.

**Future Path:** Selector-based subscriptions (`subscribeToNamespace`, `subscribeToSelector`) are candidates for Runtime v6 only if justified by future platform needs. No change to Runtime v5.

---

## Platform Topology

```
Platform Runtime v5
│
├── PlatformRuntime       (studio registration & lifecycle orchestration)
├── EventBus              (synchronous publish/subscribe, process-wide)
├── StateService          (key-value store, full-snapshot semantics on write)
├── DiagnosticsService    (provider registry, collectAll())
├── ComplianceEngine      (rule evaluation, deterministic)
└── AssetRegistry         (additive asset registration)
```

Studios live entirely in `src/app/studios/`. The platform has no knowledge of any Studio.

---

## Studio Independence Guarantee

A Studio is considered independent if:

1. All its code lives in `src/app/studios/<studio-id>/`
2. Deleting that directory is sufficient to fully remove it from the platform
3. It does not import from any other Studio's directory
4. It interacts with other Studios exclusively through the EventBus

Brain X is the reference implementation of Studio independence. It observes Axiom AI state changes exclusively via `state:changed` events — zero direct import.

---

## What Comes Next (Platform is Frozen)

The platform is no longer the work. Future effort shifts decisively to products.

| Phase | Focus |
|-------|-------|
| 1 | Brain X — full product development |
| 2 | Imagine X — creative planning engine |
| 3 | Marketplace |
| 4 | Studio Nodes and remaining Studios |

Every new Studio is a product built *on* the platform — not an opportunity to modify it.

---

## Platform Laws (Relevant to Runtime Governance)

### Platform Law 11 — Product Before Platform

> **No modification to Platform Runtime v5 shall be made solely to simplify a single Studio. Runtime evolution must be justified by multiple independent product requirements and proceed only through a versioned platform proposal.**

This law establishes the default question that every future platform change must answer.

The question is no longer:

> *Can we improve the platform?*

The question is:

> *Has the platform actually failed to support a real product requirement — and has that failure been demonstrated by more than one independent Studio?*

These are different standards. The first invites gradual erosion. The second protects the platform's stability.

Platform Law 11 complements the Foundation-first philosophy established at project inception: the platform must be proven by consumers, not extended to accommodate them.

---

## Studio Template Rule

**Every new Studio must originate from `src/platform/studio-template/StudioTemplate.ts`.**

This is a project rule, not a suggestion. The template embeds:

- Correct StudioModule lifecycle (initialize / activate / deactivate / dispose)
- Correct platform registration and deregistration
- Correct diagnostics provider registration
- Correct EventBus subscription and cleanup
- RT-001 re-entrancy guard (pre-implemented)
- Cross-Studio EventBus-only observation pattern
- Zero platform residue on dispose()

Starting from the template prevents architectural drift before it begins. A Studio that did not originate from the template must demonstrate equivalence to the template's patterns during code review.

---

## Formal Phase Closure

**Platform Foundation Phase: Closed — 2026-06-21**

The following phases were completed in sequence:

| Stage | Objective | Outcome |
|-------|-----------|--------|
| Platform Definition | Vision, laws, governance, architecture | ✅ Complete |
| Foundation Release 1.0 | Runtime and reference implementation | ✅ Complete |
| Foundation Release 1.1 | Heterogeneous consumer validation | ✅ Complete |
| Foundation Release 1.2 | Concurrent heterogeneous validation | ✅ Complete |
| Platform Governance | Specification, template, matrix, laws | ✅ Complete |

**Platform Runtime v5 is feature-frozen, architecturally mature, and governance-complete.**

`src/platform/` is the platform.
`src/app/studios/` is where products are created.

The next commit touching `src/app/studios/` is the first product built on a completed platform — not a continuation of platform work. That boundary should remain clear as the Axiom ecosystem expands.
