# Vector Studio

[Back to docs index](../README.md)

## Purpose

Precision vector illustration, shape editing, typography placement, and SVG-style composition.

## User-Facing Behavior

Users can create shapes, edit paths, style fills/strokes, manage layers, align objects, and export vector artwork.

## Required UI Regions

Canvas, tools rail, layers panel, path/property inspector, style controls, export controls.

## Required Data/State

Vector nodes, paths, fills, strokes, groups, symbols, artboards, canvas geometry.

## Generation Requirements

Vector Studio is a parametric graphics engine, not "AI that draws SVGs." It must produce editable vector objects: artboards, layers, paths, shapes, symbols, text, fills, strokes, effects, constraints, and export settings.

Supported categories include logo design, icons, illustration, infographic, diagram, UI components, wireframes, social graphics, posters, stickers, badges, maps, technical drawings, floor plans, packaging, isometric design, character design, vector tracing, pattern design, and typography vectors.

Generation modes must include text-to-vector, sketch-to-vector, image-to-vector, logo recreation, icon generation, illustration generation, pattern generation, diagram generation, and infographic building.

## Events/Actions It Emits

Create shape, edit path, update style, align, group, ungroup, export SVG/PDF.

## Dependencies

Canvas engine, semantic types, project AXPKG system, export system.

## Wiring Notes

Path data belongs to Vector Studio payload; bounds and selection belong to Canvas Engine.

## Phase Status

Phase 03 target after shell and runtime integration.

## Acceptance Criteria

Vector edits are replayable semantic commands or staged drafts before acceptance.

Generated vector outputs remain editable as layered SVG/shape/path structures, not flattened images.

## Locked Baseline

Changes require an ADR.
