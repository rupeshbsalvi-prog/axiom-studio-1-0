# Component Wiring Matrix

[Back to docs index](../README.md)

## Purpose

Show how major components connect during implementation.

## Matrix

| Component | Reads From | Emits To | Must Not Own |
|---|---|---|---|
| App Shell | project, user, studio registry | navigation, global actions | studio business logic |
| Navigation Spine | studio registry, route state | active studio changes | studio renderers |
| Studio Header | project, provider, user | save, export, provider open | export internals |
| Command Palette | command registry, studio context | command execution, Brain prompts | command side effects |
| Inspector Rail | selection, studio payload | property updates, proposal review | runtime mutation |
| Creative Dock | active studio, canvas state | tools, undo/redo, timeline actions | studio data models |
| Canvas Engine | canvas elements | geometry actions | domain meaning |
| Project AXPKG System | project slices | save/recover/write events | UI rendering |
| Auth User System | session/backend | auth state | provider secrets |
| Provider Connector Hub | provider catalog/status | provider selection | Brain planning |
| Axiom Brain Floating Core | prompt/project context | proposals | final authority |
| Replay Audit Panel | event log/hash/provenance | audit actions | project mutation |
| Export System | project/scene/provider | export jobs/artifacts | source state |

## Wiring Rule

Components communicate through shared contracts. Avoid importing studio-specific modules into shared shell components.

## Locked Baseline

Changes require an ADR.
