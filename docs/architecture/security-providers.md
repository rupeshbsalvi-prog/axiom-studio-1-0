# Security and Providers

[Back to docs index](../README.md)

## Purpose

Define safe integration with authentication, external models, local models, MCP servers, and extensions.

## Security Requirements

- Never hardcode secrets.
- Store provider credentials through a vault or platform-specific secure storage.
- Provider calls must identify workspace, user, studio, purpose, and capability.
- User-visible status must distinguish offline, unauthenticated, rate-limited, failed, and ready providers.

## Provider Categories

- External models.
- Local models.
- MCP servers.
- Export and asset services.
- Marketplace extensions.

## Acceptance Criteria

- Provider configuration is inspectable without exposing secrets.
- Failures degrade gracefully.
- Each provider declares capabilities per studio.
