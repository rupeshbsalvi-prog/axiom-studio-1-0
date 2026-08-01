# Controlled Project Injection Guide

## Important constraint
This is a drop-in module, not an automatic merge. The current repository was not supplied with this request, so exact import paths and route placement must be reconciled before implementation.

## Step 0 - Isolate
Create a dedicated branch such as `feat/axiom-brand-system`. Do not combine this work with unrelated product changes.

## Step 1 - Inventory
Locate current logo assets, colour variables, typography, global CSS, theme provider, marketing copy, metadata, favicon/app icons, route-level hero text and duplicated inline colours. Record conflicts before copying.

## Step 2 - Copy the bounded module
- Copy `src/brand/core` into the existing project.
- Copy `src/brand/styles/axiom-brand-tokens.css` into the design-system or global-style area.
- Copy `config/` into a repository-owned documentation/configuration location.
- Use `src/brand/react` only when React context is useful.
- Use `BrandRoadmapPanel` only for an internal documentation/admin route.

## Step 3 - Integrate tokens before redesign
Import the CSS token file once at the application entry or design-system root. Map current variables gradually. Do not perform a global search-and-replace without visual regression review.

## Step 4 - Lock authority
Keep `brand.manifest.json` read-only at runtime. Changes must be code-reviewed. Do not add browser persistence, external endpoints or runtime module loading.

## Step 5 - Apply verbal identity
Migrate product descriptor, hero, navigation, onboarding, core actions, empty/error states, metadata, documentation and sales collateral. Preserve accurate technical wording where it communicates trust.

## Step 6 - Pilot
Apply the system to one representative marketing page and one representative product workflow. Verify typography, contrast, focus, responsive behaviour, reduced motion, loading/error states and real content lengths.

## Step 7 - Verify
Run TypeScript, lint, focused tests, full tests and production build. Manually review narrow/wide layouts and keyboard navigation.

## Step 8 - Publish and deprecate
Mark old variables, logos, templates and copy banks as deprecated. Provide a migration deadline and remove stale assets only after confirmed adoption.
