# Imagine X Evaluation Suite

[Back to docs index](../README.md)

## Purpose

Define how Axiom Imagine X quality is measured before and after implementation.

## Eval Categories

- Intent preservation.
- Exact text preservation.
- Object count accuracy.
- First-impression plan quality.
- User approval/rejection handling.
- Selective element regeneration.
- Brand rule compliance.
- Layout validity.
- Provider failure handling.
- Editability preservation.
- Repair success.
- Routing quality.
- Memory recommendation explainability.

## Required Test Scenarios

- Birthday poster with exact person name and message.
- Award poster with exact recipient and organization.
- Brand campaign with strict colors and fonts.
- Presentation deck from a business brief.
- Vector logo request with editable shapes.
- Motion scene with keyframe timing.
- Presentation request with audience, outline, slide layout, charts, speaker notes, and export settings.
- Typography request with hierarchy, font pairing, spacing, accessibility, and brand consistency.
- Video request with scene timeline, camera language, motion, audio, continuity, and transitions.
- Provider failure with visible fallback.
- Rejected Imagine X proposal that does not mutate project state.
- Full campaign request decomposed into brand, graphic, motion, presentation, and asset deliverables.
- Partial provider failure where successful subtasks remain usable and failed subtasks are repaired or rerouted.

## Acceptance Gate

Imagine X features are not complete unless evals prove the system preserves requirements, handles failure, records provenance, and meets the senior-director output standard.

Large-project features are not complete unless evals prove decomposition, dependency tracking, recomposition, and partial-failure recovery.

## Locked Baseline

Changes require an ADR.
