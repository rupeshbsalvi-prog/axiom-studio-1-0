# App Shell

[Back to docs index](../README.md)

## Purpose

Own the full-screen working environment for Axiom Studio 1.0.

## User-Facing Behavior

Shows navigation, active studio, project status, inspector, dock, command palette, and Brain access in one coherent workspace.

## Required UI Regions

Navigation Spine, Studio Header, central studio surface, Inspector Rail, Creative Dock, Brain Floating Core, Command Palette.

## Required Data/State

Active workspace, project, studio, user, theme, provider status, dirty state, replay status, command palette state.

## Events/Actions It Emits

Open studio, open project, toggle inspector, open command palette, open Brain, request save, request export.

## Dependencies

UI package, project system, auth user system, provider connector hub, replay audit status.

## Wiring Notes

The shell should not contain studio-specific business logic. It routes context into the active studio.

[ADR-0006](../adr/ADR-0006-auth-ui-a2-explicit-session-workspace-entry.md) places Auth UI A2 above the shell. Public and explicit local entry remain available; authenticated governed entry requires deliberate membership selection before the shell receives a workspace ID and verified policy state. The shell may disclose identity, role, switching, and logout controls, but it cannot infer or persist workspace selection.

## Phase Status

Phase 01 shell and Auth UI A2 session/workspace controls are implemented and live-verified.

## Acceptance Criteria

All planned studios can appear as selectable modes even before deep implementation.

## Locked Baseline

Changes require an ADR.
