import { beforeEach, describe, expect, it } from "vitest";
import {
  clearWorkspaceAuditEvents,
  getWorkspaceAuditEvents,
} from "../../../../workspace/WorkspaceAuditService";
import { PhotoProviderLiveEnablementService } from "../PhotoProviderLiveEnablementService";
import type { PhotoProviderReadinessReportV1 } from "../PhotoProviderReadinessPolicyTypes";

const readinessReport = (readinessSatisfied = true): PhotoProviderReadinessReportV1 => ({
  readinessSatisfied,
  executionBlockedByPhasePolicy: true,
  liveExecutionAvailable: false,
  mockCredentialStaged: true,
  sandboxVerificationPassed: true,
  rollbackReady: true,
  checks: [],
  diagnostics: [],
});

describe("PhotoProviderLiveEnablementService", () => {
  beforeEach(clearWorkspaceAuditEvents);

  it("creates job-bound evidence and enables live execution after explicit consent", () => {
    const result = PhotoProviderLiveEnablementService.enable({
      jobId: "job-28a",
      actor: "operator-1",
      readinessReport: readinessReport(),
      operatorAcknowledgedNetworkExecution: true,
    });

    expect(result.success).toBe(true);
    expect(result.report).toMatchObject({
      executionBlockedByPhasePolicy: false,
      liveExecutionAvailable: true,
      liveEnablement: {
        contractVersion: "photo-provider-live-enablement.v1",
        jobId: "job-28a",
        actor: "operator-1",
        operatorAcknowledgedNetworkExecution: true,
      },
    });
    expect(getWorkspaceAuditEvents().at(-1)?.metadata).toMatchObject({
      jobId: "job-28a",
      liveExecutionAvailable: true,
      executionBlockedByPhasePolicy: false,
      providerExecuted: false,
      networkAccessed: false,
    });
  });

  it.each([
    ["failed readiness", false, true, "readiness_policy_not_satisfied"],
    ["missing operator consent", true, false, "live_enablement_consent_missing"],
  ])("rejects %s without changing the report", (_label, ready, consent, code) => {
    const original = readinessReport(ready);
    const result = PhotoProviderLiveEnablementService.enable({
      jobId: "job-28a",
      actor: "operator-1",
      readinessReport: original,
      operatorAcknowledgedNetworkExecution: consent,
    });

    expect(result.success).toBe(false);
    expect(result.report).toBe(original);
    expect(result.diagnostics[0]?.code).toBe(code);
  });
});
