# Brand Studio

[Back to docs index](../README.md)

## Purpose

Manage living brand systems, palettes, logos, typography rules, identity memory, and governance.

> **Baseline Update (ADR-0004, 2026-08-01):** The repository includes a [draft Brand System candidate](../../creative/brand-system/README.md), with [governance configuration](../../creative/brand-system/config/) and [operations templates](../../creative/brand-system/templates/). Brand Studio may reference these materials, but must not silently activate their tokens, provider, or components; promotion remains an explicit governed action.

## User-Facing Behavior

Users can create brand kits, define palettes, manage logos, set typography rules, and apply brand context across studios.

## Required UI Regions

Brand kit list, palette editor, logo panel, typography rules, governance checklist, token export.

## Required Data/State

Brand identity, colors, fonts, tone, rules, logo assets, usage history, memory links.

## Generation Requirements

Brand Studio must generate living brand systems, not isolated logos or palettes. A request should capture industry, audience, positioning, values, personality, competitors, usage channels, logo needs, color psychology, typography style, voice/tone, accessibility requirements, and governance constraints.

Supported categories include identity system, logo system, color palette, typography rules, icon style, campaign system, social kit, presentation theme, packaging direction, brand guidelines, design tokens, accessibility palette, and enterprise brand governance.

Outputs must be reusable across all studios as brand tokens, brand rules, prompt constraints, asset references, and validation checks.

## Events/Actions It Emits

Create brand kit, update palette, add rule, export tokens, apply brand to project.

## Workflow

1. Capture brand intent and business context.
2. Produce first-impression brand strategy with positioning, personality, palette, typography, logo direction, and usage examples.
3. User approves or rejects the direction.
4. Generate brand kit components individually: palette, typography, logos, icon rules, tone, layout rules, assets.
5. Validate accessibility, consistency, contrast, logo clearance, and cross-studio usability.
6. Publish brand context to Project AXPKG and Imagine X memory.
7. Apply brand constraints to generated outputs in other studios.

## Dependencies

Project AXPKG system, Axiom Brain memory, provider connector hub, export system.

## Wiring Notes

Brand context influences Brain prompts and studio defaults but should not overwrite user object edits silently.

## Phase Status

Phase 02 or Phase 03 depending on MVP needs.

## Acceptance Criteria

Brand rules can be applied and audited across generated outputs.

First-impression plans show brand positioning, audience, palette rationale, typography rationale, logo direction, tone, usage channels, accessibility risks, and cross-studio application before generation.

## Locked Baseline

Changes require an ADR.
