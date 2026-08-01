# Runtime Event Model

[Back to docs index](../README.md)

## Purpose

Describe the event model future runtime and UI work should target.

## Event Lifecycle

1. Draft: user interaction or Imagine X proposal prepares a change.
2. Validate: command is checked against schema, permissions, and project state.
3. Apply: deterministic runtime applies the command.
4. Persist: event is appended to log and project state is marked dirty or saved.
5. Project: UI renders certified state as projection.
6. Audit: replay/audit panel exposes provenance and status.

## Required Event Fields

- Event ID.
- Sequence number.
- Command type.
- Command payload.
- Authority tier.
- Actor or provider provenance.
- Previous state hash.
- Resulting state hash.
- Timestamp or logical tick.

## Failure States

- Draft rejected.
- Validation failed.
- Runtime failed.
- Persistence failed.
- Replay mismatch.
- Provider failed before command creation.

## Locked Baseline

Changes require an ADR.
