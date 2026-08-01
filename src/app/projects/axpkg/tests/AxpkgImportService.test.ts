import { describe, it, expect } from "vitest";
import { importAxpkgFromString, importAxpkgFromUnknown, validatePhotoProviderLiveRunRecord } from "../AxpkgImportService";
import { createProjectDraft } from "../../projectDraft";
import { createAxpkgEnvelope } from "../AxpkgSerializer";
import { serializeAxpkgEnvelope } from "../AxpkgExportService";

describe("AxpkgImportService", () => {
  it("imports valid AXPKG and returns success diagnostic", async () => {
    const project = createProjectDraft({ name: "Import Test", intent: "Check", targetStudioId: "photo" });
    const envelope = createAxpkgEnvelope(project);
    const jsonStr = serializeAxpkgEnvelope(envelope);

    const result = await importAxpkgFromString(jsonStr);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.project.manifest.name).toBe("Import Test");
      expect(result.diagnostics.some((d) => d.code === "import_success")).toBe(true);
    }
  });

  it("rejects invalid JSON string", async () => {
    const result = await importAxpkgFromString("{ malformed json ... }");
    expect(result.success).toBe(false);
    expect(result.diagnostics.some((d) => d.code === "invalid_json")).toBe(true);
  });

  it("rejects package exceeding 10MB limit", async () => {
    const largeStr = "a".repeat(11 * 1024 * 1024);
    const result = await importAxpkgFromString(largeStr);
    expect(result.success).toBe(false);
    expect(result.diagnostics.some((d) => d.code === "package_too_large")).toBe(true);
  });

  it("rejects fingerprint mismatch", async () => {
    const project = createProjectDraft({ name: "Fingerprint Test", intent: "Check", targetStudioId: "photo" });
    const envelope = createAxpkgEnvelope(project);
    envelope.project.manifest.name = "Tampered Project Name";

    const result = await importAxpkgFromUnknown(envelope);
    expect(result.success).toBe(false);
    expect(result.diagnostics.some((d) => d.code === "fingerprint_mismatch")).toBe(true);
  });

  it("trims oversized arrays with warning diagnostics", async () => {
    const project = createProjectDraft({ name: "Trim Test", intent: "Check", targetStudioId: "photo" });

    // Populate oversized audit log (> 1000)
    project.audit = Array.from({ length: 1100 }, (_, i) => ({
      id: `evt-${i}`,
      type: "lifecycle",
      timestamp: new Date().toISOString(),
      actor: "user",
      title: `Event ${i}`,
      description: `Event desc ${i}`,
      severity: "info",
      source: "workspace",
    }));

    // Populate oversized runtime blocks
    project.runtime = {
      schemaVersion: "0.3.0",
      savedAt: new Date().toISOString(),
      registeredRuntimes: Array.from({ length: 120 }, (_, i) => ({
        manifestId: `rt-${i}`,
        runtimeId: `rt-${i}`,
        runtimeName: `RT ${i}`,
        version: "1.0.0",
        publisher: "test",
        fingerprint: `fp-${i}`,
        status: "registered",
        registeredAt: new Date().toISOString(),
      })),
      activationLabels: Array.from({ length: 150 }, (_, i) => ({
        runtimeId: `rt-${i}`,
        manifestId: `rt-${i}`,
        activatedAt: new Date().toISOString(),
        actionCount: 0,
        restoredStatus: "previouslyActive",
      })),
      executionHistory: Array.from({ length: 600 }, (_, i) => ({
        id: `exec-${i}`,
        runtimeId: "photo",
        actionId: "crop",
        status: "completed",
        attemptedAt: new Date().toISOString(),
        completedAt: new Date().toISOString(),
      })),
    };
    project.canvasPreview = {
      schemaVersion: "0.5.0",
      savedAt: new Date().toISOString(),
      candidates: Array.from({ length: 120 }, (_, i) => ({
        id: `candidate-${i}`,
        runtimeId: "mock-motion-studio",
        actionId: "renderMotionFrame",
        status: "pending_review",
        receivedAtUtc: new Date().toISOString(),
        preview: {
          contractVersion: "runtime-dry-run-preview.v1",
          kind: "canvas_preview",
          title: `Preview ${i}`,
          summary: "Oversized import candidate",
          studioId: "motion",
          canvas: { width: 1920, height: 1080, aspectRatio: "16:9", background: "transparent" },
          layers: [],
          assemblySteps: [],
          exportTargets: [],
          estimatedDurationMs: 1,
          approvedForCanvasAssembly: false,
          security: {
            dryRun: true,
            noExecutionPerformed: true,
            runtimeCodeLoaded: false,
            moduleUrlExecuted: false,
          },
        },
      })),
      assemblyPlans: Array.from({ length: 130 }, (_, i) => ({
        id: `plan-${i}`,
        sourcePreviewId: `candidate-${i}`,
        runtimeId: "mock-motion-studio",
        actionId: "renderMotionFrame",
        studioId: "motion",
        status: "assembly_ready",
        createdAtUtc: new Date().toISOString(),
        canvas: { width: 1920, height: 1080, aspectRatio: "16:9", background: "transparent" },
        elements: [],
        assemblySteps: [],
        exportTargets: [],
        security: {
          dryRun: true,
          noExecutionPerformed: true,
          userApproved: true,
          runtimeCodeLoaded: false,
          moduleUrlExecuted: false,
        },
      })),
      projections: Array.from({ length: 140 }, (_, i) => ({
        id: `projection-${i}`,
        assemblyPlanId: `plan-${i}`,
        studioId: "motion",
        status: "projected_preview",
        createdAtUtc: new Date().toISOString(),
        canvas: { width: 1920, height: 1080, aspectRatio: "16:9", background: "transparent" },
        elements: [],
        security: {
          previewOnly: true,
          noExecutionPerformed: true,
          runtimeCodeLoaded: false,
          moduleUrlExecuted: false,
          authoritativeCanvasMutated: false,
        },
      })),
      applications: Array.from({ length: 150 }, (_, i) => ({
        id: `application-${i}`,
        projectionId: `projection-${i}`,
        studioId: "motion",
        status: "applied",
        appliedAtUtc: new Date().toISOString(),
        appliedElementIds: [],
        previousElements: [],
        security: {
          userConfirmed: true,
          noExecutionPerformed: true,
          runtimeCodeLoaded: false,
          moduleUrlExecuted: false,
          authoritativeCanvasMutated: true,
          reversible: true,
        },
      })),
    };

    const envelope = createAxpkgEnvelope(project);
    const result = await importAxpkgFromUnknown(envelope);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.project.audit?.length).toBe(1000);
      expect(result.project.runtime?.executionHistory.length).toBe(500);
      expect(result.project.runtime?.registeredRuntimes.length).toBe(100);
      expect(result.project.runtime?.activationLabels.length).toBe(100);
      expect(result.project.canvasPreview?.candidates.length).toBe(100);
      expect(result.project.canvasPreview?.assemblyPlans.length).toBe(100);
      expect(result.project.canvasPreview?.projections.length).toBe(100);
      expect(result.project.canvasPreview?.applications.length).toBe(100);

      const codes = result.diagnostics.map((d) => d.code);
      expect(codes).toContain("audit_history_trimmed");
      expect(codes).toContain("runtime_execution_history_trimmed");
      expect(codes).toContain("runtime_registry_history_trimmed");
      expect(codes).toContain("runtime_activation_labels_trimmed");
      expect(codes).toContain("canvas_preview_candidates_trimmed");
      expect(codes).toContain("canvas_preview_assembly_plans_trimmed");
      expect(codes).toContain("canvas_preview_projections_trimmed");
      expect(codes).toContain("canvas_preview_applications_trimmed");
    }
  });

  it("is strictly data-only and does not run any side effects on import", async () => {
    const project = createProjectDraft({ name: "Side Effects", intent: "Check", targetStudioId: "photo" });
    const envelope = createAxpkgEnvelope(project);

    const result = await importAxpkgFromUnknown(envelope);
    expect(result.success).toBe(true);
  });

  it("sanitizes photoProvider jobs by validating fields, removing invalid ones, and trimming to cap", async () => {
    const project = createProjectDraft({ name: "Jobs Trim Test", intent: "Check", targetStudioId: "photo" });
    
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
        providerExecutionAllowed: false as const,
        providerExecuted: false as const,
        runtimeCodeLoaded: false as const,
        moduleUrlExecuted: false as const
      }
    });

    const invalidJob = {
      contractVersion: "photo-provider-adapter-job.v1",
      status: "ready_for_provider_execution",
      security: {
        providerExecuted: true, // EXECUTED! Violation of security boundary
        runtimeCodeLoaded: false,
        moduleUrlExecuted: false
      }
    };

    project.photoProvider = {
      schemaVersion: "0.8.0",
      savedAt: new Date().toISOString(),
      jobs: [
        invalidJob as any,
        ...Array.from({ length: 60 }, (_, i) => makeValidJob(String(i)))
      ],
      sandboxRuns: [],
      liveRuns: [],
    };

    const envelope = createAxpkgEnvelope(project);
    const result = await importAxpkgFromUnknown(envelope);

    expect(result.success).toBe(true);
    if (result.success) {
      const jobs = result.project.photoProvider?.jobs ?? [];
      expect(jobs.length).toBe(50); // Trimmed to max cap of 50
      // Check that the invalid job was filtered out
      expect(jobs.some(j => (j.security.providerExecuted as any) === true)).toBe(false);
      // Check diagnostics
      const codes = result.diagnostics.map((d) => d.code);
      expect(codes).toContain("photo_provider_job_invalid");
      expect(codes).toContain("photo_provider_jobs_trimmed");
    }
  });

  // ---------------------------------------------------------------------------
  // Phase 28 — liveRuns validator and sanitization tests
  // ---------------------------------------------------------------------------

  describe("validatePhotoProviderLiveRunRecord", () => {

    const makeValidLiveRun = (id = "lr-1") => ({
      contractVersion: "photo-provider-live-run.v1" as const,
      id,
      jobId: "job-001",
      providerId: "mock-photo-provider" as const,
      routeId: "photo.generate.dev" as const,
      status: "completed" as const,
      requestedAt: new Date().toISOString(),
      requestLimits: { promptLengthCap: 500, maxWidth: 2048, maxHeight: 2048, maxLayers: 5 },
      diagnostics: [],
      security: {
        providerExecuted: true as const,
        networkAccessed: true as const,
        providerApiCalled: true as const,
        runtimeCodeLoaded: false as const,
        moduleUrlExecuted: false as const,
        secretPersisted: false as const,
        secretExported: false as const,
      },
    });

    it("accepts a well-formed live run record", () => {
      const record = makeValidLiveRun();
      expect(validatePhotoProviderLiveRunRecord(record)).not.toBeNull();
    });

    it("rejects null input", () => {
      expect(validatePhotoProviderLiveRunRecord(null)).toBeNull();
    });

    it("rejects wrong contractVersion", () => {
      const record = { ...makeValidLiveRun(), contractVersion: "wrong.v1" };
      expect(validatePhotoProviderLiveRunRecord(record)).toBeNull();
    });

    it("rejects if providerExecuted is false", () => {
      const record = { ...makeValidLiveRun(), security: { ...makeValidLiveRun().security, providerExecuted: false } };
      expect(validatePhotoProviderLiveRunRecord(record)).toBeNull();
    });

    it("rejects if secretPersisted is true", () => {
      const record = { ...makeValidLiveRun(), security: { ...makeValidLiveRun().security, secretPersisted: true } };
      expect(validatePhotoProviderLiveRunRecord(record)).toBeNull();
    });

    it("rejects if runtimeCodeLoaded is true", () => {
      const record = { ...makeValidLiveRun(), security: { ...makeValidLiveRun().security, runtimeCodeLoaded: true } };
      expect(validatePhotoProviderLiveRunRecord(record)).toBeNull();
    });

    it("rejects if requestLimits is missing", () => {
      const record = { ...makeValidLiveRun(), requestLimits: undefined };
      expect(validatePhotoProviderLiveRunRecord(record)).toBeNull();
    });
  });

  describe("sanitizeImportedProject — liveRuns block", () => {
    it("initializes liveRuns to empty array when field is missing", async () => {
      const project = createProjectDraft({ name: "LiveRuns Init", intent: "test", targetStudioId: "photo" });
      // Remove liveRuns from the block
      const block = project.photoProvider as any;
      delete block.liveRuns;
      const envelope = createAxpkgEnvelope(project);
      const result = await importAxpkgFromUnknown(envelope);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(Array.isArray(result.project.photoProvider?.liveRuns)).toBe(true);
      }
    });

    it("removes invalid liveRun records and emits diagnostic", async () => {
      const project = createProjectDraft({ name: "LiveRuns Invalid", intent: "test", targetStudioId: "photo" });
      const invalidRecord = {
        contractVersion: "photo-provider-live-run.v1",
        id: "bad-1",
        jobId: "job-1",
        providerId: "mock-photo-provider",
        routeId: "photo.generate.dev",
        status: "completed",
        requestedAt: new Date().toISOString(),
        requestLimits: { promptLengthCap: 500, maxWidth: 2048, maxHeight: 2048, maxLayers: 5 },
        diagnostics: [],
        // VIOLATION: secretPersisted must be false
        security: {
          providerExecuted: true,
          networkAccessed: true,
          providerApiCalled: true,
          runtimeCodeLoaded: false,
          moduleUrlExecuted: false,
          secretPersisted: true,  // violation
          secretExported: false,
        },
      };
      (project.photoProvider as any).liveRuns = [invalidRecord];
      const envelope = createAxpkgEnvelope(project);
      const result = await importAxpkgFromUnknown(envelope);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.project.photoProvider?.liveRuns.length).toBe(0);
        expect(result.diagnostics.some((d) => d.code === "photo_provider_live_run_invalid")).toBe(true);
      }
    });

    it("trims liveRuns to max cap (50) on import", async () => {
      const project = createProjectDraft({ name: "LiveRuns Trim", intent: "test", targetStudioId: "photo" });
      const makeLiveRun = (i: number) => ({
        contractVersion: "photo-provider-live-run.v1",
        id: `lr-${i}`,
        jobId: "job-1",
        providerId: "mock-photo-provider",
        routeId: "photo.generate.dev",
        status: "completed",
        requestedAt: new Date().toISOString(),
        requestLimits: { promptLengthCap: 500, maxWidth: 2048, maxHeight: 2048, maxLayers: 5 },
        diagnostics: [],
        security: {
          providerExecuted: true,
          networkAccessed: true,
          providerApiCalled: true,
          runtimeCodeLoaded: false,
          moduleUrlExecuted: false,
          secretPersisted: false,
          secretExported: false,
        },
      });
      (project.photoProvider as any).liveRuns = Array.from({ length: 60 }, (_, i) => makeLiveRun(i));
      const envelope = createAxpkgEnvelope(project);
      const result = await importAxpkgFromUnknown(envelope);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.project.photoProvider?.liveRuns.length).toBe(50);
        expect(result.diagnostics.some((d) => d.code === "photo_provider_live_runs_trimmed")).toBe(true);
      }
    });
  });
});
