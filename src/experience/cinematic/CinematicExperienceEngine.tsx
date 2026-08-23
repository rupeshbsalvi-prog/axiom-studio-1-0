import { type CSSProperties, useEffect, useMemo, useRef, useState, useCallback } from "react";
import type { AXRuntimeStateData } from "../../platform/runtime/FrameState";
import type { PlatformRuntime as PlatformRuntimeType } from "../../platform/runtime/PlatformRuntime";
import {
  buildExperienceRenderDirective,
  type ExperienceDirectorState,
  type HardwareTier,
} from "../director/ExperienceDirector";
import type { SignatureFlags, CinematicStats, LifecycleTestStatus, LifecycleTestMetrics } from "./types";
import { CinematicDiagnosticsPanel } from "./CinematicDiagnosticsPanel";

/* v8 ignore start */
export function CinematicExperienceEngine({ directorState }: { directorState: ExperienceDirectorState }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const directorStateRef = useRef(directorState);
  const rendererRef = useRef<any>(null);
  const platformRuntimeRef = useRef<PlatformRuntimeType | null>(null);

  const [engineStatus, setEngineStatus] = useState<"loading" | "ready" | "fallback">("loading");
  const [variant, setVariant] = useState<"A" | "B" | "C">("B");
  const [quality, setQuality] = useState<HardwareTier>(directorState.cue.quality.profile);
  
  const [signature, setSignature] = useState<SignatureFlags>({
    monochrome: false,
    wireframe: false,
    flatDiffuse: false,
    basicShader: false,
    paused: false,
    opaque: false,
    noLights: false,
    noBloom: false,
    scaleMode: "hero",
  });

  const [stats, setStats] = useState<CinematicStats>({
    fps: 60,
    frameTime: 0.0,
    gpuTime: 0.0,
    cpuTime: 0.0,
    drawCalls: 0,
    triangles: 0,
    vertices: 0,
    meshCount: 0,
    gpuMemory: 0.0,
    textureMemory: 0.0,
    geometryMemory: 0.0,
    activeState: "Idle",
    particleCount: 800,
    webglVersion: "WebGL 2.0",
    webglRenderer: "Standard",
    vendor: "Google",
    dpr: 1.0,
    canvasSize: "1920x1080",
    refreshRate: 60,
  });

  // Diagnostic Stress tools
  const [stressCycling, setStressCycling] = useState(false);
  const [continuousResize, setContinuousResize] = useState(false);
  const [performanceStress, setPerformanceStress] = useState(false);
  const [lossSimulation, setLossSimulation] = useState(false);
  const [lifecycleTestStatus, setLifecycleTestStatus] = useState<LifecycleTestStatus>("idle");
  const [lifecycleTestMetrics, setLifecycleTestMetrics] = useState<LifecycleTestMetrics | null>(null);

  const [showDiagnostics] = useState(
    () => typeof window !== "undefined" && new URLSearchParams(window.location.search).has("diagnostics"),
  );

  // Safety cleanup: turn off all stress modes when diagnostics is closed
  useEffect(() => {
    if (showDiagnostics) return;
    setStressCycling(false);
    setContinuousResize(false);
    setPerformanceStress(false);
    setLossSimulation(false);
  }, [showDiagnostics]);

  // Handle rapid cycling interval cleanup
  useEffect(() => {
    if (!stressCycling) return;
    const timer = window.setInterval(() => {
      setVariant((current) => {
        if (current === "A") return "B";
        if (current === "B") return "C";
        return "A";
      });
    }, 1200);
    return () => window.clearInterval(timer);
  }, [stressCycling]);

  useEffect(() => {
    setQuality(directorState.cue.quality.profile);
  }, [directorState.cue.quality.profile]);

  useEffect(() => {
    directorStateRef.current = directorState;
  }, [directorState]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || typeof window === "undefined" || !window.WebGLRenderingContext || quality === "low") {
      setEngineStatus("fallback");
      return;
    }

    let disposed = false;
    let disposeScene = () => {};

    void (async () => {
      setEngineStatus("loading");
      const runtimeModules = await Promise.all([
        import("./threeRuntime"),
        import("../../app/studios/axCore"),
        import("../../app/studios/registry"),
        import("../../platform/runtime/PlatformRuntime"),
        import("../../platform/runtime/FrameState"),
      ]).catch(() => null);
      if (!runtimeModules) {
        if (!disposed) {
          setEngineStatus("fallback");
        }
        return;
      }
      if (disposed) {
        return;
      }
      const [
        THREE,
        { AXCoreConfig, AXCoreRoot },
        { STUDIO_REGISTRY },
        { platformRuntime },
        { AXIOM_CORE_INACTIVE_INTERACTION, createAxiomCoreInteraction },
      ] = runtimeModules;
      platformRuntimeRef.current = platformRuntime;

      const prevVariant = AXCoreConfig.geometry.activeVariant;
      AXCoreConfig.geometry.activeVariant = variant;

      const scene = new THREE.Scene();
      scene.fog = new THREE.FogExp2(0x070809, 0.045);

      const camera = new THREE.PerspectiveCamera(58, window.innerWidth / window.innerHeight, 0.1, 120);
      camera.position.set(0, 0.4, 9);

      const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.7));
      renderer.setSize(window.innerWidth, window.innerHeight);
      rendererRef.current = renderer;

      // WebGL Context Lost / Restored event handling
      const handleContextLost = (e: Event) => {
        e.preventDefault();
        console.log("WebGL context lost.");
        setEngineStatus("fallback");
      };

      const handleContextRestored = () => {
        console.log("WebGL context restored.");
        setEngineStatus("ready");
      };

      canvas.addEventListener("webglcontextlost", handleContextLost);
      canvas.addEventListener("webglcontextrestored", handleContextRestored);

      // Get WebGL Browser Details dynamically
      const gl = renderer.getContext();
      const extension = gl.getExtension("WEBGL_debug_renderer_info");
      const vendorString = extension ? gl.getParameter(extension.UNMASKED_VENDOR_WEBGL) : "Unknown Vendor";
      const rendererString = extension ? gl.getParameter(extension.UNMASKED_RENDERER_WEBGL) : "WebGL Renderer";
      const glVersion = gl.getParameter(gl.VERSION);

      // Initial AXCore context wiring
      const renderContext = { scene, camera, renderer };
      platformRuntime.initialize(renderContext);
      const coreRoot = new AXCoreRoot(renderContext);

      // Dynamic state metadata mapping AXRuntimeStateData state engine profiles
      const activeState: AXRuntimeStateData = {
        geometry: { scale: 1.0, deformation: 0.0 },
        materials: { color: "#69d4e8", emission: 0.85 },
        particles: { velocity: 1.0, density: 0.8 },
        lighting: { intensity: 1.0 },
        interaction: AXIOM_CORE_INACTIVE_INTERACTION,
        signature: {
          monochrome: signature.monochrome,
          wireframe: signature.wireframe,
          paused: signature.paused,
          opaque: signature.opaque,
          noLights: signature.noLights,
          flatDiffuse: signature.flatDiffuse,
          basicShader: signature.basicShader,
          noBloom: signature.noBloom,
        },
        quality: quality,
      };

      Promise.resolve(coreRoot.initialize());

      // Ambient background space elements
      const particleCount = 200;
      const particlePositions = new Float32Array(particleCount * 3);
      for (let index = 0; index < particleCount; index += 1) {
        const radius = 6 + Math.random() * 12;
        const angle = Math.random() * Math.PI * 2;
        particlePositions[index * 3] = Math.cos(angle) * radius;
        particlePositions[index * 3 + 1] = (Math.random() - 0.5) * 6;
        particlePositions[index * 3 + 2] = Math.sin(angle) * radius - 8;
      }

      const particleGeometry = new THREE.BufferGeometry();
      particleGeometry.setAttribute("position", new THREE.BufferAttribute(particlePositions, 3));
      const particleMaterial = new THREE.PointsMaterial({
        color: 0xedd095,
        size: 0.035,
        transparent: true,
        opacity: 0.45,
        depthWrite: false,
      });
      const particles = new THREE.Points(particleGeometry, particleMaterial);
      scene.add(particles);

      const ringGroup = new THREE.Group();
      [2.2, 3.15, 4.2].forEach((radius, index) => {
        const ring = new THREE.Mesh(
          new THREE.TorusGeometry(radius, 0.012, 12, 120),
          new THREE.MeshBasicMaterial({ color: index === 1 ? 0x69d4e8 : 0xe2bd72, transparent: true, opacity: 0.44 }),
        );
        ring.rotation.x = Math.PI / 2 + index * 0.18;
        ring.rotation.y = index * 0.42;
        ringGroup.add(ring);
      });
      scene.add(ringGroup);

      const studioGroup = new THREE.Group();
      STUDIO_REGISTRY.filter((studio) => studio.id !== "mission-control").forEach((studio, index) => {
        const angle = (index / 11) * Math.PI * 2;
        const cube = new THREE.Mesh(
          new THREE.BoxGeometry(0.34, 0.34, 0.34),
          new THREE.MeshStandardMaterial({
            color: index % 3 === 0 ? 0xe2bd72 : index % 3 === 1 ? 0x69d4e8 : 0xd98a78,
            emissive: index % 3 === 1 ? 0x145566 : 0x3a2a16,
            emissiveIntensity: 0.22,
            metalness: 0.4,
            roughness: 0.28,
          }),
        );
        cube.position.set(Math.cos(angle) * 5.4, Math.sin(angle) * 1.6, Math.sin(angle) * 5.4 - 4);
        cube.userData.name = studio.displayName;
        studioGroup.add(cube);
      });
      scene.add(studioGroup);

      let frameId = 0;
      let interaction = AXIOM_CORE_INACTIVE_INTERACTION;
      let lastTime = performance.now();
      let frameCount = 0;
      let hasRenderedFirstFrame = false;

      const handlePointerMove = (event: PointerEvent) => {
        const source = event.pointerType === "touch" ? "touch" : event.pointerType === "pen" ? "pen" : "mouse";
        interaction = createAxiomCoreInteraction(
          event.clientX,
          event.clientY,
          window.innerWidth,
          window.innerHeight,
          source,
        );
      };

      const handlePointerEnd = (event: PointerEvent) => {
        if (event.pointerType === "touch" || event.type === "pointerleave") {
          interaction = AXIOM_CORE_INACTIVE_INTERACTION;
        }
      };

      const handleResize = () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
      };

      window.addEventListener("pointermove", handlePointerMove);
      window.addEventListener("pointerdown", handlePointerMove);
      window.addEventListener("pointerup", handlePointerEnd);
      window.addEventListener("pointercancel", handlePointerEnd);
      window.addEventListener("pointerleave", handlePointerEnd);
      window.addEventListener("resize", handleResize);

      const animate = () => {
        const currentTime = performance.now();
        const deltaTime = Math.min((currentTime - lastTime) * 0.001, 0.1);
        const frameTotalTime = currentTime - lastTime;
        lastTime = currentTime;
        frameCount += 1;

        const elapsed = currentTime * 0.001;
        const currentDirectorState = directorStateRef.current;
        const renderDirective = buildExperienceRenderDirective(currentDirectorState);
        const currentInteraction = signature.paused ? AXIOM_CORE_INACTIVE_INTERACTION : interaction;

        // Continuous Resize Simulation tool
        if (continuousResize) {
          const wiggleW = window.innerWidth + Math.sin(elapsed * 6.0) * 120;
          const wiggleH = window.innerHeight + Math.cos(elapsed * 6.0) * 120;
          camera.aspect = wiggleW / wiggleH;
          camera.updateProjectionMatrix();
          renderer.setSize(wiggleW, wiggleH, false);
        }

        scene.fog = new THREE.FogExp2(0x070809, renderDirective.scene.fogDensity);
        camera.position.x +=
          (renderDirective.cameraTarget.x + currentInteraction.pointerX * 0.18 - camera.position.x) * renderDirective.cameraTarget.easing;
        camera.position.y +=
          (renderDirective.cameraTarget.y + currentInteraction.pointerY * 0.12 - camera.position.y) * renderDirective.cameraTarget.easing;
        camera.position.z += (renderDirective.cameraTarget.z - camera.position.z) * renderDirective.cameraTarget.easing;
        camera.lookAt(0, 0, renderDirective.cameraTarget.lookAtZ);

        // Proximity intensity calculation
        const proximity = currentInteraction.proximity;

        // Mutate dynamic state profile on the animation loop
        activeState.interaction = currentInteraction;

        activeState.geometry.scale = renderDirective.core.geometryScale + Math.sin(elapsed * 2.0) * 0.04 + proximity * 0.12;
        activeState.geometry.deformation = Math.sin(elapsed * 3.5) * 0.15 * proximity;
        activeState.materials.color = signature.monochrome
          ? "#d9d4ca"
          : variant === "C"
            ? "#d08275"
            : variant === "A"
              ? "#e2bd72"
              : renderDirective.scene.accentColor;
        activeState.materials.emission = renderDirective.core.materialEmission + Math.sin(elapsed * 2.5) * 0.2 + proximity * 0.4;
        activeState.particles.velocity = 1.0 + proximity * 1.5;
        activeState.particles.density = renderDirective.core.particleDensity;
        activeState.lighting.intensity =
          renderDirective.core.lightingIntensity + Math.sin(elapsed * 1.2) * 0.15 + proximity * 0.6;
        activeState.latticeActivity = 0.4 + 0.3 * Math.sin(elapsed * 4.0) + proximity * 0.4;

        activeState.signature = {
          monochrome: signature.monochrome,
          wireframe: signature.wireframe,
          paused: signature.paused,
          opaque: signature.opaque,
          noLights: signature.noLights,
          flatDiffuse: signature.flatDiffuse,
          basicShader: signature.basicShader,
          noBloom: signature.noBloom,
        };
        activeState.quality = quality;

        // Update calculations in core layers
        const cpuStart = performance.now();
        coreRoot.update(activeState, deltaTime);
        const cpuEnd = performance.now();

        ringGroup.rotation.y = elapsed * renderDirective.motion.ringOrbitSpeed + currentDirectorState.progress * Math.PI * 1.7;
        ringGroup.rotation.z = elapsed * 0.04;
        studioGroup.rotation.y =
          elapsed * renderDirective.motion.studioOrbitSpeed + currentDirectorState.progress * Math.PI * 2.5;
        particles.rotation.y = elapsed * renderDirective.motion.particleDriftSpeed + currentDirectorState.progress * 0.9;
        particles.rotation.x = currentInteraction.pointerY * 0.035;
        particleMaterial.opacity = 0.22 + renderDirective.core.particleDensity * 0.28;

        // Performance Stress Mode: Artificially busy-wait CPU
        if (performanceStress) {
          const stressStart = performance.now();
          while (performance.now() - stressStart < 16.0) {
            // busy wait
          }
        }

        const renderStart = performance.now();
        renderer.render(scene, camera);
        const renderEnd = performance.now();
        if (!hasRenderedFirstFrame) {
          hasRenderedFirstFrame = true;
          setEngineStatus("ready");
        }

        // GPU Geometry and Memory telemetries
        let geomBytes = 0;
        scene.traverse((obj) => {
          if (obj instanceof THREE.Mesh || obj instanceof THREE.LineSegments || obj instanceof THREE.Points) {
            const geom = obj.geometry;
            for (const attrName in geom.attributes) {
              geomBytes += geom.attributes[attrName].array.byteLength;
            }
            if (geom.index) {
              geomBytes += geom.index.array.byteLength;
            }
          }
        });

        // Build telemetry payload
        const telemetryPayload = {
          fps: Math.round(1.0 / deltaTime),
          frameTime: parseFloat(frameTotalTime.toFixed(1)),
          gpuTime: parseFloat((renderEnd - renderStart).toFixed(2)),
          cpuTime: parseFloat((cpuEnd - cpuStart).toFixed(2)),
          drawCalls: renderer.info.render.calls,
          triangles: renderer.info.render.triangles,
          vertices: renderer.info.render.triangles * 3,
          meshCount: coreRoot.renderModules.length,
          gpuMemory: parseFloat((geomBytes / (1024 * 1024)).toFixed(3)),
          textureMemory: 0.0,
          geometryMemory: parseFloat((geomBytes / 1024).toFixed(1)),
          activeState: `${currentDirectorState.chapter.title} · ${proximity > 0.6 ? "Interactive" : "Directed"}`,
          particleCount: Math.round(currentDirectorState.cue.quality.particleBudget * renderDirective.core.particleDensity),
          webglVersion: glVersion,
          webglRenderer: rendererString,
          vendor: vendorString,
          dpr: window.devicePixelRatio,
          canvasSize: `${renderer.domElement.clientWidth}x${renderer.domElement.clientHeight}`,
          refreshRate: 60,
        };

        // Publish to EventBus
        platformRuntime.services.events.publish("telemetry:updated", telemetryPayload);

        // Collect real-time telemetry stats (Throttled once every 30 frames)
        if (frameCount % 30 === 0) {
          const aggregated = platformRuntime.services.diagnostics.collectAll();
          setStats(aggregated as any);
        }

        frameId = window.requestAnimationFrame(animate);
      };

      animate();

      disposeScene = () => {
        window.cancelAnimationFrame(frameId);
        window.removeEventListener("pointermove", handlePointerMove);
        window.removeEventListener("pointerdown", handlePointerMove);
        window.removeEventListener("pointerup", handlePointerEnd);
        window.removeEventListener("pointercancel", handlePointerEnd);
        window.removeEventListener("pointerleave", handlePointerEnd);
        window.removeEventListener("resize", handleResize);
        canvas.removeEventListener("webglcontextlost", handleContextLost);
        canvas.removeEventListener("webglcontextrestored", handleContextRestored);
        particleGeometry.dispose();
        particleMaterial.dispose();
        ringGroup.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            child.geometry.dispose();
            if (Array.isArray(child.material)) {
              child.material.forEach((m) => m.dispose());
            } else {
              child.material.dispose();
            }
          }
        });
        coreRoot.dispose();
        renderer.dispose();
        AXCoreConfig.geometry.activeVariant = prevVariant;
      };
    })();

    return () => {
      disposed = true;
      rendererRef.current = null;
      platformRuntimeRef.current = null;
      disposeScene();
    };
  }, [variant, quality, signature, continuousResize, performanceStress]);

  // Platform Compliance Engine Threshold Status Evaluator
  const getComplianceStatus = useCallback(() => {
    const runtime = platformRuntimeRef.current;
    if (!runtime) return { label: "PENDING", className: "warn" };
    const results = runtime.services.compliance.evaluate(stats);
    const overall = runtime.services.compliance.getOverallStatus(results);
    return {
      label: overall.status,
      className: overall.status === "CRITICAL" ? "fail" : overall.status === "WARNING" ? "warn" : "pass",
    };
  }, [stats]);

  const handleChangeSignature = useCallback((patch: Partial<SignatureFlags>) => {
    setSignature((current) => ({
      ...current,
      ...patch,
    }));
  }, []);

  const handleSimulateContextLoss = useCallback(() => {
    const renderer = rendererRef.current;
    if (!renderer) return;
    const gl = renderer.getContext();
    const extension = gl.getExtension("WEBGL_lose_context");
    if (!extension) {
      console.warn("WEBGL_lose_context extension is not supported by this browser.");
      return;
    }
    setLossSimulation(true);
    extension.loseContext();
    
    window.setTimeout(() => {
      extension.restoreContext();
      setLossSimulation(false);
    }, 1500);
  }, []);

  const handleRunLifecycleValidation = useCallback(async () => {
    setLifecycleTestStatus("running");
    setLifecycleTestMetrics({ startedAt: Date.now() });

    try {
      const [{ platformRuntime }, { AXCoreRoot }] = await Promise.all([
        import("../../platform/runtime/PlatformRuntime"),
        import("../../app/studios/axCore"),
      ]);
      const result = await platformRuntime.runLifecycleValidationStressTest(
        (ctx) => new AXCoreRoot(ctx),
        100
      );
      if (result.passed) {
        setLifecycleTestStatus("passed");
        setLifecycleTestMetrics({
          completedAt: Date.now(),
          initialMetrics: result.initialMetrics,
          finalMetrics: result.finalMetrics,
          passed: true,
        });
      } else {
        setLifecycleTestStatus("failed");
        setLifecycleTestMetrics({
          completedAt: Date.now(),
          initialMetrics: result.initialMetrics,
          finalMetrics: result.finalMetrics,
          passed: false,
        });
      }
    } catch (err) {
      setLifecycleTestStatus("failed");
      setLifecycleTestMetrics({
        completedAt: Date.now(),
        errors: [err instanceof Error ? err.message : String(err)],
        passed: false,
      });
    }
  }, []);

  const handleResetDiagnostics = useCallback(() => {
    setSignature({
      monochrome: false,
      wireframe: false,
      flatDiffuse: false,
      basicShader: false,
      paused: false,
      opaque: false,
      noLights: false,
      noBloom: false,
      scaleMode: "hero",
    });
    setStressCycling(false);
    setContinuousResize(false);
    setPerformanceStress(false);
    setLifecycleTestStatus("idle");
    setLifecycleTestMetrics(null);
  }, []);

  const compliance = useMemo(() => getComplianceStatus(), [getComplianceStatus]);
  const fallbackDirective = useMemo(() => buildExperienceRenderDirective(directorState), [directorState]);
  const fallbackStyle = {
    "--fallback-accent": fallbackDirective.scene.accentColor,
    "--fallback-core-scale": fallbackDirective.core.geometryScale.toFixed(3),
    "--fallback-core-glow": `${90 + 70 * fallbackDirective.core.particleDensity}px`,
    "--fallback-core-opacity": (0.36 + 0.28 * fallbackDirective.core.particleDensity).toFixed(3),
    "--fallback-ring-opacity": (0.22 + 0.26 * fallbackDirective.core.particleDensity).toFixed(3),
    "--fallback-star-opacity": (0.18 + 0.2 * fallbackDirective.core.particleDensity).toFixed(3),
    "--fallback-ring-duration": `${Math.max(18, 60 - fallbackDirective.motion.ringOrbitSpeed * 320).toFixed(1)}s`,
    "--fallback-star-duration": `${Math.max(24, 92 - fallbackDirective.motion.particleDriftSpeed * 900).toFixed(1)}s`,
  } as CSSProperties;

  const readinessCopy = {
    loading: {
      label: "WEOS initializing",
      detail: `Preparing ${directorState.chapter.title}`,
    },
    ready: {
      label: "WEOS live",
      detail: `${directorState.chapter.title} director scene active`,
    },
    fallback: {
      label: "WEOS accessible scene",
      detail: `${directorState.chapter.title} fallback active`,
    },
  }[engineStatus];

  return (
    <div
      className={`cinematic-engine scale-${signature.scaleMode} status-${engineStatus}`}
      data-chapter={directorState.chapter.id}
      aria-label="Persistent cinematic experience engine"
      style={fallbackStyle}
    >
      <canvas ref={canvasRef} className="cinematic-webgl" aria-hidden="true" />
      <div className="cinematic-fallback" aria-hidden="true">
        <div className="fallback-core" />
        <div className="fallback-ring ring-a" />
        <div className="fallback-ring ring-b" />
        <div className="fallback-starfield" />
      </div>
      <div className="cinematic-readiness" aria-label="Cinematic engine readiness" role="status">
        <span>{readinessCopy.label}</span>
        <strong>{readinessCopy.detail}</strong>
      </div>

      {showDiagnostics && (
        <CinematicDiagnosticsPanel
          quality={quality}
          onChangeQuality={setQuality}
          variant={variant}
          onChangeVariant={setVariant}
          signature={signature}
          onChangeSignature={handleChangeSignature}
          stressCycling={stressCycling}
          onToggleStressCycling={() => setStressCycling((prev) => !prev)}
          continuousResize={continuousResize}
          onToggleContinuousResize={() => setContinuousResize((prev) => !prev)}
          performanceStress={performanceStress}
          onTogglePerformanceStress={() => setPerformanceStress((prev) => !prev)}
          lossSimulation={lossSimulation}
          onSimulateContextLoss={handleSimulateContextLoss}
          lifecycleTestStatus={lifecycleTestStatus}
          lifecycleTestMetrics={lifecycleTestMetrics}
          onRunLifecycleValidation={handleRunLifecycleValidation}
          onResetDiagnostics={handleResetDiagnostics}
          stats={stats}
          compliance={compliance}
        />
      )}
    </div>
  );
}
/* v8 ignore stop */
