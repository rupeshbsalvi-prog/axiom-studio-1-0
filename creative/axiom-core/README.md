# Axiom Core Geometry

FR1.1 delivers the canonical Axiom Core geometry as three production GLB tiers.

- Master source: `src/app/studios/axiomCoreGeometry.ts`
- Export command: `npm run asset:axiom-core`
- Outputs: validated GLB and USDZ tiers in `creative/axiom-core/exports/`
- Shared hierarchy: `AXIOM_CORE` → `OPTICAL_SHELL`, `CRYSTAL_SEED`, `QUANTUM_CORE`
- Motion: one eight-second `idle-breathe` clip
- Materials: glass, crystal, neural energy, holographic, and titanium constructors in the master source
- Shaders: AX-SHD-001 Glass, AX-SHD-002 Neural Flow, AX-SHD-003 Crystal, AX-SHD-004 Energy Lattice
- Lifecycle: Idle, Listening, Understanding, Planning, Generating, Collaborating, Completed
- Interaction: normalized mouse/pen/touch pull radius, hover proximity, inactive reset, and pause-safe motion
- Audio: AX-AUD-001 ambient bed, AX-AUD-002 thinking crystal pulse, AX-AUD-003 action confirmation; gesture-locked and mute-safe

The runtime and exporter call the same geometry factories. The generated manifest records file size, triangle count, draw calls, and texture memory for every tier.

Generation also reloads every GLB and USDZ with Three.js and fails unless the hierarchy, animation, and tier-degradation gates pass. FPS targets require a separate measured device/browser run and are not claimed by this Node validation.

Local browser measurements are recorded separately in `runtime-validation.json` so machine-specific FPS evidence is not mixed into the deterministic export manifest.

The approved release assessment is recorded in `review-gate.json`. AX-CORE-001 v1.0.0 is Frozen for the GLB/USDZ FR1 scope; static identity formats, deferred conversion formats, and broader device certification are not claimed.
