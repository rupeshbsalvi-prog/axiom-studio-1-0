# ADR-0004: Brand System Draft Intake

- Status: Accepted
- Date: 2026-08-01

## Context

The supplied Ultimate Brand System contains useful strategy, governance, measurement, templates, machine-readable configuration, and implementation references. It is internally marked `1.0.0-draft.1` and conflicts with current production colors, typography, and established identity assets.

## Decision

Preserve the complete package under `creative/brand-system/` and its original artifacts under `creative/brand-system/source-artifacts/`. Treat it as a draft candidate and brand-operations reference. Do not import its optional React provider, panel, CSS, token set, fonts, or logo rules into the application.

The current authorities remain `packages/tokens/`, `public/assets/branding/ax-logo-core-symbol.svg`, and `docs/design/identity-board.md`. Promotion requires explicit approval, a reconciled token/asset mapping, accessibility review, and visual regression tests.

## Consequences

Brand Studio and documentation can link to the candidate immediately without creating a second runtime theme or silently changing the product identity. Candidate implementation code remains dormant until a governed promotion decision.

## Affected Baseline Documents

- `docs/design/identity-board.md`
- `docs/studios/brand-studio.md`
- `LOCKED_BASELINE.md`
