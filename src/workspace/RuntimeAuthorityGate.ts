import type { StudioRuntimeAuthority } from "./StudioRuntimeManifest";
import { type RuntimeCapability } from "../runtime/manifest/RuntimeManifestTypes";
import {
  recordWorkspaceAuditEvent,
  createRuntimeAuthorityBlockedEvent,
} from "./WorkspaceAuditService";

export type RuntimeAuthorityAction = "readProject" | "writeCanvas" | "export" | "useProviders";

export type RuntimeAuthorityDecision = {
  action: RuntimeAuthorityAction;
  allowed: boolean;
  requiresApproval: boolean;
  reason: string;
};

const actionAuthorityKey: Record<RuntimeAuthorityAction, keyof Omit<StudioRuntimeAuthority, "requiresApproval">> = {
  readProject: "canReadProject",
  writeCanvas: "canWriteCanvas",
  export: "canExport",
  useProviders: "canUseProviders",
};

const actionLabels: Record<RuntimeAuthorityAction, string> = {
  readProject: "read project",
  writeCanvas: "write canvas",
  export: "export",
  useProviders: "use providers",
};

export function evaluateRuntimeAuthority(
  authority: StudioRuntimeAuthority | null | undefined,
  action: RuntimeAuthorityAction,
): RuntimeAuthorityDecision {
  if (!authority) {
    return {
      action,
      allowed: false,
      requiresApproval: true,
      reason: `No runtime authority is registered for ${actionLabels[action]}.`,
    };
  }

  const authorityKey = actionAuthorityKey[action];
  const allowed = authority[authorityKey];

  if (!allowed) {
    return {
      action,
      allowed: false,
      requiresApproval: authority.requiresApproval,
      reason: `Runtime authority blocks ${actionLabels[action]}.`,
    };
  }

  return {
    action,
    allowed: true,
    requiresApproval: authority.requiresApproval,
    reason: authority.requiresApproval
      ? `Runtime authority allows ${actionLabels[action]} after approval.`
      : `Runtime authority allows ${actionLabels[action]}.`,
  };
}

export function summarizeRuntimeAuthority(authority: StudioRuntimeAuthority | null | undefined): string {
  const decisions: RuntimeAuthorityAction[] = ["readProject", "writeCanvas", "export", "useProviders"];
  return decisions
    .map((action) => evaluateRuntimeAuthority(authority, action))
    .map((decision) => `${actionLabels[decision.action]}: ${decision.allowed ? "allowed" : "blocked"}`)
    .join(", ");
}

export interface RuntimeAuthorityResult {
  allowed: boolean;
  runtimeId: string;
  action: string;
  requiredCapabilities: RuntimeCapability[];
  declaredCapabilities: RuntimeCapability[];
  missingDeclaredCapabilities: RuntimeCapability[];
  missingGrantedCapabilities: RuntimeCapability[];
  reason?: string;
}

export function evaluateExternalRuntimeAuthority(input: {
  runtimeId: string;
  action: string;
  requiredCapabilities: RuntimeCapability[];
  declaredCapabilities: RuntimeCapability[];
  grantedCapabilities: RuntimeCapability[];
}): RuntimeAuthorityResult {
  const missingDeclaredCapabilities = input.requiredCapabilities.filter(
    (cap) => !input.declaredCapabilities.includes(cap)
  );

  const missingGrantedCapabilities = input.requiredCapabilities.filter(
    (cap) => !input.grantedCapabilities.includes(cap)
  );

  const allowed =
    missingDeclaredCapabilities.length === 0 && missingGrantedCapabilities.length === 0;

  let reason = "";
  if (!allowed) {
    const reasons: string[] = [];
    if (missingDeclaredCapabilities.length > 0) {
      reasons.push(`missing declared capabilities: [${missingDeclaredCapabilities.join(", ")}]`);
    }
    if (missingGrantedCapabilities.length > 0) {
      reasons.push(`missing granted capabilities: [${missingGrantedCapabilities.join(", ")}]`);
    }
    reason = `Action '${input.action}' is blocked: ${reasons.join(" and ")}.`;

    // Record audit event when allowed is false
    recordWorkspaceAuditEvent(
      createRuntimeAuthorityBlockedEvent({
        id: `runtime_auth_block_${input.runtimeId}_${input.action}_${Date.now()}`,
        title: "Runtime Authority Blocked",
        message: `Runtime '${input.runtimeId}' was blocked from action '${input.action}' due to missing capabilities.`,
        timestamp: new Date().toISOString(),
        metadata: {
          runtimeId: input.runtimeId,
          action: input.action,
          requiredCapabilities: input.requiredCapabilities,
          declaredCapabilities: input.declaredCapabilities,
          missingDeclaredCapabilities,
          missingGrantedCapabilities,
        },
      })
    );
  } else {
    reason = `Action '${input.action}' allowed.`;
  }

  return {
    allowed,
    runtimeId: input.runtimeId,
    action: input.action,
    requiredCapabilities: input.requiredCapabilities,
    declaredCapabilities: input.declaredCapabilities,
    missingDeclaredCapabilities,
    missingGrantedCapabilities,
    reason,
  };
}

