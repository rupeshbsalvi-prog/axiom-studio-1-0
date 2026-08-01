# Project Rules

[Back to docs index](docs/README.md)

## Product Identity

- Product name is Axiom Studio 1.0.
- This folder is the canonical clean build target.
- Existing projects are references only and must not be modified during this foundation phase.

## Development Rules

- **Process Execution Limit**: Any background process/command execution taking more than 15 seconds must be stopped. Ask the user to run it manually and provide results.
- Documentation comes before app scaffolding.
- Do not copy prototype code until the corresponding component or studio document is accepted for its phase.
- Keep state authority explicit: AI suggests, GPU projects, runtime certifies, users approve.
- Prefer shared components, shared canvas primitives, and shared semantic commands over studio-local rewrites.
- Add tests with each implementation phase; do not rely on visual inspection only.

## Documentation Rules

- Component and studio docs are locked baselines.
- Any meaningful change to a locked baseline requires an ADR entry in `docs/adr/`.
- Each new implementation phase must update `docs/memory/implementation-log.md`.
- Each handoff must update `docs/memory/future-agent-memory.md`.

## Quality Rules

- Every public action must have a clear owner, input, output, and failure behavior.
- Every public artifact has exactly one owner. Changes to a frozen artifact require approval from its owning layer and evidence from the next validation stage (EVR, UXR, TVR, or PVR).
- Every studio must emit semantic events instead of mutating shared state directly.
- Every provider integration must expose errors, status, and provenance.
- Every export path must be replayable or clearly marked as projection-only.
