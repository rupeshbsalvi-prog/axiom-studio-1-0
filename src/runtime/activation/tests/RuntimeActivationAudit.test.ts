import { describe, it, expect, vi, beforeEach } from "vitest";
import { getRegistryEntry, clearRuntimeRegistry } from "../../RuntimeRegistry";
import {
  previewRuntimePackageInstall,
  installRuntimePackage,
  clearInstalledPackagesRegistry,
  getInstalledPackages,
} from "../../registry/PackageRegistryService";
import { promotePackageToRuntime } from "../../registry/PackagePromotionService";
import {
  activateRuntime,
  clearActiveRuntimes,
} from "../RuntimeActivationService";
import { checkActivationEligibility } from "../RuntimeActivationEligibilityPolicy";
import { createRuntimeManifestFingerprint, createRuntimePackageFingerprint } from "../../registry/RuntimePackageFingerprint";
import type { RuntimePackageEnvelope } from "../../registry/RuntimePackageEnvelope";
import { getWorkspaceAuditEvents, clearWorkspaceAuditEvents } from "../../../workspace/WorkspaceAuditService";

describe("RuntimeActivationAudit", () => {
  const manifest = {
    manifestVersion: "1.0",
    id: "mock-motion-studio",
    name: "Mock Motion Studio",
    version: "1.0.0",
    publisher: "Axiom",
    runtimeType: "studio",
    entry: {
      moduleUrl: "/runtime-modules/motion.js",
    },
    capabilities: ["readProject", "writeProject"],
    compatibility: {
      axiomVersion: "1.0.0",
      apiVersion: "1.0.0",
    },
  } as any;

  function createEnvelope(packageId = "pkg-motion-1"): RuntimePackageEnvelope {
    const env: RuntimePackageEnvelope = {
      packageType: "axiom.runtime-package",
      packageVersion: "1.0.0",
      exportedAt: new Date().toISOString(),
      packageId,
      runtimeId: "mock-motion-studio",
      name: "Mock Motion Studio",
      version: "1.0.0",
      publisher: "Axiom",
      manifest,
      compatibility: {
        axiomVersion: "1.0.0",
        runtimeApiVersion: "1.0.0",
      },
      integrity: {
        algorithm: "stable-json-cyrb53",
        packageFingerprint: "",
        manifestFingerprint: createRuntimeManifestFingerprint(manifest),
      },
    };
    env.integrity.packageFingerprint = createRuntimePackageFingerprint(env);
    return env;
  }

  beforeEach(() => {
    clearInstalledPackagesRegistry();
    clearRuntimeRegistry();
    clearActiveRuntimes();
    clearWorkspaceAuditEvents();
    vi.restoreAllMocks();
  });

  it("16. checkActivationEligibility does not emit audit events", async () => {
    const env = createEnvelope();
    const prev = await previewRuntimePackageInstall(JSON.stringify(env));
    await installRuntimePackage(prev.preview!, { confirmed: true });

    const records = getInstalledPackages();
    records[0].trustLevel = "trusted";
    promotePackageToRuntime("pkg-motion-1");

    clearWorkspaceAuditEvents();

    // Call pure eligibility check directly
    checkActivationEligibility("mock-motion-studio", {
      grantedCapabilities: ["readProject", "writeProject"],
    });

    const events = getWorkspaceAuditEvents();
    expect(events.length).toBe(0);
  });

  it("18/20. activateRuntime emits runtime_activation_eligibility_checked and success events", async () => {
    const env = createEnvelope();
    const prev = await previewRuntimePackageInstall(JSON.stringify(env));
    await installRuntimePackage(prev.preview!, { confirmed: true });

    const records = getInstalledPackages();
    records[0].trustLevel = "trusted";
    promotePackageToRuntime("pkg-motion-1");

    clearWorkspaceAuditEvents();

    await activateRuntime("mock-motion-studio", {
      grantedCapabilities: ["readProject", "writeProject"],
    });

    const events = getWorkspaceAuditEvents();
    expect(events.some((e) => e.type === "runtime_activation_eligibility_checked")).toBe(true);
    expect(events.some((e) => e.type === "runtime_activation_completed")).toBe(true);
  });

  it("19. Failed activation emits runtime_activation_failed and eligibility checked failure events", async () => {
    const env = createEnvelope();
    const prev = await previewRuntimePackageInstall(JSON.stringify(env));
    await installRuntimePackage(prev.preview!, { confirmed: true });

    const records = getInstalledPackages();
    records[0].trustLevel = "untrusted"; // ineligible
    promotePackageToRuntime("pkg-motion-1", { confirmed: true });

    clearWorkspaceAuditEvents();

    await expect(
      activateRuntime("mock-motion-studio", {
        grantedCapabilities: ["readProject", "writeProject"],
      })
    ).rejects.toThrow();

    const events = getWorkspaceAuditEvents();
    expect(events.some((e) => e.type === "runtime_activation_eligibility_checked")).toBe(true);
    expect(events.some((e) => e.type === "runtime_activation_failed")).toBe(true);
  });
});
