import { describe, it, expect } from "vitest";
import { createProjectDraft, createEmptyPhotoProviderBlock } from "../../projectDraft";
import { createAxpkgEnvelope } from "../AxpkgSerializer";
import { importAxpkgFromUnknown } from "../AxpkgImportService";
import { migrateProjectDraft } from "../AxpkgMigrationService";

describe("PhotoProviderPersistenceBlock & Schema 0.7.0", () => {
  const makeValidJob = (id: string) => ({
    contractVersion: "photo-provider-adapter-job.v1" as const,
    status: "ready_for_provider_execution" as const,
    providerRequest: {
      contractVersion: "photo-provider-request.v1" as const,
      studioId: "photo" as const,
      provider: { requestedName: "Imagine X", planningMode: "flexible", planningStatus: "draft" },
      prompt: { intent: `intent-${id}`, negativePrompt: "", backgroundStrategy: "solid", aesthetic: "cinematic", lighting: "warm", colorPalette: [] },
      canvas: { width: 512, height: 512, aspectRatio: "1:1", transparentBackgroundRequired: true as const },
      layers: [],
      approval: { requiresUserApproval: true as const, approvedForProviderExecution: true },
      security: { dryRun: true as const, providerExecutionAllowed: false as const, providerExecuted: false as const, noExecutionPerformed: true as const }
    },
    adapter: {
      contractVersion: "photo-provider-adapter.v1" as const,
      providerId: `adapter-${id}`,
      displayName: `DisplayName ${id}`,
      capabilities: { imageGeneration: true, transparentBackground: true, layeredOutput: false },
      limits: { maxWidth: 1024, maxHeight: 1024, maxLayers: 1 },
      security: { requiresExplicitApproval: true as const, executesOutsideRuntimeMock: true as const, storesSecrets: false as const }
    },
    approval: {
      approvalId: `app-${id}`,
      approvedBy: "user",
      approvedAtUtc: new Date().toISOString(),
      userConfirmedProviderExecution: true
    },
    security: {
      providerExecutionAllowed: true as const,
      providerExecuted: false as const,
      runtimeCodeLoaded: false as const,
      moduleUrlExecuted: false as const
    }
  });

  const makeValidSandboxRun = (id: string, jobId: string) => ({
    contractVersion: "photo-provider-sandbox-run.v1" as const,
    id: `run-${id}`,
    jobId,
    status: "simulated_completed" as const,
    requestedAt: new Date().toISOString(),
    completedAt: new Date().toISOString(),
    candidateId: `cand-${id}`,
    diagnostics: [],
    security: {
      providerExecuted: false as const,
      runtimeCodeLoaded: false as const,
      moduleUrlExecuted: false as const,
      networkAccessed: false as const,
      providerApiCalled: false as const
    }
  });

  const makeValidLiveRun = (id: string, jobId: string) => ({
    contractVersion: "photo-provider-live-run.v1" as const,
    id: `live-${id}`,
    jobId,
    providerId: "mock-photo-provider" as const,
    routeId: "photo.generate.dev" as const,
    status: "completed" as const,
    requestedAt: new Date().toISOString(),
    completedAt: new Date().toISOString(),
    requestLimits: { promptLengthCap: 500, maxWidth: 2048, maxHeight: 2048, maxLayers: 5 },
    diagnostics: [],
    security: {
      providerExecuted: true as const,
      runtimeCodeLoaded: false as const,
      moduleUrlExecuted: false as const,
      networkAccessed: true as const,
      providerApiCalled: true as const,
      secretPersisted: false as const,
      secretExported: false as const
    },
    audit: {
      requestedEventId: `evt-req-${id}`,
      completedEventId: `evt-comp-${id}`
    }
  });


  it("1. imports empty photoProvider block when missing on canonical 0.8.0 import", async () => {
    const project = createProjectDraft({ name: "Legacy Import", intent: "Test", targetStudioId: "photo" });
    project.schemaVersion = "0.8.0";
    delete project.photoProvider;

    const envelope = createAxpkgEnvelope(project);
    const result = await importAxpkgFromUnknown(envelope);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.project.photoProvider).toBeDefined();
      expect(result.project.photoProvider?.schemaVersion).toBe("0.8.0");
      expect(result.project.photoProvider?.jobs).toEqual([]);
      expect(result.project.photoProvider?.sandboxRuns).toEqual([]);
      expect(result.project.photoProvider?.liveRuns).toEqual([]);
      expect(result.diagnostics.some(d => d.code === "photo_provider_block_missing")).toBe(true);
    }
  });

  it("2. serializes photoProvider block as part of axpkg envelope", () => {
    const project = createProjectDraft({ name: "Export Test", intent: "Test", targetStudioId: "photo" });
    project.schemaVersion = "0.7.0";
    const job = makeValidJob("1");
    const run = makeValidSandboxRun("1", job.approval.approvalId);
    project.photoProvider = {
      schemaVersion: "0.8.0",
      savedAt: new Date().toISOString(),
      jobs: [job],
      sandboxRuns: [run],
      liveRuns: [],
    };

    const envelope = createAxpkgEnvelope(project);
    expect(envelope.project.photoProvider).toBeDefined();
    expect(envelope.project.photoProvider?.jobs).toHaveLength(1);
    expect(envelope.project.photoProvider?.sandboxRuns).toHaveLength(1);
    expect(envelope.project.photoProvider?.jobs[0].providerRequest.prompt.intent).toBe("intent-1");
    expect(envelope.portability.photoProviderJobsIncluded).toBe(true);
    expect(envelope.portability.photoProviderSandboxRunsIncluded).toBe(true);
  });

  it("3. excludes jobs but preserves empty photoProvider block structure on serialization when includePhotoProviderJobs is false", () => {
    const project = createProjectDraft({ name: "Export Test Empty", intent: "Test", targetStudioId: "photo" });
    project.schemaVersion = "0.7.0";
    const job = makeValidJob("1");
    project.photoProvider = {
      schemaVersion: "0.8.0",
      savedAt: new Date().toISOString(),
      jobs: [job],
      sandboxRuns: [],
      liveRuns: [],
    };

    const envelope = createAxpkgEnvelope(project, { includePhotoProviderJobs: false });
    expect(envelope.project.photoProvider).toBeDefined();
    expect(envelope.project.photoProvider?.jobs).toHaveLength(0); // Emptied out
    expect(envelope.project.photoProvider?.schemaVersion).toBe("0.8.0");
    expect(envelope.portability.photoProviderJobsIncluded).toBe(false);
  });

  it("4. rejects job record when contractVersion is incorrect", async () => {
    const project = createProjectDraft({ name: "Bad Contract Version", intent: "Test", targetStudioId: "photo" });
    const invalidJob = makeValidJob("1");
    (invalidJob as any).contractVersion = "bad-contract";

    project.photoProvider = {
      schemaVersion: "0.8.0",
      savedAt: new Date().toISOString(),
      jobs: [invalidJob],
      sandboxRuns: [],
      liveRuns: [],
    };

    const envelope = createAxpkgEnvelope(project);
    const result = await importAxpkgFromUnknown(envelope);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.project.photoProvider?.jobs).toHaveLength(0);
      expect(result.diagnostics.some(d => d.code === "photo_provider_job_invalid")).toBe(true);
    }
  });

  it("5. rejects job record when status is incorrect", async () => {
    const project = createProjectDraft({ name: "Bad Status", intent: "Test", targetStudioId: "photo" });
    const invalidJob = makeValidJob("1");
    (invalidJob as any).status = "executed";

    project.photoProvider = {
      schemaVersion: "0.8.0",
      savedAt: new Date().toISOString(),
      jobs: [invalidJob],
      sandboxRuns: [],
      liveRuns: [],
    };

    const envelope = createAxpkgEnvelope(project);
    const result = await importAxpkgFromUnknown(envelope);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.project.photoProvider?.jobs).toHaveLength(0);
      expect(result.diagnostics.some(d => d.code === "photo_provider_job_invalid")).toBe(true);
    }
  });

  it("6. rejects job record when any of the security execution flags are true", async () => {
    const project = createProjectDraft({ name: "Exec Violation", intent: "Test", targetStudioId: "photo" });
    
    // Case A: providerExecuted is true
    const jobA = makeValidJob("A");
    jobA.security.providerExecuted = true as any;

    // Case B: runtimeCodeLoaded is true
    const jobB = makeValidJob("B");
    jobB.security.runtimeCodeLoaded = true as any;

    // Case C: moduleUrlExecuted is true
    const jobC = makeValidJob("C");
    jobC.security.moduleUrlExecuted = true as any;

    project.photoProvider = {
      schemaVersion: "0.8.0",
      savedAt: new Date().toISOString(),
      jobs: [jobA, jobB, jobC],
      sandboxRuns: [],
      liveRuns: [],
    };

    const envelope = createAxpkgEnvelope(project);
    const result = await importAxpkgFromUnknown(envelope);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.project.photoProvider?.jobs).toHaveLength(0);
      expect(result.diagnostics.filter(d => d.code === "photo_provider_job_invalid")).toHaveLength(3);
    }
  });

  it("7. filters out invalid job records during import sanitization and retains valid ones", async () => {
    const project = createProjectDraft({ name: "Filter Mix", intent: "Test", targetStudioId: "photo" });
    const validJob = makeValidJob("V");
    const invalidJob = makeValidJob("I");
    invalidJob.security.providerExecuted = true as any;

    project.photoProvider = {
      schemaVersion: "0.8.0",
      savedAt: new Date().toISOString(),
      jobs: [invalidJob, validJob],
      sandboxRuns: [],
      liveRuns: [],
    };

    const envelope = createAxpkgEnvelope(project);
    const result = await importAxpkgFromUnknown(envelope);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.project.photoProvider?.jobs).toHaveLength(1);
      expect(result.project.photoProvider?.jobs[0].providerRequest.prompt.intent).toBe("intent-V");
    }
  });

  it("8. caps jobs array at maxPhotoProviderJobs (50) and retains the latest jobs", async () => {
    const project = createProjectDraft({ name: "Oversized Jobs", intent: "Test", targetStudioId: "photo" });
    project.photoProvider = {
      schemaVersion: "0.8.0",
      savedAt: new Date().toISOString(),
      jobs: Array.from({ length: 60 }, (_, i) => makeValidJob(String(i))),
      sandboxRuns: [],
      liveRuns: [],
    };

    const envelope = createAxpkgEnvelope(project);
    const result = await importAxpkgFromUnknown(envelope);
    expect(result.success).toBe(true);
    if (result.success) {
      const jobs = result.project.photoProvider?.jobs ?? [];
      expect(jobs).toHaveLength(50);
      expect(jobs[0].providerRequest.prompt.intent).toBe("intent-10");
      expect(jobs[49].providerRequest.prompt.intent).toBe("intent-59");
      expect(result.diagnostics.some(d => d.code === "photo_provider_jobs_trimmed")).toBe(true);
    }
  });

  // --- Phase 25 Schema 0.7.0 & Sandbox Runs Unit Tests ---
  it("18. createEmptyPhotoProviderBlock initializes sandboxRuns: []", () => {
    const block = createEmptyPhotoProviderBlock();
    expect(block.schemaVersion).toBe("0.8.0");
    expect(block.jobs).toEqual([]);
    expect(block.sandboxRuns).toEqual([]);
    expect(block.liveRuns).toEqual([]);
  });

  it("19. createProjectDraft creates schemaVersion 0.8.0", () => {
    const draft = createProjectDraft({ name: "V8", intent: "V8 Intent", targetStudioId: "photo" });
    expect(draft.schemaVersion).toBe("0.8.0");
  });

  it("20. createProjectDraft initializes photoProvider block empty", () => {
    const draft = createProjectDraft({ name: "V8", intent: "V8 Intent", targetStudioId: "photo" });
    expect(draft.photoProvider).toBeDefined();
    expect(draft.photoProvider?.schemaVersion).toBe("0.8.0");
    expect(draft.photoProvider?.jobs).toEqual([]);
    expect(draft.photoProvider?.sandboxRuns).toEqual([]);
    expect(draft.photoProvider?.liveRuns).toEqual([]);
  });

  it("21. 0.6.0 draft migrates to 0.7.0 with existing jobs preserved and sandboxRuns empty", () => {
    const oldJob = makeValidJob("old");
    const draft060 = {
      schemaVersion: "0.6.0",
      manifest: { id: "test", name: "test", version: "0.1.0", createdAt: "", updatedAt: "", authoredStudios: ["photo"] },
      canvas: {},
      studios: {},
      brain: { recentPrompts: [], modelByStudio: {}, notes: [] },
      assets: [],
      photoProvider: {
        schemaVersion: "0.6.0",
        savedAt: new Date().toISOString(),
        jobs: [oldJob]
      }
    };

    const migration = migrateProjectDraft(draft060);
    expect(migration.success).toBe(true);
    expect(migration.project?.schemaVersion).toBe("0.8.0");
    expect(migration.project?.photoProvider?.jobs).toHaveLength(1);
    expect(migration.project?.photoProvider?.jobs[0].providerRequest.prompt.intent).toBe("intent-old");
    expect(migration.project?.photoProvider?.sandboxRuns).toEqual([]);
    expect(migration.project?.photoProvider?.liveRuns).toEqual([]);
  });

  it("22. 0.5.0 draft migrates to 0.7.0 with legacy providerAdapterJobs lifted", () => {
    const legacyJob = makeValidJob("legacy");
    const draft050 = {
      schemaVersion: "0.5.0",
      manifest: { id: "test", name: "test", version: "0.1.0", createdAt: "", updatedAt: "", authoredStudios: ["photo"] },
      canvas: {},
      studios: {
        photo: {
          providerAdapterJobs: [legacyJob]
        }
      },
      brain: { recentPrompts: [], modelByStudio: {}, notes: [] },
      assets: []
    };

    const migration = migrateProjectDraft(draft050);
    expect(migration.success).toBe(true);
    expect(migration.project?.schemaVersion).toBe("0.8.0");
    expect(migration.project?.photoProvider?.jobs).toHaveLength(1);
    expect(migration.project?.photoProvider?.jobs[0].providerRequest.prompt.intent).toBe("intent-legacy");
    expect(migration.project?.photoProvider?.sandboxRuns).toEqual([]);
    expect(migration.project?.photoProvider?.liveRuns).toEqual([]);
  });

  it("23. Future schema 0.9.0 is rejected", () => {
    const draft090 = {
      schemaVersion: "0.9.0",
      manifest: { id: "test", name: "test", version: "0.1.0", createdAt: "", updatedAt: "", authoredStudios: ["photo"] }
    };
    const migration = migrateProjectDraft(draft090);
    expect(migration.success).toBe(false);
    expect(migration.diagnostics[0].code).toBe("unsupported_future_project_schema");
  });

  it("24. Import over maxPhotoProviderSandboxRuns trims sandboxRuns and preserves latest 50", async () => {
    const project = createProjectDraft({ name: "Oversized Runs", intent: "Test", targetStudioId: "photo" });
    project.schemaVersion = "0.7.0";
    project.photoProvider = {
      schemaVersion: "0.8.0",
      savedAt: new Date().toISOString(),
      jobs: [],
      sandboxRuns: Array.from({ length: 60 }, (_, i) => makeValidSandboxRun(String(i), "job-id")),
      liveRuns: [],
    };

    const envelope = createAxpkgEnvelope(project);
    const result = await importAxpkgFromUnknown(envelope);
    expect(result.success).toBe(true);
    if (result.success) {
      const runs = result.project.photoProvider?.sandboxRuns ?? [];
      expect(runs).toHaveLength(50);
      expect(runs[0].id).toBe("run-10");
      expect(runs[49].id).toBe("run-59");
      expect(result.diagnostics.some(d => d.code === "photo_provider_sandbox_runs_trimmed")).toBe(true);
    }
  });

  it("25. Export/import roundtrip preserves sandboxRuns", async () => {
    const project = createProjectDraft({ name: "Roundtrip", intent: "Test", targetStudioId: "photo" });
    project.schemaVersion = "0.7.0";
    project.photoProvider = {
      schemaVersion: "0.8.0",
      savedAt: new Date().toISOString(),
      jobs: [],
      sandboxRuns: [makeValidSandboxRun("RT", "job-id")],
      liveRuns: [],
    };

    const envelope = createAxpkgEnvelope(project);
    const result = await importAxpkgFromUnknown(envelope);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.project.photoProvider?.sandboxRuns).toHaveLength(1);
      expect(result.project.photoProvider?.sandboxRuns[0].id).toBe("run-RT");
    }
  });

  it("26. includePhotoProviderSandboxRuns: false empties sandboxRuns block in serialization", () => {
    const project = createProjectDraft({ name: "Option Test", intent: "Test", targetStudioId: "photo" });
    project.schemaVersion = "0.7.0";
    project.photoProvider = {
      schemaVersion: "0.8.0",
      savedAt: new Date().toISOString(),
      jobs: [makeValidJob("J")],
      sandboxRuns: [makeValidSandboxRun("R", "job-J")],
      liveRuns: [],
    };

    const envelope = createAxpkgEnvelope(project, { includePhotoProviderSandboxRuns: false });
    expect(envelope.project.photoProvider?.jobs).toHaveLength(1);
    expect(envelope.project.photoProvider?.sandboxRuns).toHaveLength(0); // Emptied
    expect(envelope.portability.photoProviderSandboxRunsIncluded).toBe(false);
  });

  it("27. includePhotoProviderLiveRuns: false empties liveRuns block in serialization", () => {
    const project = createProjectDraft({ name: "Option Test Live", intent: "Test", targetStudioId: "photo" });
    project.schemaVersion = "0.7.0";
    project.photoProvider = {
      schemaVersion: "0.8.0",
      savedAt: new Date().toISOString(),
      jobs: [makeValidJob("J")],
      sandboxRuns: [],
      liveRuns: [makeValidLiveRun("L", "job-J")],
    };

    const envelope = createAxpkgEnvelope(project, { includePhotoProviderLiveRuns: false });
    expect(envelope.project.photoProvider?.jobs).toHaveLength(1);
    expect(envelope.project.photoProvider?.liveRuns).toHaveLength(0); // Emptied
    expect(envelope.portability.photoProviderLiveRunsIncluded).toBe(false);
  });

  it("28. Export/import roundtrip preserves liveRuns", async () => {
    const project = createProjectDraft({ name: "Roundtrip Live", intent: "Test", targetStudioId: "photo" });
    project.schemaVersion = "0.8.0";
    project.photoProvider = {
      schemaVersion: "0.8.0",
      savedAt: new Date().toISOString(),
      jobs: [],
      sandboxRuns: [],
      liveRuns: [makeValidLiveRun("RT-L", "job-id")]
    };

    const envelope = createAxpkgEnvelope(project);
    const result = await importAxpkgFromUnknown(envelope);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.project.photoProvider?.liveRuns).toHaveLength(1);
      expect(result.project.photoProvider?.liveRuns[0].id).toBe("live-RT-L");
    }
  });
});
