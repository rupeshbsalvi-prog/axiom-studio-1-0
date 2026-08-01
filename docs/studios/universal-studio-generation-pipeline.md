# Universal Studio Generation Pipeline

[Back to docs index](../README.md)

## Purpose

Define the shared creation flow used by every Axiom Studio 1.0 studio through Axiom Imagine X.

## Core Flow

1. Capture user intent through text, drawing, uploaded reference, and future voice input.
2. Normalize the input into structured requirements.
3. Convert intent into the best possible studio-specific prompt, drawing interpretation, or voice transcript.
4. Produce a first-impression plan for user review.
5. Show aspect ratio, canvas size, theme, aesthetic, output type, objects/layers, provider route, risks, and editable structure before final generation.
6. If user rejects the plan, refine or regenerate the prompt/plan.
7. If user approves, generate individual required elements through the correct studio engine.
8. Assemble generated elements into the shared canvas, timeline, slide document, vector artboard, or video scene graph.
9. Present the output for user review.
10. If approved, persist and prepare export.
11. If rejected, allow regeneration of a selected element, selected scene/slide/timeline section, or the entire canvas/project.

## Important Correction

"Transparent background" is required for raster image elements and overlays where compositing is expected. Other studios require equivalent editable outputs:

- Vector Studio: editable SVG paths, symbols, shapes, strokes, fills.
- Typography Studio: editable text styles, hierarchy, spacing, responsive rules.
- Motion Studio: editable layers, keyframes, easing, effects, audio markers.
- Video Studio: editable scenes, clips, timeline, captions, audio, transitions.
- Presentation Studio: editable slides, layouts, content blocks, charts, speaker notes.
- UI/UX Studio: editable frames, components, tokens, user flows, prototype links.

## First-Impression Plan Must Include

- User goal and interpreted intent.
- Target studio or multi-studio route.
- Output category.
- Aspect ratio and canvas/artboard/timeline/slide size.
- Aesthetic, theme, color palette, typography, mood.
- Object/layer/scene/slide breakdown.
- Provider/model route and fallback.
- Required references or missing information.
- Quality and risk checklist.
- Estimated generation steps.

## Rejection and Regeneration Rules

- Plan rejection regenerates or edits the plan before production.
- Element rejection regenerates only the selected element when feasible.
- Section rejection regenerates a scene, slide, timeline segment, or object group.
- Full rejection regenerates the complete proposal while preserving user-approved constraints.
- Every regeneration must keep provenance and not silently overwrite accepted work.

## Locked Baseline

Changes require an ADR.
