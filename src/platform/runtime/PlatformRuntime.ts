import * as THREE from "three";
import { RuntimeContext } from "./RuntimeContext";
import { eventBus } from "../services/EventBus";
import { stateService } from "../services/StateService";
import { diagnosticsService } from "../services/DiagnosticsService";
import { capabilityService } from "../services/CapabilityService";
import { complianceService } from "../services/ComplianceService";
import { shaderRegistry } from "../registries/ShaderRegistry";
import { materialRegistry } from "../registries/MaterialRegistry";
import { assetRegistry } from "../registries/AssetRegistry";

import { PerformanceProvider } from "../diagnostics/providers/PerformanceProvider";
import { GeometryProvider } from "../diagnostics/providers/GeometryProvider";
import { RuntimeProvider } from "../diagnostics/providers/RuntimeProvider";
import { BrowserProvider } from "../diagnostics/providers/BrowserProvider";
import { MemoryProvider } from "../diagnostics/providers/MemoryProvider";
import { ValidationProvider } from "../diagnostics/providers/ValidationProvider";

export interface LifecycleMetrics {
  cycle: number;
  geometries: number;
  textures: number;
  programs: number;
}

export class PlatformRuntime {
  private context: RuntimeContext | null = null;
  private activeStudios: any[] = [];

  readonly registries = {
    shaders: shaderRegistry,
    materials: materialRegistry,
    assets: assetRegistry,
  };

  readonly services = {
    events: eventBus,
    state: stateService,
    diagnostics: diagnosticsService,
    capabilities: capabilityService,
    compliance: complianceService,
  };

  initialize(context: RuntimeContext): void {
    this.context = context;
    
    // Detect capacities immediately
    this.services.capabilities.detectCapabilities(context.renderer.getContext());
    
    // Register standard diagnostics providers
    this.services.diagnostics.registerProvider(new PerformanceProvider());
    this.services.diagnostics.registerProvider(new GeometryProvider());
    this.services.diagnostics.registerProvider(new RuntimeProvider());
    this.services.diagnostics.registerProvider(new BrowserProvider());
    this.services.diagnostics.registerProvider(new MemoryProvider());
    this.services.diagnostics.registerProvider(new ValidationProvider());
    
    this.services.diagnostics.initializeAll();
    
    this.services.events.publish("runtime:initialized", { context });
  }

  getContext(): RuntimeContext | null {
    return this.context;
  }

  registerStudio(studio: any): void {
    this.activeStudios.push(studio);
    this.services.events.publish("runtime:studio:registered", studio);
  }

  unregisterStudio(studio: any): void {
    this.activeStudios = this.activeStudios.filter((s) => s !== studio);
    this.services.events.publish("runtime:studio:unregistered", studio);
  }

  update(deltaTime: number): void {
    this.services.events.publish("runtime:update", { deltaTime });
  }

  dispose(): void {
    this.services.events.publish("runtime:disposing", {});
    this.activeStudios = [];
    this.context = null;
  }

  /**
   * Resource Lifetime lifecycle validation test.
   * Executes create-init-update-render-dispose cycles.
   * Tracks geometries, textures, and programs counts to identify resource leaks.
   */
  async runLifecycleValidationStressTest(
    factory: (ctx: RuntimeContext) => any,
    cyclesCount = 100
  ): Promise<{
    passed: boolean;
    initialMetrics: LifecycleMetrics;
    finalMetrics: LifecycleMetrics;
    history: LifecycleMetrics[];
    error?: string;
  }> {
    const history: LifecycleMetrics[] = [];
    
    // Create a temporary sandboxed WebGLRenderer/Scene context
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera();
    const canvas = document.createElement("canvas");
    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true });
    
    const ctx: RuntimeContext = { scene, camera, renderer };
    const getMetrics = (cycleIndex: number): LifecycleMetrics => {
      const info = renderer.info;
      const memory = info ? (info as any).memory : null;
      const programs = info ? (info as any).programs : null;
      return {
        cycle: cycleIndex,
        geometries: memory ? memory.geometries : 0,
        textures: memory ? memory.textures : 0,
        programs: programs ? (Array.isArray(programs) ? programs.length : (typeof programs === "number" ? programs : 0)) : 0,
      };
    };

    const initialMetrics = getMetrics(0);

    try {
      for (let i = 1; i <= cyclesCount; i += 1) {
        // 1. Create and Initialize
        const instance = factory(ctx);
        if (instance.initialize) {
          await instance.initialize();
        }

        // 2. Update
        if (instance.update) {
          const dummyState: any = {
            geometry: { scale: 1.0, deformation: 0.0 },
            materials: { color: "#69d4e8", emission: 0.85 },
            particles: { velocity: 1.0, density: 0.8 },
            lighting: { intensity: 1.0 },
            quality: "high",
          };
          
          // If instance is axCoreRoot, let's call update.
          // For axCoreRoot, computeFrameState expects state and deltaTime.
          instance.update(dummyState, 0.016);
        }

        // 3. Render
        renderer.render(scene, camera);

        // 4. Dispose
        if (instance.dispose) {
          instance.dispose();
        }

        // Record metrics
        history.push(getMetrics(i));
      }
    } catch (err: any) {
      renderer.dispose();
      return {
        passed: false,
        initialMetrics,
        finalMetrics: getMetrics(cyclesCount),
        history,
        error: err.message || String(err),
      };
    }

    const finalMetrics = getMetrics(cyclesCount);
    renderer.dispose();

    // Leak check: compare final memory objects with initial
    const leakDetected =
      finalMetrics.geometries > initialMetrics.geometries ||
      finalMetrics.textures > initialMetrics.textures ||
      finalMetrics.programs > initialMetrics.programs;

    return {
      passed: !leakDetected,
      initialMetrics,
      finalMetrics,
      history,
    };
  }
}

export const platformRuntime = new PlatformRuntime();
