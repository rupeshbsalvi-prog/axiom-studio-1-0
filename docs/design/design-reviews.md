# Axiom Design Review Specification

This document defines the quality checks, production reviews, and packaging libraries required to validate and freeze assets inside the **Foundation Pack v1.0**.

---

## 1. Foundation Pack v1.0 Libraries

All creative deliverables produced during Phase 0 must be packaged into one of the eight core libraries:

1. **Brand Library**: Logos, symbol, lockups, app icons, favicons, splash graphics, and logo animations.
2. **Design Library**: Design tokens (color, spacing, elevation, borders, radius, shadows, blurs, and lighting).
3. **Motion Library**: Timings, easing functions, scrolls, hover triggers, studio switches, and camera rigs.
4. **Material Library**: Shaders and configurations for glass, crystal, liquid, neural, and metal textures.
5. **Intelligence Library**: Visual styles representing Brain X, Imagine X, thinking states, and routing flows.
6. **Interaction Library**: State responses for cursor tracking, selections, drag-and-drops, and keyboard focus.
7. **Spatial Library**: Base grid layouts, focal coordinates, fog, light colors, and particle density settings.
8. **Audio Library**: Ambient tracks, workspace backings, hover sweeps, clicks, and system notifications.

---

## 2. The 4 Design Reviews

No asset, component, or code structure is committed to the **Frozen** state without passing these sequential quality reviews:

### Review 1: Creative Review
- *Objective*: Check brand alignment and ADLS visual rules.
- *Checklist*: Does the asset match the specified visual DNA? Is it consistent with other ecosystem elements?

### Review 2: Technical Review
- *Objective*: Validate implementation and performance limits.
- *Checklist*: Does the polygon count fit the budget (< 25k poly)? Is the video loop below 4.2 MB? Does the shader compile at 60 FPS?

### Review 3: Platform Review
- *Objective*: Assert cross-platform compatibility.
- *Checklist*: Does the asset render correctly on Web, Windows, macOS, Linux, Android, and iOS? Are input controls responsive?

### Review 4: Experience Review
- *Objective*: Verify user utility and accessibility.
- *Checklist*: Does the asset improve interaction speed? Does it support reduced-motion mode and high-contrast fallbacks?
