# Axiom Core Visual Specification

This document details the visual, geometric, and interactive specifications of the **Axiom Core** (the master visual symbol of the platform). The Axiom Core is the unified visual anchor for splash screens, intelligence states, and workspace navigation.

---

## 1. Geometric Composition

The Axiom Core is a 3D composite mesh comprised of five concentric layers mapping to platform abstractions:

```text
  [Outer Glass Shell] ──> [Procedural Energy Lattice] ──> [Inner Crystal Core] ──> [Neural Particle Cloud] ──> [Quantum Core]
```

1. **Outer Glass Shell (Platform Runtime Layer)**:
   - *Geometry*: Smooth sphere with **controlled imperfections** (micro-bevel transitions, 2-3 microscopic asymmetrical facets, slight surface tension offsets).
   - *Material*: Dynamic glassmorphism shader.
     - *Index of Refraction (IoR)*: `1.50 - 1.53`
     - *Transmission*: `1.0`
     - *Roughness*: `0.03 - 0.05`
     - *Thickness*: `4.0 - 6.0 mm` equivalent scale.
     - *Metallic Specularity*: `0.95`
   - *Behavior*: Continuous low-amplitude Y-axis rotation (`0.02 rad/s`) that tilts toward pointer coordinates.

2. **Procedural Energy Lattice (Circulatory Connection Layer)**:
   - *Geometry*: A procedurally generated wireframe mesh connecting the crystal vertices to neural cloud emitters.
   - *Material*: Volumetric emission-only shader (no transparency, high bloom).
   - *Behavior*: Reconnects and flows dynamically to drive visual state changes, motion timings, and sound cues.

3. **Inner Crystalline Core (Crystal Intelligence Layer)**:
   - *Geometry*: An icosahedron (`THREE.IcosahedronGeometry(0.8, 2)`).
   - *Material*: High-dispersion crystal.
     - *Index of Refraction (IoR)*: `1.70` (higher dispersion, low transmission, high internal facet reflections).
     - *Behavior*: Vibrates and deforms shape based on runtime state frequencies.

4. **Neural Particle Cloud (Data / Memory Layer)**:
   - *Geometry*: GPU-instanced, depth-aware adaptive density particle system (`THREE.Points`) containing 400 - 800 micro-nodes.
   - *Material*: Emissive, glow-mapped particles with HSL color-shifting.
   - *Behavior*: Radial orbits and velocity changes bound by the shell radius.

5. **Quantum Core (Singularity Center)**:
   - *Geometry*: High-intensity volumetric energy point at coordinates `(0, 0, 0)`.
   - *Material*: White-hot emissive source driving internal crystal lighting.

---

## 2. Dynamic State Engine & Runtime Mapping

Visual behavior changes across three coordinate channels: **Geometry**, **Material**, and **Motion**, ensuring accessibility independence from color signals.

| Runtime State | Visual / Color Profile | Geometry Mutation | Particle Velocity & Behavior | Audio Identity | Camera & Lighting |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Idle** | Cyan (`#69d4e8`) | Stable (`1.0` scale) | Slow drift (`0.05 units/s`) | Deep ambient backing | Camera locked, subtle ambient keys |
| **Analyzing (Brain X)** | Deep Purple (`#8a2be2`) | Contracted (`0.98` scale, micro-deformations) | High density cluster (`0.15 units/s`) | Harmonic crystal hum | Zoom in (`+3%`), key light intensifies |
| **Planning (Imagine X)** | Amber Glow (`#edd095`) | Expanded (`1.03` scale, lattice expands) | Dynamic orbits (`0.25 units/s`) | Layered resonance pulses | Orbiting camera, accent lighting bloom |
| **Exporting / Saving** | Emerald Green (`#50c878`) | Concentric ring collapse | Radial collapse to center (`0.02 units/s`) | Crescendo swoosh tone | Frontal pull, key light pulse |
| **Learning** | Cyan-Violet Gradient | Reconfigures topology | Network formation paths | Resonant rising tones | Slow camera rotation |
| **Error / Alert** | Crimson (`#dc143c`) | Fractured lines shader | Chaotic scatter (`0.40 units/s`) | Low frequency warning pulse | Screen shake, key light strobe |
| **Recovery** | Blue (`#2c62f6`) | Reassembling transitions | Reconnecting node strings | Rising recovery chord | Camera ease-in |

---

## 3. Physical Lighting Architecture

Lighting uses a triple-point volumetric setup to maintain geometric legibility across screen sizes:
1. **Key Light (225°)**: Cool tone light source representing system runtime constraints.
2. **Fill Light (0°)**: Neutral volumetric fill light. Restores shadow details without creating visible source points.
3. **Accent Light (45°)**: Warm amber rim accent highlighting glass boundaries and surface imperfections.

---

## 4. Interactive Cursor Reactions

- **Proximity Glow**: Pointer distance increases emissive crystal intensity from `0.4` to `2.2` linearly.
- **Rotational Pull**: Glass shell silhouette tilts on X and Y axes toward pointer coordinates.
- **Particle Attraction**: Clicks trigger procedural lattice connections to pulse and attract cloud particles.

---

## 5. Platform Integration Map

The Axiom Core is a single modular component rendered dynamically across the ecosystem:
- **Splash Screen**: Acts as the central loading orb.
- **Landing Hero**: Serves as the interactive WebGL focal point.
- **Workspace Navigation**: Acts as the launcher/dashboard orb.
- **Processing HUD**: Serves as the telemetry monitor indicator.

