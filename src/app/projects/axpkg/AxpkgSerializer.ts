import type { AxiomProjectDraft } from "../projectDraft";
import type { AxiomPackageEnvelope } from "./AxpkgTypes";
import { createProjectFingerprint } from "./stableJson";

export function createAxpkgEnvelope(
  project: AxiomProjectDraft,
  options?: {
    appVersion?: string;
    includeAudit?: boolean;
    includeRuntimeExecutionHistory?: boolean;
    /**
     * When false, exports an empty-but-valid photoProvider block instead of
     * omitting it. This keeps the schema intact while reducing package size.
     * Defaults to true (full job array included).
     */
    /**
     * When false, exports an empty-but-valid photoProvider block instead of
     * omitting it. This keeps the schema intact while reducing package size.
     * Defaults to true (full job array included).
     */
    includePhotoProviderJobs?: boolean;
    /**
     * When false, exports an empty-but-valid sandboxRuns array inside the block.
     * Defaults to true (sandbox runs included).
     */
    includePhotoProviderSandboxRuns?: boolean;
    /**
     * When false, exports an empty-but-valid liveRuns array inside the block.
     * Defaults to true (live runs included).
     */
    includePhotoProviderLiveRuns?: boolean;
  }
): AxiomPackageEnvelope {
  const includeAudit = options?.includeAudit ?? true;
  const includeRuntimeExecutionHistory = options?.includeRuntimeExecutionHistory ?? true;
  const includePhotoProviderJobs = options?.includePhotoProviderJobs ?? true;
  const includePhotoProviderSandboxRuns = options?.includePhotoProviderSandboxRuns ?? true;
  const includePhotoProviderLiveRuns = options?.includePhotoProviderLiveRuns ?? true;

  // Clone project draft to avoid mutating the original reference
  const projectCopy: AxiomProjectDraft = JSON.parse(JSON.stringify(project));

  if (!includeAudit) {
    projectCopy.audit = [];
  }
  if (!includeRuntimeExecutionHistory && projectCopy.runtime) {
    projectCopy.runtime = {
      ...projectCopy.runtime,
      executionHistory: [],
    };
  }
  // When jobs are excluded, keep the block but empty the array so the schema
  // remains valid and importers always get a properly-shaped photoProvider.
  if (!includePhotoProviderJobs && projectCopy.photoProvider) {
    projectCopy.photoProvider = {
      ...projectCopy.photoProvider,
      jobs: [],
    };
  }
  if (!includePhotoProviderSandboxRuns && projectCopy.photoProvider) {
    projectCopy.photoProvider = {
      ...projectCopy.photoProvider,
      sandboxRuns: [],
    };
  }
  if (!includePhotoProviderLiveRuns && projectCopy.photoProvider) {
    projectCopy.photoProvider = {
      ...projectCopy.photoProvider,
      liveRuns: [],
    };
  }

  const fingerprint = createProjectFingerprint(projectCopy);

  return {
    packageType: "axiom.axpkg",
    packageVersion: "1.1.0",
    exportedAt: new Date().toISOString(),
    exportedBy: {
      app: "Axiom Studio",
      appVersion: options?.appVersion ?? "1.0.0",
    },
    project: projectCopy,
    portability: {
      sourceSchemaVersion: projectCopy.schemaVersion || "0.7.0",
      runtimeStateIncluded: Boolean(projectCopy.runtime),
      auditIncluded: includeAudit,
      executionHistoryIncluded: includeRuntimeExecutionHistory,
      photoProviderJobsIncluded: includePhotoProviderJobs,
      photoProviderSandboxRunsIncluded: includePhotoProviderSandboxRuns,
      photoProviderLiveRunsIncluded: includePhotoProviderLiveRuns,
    },
    integrity: {
      algorithm: "stable-json-cyrb53",
      projectFingerprint: fingerprint,
    },
  };
}
