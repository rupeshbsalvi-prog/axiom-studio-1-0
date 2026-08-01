import type { AxiomProjectDraft } from "../projectDraft";
import type { AxpkgImportDiagnostic } from "./AxpkgTypes";

function createEmptyRuntimeBlock() {
  return {
    schemaVersion: "0.3.0" as const,
    savedAt: new Date().toISOString(),
    registeredRuntimes: [],
    activationLabels: [],
    executionHistory: [],
  };
}

function createEmptyCanvasPreviewBlock() {
  return {
    schemaVersion: "0.5.0" as const,
    savedAt: new Date().toISOString(),
    candidates: [],
    assemblyPlans: [],
    projections: [],
    applications: [],
  };
}

function createEmptyPhotoProviderBlock() {
  return {
    schemaVersion: "0.8.0" as const,
    savedAt: new Date().toISOString(),
    jobs: [],
    sandboxRuns: [],
    liveRuns: [],
  };
}

/**
 * Lifts any existing jobs from project.studios.photo.providerAdapterJobs into
 * project.photoProvider.jobs, then strips the old field to prevent double-storage.
 * Only jobs carrying contractVersion "photo-provider-adapter-job.v1" are lifted;
 * anything else is dropped silently. No code is executed during this lift.
 */
function liftLegacyProviderAdapterJobs(draft: Record<string, unknown>): unknown[] {
  const studios = draft.studios as Record<string, unknown> | undefined;
  if (!studios || typeof studios !== "object") return [];
  const photo = studios.photo as Record<string, unknown> | undefined;
  if (!photo || typeof photo !== "object" || Array.isArray(photo)) return [];
  const legacy = photo.providerAdapterJobs;
  if (!Array.isArray(legacy)) return [];
  // Strip old field to avoid double-storage
  delete photo.providerAdapterJobs;
  // Preserve only records that look like valid job envelopes
  return legacy.filter(
    (j) =>
      j !== null &&
      typeof j === "object" &&
      !Array.isArray(j) &&
      (j as Record<string, unknown>).contractVersion === "photo-provider-adapter-job.v1"
  );
}

export function migrateProjectDraft(candidate: unknown): {
  success: boolean;
  project?: AxiomProjectDraft;
  diagnostics: AxpkgImportDiagnostic[];
} {
  const diagnostics: AxpkgImportDiagnostic[] = [];

  if (!candidate || typeof candidate !== "object" || Array.isArray(candidate)) {
    return {
      success: false,
      diagnostics: [
        {
          severity: "error",
          code: "invalid_project",
          message: "Project draft is not a valid object.",
        },
      ],
    };
  }

  // Clone candidate to avoid modifying the input reference
  const draft = JSON.parse(JSON.stringify(candidate)) as Record<string, unknown>;
  const schemaVersion = draft.schemaVersion;

  // -------------------------------------------------------------------------
  // 0.8.0 — current canonical schema
  // -------------------------------------------------------------------------
  if (schemaVersion === "0.8.0") {
    if (!draft.runtime || typeof draft.runtime !== "object" || Array.isArray(draft.runtime)) {
      diagnostics.push({
        severity: "info",
        code: "runtime_block_missing",
        message: "Runtime state block was missing. Added an empty runtime block.",
        path: "project.runtime",
      });
      draft.runtime = createEmptyRuntimeBlock();
    }
    if (!draft.canvasPreview || typeof draft.canvasPreview !== "object" || Array.isArray(draft.canvasPreview)) {
      diagnostics.push({
        severity: "info",
        code: "canvas_preview_block_missing",
        message: "Canvas preview state block was missing. Added an empty canvas preview block.",
        path: "project.canvasPreview",
      });
      draft.canvasPreview = createEmptyCanvasPreviewBlock();
    } else if (typeof draft.canvasPreview === "object" && !Array.isArray(draft.canvasPreview)) {
      const canvasPreview = draft.canvasPreview as Record<string, unknown>;
      if (!Array.isArray(canvasPreview.applications)) {
        canvasPreview.applications = [];
      }
    }
    if (!draft.photoProvider || typeof draft.photoProvider !== "object" || Array.isArray(draft.photoProvider)) {
      diagnostics.push({
        severity: "info",
        code: "photo_provider_block_missing",
        message: "Photo provider block was missing. Added an empty photo provider block.",
        path: "project.photoProvider",
      });
      draft.photoProvider = createEmptyPhotoProviderBlock();
    } else {
      const photoProvider = draft.photoProvider as Record<string, unknown>;
      photoProvider.schemaVersion = "0.8.0";
      if (!Array.isArray(photoProvider.sandboxRuns)) {
        photoProvider.sandboxRuns = [];
      }
      if (!Array.isArray(photoProvider.liveRuns)) {
        photoProvider.liveRuns = [];
      }
    }
    return {
      success: true,
      project: draft as unknown as AxiomProjectDraft,
      diagnostics,
    };
  }

  // -------------------------------------------------------------------------
  // 0.7.0 → 0.8.0 — introduce liveRuns
  // -------------------------------------------------------------------------
  if (schemaVersion === "0.7.0") {
    diagnostics.push({
      severity: "info",
      code: "migrated_project_schema",
      message: "Project migrated from schema 0.7.0 to 0.8.0.",
      path: "project.schemaVersion",
    });

    draft.schemaVersion = "0.8.0";

    if (!draft.runtime || typeof draft.runtime !== "object" || Array.isArray(draft.runtime)) {
      draft.runtime = createEmptyRuntimeBlock();
    }
    if (!draft.canvasPreview || typeof draft.canvasPreview !== "object" || Array.isArray(draft.canvasPreview)) {
      draft.canvasPreview = createEmptyCanvasPreviewBlock();
    } else {
      const canvasPreview = draft.canvasPreview as Record<string, unknown>;
      canvasPreview.schemaVersion = "0.5.0";
      if (!Array.isArray(canvasPreview.applications)) {
        canvasPreview.applications = [];
      }
    }

    const photoProvider07 = (draft.photoProvider as Record<string, unknown>) ?? {
      schemaVersion: "0.7.0",
      jobs: [],
      sandboxRuns: [],
    };
    draft.photoProvider = {
      schemaVersion: "0.8.0",
      savedAt: new Date().toISOString(),
      jobs: Array.isArray(photoProvider07.jobs) ? photoProvider07.jobs : [],
      sandboxRuns: Array.isArray(photoProvider07.sandboxRuns) ? photoProvider07.sandboxRuns : [],
      liveRuns: [],
    };

    return {
      success: true,
      project: draft as unknown as AxiomProjectDraft,
      diagnostics,
    };
  }

  // -------------------------------------------------------------------------
  // 0.6.0 → 0.8.0 — introduce sandboxRuns and liveRuns
  // -------------------------------------------------------------------------
  if (schemaVersion === "0.6.0") {
    diagnostics.push({
      severity: "info",
      code: "migrated_project_schema",
      message: "Project migrated from schema 0.6.0 to 0.8.0.",
      path: "project.schemaVersion",
    });

    draft.schemaVersion = "0.8.0";

    if (!draft.runtime || typeof draft.runtime !== "object" || Array.isArray(draft.runtime)) {
      draft.runtime = createEmptyRuntimeBlock();
    }
    if (!draft.canvasPreview || typeof draft.canvasPreview !== "object" || Array.isArray(draft.canvasPreview)) {
      draft.canvasPreview = createEmptyCanvasPreviewBlock();
    } else {
      const canvasPreview = draft.canvasPreview as Record<string, unknown>;
      canvasPreview.schemaVersion = "0.5.0";
      if (!Array.isArray(canvasPreview.applications)) {
        canvasPreview.applications = [];
      }
    }

    const photoProvider = (draft.photoProvider as Record<string, unknown>) ?? {
      schemaVersion: "0.6.0",
      jobs: [],
    };
    draft.photoProvider = {
      schemaVersion: "0.8.0",
      savedAt: new Date().toISOString(),
      jobs: Array.isArray(photoProvider.jobs) ? photoProvider.jobs : [],
      sandboxRuns: [],
      liveRuns: [],
    };

    return {
      success: true,
      project: draft as unknown as AxiomProjectDraft,
      diagnostics,
    };
  }

  // -------------------------------------------------------------------------
  // 0.5.0 → 0.8.0 — promote photo provider jobs and initialize sandboxRuns, liveRuns
  // -------------------------------------------------------------------------
  if (schemaVersion === "0.5.0") {
    diagnostics.push({
      severity: "info",
      code: "migrated_project_schema",
      message: "Project migrated from schema 0.5.0 to 0.8.0.",
      path: "project.schemaVersion",
    });

    draft.schemaVersion = "0.8.0";

    if (!draft.runtime || typeof draft.runtime !== "object" || Array.isArray(draft.runtime)) {
      draft.runtime = createEmptyRuntimeBlock();
    }
    if (!draft.canvasPreview || typeof draft.canvasPreview !== "object" || Array.isArray(draft.canvasPreview)) {
      draft.canvasPreview = createEmptyCanvasPreviewBlock();
    } else {
      const canvasPreview = draft.canvasPreview as Record<string, unknown>;
      canvasPreview.schemaVersion = "0.5.0";
      if (!Array.isArray(canvasPreview.applications)) {
        canvasPreview.applications = [];
      }
    }

    const liftedJobs = liftLegacyProviderAdapterJobs(draft);
    draft.photoProvider = {
      schemaVersion: "0.8.0",
      savedAt: new Date().toISOString(),
      jobs: liftedJobs,
      sandboxRuns: [],
      liveRuns: [],
    };

    return {
      success: true,
      project: draft as unknown as AxiomProjectDraft,
      diagnostics,
    };
  }

  // -------------------------------------------------------------------------
  // 0.4.0 → 0.8.0
  // -------------------------------------------------------------------------
  if (schemaVersion === "0.4.0") {
    diagnostics.push({
      severity: "info",
      code: "migrated_project_schema",
      message: "Project migrated from schema 0.4.0 to 0.8.0.",
      path: "project.schemaVersion",
    });

    draft.schemaVersion = "0.8.0";
    if (!draft.runtime || typeof draft.runtime !== "object" || Array.isArray(draft.runtime)) {
      draft.runtime = createEmptyRuntimeBlock();
    }
    if (!draft.canvasPreview || typeof draft.canvasPreview !== "object" || Array.isArray(draft.canvasPreview)) {
      draft.canvasPreview = createEmptyCanvasPreviewBlock();
    } else {
      const canvasPreview = draft.canvasPreview as Record<string, unknown>;
      canvasPreview.schemaVersion = "0.5.0";
      if (!Array.isArray(canvasPreview.applications)) {
        canvasPreview.applications = [];
      }
    }
    draft.photoProvider = createEmptyPhotoProviderBlock();

    return {
      success: true,
      project: draft as unknown as AxiomProjectDraft,
      diagnostics,
    };
  }

  // -------------------------------------------------------------------------
  // 0.3.0 → 0.8.0
  // -------------------------------------------------------------------------
  if (schemaVersion === "0.3.0") {
    diagnostics.push({
      severity: "info",
      code: "migrated_project_schema",
      message: "Project migrated from schema 0.3.0 to 0.8.0.",
      path: "project.schemaVersion",
    });

    draft.schemaVersion = "0.8.0";
    if (!draft.runtime || typeof draft.runtime !== "object" || Array.isArray(draft.runtime)) {
      draft.runtime = createEmptyRuntimeBlock();
    }
    draft.canvasPreview = createEmptyCanvasPreviewBlock();
    draft.photoProvider = createEmptyPhotoProviderBlock();

    return {
      success: true,
      project: draft as unknown as AxiomProjectDraft,
      diagnostics,
    };
  }

  // -------------------------------------------------------------------------
  // 0.2.0 / legacy (no schemaVersion) → 0.8.0
  // -------------------------------------------------------------------------
  if (schemaVersion === "0.2.0" || !schemaVersion) {
    diagnostics.push({
      severity: "info",
      code: "migrated_project_schema",
      message: `Project migrated from schema ${schemaVersion || "legacy"} to 0.8.0.`,
      path: "project.schemaVersion",
    });

    draft.schemaVersion = "0.8.0";
    draft.runtime = createEmptyRuntimeBlock();
    draft.canvasPreview = createEmptyCanvasPreviewBlock();
    draft.photoProvider = createEmptyPhotoProviderBlock();

    return {
      success: true,
      project: draft as unknown as AxiomProjectDraft,
      diagnostics,
    };
  }

  // -------------------------------------------------------------------------
  // Future / unknown schema version guard
  // -------------------------------------------------------------------------
  if (typeof schemaVersion === "string") {
    const parts = schemaVersion.split(".");
    const major = parseInt(parts[0], 10);
    const minor = parseInt(parts[1], 10);
    if (major > 0 || (major === 0 && minor > 8)) {
      return {
        success: false,
        diagnostics: [
          {
            severity: "error",
            code: "unsupported_future_project_schema",
            message: `The project schema version '${schemaVersion}' is newer than supported version '0.8.0'.`,
            path: "project.schemaVersion",
          },
        ],
      };
    }
  }

  return {
    success: false,
    diagnostics: [
      {
        severity: "error",
        code: "invalid_project",
        message: `Invalid schema version: '${schemaVersion || "none"}'.`,
        path: "project.schemaVersion",
      },
    ],
  };
}
