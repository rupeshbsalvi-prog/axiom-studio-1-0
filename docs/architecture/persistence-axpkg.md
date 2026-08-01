# Persistence and AXPKG

[Back to docs index](../README.md)

## Purpose

AXPKG is the portable project system for Axiom Studio 1.0.

## Required Slices

- Manifest: project metadata, version, authorship, timestamps.
- Canvas slices: spatial state per studio.
- Studio payloads: domain data for each studio.
- Imagine X slice: prompts, model preferences, memory references, director plans, accepted/rejected proposal history.
- Asset references: imported files, generated files, thumbnails, metadata.
- Replay references: event log pointers and certification metadata.

## Behavior

AXPKG must support autosave, recovery, import, export, migration, and future Tauri filesystem storage.

## Acceptance Criteria

- A project can be saved and restored without losing studio state.
- Recovery sessions are visible to the user.
- Storage backend can swap from browser local storage to desktop filesystem or SQLite.
