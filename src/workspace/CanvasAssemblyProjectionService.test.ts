import { describe, expect, it } from "vitest";
import type { CanvasAssemblyPlan } from "./CanvasPreviewIntakeService";
import { projectAssemblyPlanToCanvasPreview } from "./CanvasAssemblyProjectionService";

function createPlan(overrides: Partial<CanvasAssemblyPlan> = {}): CanvasAssemblyPlan {
  return {
    id: "plan-1",
    sourcePreviewId: "preview-1",
    runtimeId: "mock-motion-studio",
    actionId: "renderMotionFrame",
    studioId: "motion",
    status: "assembly_ready",
    createdAtUtc: new Date().toISOString(),
    canvas: {
      width: 1920,
      height: 1080,
      aspectRatio: "16:9",
      background: "transparent",
    },
    elements: [
      {
        id: "element-1",
        sourceLayerId: "layer-1",
        label: "Primary motion layer",
        type: "motion",
        bounds: { x: 10, y: 20, width: 300, height: 200 },
        opacity: 1,
        blendMode: "normal",
        source: "runtime-mock",
      },
    ],
    assemblySteps: ["Project preview layer"],
    exportTargets: ["canvas-preview-json"],
    security: {
      dryRun: true,
      noExecutionPerformed: true,
      userApproved: true,
      runtimeCodeLoaded: false,
      moduleUrlExecuted: false,
    },
    ...overrides,
  };
}

describe("Phase 15 — CanvasAssemblyProjectionService", () => {
  it("projects an approved assembly plan into preview-only canvas elements", () => {
    const result = projectAssemblyPlanToCanvasPreview(createPlan());

    expect(result.success).toBe(true);
    expect(result.projection).toMatchObject({
      assemblyPlanId: "plan-1",
      studioId: "motion",
      status: "projected_preview",
      canvas: {
        width: 1920,
        height: 1080,
      },
      security: {
        previewOnly: true,
        noExecutionPerformed: true,
        runtimeCodeLoaded: false,
        moduleUrlExecuted: false,
        authoritativeCanvasMutated: false,
      },
    });
    expect(result.projection?.elements).toHaveLength(1);
    expect(result.projection?.elements[0]).toMatchObject({
      sourceAssemblyElementId: "element-1",
      sourceLayerId: "layer-1",
      previewOnly: true,
    });
  });

  it("rejects projection without explicit user approval", () => {
    const result = projectAssemblyPlanToCanvasPreview(
      createPlan({
        security: {
          dryRun: true,
          noExecutionPerformed: true,
          userApproved: false as true,
          runtimeCodeLoaded: false,
          moduleUrlExecuted: false,
        },
      })
    );

    expect(result.success).toBe(false);
    expect(result.diagnostics[0].code).toBe("missing_user_approval");
  });

  it("rejects unsafe assembly plans", () => {
    const result = projectAssemblyPlanToCanvasPreview(
      createPlan({
        security: {
          dryRun: true,
          noExecutionPerformed: true,
          userApproved: true,
          runtimeCodeLoaded: true as false,
          moduleUrlExecuted: false,
        },
      })
    );

    expect(result.success).toBe(false);
    expect(result.diagnostics[0].code).toBe("unsafe_security_flags");
  });

  it("rejects empty assembly plans", () => {
    const result = projectAssemblyPlanToCanvasPreview(createPlan({ elements: [] }));

    expect(result.success).toBe(false);
    expect(result.diagnostics[0].code).toBe("empty_assembly_elements");
  });

  it("preserves sandbox provenance metadata from plan to projection", () => {
    const provMetadata = {
      requiredAdapterContract: "photo-provider-adapter.v1",
      provenance: {
        type: "photo-provider-sandbox-provenance.v1",
        sandboxRunId: "run-123",
        jobId: "job-123",
        simulatedAtUtc: new Date().toISOString(),
        adapter: { providerId: "test", displayName: "Test adapter" },
        securityEvidence: {
          providerExecuted: false,
          runtimeCodeLoaded: false,
          moduleUrlExecuted: false,
          networkAccessed: false,
          providerApiCalled: false,
        }
      }
    };
    const plan = createPlan({ metadata: provMetadata });
    const result = projectAssemblyPlanToCanvasPreview(plan);

    expect(result.success).toBe(true);
    expect(result.projection?.metadata).toBeDefined();
    expect((result.projection?.metadata?.provenance as any).sandboxRunId).toBe("run-123");
  });
});
