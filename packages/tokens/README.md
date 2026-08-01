# @axiom/tokens

Core design system tokens for the Axiom Studio and Brain X interfaces.

## Guidelines

- All tokens are strictly immutable at runtime and compile-time (using `Object.freeze` and `as const`).
- The package contains zero runtime dependencies.
- The [draft Brand System candidate](../../creative/brand-system/README.md) is reference material only. Its tokens must not replace this package without explicit approval, an ADR, accessibility checks, and visual regression coverage.

## Usage

### TypeScript / JavaScript

```typescript
import { theme, colors, spacing } from "@axiom/tokens";

// Accessing properties
const primaryColor = colors.primary;
const mainSpacing = spacing.md;
```
