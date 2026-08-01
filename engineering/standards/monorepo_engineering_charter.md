---
Document ID: BX-ENG-002
Version: 1.0
Release: AF-1.0
Status: Frozen
Owner: DevOps / Lead Engineer
Depends On: BX-ENG-001, BX-STD-002
Validated By: PVR
Last Structural Change: 2026-06-21
---

# Monorepo Engineering Charter

This charter defines the mandatory engineering contracts, configuration standards, public API policies, and dependency rules governing every package in the Axiom Studio and Brain X monorepo.

---

## 1. Package Standards

Every package created in `packages/` must strictly adhere to the following file layout:

```text
packages/[package-name]/
├── package.json         ← Defined module type ("module") and build scripts
├── tsconfig.json        ← Local TypeScript compiler extends root config
├── vitest.config.ts     ← Unit testing config
├── README.md            ← Public usage instructions and API documentation
├── CHANGELOG.md         ← Version changelog matching semantic tags
├── LICENSE              ← Internal/external licensing rights
├── src/                 ← Source folder containing implementation
│   └── index.ts         ← Sole public API entry point
└── tests/               ← Unit and integration test files
```

---

## 2. TypeScript Standards

All packages must run under strict TypeScript compiler flags. No package is allowed to weaken these settings independently:

* `"strict": true` (Enforces strict type-checking parameters)
* `"noUncheckedIndexedAccess": true` (Guarantees safe array/object index lookups)
* `"exactOptionalPropertyTypes": true` (Enforces explicit undefined vs missing property typing)
* `"noImplicitOverride": true` (Guarantees class hierarchy safety for overrides)

---

## 3. Dependency Rules

To prevent coupling and maintain circular safety:
* **Core Design Packages** (such as `@axiom/tokens`): Must have **zero runtime dependencies** (`dependencies: {}`). Development tooling is the only acceptable addition.
* **Internal Imports**: Consuming packages must import shared workspace packages using workspace protocol versions (`workspace:*`).

---

## 4. Public API & Export Policy

Every package must expose its capabilities exclusively through its entry point `src/index.ts`.
* **No Deep Imports**: Consumers are strictly prohibited from referencing inner paths.
  * **Correct**: `import { colors } from "@axiom/tokens";`
  * **Incorrect**: `import { colors } from "@axiom/tokens/src/colors";`
* **Refactoring Shield**: This boundary ensures internal code can be refactored without breaking downstream consumers.

---

## 5. Versioning Strategy

All pre-release and development packages must use semantic pre-1.0 version increments:
* **Initial Development**: `0.1.0` (indicates experimental or evolving API)
* **Stable baseline**: `1.0.0` (assigned only after the API has successfully integrated and stabilized across multiple consuming apps).
