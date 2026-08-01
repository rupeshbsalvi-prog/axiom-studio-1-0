# Master Requirements

[Back to docs index](../README.md)

## Product Goal

Axiom Studio 1.0 is a professional AI-native creative operating system where users create, edit, govern, and export multi-format creative work through shared studios and one intelligence model: Axiom Imagine X.

## Entry Model

Axiom Studio 1.0 is experience-first.

The platform has three entry layers:

1. Landing Experience: the public cinematic platform entry.
2. Workspace Hub: the authenticated project, account, template, and recommendation home.
3. Studio Workspace: the professional creation and editing environment.

The existing Phase 01 shell is the Workspace Hub and Studio Workspace foundation, not the final public first screen.

## Required Capabilities

- Introduce the ecosystem through a public Landing Experience before studio entry.
- Create and manage projects from Mission Control.
- Edit visual objects through a shared canvas engine.
- Use 11 studio modes plus Mission Control.
- Route prompts, sketches, and future voice input through Axiom Imagine X.
- Produce senior creative-director-level plans and outputs across graphics, motion, brand, layout, typography, presentation, UI/UX, and video workflows.
- Keep outputs editable as semantic objects when the task requires editability.
- Save, recover, import, and export projects through AXPKG.
- Show provider status, failures, provenance, and model selection.
- Surface replay/audit status for authoritative changes.
- Preserve brand rules, exact text, exact names, requested counts, colors, and layout intent.
- Support subscription, licensing, marketplace, and compute usage visibility as first-class product surfaces.
- Support cross-platform deployment targets across web, desktop, mobile, and tablet.

## Non-Functional Requirements

- First public screen is the Landing Experience. Authenticated users may default to Workspace Hub. Shared links may route directly after permission validation.
- UI must be dense, professional, stable, and responsive.
- Shared systems must avoid studio-local duplication.
- Provider failures must degrade gracefully.
- Project data must not be silently lost.
- Secrets must not be hardcoded or exposed to the frontend.

## MVP Definition

The first useful MVP is:

- Mission Control.
- Product shell.
- Local project draft.
- Canvas Engine.
- Photo Studio vertical workflow.
- Axiom Imagine X plan/proposal visibility.
- Provider status placeholder or real provider catalog.
- AXPKG save/restore foundation.
- Export panel foundation.

## Locked Baseline

Changes require an ADR.

## Baseline Update

Updated by [ADR-0002](../adr/ADR-0002-experience-first-platform-entry.md) to adopt experience-first entry, subscription/marketplace surfaces, cross-platform requirements, and the Workspace Hub classification for the existing Phase 01 shell.
