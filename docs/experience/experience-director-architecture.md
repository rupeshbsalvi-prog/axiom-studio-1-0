# Experience Director Architecture

[Back to docs index](../README.md)

## Purpose

Define the orchestration layer that makes WEOS feel like one directed cinematic product experience rather than a collection of isolated animations.

## Boundary

The Experience Director is a product-level system.

It must not:

- Add Platform Runtime v5 services.
- Change platform lifecycle contracts.
- Change EventBus semantics.
- Require new platform registry contracts.

It may:

- Consume stable platform capability data.
- Emit semantic user-experience events through existing mechanisms.
- Control landing-scoped WebGL, UI overlays, audio cues, and theme state.

## Responsibilities

The Experience Director coordinates:

- Camera choreography.
- Lighting transitions.
- Weather and environment.
- Music and ambient audio.
- Particle systems.
- Brain activity visualization.
- Theme changes.
- Studio transitions.
- UI state.
- Performance adaptation.
- Reduced-motion behavior.

## Director Model

```text
Experience Director
    |
    +-- Journey Manifest
    +-- Chapter State
    +-- Camera Cues
    +-- Lighting Cues
    +-- Audio Cues
    +-- Interaction Cues
    +-- Quality Profile
    +-- Accessibility Profile
    +-- Portal Transition
```

## Chapter Contract

Each chapter defines:

- Stable id.
- Title.
- Act.
- Story objective.
- Camera preset.
- Environment.
- Lighting mood.
- Audio cue.
- Interaction mode.
- Primary visual.
- Overlay intent.

## Quality Profiles

High:

- Dense particles.
- Dynamic reflections.
- Volumetric-style effects.
- High-detail geometry.
- Post-processing candidate.

Medium:

- Reduced particle density.
- Simplified shaders.
- Lower reflection quality.
- Preserved camera and story.

Low:

- Simplified geometry.
- CSS-assisted visuals.
- Minimal post-processing.
- Preserved interaction model.

Reduced Motion:

- Locked or heavily dampened camera.
- No rapid particle reactions.
- Section-based focus.
- Screen-reader-friendly overlays.

## Implementation Path

1. Create a pure director module with journey data and cue selection.
2. Integrate landing UI with director chapter data.
3. Move inline Three.js decisions behind director cues.
4. Add quality detection and user override.
5. Add portal transition into Workspace Hub.
6. Add one real mini-experience per studio.

## Baseline Update

This document implements [ADR-0003](../adr/ADR-0003-web-experience-operating-system.md).

## Locked Baseline

Changes require an ADR.
