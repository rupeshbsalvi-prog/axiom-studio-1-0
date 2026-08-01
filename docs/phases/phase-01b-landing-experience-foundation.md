# Phase 01B - Landing Experience Foundation

[Back to docs index](../README.md)

## Goal

Create the first public Axiom Studio 1.0 entry experience and route users into the existing Workspace Hub / Studio Workspace foundation.

## Scope

This phase establishes the experience-first product flow from [ADR-0002](../adr/ADR-0002-experience-first-platform-entry.md).

## Implemented Foundation

- Public Landing Experience opens first.
- Hero communicates `Create Without Limits` and `Powered by Axiom Imagine X`.
- Philosophy section introduces user-intent-first creation.
- Intelligence section separates Axiom Brain X, Axiom Imagine X, OS Core, and Universal Canvas.
- Studio Explorer lists the creation studios from the shared registry.
- Subscription section introduces the 30-day free trial and plan ladder.
- Marketplace/community section introduces platform extensions and cross-platform support.
- `Start Creating` routes into the existing Mission Control workspace.

## Deferred Work

- Real 3D scene with Three.js or React Three Fiber.
- Scroll-timeline camera choreography.
- Studio-specific public landing pages.
- Authenticated routing.
- Guest persistence rules.
- Pricing comparison table.
- Marketplace install flow.
- Reduced-motion toggle.
- Production routing and shared-link permission handling.

## Acceptance Criteria

- First public render shows the Landing Experience, not Mission Control.
- Workspace/Studio shell remains accessible from a clear CTA.
- Landing Experience references Axiom Imagine X, Axiom Brain X, studios, subscription, marketplace, community, and platform compatibility.
- Browser smoke test confirms landing-to-workspace transition.
- Existing Workspace/Studio tests remain green.

## Verification

- `npm test`
- `npm run test:coverage`
- `npm run build`
- Browser smoke test at `http://127.0.0.1:5173/`

## Locked Baseline

Changes require an ADR.
