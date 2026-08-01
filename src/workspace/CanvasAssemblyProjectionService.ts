import type {
  CanvasAssemblyPlan,
} from "./CanvasPreviewIntakeService";
import type {
  CanvasSliceProjection,
  CanvasSliceProjectionElement,
} from "../app/projects/projectDraft";

export interface CanvasAssemblyProjectionDiagnostic {
  code:
    | "plan_not_assembly_ready"
    | "missing_user_approval"
    | "unsafe_security_flags"
    | "empty_assembly_elements";
  severity: "error";
  message: string;
}

export interface CanvasAssemblyProjectionResult {
  success: boolean;
  projection?: CanvasSliceProjection;
  diagnostics: CanvasAssemblyProjectionDiagnostic[];
}

function createId(prefix: string): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `${prefix}_${crypto.randomUUID()}`;
  }
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function projectAssemblyPlanToCanvasPreview(
  plan: CanvasAssemblyPlan
): CanvasAssemblyProjectionResult {
  const diagnostics: CanvasAssemblyProjectionDiagnostic[] = [];

  if (plan.status !== "assembly_ready") {
    diagnostics.push({
      code: "plan_not_assembly_ready",
      severity: "error",
      message: "Only assembly-ready plans can be projected into canvas preview elements.",
    });
  }

  if (plan.security.userApproved !== true) {
    diagnostics.push({
      code: "missing_user_approval",
      severity: "error",
      message: "Assembly plan projection requires explicit user approval.",
    });
  }

  if (
    plan.security.noExecutionPerformed !== true ||
    plan.security.runtimeCodeLoaded !== false ||
    plan.security.moduleUrlExecuted !== false
  ) {
    diagnostics.push({
      code: "unsafe_security_flags",
      severity: "error",
      message: "Assembly plan security flags do not preserve the non-execution boundary.",
    });
  }

  if (plan.elements.length === 0) {
    diagnostics.push({
      code: "empty_assembly_elements",
      severity: "error",
      message: "Assembly plan projection requires at least one element.",
    });
  }

  if (diagnostics.length > 0) {
    return { success: false, diagnostics };
  }

  const elements: CanvasSliceProjectionElement[] = plan.elements.map((element) => ({
    id: createId("canvas_projection_element"),
    sourceAssemblyElementId: element.id,
    sourceLayerId: element.sourceLayerId,
    label: element.label,
    type: element.type,
    bounds: element.bounds,
    opacity: element.opacity,
    blendMode: element.blendMode,
    source: element.source,
    previewOnly: true,
  }));

  const projection: CanvasSliceProjection = {
    id: createId("canvas_projection"),
    assemblyPlanId: plan.id,
    studioId: plan.studioId,
    status: "projected_preview",
    createdAtUtc: new Date().toISOString(),
    canvas: plan.canvas,
    elements,
    security: {
      previewOnly: true,
      noExecutionPerformed: true,
      runtimeCodeLoaded: false,
      moduleUrlExecuted: false,
      authoritativeCanvasMutated: false,
    },
    metadata: plan.metadata,
  };

  return {
    success: true,
    projection,
    diagnostics: [],
  };
}
