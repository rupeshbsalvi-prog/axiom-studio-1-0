/**
 * Phase 28 — PhotoProviderLiveExecutionService Tests
 *
 * Tests the full orchestration pipeline with mocked gateway and intake.
 * No real network calls are made. All parent job security flags are verified
 * to remain untouched after execution.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { PhotoProviderLiveExecutionService } from "../PhotoProviderLiveExecutionService";
import type { AxiomProjectDraft, PhotoProviderPersistenceJobRecord } from "../../../projects/projectDraft";
import { createProjectDraft } from "../../../projects/projectDraft";
import type { PhotoProviderReadinessReportV1 } from "../PhotoProviderReadinessPolicyTypes";
import { clearWorkspaceAuditEvents, getWorkspaceAuditEvents } from "../../../../workspace/WorkspaceAuditService";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const makeReadinessReport = (): PhotoProviderReadinessReportV1 => ({
  readinessSatisfied: true,
  executionBlockedByPhasePolicy: false,
  liveExecutionAvailable: true,
  mockCredentialStaged: true,
  sandboxVerificationPassed: true,
  rollbackReady: true,
  checks: [],
  diagnostics: [],
  liveEnablement: {
    contractVersion: "photo-provider-live-enablement.v1",
    jobId: "job-123456",
    actor: "test-user",
    enabledAtUtc: new Date().toISOString(),
    operatorAcknowledgedNetworkExecution: true,
  },
});

const makeJob = (): PhotoProviderPersistenceJobRecord => ({
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
    prompt: { intent: "generate a cute dog with transparent background", negativePrompt: "", backgroundStrategy: "transparent", aesthetic: "cinematic", lighting: "natural", colorPalette: [] },
    canvas: { width: 1024, height: 1024, aspectRatio: "1:1", transparentBackgroundRequired: true },
    layers: [{ index: 0, name: "main", type: "image", providerPrompt: "dog", blendMode: "normal", opacity: 1, transparentBackgroundRequired: true }],
    approval: { requiresUserApproval: true, approvedForProviderExecution: true },
    security: { dryRun: true, providerExecutionAllowed: false, providerExecuted: false, noExecutionPerformed: true },
  },
} as PhotoProviderPersistenceJobRecord);

function makeProject(): AxiomProjectDraft {
  const project = createProjectDraft({ name: "Exec Test", intent: "test", targetStudioId: "photo" });
  project.photoProvider = {
    schemaVersion: "0.8.0",
    savedAt: new Date().toISOString(),
    jobs: [makeJob()],
    sandboxRuns: [],
    liveRuns: [],
  } as any;
  return project;
}

const VALID_GATEWAY_RESPONSE = {
  contractVersion: "photo-provider-live-response.v1",
  routeId: "photo.generate.dev",
  status: "success",
  outputLayers: [
    {
      index: 0,
      label: "generated-layer",
      type: "image",
      source: "/api/photo/assets/0123456789abcdef0123456789abcdef?expires=1999999999&signature=0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef",
      width: 1024,
      height: 1024,
      opacity: 1,
      blendMode: "normal",
    },
  ],
  diagnostics: [],
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("PhotoProviderLiveExecutionService", () => {
  beforeEach(() => {
    clearWorkspaceAuditEvents();
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  describe("authority denial (no gateway call)", () => {
    it("returns failure without liveRunRecord when authority is denied", async () => {
      const project = makeProject();
      const result = await PhotoProviderLiveExecutionService.execute({
        project,
        jobId: "job-123456",
        actor: "test-user",
        readinessReport: { ...makeReadinessReport(), readinessSatisfied: false },
        secondConfirmationAcknowledged: true,
        gatewayAccessToken: "user-session-token",
      });
      expect(result.success).toBe(false);
      expect(result.liveRunRecord).toBeUndefined();
    });

    it("does not call fetch when authority is denied", async () => {
      const fetchSpy = vi.fn();
      vi.stubGlobal("fetch", fetchSpy);
      const project = makeProject();
      await PhotoProviderLiveExecutionService.execute({
        project,
        jobId: "job-123456",
        actor: "test-user",
        readinessReport: { ...makeReadinessReport(), readinessSatisfied: false },
        secondConfirmationAcknowledged: true,
        gatewayAccessToken: "user-session-token",
      });
      expect(fetchSpy).not.toHaveBeenCalled();
    });

    it("does not call fetch when phase policy still blocks live execution", async () => {
      const fetchSpy = vi.fn();
      vi.stubGlobal("fetch", fetchSpy);
      const project = makeProject();
      const result = await PhotoProviderLiveExecutionService.execute({
        project,
        jobId: "job-123456",
        actor: "test-user",
        readinessReport: {
          ...makeReadinessReport(),
          executionBlockedByPhasePolicy: true,
          liveExecutionAvailable: false,
        },
        secondConfirmationAcknowledged: true,
        gatewayAccessToken: "user-session-token",
      });
      expect(result.success).toBe(false);
      expect(result.liveRunRecord).toBeUndefined();
      expect(result.diagnostics.some((d) => d.code === "phase_policy_blocks_live_execution")).toBe(true);
      expect(fetchSpy).not.toHaveBeenCalled();
    });
  });

  describe("successful execution pipeline", () => {
    beforeEach(() => {
      vi.stubEnv("VITE_PHOTO_DEV_GATEWAY", "http://test-gateway.local/dispatch");
      vi.stubGlobal(
        "fetch",
        vi.fn().mockResolvedValue({
          status: 202,
          json: async () => ({ jobId: "job-p29-mock-id", status: "queued" }),
        })
      );
    });

    it("returns success with a providerJobId and liveRunMetadata", async () => {
      const project = makeProject();
      const result = await PhotoProviderLiveExecutionService.execute({
        project,
        jobId: "job-123456",
        actor: "test-user",
        readinessReport: makeReadinessReport(),
        secondConfirmationAcknowledged: true,
        gatewayAccessToken: "user-session-token",
      });
      expect(result.success).toBe(true);
      expect(result.providerJobId).toBe("job-p29-mock-id");
      expect(result.liveRunMetadata).toBeDefined();
    });

    it("liveRunMetadata contains correct request limits and routeId", async () => {
      const project = makeProject();
      const result = await PhotoProviderLiveExecutionService.execute({
        project,
        jobId: "job-123456",
        actor: "test-user",
        readinessReport: makeReadinessReport(),
        secondConfirmationAcknowledged: true,
        gatewayAccessToken: "user-session-token",
      });
      expect(result.liveRunMetadata?.routeId).toBe("photo.generate.dev");
      expect(result.liveRunMetadata?.requestLimits.maxWidth).toBe(2048);
    });

    it("parent job security flags are NOT mutated by execution", async () => {
      const project = makeProject();
      const originalJob = project.photoProvider!.jobs[0]!;
      const beforeFlags = { ...originalJob.security };

      await PhotoProviderLiveExecutionService.execute({
        project,
        jobId: "job-123456",
        actor: "test-user",
        readinessReport: makeReadinessReport(),
        secondConfirmationAcknowledged: true,
        gatewayAccessToken: "user-session-token",
      });

      // Parent flags must remain unchanged
      expect(originalJob.security.providerExecuted).toBe(beforeFlags.providerExecuted);
      expect(originalJob.security.runtimeCodeLoaded).toBe(beforeFlags.runtimeCodeLoaded);
      expect(originalJob.security.moduleUrlExecuted).toBe(beforeFlags.moduleUrlExecuted);
    });

    it("liveRunMetadata does not contain endpoint URL or credentials", async () => {
      const project = makeProject();
      const result = await PhotoProviderLiveExecutionService.execute({
        project,
        jobId: "job-123456",
        actor: "test-user",
        readinessReport: makeReadinessReport(),
        secondConfirmationAcknowledged: true,
        gatewayAccessToken: "user-session-token",
      });
      const metaStr = JSON.stringify(result.liveRunMetadata);
      expect(metaStr).not.toContain("http://test-gateway.local");
      expect(metaStr).not.toContain("localhost");
    });

    it("emits provider_live_execution_requested audit event", async () => {
      const project = makeProject();
      clearWorkspaceAuditEvents();
      await PhotoProviderLiveExecutionService.execute({
        project,
        jobId: "job-123456",
        actor: "test-user",
        readinessReport: makeReadinessReport(),
        secondConfirmationAcknowledged: true,
        gatewayAccessToken: "user-session-token",
      });
      const events = getWorkspaceAuditEvents();
      const types = events.map((e) => e.type);
      expect(types).toContain("provider_live_execution_requested");
      expect(types).not.toContain("provider_live_execution_completed");
    });

    it("prompt is truncated to 500 characters", async () => {
      const project = makeProject();
      const longPrompt = "A".repeat(1000);
      project.photoProvider!.jobs[0]!.providerRequest.prompt.intent = longPrompt;

      const fetchSpy = vi.fn().mockResolvedValue({
        status: 202,
        json: async () => ({ jobId: "job-p29-mock-id", status: "queued" }),
      });
      vi.stubGlobal("fetch", fetchSpy);

      await PhotoProviderLiveExecutionService.execute({
        project,
        jobId: "job-123456",
        actor: "test-user",
        readinessReport: makeReadinessReport(),
        secondConfirmationAcknowledged: true,
        gatewayAccessToken: "user-session-token",
      });

      const [, options] = fetchSpy.mock.calls[0] as [string, RequestInit];
      const body = JSON.parse(options.body as string);
      expect(body.promptText.length).toBe(500);
    });
  });

  describe("gateway failure handling", () => {
    it("returns success false on gateway HTTP error", async () => {
      vi.stubEnv("VITE_PHOTO_DEV_GATEWAY", "http://test-gateway.local/dispatch");
      vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, status: 503 }));

      const project = makeProject();
      const result = await PhotoProviderLiveExecutionService.execute({
        project,
        jobId: "job-123456",
        actor: "test-user",
        readinessReport: makeReadinessReport(),
        secondConfirmationAcknowledged: true,
        gatewayAccessToken: "user-session-token",
      });
      expect(result.success).toBe(false);
      expect(result.providerJobId).toBeUndefined();
    });

    it("emits provider_live_execution_failed audit event on gateway error", async () => {
      vi.stubEnv("VITE_PHOTO_DEV_GATEWAY", "http://test-gateway.local/dispatch");
      vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("Network failure")));

      const project = makeProject();
      clearWorkspaceAuditEvents();
      await PhotoProviderLiveExecutionService.execute({
        project,
        jobId: "job-123456",
        actor: "test-user",
        readinessReport: makeReadinessReport(),
        secondConfirmationAcknowledged: true,
        gatewayAccessToken: "user-session-token",
      });
      const events = getWorkspaceAuditEvents();
      const types = events.map((e) => e.type);
      expect(types).toContain("provider_live_execution_failed");
    });
  });

  describe("fail-closed on missing env var", () => {
    it("returns failure and no metadata when env var is missing", async () => {
      vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
        status: 503,
        json: async () => ({ detail: "Photo gateway is not configured." }),
      }));

      const project = makeProject();
      const result = await PhotoProviderLiveExecutionService.execute({
        project,
        jobId: "job-123456",
        actor: "test-user",
        readinessReport: makeReadinessReport(),
        secondConfirmationAcknowledged: true,
        gatewayAccessToken: "user-session-token",
      });
      expect(result.success).toBe(false);
      expect(result.providerJobId).toBeUndefined();
      expect(result.diagnostics.some((d) => d.code === "gateway_enqueue_failed")).toBe(true);
    });
  });

  describe("authenticated gateway precondition", () => {
    it("executes with an established gateway session and no bearer token", async () => {
      vi.stubEnv("VITE_PHOTO_DEV_GATEWAY", "http://test-gateway.local/dispatch");
      vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
        status: 202,
        json: async () => ({ jobId: "job-p29-mock-id", status: "queued" }),
      }));

      const result = await PhotoProviderLiveExecutionService.execute({
        project: makeProject(),
        jobId: "job-123456",
        actor: "test-user",
        readinessReport: makeReadinessReport(),
        secondConfirmationAcknowledged: true,
        gatewaySessionAuthenticated: true,
      });

      expect(result.success).toBe(true);
      expect(result.providerJobId).toBe("job-p29-mock-id");
    });

    it("returns no live run and performs no fetch when the runtime access token is missing", async () => {
      vi.stubEnv("VITE_PHOTO_DEV_GATEWAY", "http://test-gateway.local/dispatch");
      const fetchSpy = vi.fn();
      vi.stubGlobal("fetch", fetchSpy);

      const result = await PhotoProviderLiveExecutionService.execute({
        project: makeProject(),
        jobId: "job-123456",
        actor: "test-user",
        readinessReport: makeReadinessReport(),
        secondConfirmationAcknowledged: true,
      });

      expect(result.success).toBe(false);
      expect(result.providerJobId).toBeUndefined();
      expect(result.diagnostics.some((d) => d.code === "gateway_access_token_missing")).toBe(true);
      expect(fetchSpy).not.toHaveBeenCalled();
    });
  });
});
