# UI/UX Studio

[Back to docs index](../README.md)

## Purpose

Design application screens, user flows, wireframes, prototypes, design systems, responsive layouts, and developer handoff artifacts.

## User-Facing Behavior

Users can describe an app, feature, dashboard, website, mobile screen, workflow, or product experience and receive editable UX flows, wireframes, high-fidelity UI screens, component specs, prototypes, and exportable handoff documents.

## Required UI Regions

Screen canvas, page/frame list, component library, user-flow map, responsive preview, inspector, prototype connector panel, design-token panel, accessibility panel, handoff/export panel.

## Required Data/State

Projects, screens, frames, components, variants, constraints, breakpoints, design tokens, user flows, interactions, prototype links, annotations, accessibility notes, export settings.

## Generation Requirements

UI/UX Studio must generate structured product design artifacts, not static mockup images. A request should capture product type, user role, workflow, platform, screen size, information architecture, design system, brand, accessibility requirements, interaction states, data density, and handoff target.

Supported categories include SaaS dashboard, CRM, admin panel, mobile app, landing page, ecommerce flow, onboarding, settings, analytics dashboard, form workflow, design system, component library, wireframe, prototype, user journey, app redesign, and developer handoff.

Outputs must remain editable as screens, frames, layout grids, components, variants, text styles, color tokens, spacing tokens, interaction links, and annotations.

## Events/Actions It Emits

Create screen, generate flow, create wireframe, convert wireframe to UI, create component, update token, link prototype interaction, validate accessibility, export handoff.

## Dependencies

Canvas engine, Vector Studio, Typography Studio, Brand Studio, Presentation Studio, Axiom Imagine X, Project AXPKG system, Export System.

## Wiring Notes

UI/UX Studio owns product design meaning. Canvas Engine owns geometry. Brand Studio owns identity. Typography Studio owns type systems. Vector Studio owns icons and illustrations. Export System owns handoff formats.

## Workflow

1. Capture product/feature intent and target users.
2. Imagine X creates UX brief, user flow, screen list, layout direction, and interaction plan.
3. User approves or revises the first-impression UX plan.
4. Generate wireframes as editable frames and components.
5. Upgrade approved wireframes to high-fidelity UI using brand and design tokens.
6. Generate component states, responsive variants, and prototype links.
7. Validate accessibility, hierarchy, spacing, data density, and handoff readiness.
8. Export to HTML, design tokens, PDF, PNG, SVG, or future Figma-compatible formats.

## Phase Status

Phase 03 target after shell, canvas, brand, typography, and vector foundations exist.

## Acceptance Criteria

Generated UI/UX outputs remain editable as frames, components, tokens, and interaction flows, not flattened screenshots.

First-impression plans show product type, users, screens, flow, layout system, responsive targets, design tokens, accessibility requirements, prototype behavior, and handoff target before generation.

## Locked Baseline

Changes require an ADR.
