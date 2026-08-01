---
Document ID: BX-SPEC-001
Version: 1.0
Release: AF-1.0
Status: Frozen
Owner: Cognition
Depends On: ADR-001
Validated By: MVR
Last Structural Change: 2026-06-21
---

# MissionTypes Contract

This contract defines the structured cognitive representations of user intent, tasks, graph structures, and evidence promotions.

## Core Schema
- **Program**: A collection of linked Missions.
- **Mission**: Verbatim intent, status lifecycle, objectives, reasoning graph, delegations, decisions, observations, reflections, and judgments.
- **ReasoningGraph**: A set of `ReasoningNode`s and `ReasoningEdge`s representing task sequences and dependencies.
- **CognitiveEntry**: A piece of knowledge built from evidence (Observation ──> Learning ──> Knowledge ──> Memory).
