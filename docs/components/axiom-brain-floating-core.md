# Axiom Imagine X Floating Core

[Back to docs index](../README.md)

## Purpose

Provide the persistent in-workspace access point to Axiom Imagine X.

## User-Facing Behavior

Users can ask, plan, refine, critique, repair, and learn without leaving the creative workspace. This component is the compact Imagine X surface; the full subsystem is defined in [Axiom Imagine X System Component](axiom-brain-system.md) and `docs/brain/`.

## Required UI Regions

Imagine X entry button, prompt composer, agent/status view, suggestion cards, memory signals.

## Required Data/State

Active prompt, Imagine X director plan, provider route, suggestion status, memory context, critique result.

## Events/Actions It Emits

Submit prompt, request plan, accept suggestion, reject suggestion, retry provider, rate outcome.

## Dependencies

Axiom Imagine X backend, provider connector hub, inspector rail, command palette.

## Wiring Notes

Imagine X output must remain advisory until accepted into a semantic command. The floating core should call Imagine X services through contracts, not embed planning, routing, memory, or provider logic locally.

## Phase Status

Phase 02 target.

## Acceptance Criteria

Imagine X provenance and accept/reject state are visible.

## Locked Baseline

Changes require an ADR.
