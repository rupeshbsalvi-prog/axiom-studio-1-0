# Shared Contracts

[Back to docs index](../README.md)

## Purpose

Define the minimum shared concepts every implementation must preserve.

## Core Types

- Workspace: organization-level context.
- Project: AXPKG unit of work.
- Studio: creative mode with metadata and renderer.
- CanvasElement: spatial object controlled by Canvas Engine.
- StudioPayload: domain-specific data owned by a studio.
- SemanticCommand: replayable state mutation request.
- ImagineXProposal: advisory plan or result from Axiom Imagine X.
- ProviderConnection: configured model/tool/export provider.
- ExportJob: artifact creation workflow.
- ReplayRecord: certified command/event metadata.

## Required Identifiers

Use stable IDs for workspaces, projects, studios, scenes, elements, assets, commands, providers, and exports.

## Contract Rule

No studio invents isolated versions of shared identifiers, project shape, provider status, or command status.

## Locked Baseline

Changes require an ADR.
