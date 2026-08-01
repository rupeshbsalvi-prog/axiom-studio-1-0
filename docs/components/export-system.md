# Export System

[Back to docs index](../README.md)

## Purpose

Manage exports for images, documents, video, motion, projects, and audit bundles.

## User-Facing Behavior

Users choose export presets, formats, quality, destination, and receive progress or failure status.

## Required UI Regions

Export panel, preset selector, format settings, progress, result paths, error messages.

## Required Data/State

Project, scene, selected objects, export preset, provider/runtime route, artifact records.

## Events/Actions It Emits

Start export, cancel export, retry export, reveal artifact, save audit report.

## Dependencies

Project system, runtime/replay, provider connector hub, desktop/Tauri commands where available.

## Wiring Notes

Exports are projections unless tied to replay-certified command state and recorded as artifacts.

## Phase Status

Phase 02 target.

## Acceptance Criteria

Export failures are visible and do not corrupt project state.

## Locked Baseline

Changes require an ADR.
