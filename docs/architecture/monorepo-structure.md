# Target Monorepo Structure

[Back to docs index](../README.md)

## Target Layout

```text
Axiom Studio 1.0/
  apps/
    web/
    desktop/
    api/
  packages/
    ui/
    canvas-engine/
    axpkg/
    semantic-types/
    replay-engine/
  crates/
    axiom-runtime/
    axiom-scenegraph/
    axiom-replay/
    axiom-governance/
    axiom-collab/
    axiom-plugin/
  brain/
    axiom_brain/
  docs/
```

## Implementation Rule

Create the structure phase by phase. Do not scaffold all runtimes until their phase begins.

## Package Intent

- `apps/web`: browser-capable studio UI.
- `apps/desktop`: Tauri desktop wrapper and native commands.
- `apps/api`: FastAPI backend.
- `packages/ui`: shared visual primitives.
- `packages/canvas-engine`: universal canvas logic.
- `packages/axpkg`: project persistence.
- `packages/semantic-types`: shared commands and contracts.
- `packages/replay-engine`: TypeScript replay and hash checks.
- `crates/*`: authoritative Rust runtime systems.
- `brain/axiom_brain`: Python intelligence layer.
