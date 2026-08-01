# Data Flow

[Back to docs index](../README.md)

## Primary Flow

User input enters a studio. The studio updates local interaction state or emits a semantic command. The runtime validates and applies the command. AXPKG persists project data. Replay/audit records provenance. The UI renders projections from certified state.

## Imagine X Flow

Prompt, sketch, or voice input goes to Axiom Imagine X. Imagine X returns a senior-director plan, provider choices, scene objects, motion/graphic instructions, critique, and repair suggestions. The user accepts or rejects the proposed result.

## Provider Flow

Provider Connector Hub resolves model availability, credentials, capabilities, cost tier, and latency. Provider results are normalized before entering Imagine X or runtime workflows.

## Failure Flow

Provider failures, validation failures, replay failures, and export failures must surface clear status in the shell and log diagnostic memory.
