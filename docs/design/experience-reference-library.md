# Axiom Experience Reference Library

This document houses the curated benchmarks of design, motion, and interaction inspiration that shape the identity of the Axiom Creative Platform. It guides creators in refining original aesthetics rather than mimicking existing patterns.

---

## 1. Visual & UI References

### Glassmorphism & Translucency
- **Inspiration Source**: macOS & iOS System Overlays (Apple).
  - *What to Inspire*: Exceptional backdrop saturations, high-contrast border outlines, and natural light refraction properties.
  - *What to Avoid*: Static, opaque panels or heavy flat dropshadows that obscure depth layers.
  - *Evolution*: Make glass materials react dynamically to pointer lighting and 3D objects behind the card.

### Futuristic Interfaces (FUI)
- **Inspiration Source**: Iron Man / Marvel HUD interfaces (Jayse Hansen).
  - *What to Inspire*: Intricate data visualizations, micro-grids, telemetry overlays, and thin, high-contrast typography.
  - *What to Avoid*: Cluttered, unusable layouts that sacrifice clarity for decoration.
  - *Evolution*: Ensure every line and grid represents real runtime status and serves an accessibility function.

---

## 2. Motion & Interactive References

### Cinematic 3D Scrollytelling
- **Inspiration Source**: Apple Product Tour Pages (e.g. Mac Studio, iPhone Pro landing pages).
  - *What to Inspire*: Camera orbits, seamless zooms, lighting shifts, and scrolling speed interpolation.
  - *What to Avoid*: Interrupted scroll momentum, sudden jumps, or animations that lock the page layout.
  - *Evolution*: Drive transitions entirely through the Platform Event Bus, enabling keyboard navigation and reduced-motion states to degrade gracefully.

### UI Micro-Interactions
- **Inspiration Source**: Stripe & Linear Web Interfaces.
  - *What to Inspire*: Playful, snappy cursor animations, spring-loaded buttons, and smooth loading transitions.
  - *What to Avoid*: Slow, heavy animation delays that feel laggy or impede professional speed.
  - *Evolution*: Integrate the design tokens system directly with GPU-accelerated CSS and WebGL shaders to keep transitions at a consistent 60 FPS.

---

## 3. Sound & AI Experiences

### Sound Design
- **Inspiration Source**: PlayStation 5 UI & Ableton Live.
  - *What to Inspire*: Warm, organic ambient pads, subtle acoustic feedbacks for success/errors, and soft UI hover signals.
  - *What to Avoid*: Harsh, repetitive electronic beeps that generate auditory fatigue.
  - *Evolution*: Create a signature chord progression that is woven into the splash intro and slightly modulated based on the active studio.

### AI Thinking States
- **Inspiration Source**: Google Gemini & OpenAI Advanced Voice interfaces.
  - *What to Inspire*: Fluid, particle-driven waveforms that morph based on processing states.
  - *What to Avoid*: Static, spinning loading rings that communicate lack of intelligence.
  - *Evolution*: Bind the particle velocity in the Three.js Imagine X Core to the complexity of the intelligence routing engine queries.
