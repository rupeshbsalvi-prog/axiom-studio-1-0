# Whiteboard Studio

[Back to docs index](../README.md)

## Purpose

Infinite ideation canvas for diagrams, sticky notes, freehand sketches, planning, and collaboration.

## User-Facing Behavior

Users can place notes, draw, connect ideas, organize boards, and export collaborative artifacts.

## Required UI Regions

Infinite canvas, tool rail, object inspector, connector tools, collaboration/status strip.

## Required Data/State

Nodes, connectors, freehand paths, groups, board viewport, presence metadata.

## Generation Requirements

Whiteboard Studio must generate structured thinking artifacts, not decorative boards. A request should capture objective, audience, board type, information hierarchy, node types, relationships, grouping, flow direction, facilitation mode, collaboration needs, and export target.

Supported categories include brainstorming board, mind map, user journey, service blueprint, flowchart, process map, SWOT, strategy canvas, workshop board, Kanban board, roadmap, org chart, decision tree, architecture sketch, wireframe board, retrospective board, and research synthesis board.

Outputs must remain editable as nodes, connectors, groups, annotations, freehand sketches, sticky notes, sections, and frames.

## Events/Actions It Emits

Add note, draw path, connect nodes, organize layout, export board.

## Workflow

1. Capture problem, objective, and board type.
2. Imagine X proposes board structure, sections, node groups, connectors, and facilitation flow.
3. User approves or revises the first-impression board plan.
4. Generate editable nodes, connectors, frames, and annotations.
5. Auto-layout or organize board using the canvas engine.
6. Validate readability, relationship clarity, spacing, and export readiness.
7. Allow per-node, per-section, or full-board regeneration.

## Dependencies

Canvas engine, project AXPKG system, collaboration runtime later, export system.

## Wiring Notes

Freehand and node payloads belong to Whiteboard Studio. Shared selection and movement use Canvas Engine.

## Phase Status

Phase 03 or later.

## Acceptance Criteria

Board objects persist and restore with positions and connections intact.

First-impression plans show board type, sections, node taxonomy, connector logic, layout direction, collaboration needs, and export target before generation.

## Locked Baseline

Changes require an ADR.
