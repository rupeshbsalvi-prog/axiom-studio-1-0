# Architecture Overview

[Back to docs index](../README.md)

## Purpose

Define the single architecture for Axiom Studio 1.0.

## Product Layers

1. Landing Experience: public cinematic platform entry, philosophy, studio explorer, pricing, marketplace, and community.
2. Workspace Hub: authenticated project home, templates, recommendations, account status, billing, and usage.
3. Studio Workspace: navigation, studios, command palette, inspector, dock, and creation surfaces.
4. Axiom OS Core: auth, permissions, storage, sync, billing, marketplace, plugin runtime, MCP, and platform services.
5. Axiom Brain X: reasoning, memory, knowledge graph, orchestration, and agent coordination.
6. Axiom Imagine X: user-facing creative direction, planning, provider routing, connector orchestration, critique, repair, and learning.
7. Universal Canvas Engine: geometry, selection, interaction, viewport, timeline, frames, and history.
8. AXPKG project system: manifest, project state, autosave, recovery, import/export.
9. Semantic runtime: authoritative commands, replay log, certified state.
10. Providers: external models, local models, MCP tools, export services, render services.
11. Enterprise operating model: capability ownership, lifecycle gates, platform modules, governance, support.

## Architecture Rule

Studios own meaning. Canvas owns geometry. AXPKG owns durability. Runtime owns truth. Axiom Imagine X owns intelligence proposals.

Enterprise capabilities own scale. Every major responsibility should become a module, ownership area, lifecycle gate, or system role.

OS Core owns platform services. Brain X owns reasoning infrastructure. Imagine X owns the user-facing creative intelligence experience. The public product opens through Landing Experience unless the user is authenticated or following a validated direct resource link.

## Phase Status

Locked baseline. Implementation not started.

## Baseline Update

Updated by [ADR-0002](../adr/ADR-0002-experience-first-platform-entry.md) to separate Axiom OS Core, Axiom Brain X, Axiom Imagine X, Universal Canvas Engine, and the three entry experiences.
