# Mission Control / Workspace Home

[Back to docs index](../README.md)

## Purpose

Serve as the first working screen for projects, recent work, intent entry, provider status, and system health.

## User-Facing Behavior

Users can create or open projects, start from intent, resume recent work, recover autosaves, and inspect workspace readiness.

## Required UI Regions

Recent projects, new project prompt, templates, recovery sessions, provider readiness, Brain status, activity feed.

## Required Data/State

Projects, workspace, user, provider statuses, recovery sessions, recent prompts, phase status.

## Events/Actions It Emits

Create project, open project, restore session, submit initial intent, open studio, connect provider.

## Dependencies

App shell, project AXPKG system, auth user system, provider connector hub, Axiom Brain.

## Wiring Notes

Mission Control should route into the appropriate studio based on intent and selected template.

## Phase Status

Phase 01 target.

## Acceptance Criteria

A user can start a project without needing to understand internal architecture.

## Locked Baseline

Changes require an ADR.
