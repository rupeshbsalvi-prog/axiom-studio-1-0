# ADR-0002 - Experience First Platform Entry

[Back to docs index](../README.md)

## Date

2026-06-20

## Status

Accepted

## Context

The original Phase 01 shell treated Axiom Studio 1.0 as studio-first: the application opened directly into Mission Control and the creation workspace. New product recommendations clarify that Axiom should be positioned as an AI-native creative operating system, not only a set of studio tools.

The public first experience must teach the platform philosophy before users enter workspace or studio surfaces.

## Decision

Axiom Studio 1.0 adopts an experience-first entry model.

The platform has three distinct entry experiences:

1. Landing Experience: public cinematic product entry, platform story, Imagine X, Brain X, studio explorer, gallery, pricing, marketplace, and community.
2. Workspace Hub: authenticated user home for projects, templates, recommendations, account state, usage, and project recovery.
3. Studio Workspace: the professional editing environment for each creation mode.

The Phase 01 product shell remains valid, but it is reclassified as the first Workspace Hub and Studio Workspace foundation, not the final public application entry.

The updated platform architecture separates:

- Axiom OS Core: platform services.
- Axiom Brain X: reasoning, memory, knowledge graph, orchestration, and agent coordination.
- Axiom Imagine X: user-facing creative intelligence, planning, model routing, connector orchestration, and Auto Learner Mode.
- Universal Canvas Engine: shared creation runtime.

## Consequences

Benefits:

- Public users understand the vision before entering complex studio tools.
- Product, monetization, marketplace, and cross-platform strategy become first-class requirements.
- Axiom Imagine X can remain user-facing while Brain X and OS Core scale independently.
- Authenticated users can still enter work quickly through Workspace Hub.

Tradeoffs:

- The first production release now requires routing between public, authenticated, and studio surfaces.
- Landing experience performance, accessibility, 3D fallbacks, and reduced-motion behavior become critical.
- The existing Phase 01 shell must be reframed and later placed behind the correct entry flow.

## Affected Locked Documents

- `docs/product/master-requirements.md`
- `docs/product/product-roadmap.md`
- `docs/product/user-workflows.md`
- `docs/architecture/overview.md`
- `docs/architecture/authority-runtime-model.md`
- `docs/brain/brain-master-blueprint.md`
- `docs/brain/brain-component-architecture.md`
- `docs/phases/phase-01-product-shell.md`

## Follow-Up

- Add product PRDs for Landing Experience, application entry flow, subscription and licensing, and monetization.
- Add architecture docs for Axiom Platform layering and cross-platform strategy.
- Add Imagine X evolution, Auto Learner Mode, and connector/MCP framework docs.
- Update the documentation index and memory logs.
