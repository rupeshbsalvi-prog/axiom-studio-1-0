import type { ImagineXLearningControlV1 } from "../projects/projectDraft";

export interface WorkspaceLearningAuthorityV1 {
  contractVersion: "axiom-workspace-learning-authority.v1";
  membership: {
    workspaceId: string;
    memberId: string;
    role: "owner" | "admin" | "member" | "viewer";
    status: "active";
  };
  policy: {
    policyId: string;
    policyVersion: 1;
    workspaceId: string;
    learningAllowed: boolean;
    allowedScopes: Array<"local_workspace">;
    policyRequired: boolean;
    source: "server_configuration";
  };
}

export type ImagineXWorkspaceLearningPolicyState =
  | { status: "not_required" }
  | { status: "required_unavailable" }
  | { status: "verified"; authority: WorkspaceLearningAuthorityV1 };

export interface ImagineXLearningAuthorityResolution {
  requestedEnabled: boolean;
  effectiveEnabled: boolean;
  scope: "local_workspace";
  source: "personal_control" | "workspace_policy";
  reason: string;
}

export function resolveImagineXLearningAuthority(
  control: ImagineXLearningControlV1 | undefined,
  workspacePolicy: ImagineXWorkspaceLearningPolicyState = { status: "not_required" },
): ImagineXLearningAuthorityResolution {
  const requestedEnabled = Boolean(control?.enabled && control.consent === "granted");
  const base = { requestedEnabled, scope: "local_workspace" as const };

  if (!requestedEnabled) {
    return {
      ...base,
      effectiveEnabled: false,
      source: "personal_control",
      reason: "Local learning is not enabled by the user.",
    };
  }
  if (workspacePolicy.status === "required_unavailable") {
    return {
      ...base,
      effectiveEnabled: false,
      source: "workspace_policy",
      reason: "Required workspace policy is unavailable.",
    };
  }
  if (workspacePolicy.status === "verified") {
    const { membership, policy } = workspacePolicy.authority;
    if (membership.workspaceId !== policy.workspaceId) {
      return {
        ...base,
        effectiveEnabled: false,
        source: "workspace_policy",
        reason: "Workspace policy does not match the active membership.",
      };
    }
    if (!policy.learningAllowed || !policy.allowedScopes.includes("local_workspace")) {
      return {
        ...base,
        effectiveEnabled: false,
        source: "workspace_policy",
        reason: "Workspace policy disables learning.",
      };
    }
    return {
      ...base,
      effectiveEnabled: true,
      source: "workspace_policy",
      reason: "Workspace policy permits explicit local learning.",
    };
  }
  return {
    ...base,
    effectiveEnabled: true,
    source: "personal_control",
    reason: "User consent enables local-workspace learning.",
  };
}
