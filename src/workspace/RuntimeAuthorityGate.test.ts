import { describe, expect, it } from "vitest";
import { getStudioRuntimeManifestRecord } from "./StudioRuntimeManifest";
import { evaluateRuntimeAuthority, summarizeRuntimeAuthority, evaluateExternalRuntimeAuthority } from "./RuntimeAuthorityGate";
import { getWorkspaceAuditEvents, clearWorkspaceAuditEvents } from "./WorkspaceAuditService";

describe("RuntimeAuthorityGate", () => {
  it("allows permitted actions while preserving approval requirements", () => {
    const photoAuthority = getStudioRuntimeManifestRecord("photo")?.authority;

    expect(evaluateRuntimeAuthority(photoAuthority, "writeCanvas")).toEqual({
      action: "writeCanvas",
      allowed: true,
      requiresApproval: true,
      reason: "Runtime authority allows write canvas after approval.",
    });
  });

  it("blocks actions that the manifest authority does not grant", () => {
    const vectorAuthority = getStudioRuntimeManifestRecord("vector")?.authority;

    expect(evaluateRuntimeAuthority(vectorAuthority, "useProviders")).toEqual({
      action: "useProviders",
      allowed: false,
      requiresApproval: true,
      reason: "Runtime authority blocks use providers.",
    });
  });

  it("blocks all guarded actions when no runtime authority is registered", () => {
    expect(evaluateRuntimeAuthority(undefined, "export")).toEqual({
      action: "export",
      allowed: false,
      requiresApproval: true,
      reason: "No runtime authority is registered for export.",
    });
  });

  it("summarizes authority decisions for inspector diagnostics", () => {
    const vectorAuthority = getStudioRuntimeManifestRecord("vector")?.authority;

    expect(summarizeRuntimeAuthority(vectorAuthority)).toBe(
      "read project: allowed, write canvas: allowed, export: allowed, use providers: blocked",
    );
  });

  describe("evaluateExternalRuntimeAuthority", () => {
    it("allows the action if all required capabilities are declared and granted", () => {
      clearWorkspaceAuditEvents();
      const res = evaluateExternalRuntimeAuthority({
        runtimeId: "motion-plugin",
        action: "exportGif",
        requiredCapabilities: ["export"],
        declaredCapabilities: ["export", "readProject"],
        grantedCapabilities: ["export", "readProject"],
      });

      expect(res.allowed).toBe(true);
      expect(res.missingDeclaredCapabilities).toHaveLength(0);
      expect(res.missingGrantedCapabilities).toHaveLength(0);
      expect(getWorkspaceAuditEvents()).toHaveLength(0);
    });

    it("blocks and logs audit event if manifest lacks declared capability", () => {
      clearWorkspaceAuditEvents();
      const res = evaluateExternalRuntimeAuthority({
        runtimeId: "motion-plugin",
        action: "writeOutput",
        requiredCapabilities: ["filesystem"],
        declaredCapabilities: ["export"],
        grantedCapabilities: ["filesystem", "export"],
      });

      expect(res.allowed).toBe(false);
      expect(res.missingDeclaredCapabilities).toEqual(["filesystem"]);
      expect(res.missingGrantedCapabilities).toHaveLength(0);
      
      const logs = getWorkspaceAuditEvents();
      expect(logs).toHaveLength(1);
      expect(logs[0].type).toBe("runtime_authority_blocked");
      expect(logs[0].metadata?.runtimeId).toBe("motion-plugin");
      expect(logs[0].metadata?.action).toBe("writeOutput");
    });

    it("blocks and logs audit event if workspace lacks granted capability", () => {
      clearWorkspaceAuditEvents();
      const res = evaluateExternalRuntimeAuthority({
        runtimeId: "motion-plugin",
        action: "useNetwork",
        requiredCapabilities: ["network"],
        declaredCapabilities: ["network"],
        grantedCapabilities: ["export"],
      });

      expect(res.allowed).toBe(false);
      expect(res.missingDeclaredCapabilities).toHaveLength(0);
      expect(res.missingGrantedCapabilities).toEqual(["network"]);

      const logs = getWorkspaceAuditEvents();
      expect(logs).toHaveLength(1);
      expect(logs[0].type).toBe("runtime_authority_blocked");
    });
  });
});
