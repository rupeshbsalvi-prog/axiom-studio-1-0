/**
 * Phase 28 — PhotoProviderLiveAuthorityService Tests
 *
 * Tests all 8 authority evaluation rules. All tests exercise the stateless
 * evaluateLiveAuthority method. No gateway calls are made.
 */

import { describe, it, expect, beforeEach } from "vitest";
import { PhotoProviderLiveAuthorityService } from "../PhotoProviderLiveAuthorityService";
import type { AxiomProjectDraft, PhotoProviderPersistenceJobRecord } from "../../../projects/projectDraft";
import { createProjectDraft } from "../../../projects/projectDraft";
import type { PhotoProviderReadinessReportV1 } from "../PhotoProviderReadinessPolicyTypes";
import { AXPKG_LIMITS } from "../../../projects/axpkg/AxpkgTypes";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const makeReadinessReport = (
  readinessSatisfied = true,
  liveExecutionAvailable = true
): PhotoProviderReadinessReportV1 => ({
  readinessSatisfied,
  executionBlockedByPhasePolicy: !liveExecutionAvailable,
  liveExecutionAvailable,
  mockCredentialStaged: true,
  sandboxVerificationPassed: true,
  rollbackReady: true,
  checks: [],
  diagnostics: [],
  liveEnablement: liveExecutionAvailable
    ? {
        contractVersion: "photo-provider-live-enablement.v1",
        jobId: "job-123456",
        actor: "test-user",
        enabledAtUtc: new Date().toISOString(),
        operatorAcknowledgedNetworkExecution: true,
      }
    : undefined,
});

const makeJob = (overrides?: Partial<PhotoProviderPersistenceJobRecord>): PhotoProviderPersistenceJobRecord => ({
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
    prompt: { intent: "generate a test image", negativePrompt: "", backgroundStrategy: "transparent", aesthetic: "cinematic", lighting: "natural", colorPalette: [] },
    canvas: { width: 1024, height: 1024, aspectRatio: "1:1", transparentBackgroundRequired: true },
    layers: [],
    approval: { requiresUserApproval: true, approvedForProviderExecution: true },
    security: { dryRun: true, providerExecutionAllowed: false, providerExecuted: false, noExecutionPerformed: true },
  },
  ...overrides,
} as PhotoProviderPersistenceJobRecord);

function makeProject(jobOverrides?: Partial<PhotoProviderPersistenceJobRecord>, liveRunCount = 0): AxiomProjectDraft {
  const project = createProjectDraft({ name: "Authority Test", intent: "test", targetStudioId: "photo" });
  const job = makeJob(jobOverrides);
  project.photoProvider = {
    schemaVersion: "0.8.0",
    savedAt: new Date().toISOString(),
    jobs: [job],
    sandboxRuns: [],
    liveRuns: Array.from({ length: liveRunCount }, (_, i) => ({
      contractVersion: "photo-provider-live-run.v1" as const,
      id: `lr-${i}`,
      jobId: "prev-job",
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
    })),
  } as any;
  return project;
}

const BASELINE_INPUT = {
  jobId: "job-123456",
  readinessReport: makeReadinessReport(true),
  secondConfirmationAcknowledged: true,
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("PhotoProviderLiveAuthorityService", () => {
  describe("Rule 1: Phase Readiness and Live Policy Satisfied", () => {
    it("grants authority when readiness is satisfied and live execution is available", () => {
      const project = makeProject();
      const result = PhotoProviderLiveAuthorityService.evaluateLiveAuthority({ project, ...BASELINE_INPUT });
      expect(result.authorityGranted).toBe(true);
    });

    it("denies authority when readiness is not satisfied", () => {
      const project = makeProject();
      const result = PhotoProviderLiveAuthorityService.evaluateLiveAuthority({
        project,
        ...BASELINE_INPUT,
        readinessReport: makeReadinessReport(false),
      });
      expect(result.authorityGranted).toBe(false);
      expect(result.diagnostics.some((d) => d.code === "readiness_policy_not_satisfied")).toBe(true);
    });

    it("denies authority when live enablement evidence belongs to another job", () => {
      const project = makeProject();
      const report = makeReadinessReport(true, true);
      report.liveEnablement!.jobId = "another-job";

      const result = PhotoProviderLiveAuthorityService.evaluateLiveAuthority({
        project,
        ...BASELINE_INPUT,
        readinessReport: report,
      });

      expect(result.authorityGranted).toBe(false);
      expect(result.diagnostics.some((d) => d.code === "live_enablement_evidence_invalid")).toBe(true);
    });

    it("denies authority when readiness passes but phase policy still blocks live execution", () => {
      const project = makeProject();
      const result = PhotoProviderLiveAuthorityService.evaluateLiveAuthority({
        project,
        ...BASELINE_INPUT,
        readinessReport: makeReadinessReport(true, false),
      });
      expect(result.authorityGranted).toBe(false);
      expect(result.diagnostics.some((d) => d.code === "phase_policy_blocks_live_execution")).toBe(true);
    });
  });

  describe("Rule 2: Provider Adapter Allowlisted", () => {
    it("denies authority for non-allowlisted provider", () => {
      const project = makeProject({ adapter: { ...makeJob().adapter, providerId: "rogue-provider" } });
      const result = PhotoProviderLiveAuthorityService.evaluateLiveAuthority({ project, ...BASELINE_INPUT });
      expect(result.authorityGranted).toBe(false);
      expect(result.diagnostics.some((d) => d.code === "provider_not_allowlisted")).toBe(true);
    });

    it("allows mock-photo-provider", () => {
      const project = makeProject();
      const result = PhotoProviderLiveAuthorityService.evaluateLiveAuthority({ project, ...BASELINE_INPUT });
      const check = result.checks.find((c) => c.name === "Provider Adapter Allowlisted");
      expect(check?.passed).toBe(true);
    });
  });

  describe("Rule 4: Live Runs Cap", () => {
    it("denies authority when cap is reached", () => {
      const project = makeProject(undefined, AXPKG_LIMITS.maxPhotoProviderLiveRuns);
      const result = PhotoProviderLiveAuthorityService.evaluateLiveAuthority({ project, ...BASELINE_INPUT });
      expect(result.authorityGranted).toBe(false);
      expect(result.diagnostics.some((d) => d.code === "live_runs_cap_reached")).toBe(true);
    });

    it("allows execution when one below cap", () => {
      const project = makeProject(undefined, AXPKG_LIMITS.maxPhotoProviderLiveRuns - 1);
      const result = PhotoProviderLiveAuthorityService.evaluateLiveAuthority({ project, ...BASELINE_INPUT });
      const check = result.checks.find((c) => c.name === "Live Runs Cap Not Reached");
      expect(check?.passed).toBe(true);
    });
  });

  describe("Rule 5: Second Confirmation Acknowledged", () => {
    it("denies authority when second confirmation is not acknowledged", () => {
      const project = makeProject();
      const result = PhotoProviderLiveAuthorityService.evaluateLiveAuthority({
        project,
        ...BASELINE_INPUT,
        secondConfirmationAcknowledged: false,
      });
      expect(result.authorityGranted).toBe(false);
      expect(result.diagnostics.some((d) => d.code === "second_confirmation_missing")).toBe(true);
    });
  });

  describe("Rule 6: Parent Job Security Flags Intact", () => {
    it("denies authority when providerExecuted is true", () => {
      const project = makeProject({
        security: {
          providerExecutionAllowed: true,
          providerExecuted: true, // VIOLATED
          runtimeCodeLoaded: false,
          moduleUrlExecuted: false,
        } as any,
      });
      const result = PhotoProviderLiveAuthorityService.evaluateLiveAuthority({ project, ...BASELINE_INPUT });
      expect(result.authorityGranted).toBe(false);
      expect(result.diagnostics.some((d) => d.code === "parent_job_flags_violated")).toBe(true);
    });

    it("denies authority when runtimeCodeLoaded is true", () => {
      const project = makeProject({
        security: {
          providerExecutionAllowed: true,
          providerExecuted: false,
          runtimeCodeLoaded: true, // VIOLATED
          moduleUrlExecuted: false,
        } as any,
      });
      const result = PhotoProviderLiveAuthorityService.evaluateLiveAuthority({ project, ...BASELINE_INPUT });
      expect(result.authorityGranted).toBe(false);
    });
  });

  describe("Rule 7: Job Status", () => {
    it("denies authority when job status is not ready_for_provider_execution", () => {
      const project = makeProject({ status: "draft" as any });
      const result = PhotoProviderLiveAuthorityService.evaluateLiveAuthority({ project, ...BASELINE_INPUT });
      expect(result.authorityGranted).toBe(false);
      expect(result.diagnostics.some((d) => d.code === "job_status_not_ready")).toBe(true);
    });
  });

  describe("Rule 8: User Consent", () => {
    it("denies authority when userConfirmedProviderExecution is false", () => {
      const project = makeProject({
        approval: {
          approvalId: "job-123456",
          approvedBy: "test-user",
          approvedAtUtc: new Date().toISOString(),
          userConfirmedProviderExecution: false, // not consented
        },
      });
      const result = PhotoProviderLiveAuthorityService.evaluateLiveAuthority({ project, ...BASELINE_INPUT });
      expect(result.authorityGranted).toBe(false);
      expect(result.diagnostics.some((d) => d.code === "user_consent_missing")).toBe(true);
    });
  });

  describe("Report structure", () => {
    it("returns 8 checks in the authority report", () => {
      const project = makeProject();
      const result = PhotoProviderLiveAuthorityService.evaluateLiveAuthority({ project, ...BASELINE_INPUT });
      expect(result.checks.length).toBe(8);
    });

    it("returns no diagnostics when all rules pass", () => {
      const project = makeProject();
      const result = PhotoProviderLiveAuthorityService.evaluateLiveAuthority({ project, ...BASELINE_INPUT });
      expect(result.authorityGranted).toBe(true);
      expect(result.diagnostics.length).toBe(0);
    });
  });
});
