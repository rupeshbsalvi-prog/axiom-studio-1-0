import { describe, expect, it } from "vitest";
import {
  evaluateAxiomAiRuntimeAuthority,
  createAxiomAiAuthorityBlockedAuditEvent,
} from "../AxiomAiRuntimeAuthority";
import type { StudioRuntimeAuthority } from "../../../../workspace/StudioRuntimeManifest";

describe("AxiomAiRuntimeAuthority", () => {
  it("allows provider invocation if useProviders is allowed", () => {
    const authority: StudioRuntimeAuthority = {
      canReadProject: true,
      canWriteCanvas: false,
      canExport: false,
      canUseProviders: true,
      requiresApproval: false,
    };

    const decision = evaluateAxiomAiRuntimeAuthority("useProviders", authority);
    expect(decision.allowed).toBe(true);
    expect(decision.message).toContain("allowed by runtime authority");
  });

  it("blocks provider invocation if useProviders is denied", () => {
    const authority: StudioRuntimeAuthority = {
      canReadProject: true,
      canWriteCanvas: false,
      canExport: false,
      canUseProviders: false,
      requiresApproval: false,
    };

    const decision = evaluateAxiomAiRuntimeAuthority("useProviders", authority);
    expect(decision.allowed).toBe(false);
    expect(decision.message).toContain("blocked: Runtime authority blocks use providers.");
  });

  it("allows export if canExport is allowed", () => {
    const authority: StudioRuntimeAuthority = {
      canReadProject: true,
      canWriteCanvas: false,
      canExport: true,
      canUseProviders: true,
      requiresApproval: false,
    };

    const decision = evaluateAxiomAiRuntimeAuthority("exportComposition", authority);
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

    const decision = evaluateAxiomAiRuntimeAuthority("exportComposition", authority);
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

    const decision = evaluateAxiomAiRuntimeAuthority("useProviders", authority);
    const event = createAxiomAiAuthorityBlockedAuditEvent(decision);

    expect(event.type).toBe("authority_blocked");
    expect(event.studioId).toBe("axiom-ai");
    expect(event.severity).toBe("error");
    expect(event.metadata).toEqual({
      action: "useProviders",
      requiredCapabilities: ["useProviders"],
      missingCapabilities: ["useProviders"],
    });
  });
});
