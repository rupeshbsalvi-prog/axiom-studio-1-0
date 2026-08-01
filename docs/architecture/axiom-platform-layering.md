# Axiom Platform Layering

[Back to docs index](../README.md)

## Purpose

Define the layered architecture that separates platform infrastructure, reasoning, creative intelligence, canvas runtime, and studios.

## Target Architecture

```text
Axiom Platform
    |
    +-- Axiom OS Core
    |       |
    |       +-- Auth, permissions, billing, storage, sync, plugins, MCP, marketplace
    |
    +-- Axiom Brain X
    |       |
    |       +-- Reasoning, memory, knowledge graph, orchestration, agent coordination
    |
    +-- Axiom Imagine X
    |       |
    |       +-- User-facing creative planning, model routing, connector orchestration
    |
    +-- Universal Canvas Engine
            |
            +-- Shared creation runtime for studios
```

## Layer Responsibilities

## Axiom OS Core

Owns platform services:

- Identity and authentication.
- Workspace and organization management.
- Permissions and RBAC.
- Billing and licensing.
- Storage and sync.
- Plugin runtime.
- MCP client support.
- Marketplace.
- Notifications.
- Audit logs.
- API gateway.
- Developer SDK.

## Axiom Brain X

Owns intelligence infrastructure:

- Reasoning.
- Memory.
- Knowledge graph.
- Context engine.
- Agent coordination.
- Task decomposition.
- Long-running orchestration.
- Evaluation loops.
- Governance signals.

Brain X is mostly internal. It powers intelligence but should not compete with Imagine X as the user-facing brand.

## Axiom Imagine X

Owns user-facing creative intelligence:

- Intent understanding.
- Prompt refinement.
- First-impression planning.
- Studio selection.
- Model/provider routing.
- Connector orchestration.
- Auto Learner Mode.
- User-facing explanations.
- Critique and repair.
- Output assembly guidance.

## Universal Canvas Engine

Owns shared creation mechanics:

- Scene graph.
- Layers.
- Timeline.
- Frames.
- Selection.
- Geometry.
- Viewport.
- Editing history.
- Rendering bridge.
- Export preparation.

## Studios

Studios own domain meaning:

- Photo.
- Vector.
- Motion.
- Video.
- Typography.
- Brand.
- Whiteboard.
- Presentation.
- Asset Hub.
- UI/UX.
- Axiom AI.
- Mission Control and Workspace Hub.

## Authority Rule

- OS Core owns platform access and durability services.
- Brain X owns reasoning infrastructure.
- Imagine X owns creative proposals and user-facing intelligence.
- Runtime owns authoritative state changes.
- Canvas owns interactive geometry and rendering surface.
- Studios own domain semantics.
- AXPKG owns portable project durability.

## Baseline Update

This document implements [ADR-0002](../adr/ADR-0002-experience-first-platform-entry.md).

## Locked Baseline

Changes require an ADR.
