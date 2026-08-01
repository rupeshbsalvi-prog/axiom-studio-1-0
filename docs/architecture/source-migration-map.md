# Source Migration Map

[Back to docs index](../README.md)

## Purpose

Guide future implementation so the existing projects are mined intentionally instead of copied wholesale.

## Frontend Sources

Use `../axiom-studio-creative-suite` for:

- `src/app/shell` shell composition ideas.
- `src/app/canvas` canvas engine ideas.
- `src/app/projects` AXPKG ideas.
- `src/studios` studio UI prototypes.
- `MASTER_SPEC.md` and `AMPD.md` product intent.

## Backend and Imagine X Sources

Use `../Axiom Studio` for:

- FastAPI routers and schemas.
- `axiom_brain` executive, guardian, registry, schemas, specialists, execution as the starting point for Axiom Imagine X.
- Provider connection patterns.
- Tests for generation, auth, provider runtime, and guardian behavior.

## Runtime Sources

Use `../Axiom-Studio-main/axiom-studio` for:

- Rust deterministic runtime.
- Scenegraph and replay ideas.
- Governance, collaboration, and plugin architecture.
- TS semantic/replay packages.

## Migration Rule

For each component, migrate behavior and contracts first. Copy code only after adapting names, dependencies, tests, and ownership to Axiom Studio 1.0.

## Locked Baseline

Changes require an ADR.
