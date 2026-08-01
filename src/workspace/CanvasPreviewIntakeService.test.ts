import { beforeEach, describe, expect, it } from "vitest";
import type { RuntimeDryRunPreviewContractV1 } from "../runtime/activation/RuntimeActionDispatchTypes";
import {
  approveCanvasPreviewForAssembly,
  clearCanvasPreviewIntakeState,
  getCanvasAssemblyPlans,
  getCanvasPreviewCandidates,
  importCanvasPreviewState,
  intakeDryRunPreview,
  rejectCanvasPreview,
  serializeCanvasPreviewState,
} from "./CanvasPreviewIntakeService";
import {
  clearWorkspaceAuditEvents,
  getWorkspaceAuditEvents,
} from "./WorkspaceAuditService";

function createPreview(overrides: Partial<RuntimeDryRunPreviewContractV1> = {}): RuntimeDryRunPreviewContractV1 {
  return {
    contractVersion: "runtime-dry-run-preview.v1",
    kind: "canvas_preview",
    title: "Motion Preview",
    summary: "Preview for canvas intake tests.",
    studioId: "motion",
    canvas: {
      width: 1920,
      height: 1080,
      aspectRatio: "16:9",
      background: "transparent",
    },
    layers: [
      {
        id: "layer-1",
        label: "Primary layer",
        type: "motion",
        bounds: { x: 0, y: 0, width: 1920, height: 1080 },
        opacity: 1,
        blendMode: "normal",
        source: "runtime-mock",
      },
    ],
    assemblySteps: ["Review preview", "Prepare canvas plan"],
    exportTargets: ["canvas-preview-json"],
    estimatedDurationMs: 45,
    approvedForCanvasAssembly: false,
    security: {
      dryRun: true,
      noExecutionPerformed: true,
      runtimeCodeLoaded: false,
      moduleUrlExecuted: false,
    },
    ...overrides,
  };
}

describe("Phase 14 — CanvasPreviewIntakeService", () => {
  beforeEach(() => {
    clearCanvasPreviewIntakeState();
    clearWorkspaceAuditEvents();
  });

  it("accepts a valid dry-run preview as a pending review candidate", () => {
    const result = intakeDryRunPreview({
      runtimeId: "mock-motion-studio",
      actionId: "renderMotionFrame",
      preview: createPreview(),
    });

    expect(result.success).toBe(true);
    expect(result.candidate?.status).toBe("pending_review");
    expect(getCanvasPreviewCandidates()).toHaveLength(1);
  });

  it("records a canvas preview intake audit event", () => {
    const result = intakeDryRunPreview({
      runtimeId: "mock-motion-studio",
      actionId: "renderMotionFrame",
      preview: createPreview(),
    });

    expect(result.success).toBe(true);
    const events = getWorkspaceAuditEvents();
    expect(events.map((event) => event.type)).toContain("canvas_preview_intake_received");
    expect(events[0].metadata).toMatchObject({
      dryRunPreview: true,
      noExecutionPerformed: true,
      runtimeCodeLoaded: false,
      moduleUrlExecuted: false,
    });
  });

  it("rejects previews that claim pre-approved canvas assembly", () => {
    const result = intakeDryRunPreview({
      runtimeId: "mock-motion-studio",
      actionId: "renderMotionFrame",
      preview: createPreview({ approvedForCanvasAssembly: true as false }),
    });

    expect(result.success).toBe(false);
    expect(result.diagnostics[0].code).toBe("preview_already_approved");
    expect(getCanvasPreviewCandidates()).toHaveLength(0);
  });

  it("rejects previews with unsafe security flags", () => {
    const preview = createPreview({
      security: {
        dryRun: true,
        noExecutionPerformed: true,
        runtimeCodeLoaded: true as false,
        moduleUrlExecuted: false,
      },
    });

    const result = intakeDryRunPreview({
      runtimeId: "mock-motion-studio",
      actionId: "renderMotionFrame",
      preview,
    });

    expect(result.success).toBe(false);
    expect(result.diagnostics[0].code).toBe("unsafe_security_flags");
  });

  it("creates an assembly-ready plan only after explicit approval", () => {
    const intake = intakeDryRunPreview({
      runtimeId: "mock-motion-studio",
      actionId: "renderMotionFrame",
      preview: createPreview(),
    });

    expect(getCanvasAssemblyPlans()).toHaveLength(0);

    const approval = approveCanvasPreviewForAssembly({
      previewId: intake.candidate!.id,
      reviewerId: "test-reviewer",
    });

    expect(approval.success).toBe(true);
    expect(approval.candidate?.status).toBe("assembly_approved");
    expect(approval.assemblyPlan).toMatchObject({
      status: "assembly_ready",
      runtimeId: "mock-motion-studio",
      actionId: "renderMotionFrame",
      studioId: "motion",
    });
    expect(approval.assemblyPlan?.elements).toHaveLength(1);
    expect(approval.assemblyPlan?.security).toMatchObject({
      userApproved: true,
      runtimeCodeLoaded: false,
      moduleUrlExecuted: false,
    });
  });

  it("records approval audit events with non-execution metadata", () => {
    const intake = intakeDryRunPreview({
      runtimeId: "mock-motion-studio",
      actionId: "renderMotionFrame",
      preview: createPreview(),
    });

    approveCanvasPreviewForAssembly({ previewId: intake.candidate!.id });

    const approved = getWorkspaceAuditEvents().find(
      (event) => event.type === "canvas_preview_assembly_approved"
    );
    expect(approved?.metadata).toMatchObject({
      dryRunPreview: true,
      noExecutionPerformed: true,
      runtimeCodeLoaded: false,
      moduleUrlExecuted: false,
      elementCount: 1,
    });
  });

  it("rejects approval for a missing candidate", () => {
    const result = approveCanvasPreviewForAssembly({ previewId: "missing" });

    expect(result.success).toBe(false);
    expect(result.diagnostics[0].code).toBe("candidate_not_found");
  });

  it("does not approve the same candidate twice", () => {
    const intake = intakeDryRunPreview({
      runtimeId: "mock-motion-studio",
      actionId: "renderMotionFrame",
      preview: createPreview(),
    });

    approveCanvasPreviewForAssembly({ previewId: intake.candidate!.id });
    const second = approveCanvasPreviewForAssembly({ previewId: intake.candidate!.id });

    expect(second.success).toBe(false);
    expect(second.diagnostics[0].code).toBe("candidate_not_pending");
    expect(getCanvasAssemblyPlans()).toHaveLength(1);
  });

  it("rejects a candidate before assembly planning", () => {
    const intake = intakeDryRunPreview({
      runtimeId: "mock-motion-studio",
      actionId: "renderMotionFrame",
      preview: createPreview(),
    });

    const rejection = rejectCanvasPreview({
      previewId: intake.candidate!.id,
      note: "Needs layout changes.",
    });

    expect(rejection.success).toBe(true);
    expect(rejection.candidate?.status).toBe("rejected");
    expect(getCanvasAssemblyPlans()).toHaveLength(0);
    expect(getWorkspaceAuditEvents().map((event) => event.type)).toContain("canvas_preview_assembly_rejected");
  });

  it("serializes and imports canvas preview state for AXPKG persistence", () => {
    const intake = intakeDryRunPreview({
      runtimeId: "mock-motion-studio",
      actionId: "renderMotionFrame",
      preview: createPreview(),
    });
    approveCanvasPreviewForAssembly({ previewId: intake.candidate!.id });

    const snapshot = serializeCanvasPreviewState();
    expect(snapshot.candidates).toHaveLength(1);
    expect(snapshot.assemblyPlans).toHaveLength(1);

    clearCanvasPreviewIntakeState();
    expect(getCanvasPreviewCandidates()).toHaveLength(0);

    importCanvasPreviewState(snapshot);
    expect(getCanvasPreviewCandidates()).toHaveLength(1);
    expect(getCanvasAssemblyPlans()).toHaveLength(1);
  });

  it("preserves sandbox provenance metadata immutably from candidate to assembly plan", () => {
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
    const inputPreview = createPreview({ metadata: provMetadata });
    const result = intakeDryRunPreview({
      runtimeId: "photo-sandbox",
      actionId: "sandbox-simulation",
      preview: inputPreview,
    });

    // Check candidate metadata cloning immutability
    expect(result.success).toBe(true);
    expect(result.candidate?.preview.metadata?.provenance).toBeDefined();
    expect((result.candidate?.preview.metadata?.provenance as any).candidateId).toBe(result.candidate?.id);
    // Original preview object must not be mutated!
    expect((inputPreview.metadata?.provenance as any).candidateId).toBeUndefined();

    // Check assembly plan propagation
    const approval = approveCanvasPreviewForAssembly({ previewId: result.candidate!.id });
    expect(approval.success).toBe(true);
    expect(approval.assemblyPlan?.metadata).toBeDefined();
    expect((approval.assemblyPlan?.metadata?.provenance as any).candidateId).toBe(result.candidate?.id);
    expect((approval.assemblyPlan?.metadata?.provenance as any).sandboxRunId).toBe("run-123");
  });
});
