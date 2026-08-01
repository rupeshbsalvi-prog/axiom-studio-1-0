# Photo Studio

[Back to docs index](../README.md)

## Purpose

Professional non-destructive image editing and AI-assisted photo/poster composition.

## User-Facing Behavior

Users can generate, import, adjust, mask, refine, and export layered visual compositions.

## Required UI Regions

Canvas, layer list, adjustment panel, histogram/preview area, prompt/refine controls, asset strip.

## Required Data/State

Image layers, masks, adjustment stack, selected object, prompt history, provider provenance, canvas geometry.

## Generation Requirements

Photo and image generation must use structured templates instead of one generic prompt. The request should capture category, purpose, subject, composition, camera, lighting, environment, style, color palette, quality, aspect ratio, resolution, model parameters, and negative prompt.

Supported categories include portrait, landscape, square/social, ultra-wide/banner, canvas/painting, product, icon, logo, character, architecture, interior, food, vehicle, wildlife, fantasy, sci-fi, isometric, infographic, illustration, comic, wallpaper, concept art, and UI illustration.

Raster elements intended for compositing should generate with transparent backgrounds when technically appropriate.

## Events/Actions It Emits

Import image, generate image, apply adjustment, add mask, refine object, accept Brain result, export image.

## Dependencies

Canvas engine, Axiom Brain, provider connector hub, project AXPKG system, export system.

## Wiring Notes

Adjustments are non-destructive studio payloads. Canvas owns spatial placement.

## Phase Status

First vertical MVP candidate.

## Acceptance Criteria

Generated and imported assets remain editable as semantic objects.

First-impression plans show category, aspect ratio, canvas size, aesthetic, lighting, color palette, background strategy, negative prompt, and planned layer breakdown before generation.

## Locked Baseline

Changes require an ADR.
