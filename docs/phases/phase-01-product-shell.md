# Phase 01 - Product Shell

[Back to docs index](../README.md)

## Goal

Create the initial Axiom Studio 1.0 monorepo shell and working Workspace Hub / Studio Workspace foundation without deep provider/runtime wiring.

## Baseline Update

[ADR-0002](../adr/ADR-0002-experience-first-platform-entry.md) reclassifies this phase. The Phase 01 shell is not the final public first screen. It is the authenticated workspace and studio foundation that users reach after Landing Experience, sign-in, guest entry, or a validated shared link.

## Planned Deliverables

- Initial app/package scaffold.
- App Shell.
- Navigation Spine.
- Studio Header.
- Command Palette.
- Inspector Rail.
- Creative Dock.
- Mission Control.
- Canvas Engine foundation.
- AXPKG interface foundation.

## Acceptance Criteria

- In development mode, the app may launch directly to the working tool surface.
- In production public routing, first-time visitors must enter through the Landing Experience before workspace or studio entry.
- All studios are visible as modes.
- Mission Control can start a local project draft.
- Shell state is centralized and documented.
- No studio bypasses shared shell systems.

## Locked Baseline

Changes require an ADR.
