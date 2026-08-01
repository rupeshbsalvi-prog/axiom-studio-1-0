import type { AxiomProjectDraft } from "../projectDraft";
import type { AxpkgImportDiagnostic, AxiomPackageEnvelope } from "./AxpkgTypes";
import type { AxpkgTrustPolicy, AxpkgTrustResult } from "./AxpkgSignatureTypes";
import { AXPKG_LIMITS } from "./AxpkgTypes";
import { validateAxpkgEnvelope } from "./AxpkgValidator";
import { migrateProjectDraft } from "./AxpkgMigrationService";
import { evaluateAxpkgTrust } from "./AxpkgTrustService";
import type { PhotoProviderPersistenceJobRecord, PhotoProviderSandboxRunRecordV1, PhotoProviderLiveRunRecordV1 } from "../projectDraft";

/**
 * Validates that a candidate value looks like a well-formed
 * PhotoProviderSandboxRunRecordV1. Checks contractVersion, status,
 * and security-invariant flags. Returns the record if valid,
 * null if it should be rejected with a diagnostic.
 *
 * Safeguard: all sandbox run security flags must remain false/offline.
 */
export function validatePhotoProviderSandboxRunRecord(
  candidate: unknown
): PhotoProviderSandboxRunRecordV1 | null {
  if (!candidate || typeof candidate !== "object" || Array.isArray(candidate)) return null;
  const r = candidate as Record<string, unknown>;

  if (r.contractVersion !== "photo-provider-sandbox-run.v1") return null;
  if (typeof r.id !== "string" || typeof r.jobId !== "string") return null;
  if (r.status !== "simulated_completed" && r.status !== "simulated_failed") return null;
  if (typeof r.requestedAt !== "string") return null;

  // Diagnostics check
  if (r.diagnostics && !Array.isArray(r.diagnostics)) return null;

  // Security invariants: all sandbox run security flags must remain false/offline
  const sec = r.security as Record<string, unknown> | undefined;
  if (!sec || typeof sec !== "object" || Array.isArray(sec)) return null;
  if (sec.providerExecuted !== false) return null;
  if (sec.runtimeCodeLoaded !== false) return null;
  if (sec.moduleUrlExecuted !== false) return null;
  if (sec.networkAccessed !== false) return null;
  if (sec.providerApiCalled !== false) return null;

  return r as unknown as PhotoProviderSandboxRunRecordV1;
}

/**
 * Validates that a candidate value looks like a well-formed
 * PhotoProviderPersistenceJobRecord. Checks contractVersion, status,
 * and the three security-invariant flags. Returns the record if valid,
 * null if it should be rejected with a diagnostic.
 *
 * Safeguard: all three non-execution flags (providerExecuted,
 * runtimeCodeLoaded, moduleUrlExecuted) must be strictly false.
 */
export function validatePhotoProviderPersistenceJobRecord(
  candidate: unknown
): PhotoProviderPersistenceJobRecord | null {
  if (!candidate || typeof candidate !== "object" || Array.isArray(candidate)) return null;
  const j = candidate as Record<string, unknown>;

  // Contract version
  if (j.contractVersion !== "photo-provider-adapter-job.v1") return null;

  // Status
  if (j.status !== "ready_for_provider_execution") return null;

  // Security invariants: all three must be explicitly false
  const sec = j.security as Record<string, unknown> | undefined;
  if (!sec || typeof sec !== "object" || Array.isArray(sec)) return null;
  if (sec.providerExecuted !== false) return null;
  if (sec.runtimeCodeLoaded !== false) return null;
  if (sec.moduleUrlExecuted !== false) return null;

  // Adapter must have id and displayName (not a live object)
  const adapter = j.adapter as Record<string, unknown> | undefined;
  if (!adapter || typeof adapter !== "object" || Array.isArray(adapter)) return null;
  if (typeof adapter.providerId !== "string" || typeof adapter.displayName !== "string") return null;
  if (adapter.contractVersion !== "photo-provider-adapter.v1") return null;

  // Approval must have approvalId
  const approval = j.approval as Record<string, unknown> | undefined;
  if (!approval || typeof approval !== "object" || Array.isArray(approval)) return null;
  if (typeof approval.approvalId !== "string") return null;

  // providerRequest must be a non-executing request
  const req = j.providerRequest as Record<string, unknown> | undefined;
  if (!req || typeof req !== "object" || Array.isArray(req)) return null;
  if (req.contractVersion !== "photo-provider-request.v1") return null;
  const reqSec = req.security as Record<string, unknown> | undefined;
  if (!reqSec || reqSec.providerExecuted !== false || reqSec.providerExecutionAllowed !== false) return null;

  return j as unknown as PhotoProviderPersistenceJobRecord;
}

/**
 * Validates that a candidate value looks like a well-formed
 * PhotoProviderLiveRunRecordV1. Checks contractVersion, status, required string
 * fields, and security-invariant flags. Returns the record if valid,
 * null if it should be rejected with a diagnostic.
 *
 * Security invariant matrix:
 *   providerExecuted   must be true   (live adapter was called)
 *   networkAccessed    must be true   (gateway route was invoked)
 *   providerApiCalled  must be true   (first-party gateway dispatched)
 *   runtimeCodeLoaded  must be false  (no dynamic code loaded)
 *   moduleUrlExecuted  must be false  (no module URL executed)
 *   secretPersisted    must be false  (no credential stored)
 *   secretExported     must be false  (no credential exported)
 */
export function validatePhotoProviderLiveRunRecord(
  candidate: unknown
): PhotoProviderLiveRunRecordV1 | null {
  if (!candidate || typeof candidate !== "object" || Array.isArray(candidate)) return null;
  const r = candidate as Record<string, unknown>;

  if (r.contractVersion !== "photo-provider-live-run.v1") return null;
  if (typeof r.id !== "string" || typeof r.jobId !== "string") return null;
  if (typeof r.providerId !== "string" || typeof r.routeId !== "string") return null;
  if (r.status !== "completed" && r.status !== "failed") return null;
  if (typeof r.requestedAt !== "string") return null;

  // Security invariants
  const sec = r.security as Record<string, unknown> | undefined;
  if (!sec || typeof sec !== "object" || Array.isArray(sec)) return null;
  // These three must be true (live-like execution occurred)
  if (sec.providerExecuted !== true) return null;
  if (sec.networkAccessed !== true) return null;
  if (sec.providerApiCalled !== true) return null;
  // These four must be false (non-execution boundary preserved)
  if (sec.runtimeCodeLoaded !== false) return null;
  if (sec.moduleUrlExecuted !== false) return null;
  if (sec.secretPersisted !== false) return null;
  if (sec.secretExported !== false) return null;

  // requestLimits block
  const limits = r.requestLimits as Record<string, unknown> | undefined;
  if (!limits || typeof limits !== "object" || Array.isArray(limits)) return null;
  if (typeof limits.promptLengthCap !== "number") return null;

  // diagnostics check
  if (r.diagnostics && !Array.isArray(r.diagnostics)) return null;

  return r as unknown as PhotoProviderLiveRunRecordV1;
}

export type AxpkgImportResult =
  | {
      success: true;
      project: AxiomProjectDraft;
      trust: AxpkgTrustResult;
      diagnostics: AxpkgImportDiagnostic[];
    }
  | {
      success: false;
      trust?: AxpkgTrustResult;
      diagnostics: AxpkgImportDiagnostic[];
    };

export function sanitizeImportedProject(
  project: AxiomProjectDraft
): {
  project: AxiomProjectDraft;
  diagnostics: AxpkgImportDiagnostic[];
} {
  const diagnostics: AxpkgImportDiagnostic[] = [];
  const sanitized = JSON.parse(JSON.stringify(project)) as AxiomProjectDraft;

  // Cap audit history (keep latest entries)
  if (sanitized.audit && sanitized.audit.length > AXPKG_LIMITS.maxAuditEvents) {
    sanitized.audit = sanitized.audit.slice(-AXPKG_LIMITS.maxAuditEvents);
    diagnostics.push({
      severity: "warning",
      code: "audit_history_trimmed",
      message: `Audit history trimmed to latest maximum cap of ${AXPKG_LIMITS.maxAuditEvents} entries.`,
      path: "project.audit",
    });
  }

  // Cap runtime data if present (keep latest entries)
  if (sanitized.runtime) {
    const runtime = sanitized.runtime;

    if (runtime.executionHistory && runtime.executionHistory.length > AXPKG_LIMITS.maxRuntimeExecutions) {
      runtime.executionHistory = runtime.executionHistory.slice(-AXPKG_LIMITS.maxRuntimeExecutions);
      diagnostics.push({
        severity: "warning",
        code: "runtime_execution_history_trimmed",
        message: `Runtime execution history trimmed to latest maximum cap of ${AXPKG_LIMITS.maxRuntimeExecutions} entries.`,
        path: "project.runtime.executionHistory",
      });
    }

    if (runtime.registeredRuntimes && runtime.registeredRuntimes.length > AXPKG_LIMITS.maxRegisteredRuntimes) {
      runtime.registeredRuntimes = runtime.registeredRuntimes.slice(-AXPKG_LIMITS.maxRegisteredRuntimes);
      diagnostics.push({
        severity: "warning",
        code: "runtime_registry_history_trimmed",
        message: `Runtime registry entries trimmed to latest maximum cap of ${AXPKG_LIMITS.maxRegisteredRuntimes} entries.`,
        path: "project.runtime.registeredRuntimes",
      });
    }

    if (runtime.activationLabels && runtime.activationLabels.length > AXPKG_LIMITS.maxActivationLabels) {
      runtime.activationLabels = runtime.activationLabels.slice(-AXPKG_LIMITS.maxActivationLabels);
      diagnostics.push({
        severity: "warning",
        code: "runtime_activation_labels_trimmed",
        message: `Runtime activation restored labels trimmed to latest maximum cap of ${AXPKG_LIMITS.maxActivationLabels} entries.`,
        path: "project.runtime.activationLabels",
      });
    }
  }

  if (sanitized.canvasPreview) {
    const canvasPreview = sanitized.canvasPreview;

    if (canvasPreview.candidates && canvasPreview.candidates.length > AXPKG_LIMITS.maxCanvasPreviewCandidates) {
      canvasPreview.candidates = canvasPreview.candidates.slice(-AXPKG_LIMITS.maxCanvasPreviewCandidates);
      diagnostics.push({
        severity: "warning",
        code: "canvas_preview_candidates_trimmed",
        message: `Canvas preview candidates trimmed to latest maximum cap of ${AXPKG_LIMITS.maxCanvasPreviewCandidates} entries.`,
        path: "project.canvasPreview.candidates",
      });
    }

    if (canvasPreview.assemblyPlans && canvasPreview.assemblyPlans.length > AXPKG_LIMITS.maxCanvasAssemblyPlans) {
      canvasPreview.assemblyPlans = canvasPreview.assemblyPlans.slice(-AXPKG_LIMITS.maxCanvasAssemblyPlans);
      diagnostics.push({
        severity: "warning",
        code: "canvas_preview_assembly_plans_trimmed",
        message: `Canvas preview assembly plans trimmed to latest maximum cap of ${AXPKG_LIMITS.maxCanvasAssemblyPlans} entries.`,
        path: "project.canvasPreview.assemblyPlans",
      });
    }

    if (canvasPreview.projections && canvasPreview.projections.length > AXPKG_LIMITS.maxCanvasPreviewProjections) {
      canvasPreview.projections = canvasPreview.projections.slice(-AXPKG_LIMITS.maxCanvasPreviewProjections);
      diagnostics.push({
        severity: "warning",
        code: "canvas_preview_projections_trimmed",
        message: `Canvas preview projections trimmed to latest maximum cap of ${AXPKG_LIMITS.maxCanvasPreviewProjections} entries.`,
        path: "project.canvasPreview.projections",
      });
    }

    if (canvasPreview.applications && canvasPreview.applications.length > AXPKG_LIMITS.maxCanvasPreviewApplications) {
      canvasPreview.applications = canvasPreview.applications.slice(-AXPKG_LIMITS.maxCanvasPreviewApplications);
      diagnostics.push({
        severity: "warning",
        code: "canvas_preview_applications_trimmed",
        message: `Canvas preview applications trimmed to latest maximum cap of ${AXPKG_LIMITS.maxCanvasPreviewApplications} entries.`,
        path: "project.canvasPreview.applications",
      });
    }
  }

  // -- Photo provider block -------------------------------------------------
  if (!sanitized.photoProvider || typeof sanitized.photoProvider !== "object" || Array.isArray(sanitized.photoProvider)) {
    // Block was missing: add an empty one (migration may not have run yet)
    sanitized.photoProvider = {
      schemaVersion: "0.8.0",
      savedAt: new Date().toISOString(),
      jobs: [],
      sandboxRuns: [],
      liveRuns: [],
    } as unknown as typeof sanitized.photoProvider;
    diagnostics.push({
      severity: "info",
      code: "photo_provider_block_missing",
      message: "Photo provider block was missing during sanitization. Added an empty block.",
      path: "project.photoProvider",
    });
  } else {
    const photoProvider = sanitized.photoProvider;
    
    // 1. Sanitize approved jobs
    if (Array.isArray(photoProvider.jobs)) {
      // Validate each job record; skip invalid ones with a diagnostic
      const validJobs = photoProvider.jobs.filter((job) => {
        const valid = validatePhotoProviderPersistenceJobRecord(job);
        if (!valid) {
          diagnostics.push({
            severity: "warning",
            code: "photo_provider_job_invalid",
            message: "A photo provider job record failed validation and was removed during sanitization.",
            path: "project.photoProvider.jobs[]",
          });
        }
        return valid !== null;
      });
      photoProvider.jobs = validJobs;

      // Trim to limit, keeping the latest jobs (array is chronological oldest→newest)
      if (photoProvider.jobs.length > AXPKG_LIMITS.maxPhotoProviderJobs) {
        photoProvider.jobs = photoProvider.jobs.slice(-AXPKG_LIMITS.maxPhotoProviderJobs);
        diagnostics.push({
          severity: "warning",
          code: "photo_provider_jobs_trimmed",
          message: `Photo provider jobs trimmed to latest ${AXPKG_LIMITS.maxPhotoProviderJobs} entries.`,
          path: "project.photoProvider.jobs",
        });
      }
    } else {
      photoProvider.jobs = [];
    }

    // 2. Sanitize sandbox runs
    if (Array.isArray(photoProvider.sandboxRuns)) {
      const validRuns = photoProvider.sandboxRuns.filter((run) => {
        const valid = validatePhotoProviderSandboxRunRecord(run);
        if (!valid) {
          diagnostics.push({
            severity: "warning",
            code: "photo_provider_sandbox_run_invalid",
            message: "A photo provider sandbox run record failed validation and was removed during sanitization.",
            path: "project.photoProvider.sandboxRuns[]",
          });
        }
        return valid !== null;
      });
      photoProvider.sandboxRuns = validRuns;

      if (photoProvider.sandboxRuns.length > AXPKG_LIMITS.maxPhotoProviderSandboxRuns) {
        photoProvider.sandboxRuns = photoProvider.sandboxRuns.slice(-AXPKG_LIMITS.maxPhotoProviderSandboxRuns);
        diagnostics.push({
          severity: "warning",
          code: "photo_provider_sandbox_runs_trimmed",
          message: `Photo provider sandbox runs trimmed to latest ${AXPKG_LIMITS.maxPhotoProviderSandboxRuns} entries.`,
          path: "project.photoProvider.sandboxRuns",
        });
      }
    } else {
      photoProvider.sandboxRuns = [];
    }

    // 3. Sanitize live runs (rejection-capped — do not silently drop oldest)
    if (Array.isArray(photoProvider.liveRuns)) {
      const validLiveRuns = photoProvider.liveRuns.filter((run) => {
        const valid = validatePhotoProviderLiveRunRecord(run);
        if (!valid) {
          diagnostics.push({
            severity: "warning",
            code: "photo_provider_live_run_invalid",
            message: "A photo provider live run record failed validation and was removed during sanitization.",
            path: "project.photoProvider.liveRuns[]",
          });
        }
        return valid !== null;
      });
      // Rejection-cap: if the validated count already exceeds the cap, trim to latest entries
      // (This preserves import consistency but the live execution service rejects new runs
      // at the cap boundary rather than dropping the oldest.)
      if (validLiveRuns.length > AXPKG_LIMITS.maxPhotoProviderLiveRuns) {
        photoProvider.liveRuns = validLiveRuns.slice(-AXPKG_LIMITS.maxPhotoProviderLiveRuns);
        diagnostics.push({
          severity: "warning",
          code: "photo_provider_live_runs_trimmed",
          message: `Photo provider live runs trimmed to latest ${AXPKG_LIMITS.maxPhotoProviderLiveRuns} entries on import.`,
          path: "project.photoProvider.liveRuns",
        });
      } else {
        photoProvider.liveRuns = validLiveRuns;
      }
    } else {
      photoProvider.liveRuns = [];
    }
  }

  return {
    project: sanitized,
    diagnostics,
  };
}

export async function importAxpkgFromUnknown(
  input: unknown,
  options?: { trustPolicy?: AxpkgTrustPolicy }
): Promise<AxpkgImportResult> {
  const diagnostics = validateAxpkgEnvelope(input);
  const errors = diagnostics.filter((d) => d.severity === "error");
  if (errors.length > 0) {
    return {
      success: false,
      diagnostics,
    };
  }

  const envelope = input as AxiomPackageEnvelope;

  // Evaluate trust policy and cryptographic integrity
  const trustResult = await evaluateAxpkgTrust({
    envelope,
    policy: options?.trustPolicy,
  });

  diagnostics.push(...trustResult.diagnostics);

  // If trust policy blocks or fails the import, stop immediately
  if (!trustResult.canOpen) {
    return {
      success: false,
      trust: trustResult,
      diagnostics,
    };
  }

  // Migrate old project schema version if necessary
  const migrationResult = migrateProjectDraft(envelope.project);
  diagnostics.push(...migrationResult.diagnostics);
  if (!migrationResult.success || !migrationResult.project) {
    return {
      success: false,
      trust: trustResult,
      diagnostics,
    };
  }

  // Sanitize arrays and cap limits
  const sanitizationResult = sanitizeImportedProject(migrationResult.project);
  diagnostics.push(...sanitizationResult.diagnostics);

  diagnostics.push({
    severity: "info",
    code: "import_success",
    message: "Project successfully validated and imported.",
  });

  return {
    success: true,
    project: sanitizationResult.project,
    trust: trustResult,
    diagnostics,
  };
}

export async function importAxpkgFromString(
  input: string,
  options?: { trustPolicy?: AxpkgTrustPolicy }
): Promise<AxpkgImportResult> {
  const byteLength = new TextEncoder().encode(input).length;
  if (byteLength > AXPKG_LIMITS.maxPackageBytes) {
    return {
      success: false,
      diagnostics: [
        {
          severity: "error",
          code: "package_too_large",
          message: `The package file exceeds the maximum size limit of 10MB (actual: ${(
            byteLength /
            (1024 * 1024)
          ).toFixed(2)}MB).`,
        },
      ],
    };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(input);
  } catch (err) {
    return {
      success: false,
      diagnostics: [
        {
          severity: "error",
          code: "invalid_json",
          message: "Failed to parse imported package: Invalid JSON format.",
        },
      ],
    };
  }

  return importAxpkgFromUnknown(parsed, options);
}
