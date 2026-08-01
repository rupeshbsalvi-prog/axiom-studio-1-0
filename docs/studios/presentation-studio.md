# Presentation Studio

[Back to docs index](../README.md)

## Purpose

AI-assisted slide creation, editing, brand application, and presentation export.

## User-Facing Behavior

Users can generate decks, edit slides, apply brand themes, present, and export PDF or slide assets.

## Required UI Regions

Slide list, slide canvas, layout inspector, presenter preview, speaker notes, export panel.

## Required Data/State

Deck, slides, layouts, text blocks, media, brand theme, notes, export settings.

## Generation Requirements

Presentation generation must first determine communication goal, audience, narrative, structure, visuals, and speaker flow. It must model presentations as structured documents with sections, slides, layouts, content blocks, charts, diagrams, tables, speaker notes, references, branding, animations, and export settings.

Supported categories include business proposal, sales pitch, company profile, training, workshop, executive summary, project proposal, project status, technical documentation, product launch, marketing strategy, financial report, annual report, investor deck, research presentation, case study, educational lesson, conference talk, portfolio, and roadmap.

Presentation requests must capture purpose, audience, key message, style, theme, branding, outline, slide layouts, visual assets, charts, diagrams, animations, speaker notes, references, accessibility, output format, writing tone, reading level, and content depth.

## Events/Actions It Emits

Create slide, duplicate slide, update layout, generate deck, apply brand, export presentation.

## Dependencies

Canvas engine, Typography Studio, Brand Studio, Axiom Imagine X, export system.

## Wiring Notes

Each slide can be modeled as a canvas slice plus presentation-specific metadata.

## Phase Status

Phase 03 target.

## Acceptance Criteria

Generated slides remain editable as objects, not flattened images.

First-impression plans show deck objective, audience, outline, slide count, slide types, theme, brand application, visual strategy, speaker notes plan, export target, and quality risks before generation.

## Locked Baseline

Changes require an ADR.
