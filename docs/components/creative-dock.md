# Creative Dock

[Back to docs index](../README.md)

## Purpose

Expose quick creative tools, timeline/status panels, and mode-specific controls.

## User-Facing Behavior

Users access common tools, timeline controls, history, assets, and quick actions without leaving the active studio.

## Required UI Regions

Tool shortcuts, history controls, timeline strip, asset shortcuts, status metrics.

## Required Data/State

Active studio, selected tool, undo/redo availability, timeline state, project health.

## Events/Actions It Emits

Select tool, undo, redo, open timeline, open assets, change preview mode.

## Dependencies

Canvas engine, studio registry, project system, replay engine.

## Wiring Notes

Dock slots should be configurable by studio while preserving shared controls.

## Phase Status

Phase 01 target.

## Acceptance Criteria

Shared controls remain consistent across studios.

## Locked Baseline

Changes require an ADR.
