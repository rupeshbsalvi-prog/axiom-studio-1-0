# ADR-0008 - Luxury Editorial Public Entry

[Back to docs index](../README.md)

## Date

2026-08-23

## Status

Accepted

## Context

The approved `Axiom-Studio-V3-Luxury.html` prototype establishes a stronger material and editorial identity than the current public entry, but it is an eight-megabyte standalone monograph with no navigation, calls to action, or product routing. Copying it wholesale would break the existing WEOS, authentication entry, responsive media, and Workspace/Studio shell.

## Decision

Adopt the prototype's warm-paper, charcoal, brass, oversized editorial type, folio metadata, and measured spacing as the public visual direction. Extract those patterns into the existing React landing experience while preserving the three-state cinematic hero, Experience Director, explicit entry actions, persistent navigation, reduced-motion behavior, and responsive AVIF/WebP assets.

The first implementation slice is limited to the persistent navigation and hero. Long studio essays, unsupported product claims, embedded prototype assets, and internal prompt language are excluded.

## Consequences

- Axiom gains a distinctive editorial identity without replacing working product infrastructure.
- The hero becomes a complete conversion surface on its own.
- Existing public sections remain functional and may be migrated incrementally.
- Axiom Sans source masters remain evaluation assets until an approved webfont binary exists; the runtime uses native font fallbacks in this slice.

## Affected Locked Documents

- `docs/product/landing-experience-prd.md`
- `docs/product/application-entry-flow.md`
- `docs/phases/phase-01b-landing-experience-foundation.md`
- `docs/memory/decision-log.md`

## Follow-Up

- Implement and visually accept the hero/navigation slice.
- Condense Brain X, Imagine X, and Studio Atlas copy in later approved slices.
- Produce an approved Axiom Sans webfont before replacing native fallbacks.
- Add automated Lighthouse budgets after the visual migration stabilizes.
