# Studio Registry

[Back to docs index](../README.md)

## Purpose

Define the canonical studio IDs, names, order, and first implementation depth.

## Registry

| ID | Name | Phase | Initial Depth |
|---|---|---:|---|
| mission-control | Mission Control / Workspace Home | 01 | working home |
| photo | Photo Studio | 03 | first vertical MVP |
| vector | Vector Studio | 03 | canvas + shapes |
| brand | Brand Studio | 02/03 | brand kit foundation |
| asset-hub | Asset Hub | 02/03 | asset grid foundation |
| ui-ux | UI/UX Studio | 03 | product design foundation |
| typography | Typography Studio | 03 | type playground |
| presentation | Presentation Studio | 03 | slide editor foundation |
| motion | Motion Studio | 03 | timeline scaffold |
| video | Video Studio | 03+ | timeline scaffold |
| whiteboard | Whiteboard Studio | 03+ | infinite board foundation |
| axiom-ai | Axiom AI Studio | 02/03 | Imagine X dashboard |

## Studio Contract

Each studio must provide:

- ID.
- Display name.
- Icon.
- Default route.
- Required shared components.
- Canvas use mode.
- AXPKG slice name.
- Supported providers.
- Export formats.
- Phase status.

## UI/UX Studio Feasibility

UI/UX Studio is feasible and strategically useful. It should own product design workflows: wireframes, screens, design systems, responsive layouts, user flows, prototypes, component specs, and handoff artifacts. It must reuse Vector Studio for icons/illustrations, Typography Studio for type systems, Brand Studio for identity, Presentation Studio for product storytelling, and Imagine X for product/design reasoning.

## Locked Baseline

Changes require an ADR.
