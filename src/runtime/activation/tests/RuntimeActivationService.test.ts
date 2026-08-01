import { describe, it, expect, beforeEach } from "vitest";
import {
  activateRuntime,
  deactivateRuntime,
  getActivatedRuntime,
  isRuntimeActive,
  clearActiveRuntimes,
} from "../RuntimeActivationService";
import {
  registerRuntimeManifest,
  disableRuntime,
  clearRuntimeRegistry,
} from "../../RuntimeRegistry";
import {
  getWorkspaceAuditEvents,
  clearWorkspaceAuditEvents,
} from "../../../workspace/WorkspaceAuditService";
import { type RuntimeManifest } from "../../manifest/RuntimeManifestTypes";

describe("RuntimeActivationService", () => {
  const mockManifest: RuntimeManifest = {
    manifestVersion: "1.0",
    id: "mock-motion-studio",
    name: "Mock Motion Studio",
    version: "1.0.0",
    publisher: "Axiom",
    runtimeType: "studio",
    entry: {
      moduleUrl: "/runtime-modules/mock-motion-studio.js",
      signatureMode: "development",
    },
    capabilities: ["readProject", "writeProject"],
    compatibility: {
      axiomVersion: "1.0.0",
      apiVersion: "1",
    },
  };

  beforeEach(() => {
    clearRuntimeRegistry();
    clearActiveRuntimes();
    clearWorkspaceAuditEvents();
  });

  it("should successfully activate a registered runtime and verify event order", async () => {
    registerRuntimeManifest(mockManifest, { isDevelopment: true });
    clearWorkspaceAuditEvents();

    const activeRecord = await activateRuntime("mock-motion-studio", {
      grantedCapabilities: ["readProject", "writeProject"],
    });

    expect(activeRecord.status).toBe("active");
    expect(isRuntimeActive("mock-motion-studio")).toBe(true);
    expect(getActivatedRuntime("mock-motion-studio")).toBeDefined();

    // Verify event order: requested -> eligibility_checked -> completed
    const events = getWorkspaceAuditEvents();
    expect(events).toHaveLength(3);
    expect(events[0].type).toBe("runtime_activation_requested");
    expect(events[1].type).toBe("runtime_activation_eligibility_checked");
    expect(events[2].type).toBe("runtime_activation_completed");
    expect(events[2].metadata?.status).toBe("active");
    expect(events[2].metadata?.availableActionsCount).toBe(2);
  });

  it("should fail activation for unknown runtime and verify event order", async () => {
    await expect(
      activateRuntime("non-existent", { grantedCapabilities: [] })
    ).rejects.toThrow("is not found in the registry");

    // Verify event order: requested -> eligibility_checked -> failed
    const events = getWorkspaceAuditEvents();
    expect(events).toHaveLength(3);
    expect(events[0].type).toBe("runtime_activation_requested");
    expect(events[1].type).toBe("runtime_activation_eligibility_checked");
    expect(events[2].type).toBe("runtime_activation_failed");
    expect(events[2].metadata?.reason).toBe("runtime_not_found");
    expect(events[2].metadata?.status).toBe("failed");
  });

  it("should fail activation for disabled runtime", async () => {
    registerRuntimeManifest(mockManifest, { isDevelopment: true });
    disableRuntime("mock-motion-studio");
    clearWorkspaceAuditEvents();

    await expect(
      activateRuntime("mock-motion-studio", { grantedCapabilities: [] })
    ).rejects.toThrow("status is 'disabled'");

    const events = getWorkspaceAuditEvents();
    expect(events).toHaveLength(3);
    expect(events[0].type).toBe("runtime_activation_requested");
    expect(events[1].type).toBe("runtime_activation_eligibility_checked");
    expect(events[2].type).toBe("runtime_activation_failed");
    expect(events[2].metadata?.reason).toBe("runtime_disabled");
  });

  it("should fail activation if no actions are defined", async () => {
    const emptyActionsManifest = {
      ...mockManifest,
      id: "empty-studio",
    };
    registerRuntimeManifest(emptyActionsManifest, { isDevelopment: true });
    clearWorkspaceAuditEvents();

    await expect(
      activateRuntime("empty-studio", { grantedCapabilities: ["readProject", "writeProject"] })
    ).rejects.toThrow("No action definitions mapped");

    const events = getWorkspaceAuditEvents();
    expect(events).toHaveLength(3);
    expect(events[0].type).toBe("runtime_activation_requested");
    expect(events[1].type).toBe("runtime_activation_eligibility_checked");
    expect(events[2].type).toBe("runtime_activation_failed");
    expect(events[2].metadata?.reason).toBe("no_actions_defined");
  });
});
