# AI Governance for Axiom Imagine X

[Back to docs index](../README.md)

## Purpose

Define how Axiom Imagine X can assist without becoming the source of truth.

For the full subsystem blueprint, see [Imagine X Master Blueprint](../brain/brain-master-blueprint.md).

## Imagine X Responsibilities

- Parse intent.
- Plan scene, object, motion, brand, and layout structure.
- Route to providers.
- Critique output.
- Repair failures.
- Learn from accepted outcomes.

## Imagine X Restrictions

- Imagine X cannot silently mutate final project state.
- Imagine X cannot hide provider failures.
- Imagine X cannot flatten semantic scenes when editable objects are required.
- Imagine X cannot replace exact names, messages, counts, or brand constraints with generic guesses.

## Acceptance Criteria

- Every Imagine X result has provenance.
- Every Imagine X proposal has accept/reject status.
- Guardian quality checks run before final acceptance where applicable.

## Locked Baseline

Changes require an ADR.
