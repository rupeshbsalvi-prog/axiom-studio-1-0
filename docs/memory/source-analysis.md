# Source Analysis

[Back to docs index](../README.md)

## `Axiom-Studio-main`

Use as the authority and enterprise architecture source. It contains the strongest runtime ideas: Rust deterministic runtime, scenegraph, replay, governance, collaboration, and plugin crates.

## `Axiom Studio`

Use as the backend and Axiom Brain implementation source. It contains FastAPI routers, auth, workspaces, scenes, generation jobs, provider handling, brand brain logic, and Python Axiom Brain modules.

## `axiom-studio-creative-suite`

Use as the product and frontend experience source. It contains the clearest Axiom Studio 1.0 user experience, including shell, studio modules, canvas engine, AXPKG project system, and design language.

## `Axiom Image Brain V1`

Currently empty. Ignore unless future files are added.

## Integration Judgment

Do not merge folders directly. Create a clean monorepo and migrate only accepted components phase by phase.
