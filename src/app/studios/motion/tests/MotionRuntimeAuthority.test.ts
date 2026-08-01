import { describe, expect, it } from "vitest";
import { evaluateMotionRuntimeAuthority, createMotionAuthorityBlockedAuditEvent } from "../MotionRuntimeAuthority";
import type { StudioRuntimeAuthority } from "../../../../workspace/StudioRuntimeManifest";

const fullyAllowedAuthority: StudioRuntimeAuthority = {
  canReadProject: true,
  canWriteCanvas: true,
  canExport: true,
  canUseProviders: true,
  requiresApproval: true,
};

describe("MotionRuntimeAuthority", () => {
  it("allows timeline read/view actions when reading is allowed", () => {
    // evaluateMotionRuntimeAuthority allows generateMotion if canWriteCanvas & canUseProviders are true.
    expect(evaluateMotionRuntimeAuthority("generateMotion", fullyAllowedAuthority)).toEqual(
      expect.objectContaining({
        action: "generateMotion",
        allowed: true,
        message: "Motion generation allowed after user approval.",
      })
    );
  });

  it("blocks provider execution when canUseProviders is false", () => {
    const decision = evaluateMotionRuntimeAuthority("generateMotion", {
      ...fullyAllowedAuthority,
      canUseProviders: false,
    });

    expect(decision.allowed).toBe(false);
    expect(decision.message).toContain("Runtime authority blocks use providers.");
  });

  it("blocks export when canExport is false", () => {
    const decision = evaluateMotionRuntimeAuthority("exportLottie", {
      ...fullyAllowedAuthority,
      canExport: false,
    });

    expect(decision.allowed).toBe(false);
    expect(decision.message).toContain("export blocked: Runtime authority blocks export.");
  });

  it("creates audit events for blocked authority decisions", () => {
    const decision = evaluateMotionRuntimeAuthority("generateMotion", {
      ...fullyAllowedAuthority,
      canUseProviders: false,
    });

    const event = createMotionAuthorityBlockedAuditEvent(decision);
    expect(event).toEqual(
      expect.objectContaining({
        type: "authority_blocked",
        title: "Motion generation Blocked",
        description: expect.stringContaining("Runtime authority blocks use providers."),
      })
    );
  });
});
