import type { PhotoProviderPersistenceJobRecord, PhotoProviderSandboxRunRecordV1 } from "../../projects/projectDraft";
import { intakeDryRunPreview } from "../../../workspace/CanvasPreviewIntakeService";
import type { RuntimeDryRunPreviewContractV1 } from "../../../runtime/activation/RuntimeActionDispatchTypes";
import {
  recordWorkspaceAuditEvent,
  createProviderSandboxExecutionRequestedEvent,
  createProviderSandboxExecutionCompletedEvent,
  createProviderSandboxExecutionFailedEvent,
} from "../../../workspace/WorkspaceAuditService";

/**
 * Recursively scans an object/array to check if any forbidden executable fields are present
 * with non-empty/non-null values.
 */
function hasForbiddenExecutableFields(obj: unknown): boolean {
  if (!obj || typeof obj !== "object") return false;
  if (Array.isArray(obj)) {
    return obj.some(hasForbiddenExecutableFields);
  }
  const rec = obj as Record<string, unknown>;
  const forbiddenKeys = [
    "moduleUrl",
    "script",
    "code",
    "functionBody",
    "endpointUrl",
    "apiKey",
    "secretRef",
    "adapterRuntime",
    "remoteAdapter",
  ];
  for (const key of Object.keys(rec)) {
    if (forbiddenKeys.includes(key)) {
      const val = rec[key];
      if (val !== undefined && val !== null && val !== "") {
        return true;
      }
    }
    if (hasForbiddenExecutableFields(rec[key])) {
      return true;
    }
  }
  return false;
}

export class PhotoProviderSandboxService {
  /**
   * Simulates an approved, non-executed photo provider adapter job record.
   * Restricts live execution and returns a sandbox run record detailing the outcome.
   *
   * Security constraints:
   *   1. Sandbox runs are simulation only (no actual provider code execution, no runtime package loading, no network calls).
   *   2. Rejected if any execution flag is already true.
   *   3. Rejected if executable adapter fields are structurally present.
   */
  static simulate(job: PhotoProviderPersistenceJobRecord): PhotoProviderSandboxRunRecordV1 {
    const requestedAt = new Date().toISOString();
    const studioId = "photo";
    const jobId = job.approval.approvalId;

    // Create unique run ID
    const runId = `sandbox_run_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

    // Log request
    recordWorkspaceAuditEvent(
      createProviderSandboxExecutionRequestedEvent({
        id: `audit_sandbox_req_${runId}`,
        studioId,
        title: "Sandbox Simulation Requested",
        message: `Sandbox simulation requested for job ${jobId} (Adapter: ${job.adapter.displayName}).`,
        timestamp: requestedAt,
        metadata: {
          jobId,
          runId,
          promptText: job.providerRequest.prompt.intent,
        },
      })
    );

    // Guard 1: Verify job status and initial security invariant flags
    const sec = job.security;
    if (
      (sec.providerExecuted as any) !== false ||
      sec.runtimeCodeLoaded !== false ||
      sec.moduleUrlExecuted !== false
    ) {
      const runRecord: PhotoProviderSandboxRunRecordV1 = {
        contractVersion: "photo-provider-sandbox-run.v1",
        id: runId,
        jobId,
        status: "simulated_failed",
        requestedAt,
        completedAt: new Date().toISOString(),
        diagnostics: [
          {
            severity: "error",
            code: "job_already_executed",
            message: "The job carries flags indicating it has already been executed.",
          },
        ],
        security: {
          providerExecuted: false,
          runtimeCodeLoaded: false,
          moduleUrlExecuted: false,
          networkAccessed: false,
          providerApiCalled: false,
        },
      };

      recordWorkspaceAuditEvent(
        createProviderSandboxExecutionFailedEvent({
          id: `audit_sandbox_fail_${runId}`,
          studioId,
          title: "Sandbox Simulation Failed",
          message: `Sandbox simulation failed: job ${jobId} contains flags indicating prior execution.`,
          timestamp: new Date().toISOString(),
          metadata: { jobId, runId, code: "job_already_executed" },
        })
      );

      return runRecord;
    }

    // Guard 2: Verify user approvals
    if (
      job.approval.userConfirmedProviderExecution !== true ||
      job.security.providerExecutionAllowed !== true
    ) {
      const runRecord: PhotoProviderSandboxRunRecordV1 = {
        contractVersion: "photo-provider-sandbox-run.v1",
        id: runId,
        jobId,
        status: "simulated_failed",
        requestedAt,
        completedAt: new Date().toISOString(),
        diagnostics: [
          {
            severity: "error",
            code: "missing_approvals",
            message: "The job lacks user confirmation or authorization for provider execution.",
          },
        ],
        security: {
          providerExecuted: false,
          runtimeCodeLoaded: false,
          moduleUrlExecuted: false,
          networkAccessed: false,
          providerApiCalled: false,
        },
      };

      recordWorkspaceAuditEvent(
        createProviderSandboxExecutionFailedEvent({
          id: `audit_sandbox_fail_${runId}`,
          studioId,
          title: "Sandbox Simulation Failed",
          message: `Sandbox simulation failed: job ${jobId} lacks necessary user authorization.`,
          timestamp: new Date().toISOString(),
          metadata: { jobId, runId, code: "missing_approvals" },
        })
      );

      return runRecord;
    }

    // Guard 3: Reject executable fields structurally
    if (hasForbiddenExecutableFields(job)) {
      const runRecord: PhotoProviderSandboxRunRecordV1 = {
        contractVersion: "photo-provider-sandbox-run.v1",
        id: runId,
        jobId,
        status: "simulated_failed",
        requestedAt,
        completedAt: new Date().toISOString(),
        diagnostics: [
          {
            severity: "error",
            code: "forbidden_executable_fields",
            message: "The job contains forbidden executable adapter configuration parameters.",
          },
        ],
        security: {
          providerExecuted: false,
          runtimeCodeLoaded: false,
          moduleUrlExecuted: false,
          networkAccessed: false,
          providerApiCalled: false,
        },
      };

      recordWorkspaceAuditEvent(
        createProviderSandboxExecutionFailedEvent({
          id: `audit_sandbox_fail_${runId}`,
          studioId,
          title: "Sandbox Simulation Failed",
          message: `Sandbox simulation failed: job ${jobId} contains executable configuration.`,
          timestamp: new Date().toISOString(),
          metadata: { jobId, runId, code: "forbidden_executable_fields" },
        })
      );

      return runRecord;
    }

    // Perform Local Sandbox dry-run candidate generation
    const mockPreview: RuntimeDryRunPreviewContractV1 = {
      contractVersion: "runtime-dry-run-preview.v1",
      kind: "photo_layout_preview",
      title: `Sandbox Simulation for job ${jobId}`,
      summary: `Offline local simulation of provider adapter: ${job.adapter.displayName}`,
      studioId: "photo",
      canvas: {
        width: 1920,
        height: 1080,
        aspectRatio: "16:9",
        background: "solid",
      },
      layers: [
        {
          id: `layer_${Date.now()}_1`,
          label: `Mock Sandbox Photo Layer (Prompt: ${job.providerRequest.prompt.intent})`,
          type: "image",
          bounds: { x: 100, y: 100, width: 800, height: 600 },
          opacity: 1,
          blendMode: "normal",
          source: "runtime-mock",
        },
      ],
      assemblySteps: [
        "Load offline sandbox photo layer",
        "Arrange visual elements locally in memory",
      ],
      exportTargets: [],
      estimatedDurationMs: 150,
      approvedForCanvasAssembly: false,
      security: {
        dryRun: true,
        noExecutionPerformed: true,
        runtimeCodeLoaded: false,
        moduleUrlExecuted: false,
      },
      metadata: {
        requiredAdapterContract: "photo-provider-adapter.v1",
        provenance: {
          type: "photo-provider-sandbox-provenance.v1",
          sandboxRunId: runId,
          jobId,
          simulatedAtUtc: requestedAt,
          adapter: {
            providerId: job.adapter.providerId,
            displayName: job.adapter.displayName,
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
    };

    // Route dry-run preview layers through CanvasPreviewIntakeService
    const intakeResult = intakeDryRunPreview({
      runtimeId: "photo-sandbox",
      actionId: "sandbox-simulation",
      preview: mockPreview,
    });

    if (!intakeResult.success || !intakeResult.candidate) {
      const runRecord: PhotoProviderSandboxRunRecordV1 = {
        contractVersion: "photo-provider-sandbox-run.v1",
        id: runId,
        jobId,
        status: "simulated_failed",
        requestedAt,
        completedAt: new Date().toISOString(),
        diagnostics: [
          {
            severity: "error",
            code: "intake_failed",
            message: "Failed to queue simulation preview into the Canvas preview intake service.",
          },
        ],
        security: {
          providerExecuted: false,
          runtimeCodeLoaded: false,
          moduleUrlExecuted: false,
          networkAccessed: false,
          providerApiCalled: false,
        },
      };

      recordWorkspaceAuditEvent(
        createProviderSandboxExecutionFailedEvent({
          id: `audit_sandbox_fail_${runId}`,
          studioId,
          title: "Sandbox Simulation Failed",
          message: `Sandbox simulation failed: Canvas Preview Intake rejected simulation output.`,
          timestamp: new Date().toISOString(),
          metadata: { jobId, runId, code: "intake_failed" },
        })
      );

      return runRecord;
    }

    // Success run record
    const runRecord: PhotoProviderSandboxRunRecordV1 = {
      contractVersion: "photo-provider-sandbox-run.v1",
      id: runId,
      jobId,
      status: "simulated_completed",
      requestedAt,
      completedAt: new Date().toISOString(),
      candidateId: intakeResult.candidate.id,
      diagnostics: [
        {
          severity: "info",
          code: "sandbox_completed",
          message: "Sandbox simulation ran successfully in offline local mode.",
        },
      ],
      security: {
        providerExecuted: false,
        runtimeCodeLoaded: false,
        moduleUrlExecuted: false,
        networkAccessed: false,
        providerApiCalled: false,
      },
    };

    recordWorkspaceAuditEvent(
      createProviderSandboxExecutionCompletedEvent({
        id: `audit_sandbox_comp_${runId}`,
        studioId,
        title: "Sandbox Simulation Completed",
        message: `Sandbox simulation completed for job ${jobId}. Candidate ID: ${intakeResult.candidate.id}.`,
        timestamp: new Date().toISOString(),
        metadata: {
          jobId,
          runId,
          candidateId: intakeResult.candidate.id,
        },
      })
    );

    return runRecord;
  }
}
