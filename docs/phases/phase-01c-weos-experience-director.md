# Phase 01C - WEOS Experience Director

[Back to docs index](../README.md)

## Goal

Implement the first product-scoped Web Experience Operating System orchestration layer for the public Axiom entry.

## Scope

Phase 01C adds the Experience Director foundation outside frozen Platform Runtime v5.

## Implemented Foundation

- WEOS journey model with 12 stable chapters.
- Product-scoped Experience Director module.
- Director cue generation for camera, lighting, particles, audio, theme, quality, and portal readiness.
- Quality profile resolution for high, medium, and low hardware tiers.
- Reduced-motion cue behavior.
- Landing UI consumes WEOS journey and director module data from `src/experience/director`.
- Director Foundation 2 adds pure director state for scroll progress, active chapter index, local chapter progress, previous/next chapter handoff, hardware signal detection, and completion labels.
- Landing UI now exposes live Experience Director status and uses scroll-aware active chapter highlighting.
- Director Foundation 3 adds deterministic render directives for camera target, fog density, scene accent color, motion speeds, core intensity, particle density, and lighting intensity.
- The WebGL animation loop now consumes the active director state through a ref bridge so scroll updates do not recreate the renderer.
- Director Foundation 4 lazy-loads the Three.js runtime through a tiny cinematic adapter and records the approved deferred vendor chunk threshold in Vite config.
- Director Foundation 5 adds cinematic runtime readiness states for loading, ready, and accessible fallback.
- The fallback scene now has a polished status layer for WebGL-unavailable or deferred-runtime loading states.
- Director Foundation 6 makes the CSS fallback director-aware with chapter id, accent color, core scale, opacity, and motion timing derived from `ExperienceRenderDirective`.
- Director Foundation 7 adds keyboard-accessible chapter navigation for the WEOS journey.
- Director Foundation 8 extracts the cinematic engine from `App.tsx` into `src/experience/cinematic/CinematicExperienceEngine.tsx`.

## Boundary

No Platform Runtime v5 contracts are changed.

The Experience Director is not a platform service. It is a product/experience layer that may later consume stable platform capability data.

## Acceptance Criteria

- WEOS journey begins at Arrival and ends at Workspace Portal.
- Scroll progress maps to deterministic chapter cues.
- Reduced motion locks the camera cue and lowers motion intensity.
- Low hardware tier lowers particle budget and rendering expectations.
- Landing UI renders WEOS/director language from the director module.
- Landing UI exposes active chapter, cue, quality profile, and handoff status from director state.
- WebGL camera, fog, motion, particle density, lighting, material color, and telemetry labels respond to director state.
- Three.js is isolated as a deferred cinematic runtime chunk instead of a static app-shell import.
- Landing renders an accessible cinematic readiness status while the deferred runtime initializes or falls back.
- The CSS fallback scene changes mood and motion from the active WEOS chapter instead of staying static.
- Chapter rail items are now buttons with click, arrow-key, Home, and End navigation into the director timeline.
- Landing/workspace orchestration is separated from cinematic WebGL diagnostics and render lifecycle code.
- Existing Workspace Hub transition remains intact.

## Verification

- `npm test`
- `npm run build`
- `npx vitest run --coverage src/experience/director/ExperienceDirector.test.ts`

## Known Risks

- Browser MCP smoke verification was unavailable during implementation because the MCP tool returned a sandbox metadata error.
- The Three.js chunk remains large and should be lazy-loaded in a future phase.
- Director cues are pure data today; the WebGL loop still needs deeper cue consumption for camera and lighting choreography.

## Locked Baseline

Changes require an ADR.
