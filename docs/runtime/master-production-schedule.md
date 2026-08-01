# Axiom Master Production Schedule (AMPS)

This document orchestrates the production scheduling, sprint breakdowns, definition of done (DoD) checklists, and technical debt budgeting for the Axiom Creative Operating System Program.

---

## 1. Epic & Sprint Roadmap

The Axiom program runs across parallel development streams, structured into core epics:

```text
Program ──> Epic ──> Sprint ──> Task ──> Gate ──> Release
```

### Epic 01: Brand Identity (Gate 2: Brand Freeze)
- **Sprint 1: Axiom Identity Foundation**
  - *Tasks*: Core logo system, palette rules (base, glass, AI), font pairings, iconography style grids, material language shaders, motion timing curves.
  - *Deliverable*: Final Brand Bible and Asset package.
- **Sprint 2: Brand Media Production**
  - *Tasks*: Splash screen, app icons, favicons, loading indicators, and vector UI accents.

### Epic 02: Creative Assets (Gate 4: Asset Freeze)
- **Sprint 3: 3D Geometries & Environments**
  - *Tasks*: Low-poly meshes (Creator, Brain X, Imagine X, Studio Galaxy), texture map optimization, environment HDRI lightings.
- **Sprint 4: Motion & Sound Library**
  - *Tasks*: Video preview loops, transition sound cues, Lottie vector interactions, ambient tracks.

### Epic 03: Landing Experience (Gate 5: Experience Freeze)
- **Sprint 5: Storyboards & Camera Layouts**
  - *Tasks*: Timeline manifest choreography, named camera preset coordinates, scroll-timeline triggers.
- **Sprint 6: Experience Composer Interface**
  - *Tasks*: Compile manifests and tokens into dynamic UI overlays and WebGL frames.

---

## 2. Definition of Done (DoD) Checklists

Every deliverable must meet these checklists to be marked as Approved:

### Logo / Brand Assets:
- [ ] Available in raw vector (`.ai`, `.svg`) and optimized raster (`.png`, `.webp`) formats.
- [ ] Provided in all variations: Dark, Light, Glassmorphic overlay, Monochrome, and Print-ready.
- [ ] Exported as App Icon and Favicon packages.
- [ ] Registered under the **Asset Production Tracker** with metadata.

### 3D Models / Geometries:
- [ ] Available in low-poly `.glb` format with packed textures and materials.
- [ ] Polygon count is within the performance budget (< 25,000 polygons).
- [ ] Level of Detail (LOD) states and basic animation rigs built.
- [ ] Rendered thumbnail preview is generated.

### Video Loops / Motion Assets:
- [ ] Compressed WebM/MP4 loops ready under the 4.2 MB budget limit.
- [ ] Loops seamlessly without frame skips or audio transitions.
- [ ] Metadata registers target resolution (e.g. 1080p, 30 FPS).

---

## 3. Production Debt Budgets

Each sprint allocates a percentage of its developer/creator budget to address technical, design, and documentation debt to prevent velocity degradation:

| Sprint Type | Feature Work | Technical Debt | Creative Debt | Documentation |
| :--- | :--- | :--- | :--- | :--- |
| **Creative Sprints** | 70% | 5% | 15% | 10% |
| **Platform Sprints** | 60% | 25% | 5% | 10% |
| **Studio Sprints** | 75% | 10% | 5% | 10% |
