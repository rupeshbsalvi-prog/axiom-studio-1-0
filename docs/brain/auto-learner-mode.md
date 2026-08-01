# Auto Learner Mode

[Back to docs index](../README.md)

## Purpose

Define how Axiom Imagine X may learn user and workspace preferences while preserving privacy, transparency, and control.

## Core Rule

Learning must never occur without explicit user or workspace consent.

## Learning Sources

With permission, Imagine X may learn from:

- Project history.
- Editing behavior.
- Preferred tools.
- Preferred workflows.
- Favorite templates.
- Brand assets.
- Typography preferences.
- Color palettes.
- Export formats.
- Studio usage.
- Prompt refinements.
- Workspace organization.
- Creative patterns.

## Learning Capabilities

Imagine X may learn:

- Preferred writing style.
- Preferred design style.
- Preferred animation speed.
- Preferred layouts.
- Preferred providers.
- Preferred export formats.
- Frequently used assets.
- Brand identity.
- Naming conventions.
- Workflow shortcuts.
- Favorite components.
- Automation habits.

## User Controls

Users must be able to:

- Pause learning.
- Resume learning.
- Delete learned knowledge.
- Export learned profile.
- Reset personalization.
- Choose learning scope.
- View why recommendations are made.
- Approve important learned changes before they affect output.

## Enterprise Controls

Workspace admins must be able to:

- Disable learning.
- Limit learning to local workspace data.
- Prevent cross-workspace memory.
- Enforce retention rules.
- Audit learning events.
- Define provider sharing rules.
- Block training on proprietary assets.

## Privacy Requirements

- Local-first preference.
- Encryption where applicable.
- Workspace isolation.
- No unauthorized model training.
- No sharing of proprietary assets without permission.
- Granular permission management.
- Audit logs for learning events.

## Knowledge Graph

Auto Learner Mode should write structured knowledge rather than only conversational memory.

Knowledge categories:

- Projects.
- Studios.
- Assets.
- Templates.
- Components.
- Styles.
- People.
- Organizations.
- Tasks.
- Documents.
- Connectors.
- Automation.
- Workflows.
- Relationships.
- Dependencies.

## Acceptance Criteria

- Learning can be disabled globally.
- Users can inspect and delete learned items.
- Recommendations include an explanation.
- Enterprise policy overrides personal learning settings.
- Learning events are auditable.

## Baseline Update

This document implements [ADR-0002](../adr/ADR-0002-experience-first-platform-entry.md).

[ADR-0005](../adr/ADR-0005-b9-2-secure-session-policy-bootstrap.md) implements the B9.2 boundary: policy disclosure is a read-only, same-origin, session-authenticated request for an explicitly selected workspace. It cannot infer workspace selection, change learning scope, activate learning, create preferences, apply influence, or call providers.

The B9 roadmap checkpoint closes the approved `off` / `local_workspace` scope after B9.1 enforcement and B9.2 live verification. No B9.3 is defined; broader policy administration, retention, provider-sharing, and organization controls require separate explicit roadmap decisions.

## Locked Baseline

Changes require an ADR.
