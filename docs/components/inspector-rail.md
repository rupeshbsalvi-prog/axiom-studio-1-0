# Inspector Rail

[Back to docs index](../README.md)

## Purpose

Display contextual properties, actions, and diagnostics for the active selection.

## User-Facing Behavior

Users inspect and edit selected objects, studio settings, Brain suggestions, provider status, and replay metadata.

## Required UI Regions

Selection summary, property sections, style controls, Brain suggestion review, replay/provenance block.

## Required Data/State

Selection, active studio payload, editable properties, validation status, provenance data.

## Events/Actions It Emits

Update property, accept suggestion, reject suggestion, inspect provenance, open detailed audit.

## Dependencies

Canvas engine, semantic types, Axiom Brain, replay audit panel.

## Wiring Notes

Inspector edits must emit semantic commands or studio-local draft changes that later become commands.

## Phase Status

Phase 01 target, deep behavior in later phases.

## Acceptance Criteria

Inspector never mutates authoritative state directly.

## Locked Baseline

Changes require an ADR.
