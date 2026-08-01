# ADR-0003 - Web Experience Operating System

[Back to docs index](../README.md)

## Date

2026-06-28

## Status

Accepted

## Context

The public Axiom Studio entry experience has moved beyond a conventional marketing site. New product feedback defines the landing surface as a Web Experience Operating System, or WEOS: a cinematic, interactive product simulator where visitors feel they are already inside Axiom before signing in.

The current codebase has a frozen Platform Runtime v5, an early persistent Three.js landing engine, Brain X product work, creative shaders, and existing experience documentation. This makes WEOS feasible, but it must not mutate `src/platform/` or reopen Platform Runtime v5.

## Decision

Axiom Studio 1.0 will treat the public entry as **WEOS: Version 0 of the product experience**, not as a website.

WEOS is product-scoped and lives above Platform Runtime v5. It may use platform services through stable contracts, but it must not introduce new platform services, lifecycle methods, or runtime contract changes.

The WEOS journey is organized as:

1. Arrival
2. Awakening
3. Living Observatory
4. Axiom Brain
5. Creative Journey
6. Studio Exploration
7. Create Live
8. Community
9. Developer Universe
10. Enterprise
11. Future
12. Workspace Portal

WEOS introduces an **Experience Director** responsible for coordinating:

- Camera choreography
- Lighting transitions
- Particle behavior
- Chapter state
- Theme state
- Audio cues
- Brain activity
- Studio preview state
- Performance quality
- Accessibility modes
- Workspace portal transition

## Consequences

Benefits:

- The public surface becomes a product demonstration, not marketing collateral.
- Axiom gains a clear signature reveal and cinematic system language.
- The Experience Director creates one coherent orchestration layer instead of isolated animations.
- Platform Runtime v5 remains frozen and protected.

Tradeoffs:

- WEOS requires stronger performance governance, quality tiers, and reduced-motion support.
- Three.js and future shader/audio dependencies must be lazy-loaded or budgeted carefully.
- Studio demos must be built as real mini-experiences over time, not static screenshots.

## Affected Locked Documents

- `docs/product/landing-experience-prd.md`
- `docs/product/application-entry-flow.md`
- `docs/experience/experience-bible.md`
- `docs/phases/phase-01b-landing-experience-foundation.md`
- `docs/memory/decision-log.md`
- `docs/memory/implementation-log.md`

## Follow-Up

- Add WEOS blueprint documentation.
- Add Experience Director architecture documentation.
- Implement the first product-scoped Experience Director module outside `src/platform/`.
- Integrate WEOS journey and director cues into the public landing UI.
- Keep all runtime-platform changes out of scope unless a future Platform Runtime v6 proposal satisfies the v6 evidence threshold.
