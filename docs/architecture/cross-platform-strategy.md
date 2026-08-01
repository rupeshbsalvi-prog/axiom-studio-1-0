# Cross-Platform Strategy

[Back to docs index](../README.md)

## Purpose

Define how Axiom Studio 1.0 will support web, desktop, mobile, and tablet platforms while maximizing shared logic.

## Supported Platforms

- Web: Chrome, Edge, Safari, Firefox.
- Desktop: Windows, macOS, Linux.
- Mobile: Android, iOS.
- Tablet: iPadOS and Android tablets.

## Shared Code Strategy

Shared packages should own:

- Product domain models.
- AXPKG contracts.
- Studio registry.
- Provider contracts.
- Imagine X task packets.
- Design tokens.
- Validation schemas.
- API clients.
- Project import/export rules.

Platform-specific shells should own:

- Native menus.
- File system access.
- Window management.
- Push notifications.
- Device input adaptation.
- Offline storage adaptation.
- Platform billing constraints.

## Recommended Platform Targets

Web:

- React and TypeScript.
- Vite or Next.js depending on routing and SSR needs.

Desktop:

- Tauri preferred where Rust runtime integration and smaller binary size matter.
- Electron acceptable if ecosystem speed becomes more important than footprint.

Mobile:

- React Native for shared product logic and native device integration.

Rendering:

- Three.js or React Three Fiber for 3D landing scenes.
- Canvas/WebGL/WebGPU path for advanced studio rendering.
- Reduced-motion and low-power fallbacks required.

Backend:

- Node.js services or Rust services depending on performance and runtime authority needs.
- PostgreSQL for durable relational data.
- Redis for queues, caches, locks, and realtime coordination.
- Object storage for assets and generated media.

## Input Adaptation

Desktop:

- Mouse.
- Keyboard shortcuts.
- Drag and drop.
- Multi-monitor workflows.

Tablet:

- Touch.
- Stylus.
- Landscape and portrait.
- Larger hit targets.

Mobile:

- Gesture navigation.
- Bottom navigation where appropriate.
- Progressive feature disclosure.

Desktop Apps:

- Native menu support.
- File system integration.
- Offline mode.
- Local cache and project recovery.

## Offline and Sync Requirements

- Local project cache.
- Offline project opening where possible.
- Conflict detection.
- Sync status indicators.
- Recoverable upload failures.
- Workspace policy controls for cloud sync.

## Baseline Update

This document implements [ADR-0002](../adr/ADR-0002-experience-first-platform-entry.md).

## Locked Baseline

Changes require an ADR.
