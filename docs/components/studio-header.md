# Studio Header

[Back to docs index](../README.md)

## Purpose

Show current studio context, project controls, provider access, and global actions.

## User-Facing Behavior

Users see project name, active studio, save/sync status, provider selector, export, share, and command actions.

## Required UI Regions

Project selector, studio title, provider connector pill, save status, export/share actions, profile/status controls.

## Required Data/State

Project metadata, active studio metadata, selected provider, dirty state, sync state, auth state.

## Events/Actions It Emits

Rename project, change provider, open connector hub, save, export, share, open command palette.

## Dependencies

Project AXPKG system, provider connector hub, export system, auth user system.

## Wiring Notes

Header actions call shared services, not studio-local implementations.

## Phase Status

Phase 01 target.

## Acceptance Criteria

Every studio gets the same project/provider/export affordances.

## Locked Baseline

Changes require an ADR.
