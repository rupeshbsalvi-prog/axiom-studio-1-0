# Replay Audit Panel

[Back to docs index](../README.md)

## Purpose

Show event history, replay certification, provenance, governance state, and export audit data.

## User-Facing Behavior

Users and teams can inspect what changed, who or what proposed it, who approved it, and whether replay is certified.

## Required UI Regions

Event list, certification status, provenance details, governance warnings, export artifacts.

## Required Data/State

Event log, state hash, replay result, command provenance, provider provenance, export records.

## Events/Actions It Emits

Run replay check, inspect event, export audit report, jump to affected object.

## Dependencies

Deterministic runtime, replay engine, project system, export system.

## Wiring Notes

Panel reads certified state and logs. It must not edit project state.

## Phase Status

Phase 02 target.

## Acceptance Criteria

Users can distinguish certified, warning, failed, and unavailable replay states.

## Locked Baseline

Changes require an ADR.
