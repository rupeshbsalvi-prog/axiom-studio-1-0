import { evaluateRuntimeAuthority, type RuntimeAuthorityAction, type RuntimeAuthorityDecision } from "../../../workspace/RuntimeAuthorityGate";
import { getStudioRuntimeManifestRecord, type StudioRuntimeAuthority } from "../../../workspace/StudioRuntimeManifest";
import type { WorkspaceAuditEvent } from "../../../workspace/WorkspaceAuditService";

export type BrainXRuntimeAction = "generatePlan" | "exportComposition";

export type BrainXRuntimeAuthorityDecision = {
  action: BrainXRuntimeAction;
  allowed: boolean;
  decisions: RuntimeAuthorityDecision[];
  message: string;
};

const brainXActionRequirements: Record<BrainXRuntimeAction, RuntimeAuthorityAction[]> = {
  generatePlan: ["useProviders", "readProject"],
  exportComposition: ["export"],
};

const brainXActionLabels: Record<BrainXRuntimeAction, string> = {
  generatePlan: "Brain X plan generation",
  exportComposition: "Brain X project export",
};

export function evaluateBrainXRuntimeAuthority(
  action: BrainXRuntimeAction,
  authority: StudioRuntimeAuthority | null | undefined = getStudioRuntimeManifestRecord("brain-x")?.authority,
): BrainXRuntimeAuthorityDecision {
  const decisions = brainXActionRequirements[action].map((requiredAction) =>
    evaluateRuntimeAuthority(authority, requiredAction)
  );
  const blockedDecisions = decisions.filter((decision) => !decision.allowed);

  if (blockedDecisions.length > 0) {
    return {
      action,
      allowed: false,
      decisions,
      message: `${brainXActionLabels[action]} blocked: ${blockedDecisions.map((decision) => decision.reason).join(" ")}`,
    };
  }

  const requiresApproval = decisions.some((decision) => decision.requiresApproval);

  return {
    action,
    allowed: true,
    decisions,
    message: requiresApproval
      ? `${brainXActionLabels[action]} allowed after user approval.`
      : `${brainXActionLabels[action]} allowed by runtime authority.`,
  };
}

export function createBrainXAuthorityBlockedAuditEvent(decision: BrainXRuntimeAuthorityDecision): WorkspaceAuditEvent {
  const missingCapabilities = decision.decisions.filter((d) => !d.allowed).map((d) => d.action);
  const requiredCapabilities = brainXActionRequirements[decision.action];

  return {
    id: `audit_brain-x_authority_blocked_${Math.random().toString(36).substring(2, 8)}`,
    timestamp: new Date().toISOString(),
    studioId: "brain-x",
    type: "authority_blocked",
    title: `${brainXActionLabels[decision.action]} Blocked`,
    message: decision.message,
    description: decision.message,
    severity: "error",
    source: "brain-x",
    metadata: {
      action: decision.action,
      requiredCapabilities,
      missingCapabilities,
    },
  };
}
