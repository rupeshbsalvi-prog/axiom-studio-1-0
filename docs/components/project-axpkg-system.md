# Project AXPKG System

[Back to docs index](../README.md)

## Purpose

Manage project lifecycle, persistence, autosave, recovery, import, and export of Axiom projects.

## User-Facing Behavior

Users can create, open, save, recover, rename, duplicate, import, and export projects.

## Required UI Regions

Project menu, recovery prompts, save status, version history entry points.

## Required Data/State

Manifest, canvas slices, studio payloads, Brain slice, assets, replay references, dirty state.

## Events/Actions It Emits

Create project, save project, recover autosave, write canvas slice, write studio payload, write Brain memory.

## Dependencies

App shell, studios, canvas engine, export system, replay engine.

## Wiring Notes

Start with a portable interface; browser storage and Tauri filesystem are backend implementations.

## Phase Status

Phase 01 foundation.

## Acceptance Criteria

Project data can round-trip without studio-specific data loss.

## Locked Baseline

Changes require an ADR.
