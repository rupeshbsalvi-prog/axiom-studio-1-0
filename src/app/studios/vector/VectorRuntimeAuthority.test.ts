import { describe, expect, it } from "vitest";
import { createVectorAuthorityBlockedAuditEvent, evaluateVectorRuntimeAuthority } from "./VectorRuntimeAuthority";
import type { StudioRuntimeAuthority } from "../../../workspace/StudioRuntimeManifest";

const fullyAllowedAuthority: StudioRuntimeAuthority = {
  canReadProject: true,
  canWriteCanvas: true,
  canExport: true,
  canUseProviders: true,
  requiresApproval: true,
};

describe("VectorRuntimeAuthority", () => {
  it("blocks provider vector generation because provider use is not authorized by default", () => {
    const decision = evaluateVectorRuntimeAuthority("providerGenerateVector");

    expect(decision.allowed).toBe(false);
    expect(decision.message).toContain("Runtime authority blocks use providers.");
  });

  it("allows provider generation only when provider use and canvas writes are both granted", () => {
    expect(evaluateVectorRuntimeAuthority("providerGenerateVector", fullyAllowedAuthority)).toEqual(
      expect.objectContaining({
        action: "providerGenerateVector",
        allowed: true,
        message: "Vector provider generation allowed after user approval.",
      }),
    );
  });

  it("blocks provider generation when canvas writes are denied", () => {
    const decision = evaluateVectorRuntimeAuthority("providerGenerateVector", {
      ...fullyAllowedAuthority,
      canWriteCanvas: false,
    });

    expect(decision.allowed).toBe(false);
    expect(decision.message).toContain("Runtime authority blocks write canvas.");
  });

  it("allows export when export authority is granted", () => {
    expect(evaluateVectorRuntimeAuthority("exportVector")).toEqual(
      expect.objectContaining({
        action: "exportVector",
        allowed: true,
        message: "Vector export allowed after user approval.",
      }),
    );
  });

  it("blocks export when export authority is denied", () => {
    expect(
      evaluateVectorRuntimeAuthority("exportVector", {
        ...fullyAllowedAuthority,
        canExport: false,
      }),
    ).toEqual(
      expect.objectContaining({
        action: "exportVector",
        allowed: false,
        message: "Vector export blocked: Runtime authority blocks export.",
      }),
    );
  });

  it("allows dry-run preview composition by default since it does not require providers", () => {
    const decision = evaluateVectorRuntimeAuthority("previewVectorComposition");
    expect(decision.allowed).toBe(true);
    expect(decision.message).toContain("Vector preview composition allowed");
  });

  it("blocks dry-run preview composition when canvas writes are denied", () => {
    const decision = evaluateVectorRuntimeAuthority("previewVectorComposition", {
      ...fullyAllowedAuthority,
      canWriteCanvas: false,
    });
    expect(decision.allowed).toBe(false);
    expect(decision.message).toContain("Runtime authority blocks write canvas.");
  });

  it("creates audit events for blocked authority decisions", () => {
    const decision = evaluateVectorRuntimeAuthority("providerGenerateVector");

    expect(createVectorAuthorityBlockedAuditEvent(decision)).toEqual(
      expect.objectContaining({
        type: "authority_blocked",
        title: "Vector provider generation Blocked",
        description: expect.stringContaining("Runtime authority blocks use providers."),
      }),
    );
  });
});
