import type { AxiomProjectDraft } from "../../projects/projectDraft";
import { isSandboxProvenanceV1 } from "../../projects/projectDraft";
import type { PhotoProviderReadinessReportV1, PhotoProviderReadinessCheckV1 } from "./PhotoProviderReadinessPolicyTypes";
import {
  recordWorkspaceAuditEvent,
  createReadinessCheckRequestedEvent,
  createReadinessCheckCompletedEvent,
  createReadinessCheckFailedEvent
} from "../../../workspace/WorkspaceAuditService";

export class PhotoProviderReadinessPolicyService {
  private static mockCredentials: Set<string> = new Set();

  static stageMockProviderCredential(providerId: string): void {
    if (providerId) {
      this.mockCredentials.add(providerId);
    }
  }

  static clearMockProviderCredential(providerId: string): void {
    this.mockCredentials.delete(providerId);
  }

  static hasMockProviderCredential(providerId: string): boolean {
    return this.mockCredentials.has(providerId);
  }

  static clearAllMockProviderCredentials(): void {
    this.mockCredentials.clear();
  }

  static async verifyReadiness(input: {
    project: AxiomProjectDraft;
    jobId: string;
    actor: string;
    environment?: {
      sandboxIsolationVerified: boolean;
      networkPolicyBlocked: true;
      providerApiPolicyBlocked: true;
    };
  }): Promise<PhotoProviderReadinessReportV1> {
    const { project, jobId, actor, environment } = input;
    const timestamp = new Date().toISOString();
    const studioId = "photo";

    // 1. Audit check requested
    recordWorkspaceAuditEvent(
      createReadinessCheckRequestedEvent({
        id: `audit_readiness_req_${jobId}_${Date.now()}`,
        studioId,
        title: "Readiness Policy Check Requested",
        message: `Execution readiness policy check requested for job ${jobId} by actor ${actor}.`,
        timestamp,
        metadata: {
          jobId,
          actor,
          executionBlockedByPhasePolicy: true,
          liveExecutionAvailable: false,
          providerExecuted: false,
          networkAccessed: false,
          providerApiCalled: false,
        },
      })
    );

    const checks: PhotoProviderReadinessCheckV1[] = [];
    const diagnostics: Array<{ severity: "info" | "warning" | "error"; code: string; message: string }> = [];

    // Find job
    const jobs = project.photoProvider?.jobs ?? [];
    const job = jobs.find((j) => j.approval.approvalId === jobId);

    // Rule 1: Approved Provider Job Exists
    const jobExists = !!job;
    checks.push({
      name: "Approved Provider Job Exists",
      passed: jobExists,
      detail: jobExists ? `Found job record ${jobId}` : `Job record ${jobId} not found in project draft`,
    });
    if (!jobExists) {
      diagnostics.push({
        severity: "error",
        code: "job_not_found",
        message: `The approved provider job ${jobId} does not exist in this project.`,
      });
    }

    // Initialize mock values if job does not exist to avoid crashing
    const userConsent = jobExists ? job.approval.userConfirmedProviderExecution === true : false;
    const statusReady = jobExists ? job.status === "ready_for_provider_execution" : false;
    const parentJobFlagsOk = jobExists
      ? job.security.providerExecuted === false &&
        job.security.runtimeCodeLoaded === false &&
        job.security.moduleUrlExecuted === false
      : false;

    // Rule 2: User Consent
    checks.push({
      name: "User Consent Confirmed",
      passed: userConsent,
      detail: userConsent ? "User confirmed provider execution is set to true" : "Explicit user consent is missing",
    });
    if (!userConsent) {
      diagnostics.push({
        severity: "error",
        code: "consent_missing",
        message: "User consent for executing the photo provider is not explicitly set.",
      });
    }

    // Rule 3: Ready for Execution Status
    checks.push({
      name: "Status Ready for Execution",
      passed: statusReady,
      detail: statusReady ? "Job status is ready_for_provider_execution" : `Job status is not ready (found: ${job?.status ?? "none"})`,
    });
    if (!statusReady && jobExists) {
      diagnostics.push({
        severity: "error",
        code: "job_status_invalid",
        message: `Job status is invalid. Expected 'ready_for_provider_execution', found '${job.status}'.`,
      });
    }

    // Rule 4: Non-Execution Safety Invariants
    checks.push({
      name: "Job Non-Execution Safety Invariants",
      passed: parentJobFlagsOk,
      detail: parentJobFlagsOk ? "All parent job execution flags are false" : "Job execution safety invariants are violated",
    });
    if (!parentJobFlagsOk && jobExists) {
      diagnostics.push({
        severity: "error",
        code: "safety_flags_violated",
        message: "One or more safety flags indicate the job has already been executed or modified dynamically.",
      });
    }

    // Rule 5: Sandbox Run Validation
    const sandboxRuns = project.photoProvider?.sandboxRuns ?? [];
    const sandboxRun = sandboxRuns.find((r) => r.jobId === jobId && r.status === "simulated_completed");
    const sandboxRunExists = !!sandboxRun;
    checks.push({
      name: "Successful Sandbox Run Exists",
      passed: sandboxRunExists,
      detail: sandboxRunExists
        ? `Found completed sandbox run record ${sandboxRun.id}`
        : "No completed sandbox simulation run record found for this job",
    });
    if (!sandboxRunExists) {
      diagnostics.push({
        severity: "error",
        code: "sandbox_run_missing",
        message: "A successful sandbox simulation run must be completed before checking live readiness.",
      });
    }

    // Rule 6: Candidate & Provenance Validation
    let candidateProvenanceValid = false;
    let candidateDetail = "No valid preview candidate matching sandbox run";
    if (sandboxRunExists && sandboxRun.candidateId) {
      const candidates = project.canvasPreview?.candidates ?? [];
      const candidate = candidates.find((c) => c.id === sandboxRun.candidateId);
      if (candidate) {
        const prov = candidate.preview.metadata?.provenance;
        if (isSandboxProvenanceV1(prov) && prov.sandboxRunId === sandboxRun.id) {
          candidateProvenanceValid = true;
          candidateDetail = `Verified sandbox provenance for candidate ${candidate.id}`;
        } else {
          candidateDetail = `Candidate ${candidate.id} has invalid/untrusted sandbox provenance metadata`;
        }
      }
    }
    checks.push({
      name: "Candidate Sandbox Provenance Verified",
      passed: candidateProvenanceValid,
      detail: candidateDetail,
    });
    if (sandboxRunExists && !candidateProvenanceValid) {
      diagnostics.push({
        severity: "error",
        code: "provenance_invalid",
        message: "Candidate sandbox provenance verification failed. Preview contract state might have been tampered.",
      });
    }

    // Rule 7: Risk Limits Validation
    let limitsPass = false;
    let limitsDetail = "Job information not loaded";
    if (jobExists) {
      const request = job.providerRequest;
      const limits = job.adapter.limits;
      const widthOk = request.canvas.width <= limits.maxWidth;
      const heightOk = request.canvas.height <= limits.maxHeight;
      const layersOk = request.layers.length <= limits.maxLayers;
      limitsPass = widthOk && heightOk && layersOk;
      limitsDetail = limitsPass
        ? `Requested dimensions [${request.canvas.width}x${request.canvas.height}] and layers [${request.layers.length}] fit within adapter limits`
        : `Requested dimensions or layers exceed adapter limits (Max: ${limits.maxWidth}x${limits.maxHeight}, Layers: ${limits.maxLayers})`;
    }
    checks.push({
      name: "Adapter Risk Limits Satisfied",
      passed: limitsPass,
      detail: limitsDetail,
    });
    if (jobExists && !limitsPass) {
      diagnostics.push({
        severity: "error",
        code: "limits_exceeded",
        message: "The requested dimensions or layer count exceeds the adapter limits.",
      });
    }

    // Rule 8: Adapter Gated Capabilities
    let capabilitiesMatch = false;
    let capabilitiesDetail = "Job information not loaded";
    if (jobExists) {
      const request = job.providerRequest;
      const capabilities = job.adapter.capabilities;
      const multiLayerViolation = request.layers.length > 1 && !capabilities.layeredOutput;
      const transparentViolation = request.canvas?.transparentBackgroundRequired && !capabilities.transparentBackground;
      capabilitiesMatch = !multiLayerViolation && !transparentViolation;
      capabilitiesDetail = capabilitiesMatch
        ? "Adapter supports all requested capabilities"
        : "Requested capabilities (transparent background / layered output) are not supported by adapter";
    }
    checks.push({
      name: "Adapter Gated Capabilities Match",
      passed: capabilitiesMatch,
      detail: capabilitiesDetail,
    });
    if (jobExists && !capabilitiesMatch) {
      diagnostics.push({
        severity: "error",
        code: "capabilities_mismatch",
        message: "The requested generation requires capabilities not supported by the adapter.",
      });
    }

    // Rule 9: Mock Credential Staged
    const hasMockCred = jobExists ? this.hasMockProviderCredential(job.adapter.providerId) : false;
    checks.push({
      name: "Mock Provider Credential Staged",
      passed: hasMockCred,
      detail: hasMockCred
        ? `Mock credential exists for provider ID: ${job?.adapter.providerId}`
        : "Mock credential registry is empty for this provider",
    });
    if (!hasMockCred) {
      diagnostics.push({
        severity: "error",
        code: "mock_credential_missing",
        message: "No mock provider credential is staged for live simulation. Staging is required.",
      });
    }

    // Rule 10: Environment Isolation Policy
    const isolationOk = environment?.sandboxIsolationVerified === true;
    checks.push({
      name: "Host Environment Isolation Verified",
      passed: isolationOk,
      detail: isolationOk ? "Simulated environment network policy is isolated and blocked" : "Environment isolation not verified",
    });
    if (!isolationOk) {
      diagnostics.push({
        severity: "error",
        code: "isolation_not_verified",
        message: "Host sandbox environment isolation cannot be verified.",
      });
    }

    // Rule 11: Rollback Safeguard Path
    const projections = project.canvasPreview?.projections ?? [];
    const rollbackReady = projections.length > 0;
    checks.push({
      name: "Rollback Safeguard Context Exists",
      passed: rollbackReady,
      detail: rollbackReady ? `Rollback projection history has ${projections.length} restore targets` : "No projections history targets exist",
    });
    if (!rollbackReady) {
      diagnostics.push({
        severity: "warning",
        code: "rollback_context_absent",
        message: "No projection snapshots exist. Execution rollback options will be constrained.",
      });
    }

    // Overall Readiness
    const readinessSatisfied =
      jobExists &&
      userConsent &&
      statusReady &&
      parentJobFlagsOk &&
      sandboxRunExists &&
      candidateProvenanceValid &&
      limitsPass &&
      capabilitiesMatch &&
      hasMockCred &&
      isolationOk;

    const report: PhotoProviderReadinessReportV1 = {
      readinessSatisfied,
      executionBlockedByPhasePolicy: true,
      liveExecutionAvailable: false,
      mockCredentialStaged: hasMockCred,
      sandboxVerificationPassed: sandboxRunExists && candidateProvenanceValid,
      rollbackReady,
      checks,
      diagnostics,
    };

    // Log completion
    const completionTimestamp = new Date().toISOString();
    const auditMeta = {
      jobId,
      actor,
      readinessSatisfied,
      executionBlockedByPhasePolicy: true,
      liveExecutionAvailable: false,
      providerExecuted: false,
      networkAccessed: false,
      providerApiCalled: false,
    };

    if (readinessSatisfied) {
      recordWorkspaceAuditEvent(
        createReadinessCheckCompletedEvent({
          id: `audit_readiness_comp_${jobId}_${Date.now()}`,
          studioId,
          title: "Readiness Policy Check Passed",
          message: `Readiness check passed for job ${jobId}. Live execution remains blocked by policy.`,
          timestamp: completionTimestamp,
          metadata: auditMeta,
        })
      );
    } else {
      recordWorkspaceAuditEvent(
        createReadinessCheckFailedEvent({
          id: `audit_readiness_fail_${jobId}_${Date.now()}`,
          studioId,
          title: "Readiness Policy Check Failed",
          message: `Readiness check failed for job ${jobId}. Reasons: ${diagnostics.map((d) => d.message).join("; ")}`,
          timestamp: completionTimestamp,
          metadata: auditMeta,
        })
      );
    }

    return report;
  }
}
