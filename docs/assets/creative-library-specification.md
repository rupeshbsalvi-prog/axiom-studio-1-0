# Axiom Creative Library Specification (ACLS)

This document acts as the master spec and metadata schema for the Axiom Creative Library. It defines the asset classification trees, registry schemas, and creative production KPIs for the program.

---

## 1. Creative Library Inventory Layout

The library is cataloged into logical assets:

```text
Axiom Creative Library
├── Brand/                     # Brand visual identity systems
├── DesignSystem/              # Design tokens and reusable UI assets
├── 3D/                        # Geometries and environment configurations
├── Images/                    # High-res graphics and textures
├── Videos/                    # Interface backing loops and showcases
├── Motion/                    # Keyframes and animation parameters
├── Audio/                     # Ambient tracks and sound cues
└── Shaders/                   # Custom GLSL vertex/fragment scripts
```

---

## 2. Asset Registry Metadata Schema

Every asset in the registry must conform to the following schema:

```typescript
interface CreativeAsset {
  id: string;              // e.g. AX-LOGO-001, AX-3D-024
  name: string;            // Descriptive asset name
  owner: string;           // Responsible creative lead (e.g. Brand, 3D, Motion)
  version: string;         // Semantic version (e.g. v1.0.0)
  dependencies: string[];  // Dependencies on other assets (e.g. materials, textures)
  purpose: string;         // Why the asset exists
  usage: string;           // Which experience uses it (e.g. Hero, ImagineX panel)
  lifecycle: string;       // Pipeline stage (Draft, Approved, Optimized, Released)
  formats: string[];       // Supported format array (e.g. .glb, .webp, .mp3)
  resolution: string;      // Dimensions, poly-counts, or sample rates
  accessibility: string;   // Dynamic/degraded static fallback rules
  relatedStudios: string[];// Associated studio IDs
}
```

---

## 3. Creative Production KPIs

To track program completeness, the assets pipeline must hit these target metrics before entering Gate 5:

| Category | Target Metric | Metric Description |
| :--- | :--- | :--- |
| **Brand Assets** | 100% | Core logo, typography systems, and brand marks approved |
| **Icons** | 250+ icons | Complete SVGs mapped to design system components |
| **Motion Assets** | 150+ animations | Standard timing curves and transitions registered |
| **Audio Tracks** | 50+ sounds | Ambient loops, interface clicks, and alert cues ready |
| **3D Geometries** | 100+ meshes | Optimized low-poly meshes packed with textures |
| **Video Loops** | 40+ loops | WebM/MP4 UI preview loops compressed |
| **HDRI/Materials**| 120+ assets | Textures and lighting setups finalized |
| **Shaders** | 50+ scripts | Compiled GLSL visual effects profiles |
| **Templates** | 200+ drafts | Pre-packaged workspace project start files |
