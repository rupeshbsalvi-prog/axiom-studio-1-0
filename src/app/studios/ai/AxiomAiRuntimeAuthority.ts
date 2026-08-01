import { evaluateRuntimeAuthority, type RuntimeAuthorityAction, type RuntimeAuthorityDecision } from "../../../workspace/RuntimeAuthorityGate";
import { getStudioRuntimeManifestRecord, type StudioRuntimeAuthority } from "../../../workspace/StudioRuntimeManifest";
import type { WorkspaceAuditEvent } from "../../../workspace/WorkspaceAuditService";

export type AxiomAiRuntimeAction = "useProviders" | "exportComposition";

export type AxiomAiRuntimeAuthorityDecision = {
  action: AxiomAiRuntimeAction;
  allowed: boolean;
  decisions: RuntimeAuthorityDecision[];
  message: string;
};

const axiomAiActionRequirements: Record<AxiomAiRuntimeAction, RuntimeAuthorityAction[]> = {
  useProviders: ["useProviders"],
  exportComposition: ["export"],
};

const axiomAiActionLabels: Record<AxiomAiRuntimeAction, string> = {
  useProviders: "Axiom AI provider invocation",
  exportComposition: "Axiom AI project export",
};

export function evaluateAxiomAiRuntimeAuthority(
  action: AxiomAiRuntimeAction,
  authority: StudioRuntimeAuthority | null | undefined = getStudioRuntimeManifestRecord("axiom-ai")?.authority,
): AxiomAiRuntimeAuthorityDecision {
  const decisions = axiomAiActionRequirements[action].map((requiredAction) =>
    evaluateRuntimeAuthority(authority, requiredAction)
  );
  const blockedDecisions = decisions.filter((decision) => !decision.allowed);

  if (blockedDecisions.length > 0) {
    return {
      action,
      allowed: false,
      decisions,
      message: `${axiomAiActionLabels[action]} blocked: ${blockedDecisions.map((decision) => decision.reason).join(" ")}`,
    };
  }

  const requiresApproval = decisions.some((decision) => decision.requiresApproval);

  return {
    action,
    allowed: true,
    decisions,
    message: requiresApproval
      ? `${axiomAiActionLabels[action]} allowed after user approval.`
      : `${axiomAiActionLabels[action]} allowed by runtime authority.`,
  };
}

export function createAxiomAiAuthorityBlockedAuditEvent(decision: AxiomAiRuntimeAuthorityDecision): WorkspaceAuditEvent {
  const missingCapabilities = decision.decisions.filter((d) => !d.allowed).map((d) => d.action);
  const requiredCapabilities = axiomAiActionRequirements[decision.action];

  return {
    id: `audit_axiom-ai_authority_blocked_${Math.random().toString(36).substring(2, 8)}`,
    timestamp: new Date().toISOString(),
    studioId: "axiom-ai",
    type: "authority_blocked",
    title: `${axiomAiActionLabels[decision.action]} Blocked`,
    message: decision.message,
    description: decision.message,
    severity: "error",
    source: "axiom-ai",
    metadata: {
      action: decision.action,
      requiredCapabilities,
      missingCapabilities,
    },
  };
}
