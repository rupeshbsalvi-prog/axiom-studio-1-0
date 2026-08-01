import { evaluateRuntimeAuthority, type RuntimeAuthorityAction, type RuntimeAuthorityDecision } from "../../../workspace/RuntimeAuthorityGate";
import { getStudioRuntimeManifestRecord, type StudioRuntimeAuthority } from "../../../workspace/StudioRuntimeManifest";
import type { PhotoAuditEvent } from "../../services/photoTypes";

export type PhotoRuntimeAction = "generateComposition" | "exportComposition";

export type PhotoRuntimeAuthorityDecision = {
  action: PhotoRuntimeAction;
  allowed: boolean;
  decisions: RuntimeAuthorityDecision[];
  message: string;
};

const photoActionRequirements: Record<PhotoRuntimeAction, RuntimeAuthorityAction[]> = {
  generateComposition: ["useProviders", "writeCanvas"],
  exportComposition: ["export"],
};

const photoActionLabels: Record<PhotoRuntimeAction, string> = {
  generateComposition: "Photo generation",
  exportComposition: "Photo export",
};

export function evaluatePhotoRuntimeAuthority(
  action: PhotoRuntimeAction,
  authority: StudioRuntimeAuthority | null | undefined = getStudioRuntimeManifestRecord("photo")?.authority,
): PhotoRuntimeAuthorityDecision {
  const decisions = photoActionRequirements[action].map((requiredAction) => evaluateRuntimeAuthority(authority, requiredAction));
  const blockedDecisions = decisions.filter((decision) => !decision.allowed);

  if (blockedDecisions.length > 0) {
    return {
      action,
      allowed: false,
      decisions,
      message: `${photoActionLabels[action]} blocked: ${blockedDecisions.map((decision) => decision.reason).join(" ")}`,
    };
  }

  const requiresApproval = decisions.some((decision) => decision.requiresApproval);

  return {
    action,
    allowed: true,
    decisions,
    message: requiresApproval
      ? `${photoActionLabels[action]} allowed after user approval.`
      : `${photoActionLabels[action]} allowed by runtime authority.`,
  };
}

export function createPhotoAuthorityBlockedAuditEvent(decision: PhotoRuntimeAuthorityDecision): PhotoAuditEvent {
  return {
    id: `audit_photo_authority_blocked_${Math.random().toString(36).substring(2, 8)}`,
    type: "authority_blocked",
    timestamp: new Date().toISOString(),
    title: `${photoActionLabels[decision.action]} Blocked`,
    description: decision.message,
  };
}
