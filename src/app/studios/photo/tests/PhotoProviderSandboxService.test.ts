import { describe, it, expect, beforeEach, vi } from "vitest";
import { PhotoProviderSandboxService } from "../PhotoProviderSandboxService";
import type { PhotoProviderPersistenceJobRecord } from "../../../projects/projectDraft";
import { isSandboxProvenanceV1 } from "../../../projects/projectDraft";
import { getWorkspaceAuditEvents, clearWorkspaceAuditEvents } from "../../../../workspace/WorkspaceAuditService";
import * as intakeService from "../../../../workspace/CanvasPreviewIntakeService";

describe("PhotoProviderSandboxService Security & Execution Invariants", () => {
  beforeEach(() => {
    clearWorkspaceAuditEvents();
    vi.restoreAllMocks();
  });

  const createMockJob = (overrides?: Partial<PhotoProviderPersistenceJobRecord>): PhotoProviderPersistenceJobRecord => {
    // Merge overrides carefully
    const job = {
      contractVersion: "photo-provider-adapter-job.v1" as const,
      status: "ready_for_provider_execution" as const,
      adapter: {
        contractVersion: "photo-provider-adapter.v1" as const,
        providerId: "test-provider",
        displayName: "Test Provider Adapter",
        capabilities: { imageGeneration: true, transparentBackground: true, layeredOutput: false },
        limits: { maxWidth: 1024, maxHeight: 1024, maxLayers: 1 },
        security: { requiresExplicitApproval: true as const, executesOutsideRuntimeMock: true as const, storesSecrets: false as const }
      },
      approval: {
        approvalId: "test-approval-id",
        approvedBy: "user",
        approvedAtUtc: new Date().toISOString(),
        userConfirmedProviderExecution: true,
      },
      providerRequest: {
        contractVersion: "photo-provider-request.v1" as const,
        studioId: "photo" as const,
        provider: { requestedName: "Imagine X", planningMode: "flexible", planningStatus: "draft" },
        prompt: { intent: "Simulate a beautiful landscape photo", negativePrompt: "", backgroundStrategy: "solid", aesthetic: "cinematic", lighting: "warm", colorPalette: [] },
        canvas: { width: 1920, height: 1080, aspectRatio: "16:9", transparentBackgroundRequired: true as const },
        layers: [],
        approval: { requiresUserApproval: true as const, approvedForProviderExecution: true },
        security: {
          dryRun: true as const,
          providerExecuted: false as const,
          providerExecutionAllowed: false as const,
          noExecutionPerformed: true as const,
        },
      },
      security: {
        providerExecuted: false as const,
        runtimeCodeLoaded: false as const,
        moduleUrlExecuted: false as const,
        providerExecutionAllowed: true as const,
      },
    };

    if (overrides) {
      Object.assign(job, overrides);
    }

    return job as unknown as PhotoProviderPersistenceJobRecord;
  };

  it("1. successful sandbox run returns completed status and does not mutate job security flags", () => {
    const job = createMockJob();
    const run = PhotoProviderSandboxService.simulate(job);

    expect(run.status).toBe("simulated_completed");
    expect(run.security.providerExecuted).toBe(false);
    expect(run.security.runtimeCodeLoaded).toBe(false);
    expect(run.security.moduleUrlExecuted).toBe(false);
    expect(run.security.networkAccessed).toBe(false);
    expect(run.security.providerApiCalled).toBe(false);

    // Job itself was not mutated
    expect(job.security.providerExecuted).toBe(false);
  });

  it("2. rejects sandbox simulation if job's providerExecuted is already true", () => {
    const job = createMockJob({
      security: {
        providerExecuted: true as any,
        runtimeCodeLoaded: false as const,
        moduleUrlExecuted: false as const,
        providerExecutionAllowed: true as const,
      },
    });

    const run = PhotoProviderSandboxService.simulate(job);
    expect(run.status).toBe("simulated_failed");
    expect(run.diagnostics[0].code).toBe("job_already_executed");
  });

  it("3. rejects sandbox simulation if job's runtimeCodeLoaded is true", () => {
    const job = createMockJob({
      security: {
        providerExecuted: false as const,
        runtimeCodeLoaded: true as any,
        moduleUrlExecuted: false as const,
        providerExecutionAllowed: true as const,
      },
    });

    const run = PhotoProviderSandboxService.simulate(job);
    expect(run.status).toBe("simulated_failed");
    expect(run.diagnostics[0].code).toBe("job_already_executed");
  });

  it("4. rejects sandbox simulation if job's moduleUrlExecuted is true", () => {
    const job = createMockJob({
      security: {
        providerExecuted: false as const,
        runtimeCodeLoaded: false as const,
        moduleUrlExecuted: true as any,
        providerExecutionAllowed: true as const,
      },
    });

    const run = PhotoProviderSandboxService.simulate(job);
    expect(run.status).toBe("simulated_failed");
    expect(run.diagnostics[0].code).toBe("job_already_executed");
  });

  it("5. rejects sandbox simulation if job lacks user approval", () => {
    const job = createMockJob({
      approval: {
        approvalId: "test-approval-id",
        approvedBy: "user",
        approvedAtUtc: new Date().toISOString(),
        userConfirmedProviderExecution: false,
      },
    });

    const run = PhotoProviderSandboxService.simulate(job);
    expect(run.status).toBe("simulated_failed");
    expect(run.diagnostics[0].code).toBe("missing_approvals");
  });

  it("6. rejects sandbox simulation if job has forbidden executable fields (moduleUrl)", () => {
    const job = createMockJob({
      adapter: {
        contractVersion: "photo-provider-adapter.v1" as const,
        providerId: "test-provider",
        displayName: "Test Provider Adapter",
        capabilities: { imageGeneration: true, transparentBackground: true, layeredOutput: false },
        limits: { maxWidth: 1024, maxHeight: 1024, maxLayers: 1 },
        security: { requiresExplicitApproval: true as const, executesOutsideRuntimeMock: true as const, storesSecrets: false as const },
        moduleUrl: "http://malicious.js",
      } as any,
    });

    const run = PhotoProviderSandboxService.simulate(job);
    expect(run.status).toBe("simulated_failed");
    expect(run.diagnostics[0].code).toBe("forbidden_executable_fields");
  });

  it("7. rejects sandbox simulation if job has nested forbidden executable fields (apiKey)", () => {
    const job = createMockJob({
      providerRequest: {
        contractVersion: "photo-provider-request.v1" as const,
        studioId: "photo" as const,
        provider: { requestedName: "Imagine X", planningMode: "flexible", planningStatus: "draft" },
        prompt: { intent: "Simulate a beautiful landscape photo", negativePrompt: "", backgroundStrategy: "solid", aesthetic: "cinematic", lighting: "warm", colorPalette: [] },
        canvas: { width: 1920, height: 1080, aspectRatio: "16:9", transparentBackgroundRequired: true as const },
        layers: [],
        approval: { requiresUserApproval: true as const, approvedForProviderExecution: true },
        security: {
          dryRun: true as const,
          providerExecuted: false as const,
          providerExecutionAllowed: false as const,
          noExecutionPerformed: true as const,
        },
        apiKey: "unsecured-key",
      } as any,
    });

    const run = PhotoProviderSandboxService.simulate(job);
    expect(run.status).toBe("simulated_failed");
    expect(run.diagnostics[0].code).toBe("forbidden_executable_fields");
  });

  it("8. preserves prompt text completely unmodified during sandbox simulation", () => {
    const prompt = "This is a very specific Prompt containing symbols like #, $, & and %";
    const job = createMockJob({
      providerRequest: {
        contractVersion: "photo-provider-request.v1" as const,
        studioId: "photo" as const,
        provider: { requestedName: "Imagine X", planningMode: "flexible", planningStatus: "draft" },
        prompt: { intent: prompt, negativePrompt: "", backgroundStrategy: "solid", aesthetic: "cinematic", lighting: "warm", colorPalette: [] },
        canvas: { width: 1920, height: 1080, aspectRatio: "16:9", transparentBackgroundRequired: true as const },
        layers: [],
        approval: { requiresUserApproval: true as const, approvedForProviderExecution: true },
        security: {
          dryRun: true as const,
          providerExecuted: false as const,
          providerExecutionAllowed: false as const,
          noExecutionPerformed: true as const,
        },
      },
    });

    const run = PhotoProviderSandboxService.simulate(job);
    expect(run.status).toBe("simulated_completed");

    const auditEvents = getWorkspaceAuditEvents();
    const reqEvent = auditEvents.find((e) => e.type === "provider_sandbox_execution_requested");
    expect(reqEvent).toBeDefined();
    expect(reqEvent?.metadata?.promptText).toBe(prompt);
  });

  it("9. routes mock preview to CanvasPreviewIntakeService", () => {
    const intakeSpy = vi.spyOn(intakeService, "intakeDryRunPreview");
    const job = createMockJob();

    const run = PhotoProviderSandboxService.simulate(job);
    expect(run.status).toBe("simulated_completed");
    expect(intakeSpy).toHaveBeenCalledOnce();
    expect(intakeSpy.mock.calls[0][0].runtimeId).toBe("photo-sandbox");
    expect(intakeSpy.mock.calls[0][0].actionId).toBe("sandbox-simulation");
  });

  it("10. logs correct sandbox-specific audit events", () => {
    const job = createMockJob();
    PhotoProviderSandboxService.simulate(job);

    const auditEvents = getWorkspaceAuditEvents();
    expect(auditEvents.length).toBe(3);
    expect(auditEvents[0].type).toBe("provider_sandbox_execution_requested");
    expect(auditEvents[1].type).toBe("canvas_preview_intake_received");
    expect(auditEvents[2].type).toBe("provider_sandbox_execution_completed");

    // Check offline indicator metadata
    expect(auditEvents[0].metadata?.providerExecuted).toBe(false);
    expect(auditEvents[0].metadata?.networkAccessed).toBe(false);
    expect(auditEvents[2].metadata?.providerExecuted).toBe(false);
  });

  it("11. isSandboxProvenanceV1 accepts valid provenance and rejects malformed provenance", () => {
    const valid = {
      type: "photo-provider-sandbox-provenance.v1",
      sandboxRunId: "run-123",
      jobId: "job-123",
      simulatedAtUtc: "2026-07-11T12:00:00Z",
      adapter: { providerId: "test", displayName: "Test adapter" },
      securityEvidence: {
        providerExecuted: false,
        runtimeCodeLoaded: false,
        moduleUrlExecuted: false,
        networkAccessed: false,
        providerApiCalled: false,
      }
    };
    expect(isSandboxProvenanceV1(valid)).toBe(true);

    const missingType = { ...valid, type: undefined };
    expect(isSandboxProvenanceV1(missingType)).toBe(false);

    const badEvidence = {
      ...valid,
      securityEvidence: { ...valid.securityEvidence, providerExecuted: true }
    };
    expect(isSandboxProvenanceV1(badEvidence)).toBe(false);
  });

  it("12. sandbox simulation inserts correct sandbox provenance in generated preview metadata", () => {
    const job = createMockJob();
    const run = PhotoProviderSandboxService.simulate(job);
    expect(run.status).toBe("simulated_completed");

    const auditEvents = getWorkspaceAuditEvents();
    const completedEvent = auditEvents.find((e) => e.type === "provider_sandbox_execution_completed");
    expect(completedEvent).toBeDefined();

    // Verify candidate was created in intake service with provenance metadata
    const candidates = intakeService.getCanvasPreviewCandidates();
    const createdCandidate = candidates.find((c: any) => c.id === run.candidateId);
    expect(createdCandidate).toBeDefined();
    
    const provenance = createdCandidate?.preview.metadata?.provenance as any;
    expect(provenance).toBeDefined();
    expect(provenance.type).toBe("photo-provider-sandbox-provenance.v1");
    expect(provenance.sandboxRunId).toBe(run.id);
    expect(provenance.jobId).toBe(job.approval.approvalId);
    expect(provenance.candidateId).toBe(run.candidateId);
  });
});
