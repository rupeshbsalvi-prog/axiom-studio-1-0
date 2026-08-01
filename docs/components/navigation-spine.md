# Navigation Spine

[Back to docs index](../README.md)

## Purpose

Provide persistent access to workspace areas and studios.

## User-Facing Behavior

Displays compact icon-first navigation for Mission Control, studios, assets, team, automation, settings, and help.

## Required UI Regions

Logo, primary navigation, studio switcher, system shortcuts, user/status area.

## Required Data/State

Active route, active studio, unread notifications, user identity, workspace state.

## Events/Actions It Emits

Navigate, switch studio, open settings, open account, open help.

## Dependencies

Auth user system, app shell, studio registry.

## Wiring Notes

Use stable studio IDs. Never hardcode studio-specific rendering inside the spine.

## Phase Status

Phase 01 target.

## Acceptance Criteria

Navigation remains usable on desktop and narrow screens.

## Locked Baseline

Changes require an ADR.
