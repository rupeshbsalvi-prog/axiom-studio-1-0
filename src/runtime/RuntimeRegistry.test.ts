import { describe, it, expect, beforeEach } from "vitest";
import {
  registerRuntimeManifest,
  disableRuntime,
  enableRuntime,
  getRegistryEntry,
  getRegisteredManifests,
  getAllRegistryEntries,
  clearRuntimeRegistry,
} from "./RuntimeRegistry";
import { type RuntimeManifest } from "./manifest/RuntimeManifestTypes";
import { getWorkspaceAuditEvents, clearWorkspaceAuditEvents } from "../workspace/WorkspaceAuditService";

describe("RuntimeRegistry", () => {
  const getMockManifest = (id: string, signature?: string): RuntimeManifest => ({
    manifestVersion: "1.0",
    id,
    name: `Mock Studio ${id}`,
    version: "1.0.0",
    publisher: "Axiom",
    runtimeType: "studio",
    entry: {
      moduleUrl: "/runtime-modules/mock-studio.js",
      signatureMode: signature ? "signed" : "development",
      signature,
    },
    capabilities: ["readProject", "export"],
    compatibility: {
      axiomVersion: "1.0.0",
      apiVersion: "1",
    },
  });

  beforeEach(() => {
    clearRuntimeRegistry();
    clearWorkspaceAuditEvents();
  });

  it("should successfully register a valid signed manifest", () => {
    const manifest = getMockManifest("studio-a", "valid-sig-123");
    const entry = registerRuntimeManifest(manifest, { isDevelopment: false });

    expect(entry.status).toBe("registered");
    expect(entry.verificationStatus).toBe("trusted");
    expect(getRegisteredManifests()).toHaveLength(1);
    expect(getRegistryEntry("studio-a")).toBeDefined();

    // Verify audit logs
    const logs = getWorkspaceAuditEvents();
    expect(logs.some((l) => l.type === "runtime_manifest_validated")).toBe(true);
    expect(logs.some((l) => l.type === "runtime_manifest_registered")).toBe(true);
  });

  it("should successfully register a dev manifest in dev mode", () => {
    const manifest = getMockManifest("studio-b");
    const entry = registerRuntimeManifest(manifest, { isDevelopment: true });

    expect(entry.status).toBe("registered");
    expect(entry.verificationStatus).toBe("development");
    expect(getRegisteredManifests()).toHaveLength(1);
  });

  it("should reject a dev manifest in production mode", () => {
    const manifest = getMockManifest("studio-c");
    const entry = registerRuntimeManifest(manifest, { isDevelopment: false });

    expect(entry.status).toBe("rejected");
    expect(entry.verificationStatus).toBe("invalid");
    expect(getRegisteredManifests()).toHaveLength(0);

    const logs = getWorkspaceAuditEvents();
    expect(logs.some((l) => l.type === "runtime_manifest_rejected")).toBe(true);
  });

  it("should enforce idempotency when registering an identical manifest twice", () => {
    const manifest = getMockManifest("studio-idempotent", "valid-sig-123");

    // Register 1st time
    const entry1 = registerRuntimeManifest(manifest, { isDevelopment: false });
    const logsAfterFirst = getWorkspaceAuditEvents().length;

    // Register 2nd time
    const entry2 = registerRuntimeManifest(manifest, { isDevelopment: false });
    const logsAfterSecond = getWorkspaceAuditEvents().length;

    expect(entry1).toBe(entry2);
    expect(entry2.status).toBe("registered");
    expect(logsAfterSecond).toBe(logsAfterFirst); // No duplicate events logged
  });

  it("should reject identical ID but changed fingerprint config", () => {
    const manifest1 = getMockManifest("studio-dup", "valid-sig-1");
    const manifest2 = getMockManifest("studio-dup", "valid-sig-2");
    manifest2.version = "1.0.1"; // changed version -> changes fingerprint

    registerRuntimeManifest(manifest1, { isDevelopment: false });
    const entry2 = registerRuntimeManifest(manifest2, { isDevelopment: false });

    expect(entry2.status).toBe("rejected");
    expect(entry2.rejectionReason).toContain("Duplicate runtime ID");
  });

  it("should reject manifest failing schema validation", () => {
    const manifest = getMockManifest("studio-invalid", "valid-sig-1");
    (manifest as any).manifestVersion = "2.0"; // invalid

    const entry = registerRuntimeManifest(manifest, { isDevelopment: false });
    expect(entry.status).toBe("rejected");
    expect(entry.rejectionReason).toContain("Unsupported or missing manifestVersion");
  });

  it("should support disabling and re-enabling runtimes, triggering enabled logs", () => {
    const manifest = getMockManifest("studio-toggle", "valid-sig-1");
    registerRuntimeManifest(manifest, { isDevelopment: false });

    disableRuntime("studio-toggle");
    let entry = getRegistryEntry("studio-toggle")!;
    expect(entry.status).toBe("disabled");
    expect(getRegisteredManifests()).toHaveLength(0);

    let logs = getWorkspaceAuditEvents();
    expect(logs.some((l) => l.type === "runtime_manifest_disabled")).toBe(true);
    expect(logs.some((l) => l.type === "runtime_manifest_enabled")).toBe(false);

    clearWorkspaceAuditEvents();

    enableRuntime("studio-toggle");
    entry = getRegistryEntry("studio-toggle")!;
    expect(entry.status).toBe("registered");
    expect(getRegisteredManifests()).toHaveLength(1);

    logs = getWorkspaceAuditEvents();
    expect(logs.some((l) => l.type === "runtime_manifest_enabled")).toBe(true);
  });

  it("should fetch all registry entries regardless of status", () => {
    const manifest1 = getMockManifest("studio-1", "valid-sig-1");
    const manifest2 = getMockManifest("studio-2", "valid-sig-2");

    registerRuntimeManifest(manifest1, { isDevelopment: false });
    registerRuntimeManifest(manifest2, { isDevelopment: false });
    disableRuntime("studio-1");

    const entries = getAllRegistryEntries();
    expect(entries).toHaveLength(2);
    expect(entries.some((e) => e.manifest.id === "studio-1" && e.status === "disabled")).toBe(true);
    expect(entries.some((e) => e.manifest.id === "studio-2" && e.status === "registered")).toBe(true);
  });
});
