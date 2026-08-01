import { eventBus } from "../platform/services/EventBus";
import type { StudioId } from "../app/studios/registry";

export interface WorkspaceAuditEvent {
  id: string;
  timestamp: string;
  workspaceId?: string;
  draftId?: string;
  studioId?: StudioId;
  type:
    | "intent_received"
    | "plan_generated"
    | "recommendation_influence_applied"
    | "recommendation_influence_rolled_back"
    | "proposal_accepted"
    | "proposal_rejected"
    | "export_requested"
    | "export_completed"
    | "authority_blocked"
    | "lifecycle"
    | "provider_called"
    | "provider_failed"
    | "provider_execution_approval_requested"
    | "provider_execution_approval_completed"
    | "provider_execution_approval_failed"
    | "runtime_manifest_discovered"
    | "runtime_manifest_validated"
    | "runtime_manifest_registered"
    | "runtime_manifest_rejected"
    | "runtime_manifest_disabled"
    | "runtime_manifest_enabled"
    | "runtime_authority_blocked"
    | "runtime_activation_requested"
    | "runtime_activation_completed"
    | "runtime_activation_failed"
    | "runtime_execution_requested"
    | "runtime_execution_completed"
    | "runtime_execution_failed"
    | "runtime_package_promotion_requested"
    | "runtime_package_promotion_completed"
    | "runtime_package_promotion_failed"
    | "runtime_package_promotion_blocked"
    | "runtime_activation_eligibility_checked"
    | "runtime_action_dispatch_requested"
    | "runtime_action_dry_run_completed"
    | "runtime_action_dry_run_failed"
    | "canvas_preview_intake_received"
    | "canvas_preview_assembly_approved"
    | "canvas_preview_assembly_rejected"
    | "canvas_projection_applied"
    | "canvas_projection_rolled_back"
    | "provider_sandbox_execution_requested"
    | "provider_sandbox_execution_completed"
    | "provider_sandbox_execution_failed"
    | "provider_readiness_check_requested"
    | "provider_readiness_check_completed"
    | "provider_readiness_check_failed"
    | "provider_live_execution_requested"
    | "provider_live_execution_completed"
    | "provider_live_execution_failed";
  title: string;
  message?: string;
  description?: string | null; // Backward compatibility with ReplayAuditEvent
  severity: "info" | "success" | "warning" | "error";
  source: "workspace" | "brain-x" | "axiom-ai" | "photo" | "vector" | "system";
  metadata?: Record<string, unknown>;
}

const workspaceAuditEvents: WorkspaceAuditEvent[] = [];
const EVENT_CAP_LIMIT = 1000;

export function recordWorkspaceAuditEvent(event: WorkspaceAuditEvent): WorkspaceAuditEvent {
  workspaceAuditEvents.push(event);
  if (workspaceAuditEvents.length > EVENT_CAP_LIMIT) {
    workspaceAuditEvents.shift();
  }
  eventBus.publish("workspace:audit:recorded", event);
  return event;
}

export function getWorkspaceAuditEvents(): WorkspaceAuditEvent[] {
  return [...workspaceAuditEvents];
}

export function clearWorkspaceAuditEvents(): void {
  workspaceAuditEvents.length = 0;
}

export function createWorkspaceIntentReceivedEvent(input: {
  id: string;
  studioId: StudioId;
  title: string;
  message: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}): WorkspaceAuditEvent {
  return {
    ...input,
    type: "intent_received",
    description: input.message,
    severity: "info",
    source: getSourceFromStudioId(input.studioId),
  };
}

export function createWorkspacePlanGeneratedEvent(input: {
  id: string;
  studioId: StudioId;
  title: string;
  message: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}): WorkspaceAuditEvent {
  return {
    ...input,
    type: "plan_generated",
    description: input.message,
    severity: "info",
    source: getSourceFromStudioId(input.studioId),
  };
}

export function createWorkspaceRecommendationInfluenceAppliedEvent(input: {
  id: string;
  studioId: StudioId;
  title: string;
  message: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}): WorkspaceAuditEvent {
  return {
    ...input,
    type: "recommendation_influence_applied",
    description: input.message,
    severity: "success",
    source: getSourceFromStudioId(input.studioId),
  };
}

export function createWorkspaceRecommendationInfluenceRolledBackEvent(input: {
  id: string;
  studioId: StudioId;
  title: string;
  message: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}): WorkspaceAuditEvent {
  return {
    ...input,
    type: "recommendation_influence_rolled_back",
    description: input.message,
    severity: "warning",
    source: getSourceFromStudioId(input.studioId),
  };
}

export function createWorkspaceProposalAcceptedEvent(input: {
  id: string;
  studioId: StudioId;
  title: string;
  message: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}): WorkspaceAuditEvent {
  return {
    ...input,
    type: "proposal_accepted",
    description: input.message,
    severity: "success",
    source: getSourceFromStudioId(input.studioId),
  };
}

export function createWorkspaceProposalRejectedEvent(input: {
  id: string;
  studioId: StudioId;
  title: string;
  message: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}): WorkspaceAuditEvent {
  return {
    ...input,
    type: "proposal_rejected",
    description: input.message,
    severity: "warning",
    source: getSourceFromStudioId(input.studioId),
  };
}

export function createWorkspaceExportRequestedEvent(input: {
  id: string;
  studioId: StudioId;
  title: string;
  message: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}): WorkspaceAuditEvent {
  return {
    ...input,
    type: "export_requested",
    description: input.message,
    severity: "info",
    source: getSourceFromStudioId(input.studioId),
  };
}

export function createWorkspaceExportCompletedEvent(input: {
  id: string;
  studioId: StudioId;
  title: string;
  message: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}): WorkspaceAuditEvent {
  return {
    ...input,
    type: "export_completed",
    description: input.message,
    severity: "success",
    source: getSourceFromStudioId(input.studioId),
  };
}

export function createWorkspaceAuthorityBlockedEvent(input: {
  id: string;
  studioId: StudioId;
  title: string;
  message: string;
  description?: string | null;
  timestamp: string;
  metadata?: Record<string, unknown>;
}): WorkspaceAuditEvent {
  return {
    ...input,
    type: "authority_blocked",
    description: input.description || input.message,
    severity: "error",
    source: getSourceFromStudioId(input.studioId),
  };
}

export function createWorkspaceLifecycleEvent(input: {
  id: string;
  studioId: StudioId;
  title: string;
  message: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}): WorkspaceAuditEvent {
  return {
    ...input,
    type: "lifecycle",
    description: input.message,
    severity: "info",
    source: "system",
  };
}

export function createWorkspaceProviderCalledEvent(input: {
  id: string;
  studioId: StudioId;
  title: string;
  message: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}): WorkspaceAuditEvent {
  return {
    ...input,
    type: "provider_called",
    description: input.message,
    severity: "info",
    source: getSourceFromStudioId(input.studioId),
  };
}

export function createWorkspaceProviderFailedEvent(input: {
  id: string;
  studioId: StudioId;
  title: string;
  message: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}): WorkspaceAuditEvent {
  return {
    ...input,
    type: "provider_failed",
    description: input.message,
    severity: "warning",
    source: getSourceFromStudioId(input.studioId),
  };
}

export function createProviderExecutionApprovalRequestedEvent(input: {
  id: string;
  studioId: StudioId;
  title: string;
  message: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}): WorkspaceAuditEvent {
  return {
    ...input,
    type: "provider_execution_approval_requested",
    description: input.message,
    severity: "info",
    source: getSourceFromStudioId(input.studioId),
    metadata: {
      ...input.metadata,
      providerApprovalGate: true,
      providerExecuted: false,
      runtimeCodeLoaded: false,
      moduleUrlExecuted: false,
    },
  };
}

export function createProviderExecutionApprovalCompletedEvent(input: {
  id: string;
  studioId: StudioId;
  title: string;
  message: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}): WorkspaceAuditEvent {
  return {
    ...input,
    type: "provider_execution_approval_completed",
    description: input.message,
    severity: "success",
    source: getSourceFromStudioId(input.studioId),
    metadata: {
      ...input.metadata,
      providerApprovalGate: true,
      providerExecutionAllowed: true,
      providerExecuted: false,
      runtimeCodeLoaded: false,
      moduleUrlExecuted: false,
    },
  };
}

export function createProviderExecutionApprovalFailedEvent(input: {
  id: string;
  studioId: StudioId;
  title: string;
  message: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}): WorkspaceAuditEvent {
  return {
    ...input,
    type: "provider_execution_approval_failed",
    description: input.message,
    severity: "error",
    source: getSourceFromStudioId(input.studioId),
    metadata: {
      ...input.metadata,
      providerApprovalGate: true,
      providerExecutionAllowed: false,
      providerExecuted: false,
      runtimeCodeLoaded: false,
      moduleUrlExecuted: false,
    },
  };
}

function getSourceFromStudioId(studioId: StudioId): WorkspaceAuditEvent["source"] {
  if (studioId === "brain-x") return "brain-x";
  if (studioId === "axiom-ai") return "axiom-ai";
  if (studioId === "photo") return "photo";
  if (studioId === "vector") return "vector";
  return "workspace";
}

export function createRuntimeManifestDiscoveredEvent(input: {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}): WorkspaceAuditEvent {
  return {
    ...input,
    type: "runtime_manifest_discovered",
    description: input.message,
    severity: "info",
    source: "system",
  };
}

export function createRuntimeManifestValidatedEvent(input: {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}): WorkspaceAuditEvent {
  return {
    ...input,
    type: "runtime_manifest_validated",
    description: input.message,
    severity: "success",
    source: "system",
  };
}

export function createRuntimeManifestRegisteredEvent(input: {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}): WorkspaceAuditEvent {
  return {
    ...input,
    type: "runtime_manifest_registered",
    description: input.message,
    severity: "success",
    source: "system",
  };
}

export function createRuntimeManifestRejectedEvent(input: {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}): WorkspaceAuditEvent {
  return {
    ...input,
    type: "runtime_manifest_rejected",
    description: input.message,
    severity: "error",
    source: "system",
  };
}

export function createRuntimeManifestDisabledEvent(input: {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}): WorkspaceAuditEvent {
  return {
    ...input,
    type: "runtime_manifest_disabled",
    description: input.message,
    severity: "warning",
    source: "system",
  };
}

export function createRuntimeAuthorityBlockedEvent(input: {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}): WorkspaceAuditEvent {
  return {
    ...input,
    type: "runtime_authority_blocked",
    description: input.message,
    severity: "error",
    source: "system",
  };
}

export function createRuntimeManifestEnabledEvent(input: {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}): WorkspaceAuditEvent {
  return {
    ...input,
    type: "runtime_manifest_enabled",
    description: input.message,
    severity: "success",
    source: "system",
  };
}

export function createRuntimeActivationRequestedEvent(input: {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}): WorkspaceAuditEvent {
  return {
    ...input,
    type: "runtime_activation_requested",
    description: input.message,
    severity: "info",
    source: "system",
  };
}

export function createRuntimeActivationCompletedEvent(input: {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}): WorkspaceAuditEvent {
  return {
    ...input,
    type: "runtime_activation_completed",
    description: input.message,
    severity: "success",
    source: "system",
  };
}

export function createRuntimeActivationFailedEvent(input: {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}): WorkspaceAuditEvent {
  return {
    ...input,
    type: "runtime_activation_failed",
    description: input.message,
    severity: "error",
    source: "system",
  };
}

export function createRuntimeExecutionRequestedEvent(input: {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}): WorkspaceAuditEvent {
  return {
    ...input,
    type: "runtime_execution_requested",
    description: input.message,
    severity: "info",
    source: "system",
  };
}

export function createRuntimeExecutionCompletedEvent(input: {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}): WorkspaceAuditEvent {
  return {
    ...input,
    type: "runtime_execution_completed",
    description: input.message,
    severity: "success",
    source: "system",
  };
}

export function createRuntimeExecutionFailedEvent(input: {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}): WorkspaceAuditEvent {
  return {
    ...input,
    type: "runtime_execution_failed",
    description: input.message,
    severity: "error",
    source: "system",
  };
}

export function createRuntimePackagePromotionRequestedEvent(input: {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}): WorkspaceAuditEvent {
  return {
    ...input,
    type: "runtime_package_promotion_requested",
    description: input.message,
    severity: "info",
    source: "system",
  };
}

export function createRuntimePackagePromotionCompletedEvent(input: {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}): WorkspaceAuditEvent {
  return {
    ...input,
    type: "runtime_package_promotion_completed",
    description: input.message,
    severity: "success",
    source: "system",
  };
}

export function createRuntimePackagePromotionFailedEvent(input: {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}): WorkspaceAuditEvent {
  return {
    ...input,
    type: "runtime_package_promotion_failed",
    description: input.message,
    severity: "error",
    source: "system",
  };
}

export function createRuntimePackagePromotionBlockedEvent(input: {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}): WorkspaceAuditEvent {
  return {
    ...input,
    type: "runtime_package_promotion_blocked",
    description: input.message,
    severity: "warning",
    source: "system",
  };
}

export function createRuntimeActivationEligibilityCheckedEvent(input: {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}): WorkspaceAuditEvent {
  return {
    ...input,
    type: "runtime_activation_eligibility_checked",
    description: input.message,
    severity: input.metadata?.eligible ? "success" : "warning",
    source: "system",
  };
}

// ---------------------------------------------------------------------------
// Phase 12 — Dry-Run Action Dispatch Audit Events
// All three factories inject Phase 12 security tags into metadata.
// ---------------------------------------------------------------------------

export function createRuntimeActionDispatchRequestedEvent(input: {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}): WorkspaceAuditEvent {
  return {
    ...input,
    type: "runtime_action_dispatch_requested",
    description: input.message,
    severity: "info",
    source: "system",
    metadata: {
      ...input.metadata,
      dryRun: true,
      noExecutionPerformed: true,
      runtimeCodeLoaded: false,
      moduleUrlExecuted: false,
    },
  };
}

export function createRuntimeActionDryRunCompletedEvent(input: {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}): WorkspaceAuditEvent {
  return {
    ...input,
    type: "runtime_action_dry_run_completed",
    description: input.message,
    severity: "success",
    source: "system",
    metadata: {
      ...input.metadata,
      dryRun: true,
      noExecutionPerformed: true,
      runtimeCodeLoaded: false,
      moduleUrlExecuted: false,
    },
  };
}

export function createRuntimeActionDryRunFailedEvent(input: {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}): WorkspaceAuditEvent {
  return {
    ...input,
    type: "runtime_action_dry_run_failed",
    description: input.message,
    severity: "error",
    source: "system",
    metadata: {
      ...input.metadata,
      dryRun: true,
      noExecutionPerformed: true,
      runtimeCodeLoaded: false,
      moduleUrlExecuted: false,
    },
  };
}

export function createCanvasPreviewIntakeReceivedEvent(input: {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}): WorkspaceAuditEvent {
  return {
    ...input,
    type: "canvas_preview_intake_received",
    description: input.message,
    severity: "info",
    source: "system",
    metadata: {
      ...input.metadata,
      dryRunPreview: true,
      noExecutionPerformed: true,
      runtimeCodeLoaded: false,
      moduleUrlExecuted: false,
    },
  };
}

export function createCanvasPreviewAssemblyApprovedEvent(input: {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}): WorkspaceAuditEvent {
  return {
    ...input,
    type: "canvas_preview_assembly_approved",
    description: input.message,
    severity: "success",
    source: "system",
    metadata: {
      ...input.metadata,
      dryRunPreview: true,
      noExecutionPerformed: true,
      runtimeCodeLoaded: false,
      moduleUrlExecuted: false,
    },
  };
}

export function createCanvasPreviewAssemblyRejectedEvent(input: {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}): WorkspaceAuditEvent {
  return {
    ...input,
    type: "canvas_preview_assembly_rejected",
    description: input.message,
    severity: "warning",
    source: "system",
    metadata: {
      ...input.metadata,
      dryRunPreview: true,
      noExecutionPerformed: true,
      runtimeCodeLoaded: false,
      moduleUrlExecuted: false,
    },
  };
}

export function createCanvasProjectionAppliedEvent(input: {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}): WorkspaceAuditEvent {
  return {
    ...input,
    type: "canvas_projection_applied",
    description: input.message,
    severity: "success",
    source: "system",
    metadata: {
      ...input.metadata,
      userConfirmed: true,
      noExecutionPerformed: true,
      runtimeCodeLoaded: false,
      moduleUrlExecuted: false,
      authoritativeCanvasMutated: true,
      reversible: true,
    },
  };
}

export function createCanvasProjectionRolledBackEvent(input: {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}): WorkspaceAuditEvent {
  return {
    ...input,
    type: "canvas_projection_rolled_back",
    description: input.message,
    severity: "warning",
    source: "system",
    metadata: {
      ...input.metadata,
      noExecutionPerformed: true,
      runtimeCodeLoaded: false,
      moduleUrlExecuted: false,
      authoritativeCanvasMutated: true,
      rollback: true,
    },
  };
}

export function createProviderSandboxExecutionRequestedEvent(input: {
  id: string;
  studioId: StudioId;
  title: string;
  message: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}): WorkspaceAuditEvent {
  return {
    ...input,
    type: "provider_sandbox_execution_requested",
    description: input.message,
    severity: "info",
    source: getSourceFromStudioId(input.studioId),
    metadata: {
      ...input.metadata,
      providerExecuted: false,
      runtimeCodeLoaded: false,
      moduleUrlExecuted: false,
      networkAccessed: false,
      providerApiCalled: false,
    },
  };
}

export function createProviderSandboxExecutionCompletedEvent(input: {
  id: string;
  studioId: StudioId;
  title: string;
  message: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}): WorkspaceAuditEvent {
  return {
    ...input,
    type: "provider_sandbox_execution_completed",
    description: input.message,
    severity: "success",
    source: getSourceFromStudioId(input.studioId),
    metadata: {
      ...input.metadata,
      providerExecuted: false,
      runtimeCodeLoaded: false,
      moduleUrlExecuted: false,
      networkAccessed: false,
      providerApiCalled: false,
    },
  };
}

export function createProviderSandboxExecutionFailedEvent(input: {
  id: string;
  studioId: StudioId;
  title: string;
  message: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}): WorkspaceAuditEvent {
  return {
    ...input,
    type: "provider_sandbox_execution_failed",
    description: input.message,
    severity: "error",
    source: getSourceFromStudioId(input.studioId),
    metadata: {
      ...input.metadata,
      providerExecuted: false,
      runtimeCodeLoaded: false,
      moduleUrlExecuted: false,
      networkAccessed: false,
      providerApiCalled: false,
    },
  };
}

export function createReadinessCheckRequestedEvent(input: {
  id: string;
  studioId: StudioId;
  title: string;
  message: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}): WorkspaceAuditEvent {
  return {
    ...input,
    type: "provider_readiness_check_requested",
    description: input.message,
    severity: "info",
    source: getSourceFromStudioId(input.studioId),
    metadata: {
      ...input.metadata,
      executionBlockedByPhasePolicy: true,
      liveExecutionAvailable: false,
      providerExecuted: false,
      networkAccessed: false,
      providerApiCalled: false,
    },
  };
}

export function createReadinessCheckCompletedEvent(input: {
  id: string;
  studioId: StudioId;
  title: string;
  message: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}): WorkspaceAuditEvent {
  return {
    ...input,
    type: "provider_readiness_check_completed",
    description: input.message,
    severity: "success",
    source: getSourceFromStudioId(input.studioId),
    metadata: {
      ...input.metadata,
      executionBlockedByPhasePolicy: true,
      liveExecutionAvailable: false,
      providerExecuted: false,
      networkAccessed: false,
      providerApiCalled: false,
    },
  };
}

export function createReadinessCheckFailedEvent(input: {
  id: string;
  studioId: StudioId;
  title: string;
  message: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}): WorkspaceAuditEvent {
  return {
    ...input,
    type: "provider_readiness_check_failed",
    description: input.message,
    severity: "error",
    source: getSourceFromStudioId(input.studioId),
    metadata: {
      ...input.metadata,
      executionBlockedByPhasePolicy: true,
      liveExecutionAvailable: false,
      providerExecuted: false,
      networkAccessed: false,
      providerApiCalled: false,
    },
  };
}

// ---------------------------------------------------------------------------
// Phase 28 — Live-Like Provider Adapter Boundary Audit Events
// These events record REDACTED evidence only. Metadata MUST NOT contain:
//   - endpoint URLs or hostnames
//   - credentials, tokens, or API keys
//   - raw request/response payloads
//   - binary or base64 image data
//   - arbitrary provider-supplied metadata
// Security flags injected: runtimeCodeLoaded:false, moduleUrlExecuted:false,
//                          secretPersisted:false, secretExported:false
// ---------------------------------------------------------------------------

export function createProviderLiveExecutionRequestedEvent(input: {
  id: string;
  studioId: StudioId;
  title: string;
  message: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}): WorkspaceAuditEvent {
  return {
    ...input,
    type: "provider_live_execution_requested",
    description: input.message,
    severity: "info",
    source: getSourceFromStudioId(input.studioId),
    metadata: {
      ...input.metadata,
      providerExecuted: false,
      networkAccessed: false,
      providerApiCalled: false,
      runtimeCodeLoaded: false,
      moduleUrlExecuted: false,
      secretPersisted: false,
      secretExported: false,
    },
  };
}

export function createProviderLiveExecutionCompletedEvent(input: {
  id: string;
  studioId: StudioId;
  title: string;
  message: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}): WorkspaceAuditEvent {
  return {
    ...input,
    type: "provider_live_execution_completed",
    description: input.message,
    severity: "success",
    source: getSourceFromStudioId(input.studioId),
    metadata: {
      ...input.metadata,
      providerExecuted: true,
      networkAccessed: true,
      providerApiCalled: true,
      runtimeCodeLoaded: false,
      moduleUrlExecuted: false,
      secretPersisted: false,
      secretExported: false,
    },
  };
}

export function createProviderLiveExecutionFailedEvent(input: {
  id: string;
  studioId: StudioId;
  title: string;
  message: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}): WorkspaceAuditEvent {
  return {
    ...input,
    type: "provider_live_execution_failed",
    description: input.message,
    severity: "error",
    source: getSourceFromStudioId(input.studioId),
    metadata: {
      ...input.metadata,
      providerExecuted: false,
      networkAccessed: false,
      providerApiCalled: false,
      runtimeCodeLoaded: false,
      moduleUrlExecuted: false,
      secretPersisted: false,
      secretExported: false,
    },
  };
}
