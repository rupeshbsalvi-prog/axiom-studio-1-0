---
Document ID: BX-SPEC-002
Version: 1.0
Release: AF-1.0
Status: Frozen
Owner: Explainability
Depends On: ADR-002
Validated By: EVR
Last Structural Change: 2026-06-21
---

# ExplanationContractV1 Contract

This contract exposes derived explanation data to the UI, separating raw cognitive state from visual presentation.

## Core Interface
- `missionId` & `title`
- `status` & `intent`
- `timeline`: stage statuses and durations.
- `reasoningGraph`: nodes, edges, and critical path.
- `delegations`: progress and target Studio.
- `activeDecision`: question, recommended option, confidence, and rationale.
- `predictability`: predicted next action, confidence, and rationale.
