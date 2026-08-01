# Axiom Design Language System (ADLS)

This document acts as the creative constitution of Axiom. It defines the visual, motion, spatial, AI, and emotional design principles (DNA) of the platform to ensure unified product styling across all runtimes, interfaces, and studios.

---

## 1. Visual DNA

### Material Hierarchy
- **Primary Stage (Base)**: Pitch black (`#070809`). Pure deep space depth.
- **Interactive Glass**: Translucent containers with custom backdrop blurs:
  - `backdrop-filter: blur(20px) saturate(180%)`
  - `background: rgba(17, 19, 24, 0.7)`
- **Embellishments (Borders & Highlights)**: Thin 1px borders with HSL-derived gradients transitioning between transparent and muted steel (`rgba(255, 255, 255, 0.08)`).

### Lighting & Depth
- **Depth Levels (Z-Index)**:
  - Level 0: WebGL Starfield/Background.
  - Level 1: Scene Graph 3D Meshes & Lights.
  - Level 2: Glass Card Overlays.
  - Level 3: Portals, Waitlist Popups, and Global Modals.
- **Specular Accents**: Dynamic point lights that track pointer moves, creating interactive highlights on glass surfaces.

---

## 2. Motion DNA

### Timing Curves & Easing
- **Cinematic Transition**: All camera moves use `cubic-bezier(0.25, 1, 0.5, 1)` (Cubic Easing Out) to prevent abrupt momentum shifts.
- **Micro-Interactions**: Hover states on studio nodes scale by `1.08x` over `200ms` using `cubic-bezier(0.34, 1.56, 0.64, 1)` (Back Easing Out) to add elastic feedback.

### Choreography
- Camera movements are continuous. Elements must fade in/out in synchronization with camera focal adjustments rather than snapping abruptly.

---

## 3. Spatial DNA

### Safe Areas & Layout Grid
- **Rhythm**: All paddings, margins, and layout gaps adhere to a base **8-point system** (8px, 16px, 24px, 32px, etc.).
- **Viewport Constraints**: Typography scales dynamically based on structural grid containers, never raw viewport width (`vw`), to preserve spatial alignment on wide monitors.

---

## 4. AI DNA (Brain X & Imagine X Identity)

### Cognitive States
- **Thinking State**: The Imagine X Core pulses softly with a blue/amber emissive light (`#69d4e8` / `#edd095`).
- **Orchestration / Action State**: Energy particles flow from the center node out to studio nodes, visualizing planning tasks.
- **Learning State (Auto Learner)**: Muted gold rings rotate slowly on their Y-axis, representing pattern updates.

---

## 5. Emotional DNA

| Stage / Section | Emotional Goal | Visual Cues | Motion Signature |
| :--- | :--- | :--- | :--- |
| **Splash / Loading**| Anticipation | Muted starfield | Slow scale-up |
| **Hero Title** | Curiosity | Glowing core, deep fog | Camera panning |
| **Creator Context** | Trust | Clean cards, structured lists | Elastic slides |
| **Brain X** | Intelligence | Interactive grids, code traces | High frequency pulses|
| **Imagine X** | Empowerment | Direct planning outputs | Prompt autotyping |
| **Ecosystem** | Possibility | Neural Galaxy | 3D Orbiting nodes |
| **Marketplace** | Opportunity | Grid cards, active previews | Subtle hovers |
| **Workspace Portal**| Ownership | Portal sweep, login entry | Accelerated zoom |
| **Photo Studio** | Confidence | Fully illuminated canvas, active tools | Seamless editing |
