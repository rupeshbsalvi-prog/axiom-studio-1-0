# Video Studio

[Back to docs index](../README.md)

## Purpose

Multi-track video editing, overlays, color grading, captions, and export workflows.

## User-Facing Behavior

Users can import clips, arrange timelines, add overlays, adjust color, manage audio, and export video.

## Required UI Regions

Preview monitor, timeline, media bin, color panel, audio meters, text overlay inspector, export queue.

## Required Data/State

Media clips, tracks, playhead, overlays, color adjustments, audio levels, captions, export settings.

## Generation Requirements

Video generation must be structured as a timeline of scenes, not a single prompt. The system must preserve temporal consistency across frames, characters, props, environment, camera movement, audio, dialogue, transitions, and visual style.

Supported categories include cinematic, short film, commercial, product showcase, explainer, YouTube, shorts, reels, TikTok, animation, motion graphics, whiteboard, documentary, music video, talking avatar, game trailer, architectural walkthrough, drone flythrough, and corporate presentation.

Video requests must capture objective, story, scene breakdown, characters, environment, camera, subject motion, environment motion, lighting, color grading, audio, dialogue, effects, transitions, duration, aspect ratio, FPS, resolution, style, references, continuity settings, and negative prompt.

## Events/Actions It Emits

Import clip, split clip, move clip, add overlay, grade clip, add caption, export video.

## Dependencies

Project AXPKG system, provider connector hub, export system, canvas engine for overlays.

## Wiring Notes

Video media frames are not canvas geometry. Overlay layers use Canvas Engine.

## Phase Status

Phase 03 or later.

## Acceptance Criteria

Overlay edits do not corrupt clip timeline state.

First-impression plans show story arc, scene timeline, duration, aspect ratio, FPS, camera language, audio plan, continuity references, and risks before generation.

## Locked Baseline

Changes require an ADR.
