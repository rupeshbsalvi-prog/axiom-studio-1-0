# Axiom Experience Bible

This document acts as the master reference for the visual, motion, interactive, and auditory sequencing of the Axiom Platform interfaces. It governs how the Experience Director translates dynamic manifests into emotional pacing and responsive interactions.

---

## 1. Landing Storyboard & Scene Flow

The landing experience is a single, continuous cinematic timeline. Rather than shifting between static web pages, the user scrolls to guide a virtual camera through the creative environment.

| Sequence Stage | Timeline Event | Environment | Camera Preset | Active Overlays | Audio Track |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **01. Arrival** | Hero Section | Deep Space | `Hero` | Title, Primary CTAs | Ambient sound fade-in |
| **02. Intent** | Creator State | Deep Space | `Creator` | Philosophy Cards | Volume low pulse |
| **03. Reason** | Brain X Logic | Neural Grid | `Brain` | Intelligence Specs | Sound frequency hum |
| **04. Plan** | Imagine X Core | Neural Grid | `Imagine` | Imagine X Capabilities| Dynamic synth sound |
| **05. Universe** | Ecosystem | Galaxy Grid | `Galaxy` | Dynamic Studio Nodes | Galaxy swell audio |
| **06. Creation** | Photo Studio | Glass World | `PhotoStudio`| Available Tools List| Studio interaction |
| **07. Future** | Roadmap | Blueprint World | `Roadmap` | Live Milestones overlay| Soft background track|
| **08. Marketplace** | Plugin Hub | Blueprint World | `Marketplace`| Mockups, Prompt packs | Sound transitions |
| **09. Value** | Subscription | Blueprint World | `Pricing` | Subscription tier cards| Subdued loop |
| **10. Transition**| Portal Entry | Glass World | `Workspace` | "Launch Workspace" button| Ascending sound sweep |

---

## 2. Choreography Rules

### Camera Choreography:
- **No Sudden Movements**: All camera preset changes must interpolate smoothly using cinematic cubic-bezier easing.
- **Scroll Mapping**: 1vh of scroll maps to a 0.05 units transition along the camera path.
- **Focal Tracking**: The camera's look-at coordinate targets the active focal group (e.g. the Imagine X core during Stage 4).

### Lighting Choreography:
- **Hero State**: Low-intensity amber keylight with sharp cyan accents.
- **Brain/Imagine Stage**: Light intensity pulses in synchronization with intelligence engine background queries.
- **Roadmap Stage**: High-contrast blueprint grid projection with active node highlight beams.

### Auditory Choreography:
- **User Hovers**: Studio nodes emit short synthesized sound cues corresponding to their visual frequencies.
- **Transitions**: Changing chapters triggers high-pass filtering shifts to create acoustic depth.

---

## 3. Performance & Accessibility Budgets

- **WebGL Frame Time Target**: 16.6ms (60 FPS) on standard mid-range desktop and mobile systems.
- **Asset Load Delay**: First paint within 80ms using low-resolution proxy meshes. Full GLB assets stream in asynchronously.
- **Accessibility Degradation**: If `prefers-reduced-motion` is detected in the operating system, camera movement is locked, and sections fall back to fade-in-place layout transitions.
