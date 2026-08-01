# Axiom Asset Production Bible

This document governs the creation, naming, resolution, optimization, and cataloging of all creative assets inside the Axiom Creative Platform. Every graphic, 3D model, sound, Lottie file, video loop, and typography package must follow these standards.

---

## 1. Directory Structure & Naming Rules

All raw and compiled production assets must be placed under the root `assets/` directory:

```text
assets/
├── branding/                      # Logos, marks, brand symbols
├── geometry/                      # 3D meshes (gITF, GLB, USDZ)
├── textures/                      # Image textures, HDRI maps
├── motion/                        # Lottie JSON files, video loops
├── audio/                         # Ambient tracks, interface sounds
└── shaders/                       # Custom GLSL vertex and fragment scripts
```

### Naming Conventions:
- All filenames must use lowercase kebab-case: `ax-[category]-[name].[extension]`
- Example: `ax-3d-creator-idle.glb`
- Example: `ax-vid-neural-energy.mp4`

---

## 2. Asset Performance Budgets

To comply with **Law 8: Graceful Degradation**, assets must adhere to strict memory and bandwidth limitations:

| Asset Type | Primary Format | Max File Size | Target Resolution / Poly Count | Notes |
| :--- | :--- | :--- | :--- | :--- |
| **3D Models** | `.glb` | 1.8 MB | < 25,000 polygons | Textures packed (compressed) |
| **Textures** | `.webp` | 400 KB | Max 2048 x 2048 | 1024 x 1024 preferred |
| **Video Loops** | `.mp4` (H.264) | 4.2 MB | 1080p, 30 FPS | Under 15-second loop duration |
| **Interface Audio** | `.mp3` / `.ogg` | 150 KB | 44.1 kHz, Mono | Seamless looping for ambients |
| **Lottie Animations**| `.json` | 200 KB | Vector-based | No rasterized images inside |

---

## 3. Asset Production Tracker

This live tracker monitors the pipeline of active creative elements:

| ID | Asset Name | Category | Owner | Status | Version | Used In |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **AX-3D-001** | Creator Idle Model | Geometry | 3D Artist | In Progress | v0.2 | Hero Section |
| **AX-3D-002** | Galaxy Core Core Node | Geometry | 3D Artist | Planned | v0.1 | Living Ecosystem |
| **AX-VID-004**| Neural Energy Loop | Motion | Motion Designer | Planned | v0.1 | Hero / Imagine X |
| **AX-LOGO-001**| Axiom Core Logomark | Branding | Brand Lead | Approved | v1.0 | Favicon / Splash / Navigation |
| **AX-AUD-001**| Deep Space Ambient Sound| Audio | Sound Designer | Planned | v0.1 | Landing Ambient |
| **AX-AUD-002**| System Hover Click | Audio | Sound Designer | Planned | v0.1 | Global UI Interaction |
| **AX-SHD-001**| Glassmorphic Background Shader| Shader | Graphics Eng | Approved | v1.0 | Experience Panels |
