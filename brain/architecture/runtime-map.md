---
Document ID: BX-ARCH-001
Version: 1.0
Release: AF-1.0
Status: Frozen
Owner: Platform / Cognition
Depends On: ADR-001, ADR-005
Validated By: FR1, MVR1
Last Structural Change: 2026-06-21
---

# Brain X Runtime Map

This map defines the execution flow and authority layers between the Axiom Platform, Studio modules, and the Brain X cognitive subsystem.

---

## Diagram

```mermaid
graph TD
    Platform["Axiom Platform (Runtime v5)"]
    Studios["Studio Modules (Photo, Vector, Brand, etc.)"]
    BrainX["Brain X Studio"]
    Mission["Mission Engine (Cognition)"]

    Platform -->|Loads & Orchestrates| Studios
    Platform -->|Hosts & Feeds EventBus| BrainX
    BrainX -->|Manages Lifecycle| Mission
    Studios -->|Communicate via EventBus| BrainX
    Mission -->|Delegates Tasks| Studios
```

---

## Execution Flow

1. **Axiom Platform (Runtime v5)** loads and initializes the system, setting up the `EventBus` and core state containers.
2. **Studios** register as modular extensions via the `StudioModule` API.
3. **Brain X Studio** initializes as a cognitive management module, subscribing to orchestration events.
4. **Mission Engine** executes intent, builds the reasoning graph, and delegates tasks back to specific **Studios** via EventBus commands.
