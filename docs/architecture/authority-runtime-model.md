# Authority Runtime Model

[Back to docs index](../README.md)

## Purpose

Prevent authority confusion between user actions, AI suggestions, GPU projections, and persisted state.

## Authority Tiers

- User command: authoritative after validation.
- System command: authoritative when deterministic and policy-approved.
- AI suggestion: advisory only.
- AI execution: authoritative only after explicit user approval.
- GPU projection: never authoritative.

## Runtime Contract

All final state changes flow through semantic commands. Commands are validated, applied, logged, and replay-certified.

## Studio Rule

A studio may prepare a command, preview a change, or request an Imagine X plan. It must not directly mutate shared authoritative project state.

## Acceptance Criteria

- Every mutating action can be represented as a semantic command.
- AI output remains pending until accepted.
- Replay logs can reconstruct state.
