// ---------------------------------------------------------------------------
// Phase 12 — RuntimeMockActionRegistry (PRODUCTION)
//
// Trusted local registry mapping runtimeId + actionId → mock simulation handler.
// This is the ONLY source of executable dry-run behavior in Phase 12.
//
// SECURITY REQUIREMENTS:
//   - This file must never import() or eval() runtime package code.
//   - This file must never read manifest.entry.moduleUrl for execution.
//   - This file must never auto-populate handlers from manifest metadata.
//   - registerMockHandlersForTest is NOT exported from this file.
//     Use RuntimeMockActionRegistry.test-utils.ts for test-only registration.
// ---------------------------------------------------------------------------

import type { RuntimeDryRunPreviewContractV1 } from "./RuntimeActionDispatchTypes";

export type MockDryRunHandler = (
  payload?: unknown,
  context?: { runtimeId: string; actionId: string }
) => Promise<{
  status: "simulated";
  output: unknown;
  preview?: RuntimeDryRunPreviewContractV1;
  logs: string[];
  noExecutionPerformed: true;
  dryRun: true;
}>;

// Internal handler map — never populated from manifest metadata
const handlerMap: Map<string, Map<string, MockDryRunHandler>> = new Map();

function registerHandlers(
  runtimeId: string,
  handlers: Record<string, MockDryRunHandler>
): void {
  if (!handlerMap.has(runtimeId)) {
    handlerMap.set(runtimeId, new Map());
  }
  const byAction = handlerMap.get(runtimeId)!;
  for (const [actionId, handler] of Object.entries(handlers)) {
    byAction.set(actionId, handler);
  }
}

/**
 * Retrieves the trusted local mock handler for a given runtime + action.
 * Returns undefined if no handler is registered — callers must fail closed.
 */
export function getMockHandler(
  runtimeId: string,
  actionId: string
): MockDryRunHandler | undefined {
  return handlerMap.get(runtimeId)?.get(actionId);
}

// ---------------------------------------------------------------------------
// Static pre-population for first-party local development runtimes.
// These are the only handlers that ship in production.
// ---------------------------------------------------------------------------
registerHandlers("mock-motion-studio", {
  renderMotionFrame: async (payload) => {
    const frame =
      typeof payload === "object" &&
      payload !== null &&
      "frame" in payload &&
      typeof (payload as Record<string, unknown>).frame === "number"
        ? (payload as Record<string, unknown>).frame
        : 0;
    return {
      status: "simulated",
      output: { frame, status: "rendered", durationMs: 45 },
      preview: {
        contractVersion: "runtime-dry-run-preview.v1",
        kind: "canvas_preview",
        title: `Motion Frame ${frame} Preview`,
        summary: "Transparent-background motion frame assembled from trusted local mock data.",
        studioId: "motion",
        canvas: {
          width: 1920,
          height: 1080,
          aspectRatio: "16:9",
          background: "transparent",
        },
        layers: [
          {
            id: "motion-subject",
            label: "Primary motion subject",
            type: "motion",
            bounds: { x: 512, y: 180, width: 896, height: 620 },
            opacity: 1,
            blendMode: "normal",
            source: "runtime-mock",
          },
          {
            id: "motion-glow",
            label: "Directional glow pass",
            type: "effect",
            bounds: { x: 420, y: 120, width: 1080, height: 760 },
            opacity: 0.72,
            blendMode: "screen",
            source: "runtime-mock",
          },
        ],
        assemblySteps: [
          "Validate promoted runtime and active capability grants.",
          "Simulate frame layout on a transparent 16:9 canvas.",
          "Return layer bounds for future canvas assembly.",
        ],
        exportTargets: ["transparent-png-sequence", "canvas-preview-json"],
        estimatedDurationMs: 45,
        approvedForCanvasAssembly: false,
        security: {
          dryRun: true,
          noExecutionPerformed: true,
          runtimeCodeLoaded: false,
          moduleUrlExecuted: false,
        },
      },
      logs: [`[dry-run] renderMotionFrame(frame=${frame}) simulated`],
      noExecutionPerformed: true,
      dryRun: true,
    };
  },
  exportLottie: async () => {
    return {
      status: "simulated",
      output: {
        path: "/exports/motion-composition.json",
        type: "Lottie",
        bytes: 1420,
      },
      preview: {
        contractVersion: "runtime-dry-run-preview.v1",
        kind: "export_preview",
        title: "Lottie Export Preview",
        summary: "Dry-run export manifest for a motion composition with transparent background support.",
        studioId: "motion",
        canvas: {
          width: 1920,
          height: 1080,
          aspectRatio: "16:9",
          background: "transparent",
        },
        layers: [
          {
            id: "lottie-export",
            label: "Lottie composition package",
            type: "export",
            bounds: { x: 0, y: 0, width: 1920, height: 1080 },
            opacity: 1,
            blendMode: "normal",
            source: "export",
          },
        ],
        assemblySteps: [
          "Inspect simulated composition output.",
          "Prepare transparent-background export target metadata.",
          "Return export preview without writing files.",
        ],
        exportTargets: ["lottie-json", "transparent-webm-preview"],
        estimatedDurationMs: 60,
        approvedForCanvasAssembly: false,
        security: {
          dryRun: true,
          noExecutionPerformed: true,
          runtimeCodeLoaded: false,
          moduleUrlExecuted: false,
        },
      },
      logs: ["[dry-run] exportLottie() simulated"],
      noExecutionPerformed: true,
      dryRun: true,
    };
  },
});

registerHandlers("mock-vector-studio", {
  generateVectorComposition: async (payload) => {
    const plan =
      typeof payload === "object" &&
      payload !== null &&
      "plan" in payload &&
      typeof (payload as Record<string, unknown>).plan === "object"
        ? (payload as Record<string, unknown>).plan
        : null;

    const canvas = (plan && typeof plan === "object" && "canvas" in plan && typeof (plan as any).canvas === "object")
      ? (plan as any).canvas
      : { width: 1024, height: 1024, aspectRatio: "1:1", background: "#0b0f19" };

    return {
      status: "simulated",
      output: { status: "success", layout: "vector-simulation" },
      preview: {
        contractVersion: "runtime-dry-run-preview.v1",
        kind: "canvas_preview",
        title: "Vector Composition Preview",
        summary: "Dry-run vector composition assembled from trusted local mock shapes.",
        studioId: "vector",
        canvas: {
          width: canvas.width || 1024,
          height: canvas.height || 1024,
          aspectRatio: (canvas.width / canvas.height === 1920 / 1080) ? "16:9" : "1:1",
          background: "solid",
        },
        layers: [
          {
            id: "vector-bg-layer",
            label: "Vector background shape",
            type: "vector",
            bounds: { x: 0, y: 0, width: canvas.width || 1024, height: canvas.height || 1024 },
            opacity: 1,
            blendMode: "normal",
            source: "runtime-mock",
          },
          {
            id: "vector-subject-layer",
            label: "Primary vector graphic",
            type: "vector",
            bounds: { x: (canvas.width || 1024) * 0.25, y: (canvas.height || 1024) * 0.25, width: (canvas.width || 1024) * 0.5, height: (canvas.height || 1024) * 0.5 },
            opacity: 1,
            blendMode: "normal",
            source: "runtime-mock",
          },
        ],
        assemblySteps: [
          "Validate promoted vector runtime permissions.",
          "Assemble vector layers from dry-run preview contract.",
          "Render preview bounds for review approval.",
        ],
        exportTargets: ["svg-xml", "raster-png"],
        estimatedDurationMs: 30,
        approvedForCanvasAssembly: false,
        security: {
          dryRun: true,
          noExecutionPerformed: true,
          runtimeCodeLoaded: false,
          moduleUrlExecuted: false,
        },
      },
      logs: ["[dry-run] generateVectorComposition() simulated"],
      noExecutionPerformed: true,
      dryRun: true,
    };
  },
  exportSvg: async () => {
    return {
      status: "simulated",
      output: {
        path: "/exports/vector-composition.svg",
        type: "SVG",
        bytes: 840,
      },
      preview: {
        contractVersion: "runtime-dry-run-preview.v1",
        kind: "export_preview",
        title: "SVG Export Preview",
        summary: "Dry-run SVG export manifest for vector elements.",
        studioId: "vector",
        canvas: {
          width: 1024,
          height: 1024,
          aspectRatio: "1:1",
          background: "solid",
        },
        layers: [
          {
            id: "svg-export-layer",
            label: "SVG composition package",
            type: "export",
            bounds: { x: 0, y: 0, width: 1024, height: 1024 },
            opacity: 1,
            blendMode: "normal",
            source: "export",
          },
        ],
        assemblySteps: [
          "Verify SVG export metadata.",
          "Export mock SVG document stream.",
        ],
        exportTargets: ["svg-xml"],
        estimatedDurationMs: 25,
        approvedForCanvasAssembly: false,
        security: {
          dryRun: true,
          noExecutionPerformed: true,
          runtimeCodeLoaded: false,
          moduleUrlExecuted: false,
        },
      },
      logs: ["[dry-run] exportSvg() simulated"],
      noExecutionPerformed: true,
      dryRun: true,
    };
  },
});

// ---------------------------------------------------------------------------
// Phase 20 — mock-photo-studio dry-run handlers
//
// SECURITY: This handler returns static simulated data only.
// It does NOT call photoApi, generatePhotoComposition, or any provider.
// ---------------------------------------------------------------------------
registerHandlers("mock-photo-studio", {
  generatePhotoLayout: async (payload) => {
    const plan =
      typeof payload === "object" &&
      payload !== null &&
      "plan" in payload &&
      typeof (payload as Record<string, unknown>).plan === "object"
        ? (payload as Record<string, unknown>).plan
        : null;

    const canvasWidth =
      plan && typeof plan === "object" && "canvasSize" in plan
        ? ((plan as any).canvasSize?.width ?? 1080)
        : 1080;
    const canvasHeight =
      plan && typeof plan === "object" && "canvasSize" in plan
        ? ((plan as any).canvasSize?.height ?? 1080)
        : 1080;
    const providerRequest =
      typeof payload === "object" &&
      payload !== null &&
      "providerRequest" in payload &&
      typeof (payload as Record<string, unknown>).providerRequest === "object" &&
      (payload as Record<string, unknown>).providerRequest !== null
        ? (payload as Record<string, unknown>).providerRequest
        : null;
    const providerName =
      typeof providerRequest === "object" &&
      providerRequest &&
      "provider" in providerRequest &&
      typeof (providerRequest as any).provider === "object"
        ? ((providerRequest as any).provider?.requestedName ?? "unassigned-photo-provider")
        : "unassigned-photo-provider";
    const providerLayers =
      typeof providerRequest === "object" &&
      providerRequest !== null &&
      "layers" in providerRequest &&
      Array.isArray((providerRequest as Record<string, unknown>).layers)
        ? (providerRequest as Record<string, unknown>).layers as Array<Record<string, unknown>>
        : [];
    const mappedProviderLayers: RuntimeDryRunPreviewContractV1["layers"] = providerLayers.map((layer, index) => {
      const inset = Math.min(index * 32, Math.floor(Math.min(canvasWidth, canvasHeight) / 4));
      const type = layer.type === "text" || layer.type === "effect" ? layer.type : "image";
      const blendMode =
        layer.blendMode === "multiply" ||
        layer.blendMode === "screen" ||
        layer.blendMode === "overlay"
          ? layer.blendMode
          : "normal";
      return {
        id: `photo-object-${index + 1}`,
        label: typeof layer.name === "string" && layer.name.trim() ? layer.name.trim() : `Photo object ${index + 1}`,
        type,
        bounds: {
          x: inset,
          y: inset,
          width: canvasWidth - inset * 2,
          height: canvasHeight - inset * 2,
        },
        opacity: typeof layer.opacity === "number" && layer.opacity >= 0 && layer.opacity <= 1 ? layer.opacity : 1,
        blendMode,
        source: "runtime-mock",
      };
    });

    return {
      status: "simulated",
      output: {
        status: "success",
        layout: "photo-simulation",
        providerRequestStaged: providerRequest !== null,
        providerExecuted: false,
      },
      preview: {
        contractVersion: "runtime-dry-run-preview.v1",
        kind: "photo_layout_preview",
        title: "Photo Composition Layout Preview",
        summary: `Dry-run photo composition layout assembled from trusted local mock data. Provider request '${providerName}' staged only; no provider execution performed.`,
        studioId: "photo",
        canvas: {
          width: canvasWidth,
          height: canvasHeight,
          aspectRatio: canvasWidth === canvasHeight ? "1:1" : "16:9",
          background: "solid",
        },
        layers: mappedProviderLayers.length > 0 ? mappedProviderLayers : [
          {
            id: "photo-bg-layer",
            label: "Background fill layer",
            type: "image",
            bounds: { x: 0, y: 0, width: canvasWidth, height: canvasHeight },
            opacity: 1,
            blendMode: "normal",
            source: "runtime-mock",
          },
          {
            id: "photo-subject-layer",
            label: "Primary subject layer",
            type: "image",
            bounds: {
              x: Math.round(canvasWidth * 0.1),
              y: Math.round(canvasHeight * 0.1),
              width: Math.round(canvasWidth * 0.8),
              height: Math.round(canvasHeight * 0.8),
            },
            opacity: 1,
            blendMode: "normal",
            source: "runtime-mock",
          },
          {
            id: "photo-effect-layer",
            label: "Lighting / effect overlay",
            type: "effect",
            bounds: { x: 0, y: 0, width: canvasWidth, height: canvasHeight },
            opacity: 0.65,
            blendMode: "screen",
            source: "runtime-mock",
          },
        ],
        assemblySteps: [
          "Validate promoted photo runtime permissions.",
          "Simulate layered composition from blueprint metadata.",
          "Return layer bounds for canvas preview intake.",
        ],
        exportTargets: ["composited-png", "axpkg-json"],
        estimatedDurationMs: 40,
        approvedForCanvasAssembly: false,
        security: {
          dryRun: true,
          noExecutionPerformed: true,
          runtimeCodeLoaded: false,
          moduleUrlExecuted: false,
        },
        metadata: {
          phase: "21",
          requiredAdapterContract: "photo-provider-adapter.v1",
          providerRequest,
          providerRequestStaged: providerRequest !== null,
          providerExecuted: false,
          approvedForProviderExecution: false,
        },
      },
      logs: ["[dry-run] generatePhotoLayout() simulated with provider request staging only — no provider execution"],
      noExecutionPerformed: true,
      dryRun: true,
    };
  },
});
