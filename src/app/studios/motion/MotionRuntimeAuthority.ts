import { evaluateRuntimeAuthority, type RuntimeAuthorityAction, type RuntimeAuthorityDecision } from "../../../workspace/RuntimeAuthorityGate";
import { getStudioRuntimeManifestRecord, type StudioRuntimeAuthority } from "../../../workspace/StudioRuntimeManifest";
import type { MotionAuditEvent } from "../../services/motionTypes";

export type MotionRuntimeAction = "generateMotion" | "exportLottie";

export type MotionRuntimeAuthorityDecision = {
  action: MotionRuntimeAction;
  allowed: boolean;
  decisions: RuntimeAuthorityDecision[];
  message: string;
};

const motionActionRequirements: Record<MotionRuntimeAction, RuntimeAuthorityAction[]> = {
  generateMotion: ["useProviders", "writeCanvas"],
  exportLottie: ["export"],
};

const motionActionLabels: Record<MotionRuntimeAction, string> = {
  generateMotion: "Motion generation",
  exportLottie: "Lottie export",
};

export function evaluateMotionRuntimeAuthority(
  action: MotionRuntimeAction,
  authority: StudioRuntimeAuthority | null | undefined = getStudioRuntimeManifestRecord("motion")?.authority
): MotionRuntimeAuthorityDecision {
  const decisions = motionActionRequirements[action].map((requiredAction) =>
    evaluateRuntimeAuthority(authority, requiredAction)
  );
  const blockedDecisions = decisions.filter((decision) => !decision.allowed);

  if (blockedDecisions.length > 0) {
    return {
      action,
      allowed: false,
      decisions,
      message: `${motionActionLabels[action]} blocked: ${blockedDecisions.map((decision) => decision.reason).join(" ")}`,
    };
  }

  const requiresApproval = decisions.some((decision) => decision.requiresApproval);

  return {
    action,
    allowed: true,
    decisions,
    message: requiresApproval
      ? `${motionActionLabels[action]} allowed after user approval.`
      : `${motionActionLabels[action]} allowed by runtime authority.`,
  };
}

export function createMotionAuthorityBlockedAuditEvent(decision: MotionRuntimeAuthorityDecision): MotionAuditEvent {
  return {
    id: `audit_motion_authority_blocked_${Math.random().toString(36).substring(2, 8)}`,
    type: "authority_blocked",
    timestamp: new Date().toISOString(),
    title: `${motionActionLabels[decision.action]} Blocked`,
    description: decision.message,
  };
}
