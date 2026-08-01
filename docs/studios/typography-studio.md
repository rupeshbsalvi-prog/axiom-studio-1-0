# Typography Studio

[Back to docs index](../README.md)

## Purpose

Professional typography exploration, text systems, font pairing, style tokens, and publishing foundations.

## User-Facing Behavior

Users can test type, tune spacing, create specimens, generate pairings, and export style tokens.

## Required UI Regions

Type playground, font list, typography inspector, specimen library, pairing suggestions, token export.

## Required Data/State

Fonts, text samples, styles, spacing, saved specimens, pairing rationale, project brand context.

## Generation Requirements

Typography must be treated as a structured design system, not font selection. It must define purpose, audience, content, language, typeface, hierarchy, layout, spacing, alignment, color, effects, accessibility, responsive rules, optional motion, and export format.

Supported categories include editorial, corporate, marketing, branding, UI typography, presentation, infographic, social media, poster, packaging, motion typography, kinetic typography, educational, technical, luxury, minimal, display, handwritten, calligraphy, and monospaced.

Typography generation must support font pairing, hierarchy scales, line height, letter spacing, word spacing, paragraph spacing, color systems, text effects, responsive typography, accessibility checks, and design token export.

## Events/Actions It Emits

Change font, adjust type setting, save specimen, generate pairing, export tokens.

## Dependencies

Project AXPKG system, Brand Studio, Axiom Imagine X, export system.

## Wiring Notes

Text placement on artboards uses Canvas Engine. Font/style systems belong to Typography Studio payload.

## Phase Status

Phase 03 target.

## Acceptance Criteria

Saved typography tokens can be reused by Brand and Presentation studios.

Generated typography must pass readability, hierarchy, contrast, spacing, no-overflow, spelling, grammar, and brand consistency checks.

## Locked Baseline

Changes require an ADR.
