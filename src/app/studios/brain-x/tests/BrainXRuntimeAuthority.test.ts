import { describe, expect, it } from "vitest";
import {
  evaluateBrainXRuntimeAuthority,
  createBrainXAuthorityBlockedAuditEvent,
} from "../BrainXRuntimeAuthority";
import type { StudioRuntimeAuthority } from "../../../../workspace/StudioRuntimeManifest";

describe("BrainXRuntimeAuthority", () => {
  it("allows plan generation if useProviders and readProject are allowed", () => {
    const authority: StudioRuntimeAuthority = {
      canReadProject: true,
      canWriteCanvas: false,
      canExport: false,
      canUseProviders: true,
      requiresApproval: false,
    };

    const decision = evaluateBrainXRuntimeAuthority("generatePlan", authority);
    expect(decision.allowed).toBe(true);
    expect(decision.message).toContain("allowed by runtime authority");
  });

  it("blocks plan generation if useProviders is denied", () => {
    const authority: StudioRuntimeAuthority = {
      canReadProject: true,
      canWriteCanvas: false,
      canExport: false,
      canUseProviders: false,
      requiresApproval: false,
    };

    const decision = evaluateBrainXRuntimeAuthority("generatePlan", authority);
    expect(decision.allowed).toBe(false);
    expect(decision.message).toContain("blocked: Runtime authority blocks use providers.");
  });

  it("blocks plan generation if readProject is denied", () => {
    const authority: StudioRuntimeAuthority = {
      canReadProject: false,
      canWriteCanvas: false,
      canExport: false,
      canUseProviders: true,
      requiresApproval: false,
    };

    const decision = evaluateBrainXRuntimeAuthority("generatePlan", authority);
    expect(decision.allowed).toBe(false);
    expect(decision.message).toContain("blocked: Runtime authority blocks read project.");
  });

  it("allows export if canExport is allowed", () => {
    const authority: StudioRuntimeAuthority = {
      canReadProject: true,
      canWriteCanvas: false,
      canExport: true,
      canUseProviders: true,
      requiresApproval: false,
    };

    const decision = evaluateBrainXRuntimeAuthority("exportComposition", authority);
    expect(decision.allowed).toBe(true);
  });

  it("blocks export if canExport is denied", () => {
    const authority: StudioRuntimeAuthority = {
      canReadProject: true,
      canWriteCanvas: false,
      canExport: false,
      canUseProviders: true,
      requiresApproval: false,
    };

    const decision = evaluateBrainXRuntimeAuthority("exportComposition", authority);
    expect(decision.allowed).toBe(false);
    expect(decision.message).toContain("blocked: Runtime authority blocks export.");
  });

  it("creates a properly metadata-annotated authority_blocked audit event", () => {
    const authority: StudioRuntimeAuthority = {
      canReadProject: true,
      canWriteCanvas: false,
      canExport: false,
      canUseProviders: false,
      requiresApproval: false,
    };

    const decision = evaluateBrainXRuntimeAuthority("generatePlan", authority);
    const event = createBrainXAuthorityBlockedAuditEvent(decision);

    expect(event.type).toBe("authority_blocked");
    expect(event.studioId).toBe("brain-x");
    expect(event.severity).toBe("error");
    expect(event.metadata).toEqual({
      action: "generatePlan",
      requiredCapabilities: ["useProviders", "readProject"],
      missingCapabilities: ["useProviders"],
    });
  });
});
