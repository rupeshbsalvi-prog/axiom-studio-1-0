import { describe, expect, it } from "vitest";
import { createPhotoAuthorityBlockedAuditEvent, evaluatePhotoRuntimeAuthority } from "./PhotoRuntimeAuthority";
import type { StudioRuntimeAuthority } from "../../../workspace/StudioRuntimeManifest";

const fullyAllowedAuthority: StudioRuntimeAuthority = {
  canReadProject: true,
  canWriteCanvas: true,
  canExport: true,
  canUseProviders: true,
  requiresApproval: true,
};

describe("PhotoRuntimeAuthority", () => {
  it("allows generation only when provider use and canvas writes are both granted", () => {
    expect(evaluatePhotoRuntimeAuthority("generateComposition", fullyAllowedAuthority)).toEqual(
      expect.objectContaining({
        action: "generateComposition",
        allowed: true,
        message: "Photo generation allowed after user approval.",
      }),
    );
  });

  it("blocks generation when provider access is denied", () => {
    const decision = evaluatePhotoRuntimeAuthority("generateComposition", {
      ...fullyAllowedAuthority,
      canUseProviders: false,
    });

    expect(decision.allowed).toBe(false);
    expect(decision.message).toContain("Runtime authority blocks use providers.");
  });

  it("blocks generation when canvas writes are denied", () => {
    const decision = evaluatePhotoRuntimeAuthority("generateComposition", {
      ...fullyAllowedAuthority,
      canWriteCanvas: false,
    });

    expect(decision.allowed).toBe(false);
    expect(decision.message).toContain("Runtime authority blocks write canvas.");
  });

  it("allows export only when export authority is granted", () => {
    expect(evaluatePhotoRuntimeAuthority("exportComposition", fullyAllowedAuthority)).toEqual(
      expect.objectContaining({
        action: "exportComposition",
        allowed: true,
        message: "Photo export allowed after user approval.",
      }),
    );

    expect(
      evaluatePhotoRuntimeAuthority("exportComposition", {
        ...fullyAllowedAuthority,
        canExport: false,
      }),
    ).toEqual(
      expect.objectContaining({
        action: "exportComposition",
        allowed: false,
        message: "Photo export blocked: Runtime authority blocks export.",
      }),
    );
  });

  it("creates audit events for blocked authority decisions", () => {
    const decision = evaluatePhotoRuntimeAuthority("generateComposition", {
      ...fullyAllowedAuthority,
      canUseProviders: false,
    });

    expect(createPhotoAuthorityBlockedAuditEvent(decision)).toEqual(
      expect.objectContaining({
        type: "authority_blocked",
        title: "Photo generation Blocked",
        description: expect.stringContaining("Runtime authority blocks use providers."),
      }),
    );
  });
});
