import type {
  RuntimeDryRunPreviewContractV1,
  RuntimeDryRunPreviewLayer,
} from "../runtime/activation/RuntimeActionDispatchTypes";
import {
  createCanvasPreviewAssemblyApprovedEvent,
  createCanvasPreviewAssemblyRejectedEvent,
  createCanvasPreviewIntakeReceivedEvent,
  recordWorkspaceAuditEvent,
} from "./WorkspaceAuditService";

export type CanvasPreviewCandidateStatus = "pending_review" | "assembly_approved" | "rejected";

export interface CanvasPreviewCandidate {
  id: string;
  runtimeId: string;
  actionId: string;
  preview: RuntimeDryRunPreviewContractV1;
  status: CanvasPreviewCandidateStatus;
  receivedAtUtc: string;
  reviewedAtUtc?: string;
  reviewNote?: string;
}

export interface CanvasAssemblyPlan {
  id: string;
  sourcePreviewId: string;
  runtimeId: string;
  actionId: string;
  studioId: string;
  status: "assembly_ready";
  createdAtUtc: string;
  canvas: RuntimeDryRunPreviewContractV1["canvas"];
  elements: CanvasAssemblyElement[];
  assemblySteps: string[];
  exportTargets: string[];
  security: RuntimeDryRunPreviewContractV1["security"] & {
    userApproved: true;
    runtimeCodeLoaded: false;
    moduleUrlExecuted: false;
  };
  metadata?: Record<string, unknown>;
}

export interface CanvasAssemblyElement {
  id: string;
  sourceLayerId: string;
  label: string;
  type: RuntimeDryRunPreviewLayer["type"];
  bounds: RuntimeDryRunPreviewLayer["bounds"];
  opacity: number;
  blendMode: RuntimeDryRunPreviewLayer["blendMode"];
  source: RuntimeDryRunPreviewLayer["source"];
}

export interface CanvasPreviewIntakeDiagnostic {
  code:
    | "invalid_contract_version"
    | "preview_already_approved"
    | "unsafe_security_flags"
    | "empty_layer_set"
    | "candidate_not_found"
    | "candidate_not_pending";
  severity: "error" | "warning";
  message: string;
}

export interface CanvasPreviewIntakeResult {
  success: boolean;
  candidate?: CanvasPreviewCandidate;
  diagnostics: CanvasPreviewIntakeDiagnostic[];
}

export interface CanvasPreviewApprovalResult {
  success: boolean;
  candidate?: CanvasPreviewCandidate;
  assemblyPlan?: CanvasAssemblyPlan;
  diagnostics: CanvasPreviewIntakeDiagnostic[];
}

const CANDIDATE_CAP = 200;
const candidates: CanvasPreviewCandidate[] = [];
const assemblyPlans: CanvasAssemblyPlan[] = [];

function createId(prefix: string): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `${prefix}_${crypto.randomUUID()}`;
  }
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

function validatePreview(preview: RuntimeDryRunPreviewContractV1): CanvasPreviewIntakeDiagnostic[] {
  const diagnostics: CanvasPreviewIntakeDiagnostic[] = [];

  if (preview.contractVersion !== "runtime-dry-run-preview.v1") {
    diagnostics.push({
      code: "invalid_contract_version",
      severity: "error",
      message: `Unsupported dry-run preview contract '${preview.contractVersion}'.`,
    });
  }

  if (preview.approvedForCanvasAssembly !== false) {
    diagnostics.push({
      code: "preview_already_approved",
      severity: "error",
      message: "Dry-run previews must enter the intake queue before canvas assembly approval.",
    });
  }

  if (
    preview.security.dryRun !== true ||
    preview.security.noExecutionPerformed !== true ||
    preview.security.runtimeCodeLoaded !== false ||
    preview.security.moduleUrlExecuted !== false
  ) {
    diagnostics.push({
      code: "unsafe_security_flags",
      severity: "error",
      message: "Dry-run preview security flags do not preserve the non-execution boundary.",
    });
  }

  if (preview.layers.length === 0) {
    diagnostics.push({
      code: "empty_layer_set",
      severity: "error",
      message: "Canvas preview intake requires at least one preview layer.",
    });
  }

  return diagnostics;
}

export function intakeDryRunPreview(input: {
  runtimeId: string;
  actionId: string;
  preview: RuntimeDryRunPreviewContractV1;
}): CanvasPreviewIntakeResult {
  const diagnostics = validatePreview(input.preview);
  if (diagnostics.some((diagnostic) => diagnostic.severity === "error")) {
    return { success: false, diagnostics };
  }

  const now = new Date().toISOString();
  const candidateId = createId("canvas_preview");

  let finalPreview = input.preview;
  if (input.preview.metadata?.provenance && (input.preview.metadata.provenance as any).type === "photo-provider-sandbox-provenance.v1") {
    const prov = input.preview.metadata.provenance as any;
    finalPreview = {
      ...input.preview,
      metadata: {
        ...input.preview.metadata,
        provenance: {
          ...prov,
          candidateId,
        },
      },
    };
  }

  const candidate: CanvasPreviewCandidate = {
    id: candidateId,
    runtimeId: input.runtimeId,
    actionId: input.actionId,
    preview: finalPreview,
    status: "pending_review",
    receivedAtUtc: now,
  };

  if (candidates.length >= CANDIDATE_CAP) {
    candidates.shift();
  }
  candidates.push(candidate);

  recordWorkspaceAuditEvent(
    createCanvasPreviewIntakeReceivedEvent({
      id: `canvas_preview_intake_${candidate.id}`,
      title: "Canvas Preview Intake Received",
      message: `Dry-run preview '${input.preview.title}' entered canvas review queue.`,
      timestamp: now,
      metadata: {
        previewId: candidate.id,
        runtimeId: input.runtimeId,
        actionId: input.actionId,
        contractVersion: input.preview.contractVersion,
        layerCount: input.preview.layers.length,
      },
    })
  );

  return { success: true, candidate, diagnostics };
}

export function approveCanvasPreviewForAssembly(input: {
  previewId: string;
  reviewerId?: string;
  note?: string;
}): CanvasPreviewApprovalResult {
  const candidate = candidates.find((item) => item.id === input.previewId);
  if (!candidate) {
    return {
      success: false,
      diagnostics: [
        {
          code: "candidate_not_found",
          severity: "error",
          message: `Canvas preview candidate '${input.previewId}' was not found.`,
        },
      ],
    };
  }

  if (candidate.status !== "pending_review") {
    return {
      success: false,
      candidate,
      diagnostics: [
        {
          code: "candidate_not_pending",
          severity: "error",
          message: `Canvas preview candidate '${input.previewId}' is not pending review.`,
        },
      ],
    };
  }

  const now = new Date().toISOString();
  candidate.status = "assembly_approved";
  candidate.reviewedAtUtc = now;
  candidate.reviewNote = input.note;

  const assemblyPlan: CanvasAssemblyPlan = {
    id: createId("canvas_assembly_plan"),
    sourcePreviewId: candidate.id,
    runtimeId: candidate.runtimeId,
    actionId: candidate.actionId,
    studioId: candidate.preview.studioId,
    status: "assembly_ready",
    createdAtUtc: now,
    canvas: candidate.preview.canvas,
    elements: candidate.preview.layers.map((layer) => ({
      id: createId("canvas_element"),
      sourceLayerId: layer.id,
      label: layer.label,
      type: layer.type,
      bounds: layer.bounds,
      opacity: layer.opacity,
      blendMode: layer.blendMode,
      source: layer.source,
    })),
    assemblySteps: [...candidate.preview.assemblySteps],
    exportTargets: [...candidate.preview.exportTargets],
    security: {
      ...candidate.preview.security,
      userApproved: true,
      runtimeCodeLoaded: false,
      moduleUrlExecuted: false,
    },
    metadata: candidate.preview.metadata,
  };

  assemblyPlans.push(assemblyPlan);

  recordWorkspaceAuditEvent(
    createCanvasPreviewAssemblyApprovedEvent({
      id: `canvas_preview_approved_${candidate.id}`,
      title: "Canvas Preview Assembly Approved",
      message: `Canvas preview '${candidate.preview.title}' was approved for assembly planning.`,
      timestamp: now,
      metadata: {
        previewId: candidate.id,
        assemblyPlanId: assemblyPlan.id,
        runtimeId: candidate.runtimeId,
        actionId: candidate.actionId,
        reviewerId: input.reviewerId,
        elementCount: assemblyPlan.elements.length,
      },
    })
  );

  return { success: true, candidate, assemblyPlan, diagnostics: [] };
}

export function rejectCanvasPreview(input: {
  previewId: string;
  reviewerId?: string;
  note?: string;
}): CanvasPreviewApprovalResult {
  const candidate = candidates.find((item) => item.id === input.previewId);
  if (!candidate) {
    return {
      success: false,
      diagnostics: [
        {
          code: "candidate_not_found",
          severity: "error",
          message: `Canvas preview candidate '${input.previewId}' was not found.`,
        },
      ],
    };
  }

  if (candidate.status !== "pending_review") {
    return {
      success: false,
      candidate,
      diagnostics: [
        {
          code: "candidate_not_pending",
          severity: "error",
          message: `Canvas preview candidate '${input.previewId}' is not pending review.`,
        },
      ],
    };
  }

  const now = new Date().toISOString();
  candidate.status = "rejected";
  candidate.reviewedAtUtc = now;
  candidate.reviewNote = input.note;

  recordWorkspaceAuditEvent(
    createCanvasPreviewAssemblyRejectedEvent({
      id: `canvas_preview_rejected_${candidate.id}`,
      title: "Canvas Preview Assembly Rejected",
      message: `Canvas preview '${candidate.preview.title}' was rejected before assembly planning.`,
      timestamp: now,
      metadata: {
        previewId: candidate.id,
        runtimeId: candidate.runtimeId,
        actionId: candidate.actionId,
        reviewerId: input.reviewerId,
        note: input.note,
      },
    })
  );

  return { success: true, candidate, diagnostics: [] };
}

export function getCanvasPreviewCandidates(): CanvasPreviewCandidate[] {
  return [...candidates];
}

export function getCanvasAssemblyPlans(): CanvasAssemblyPlan[] {
  return [...assemblyPlans];
}

export function importCanvasPreviewState(input: {
  candidates?: CanvasPreviewCandidate[];
  assemblyPlans?: CanvasAssemblyPlan[];
}): void {
  candidates.length = 0;
  assemblyPlans.length = 0;

  if (input.candidates) {
    candidates.push(...input.candidates.slice(-CANDIDATE_CAP));
  }
  if (input.assemblyPlans) {
    assemblyPlans.push(...input.assemblyPlans);
  }
}

export function serializeCanvasPreviewState(): {
  candidates: CanvasPreviewCandidate[];
  assemblyPlans: CanvasAssemblyPlan[];
} {
  return {
    candidates: getCanvasPreviewCandidates(),
    assemblyPlans: getCanvasAssemblyPlans(),
  };
}

export function clearCanvasPreviewIntakeState(): void {
  candidates.length = 0;
  assemblyPlans.length = 0;
}
