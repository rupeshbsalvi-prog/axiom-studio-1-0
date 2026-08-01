# Provider Connector Hub

[Back to docs index](../README.md)

## Purpose

Centralize model, MCP, extension, and export-service connections for all studios.

## User-Facing Behavior

Users can inspect available providers, connect accounts, switch models, view capability fit, and understand failures.

## Required UI Regions

Provider list, selected model pill, capability matrix, credential status, error/status messages.

## Required Data/State

Provider catalog, user connections, studio capability mapping, status, cost tier, latency tier.

## Events/Actions It Emits

Connect provider, disconnect provider, select provider, test provider, route prompt.

## Dependencies

Backend API, auth user system, Axiom Brain, security provider rules.

## Wiring Notes

Provider secrets must never be exposed to the frontend.

## Phase Status

Phase 02 target.

## Acceptance Criteria

Every studio can discover eligible providers through one shared hub.

## Locked Baseline

Changes require an ADR.
