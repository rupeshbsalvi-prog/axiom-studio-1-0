---
Document ID: BX-GUIDE-001
Version: 1.0
Release: AF-1.0
Status: Frozen
Owner: Experience
Depends On: ADR-002, ADR-004
Validated By: UXR1-UXR4
Last Structural Change: 2026-06-21
---

# Brain X Experience Bible

This document defines the experience principles, pacing rules, and user interaction standards for the **Mission Control UX**. It serves as the bridge between frozen architecture and product design, ensuring that Brain X is consistently perceived as calm, predictable, and intelligent.

---

## 1. How Should Brain X Feel?

Brain X must feel like a **highly competent, deferential co-pilot**. 

* **Calm & Stable**: The interface must avoid high-frequency visual updates, frantic animations, or sudden color changes. It operates as a steady presence.
* **Authoritative Yet Deferential**: When presenting judgments or recommendations, it does so with evidence-based confidence, but always yields final control to the human operator (respecting *Law 3 — Human Override*).
* **Predictable**: The user should never be surprised by a transition. Every cognitive action must trace back to the verbatim intent or a known state change (respecting *Law 6 — Stable Mental Model*).

---

## 2. How Fast Should It React?

A key aspect of cognitive experience is **pacing**. Different events require different temporal dynamics:

| Event Type | Target Latency | Pacing Style | Rationale |
|---|---|---|---|
| **User Input / Tab Clicks** | $< 100\text{ms}$ | Immediate | Standard UX responsiveness; feels snappy. |
| **Delegation Status Updates** | $300\text{ms} - 500\text{ms}$ | Smooth slide / fade | Shows progression of work without visual jarring. |
| **Active Decisions (Pausing)** | Immediate | Prominent Amber Slide-in | Demands attention because execution is blocked. |
| **Cognitive Promotion** | $1.5\text{s} - 2\text{s}$ | Paced consolidation | Consolidation of memory should feel deliberate and considered, not like a rapid database write. |
| **Timeline Transitions** | $800\text{ms}$ | Phased fade-in | Give the user time to register the stage shift. |

---

## 3. When Should It Animate? And When Should It Remain Still?

### When to Animate:
* **Active Progress Bars**: Translucent progress bars should have a slow, gentle shimmer during active delegations to indicate life.
* **Decision Banners**: A soft pulsing glow on the *Judgment Console* when a critical user decision blocks the mission.
* **Timeline Success**: A clean checkmark animation when a stage transitions to completed.

### When to Remain Still:
* **Reasoning Graphs**: Once a graph is planned, nodes and edges must remain completely static. Do not float, wiggle, or automatically rearrange nodes during execution.
* **Telemetry Gauges**: CTS, CLS, and MCS values should update without sweeping animations; they should transition instantly or with micro-fades.
* **Observational Logs**: Text lines must append statically. Avoid scrolling carousels.

---

## 4. How Much Information is Visible by Default?

Brain X adheres strictly to **Progressive Disclosure** (*Law 4*):

```
Outcome Card (Default)
   ↓
Timeline / Next Action (Default)
   ↓
Reasoning Nodes & Objectives (Expanded on double-click)
   ↓
Evidence Chains & Rationales (Detail Drawer)
```

* **The Rule of 3**: The top-level screen should never show more than 3 active metrics, 3 critical stages, or 3 recent reflections. Everything else is tucked behind clean expansion headers.
* **Hide the Plumbing**: The EventBus traffic, delegation payloads, and raw graph node IDs must never be exposed in standard operational views. They are details for the technical drawer only.

---

## 5. What Creates Trust?

Trust is built through transparency and predictability, measured by the **Model Consistency Score (MCS)**:
* **No Blind Questions**: Brain X never prompts the user with a blank choice. Every decision request must display:
  1. The exact question.
  2. Brain X's recommended option.
  3. The confidence score (CTS).
  4. The rationale explaining *why* it recommends this choice.
* **Evidence Tracing**: When Brain X promotes a learning, it should visually list the exact observations that corroborated it. The user must see that memory is earned by evidence, not guessed.

---

## 6. What Creates Cognitive Overload?

Avoid these "busy" design patterns that degrade the **Cognitive Load Score (CLS)**:
* **Restless Indicators**: Constant spinning loaders for minor background processes.
* **Redundant Interruption**: Prompting the user to confirm minor, non-blocking steps. If a delegation completes successfully, notify quietly; do not block.
* **Jargon Overload**: Displaying architectural terms (e.g., "topological sort", "wait node", "cyclic dependencies") to standard operators. Use product terms ("sequencing", "external block", "recursive loop").

---

## 7. What Makes Brain X Feel Intelligent Rather than Busy?

* **Outcome Focus**: Rather than saying *"I am executing Task 14, now Task 15"*, it says *"Working toward Hero Image copy approval"*. Focus on objectives, not execution steps.
* **Anticipation**: By showing the *Predictability Indicator* ("What happens next?"), Brain X prepares the operator for the next phase of work, removing anxiety.
* **Silent Autonomy**: When confidence is high ($> 90\%$) and no override is required, execution should proceed silently in the background. The user is notified only of milestone completions and judgments.
