import { describe, expect, it } from "vitest";

import type { ImagineXLearningControlV1 } from "../projects/projectDraft";
import { resolveImagineXLearningAuthority } from "./ImagineXLearningAuthority";


const granted: ImagineXLearningControlV1 = {
  contractVersion: "imagine-x-learning-control.v1",
  enabled: true,
  scope: "local_workspace",
  consent: "granted",
  updatedAtUtc: "2026-08-01T00:00:00.000Z",
};

const verifiedPolicy = (learningAllowed: boolean) => ({
  status: "verified" as const,
  authority: {
    contractVersion: "axiom-workspace-learning-authority.v1" as const,
    membership: {
      workspaceId: "workspace-local",
      memberId: "member-local",
      role: "admin" as const,
      status: "active" as const,
    },
    policy: {
      policyId: "workspace-local:learning",
      policyVersion: 1 as const,
      workspaceId: "workspace-local",
      learningAllowed,
      allowedScopes: ["local_workspace" as const],
      policyRequired: true,
      source: "server_configuration" as const,
    },
  },
});

describe("resolveImagineXLearningAuthority", () => {
  it("allows explicit local consent when workspace policy is not required", () => {
    expect(resolveImagineXLearningAuthority(granted, { status: "not_required" })).toEqual({
      requestedEnabled: true,
      effectiveEnabled: true,
      scope: "local_workspace",
      source: "personal_control",
      reason: "User consent enables local-workspace learning.",
    });
  });

  it("keeps personal denial effective even when workspace policy allows learning", () => {
    expect(resolveImagineXLearningAuthority(
      { ...granted, enabled: false, consent: "not_granted" },
      verifiedPolicy(true),
    )).toMatchObject({
      requestedEnabled: false,
      effectiveEnabled: false,
      source: "personal_control",
      reason: "Local learning is not enabled by the user.",
    });
  });

  it("lets verified workspace denial override personal consent", () => {
    expect(resolveImagineXLearningAuthority(granted, verifiedPolicy(false))).toMatchObject({
      requestedEnabled: true,
      effectiveEnabled: false,
      source: "workspace_policy",
      reason: "Workspace policy disables learning.",
    });
  });

  it("allows explicit local consent when verified workspace policy permits it", () => {
    expect(resolveImagineXLearningAuthority(granted, verifiedPolicy(true))).toMatchObject({
      requestedEnabled: true,
      effectiveEnabled: true,
      source: "workspace_policy",
      reason: "Workspace policy permits explicit local learning.",
    });
  });

  it("fails closed when required policy is unavailable or internally inconsistent", () => {
    expect(resolveImagineXLearningAuthority(granted, {
      status: "required_unavailable",
    })).toMatchObject({
      effectiveEnabled: false,
      source: "workspace_policy",
      reason: "Required workspace policy is unavailable.",
    });

    const mismatched = verifiedPolicy(true);
    mismatched.authority.policy.workspaceId = "other-workspace";
    expect(resolveImagineXLearningAuthority(granted, mismatched)).toMatchObject({
      effectiveEnabled: false,
      source: "workspace_policy",
      reason: "Workspace policy does not match the active membership.",
    });
  });
});
