# Connector and MCP Framework

[Back to docs index](../README.md)

## Purpose

Define how Axiom Imagine X, Axiom OS Core, and Axiom Brain X use external providers, MCP servers, plugins, and marketplace extensions.

## Connector Types

Supported connector families:

- AI providers.
- MCP servers.
- Plugins.
- Marketplace extensions.
- Enterprise integrations.
- Storage providers.
- Publishing providers.
- Analytics providers.
- Render providers.

## AI Provider Categories

- Text.
- Image.
- Video.
- Audio.
- 3D.
- Code.
- Document.
- Reasoning.
- Vision.
- Speech.
- Translation.

## MCP Support

Axiom should support native MCP client capabilities:

- Discover MCP servers.
- Install MCP servers.
- Enable or disable MCP servers.
- Manage permissions.
- Discover tools.
- Share context safely.
- Execute local and remote tools.
- Show health status.

Example MCP domains:

- File system.
- GitHub.
- Google Drive.
- Figma.
- Notion.
- Slack.
- Jira.
- PostgreSQL.
- Docker.
- Local computer.
- Custom enterprise servers.

## Plugin System

Plugins may provide:

- New studios.
- New AI models.
- New export formats.
- Custom workflows.
- Enterprise integrations.
- Automation.
- Rendering engines.
- Analytics.
- Developer SDK extensions.

## Universal Connector Contract

Every connector must expose:

- Authentication method.
- Capabilities.
- Permissions.
- Supported inputs.
- Supported outputs.
- Version.
- Health status.
- Usage metrics.
- Security level.
- Offline support.
- Rate limits.
- License.

## Security Requirements

- User consent before connector activation.
- Workspace admin approval where required.
- Scoped credentials.
- Secret redaction.
- Audit logs.
- Capability-based permissions.
- Local/remote execution labels.
- Rate-limit visibility.
- Revocation support.

## Provider Abstraction Rule

External AI providers must be implementation details. The user experience should focus on creative intent, plan quality, editable output, provenance, and control, not provider branding.

## Baseline Update

This document implements [ADR-0002](../adr/ADR-0002-experience-first-platform-entry.md).

## Locked Baseline

Changes require an ADR.
