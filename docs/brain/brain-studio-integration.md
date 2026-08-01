# Imagine X Studio Integration

[Back to docs index](../README.md)

## Purpose

Define how every studio connects to Axiom Imagine X without duplicating intelligence logic.

## Integration Pattern

Each studio provides:

- Studio ID.
- Supported intent types.
- Supported object types.
- Supported input modes: text, drawing/reference, uploaded asset, future voice transcript.
- Canvas requirements.
- First-impression plan schema.
- Provider capability needs.
- Export formats.
- Studio-specific validation rules.
- Proposal rendering strategy.

## Studio Examples

- Photo Studio uses Imagine X for image plans, layer decomposition, masks, repair, and prompt refinement.
- Vector Studio uses Imagine X for SVG/path concepts, logo ideation, layout structure, and style suggestions.
- Motion Studio uses Imagine X for timeline planning, keyframes, easing, and render plans.
- Brand Studio uses Imagine X for identity rules, palette rationale, tone, and governance.
- Presentation Studio uses Imagine X for deck outlines, slide layouts, narrative flow, and brand application.
- UI/UX Studio uses Imagine X for product flows, screen maps, wireframes, design systems, component specs, accessibility checks, and developer handoff plans.

## Contract Rule

Studios request Imagine X services through shared Imagine X contracts. Studios do not call providers directly unless a future ADR explicitly allows a scoped exception.

## Universal Creation Contract

Every studio follows the same macro flow: intent capture, structured prompt/plan conversion, first-impression approval, individual element generation, assembly, user review, selective regeneration, final approval, persistence, and export.

Studio-specific outputs differ. Image elements may use transparent backgrounds; vector, typography, motion, video, and presentation studios must instead preserve editable domain structures.

## Locked Baseline

Changes require an ADR.
