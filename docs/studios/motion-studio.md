# Motion Studio

[Back to docs index](../README.md)

## Purpose

Deterministic motion graphics, keyframes, timeline editing, and animated export planning.

## User-Facing Behavior

Users can animate layers, scrub timelines, adjust keyframes, preview motion, and export motion formats.

## Required UI Regions

Composition viewer, timeline, layer stack, keyframe inspector, preview transport, render/export queue.

## Required Data/State

Composition, layers, keyframes, easing, duration, playback state, render settings.

## Generation Requirements

Motion generation must be modeled as a timeline of animated objects. Each object can animate position, rotation, scale, opacity, color, blur, shadow, stroke width, glow, and effects.

Supported categories include logo animation, motion graphics, kinetic typography, UI animation, infographic animation, character animation, product animation, explainer animation, social media motion, icon animation, loading animation, transitions, HUD animation, dashboard animation, map animation, presentation motion, broadcast graphics, data animation, and 3D motion.

Motion requests must capture objective, animation type, objects, timeline, speed, physics, camera, lighting, transitions, effects, audio, loop behavior, export format, resolution, frame rate, and negative prompt.

## Events/Actions It Emits

Add keyframe, move keyframe, change easing, play preview, create render job, export animation.

## Dependencies

Canvas engine, project AXPKG system, export system, replay engine, Axiom Brain for motion planning.

## Wiring Notes

Temporal data belongs to Motion Studio. Spatial overlays still use Canvas Engine geometry.

## Phase Status

Phase 03 target.

## Acceptance Criteria

Motion timeline changes can be persisted and replayed deterministically.

First-impression plans show timeline, object list, keyframes, easing, duration, output format, and motion quality risks before generation.

## Locked Baseline

Changes require an ADR.
