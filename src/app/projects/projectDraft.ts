import type { StudioId } from "../studios/registry";
import {
  type WorkspaceAuditEvent,
  clearWorkspaceAuditEvents,
  recordWorkspaceAuditEvent,
  createWorkspaceIntentReceivedEvent,
} from "../../workspace/WorkspaceAuditService";
import type {
  CanvasAssemblyPlan,
  CanvasPreviewCandidate,
} from "../../workspace/CanvasPreviewIntakeService";
import type { JsonValue } from "../../runtime/activation/RuntimeActivationTypes";

// ---------------------------------------------------------------------------
// AXPKG 0.3.0 — Runtime persistence types
// ---------------------------------------------------------------------------

/**
 * Persisted snapshot of a registry entry.
 * Includes fingerprint so hydration can match against live validated manifests.
 * Does NOT contain enough data to reconstruct or register a manifest.
 */
export type RuntimeEntryRecord = {
  manifestId: string;
  runtimeId: string;
  runtimeName: string;
  version: string;
  publisher: string;
  /** Deterministic fingerprint from getRuntimeManifestFingerprint() */
  fingerprint: string;
  status: "registered" | "disabled" | "rejected" | "untrusted";
  registeredAt: string;
  disabledAt?: string;
  rejectionReason?: string;
};

/**
 * UI-only restore label for a previously activated runtime.
 * This is NOT ActivatedRuntime — it does not affect dispatcher or activation state.
 * The Registry Panel uses this to show "Previously active — needs reactivation".
 * Restored only when the related runtime passes fingerprint matching.
 */
export type RuntimeRestoredActivationLabel = {
  runtimeId: string;
  manifestId: string;
  activatedAt: string;
  actionCount: number;
  restoredStatus: "previouslyActive";
};

/**
 * Single execution attempt record stored as read-only history only.
 *
 * Timestamp rules:
 *   attemptedAt          — always set at the start of dispatchRuntimeAction
 *   executionRequestedAt — only set after all preflight checks pass and
 *                          createRuntimeExecutionRequestedEvent is logged.
 *                          Absent for preflight and authority-gate failures.
 *   completedAt          — always set when the attempt resolves (success or failure)
 */
export type RuntimeExecutionRecord = {
  id: string;
  runtimeId: string;
  actionId: string;
  status: "completed" | "failed";
  attemptedAt: string;
  executionRequestedAt?: string;
  completedAt: string;
  durationMs?: number;
  output?: JsonValue;
  /** String (not RuntimeExecutionFailureReason) for AXPKG portability */
  failureReason?: string;
};

export interface AxiomProjectRuntimeBlock {
  schemaVersion: "0.3.0";
  savedAt: string;
  registeredRuntimes: RuntimeEntryRecord[];
  /** UI-only restore labels. Not ActivatedRuntime[]. */
  activationLabels: RuntimeRestoredActivationLabel[];
  executionHistory: RuntimeExecutionRecord[];
}

export interface CanvasSliceProjectionElement {
  id: string;
  sourceAssemblyElementId: string;
  sourceLayerId: string;
  label: string;
  type: string;
  bounds: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  opacity: number;
  blendMode: string;
  source: string;
  previewOnly: true;
}

export interface CanvasSliceProjection {
  id: string;
  assemblyPlanId: string;
  studioId: string;
  status: "projected_preview";
  createdAtUtc: string;
  canvas: {
    width: number;
    height: number;
    aspectRatio: string;
    background: "transparent" | "solid" | "gradient";
  };
  elements: CanvasSliceProjectionElement[];
  security: {
    previewOnly: true;
    noExecutionPerformed: true;
    runtimeCodeLoaded: false;
    moduleUrlExecuted: false;
    authoritativeCanvasMutated: false;
  };
  metadata?: Record<string, unknown>;
}

export interface CanvasAppliedMutation {
  id: string;
  projectionId: string;
  studioId: string;
  status: "applied" | "rolled_back";
  appliedAtUtc: string;
  rolledBackAtUtc?: string;
  appliedElementIds: string[];
  previousElements: unknown[];
  rollbackReason?: string;
  security: {
    userConfirmed: true;
    noExecutionPerformed: true;
    runtimeCodeLoaded: false;
    moduleUrlExecuted: false;
    authoritativeCanvasMutated: true;
    reversible: true;
  };
  metadata?: Record<string, unknown>;
}

export interface AxiomProjectCanvasPreviewBlock {
  schemaVersion: "0.5.0";
  savedAt: string;
  candidates: CanvasPreviewCandidate[];
  assemblyPlans: CanvasAssemblyPlan[];
  projections: CanvasSliceProjection[];
  applications: CanvasAppliedMutation[];
}

// ---------------------------------------------------------------------------
// AXPKG 0.6.0 — Photo provider job persistence block
// ---------------------------------------------------------------------------

/**
 * Self-contained persistence record for a validated, non-executed
 * PhotoProviderAdapterJobV1 envelope. Mirrors the adapter job shape without
 * importing from the studios layer to keep projectDraft.ts dependency-free.
 * All fields must be JSON-safe (no functions, blobs, or live objects).
 */
export interface PhotoProviderPersistenceJobRecord {
  contractVersion: "photo-provider-adapter-job.v1";
  status: "ready_for_provider_execution";
  providerRequest: {
    contractVersion: "photo-provider-request.v1";
    studioId: "photo";
    provider: { requestedName: string; planningMode: string; planningStatus: string };
    prompt: {
      intent: string;
      negativePrompt: string;
      backgroundStrategy: string;
      aesthetic: string;
      lighting: string;
      colorPalette: string[];
    };
    canvas: { width: number; height: number; aspectRatio: string; transparentBackgroundRequired: true };
    layers: Array<{
      index: number;
      name: string;
      type: string;
      providerPrompt: string;
      blendMode: string;
      opacity: number;
      transparentBackgroundRequired: true;
    }>;
    approval: { requiresUserApproval: true; approvedForProviderExecution: boolean };
    security: {
      dryRun: true;
      providerExecutionAllowed: false;
      providerExecuted: false;
      noExecutionPerformed: true;
    };
  };
  adapter: {
    contractVersion: "photo-provider-adapter.v1";
    providerId: string;
    displayName: string;
    capabilities: { imageGeneration: boolean; transparentBackground: boolean; layeredOutput: boolean };
    limits: { maxWidth: number; maxHeight: number; maxLayers: number };
    security: { requiresExplicitApproval: true; executesOutsideRuntimeMock: true; storesSecrets: false };
  };
  approval: {
    approvalId: string;
    approvedBy: string;
    approvedAtUtc: string;
    userConfirmedProviderExecution: boolean;
  };
  /** Security invariant: all three flags must remain false at persistence time. */
  security: {
    providerExecutionAllowed: boolean;
    providerExecuted: false;
    runtimeCodeLoaded: false;
    moduleUrlExecuted: false;
  };
}

// ---------------------------------------------------------------------------
// AXPKG 0.8.0 — Photo provider live run record
// ---------------------------------------------------------------------------

/**
 * Durable, redacted evidence record for a single live-like adapter boundary
 * execution attempt. Records security flags, timing, and diagnostics only.
 *
 * NEVER stored: credentials, HTTP headers, endpoint URLs, raw request payload,
 * raw provider response blobs, binary/base64 image data, arbitrary provider
 * metadata, or any field that could reconstruct a secret value.
 */
export interface PhotoProviderLiveRunRecordV1 {
  contractVersion: "photo-provider-live-run.v1";
  id: string;
  jobId: string;
  candidateId?: string;
  /** Always "mock-photo-provider" in Phase 28. */
  providerId: "mock-photo-provider";
  /** Always "photo.generate.dev" in Phase 28. */
  routeId: "photo.generate.dev";
  status: "completed" | "failed";
  requestedAt: string;
  completedAt?: string;
  requestLimits: {
    promptLengthCap: number;
    maxWidth: number;
    maxHeight: number;
    maxLayers: number;
  };
  responseLayerCount?: number;
  diagnostics: Array<{
    severity: "info" | "warning" | "error";
    code: string;
    message: string;
  }>;
  security: {
    providerExecuted: true;
    networkAccessed: true;
    providerApiCalled: true;
    runtimeCodeLoaded: false;
    moduleUrlExecuted: false;
    secretPersisted: false;
    secretExported: false;
  };
}

export interface PhotoProviderSandboxRunRecordV1 {
  contractVersion: "photo-provider-sandbox-run.v1";
  id: string;
  jobId: string;
  status: "simulated_completed" | "simulated_failed";
  requestedAt: string;
  completedAt?: string;
  candidateId?: string;
  diagnostics: Array<{
    severity: "info" | "warning" | "error";
    code: string;
    message: string;
  }>;
  security: {
    providerExecuted: false;
    runtimeCodeLoaded: false;
    moduleUrlExecuted: false;
    networkAccessed: false;
    providerApiCalled: false;
  };
}

export interface SandboxProvenanceV1 {
  type: "photo-provider-sandbox-provenance.v1";
  sandboxRunId: string;
  jobId: string;
  simulatedAtUtc: string;
  candidateId?: string;
  adapter: {
    providerId: string;
    displayName: string;
  };
  securityEvidence: {
    providerExecuted: false;
    runtimeCodeLoaded: false;
    moduleUrlExecuted: false;
    networkAccessed: false;
    providerApiCalled: false;
  };
}

export function isSandboxProvenanceV1(value: unknown): value is SandboxProvenanceV1 {
  if (!value || typeof value !== "object") return false;
  const p = value as any;
  return (
    p.type === "photo-provider-sandbox-provenance.v1" &&
    typeof p.sandboxRunId === "string" &&
    typeof p.jobId === "string" &&
    typeof p.simulatedAtUtc === "string" &&
    (p.candidateId === undefined || typeof p.candidateId === "string") &&
    p.adapter &&
    typeof p.adapter.providerId === "string" &&
    typeof p.adapter.displayName === "string" &&
    p.securityEvidence &&
    p.securityEvidence.providerExecuted === false &&
    p.securityEvidence.runtimeCodeLoaded === false &&
    p.securityEvidence.moduleUrlExecuted === false &&
    p.securityEvidence.networkAccessed === false &&
    p.securityEvidence.providerApiCalled === false
  );
}

export interface AxiomProjectPhotoProviderBlock {
  schemaVersion: "0.8.0";
  savedAt: string;
  /** Approved, non-executed provider adapter job envelopes. Capped at maxPhotoProviderJobs on import. */
  jobs: PhotoProviderPersistenceJobRecord[];
  /** Persistent sandbox run records. Capped at maxPhotoProviderSandboxRuns on import. */
  sandboxRuns: PhotoProviderSandboxRunRecordV1[];
  /** Redacted live-like adapter boundary execution records. Capped at maxPhotoProviderLiveRuns on import. */
  liveRuns: PhotoProviderLiveRunRecordV1[];
}

// ---------------------------------------------------------------------------
// Existing project draft types
// ---------------------------------------------------------------------------

export interface CreateProjectDraftInput {
  name: string;
  intent: string;
  targetStudioId: StudioId;
}

export interface CanvasSlice {
  elements: unknown[];
  viewport: {
    zoom: number;
    panX: number;
    panY: number;
  };
}

export interface ImagineXOutcomeRecordV1 {
  contractVersion: "imagine-x-outcome.v1";
  id: string;
  proposalId: string;
  studioId: string;
  intent: string;
  providerRoutes: Array<{ studio: string; provider: string; mode: string }>;
  status: "accepted" | "rejected";
  recordedAtUtc: string;
  durationMs: number | null;
  failure: string | null;
  outputObjectCount: number;
  rating: number | null;
  feedback: string | null;
  recommendationInfluence?: {
    proposalId: string;
    appliedAtUtc: string;
    influences: string[];
  } | null;
  followUpEdits: Array<{
    id: string;
    studioId: string;
    layerId?: string;
    type: string;
    description: string;
    recordedAtUtc: string;
  }>;
  learning: {
    consent: "not_requested";
    applied: false;
  };
}

export interface ImagineXLearningControlV1 {
  contractVersion: "imagine-x-learning-control.v1";
  enabled: boolean;
  scope: "local_workspace";
  consent: "not_granted" | "granted";
  updatedAtUtc: string;
}

export interface ImagineXPreferenceCandidateV1 {
  contractVersion: "imagine-x-preference-candidate.v1";
  id: string;
  sourceOutcomeId: string;
  scope: "local_workspace";
  proposedPreference: string;
  explanation: string;
  status: "pending_review" | "approved";
  applied: false;
  createdAtUtc: string;
  approvedAtUtc: string | null;
}

export interface ImagineXRecommendationInfluenceProposalV1 {
  contractVersion: "imagine-x-recommendation-influence.v1";
  id: string;
  scope: "local_workspace";
  sourceCandidateIds: string[];
  proposedInfluences: string[];
  recommendationDiff?: {
    before: string[];
    after: string[];
  };
  explanation: string;
  status: "pending_review" | "approved" | "rejected";
  applied: boolean;
  createdAtUtc: string;
  decidedAtUtc: string | null;
  appliedAtUtc?: string | null;
  rolledBackAtUtc?: string | null;
}

export interface ImagineXInfluenceEvaluationDecisionV1 {
  contractVersion: "imagine-x-influence-evaluation-decision.v1";
  id: string;
  proposalId: string;
  decision: "keep" | "rollback" | "inconclusive";
  rationale: string | null;
  recordedAtUtc: string;
  evidence: {
    contractVersion: "imagine-x-influence-evaluation.v1";
    baseline: {
      ratedOutcomeCount: number;
      averageRating: number | null;
      ratingDistribution: number[];
    };
    influenced: {
      ratedOutcomeCount: number;
      averageRating: number | null;
      ratingDistribution: number[];
    };
    observedDifference: number | null;
    byInfluenceProposal: Array<{
      proposalId: string;
      influences: string[];
      ratedOutcomeCount: number;
      averageRating: number | null;
      ratingDistribution: number[];
    }>;
  };
}

export interface AxiomProjectDraft {
  schemaVersion?: string;
  manifest: {
    id: string;
    name: string;
    version: "0.1.0";
    createdAt: string;
    updatedAt: string;
    authoredStudios: StudioId[];
  };
  canvas: Record<string, CanvasSlice>;
  studios: Record<string, Record<string, unknown>>;
  brain: {
    recentPrompts: string[];
    modelByStudio: Record<string, string>;
    notes: string[];
    outcomes?: ImagineXOutcomeRecordV1[];
    learningControl?: ImagineXLearningControlV1;
    preferenceCandidates?: ImagineXPreferenceCandidateV1[];
    recommendationInfluenceProposals?: ImagineXRecommendationInfluenceProposalV1[];
    influenceEvaluationDecisions?: ImagineXInfluenceEvaluationDecisionV1[];
  };
  assets: unknown[];
  audit?: WorkspaceAuditEvent[];
  /** AXPKG 0.3.0 runtime persistence block. Absent in 0.2.0 drafts (treated as no-op by hydration). */
  runtime?: AxiomProjectRuntimeBlock;
  /** AXPKG 0.5.0 canvas preview/apply persistence. Mutations are explicit and reversible. */
  canvasPreview?: AxiomProjectCanvasPreviewBlock;
  /** AXPKG 0.8.0 photo provider job, sandbox simulation, and live-like adapter boundary run persistence. */
  photoProvider?: AxiomProjectPhotoProviderBlock;
}

const DEFAULT_PROJECT_NAME = "Untitled Axiom Project";
const CURRENT_SCHEMA_VERSION = "0.8.0";

function createId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `axiom_${Date.now().toString(36)}`;
}

function createEmptyCanvasSlice(): CanvasSlice {
  return {
    elements: [],
    viewport: {
      zoom: 1,
      panX: 0,
      panY: 0,
    },
  };
}

function createEmptyRuntimeBlock(): AxiomProjectRuntimeBlock {
  return {
    schemaVersion: "0.3.0",
    savedAt: new Date().toISOString(),
    registeredRuntimes: [],
    activationLabels: [],
    executionHistory: [],
  };
}

function createEmptyCanvasPreviewBlock(): AxiomProjectCanvasPreviewBlock {
  return {
    schemaVersion: "0.5.0",
    savedAt: new Date().toISOString(),
    candidates: [],
    assemblyPlans: [],
    projections: [],
    applications: [],
  };
}

export function createEmptyPhotoProviderBlock(): AxiomProjectPhotoProviderBlock {
  return {
    schemaVersion: "0.8.0",
    savedAt: new Date().toISOString(),
    jobs: [],
    sandboxRuns: [],
    liveRuns: [],
  };
}

export function createProjectDraft(input: CreateProjectDraftInput): AxiomProjectDraft {
  const now = new Date().toISOString();
  const name = input.name.trim() || DEFAULT_PROJECT_NAME;
  const intent = input.intent.trim();

  // Clear existing workspace audit events on new draft creation to ensure session isolation
  clearWorkspaceAuditEvents();

  const draft: AxiomProjectDraft = {
    schemaVersion: CURRENT_SCHEMA_VERSION,
    manifest: {
      id: createId(),
      name,
      version: "0.1.0",
      createdAt: now,
      updatedAt: now,
      authoredStudios: [input.targetStudioId],
    },
    canvas: {
      [input.targetStudioId]: createEmptyCanvasSlice(),
    },
    studios: {
      [input.targetStudioId]: {},
    },
    brain: {
      recentPrompts: intent ? [intent] : [],
      modelByStudio: {},
      notes: [],
      outcomes: [],
      learningControl: {
        contractVersion: "imagine-x-learning-control.v1",
        enabled: false,
        scope: "local_workspace",
        consent: "not_granted",
        updatedAtUtc: now,
      },
      preferenceCandidates: [],
      recommendationInfluenceProposals: [],
      influenceEvaluationDecisions: [],
    },
    assets: [],
    audit: [],
    runtime: createEmptyRuntimeBlock(),
    canvasPreview: createEmptyCanvasPreviewBlock(),
    photoProvider: createEmptyPhotoProviderBlock(),
  };

  // Record initial draft creation event
  const creationEvent = recordWorkspaceAuditEvent(
    createWorkspaceIntentReceivedEvent({
      id: `audit_create_${createId()}`,
      studioId: input.targetStudioId,
      title: "Project Draft Created",
      message: `Created project draft '${name}' with intent: '${intent || "None"}'`,
      timestamp: now,
    })
  );

  draft.audit = [creationEvent];

  return draft;
}
