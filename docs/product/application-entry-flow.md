# Application Entry Flow

[Back to docs index](../README.md)

## Purpose

Define how users enter Axiom Studio 1.0 across public, authenticated, shared-link, and studio-specific routes.

## Core Principle

Axiom Studio 1.0 is experience-first.

The public application must not open directly into a studio workspace. The first public experience is the Axiom Landing Experience, which introduces the ecosystem, philosophy, intelligence model, platform capabilities, pricing, marketplace, and community.

## Entry Layers

1. Landing Experience: public entry and platform story.
2. Workspace Hub: authenticated project and account home.
3. Studio Workspace: professional editing surfaces.

## Launch Flow

```text
Application Launch
    |
    v
Splash Screen
    |
    v
Axiom Landing Experience
    |
    +--> Explore Platform
    |
    +--> Sign In
    |       |
    |       v
    |   Workspace Hub
    |
    +--> Continue as Guest
            |
            v
        Limited Guest Workspace
            |
            v
        Studio Selection
            |
            v
        Selected Studio
```

## Routing Rules

## First-Time Visitor

- Always starts at the Landing Experience.
- Can explore platform sections without authentication.
- Can start a free trial or continue as guest from explicit actions.

## Returning Visitor Not Signed In

- Starts at the Landing Experience.
- Sees sign-in and free-trial calls to action.
- May access recent cloud projects only after authentication.

## Authenticated User

- Defaults to Workspace Hub.
- Can open Landing Experience from Home.
- Can resume recent project or pinned studio directly.

## Shared Project or Studio Link

- Bypasses Landing Experience only after permission validation.
- If authentication is required, route through sign-in and return to the requested resource.
- If permission fails, show a controlled access state, not a blank workspace.

## Guest Mode

Guest mode may be supported for exploration and trial creation.

Required limits:

- Local-only project state unless upgraded or signed in.
- Clear export, storage, and AI credit limits.
- No hidden project loss when the user signs in.

## Navigation Requirements

Public navigation:

- Axiom Studio logo.
- Studios.
- Intelligence.
- Platform.
- Marketplace.
- Pricing.
- Community.
- About.
- Contact.
- Search.
- Sign In.
- Start Free Trial.

Authenticated navigation:

- Workspace switcher.
- Project search.
- Notifications.
- Usage and credits.
- Profile avatar.
- Settings.
- Billing.
- Home link to Landing Experience.

## Baseline Update

This document implements [ADR-0002](../adr/ADR-0002-experience-first-platform-entry.md).

## Locked Baseline

Changes require an ADR.
