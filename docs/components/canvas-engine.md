# Canvas Engine

[Back to docs index](../README.md)

## Purpose

Provide shared geometry, viewport, selection, hit-testing, interaction, history, and keyboard behavior.

## User-Facing Behavior

Users can pan, zoom, select, drag, resize, align, duplicate, delete, undo, redo, and inspect canvas elements consistently across studios.

## Required UI Regions

Canvas surface, artboard, grid, selection handles, overlays, contextual tools.

## Required Data/State

Elements, viewport, selection, interaction mode, artboard, grid, clipboard, history.

## Events/Actions It Emits

Select, update geometry, move, resize, align, distribute, copy, paste, delete, undo, redo.

## Dependencies

Semantic types, project AXPKG system, active studio renderer.

## Wiring Notes

Canvas owns geometry only. Studio renderers own meaning and domain payloads.

## Phase Status

Phase 01 foundation, deeper command integration in Phase 02.

## Acceptance Criteria

Multiple studios can use the same canvas API without duplicating interaction logic.

## Locked Baseline

Changes require an ADR.
