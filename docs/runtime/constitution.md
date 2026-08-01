# Axiom Platform Constitution

This document defines the immutable governance rules, platform laws, and design principles of the Axiom Creative Platform. Every module, runtime service, and creation studio must comply with these guidelines.

---

## The 10 Platform Laws

### Law 1: No Studio owns rendering.
All visual projections, canvas rendering layers, and canvas configurations must go through the unified `RenderingService`. No individual studio is permitted to initialize its own renderer or interact directly with WebGL/WebGPU contexts outside the abstraction layer.

### Law 2: No Studio owns AI.
AI interactions, model selections, intent parsing, prompt formatting, and task routing must be handled through the `ImagineRuntime` and the global `Intelligence` core.

### Law 3: No Studio owns user state.
Local project state, active configurations, canvas layers, and application logs are managed centrally by the `StateService`. Studios communicate state shifts by publishing events to the Event Bus.

### Law 4: No Studio directly accesses registries.
Registries (studios, assets, marketplace, connectors, templates) are protected platform resources. All queries, listings, or modifications must occur through the unified `PlatformAPI`.

### Law 5: All experiences are declarative.
All user interfaces, slide paths, landing sections, workspace panels, and menus must be dynamic—defined in manifests and compiled via the `ExperienceComposer`. Manual styling overrides or hardcoding sections is prohibited.

### Law 6: Assets are immutable.
Original imported templates, images, vectors, and brand kits are read-only. Studios must perform modifications non-destructively through layered project delta trees managed by the platform.

### Law 7: Every feature is cross-platform first.
Every interface element, tool, and shortcut must adapt to multiple target platforms (Web, Windows, macOS, Linux, Android, iOS, iPadOS) and support various input types (Mouse, Keyboard, Touch, Stylus, Trackpad).

### Law 8: Every module must degrade gracefully.
The platform must adapt to device performance constraints. If high-performance WebGL fails, the runtime must gracefully fall back to 2D HTML/Canvas renderings without crashing or presenting broken screens.

### Law 9: Everything is observable.
The kernel, runtimes, services, and studios must publish logs, performance indicators, and telemetry to the Event Bus for runtime monitoring and product analytics.

### Law 10: Nothing is Studio-specific in the Core.
If a service, button, canvas layer, or state mutation benefits only one studio, it must be encapsulated inside that studio's module. If two or more studios require the behavior, it must be refactored into a platform service.

---

## Architectural Taxonomy

1. **Kernel**: Manages application boot cycle, registration of platform modules, service dependencies, and device configuration capability checks.
2. **Platform Services**: Global APIs and systems providing standard operations (Assets, Extensions, State, EventBus, Capabilities).
3. **Experience Composer**: Resolves dynamic UI manifests and matches them with design tokens to render views dynamically.
4. **Rendering Abstraction**: Orchestrates drawing functions, translating the internal scene graph to WebGL, Canvas, or HTML views.
5. **Intelligence Layer**: The orchestration interface housing Brain X (knowledge graph, orchestration, memory) and Imagine X (user interaction planning, routing, prompt tuning).
