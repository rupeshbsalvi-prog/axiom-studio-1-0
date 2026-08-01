export interface PhotoProviderReadinessCheckV1 {
  name: string;
  passed: boolean;
  detail?: string;
}

export interface PhotoProviderReadinessReportV1 {
  readinessSatisfied: boolean;
  executionBlockedByPhasePolicy: boolean;
  liveExecutionAvailable: boolean;
  mockCredentialStaged: boolean;
  sandboxVerificationPassed: boolean;
  rollbackReady: boolean;
  checks: PhotoProviderReadinessCheckV1[];
  diagnostics: Array<{
    severity: "info" | "warning" | "error";
    code: string;
    message: string;
  }>;
  liveEnablement?: {
    contractVersion: "photo-provider-live-enablement.v1";
    jobId: string;
    actor: string;
    enabledAtUtc: string;
    operatorAcknowledgedNetworkExecution: true;
  };
}
