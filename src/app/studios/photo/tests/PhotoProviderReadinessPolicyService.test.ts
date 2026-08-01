import { describe, it, expect, beforeEach, vi } from "vitest";
import { PhotoProviderReadinessPolicyService } from "../PhotoProviderReadinessPolicyService";
import type { AxiomProjectDraft, PhotoProviderPersistenceJobRecord, PhotoProviderSandboxRunRecordV1 } from "../../../projects/projectDraft";
import { clearWorkspaceAuditEvents, getWorkspaceAuditEvents } from "../../../../workspace/WorkspaceAuditService";

describe("PhotoProviderReadinessPolicyService", () => {
  beforeEach(() => {
    clearWorkspaceAuditEvents();
    PhotoProviderReadinessPolicyService.clearAllMockProviderCredentials();
  });

  const createMockJob = (overrides?: Partial<PhotoProviderPersistenceJobRecord>): PhotoProviderPersistenceJobRecord => {
    return {
      contractVersion: "photo-provider-adapter-job.v1",
      status: "ready_for_provider_execution",
      adapter: {
        contractVersion: "photo-provider-adapter.v1",
        providerId: "mock-photo-provider",
        displayName: "Mock Photo Provider",
        capabilities: { imageGeneration: true, transparentBackground: true, layeredOutput: true },
        limits: { maxWidth: 2048, maxHeight: 2048, maxLayers: 5 },
        security: { requiresExplicitApproval: true, executesOutsideRuntimeMock: true, storesSecrets: false },
      },
      approval: {
        approvalId: "job-123456",
        approvedBy: "test-user",
        approvedAtUtc: new Date().toISOString(),
        userConfirmedProviderExecution: true,
      },
      security: {
        providerExecutionAllowed: true,
        providerExecuted: false,
        runtimeCodeLoaded: false,
        moduleUrlExecuted: false,
      },
      providerRequest: {
        contractVersion: "photo-provider-request.v1",
        studioId: "photo",
        provider: { requestedName: "mock-photo-provider", planningMode: "standard", planningStatus: "completed" },
        prompt: {
          intent: "generate a cute dog",
          negativePrompt: "",
          backgroundStrategy: "transparent",
          aesthetic: "cinematic",
          lighting: "natural",
          colorPalette: ["#ffffff"],
        },
        canvas: { width: 1024, height: 1024, aspectRatio: "1:1", transparentBackgroundRequired: true },
        layers: [
          {
            index: 0,
            name: "background",
            type: "image",
            providerPrompt: "background",
            blendMode: "normal",
            opacity: 1,
            transparentBackgroundRequired: true,
          },
        ],
        approval: { requiresUserApproval: true, approvedForProviderExecution: true },
        security: {
          dryRun: true,
          providerExecutionAllowed: false,
          providerExecuted: false,
          noExecutionPerformed: true,
        },
      },
      ...overrides,
    };
  };

  const createMockSandboxRun = (overrides?: Partial<PhotoProviderSandboxRunRecordV1>): PhotoProviderSandboxRunRecordV1 => {
    return {
      contractVersion: "photo-provider-sandbox-run.v1",
      id: "run-987654",
      jobId: "job-123456",
      status: "simulated_completed",
      requestedAt: new Date().toISOString(),
      completedAt: new Date().toISOString(),
      candidateId: "candidate-123",
      diagnostics: [],
      security: {
        providerExecuted: false,
        runtimeCodeLoaded: false,
        moduleUrlExecuted: false,
        networkAccessed: false,
        providerApiCalled: false,
      },
      ...overrides,
    };
  };

  const createMockProject = (
    jobs: PhotoProviderPersistenceJobRecord[],
    sandboxRuns: PhotoProviderSandboxRunRecordV1[],
    overrides?: Partial<AxiomProjectDraft>
  ): AxiomProjectDraft => {
    return {
      schemaVersion: "0.7.0",
      project: {
        id: "test-project",
        name: "Test Project",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      photoProvider: {
        schemaVersion: "0.7.0",
        savedAt: new Date().toISOString(),
        jobs,
        sandboxRuns,
      },
      canvasPreview: {
        schemaVersion: "0.5.0",
        savedAt: new Date().toISOString(),
        candidates: [
          {
            id: "candidate-123",
            assemblyPlanId: "plan-123",
            studioId: "photo",
            preview: {
              contractVersion: "runtime-dry-run-preview.v1" as const,
              kind: "canvas_preview" as const,
              title: "Sandbox Preview",
              summary: "Sandbox preview",
              studioId: "photo",
              canvas: { width: 1024, height: 1024, aspectRatio: "1:1", background: "transparent" },
              layers: [],
              assemblySteps: [],
              exportTargets: [],
              estimatedDurationMs: 0,
              approvedForCanvasAssembly: false,
              security: {
                dryRun: true,
                noExecutionPerformed: true,
                runtimeCodeLoaded: false,
                moduleUrlExecuted: false,
              },
              metadata: {
                requiredAdapterContract: "photo-provider-adapter.v1" as const,
                provenance: {
                  type: "photo-provider-sandbox-provenance.v1",
                  sandboxRunId: "run-987654",
                  jobId: "job-123456",
                  simulatedAtUtc: new Date().toISOString(),
                  candidateId: "candidate-123",
                  adapter: {
                    providerId: "mock-photo-provider",
                    displayName: "Mock Photo Provider",
                  },
                  securityEvidence: {
                    providerExecuted: false,
                    runtimeCodeLoaded: false,
                    moduleUrlExecuted: false,
                    networkAccessed: false,
                    providerApiCalled: false,
                  },
                },
              },
            },
          },
        ],
        assemblyPlans: [],
        projections: [
          {
            id: "projection-123",
            assemblyPlanId: "plan-123",
            studioId: "photo",
            status: "projected_preview",
            createdAtUtc: new Date().toISOString(),
            canvas: { width: 1024, height: 1024, aspectRatio: "1:1", background: "transparent" },
            elements: [],
            security: {
              previewOnly: true,
              noExecutionPerformed: true,
              runtimeCodeLoaded: false,
              moduleUrlExecuted: false,
              authoritativeCanvasMutated: false,
            },
          },
        ],
        applications: [],
      },
      ...overrides,
    } as unknown as AxiomProjectDraft;
  };

  it("1. passes readiness check under perfect configuration but strictly blocks execution", async () => {
    const job = createMockJob();
    const run = createMockSandboxRun();
    const project = createMockProject([job], [run]);

    PhotoProviderReadinessPolicyService.stageMockProviderCredential("mock-photo-provider");

    const report = await PhotoProviderReadinessPolicyService.verifyReadiness({
      project,
      jobId: "job-123456",
      actor: "test-actor",
      environment: {
        sandboxIsolationVerified: true,
        networkPolicyBlocked: true,
        providerApiPolicyBlocked: true,
      },
    });

    expect(report.readinessSatisfied).toBe(true);
    expect(report.executionBlockedByPhasePolicy).toBe(true);
    expect(report.liveExecutionAvailable).toBe(false);
    expect(report.mockCredentialStaged).toBe(true);
    expect(report.sandboxVerificationPassed).toBe(true);
    expect(report.rollbackReady).toBe(true);
    expect(report.diagnostics).toHaveLength(0);

    // Audit logs checks
    const events = getWorkspaceAuditEvents();
    expect(events).toHaveLength(2);
    expect(events[0].type).toBe("provider_readiness_check_requested");
    expect(events[0].metadata?.executionBlockedByPhasePolicy).toBe(true);
    expect(events[1].type).toBe("provider_readiness_check_completed");
    expect(events[1].metadata?.readinessSatisfied).toBe(true);
    expect(events[1].metadata?.executionBlockedByPhasePolicy).toBe(true);
  });

  it("2. fails readiness if consent is missing", async () => {
    const job = createMockJob({
      approval: {
        approvalId: "job-123456",
        approvedBy: "test-user",
        approvedAtUtc: new Date().toISOString(),
        userConfirmedProviderExecution: false, // missing consent
      },
    });
    const run = createMockSandboxRun();
    const project = createMockProject([job], [run]);

    PhotoProviderReadinessPolicyService.stageMockProviderCredential("mock-photo-provider");

    const report = await PhotoProviderReadinessPolicyService.verifyReadiness({
      project,
      jobId: "job-123456",
      actor: "test-actor",
      environment: {
        sandboxIsolationVerified: true,
        networkPolicyBlocked: true,
        providerApiPolicyBlocked: true,
      },
    });

    expect(report.readinessSatisfied).toBe(false);
    expect(report.checks.find((c) => c.name === "User Consent Confirmed")?.passed).toBe(false);
    expect(report.diagnostics.some((d) => d.code === "consent_missing")).toBe(true);
  });

  it("3. fails readiness if sandbox run is missing", async () => {
    const job = createMockJob();
    const project = createMockProject([job], []); // empty sandbox runs

    PhotoProviderReadinessPolicyService.stageMockProviderCredential("mock-photo-provider");

    const report = await PhotoProviderReadinessPolicyService.verifyReadiness({
      project,
      jobId: "job-123456",
      actor: "test-actor",
      environment: {
        sandboxIsolationVerified: true,
        networkPolicyBlocked: true,
        providerApiPolicyBlocked: true,
      },
    });

    expect(report.readinessSatisfied).toBe(false);
    expect(report.checks.find((c) => c.name === "Successful Sandbox Run Exists")?.passed).toBe(false);
    expect(report.diagnostics.some((d) => d.code === "sandbox_run_missing")).toBe(true);
  });

  it("4. fails readiness if candidate provenance is invalid", async () => {
    const job = createMockJob();
    const run = createMockSandboxRun();
    const project = createMockProject([job], [run]);

    // Corrupt the candidate metadata provenance
    const candidate = project.canvasPreview!.candidates[0];
    candidate.preview.metadata = {
      requiredAdapterContract: "photo-provider-adapter.v1" as const,
      provenance: {
        type: "photo-provider-sandbox-provenance.v1",
        sandboxRunId: "wrong-run-id", // Mismatch
        jobId: "job-123456",
        simulatedAtUtc: new Date().toISOString(),
        candidateId: "candidate-123",
        adapter: { providerId: "mock", displayName: "Mock" },
        securityEvidence: {
          providerExecuted: true as any, // Violation
          runtimeCodeLoaded: false,
          moduleUrlExecuted: false,
          networkAccessed: false,
          providerApiCalled: false,
        },
      },
    };

    PhotoProviderReadinessPolicyService.stageMockProviderCredential("mock-photo-provider");

    const report = await PhotoProviderReadinessPolicyService.verifyReadiness({
      project,
      jobId: "job-123456",
      actor: "test-actor",
      environment: {
        sandboxIsolationVerified: true,
        networkPolicyBlocked: true,
        providerApiPolicyBlocked: true,
      },
    });

    expect(report.readinessSatisfied).toBe(false);
    expect(report.checks.find((c) => c.name === "Candidate Sandbox Provenance Verified")?.passed).toBe(false);
    expect(report.diagnostics.some((d) => d.code === "provenance_invalid")).toBe(true);
  });

  it("5. fails readiness if mock credential is not staged", async () => {
    const job = createMockJob();
    const run = createMockSandboxRun();
    const project = createMockProject([job], [run]);

    // Mock credential not staged

    const report = await PhotoProviderReadinessPolicyService.verifyReadiness({
      project,
      jobId: "job-123456",
      actor: "test-actor",
      environment: {
        sandboxIsolationVerified: true,
        networkPolicyBlocked: true,
        providerApiPolicyBlocked: true,
      },
    });

    expect(report.readinessSatisfied).toBe(false);
    expect(report.checks.find((c) => c.name === "Mock Provider Credential Staged")?.passed).toBe(false);
    expect(report.diagnostics.some((d) => d.code === "mock_credential_missing")).toBe(true);
  });

  it("6. fails readiness if mock credential is staged then cleared", async () => {
    const job = createMockJob();
    const run = createMockSandboxRun();
    const project = createMockProject([job], [run]);

    PhotoProviderReadinessPolicyService.stageMockProviderCredential("mock-photo-provider");
    expect(PhotoProviderReadinessPolicyService.hasMockProviderCredential("mock-photo-provider")).toBe(true);

    PhotoProviderReadinessPolicyService.clearMockProviderCredential("mock-photo-provider");
    expect(PhotoProviderReadinessPolicyService.hasMockProviderCredential("mock-photo-provider")).toBe(false);

    const report = await PhotoProviderReadinessPolicyService.verifyReadiness({
      project,
      jobId: "job-123456",
      actor: "test-actor",
      environment: {
        sandboxIsolationVerified: true,
        networkPolicyBlocked: true,
        providerApiPolicyBlocked: true,
      },
    });

    expect(report.readinessSatisfied).toBe(false);
    expect(report.mockCredentialStaged).toBe(false);
  });

  it("7. schema remains exactly 0.7.0 and never persists report or mock credentials in projectDraft", async () => {
    const job = createMockJob();
    const run = createMockSandboxRun();
    const project = createMockProject([job], [run]);

    PhotoProviderReadinessPolicyService.stageMockProviderCredential("mock-photo-provider");

    await PhotoProviderReadinessPolicyService.verifyReadiness({
      project,
      jobId: "job-123456",
      actor: "test-actor",
      environment: {
        sandboxIsolationVerified: true,
        networkPolicyBlocked: true,
        providerApiPolicyBlocked: true,
      },
    });

    // Verify project draft has NOT been mutated with any new persisted variables or version bumps
    expect(project.schemaVersion).toBe("0.7.0");
    expect(project.photoProvider?.schemaVersion).toBe("0.7.0");
    expect(project.photoProvider?.jobs).toHaveLength(1);
    expect(project.photoProvider?.sandboxRuns).toHaveLength(1);
    expect((project as any).readinessReports).toBeUndefined();
    expect((project as any).mockCredentials).toBeUndefined();
  });

  it("8. audit events do not leak any credentials", async () => {
    const job = createMockJob();
    const run = createMockSandboxRun();
    const project = createMockProject([job], [run]);

    PhotoProviderReadinessPolicyService.stageMockProviderCredential("mock-photo-provider");

    await PhotoProviderReadinessPolicyService.verifyReadiness({
      project,
      jobId: "job-123456",
      actor: "test-actor",
      environment: {
        sandboxIsolationVerified: true,
        networkPolicyBlocked: true,
        providerApiPolicyBlocked: true,
      },
    });

    const events = getWorkspaceAuditEvents();
    expect(events).toHaveLength(2);

    // Verify metadata properties are safe and do not contain secrets/passwords
    for (const e of events) {
      expect(e.metadata).toBeDefined();
      expect(e.metadata?.executionBlockedByPhasePolicy).toBe(true);
      expect(e.metadata?.providerExecuted).toBe(false);
      expect(e.metadata?.networkAccessed).toBe(false);
      expect(e.metadata?.providerApiCalled).toBe(false);

      // Verify absence of sensitive words
      const serialized = JSON.stringify(e);
      expect(serialized).not.toContain("apiKey");
      expect(serialized).not.toContain("secretKey");
      expect(serialized).not.toContain("password");
    }
  });
});
