# Axiom Production Pipeline

This document defines the production sequence, asset prefixes, and quality gates for the creative asset lifecycle of the Axiom Program.

---

## 1. Pipeline Stages

All creative elements (Geometry, Video, Audio, Shaders, UI components) must progress through these standard development gates:

```text
Idea ──> Concept ──> Reference ──> Draft ──> Review ──> Approved ──> Optimized ──> Integrated ──> Released
```

1. **Idea**: Conceptual proposal describing the purpose, context, and requirements.
2. **Concept**: Initial sketch, mood board, or wireframe.
3. **Reference**: Gathering tech specs, performance targets, and comparative guides.
4. **Draft**: First mockups, low-poly geometry model, or low-bitrate sound design.
5. **Review**: Visual validation against the **Axiom Design Language System (ADLS)**.
6. **Approved**: Formally locked asset. The design is finalized and frozen.
7. **Optimized**: File compression, geometry poly-reduction, formatting WebP/WebM checks.
8. **Integrated**: Mounted inside the codebase registry, driven by manifests.
9. **Released**: Shipped inside production builds.

---

## 2. Standard Asset Prefix Standards

To manage assets at scale, filenames must use these standard prefixes:

| Prefix | Category | Description / Example |
| :--- | :--- | :--- |
| **AX-LOGO** | Brand Logos | Brand identity, splash marks (`AX-LOGO-001`) |
| **AX-3D** | 3D Geometry | GLTF/GLB models, environment meshes (`AX-3D-024`) |
| **AX-IMG** | Image Textures | HDRI light maps, background patterns (`AX-IMG-004`) |
| **AX-VID** | Video Loops | WebM/MP4 UI backing loops, previews (`AX-VID-102`) |
| **AX-AUD** | Audio Assets | Interface audio, ambient tracks (`AX-AUD-017`) |
| **AX-LTY** | Lottie Files | Vector-based animation parameters (`AX-LTY-002`) |
| **AX-SHD** | GLSL Shaders | Custom vertex/fragment rendering scripts (`AX-SHD-001`) |
| **AX-UI** | Design Elements | Static vector shapes, icon buttons (`AX-UI-008`) |
| **AX-TMP** | Layout Templates| Project draft templates (`AX-TMP-012`) |

---

## 3. Immutable Operational Rule

> [!CRITICAL]
> **No Placeholders in Production**: No production code should introduce placeholder visuals, placeholder motion, placeholder audio, or temporary branding unless it is explicitly marked as a development-only artifact.

All modules must develop using approved production assets or clearly labeled development-only mocks.
