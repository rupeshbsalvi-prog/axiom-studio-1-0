import { beforeEach, describe, expect, it } from "vitest";
import { createProjectDraft } from "../app/projects/projectDraft";
import type { CanvasSliceProjection } from "../app/projects/projectDraft";
import {
  applyCanvasProjectionToDraft,
  rollbackCanvasProjectionMutation,
} from "./CanvasApplyService";
import {
  clearWorkspaceAuditEvents,
  getWorkspaceAuditEvents,
} from "./WorkspaceAuditService";

function createProjection(overrides: Partial<CanvasSliceProjection> = {}): CanvasSliceProjection {
  return {
    id: "projection-1",
    assemblyPlanId: "plan-1",
    studioId: "motion",
    status: "projected_preview",
    createdAtUtc: new Date().toISOString(),
    canvas: {
      width: 1920,
      height: 1080,
      aspectRatio: "16:9",
      background: "transparent",
    },
    elements: [
      {
        id: "projection-element-1",
        sourceAssemblyElementId: "assembly-element-1",
        sourceLayerId: "layer-1",
        label: "Motion layer",
        type: "motion",
        bounds: { x: 0, y: 0, width: 400, height: 300 },
        opacity: 1,
        blendMode: "normal",
        source: "runtime-mock",
        previewOnly: true,
      },
    ],
    security: {
      previewOnly: true,
      noExecutionPerformed: true,
      runtimeCodeLoaded: false,
      moduleUrlExecuted: false,
      authoritativeCanvasMutated: false,
    },
    ...overrides,
  };
}

describe("Phase 16 — CanvasApplyService", () => {
  beforeEach(() => {
    clearWorkspaceAuditEvents();
  });

  it("rejects applying a projection without explicit confirmation", () => {
    const project = createProjectDraft({ name: "Apply", intent: "", targetStudioId: "photo" });

    const result = applyCanvasProjectionToDraft({
      project,
      projection: createProjection(),
      userConfirmed: false,
    });

    expect(result.success).toBe(false);
    expect(result.diagnostics[0].code).toBe("missing_user_confirmation");
    expect(project.canvas.motion).toBeUndefined();
  });

  it("applies a confirmed projection to an authoritative canvas slice immutably", () => {
    const project = createProjectDraft({ name: "Apply", intent: "", targetStudioId: "photo" });

    const result = applyCanvasProjectionToDraft({
      project,
      projection: createProjection(),
      userConfirmed: true,
      actorId: "tester",
    });

    expect(result.success).toBe(true);
    expect(project.canvas.motion).toBeUndefined();
    expect(result.project?.canvas.motion.elements).toHaveLength(1);
    expect(result.project?.canvas.motion.elements[0]).toMatchObject({
      sourceProjectionId: "projection-1",
      sourceProjectionElementId: "projection-element-1",
      previewOnly: false,
      appliedFromProjection: true,
    });
    expect(result.mutation).toMatchObject({
      projectionId: "projection-1",
      studioId: "motion",
      status: "applied",
      security: {
        userConfirmed: true,
        authoritativeCanvasMutated: true,
        reversible: true,
      },
    });
  });

  it("records an apply audit event with rollback metadata", () => {
    const project = createProjectDraft({ name: "Apply", intent: "", targetStudioId: "photo" });

    const result = applyCanvasProjectionToDraft({
      project,
      projection: createProjection(),
      userConfirmed: true,
      actorId: "tester",
    });

    expect(result.success).toBe(true);
    const event = getWorkspaceAuditEvents().find((item) => item.type === "canvas_projection_applied");
    expect(event?.metadata).toMatchObject({
      mutationId: result.mutation?.id,
      projectionId: "projection-1",
      authoritativeCanvasMutated: true,
      reversible: true,
    });
  });

  it("rolls back an applied mutation to the previous canvas elements", () => {
    const project = createProjectDraft({ name: "Rollback", intent: "", targetStudioId: "motion" });
    project.canvas.motion.elements = [{ id: "existing", label: "Existing" }];

    const applied = applyCanvasProjectionToDraft({
      project,
      projection: createProjection(),
      userConfirmed: true,
    });

    const rolledBack = rollbackCanvasProjectionMutation({
      project: applied.project!,
      mutationId: applied.mutation!.id,
      reason: "User rejected applied result.",
    });

    expect(rolledBack.success).toBe(true);
    expect(rolledBack.project?.canvas.motion.elements).toEqual([{ id: "existing", label: "Existing" }]);
    expect(rolledBack.mutation?.status).toBe("rolled_back");
    expect(rolledBack.mutation?.rollbackReason).toBe("User rejected applied result.");
    expect(getWorkspaceAuditEvents().map((event) => event.type)).toContain("canvas_projection_rolled_back");
  });

  it("does not roll back the same mutation twice", () => {
    const project = createProjectDraft({ name: "Rollback", intent: "", targetStudioId: "motion" });
    const applied = applyCanvasProjectionToDraft({
      project,
      projection: createProjection(),
      userConfirmed: true,
    });

    const first = rollbackCanvasProjectionMutation({
      project: applied.project!,
      mutationId: applied.mutation!.id,
    });
    const second = rollbackCanvasProjectionMutation({
      project: first.project!,
      mutationId: applied.mutation!.id,
    });

    expect(first.success).toBe(true);
    expect(second.success).toBe(false);
    expect(second.diagnostics[0].code).toBe("mutation_not_applied");
  });

  it("preserves sandbox provenance metadata from projection to applied mutation and audit trail", () => {
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
    const project = createProjectDraft({ name: "Apply", intent: "", targetStudioId: "photo" });
    const projection = createProjection({ metadata: provMetadata });
    const result = applyCanvasProjectionToDraft({
      project,
      projection,
      userConfirmed: true,
      actorId: "tester",
    });

    expect(result.success).toBe(true);
    expect(result.mutation?.metadata).toBeDefined();
    expect((result.mutation?.metadata?.provenance as any).sandboxRunId).toBe("run-123");

    const event = getWorkspaceAuditEvents().find((item) => item.type === "canvas_projection_applied");
    expect(event?.metadata?.sandboxRunId).toBe("run-123");
  });
});
