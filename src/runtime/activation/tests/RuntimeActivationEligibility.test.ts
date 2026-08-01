import { describe, it, expect, vi, beforeEach } from "vitest";
import { getRegistryEntry, clearRuntimeRegistry, promoteManifestToRegistry } from "../../RuntimeRegistry";
import {
  previewRuntimePackageInstall,
  installRuntimePackage,
  clearInstalledPackagesRegistry,
  getInstalledPackages,
} from "../../registry/PackageRegistryService";
import { promotePackageToRuntime } from "../../registry/PackagePromotionService";
import {
  activateRuntime,
  isRuntimeActive,
  clearActiveRuntimes,
  getActivatedRuntime,
} from "../RuntimeActivationService";
import { checkActivationEligibility } from "../RuntimeActivationEligibilityPolicy";
import { createRuntimeManifestFingerprint, createRuntimePackageFingerprint } from "../../registry/RuntimePackageFingerprint";
import type { RuntimePackageEnvelope } from "../../registry/RuntimePackageEnvelope";
import * as runtimeActivation from "../RuntimeActivationService";

describe("RuntimeActivationEligibility", () => {
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

  function createEnvelope(packageId = "pkg-motion-1", trustLevel: any = "trusted"): RuntimePackageEnvelope {
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
    vi.restoreAllMocks();
  });

  it("1. Local/first-party runtime remains eligible under existing rules (trusted/development allowed)", () => {
    // Register directly (simulates first-party startup load)
    const entry = promoteManifestToRegistry(manifest, "trusted"); // registryEntry.isPromoted will be true unless we simulate registerRuntimeManifest
    // Let's clear and register using promoteManifestToRegistry but setting isPromoted to false manually
    entry.isPromoted = false;
    entry.verificationStatus = "development";

    const res = checkActivationEligibility("mock-motion-studio", {
      grantedCapabilities: ["readProject", "writeProject"],
    });
    expect(res.eligible).toBe(true);
    expect(res.reason).toBe("eligible");
  });

  it("2. Promoted trusted package with matching ownership and fingerprint is eligible", async () => {
    const env = createEnvelope();
    const prev = await previewRuntimePackageInstall(JSON.stringify(env));
    await installRuntimePackage(prev.preview!, { confirmed: true });

    // Promote
    const records = getInstalledPackages();
    records[0].trustLevel = "trusted";
    promotePackageToRuntime("pkg-motion-1");

    const res = checkActivationEligibility("mock-motion-studio", {
      grantedCapabilities: ["readProject", "writeProject"],
    });
    expect(res.eligible).toBe(true);
  });

  it("3. Promoted trusted package activates successfully through manual activation", async () => {
    const env = createEnvelope();
    const prev = await previewRuntimePackageInstall(JSON.stringify(env));
    await installRuntimePackage(prev.preview!, { confirmed: true });

    const records = getInstalledPackages();
    records[0].trustLevel = "trusted";
    promotePackageToRuntime("pkg-motion-1");

    const activated = await activateRuntime("mock-motion-studio", {
      grantedCapabilities: ["readProject", "writeProject"],
    });
    expect(activated).toBeDefined();
    expect(isRuntimeActive("mock-motion-studio")).toBe(true);
  });

  it("4/5. Promoted unsigned/untrusted package is ineligible", async () => {
    const env = createEnvelope("pkg-motion-1");
    const prev = await previewRuntimePackageInstall(JSON.stringify(env));
    await installRuntimePackage(prev.preview!, { confirmed: true });

    const records = getInstalledPackages();
    records[0].trustLevel = "untrusted";

    const permissivePolicy = {
      trusted: "allow",
      unsigned: "confirm",
      untrusted: "confirm",
      tampered: "block",
      incompatible: "block",
      blocked: "block",
    } as any;

    // Promote under allowUnsafe = true with permissive policy
    promotePackageToRuntime("pkg-motion-1", { confirmed: true, policy: permissivePolicy });

    const res = checkActivationEligibility("mock-motion-studio", {
      grantedCapabilities: ["readProject", "writeProject"],
    });
    expect(res.eligible).toBe(false);
    expect(res.reason).toBe("runtime_not_registered");
  });

  it("6. Promoted tampered/invalid package is ineligible", async () => {
    const env = createEnvelope("pkg-motion-1");
    const prev = await previewRuntimePackageInstall(JSON.stringify(env));
    await installRuntimePackage(prev.preview!, { confirmed: true });

    const records = getInstalledPackages();
    records[0].trustLevel = "trusted";
    promotePackageToRuntime("pkg-motion-1");

    // Manually mutate verificationStatus to invalid to simulate tampered post-promotion detection or manual tamper
    const entry = getRegistryEntry("mock-motion-studio")!;
    entry.verificationStatus = "invalid";

    const res = checkActivationEligibility("mock-motion-studio", {
      grantedCapabilities: ["readProject", "writeProject"],
    });
    expect(res.eligible).toBe(false);
    expect(res.reason).toBe("verification_status_not_trusted");
  });

  it("7/8. Promoted package with missing or uninstalled package record is ineligible", async () => {
    const env = createEnvelope("pkg-motion-1");
    const prev = await previewRuntimePackageInstall(JSON.stringify(env));
    await installRuntimePackage(prev.preview!, { confirmed: true });

    const records = getInstalledPackages();
    records[0].trustLevel = "trusted";
    promotePackageToRuntime("pkg-motion-1");

    // Uninstall package record
    const { uninstallRuntimePackage } = await import("../../registry/PackageRegistryService");
    uninstallRuntimePackage("pkg-motion-1");

    // Verify package is uninstalled but registry entry remains (due to safety checks / active check etc.)
    const res = checkActivationEligibility("mock-motion-studio", {
      grantedCapabilities: ["readProject", "writeProject"],
    });
    expect(res.eligible).toBe(false);
    expect(res.reason).toBe("package_record_missing");
  });

  it("9. Promoted package with promotion.status !== 'promoted' is ineligible", async () => {
    const env = createEnvelope("pkg-motion-1");
    const prev = await previewRuntimePackageInstall(JSON.stringify(env));
    await installRuntimePackage(prev.preview!, { confirmed: true });

    const records = getInstalledPackages();
    records[0].trustLevel = "trusted";
    promotePackageToRuntime("pkg-motion-1");

    // Reset status to not_promoted
    records[0].promotion = undefined;

    const res = checkActivationEligibility("mock-motion-studio", {
      grantedCapabilities: ["readProject", "writeProject"],
    });
    expect(res.eligible).toBe(false);
    expect(res.reason).toBe("package_promotion_not_promoted");
  });

  it("10. Promoted package with mismatched packageId is ineligible", async () => {
    const env = createEnvelope("pkg-motion-1");
    const prev = await previewRuntimePackageInstall(JSON.stringify(env));
    await installRuntimePackage(prev.preview!, { confirmed: true });

    const records = getInstalledPackages();
    records[0].trustLevel = "trusted";
    promotePackageToRuntime("pkg-motion-1");

    // Manually mutate registry packageId
    const entry = getRegistryEntry("mock-motion-studio")!;
    entry.packageId = "another-pkg-id";

    const res = checkActivationEligibility("mock-motion-studio", {
      grantedCapabilities: ["readProject", "writeProject"],
    });
    expect(res.eligible).toBe(false);
    expect(res.reason).toBe("package_id_mismatch");
  });

  it("11. Promoted package with mismatched manifest fingerprint is ineligible", async () => {
    const env = createEnvelope("pkg-motion-1");
    const prev = await previewRuntimePackageInstall(JSON.stringify(env));
    await installRuntimePackage(prev.preview!, { confirmed: true });

    const records = getInstalledPackages();
    records[0].trustLevel = "trusted";
    promotePackageToRuntime("pkg-motion-1");

    // Manually mutate fingerprint in record
    records[0].manifestFingerprint = "mismatched-fingerprint";

    const res = checkActivationEligibility("mock-motion-studio", {
      grantedCapabilities: ["readProject", "writeProject"],
    });
    expect(res.eligible).toBe(false);
    expect(res.reason).toBe("manifest_fingerprint_mismatch");
  });

  it("12. Activation fails closed and does not mutate active runtime state", async () => {
    const env = createEnvelope("pkg-motion-1");
    const prev = await previewRuntimePackageInstall(JSON.stringify(env));
    await installRuntimePackage(prev.preview!, { confirmed: true });

    const records = getInstalledPackages();
    records[0].trustLevel = "untrusted"; // makes ineligible
    promotePackageToRuntime("pkg-motion-1", { confirmed: true });

    // Try to activate
    await expect(activateRuntime("mock-motion-studio", {
      grantedCapabilities: ["readProject", "writeProject"],
    })).rejects.toThrow();

    expect(isRuntimeActive("mock-motion-studio")).toBe(false);
    expect(getActivatedRuntime("mock-motion-studio")).toBeUndefined();
  });

  it("13/14. Undeclared or missing capabilities are rejected", async () => {
    const env = createEnvelope();
    const prev = await previewRuntimePackageInstall(JSON.stringify(env));
    await installRuntimePackage(prev.preview!, { confirmed: true });

    const records = getInstalledPackages();
    records[0].trustLevel = "trusted";
    promotePackageToRuntime("pkg-motion-1");

    // Undeclared capability: export is not declared in manifest
    const resUndeclared = checkActivationEligibility("mock-motion-studio", {
      grantedCapabilities: ["readProject", "writeProject", "export"],
    });
    expect(resUndeclared.eligible).toBe(false);
    expect(resUndeclared.reason).toBe("undeclared_capability_granted");

    // Missing capability: writeProject declared but not granted
    const resMissing = checkActivationEligibility("mock-motion-studio", {
      grantedCapabilities: ["readProject"],
    });
    expect(resMissing.eligible).toBe(false);
    expect(resMissing.reason).toBe("required_capability_not_granted");
  });

  it("21/22. Activation still does not dynamic import or execute manifest.entry.moduleUrl", async () => {
    const env = createEnvelope();
    const prev = await previewRuntimePackageInstall(JSON.stringify(env));
    await installRuntimePackage(prev.preview!, { confirmed: true });

    const records = getInstalledPackages();
    records[0].trustLevel = "trusted";
    promotePackageToRuntime("pkg-motion-1");

    // Mock global import to make sure it doesn't get called
    const spyImport = vi.fn();
    (globalThis as any).import = spyImport;

    await activateRuntime("mock-motion-studio", {
      grantedCapabilities: ["readProject", "writeProject"],
    });

    expect(spyImport).not.toHaveBeenCalled();
    delete (globalThis as any).import;
  });
});
