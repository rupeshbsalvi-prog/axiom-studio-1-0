---
Document ID: BX-STD-004
Version: 1.0
Release: AF-1.0
Status: Frozen
Owner: Experience / Creative / Product
Depends On: ADR-004, ADR-005
Validated By: PVR
Last Structural Change: 2026-06-21
---

# Asset Engineering Standard (AES-1.0)

This document establishes the canonical standards, naming conventions, directory structure, metadata schema, and quality gates for all design and AI-generated assets in Axiom Studio.

---

## 1. Directory Structure

All visual, auditory, and structural assets reside in the decoupled `creative/` root directory to prevent code pollution:

```text
creative/
├── images/      ← Hero illustration, empty state images, background layouts
├── icons/       ← Reusable SVG iconography (System, Studio, Status, Action)
├── videos/      ← Product demos, walkthrough records, UI micro-recordings
├── audio/       ← Notification chimes, UI audio cues, process completion tones
├── fonts/       ← Geometric brand typefaces (e.g., Outfit, Inter)
├── lottie/      ← Lightweight vector animations for timeline/judgment views
├── shaders/     ← WebGL GLSL files for neural glow and background effects
├── textures/    ← Graphic noise patterns, glassmorphism map textures
├── prompts/     ← Idempotent model prompts used for asset generation
└── metadata/    ← JSON schema matching assets to generation parameters
```

---

## 2. Naming Conventions

All asset filenames must be lowercase and follow the strict **Category-Element-Variation** pattern:

`[category]_[element]_[variation].[extension]`

### Examples:
* `hero_dashboard_main.png` (Landing hero illustration)
* `state_empty_judgment.svg` (Empty state for Judgment panel)
* `icon_status_attention.svg` (Attention status warning icon)
* `glow_neural_primary.frag` (Neural background fragment shader)
* `chime_mission_complete.wav` (Chime audio file)

---

## 3. Metadata Schema

Every generated asset must have a matching JSON metadata record stored in `creative/metadata/[asset_name].json`:

```json
{
  "assetId": "hero_dashboard_main",
  "version": "1.0",
  "type": "image",
  "generation": {
    "model": "imagen-3",
    "promptPath": "creative/prompts/hero_dashboard_main.txt",
    "aspectRatio": "16:9",
    "parameters": {
      "negativePrompt": "low quality, blur, noise",
      "seed": 421975
    }
  },
  "technical": {
    "dimensions": "1920x1080",
    "fileSize": 182740,
    "format": "webp"
  },
  "licensing": {
    "rights": "commercial-internal",
    "author": "axiomsite-ai"
  },
  "qualityGate": {
    "verdict": "passed",
    "auditor": "experience-designer",
    "date": "2026-06-21"
  }
}
```

---

## 4. Quality Gates

Assets must pass a formal audit before being promoted to production:

| Asset Type | Primary Audit Metric | Criteria |
|---|---|---|
| **Images** | Style Harmony & Contrast | Must strictly match the visual language palette; contrast ratio $\ge 4.5:1$ (WCAG AA). |
| **Icons** | Grid Alignment | Vector alignments must snap to a strict $24\times24$ or $32\times32$ px viewport. |
| **Shaders** | Frame Rate & Load Time | Render loop must maintain steady 60 FPS; initialize in $< 20\text{ms}$. |
| **Audio** | Peak Volume & Length | Peak level capped at $-12\text{dBFS}$; sound effect duration $\le 1.2\text{s}$. |
| **Lottie** | File Size | JSON file size must not exceed $150\text{KB}$; no embedded rasters. |

---

## 5. Storage & Lifecycle

1. **Local Storage**: Large assets must be stored in external object storage buckets, with lightweight optimized targets (WebP, SVG, WebM) cached locally in the source tree.
2. **Retirement Policy**: Obsolete assets must be archived to `creative/archive/` and have their metadata status marked as `"archived"`. Direct deletions are prohibited to prevent broken links.
