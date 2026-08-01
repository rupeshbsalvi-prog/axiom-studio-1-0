---
Document ID: BX-GUIDE-002
Version: 1.0
Release: AF-1.0
Status: Frozen
Owner: Experience
Depends On: ADR-002, ADR-004
Validated By: UXR1, UXR2
Last Structural Change: 2026-06-21
---

# Motion Language v1.0

This document defines the animation semantics, transition easing, and durations for the Mission Control user experience, preventing visual fatigue and maintaining cognitive calm.

## Animation Semantics
- **Enter Banners**: Banners slide in smoothly to demand attention when execution is blocked.
- **Progressive Disclosure**: Detailed panels expand from their origin node; visual transitions must connect parent to child.
- **Milestone Reached**: Green checkmark timeline nodes fade in with a scale bounce of 1.1x.

## Transition Values
- **Durations**:
  - Snappy: $100\text{ms}$ (cursor pull, hover triggers)
  - Standard: $300\text{ms}$ (tab clicks, list transitions)
  - Considered: $800\text{ms}$ (timeline stage transitions)
- **Easing**:
  - Snappy: `cubic-bezier(0.25, 1, 0.5, 1)` (ease-out-quad)
  - Considered: `cubic-bezier(0.4, 0, 0.2, 1)` (standard ease)
