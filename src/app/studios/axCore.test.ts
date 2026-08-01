import { describe, expect, it, vi } from "vitest";
import * as THREE from "three";
import {
  AnimationController,
  AXIOM_CORE_LIFECYCLE_STATES,
  AXCoreRoot,
  AXCoreConfig,
  AXShaderRegistry,
  StateController,
  type AXRuntimeStateData,
  type AXRenderContext,
} from "./axCore";
import { platformRuntime } from "../../platform/runtime/PlatformRuntime";
import { createAxiomCoreInteraction } from "../../platform/runtime/FrameState";

// Mock WebGLRenderer to prevent JSDOM WebGL context errors
vi.mock("three", async () => {
  const original = await vi.importActual<typeof import("three")>("three");
  return {
    ...original,
    WebGLRenderer: class MockWebGLRenderer {
      domElement = document.createElement("canvas");
      setSize() {}
      setPixelRatio() {}
      render() {}
      dispose() {}
    },
  };
});

describe("AXCore Rendering Subsystems", () => {
  it("normalizes hover and touch input inside the Core pull radius", () => {
    expect(createAxiomCoreInteraction(500, 250, 1000, 500, "touch")).toEqual({
      pointerX: 0,
      pointerY: 0,
      proximity: 1,
      hovered: true,
      source: "touch",
    });
    expect(createAxiomCoreInteraction(1000, 0, 1000, 500, "mouse")).toEqual({
      pointerX: 1,
      pointerY: 1,
      proximity: 0,
      hovered: false,
      source: "mouse",
    });
  });

  it("disables pointer motion when the accessibility pause is active", () => {
    const frame = new AnimationController().computeFrameState({
      geometry: { scale: 1, deformation: 0 },
      materials: { color: "#69d4e8", emission: 0.85 },
      particles: { velocity: 0.05, density: 0.8 },
      lighting: { intensity: 1 },
      interaction: createAxiomCoreInteraction(500, 250, 1000, 500, "mouse"),
      signature: {
        monochrome: false,
        wireframe: false,
        paused: true,
        opaque: false,
        noLights: false,
        flatDiffuse: false,
        basicShader: false,
        noBloom: false,
      },
    }, 0);

    expect([frame.shellTiltX, frame.shellTiltY, frame.crystalBiasX, frame.crystalBiasY]).toEqual([0, 0, 0, 0]);
  });

  it("transitions through every canonical lifecycle state", () => {
    const stateController = new StateController();
    const animationController = new AnimationController();
    const runtimeState: AXRuntimeStateData = {
      geometry: { scale: 1, deformation: 0 },
      materials: { color: "#69d4e8", emission: 0.85 },
      particles: { velocity: 0.05, density: 0.8 },
      lighting: { intensity: 1 },
    };

    for (const lifecycle of AXIOM_CORE_LIFECYCLE_STATES) {
      runtimeState.lifecycle = lifecycle;
      stateController.update(runtimeState, 0);
      expect(stateController.getState()).toBe(lifecycle);
      expect(animationController.computeFrameState(runtimeState, 0).lifecycle).toBe(lifecycle);
    }
  });

  it("publishes the existing shader library under canonical asset IDs", () => {
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera();
    const renderer = new THREE.WebGLRenderer({ alpha: true });
    const core = new AXCoreRoot({ scene, camera, renderer });

    expect(AXShaderRegistry.glass.id).toBe("AX-SHD-001");
    expect(AXShaderRegistry.neural.id).toBe("AX-SHD-002");
    expect(AXShaderRegistry.crystal.id).toBe("AX-SHD-003");
    expect(AXShaderRegistry.energy.id).toBe("AX-SHD-004");
    expect(platformRuntime.registries.shaders.lookup("AX-SHD-001")).toBe(AXShaderRegistry.glass);
    expect(platformRuntime.registries.shaders.lookup("AX-SHD-002")).toBe(AXShaderRegistry.neural);
    expect(platformRuntime.registries.shaders.lookup("AX-SHD-003")).toBe(AXShaderRegistry.crystal);
    expect(platformRuntime.registries.shaders.lookup("AX-SHD-004")).toBe(AXShaderRegistry.energy);

    core.dispose();
    renderer.dispose();
  });

  it("initializes AXCoreRoot and registers all five rendering layers", async () => {
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera();
    const renderer = new THREE.WebGLRenderer({ alpha: true });
    const context: AXRenderContext = { scene, camera, renderer };

    // Test Variant B (default)
    AXCoreConfig.geometry.activeVariant = "B";
    let core = new AXCoreRoot(context);
    expect(core.modules).toHaveLength(8);
    await core.initialize();
    core.dispose();

    // Test Variant A (Pure Crystalline - no particles or lattice)
    AXCoreConfig.geometry.activeVariant = "A";
    core = new AXCoreRoot(context);
    expect(core.modules).toHaveLength(6);
    await core.initialize();
    core.dispose();

    // Test Variant C (Quantum Core)
    AXCoreConfig.geometry.activeVariant = "C";
    core = new AXCoreRoot(context);
    expect(core.modules).toHaveLength(8);
    await core.initialize();
    core.dispose();

    renderer.dispose();
  });

  it("applies dynamic mutation parameters correctly on update cycles", async () => {
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera();
    const renderer = new THREE.WebGLRenderer({ alpha: true });
    const context: AXRenderContext = { scene, camera, renderer };

    AXCoreConfig.geometry.activeVariant = "B";
    const core = new AXCoreRoot(context);
    await core.initialize();

    const testState: AXRuntimeStateData = {
      geometry: { scale: 1.4, deformation: 0.2 },
      materials: { color: "#ffffff", emission: 1.8 },
      particles: { velocity: 2.0, density: 0.5 },
      lighting: { intensity: 1.5 },
    };

    core.update(testState, 0.1);

    // Verify state mutation is parsed and applied to module structures
    expect(testState.geometry.scale).toBeCloseTo(1.25, 2); // Lerped scale (1.0 -> 1.4 over 0.1 animation controller step with exp rate 10)

    core.dispose();
    renderer.dispose();
  });
});

describe("Platform Runtime Services", () => {
  it("enforces loose coupling via EventBus publish and subscribe", () => {
    const { events: eventBus } = platformRuntime.services;
    let fired = false;
    const unsubscribe = eventBus.subscribe("test:event", (data) => {
      expect(data.val).toBe(42);
      fired = true;
    });
    eventBus.publish("test:event", { val: 42 });
    expect(fired).toBe(true);
    unsubscribe();
  });

  it("handles registry registers, lookups, and validations correctly", () => {
    const registry = platformRuntime.registries.shaders;
    registry.register("test-shader", { vertexShader: "void main() {}", fragmentShader: "void main() {}" });
    const match = registry.lookup("test-shader");
    expect(match).toBeDefined();
    expect(match?.vertexShader).toBe("void main() {}");

    // Invalid entry check
    expect(() => registry.register("invalid", { vertexShader: "", fragmentShader: "" })).toThrow();
  });

  it("evaluates rules deterministically in complianceService", () => {
    const { compliance: complianceService } = platformRuntime.services;
    const results = complianceService.evaluate({ fps: 45, drawCalls: 5 });
    const fpsResult = results.find((r) => r.metric === "fps");
    expect(fpsResult).toBeDefined();
    expect(fpsResult?.status).toBe("CRITICAL");

    const overall = complianceService.getOverallStatus(results);
    expect(overall.status).toBe("CRITICAL");
  });

  it("executes lifecycle stress tests and detects memory leaks or passes successfully", async () => {
    const result = await platformRuntime.runLifecycleValidationStressTest((ctx) => {
      return {
        initialize: () => {},
        update: () => {},
        dispose: () => {},
      };
    }, 5);
    expect(result.passed).toBe(true);
    expect(result.history).toHaveLength(5);
  });
});
