import type {
  AxiomProjectCanvasPreviewBlock,
  AxiomProjectDraft,
  CanvasAppliedMutation,
  CanvasSliceProjection,
} from "../app/projects/projectDraft";
import {
  createCanvasProjectionAppliedEvent,
  createCanvasProjectionRolledBackEvent,
  recordWorkspaceAuditEvent,
} from "./WorkspaceAuditService";

export interface CanvasApplyDiagnostic {
  code:
    | "projection_not_ready"
    | "missing_user_confirmation"
    | "unsafe_projection_flags"
    | "empty_projection"
    | "mutation_not_found"
    | "mutation_not_applied";
  severity: "error";
  message: string;
}

export interface CanvasApplyResult {
  success: boolean;
  project?: AxiomProjectDraft;
  mutation?: CanvasAppliedMutation;
  diagnostics: CanvasApplyDiagnostic[];
}

function createId(prefix: string): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `${prefix}_${crypto.randomUUID()}`;
  }
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

function cloneProject(project: AxiomProjectDraft): AxiomProjectDraft {
  return JSON.parse(JSON.stringify(project)) as AxiomProjectDraft;
}

function createEmptyCanvasPreviewBlock(): AxiomProjectCanvasPreviewBlock {
  return {
    schemaVersion: "0.5.0",
    savedAt: new Date().toISOString(),
    candidates: [],
    assemblyPlans: [],
    projections: [],
    applications: [],
  };
}

function validateProjection(
  projection: CanvasSliceProjection,
  userConfirmed: boolean
): CanvasApplyDiagnostic[] {
  const diagnostics: CanvasApplyDiagnostic[] = [];

  if (projection.status !== "projected_preview") {
    diagnostics.push({
      code: "projection_not_ready",
      severity: "error",
      message: "Only projected preview canvas projections can be applied.",
    });
  }

  if (!userConfirmed) {
    diagnostics.push({
      code: "missing_user_confirmation",
      severity: "error",
      message: "Applying a canvas projection requires explicit user confirmation.",
    });
  }

  if (
    projection.security.previewOnly !== true ||
    projection.security.noExecutionPerformed !== true ||
    projection.security.runtimeCodeLoaded !== false ||
    projection.security.moduleUrlExecuted !== false ||
    projection.security.authoritativeCanvasMutated !== false
  ) {
    diagnostics.push({
      code: "unsafe_projection_flags",
      severity: "error",
      message: "Canvas projection security flags do not preserve the apply boundary.",
    });
  }

  if (projection.elements.length === 0) {
    diagnostics.push({
      code: "empty_projection",
      severity: "error",
      message: "Canvas projection apply requires at least one projected element.",
    });
  }

  return diagnostics;
}

export function applyCanvasProjectionToDraft(input: {
  project: AxiomProjectDraft;
  projection: CanvasSliceProjection;
  userConfirmed: boolean;
  actorId?: string;
}): CanvasApplyResult {
  const diagnostics = validateProjection(input.projection, input.userConfirmed);
  if (diagnostics.length > 0) {
    return { success: false, diagnostics };
  }

  const nextProject = cloneProject(input.project);
  const studioId = input.projection.studioId;
  const now = new Date().toISOString();
  const existingSlice = nextProject.canvas[studioId] ?? {
    elements: [],
    viewport: { zoom: 1, panX: 0, panY: 0 },
  };
  const previousElements = JSON.parse(JSON.stringify(existingSlice.elements)) as unknown[];

  const appliedElements = input.projection.elements.map((element) => ({
    id: createId("canvas_applied_element"),
    sourceProjectionId: input.projection.id,
    sourceProjectionElementId: element.id,
    sourceLayerId: element.sourceLayerId,
    label: element.label,
    type: element.type,
    bounds: element.bounds,
    opacity: element.opacity,
    blendMode: element.blendMode,
    source: element.source,
    previewOnly: false,
    appliedFromProjection: true,
  }));

  nextProject.canvas[studioId] = {
    ...existingSlice,
    elements: [...existingSlice.elements, ...appliedElements],
  };

  const mutation: CanvasAppliedMutation = {
    id: createId("canvas_apply_mutation"),
    projectionId: input.projection.id,
    studioId,
    status: "applied",
    appliedAtUtc: now,
    appliedElementIds: appliedElements.map((element) => element.id),
    previousElements,
    security: {
      userConfirmed: true,
      noExecutionPerformed: true,
      runtimeCodeLoaded: false,
      moduleUrlExecuted: false,
      authoritativeCanvasMutated: true,
      reversible: true,
    },
    metadata: input.projection.metadata,
  };

  nextProject.canvasPreview = nextProject.canvasPreview ?? createEmptyCanvasPreviewBlock();
  nextProject.canvasPreview = {
    ...nextProject.canvasPreview,
    schemaVersion: "0.5.0",
    savedAt: now,
    projections: nextProject.canvasPreview.projections.some((item) => item.id === input.projection.id)
      ? nextProject.canvasPreview.projections
      : [...nextProject.canvasPreview.projections, input.projection],
    applications: [...(nextProject.canvasPreview.applications ?? []), mutation],
  };
  nextProject.manifest = {
    ...nextProject.manifest,
    updatedAt: now,
    authoredStudios: nextProject.manifest.authoredStudios.includes(studioId as any)
      ? nextProject.manifest.authoredStudios
      : [...nextProject.manifest.authoredStudios, studioId as any],
  };

  recordWorkspaceAuditEvent(
    createCanvasProjectionAppliedEvent({
      id: `canvas_projection_applied_${mutation.id}`,
      title: "Canvas Projection Applied",
      message: `Applied preview projection '${input.projection.id}' to studio '${studioId}'.`,
      timestamp: now,
      metadata: {
        mutationId: mutation.id,
        projectionId: input.projection.id,
        studioId,
        actorId: input.actorId,
        appliedElementCount: appliedElements.length,
        rollbackElementCount: previousElements.length,
        sandboxRunId: (input.projection.metadata?.provenance as any)?.sandboxRunId,
        candidateId: (input.projection.metadata?.provenance as any)?.candidateId,
      },
    })
  );

  return {
    success: true,
    project: nextProject,
    mutation,
    diagnostics: [],
  };
}

export function rollbackCanvasProjectionMutation(input: {
  project: AxiomProjectDraft;
  mutationId: string;
  actorId?: string;
  reason?: string;
}): CanvasApplyResult {
  const mutation = input.project.canvasPreview?.applications.find((item) => item.id === input.mutationId);
  if (!mutation) {
    return {
      success: false,
      diagnostics: [
        {
          code: "mutation_not_found",
          severity: "error",
          message: `Canvas mutation '${input.mutationId}' was not found.`,
        },
      ],
    };
  }

  if (mutation.status !== "applied") {
    return {
      success: false,
      mutation,
      diagnostics: [
        {
          code: "mutation_not_applied",
          severity: "error",
          message: `Canvas mutation '${input.mutationId}' is not currently applied.`,
        },
      ],
    };
  }

  const nextProject = cloneProject(input.project);
  const now = new Date().toISOString();
  const nextMutation = nextProject.canvasPreview!.applications.find((item) => item.id === input.mutationId)!;

  nextProject.canvas[mutation.studioId] = {
    ...(nextProject.canvas[mutation.studioId] ?? { viewport: { zoom: 1, panX: 0, panY: 0 } }),
    elements: JSON.parse(JSON.stringify(mutation.previousElements)) as unknown[],
  };

  nextMutation.status = "rolled_back";
  nextMutation.rolledBackAtUtc = now;
  nextMutation.rollbackReason = input.reason;
  nextProject.canvasPreview!.savedAt = now;
  nextProject.manifest = {
    ...nextProject.manifest,
    updatedAt: now,
  };

  recordWorkspaceAuditEvent(
    createCanvasProjectionRolledBackEvent({
      id: `canvas_projection_rollback_${mutation.id}`,
      title: "Canvas Projection Rolled Back",
      message: `Rolled back canvas mutation '${mutation.id}' for studio '${mutation.studioId}'.`,
      timestamp: now,
      metadata: {
        mutationId: mutation.id,
        projectionId: mutation.projectionId,
        studioId: mutation.studioId,
        actorId: input.actorId,
        reason: input.reason,
        restoredElementCount: mutation.previousElements.length,
      },
    })
  );

  return {
    success: true,
    project: nextProject,
    mutation: nextMutation,
    diagnostics: [],
  };
}
