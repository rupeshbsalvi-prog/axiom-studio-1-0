# Axiom Build Roadmap

This document outlines the nine implementation milestones, target specifications, and acceptance criteria required to build the Axiom Creative Platform.

---

## The 9 Build Milestones

### Milestone 1: Platform Runtime Core
- **Tasks**:
  - Implement `AxiomRuntime`, `AxiomKernel`, and startup DI lifecycles.
  - Implement the `EventBus` and `StateService`.
  - Implement `CapabilityService` for device and graphics profiling.
  - Setup unified `PlatformAPI` abstractions.
- **Acceptance Criteria**:
  - Runtime boots without errors and registers services.
  - Capabilities are detected (WebGL, touch interfaces, offline state).

### Milestone 2: Rendering Foundation
- **Tasks**:
  - Implement the `RenderingService` and `SceneGraph`.
  - Create the default WebGL `ThreeRenderer` with camera interpolation.
  - Implement 2D Canvas fallback pipeline.
- **Acceptance Criteria**:
  - Render a test 3D scene.
  - Gracefully falls back to 2D canvas when WebGL is disabled.

### Milestone 3: Landing Experience
- **Tasks**:
  - Implement `ExperienceComposer` and parse manifests.
  - Render the 3D Neural Galaxy (Living Roadmap) with lifecycle visual cues.
  - Bind scroll events to camera coordinates and lighting transformations.
- **Acceptance Criteria**:
  - The page displays sections (Hero, Philosophy, Galaxy, Subscriptions).
  - Hovering a node displays capabilities and waitlist forms.

### Milestone 4: Workspace Evolution
- **Tasks**:
  - Build the unified `Axiom Workspace` dashboard.
  - Construct dynamic sidebar navigation linked to the studio registry.
  - Implement preview overlays, progress indicators, and waitlist buttons for upcoming studios.
- **Acceptance Criteria**:
  - Workspace displays active and upcoming studios.
  - Upcoming studios showcase milestones (e.g. Video Studio - 73% complete milestones).

### Milestone 5: Photo Studio Integration
- **Tasks**:
  - Re-mount the existing Photo Studio vertical to use the platform API and Rendering Service.
  - Connect layer editing, masking, and export systems.
- **Acceptance Criteria**:
  - Photo Studio runs inside the workspace shell.
  - Actions publish events via the Event Bus.

### Milestone 6: Intelligence Runtime
- **Tasks**:
  - Build Brain Runtime (workflow orchestration) and Imagine Runtime (planning, AI routing).
  - Connect auto learner and context tracking.
- **Acceptance Criteria**:
  - Imagine X dashboard traces user steps and makes style recommendations.

### Milestone 7: Marketplace
- **Tasks**:
  - Connect marketplace registries.
  - Render dynamic asset lists (Templates, prompt packs, icons, extensions).
- **Acceptance Criteria**:
  - Active packages are searchable and insertable.

### Milestone 8: Video Studio
- **Tasks**:
  - Scaffold Video Studio module.
- **Acceptance Criteria**:
  - Registered as "Development" stage, automatically updates 3D galaxy visualization to "Construction Drones".

### Milestone 9: Motion Studio
- **Tasks**:
  - Scaffold Motion Studio module.
- **Acceptance Criteria**:
  - Registered as "Design" stage, rendering as a blueprint outline in the galaxy.

---

## Production Gates

To ensure systematic delivery, the Axiom program will progress through eight sequential quality gates:

### Gate 1: Architecture Freeze
- **Status**: Complete ✅
- **Criteria**: Core runtimes, registries, platform laws, and manifests defined.

### Gate 2: Brand Freeze
- **Criteria**: Logo, typography, voice, and visual assets approved.

### Gate 3: Design System Freeze
- **Criteria**: Every reusable UI component and token defined and tested.

### Gate 4: Asset Freeze
- **Criteria**: Geometry models, video loops, ambient tracks, and shaders produced and validated against performance budgets.

### Gate 5: Landing Experience Freeze
- **Criteria**: Storyboards finalized, camera coordinates mapped, and transition choreographies approved.

### Gate 6: Runtime Freeze
- **Criteria**: Boot sequence, event bus, state service, capability service, and rendering abstraction fully stable.

### Gate 7: Photo Studio Beta
- **Criteria**: Flagship editor operating fully on top of Platform Runtime APIs.

### Gate 8: Public Launch
- **Criteria**: Scaled production deployment.

---

## Test Verification Strategy

- **Unit Testing**: Run `npm run test` to execute vitest suites across platform runtimes.
- **Integration Testing**: Validate that changing manifests automatically modifies WebGL coordinates and UI layouts.
- **Performance Thresholds**: Ensure initialization and first paint render under 100ms.
