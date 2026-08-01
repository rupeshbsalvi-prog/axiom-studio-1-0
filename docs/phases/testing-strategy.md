# Testing Strategy

[Back to docs index](../README.md)

## Phase 00

Documentation completeness checks only.

## Phase 01

- Typecheck frontend packages.
- Unit test shell state, studio registry, command registry, canvas engine helpers, and AXPKG serialization.
- Browser smoke test for Mission Control and studio switching.

## Phase 02

- API tests for auth, projects, providers, Brain proposals, export jobs.
- Contract tests for shared types.
- Runtime event tests for validation and authority rules.
- Provider failure tests.

## Phase 03

- Studio-specific interaction tests.
- Canvas regression tests across studios.
- Export round-trip tests.
- Replay/audit smoke tests.

## Acceptance Gate

No phase is complete until its docs, tests, and implementation log are updated.

## Locked Baseline

Changes require an ADR.
