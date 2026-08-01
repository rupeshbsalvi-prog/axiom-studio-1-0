# Axiom Studio Brand System

Version: `1.0.0-draft.1`  
Status: Draft for Brand Council approval  
Prepared: 2026-08-01

This package converts the Axiom Studio brand into a versioned, implementation-ready system. It combines strategy, messaging, design tokens, governance, measurement, templates and an optional React reference panel.

## Repository Integration Status

Accepted into this repository as a **draft candidate and brand-operations reference**, not as the current runtime source of truth. The production authorities remain:

- [`packages/tokens`](../../packages/tokens/README.md) for immutable UI tokens.
- [`ax-logo-core-symbol.svg`](../../public/assets/branding/ax-logo-core-symbol.svg) for the approved core symbol.
- [`Axiom Identity Board`](../../docs/design/identity-board.md) for the current identity baseline.

The optional React provider, panel, CSS variables, fonts, colors, and logo guidance in this package are not compiled, routed, or imported by the application. Promotion requires explicit approval, token mapping, accessibility review, and visual regression coverage. See [ADR-0004](../../docs/adr/ADR-0004-brand-system-draft-intake.md).

## Included

- `config/`: authoritative machine-readable brand data.
- `docs/`: complete roadmap and operating guidance.
- `src/brand/core/`: dependency-free TypeScript types and validation.
- `src/brand/react/`: optional React provider and hook.
- `src/brand/styles/`: CSS variables.
- `src/brand/components/`: optional internal roadmap panel.
- `roadmap/`: standalone interactive HTML and Mermaid source.
- `templates/`: reusable briefs, audits and QA.
- `integration/`: controlled project-injection guidance.
- `source-artifacts/`: the original ZIP, HTML roadmap, and DOCX supplied for this intake.

## Boundary

Static configuration and presentation code only. No secrets, external runtime modules, arbitrary endpoints, provider dispatch or dynamic code execution.

## Validate

```bash
node scripts/validate-brand.mjs
```

The package is structured for Axiom Studio's React + TypeScript + Vite baseline. Exact repository paths must be reconciled before merge.
