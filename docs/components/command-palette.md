# Command Palette

[Back to docs index](../README.md)

## Purpose

Provide fast keyboard-driven access to app commands and AI intent entry.

## User-Facing Behavior

Users open a palette, search commands, switch studios, run project actions, and send prompts to Axiom Brain.

## Required UI Regions

Search input, command list, recent prompts, contextual studio commands, Brain prompt mode.

## Required Data/State

Registered commands, active studio, selected project, user permissions, provider status.

## Events/Actions It Emits

Execute command, switch studio, create project, open file, submit Brain prompt.

## Dependencies

App shell, Axiom Brain Floating Core, provider connector hub, studio registry.

## Wiring Notes

Commands must be registered declaratively so studios can contribute actions without coupling to palette internals.

## Phase Status

Phase 01 target.

## Acceptance Criteria

Keyboard open/close and command execution work consistently across studios.

## Locked Baseline

Changes require an ADR.
