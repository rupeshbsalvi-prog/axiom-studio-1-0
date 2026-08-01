import { describe, it, expect } from "vitest";
import { migrateProjectDraft } from "../AxpkgMigrationService";
import { createProjectDraft } from "../../projectDraft";

describe("AxpkgMigrationService", () => {
  it("accepts valid 0.7.0 draft and migrates it to 0.8.0", () => {
    const project = createProjectDraft({ name: "T", intent: "T", targetStudioId: "photo" });
    project.schemaVersion = "0.7.0";
    project.runtime = {
      schemaVersion: "0.3.0",
      savedAt: new Date().toISOString(),
      registeredRuntimes: [],
      activationLabels: [],
      executionHistory: [],
    };
    project.canvasPreview = {
      schemaVersion: "0.5.0",
      savedAt: new Date().toISOString(),
      candidates: [],
      assemblyPlans: [],
      projections: [],
      applications: [],
    };
    project.photoProvider = {
      schemaVersion: "0.7.0",
      savedAt: new Date().toISOString(),
      jobs: [],
      sandboxRuns: [],
    } as any;

    const result = migrateProjectDraft(project);
    expect(result.success).toBe(true);
    expect(result.project?.schemaVersion).toBe("0.8.0");
    expect(result.project?.runtime).toBeDefined();
    expect(result.project?.canvasPreview).toBeDefined();
    expect(result.project?.photoProvider).toBeDefined();
    expect(result.project?.photoProvider?.sandboxRuns).toEqual([]);
    expect(result.project?.photoProvider?.liveRuns).toEqual([]);
    expect(result.diagnostics.length).toBe(1);
  });

  it("migrates 0.5.0 draft to 0.7.0 and lifts legacy provider jobs", () => {
    const project = createProjectDraft({ name: "T", intent: "T", targetStudioId: "photo" });
    project.schemaVersion = "0.5.0";
    delete project.photoProvider;

    // Put some legacy jobs into studios.photo.providerAdapterJobs
    const validJob = {
      contractVersion: "photo-provider-adapter-job.v1",
      status: "ready_for_provider_execution",
      providerRequest: {
        contractVersion: "photo-provider-request.v1",
        studioId: "photo",
        provider: { requestedName: "Imagine X", planningMode: "flexible", planningStatus: "draft" },
        prompt: { intent: "ocean sunset", negativePrompt: "", backgroundStrategy: "solid", aesthetic: "cinematic", lighting: "warm", colorPalette: ["#000"] },
        canvas: { width: 512, height: 512, aspectRatio: "1:1", transparentBackgroundRequired: true },
        layers: [],
        approval: { requiresUserApproval: true, approvedForProviderExecution: true },
        security: { dryRun: true, providerExecutionAllowed: false, providerExecuted: false, noExecutionPerformed: true }
      },
      adapter: {
        contractVersion: "photo-provider-adapter.v1",
        providerId: "test-adapter",
        displayName: "Test Adapter",
        capabilities: { imageGeneration: true, transparentBackground: true, layeredOutput: false },
        limits: { maxWidth: 1024, maxHeight: 1024, maxLayers: 1 },
        security: { requiresExplicitApproval: true, executesOutsideRuntimeMock: true, storesSecrets: false }
      },
      approval: {
        approvalId: "app-123",
        approvedBy: "user",
        approvedAtUtc: new Date().toISOString(),
        userConfirmedProviderExecution: true
      },
      security: {
        providerExecutionAllowed: false,
        providerExecuted: false,
        runtimeCodeLoaded: false,
        moduleUrlExecuted: false
      }
    };
    
    const invalidJob = {
      contractVersion: "photo-provider-adapter-job.v1",
      status: "failed", // Invalid status, but the migration itself just filters by contractVersion.
      // (The import service sanitization will validate properties, migration only checks contractVersion).
    };

    project.studios.photo = {
      providerAdapterJobs: [validJob, invalidJob, null, { contractVersion: "some-other-contract" }]
    };

    const result = migrateProjectDraft(project);
    expect(result.success).toBe(true);
    expect(result.project?.schemaVersion).toBe("0.8.0");
    expect(result.project?.photoProvider?.schemaVersion).toBe("0.8.0");
    // Verify only the valid contractVersion was kept, others dropped
    expect(result.project?.photoProvider?.jobs.length).toBe(2);
    expect(result.project?.photoProvider?.jobs[0]).toEqual(validJob);
    // Verify sandboxRuns is initialized empty
    expect(result.project?.photoProvider?.sandboxRuns).toEqual([]);
    // Verify liveRuns is initialized empty
    expect(result.project?.photoProvider?.liveRuns).toEqual([]);
    // Verify legacy field was stripped
    expect(result.project?.studios.photo.providerAdapterJobs).toBeUndefined();
  });

  it("migrates 0.3.0 draft to 0.7.0 with empty canvas preview and photo provider blocks", () => {
    const project = createProjectDraft({ name: "T", intent: "T", targetStudioId: "photo" });
    project.schemaVersion = "0.3.0";
    delete project.canvasPreview;
    delete project.photoProvider;

    const result = migrateProjectDraft(project);
    expect(result.success).toBe(true);
    expect(result.project?.schemaVersion).toBe("0.8.0");
    expect(result.project?.runtime).toBeDefined();
    expect(result.project?.canvasPreview?.schemaVersion).toBe("0.5.0");
    expect(result.project?.photoProvider?.schemaVersion).toBe("0.8.0");
    expect(result.project?.photoProvider?.jobs).toEqual([]);
    expect(result.project?.photoProvider?.sandboxRuns).toEqual([]);
    expect(result.project?.photoProvider?.liveRuns).toEqual([]);
    expect(result.diagnostics.some((d) => d.code === "migrated_project_schema")).toBe(true);
  });

  it("migrates 0.2.0 draft to 0.7.0 and preserves audit events", () => {
    const legacyProject = {
      schemaVersion: "0.2.0",
      manifest: {
        id: "leg-1",
        name: "Legacy",
        version: "0.1.0",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        authoredStudios: ["photo"],
      },
      canvas: {},
      studios: {},
      brain: { recentPrompts: [], modelByStudio: {}, notes: [] },
      assets: [],
      audit: [
        {
          id: "evt-1",
          type: "session_start",
          timestamp: new Date().toISOString(),
          actor: "user",
          description: "Opened Legacy",
        },
      ],
    };

    const result = migrateProjectDraft(legacyProject);
    expect(result.success).toBe(true);
    expect(result.project?.schemaVersion).toBe("0.8.0");
    expect(result.project?.runtime).toBeDefined();
    expect(result.project?.canvasPreview).toBeDefined();
    expect(result.project?.photoProvider).toBeDefined();
    expect(result.project?.photoProvider?.jobs).toEqual([]);
    expect(result.project?.photoProvider?.sandboxRuns).toEqual([]);
    expect(result.project?.photoProvider?.liveRuns).toEqual([]);
    expect(result.project?.runtime?.executionHistory.length).toBe(0);
    expect(result.project?.audit?.length).toBe(1);
    expect(result.project?.audit?.[0].id).toBe("evt-1");
    expect(result.diagnostics.some((d) => d.code === "migrated_project_schema")).toBe(true);
  });

  it("rejects future schema version", () => {
    const futureProject = {
      schemaVersion: "0.9.0",
      manifest: {
        id: "fut-1",
        name: "Future",
        version: "0.1.0",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        authoredStudios: ["photo"],
      },
    };

    const result = migrateProjectDraft(futureProject);
    expect(result.success).toBe(false);
    expect(result.diagnostics.some((d) => d.code === "unsupported_future_project_schema")).toBe(true);
  });
});
