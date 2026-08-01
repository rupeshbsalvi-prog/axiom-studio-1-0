# Asset Hub

[Back to docs index](../README.md)

## Purpose

Manage project and workspace assets, metadata, collections, search, insertion, and reuse.

## User-Facing Behavior

Users can search assets, preview metadata, organize collections, insert assets into studios, and download or relink files.

## Required UI Regions

Asset grid, filters, collection sidebar, preview modal, metadata inspector, insert actions.

## Required Data/State

Asset records, thumbnails, tags, type, source, license, usage links, storage status.

## Generation Requirements

Asset Hub must manage the full asset lifecycle: import, generate, tag, classify, search, preview, license, version, reuse, relink, and export. It is the digital asset management layer for all studios.

Supported categories include photos, vectors, videos, audio, fonts, logos, icons, templates, brand assets, generated elements, references, mockups, documents, exports, datasets, prompts, and provider outputs.

Imagine X should assist with asset classification, metadata extraction, duplicate detection, tagging, license warnings, usage recommendations, collection creation, and insert-to-studio suggestions.

## Events/Actions It Emits

Import asset, tag asset, preview asset, insert asset, download asset, delete asset.

## Workflow

1. Capture asset intent: import, generate, organize, search, or reuse.
2. Classify asset type and required metadata.
3. Create or import asset with preview and provenance.
4. Generate tags, usage rights, related projects, and studio compatibility.
5. User approves metadata or edits it.
6. Asset becomes available for insertion into studios.
7. Track usage links and versions across AXPKG.

## Dependencies

Project AXPKG system, provider connector hub, export system, all studios.

## Wiring Notes

Assets should be referenced, not duplicated unnecessarily, inside studio payloads.

## Phase Status

Phase 02 or Phase 03 depending on MVP asset needs.

## Acceptance Criteria

An asset can be reused across studios with metadata preserved.

First-impression plans show asset type, source/generation route, metadata schema, license/provenance needs, storage strategy, compatible studios, and insertion behavior before generation or import.

## Locked Baseline

Changes require an ADR.
