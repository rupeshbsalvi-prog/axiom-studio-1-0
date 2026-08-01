import { evaluateRuntimeAuthority, type RuntimeAuthorityAction, type RuntimeAuthorityDecision } from "../../../workspace/RuntimeAuthorityGate";
import { getStudioRuntimeManifestRecord, type StudioRuntimeAuthority } from "../../../workspace/StudioRuntimeManifest";
import type { VectorAuditEvent } from "../../services/vectorTypes";

export type VectorRuntimeAction = "previewVectorComposition" | "providerGenerateVector" | "exportVector";

export type VectorRuntimeAuthorityDecision = {
  action: VectorRuntimeAction;
  allowed: boolean;
  decisions: RuntimeAuthorityDecision[];
  message: string;
};

const vectorActionRequirements: Record<VectorRuntimeAction, RuntimeAuthorityAction[]> = {
  previewVectorComposition: ["readProject", "writeCanvas"],
  providerGenerateVector: ["useProviders", "writeCanvas"],
  exportVector: ["export"],
};

const vectorActionLabels: Record<VectorRuntimeAction, string> = {
  previewVectorComposition: "Vector preview composition",
  providerGenerateVector: "Vector provider generation",
  exportVector: "Vector export",
};

export function evaluateVectorRuntimeAuthority(
  action: VectorRuntimeAction,
  authority: StudioRuntimeAuthority | null | undefined = getStudioRuntimeManifestRecord("vector")?.authority,
): VectorRuntimeAuthorityDecision {
  const decisions = vectorActionRequirements[action].map((requiredAction) => evaluateRuntimeAuthority(authority, requiredAction));
  const blockedDecisions = decisions.filter((decision) => !decision.allowed);

  if (blockedDecisions.length > 0) {
    return {
      action,
      allowed: false,
      decisions,
      message: `${vectorActionLabels[action]} blocked: ${blockedDecisions.map((decision) => decision.reason).join(" ")}`,
    };
  }

  const requiresApproval = decisions.some((decision) => decision.requiresApproval);

  return {
    action,
    allowed: true,
    decisions,
    message: requiresApproval
      ? `${vectorActionLabels[action]} allowed after user approval.`
      : `${vectorActionLabels[action]} allowed by runtime authority.`,
  };
}

export function createVectorAuthorityBlockedAuditEvent(decision: VectorRuntimeAuthorityDecision): VectorAuditEvent {
  return {
    id: `audit_vector_authority_blocked_${Math.random().toString(36).substring(2, 8)}`,
    type: "authority_blocked",
    timestamp: new Date().toISOString(),
    title: `${vectorActionLabels[decision.action]} Blocked`,
    description: decision.message,
  };
}
