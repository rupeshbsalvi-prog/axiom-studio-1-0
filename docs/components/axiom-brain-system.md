# Axiom Imagine X System Component

[Back to docs index](../README.md)

## Purpose

Treat Axiom Imagine X as the peak-development intelligence model/subsystem that powers intent understanding, senior creative direction, planning, provider routing, critique, repair, memory, learning, and studio orchestration.

## User-Facing Behavior

Users can describe creative intent and receive a senior-director-level production plan: graphic direction, motion direction, layout structure, typography, brand logic, provider/model routes, editable output proposals, repair options, and learning feedback.

## Required UI Regions

Imagine X Floating Core, Axiom AI Studio, director plan inspector, agent trace viewer, memory dashboard, provider route viewer, critique/repair panel, outcome rating panel.

## Required Data/State

Intent, refined prompt, director plan, agent trace, provider route, proposal status, scene/object candidates, motion instructions, critique results, repair attempts, memory graph, outcome ratings, model performance.

## Events/Actions It Emits

Parse intent, refine prompt, create director plan, route provider, generate candidate, critique candidate, repair candidate, propose command, accept proposal, reject proposal, log outcome, retrain memory.

## Dependencies

Provider Connector Hub, Project AXPKG System, semantic types, Replay Audit Panel, Auth User System, studio registry, backend API, future runtime command layer.

## Wiring Notes

Axiom Imagine X is advisory. It proposes plans and commands but cannot directly mutate authoritative project state. Each studio integrates through the Imagine X Studio Integration contract.

## Phase Status

Phase 02 foundation, Phase 03+ peak development.

## Acceptance Criteria

Imagine X can explain what it understood, the senior creative direction it selected, which provider it chose, what failed, what was repaired, and what the user accepted.

## Locked Baseline

Changes require an ADR.
