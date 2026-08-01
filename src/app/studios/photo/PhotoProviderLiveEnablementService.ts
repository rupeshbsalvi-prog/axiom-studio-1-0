import {
  recordWorkspaceAuditEvent,
  type WorkspaceAuditEvent,
} from "../../../workspace/WorkspaceAuditService";
import type { PhotoProviderReadinessReportV1 } from "./PhotoProviderReadinessPolicyTypes";

type Diagnostic = PhotoProviderReadinessReportV1["diagnostics"][number];

export interface PhotoProviderLiveEnablementResult {
  success: boolean;
  report: PhotoProviderReadinessReportV1;
  diagnostics: Diagnostic[];
}

export class PhotoProviderLiveEnablementService {
  static enable(input: {
    jobId: string;
    actor: string;
    readinessReport: PhotoProviderReadinessReportV1;
    operatorAcknowledgedNetworkExecution: boolean;
  }): PhotoProviderLiveEnablementResult {
    const { jobId, actor, readinessReport, operatorAcknowledgedNetworkExecution } = input;
    const diagnostics: Diagnostic[] = [];

    if (!readinessReport.readinessSatisfied) {
      diagnostics.push({
        severity: "error",
        code: "readiness_policy_not_satisfied",
        message: "A passing readiness report is required before live execution can be enabled.",
      });
    } else if (!operatorAcknowledgedNetworkExecution) {
      diagnostics.push({
        severity: "error",
        code: "live_enablement_consent_missing",
        message: "Explicit operator acknowledgement of network execution is required.",
      });
    }

    const success = diagnostics.length === 0;
    const enabledAtUtc = new Date().toISOString();
    const report: PhotoProviderReadinessReportV1 = success
      ? {
          ...readinessReport,
          executionBlockedByPhasePolicy: false,
          liveExecutionAvailable: true,
          liveEnablement: {
            contractVersion: "photo-provider-live-enablement.v1",
            jobId,
            actor,
            enabledAtUtc,
            operatorAcknowledgedNetworkExecution: true,
          },
        }
      : readinessReport;

    recordWorkspaceAuditEvent({
      id: `audit_live_enablement_${success ? "completed" : "failed"}_${jobId}_${Date.now()}`,
      timestamp: enabledAtUtc,
      studioId: "photo",
      type: "lifecycle",
      title: success ? "Live Execution Enabled" : "Live Execution Enablement Denied",
      message: success
        ? `Live execution enabled for job ${jobId} by actor ${actor}.`
        : `Live execution enablement denied for job ${jobId} by actor ${actor}.`,
      severity: success ? "success" : "error",
      source: "photo",
      metadata: {
        jobId,
        actor,
        executionBlockedByPhasePolicy: !success,
        liveExecutionAvailable: success,
        providerExecuted: false,
        networkAccessed: false,
        providerApiCalled: false,
        diagnosticCodes: diagnostics.map((diagnostic) => diagnostic.code),
      },
    } satisfies WorkspaceAuditEvent);

    return { success, report, diagnostics };
  }
}
