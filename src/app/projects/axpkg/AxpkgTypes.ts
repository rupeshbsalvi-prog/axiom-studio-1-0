import type { AxiomProjectDraft } from "../projectDraft";

export type AxpkgDiagnosticCode =
  | "import_success"
  | "invalid_json"
  | "package_too_large"
  | "invalid_package_type"
  | "unsupported_package_version"
  | "missing_project"
  | "invalid_project"
  | "unsupported_future_project_schema"
  | "migrated_project_schema"
  | "runtime_block_missing"
  | "audit_history_trimmed"
  | "runtime_execution_history_trimmed"
  | "runtime_registry_history_trimmed"
  | "runtime_activation_labels_trimmed"
  | "canvas_preview_block_missing"
  | "canvas_preview_candidates_trimmed"
  | "canvas_preview_assembly_plans_trimmed"
  | "canvas_preview_projections_trimmed"
  | "canvas_preview_applications_trimmed"
  | "photo_provider_block_missing"
  | "photo_provider_jobs_trimmed"
  | "photo_provider_job_invalid"
  | "photo_provider_sandbox_runs_trimmed"
  | "photo_provider_sandbox_run_invalid"
  | "photo_provider_live_runs_trimmed"
  | "photo_provider_live_run_invalid"
  | "fingerprint_mismatch"
  | "unsigned_package"
  | "untrusted_signer"
  | "blocked_signer"
  | "trusted_signature_verified"
  | "signature_verification_failed"
  | "unsupported_signature_algorithm"
  | "missing_signature"
  | "tampered_package"
  | "trust_policy_requires_confirmation";

export interface AxpkgImportDiagnostic {
  severity: "info" | "warning" | "error";
  code: AxpkgDiagnosticCode;
  message: string;
  path?: string;
}

export interface AxiomPackageEnvelope {
  packageType: "axiom.axpkg";
  packageVersion: "1.0.0" | "1.1.0";
  exportedAt: string;
  exportedBy: {
    app: "Axiom Studio";
    appVersion?: string;
  };
  project: AxiomProjectDraft;
  portability: {
    sourceSchemaVersion: string;
    runtimeStateIncluded: boolean;
    auditIncluded: boolean;
    executionHistoryIncluded: boolean;
    photoProviderJobsIncluded?: boolean;
    photoProviderSandboxRunsIncluded?: boolean;
    photoProviderLiveRunsIncluded?: boolean;
  };
  integrity: {
    algorithm: "stable-json-cyrb53";
    projectFingerprint: string;
  };
  signature?: import("./AxpkgSignatureTypes").AxpkgSignatureBlock;
}

export const AXPKG_LIMITS = {
  maxPackageBytes: 10 * 1024 * 1024, // 10MB
  maxAuditEvents: 1000,
  maxRuntimeExecutions: 500,
  maxRegisteredRuntimes: 100,
  maxActivationLabels: 100,
  maxCanvasPreviewCandidates: 100,
  maxCanvasAssemblyPlans: 100,
  maxCanvasPreviewProjections: 100,
  maxCanvasPreviewApplications: 100,
  /** Maximum approved provider adapter jobs to persist per project. Keeps the latest jobs when trimming. */
  maxPhotoProviderJobs: 50,
  /** Maximum sandbox runs to persist per project. Keeps the latest runs when trimming. */
  maxPhotoProviderSandboxRuns: 50,
  /** Maximum live-like adapter boundary run records to persist per project. Rejection-capped (no silent drop). */
  maxPhotoProviderLiveRuns: 50,
  maxStringLength: 10_000,
};
