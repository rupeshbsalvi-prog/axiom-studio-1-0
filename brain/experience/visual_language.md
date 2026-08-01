---
Document ID: BX-GUIDE-003
Version: 1.0
Release: AF-1.0
Status: Frozen
Owner: Experience
Depends On: ADR-002, ADR-004
Validated By: UXR1, UXR2
Last Structural Change: 2026-06-21
---

# Visual Language v1.0

This document defines the core visual tokens, color mapping, typography, and elevation rules for the Mission Control UX.

## Color Mapping
- **Optimal (Healthy)**: Teal / Emerald (`#10b981`)
- **Attention (Load warning)**: Amber (`#f59e0b`)
- **Critical (Decision block / failure)**: Red (`#ef4444`)
- **Execution States**: Neural crystal blue glow during processing.

## Typography
- **Headings**: Modern geometric font (e.g. Outfit / Inter), letter spacing `-0.02em` for headers.
- **Body**: High legibility sans-serif.

## Elevation & Glassmorphism
- **Panels**: Semi-translucent glassmorphism (`backdrop-filter: blur(16px)`), thin light border (`rgba(255, 255, 255, 0.08)`).
- **Z-Indices**: Banners and alerts float on top of reasoning graphs.
