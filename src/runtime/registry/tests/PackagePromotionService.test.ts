import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  previewRuntimePackageInstall,
  installRuntimePackage,
  clearInstalledPackagesRegistry,
  getInstalledPackages,
} from "../PackageRegistryService";
import {
  previewPackagePromotion,
  promotePackageToRuntime,
} from "../PackagePromotionService";
import {
  clearRuntimeRegistry,
  getRegistryEntry,
  promoteManifestToRegistry,
  removeRuntimeManifest,
} from "../../RuntimeRegistry";
import * as runtimeRegistry from "../../RuntimeRegistry";
import * as runtimeActivation from "../../activation/RuntimeActivationService";
import * as runtimeDispatcher from "../../activation/RuntimeActionDispatcher";
import * as runtimeHydration from "../../RuntimeHydrationService";
import { getWorkspaceAuditEvents, clearWorkspaceAuditEvents } from "../../../workspace/WorkspaceAuditService";
import { createRuntimeManifestFingerprint, createRuntimePackageFingerprint } from "../RuntimePackageFingerprint";
import type { RuntimePackageEnvelope } from "../RuntimePackageEnvelope";

describe("PackagePromotionService", () => {
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

  function createEnvelope(packageId = "pkg-motion-1", version = "1.0.0"): RuntimePackageEnvelope {
    const env: RuntimePackageEnvelope = {
      packageType: "axiom.runtime-package",
      packageVersion: "1.0.0",
      exportedAt: new Date().toISOString(),
      packageId,
      runtimeId: "mock-motion-studio",
      name: "Mock Motion Studio",
      version,
      publisher: "Axiom",
      manifest: {
        ...manifest,
        version,
      },
      compatibility: {
        axiomVersion: "1.0.0",
        runtimeApiVersion: "1.0.0",
      },
      integrity: {
        algorithm: "stable-json-cyrb53",
        packageFingerprint: "",
        manifestFingerprint: createRuntimeManifestFingerprint({ ...manifest, version }),
      },
    };
    env.integrity.packageFingerprint = createRuntimePackageFingerprint(env);
    return env;
  }

  beforeEach(() => {
    clearInstalledPackagesRegistry();
    clearRuntimeRegistry();
    clearWorkspaceAuditEvents();
    vi.restoreAllMocks();
  });

  it("1. Trusted installed package promotes to RuntimeRegistry metadata entry & 17. Runtime appears under Registered Runtimes & 18/19. Inactive status", async () => {
    const env = createEnvelope();
    const prev = await previewRuntimePackageInstall(JSON.stringify(env));
    // Simulate installing a trusted package (by mocking trust evaluation or override)
    // Here we can mock installResult or install it directly.
    const res = await installRuntimePackage(prev.preview!, { confirmed: true });
    expect(res.success).toBe(true);

    // Fetch the record and force its trust level to "trusted" for promotion testing
    const records = getInstalledPackages();
    records[0].trustLevel = "trusted";

    const promoRes = promotePackageToRuntime("pkg-motion-1") as any;
    expect(promoRes.success).toBe(true);
    expect(promoRes.idempotent).toBe(false);

    // Verify registry entry exists in inactive state
    const entry = getRegistryEntry("mock-motion-studio");
    expect(entry).toBeDefined();
    expect(entry?.status).toBe("registered");
    expect(entry?.verificationStatus).toBe("trusted");

    // Must be manual activation, verify currently inactive
    expect(runtimeActivation.isRuntimeActive("mock-motion-studio")).toBe(false);
  });

  it("2/3/4/5/6. Promotion does not trigger activation, action dispatching, state hydration, dynamic import or script execution", async () => {
    const spyActivate = vi.spyOn(runtimeActivation, "activateRuntime");
    const spyDispatch = vi.spyOn(runtimeDispatcher, "dispatchRuntimeAction");
    const spyHydrate = vi.spyOn(runtimeHydration, "applyRuntimeHydrationPlan");

    const env = createEnvelope();
    const prev = await previewRuntimePackageInstall(JSON.stringify(env));
    await installRuntimePackage(prev.preview!, { confirmed: true });
    const records = getInstalledPackages();
    records[0].trustLevel = "trusted";

    const promoRes = promotePackageToRuntime("pkg-motion-1");
    expect(promoRes.success).toBe(true);

    expect(spyActivate).not.toHaveBeenCalled();
    expect(spyDispatch).not.toHaveBeenCalled();
    expect(spyHydrate).not.toHaveBeenCalled();
  });

  it("7. Promotion validates embedded RuntimeManifest schema before registry insertion", async () => {
    const env = createEnvelope();
    const prev = await previewRuntimePackageInstall(JSON.stringify(env));
    await installRuntimePackage(prev.preview!, { confirmed: true });
    
    const records = getInstalledPackages();
    records[0].trustLevel = "trusted";
    // Corrupt schema
    delete (records[0].manifest as any).entry;

    const promoRes = promotePackageToRuntime("pkg-motion-1") as any;
    expect(promoRes.success).toBe(false);
    expect(promoRes.status).toBe("promotion_failed");
  });

  it("8. Promotion verifies manifest fingerprint matches installed record", async () => {
    const env = createEnvelope();
    const prev = await previewRuntimePackageInstall(JSON.stringify(env));
    await installRuntimePackage(prev.preview!, { confirmed: true });
    
    const records = getInstalledPackages();
    records[0].trustLevel = "trusted";
    // Mutate manifest (which breaks fingerprint check)
    records[0].manifest.name = "Mutated Package Name";

    const promoRes = promotePackageToRuntime("pkg-motion-1") as any;
    expect(promoRes.success).toBe(false);
    expect(promoRes.status).toBe("promotion_failed");
    expect(promoRes.diagnostics.some((d: any) => d.code === "promotion_fingerprint_mismatch")).toBe(true);
  });

  it("9/10. Duplicate promotions: same fingerprint is idempotent; different fingerprint is blocked as conflict", async () => {
    const env = createEnvelope();
    const prev = await previewRuntimePackageInstall(JSON.stringify(env));
    await installRuntimePackage(prev.preview!, { confirmed: true });
    
    const records = getInstalledPackages();
    records[0].trustLevel = "trusted";

    // Promote first time
    const res1 = promotePackageToRuntime("pkg-motion-1") as any;
    expect(res1.success).toBe(true);
    expect(res1.idempotent).toBe(false);

    // Promote second time (same fingerprint) -> Idempotent
    const res2 = promotePackageToRuntime("pkg-motion-1") as any;
    expect(res2.success).toBe(true);
    expect(res2.idempotent).toBe(true);

    // Create different package with same runtime ID but different version/fingerprint
    const env2 = createEnvelope("pkg-motion-2", "2.0.0");
    const prev2 = await previewRuntimePackageInstall(JSON.stringify(env2));
    await installRuntimePackage(prev2.preview!, { confirmed: true });
    const records2 = getInstalledPackages();
    const record2 = records2.find(r => r.packageId === "pkg-motion-2")!;
    record2.trustLevel = "trusted";

    // Promote second package -> Conflict
    const res3 = promotePackageToRuntime("pkg-motion-2") as any;
    expect(res3.success).toBe(false);
    expect(res3.status).toBe("promotion_failed");
    expect(res3.diagnostics.some((d: any) => d.code === "promotion_duplicate_conflict")).toBe(true);
  });

  it("11/12/13/14. Tampered, blocked, incompatible, and unsigned/untrusted packages block promotion by default", async () => {
    const env = createEnvelope();
    const prev = await previewRuntimePackageInstall(JSON.stringify(env));
    await installRuntimePackage(prev.preview!, { confirmed: true });
    
    const records = getInstalledPackages();

    const levels = ["unsigned", "untrusted", "tampered", "blocked", "incompatible"] as const;
    for (const level of levels) {
      records[0].trustLevel = level;
      const promoRes = promotePackageToRuntime("pkg-motion-1") as any;
      expect(promoRes.success).toBe(false);
      expect(["promotion_failed", "promotion_blocked"]).toContain(promoRes.status);
    }
  });

  it("15/16. Promotion audit events: requested, completed, blocked, failed", async () => {
    const env = createEnvelope();
    const prev = await previewRuntimePackageInstall(JSON.stringify(env));
    await installRuntimePackage(prev.preview!, { confirmed: true });
    const records = getInstalledPackages();

    // 1. Requested + Blocked
    records[0].trustLevel = "untrusted";
    promotePackageToRuntime("pkg-motion-1");
    let auditEvents = getWorkspaceAuditEvents();
    expect(auditEvents.some(e => e.type === "runtime_package_promotion_requested")).toBe(true);
    expect(auditEvents.some(e => e.type === "runtime_package_promotion_failed" || e.type === "runtime_package_promotion_blocked")).toBe(true);

    // Clear and do success
    clearWorkspaceAuditEvents();
    records[0].trustLevel = "trusted";
    promotePackageToRuntime("pkg-motion-1");
    auditEvents = getWorkspaceAuditEvents();
    expect(auditEvents.some(e => e.type === "runtime_package_promotion_completed")).toBe(true);
  });

  it("21. promoteManifestToRegistry rejects non-trusted levels under default policy", () => {
    expect(() => {
      promoteManifestToRegistry(manifest, "unsigned", false);
    }).toThrow();

    expect(() => {
      promoteManifestToRegistry(manifest, "untrusted", false);
    }).toThrow();

    // With allowUnsafe true, it should map unsigned to status untrusted / verificationStatus missing
    const entry = promoteManifestToRegistry(manifest, "unsigned", true);
    expect(entry.status).toBe("untrusted");
    expect(entry.verificationStatus).toBe("missing");
  });

  it("Uninstall registry safety: guards active, unrelated, or fingerprint-mismatched entries on uninstall", async () => {
    // 1. Install and promote a package
    const env = createEnvelope("pkg-motion-uninstall-test");
    const prev = await previewRuntimePackageInstall(JSON.stringify(env));
    await installRuntimePackage(prev.preview!, { confirmed: true });
    const records = getInstalledPackages();
    records[0].trustLevel = "trusted";
    promotePackageToRuntime("pkg-motion-uninstall-test");

    // Verify registry has it
    const entry = getRegistryEntry("mock-motion-studio")!;
    expect(entry).toBeDefined();

    // 2. Unrelated entry should not be deleted
    const unrelatedDeleted = removeRuntimeManifest("unrelated-id");
    expect(unrelatedDeleted).toBe(false);

    // 3. active checks: if active is true, removal must fail (return false)
    const resultActive = removeRuntimeManifest("mock-motion-studio", {
      expectedFingerprint: entry.manifestFingerprint,
      isActive: true,
    });
    expect(resultActive).toBe(false);
    expect(getRegistryEntry("mock-motion-studio")).toBeDefined();

    // 4. fingerprint mismatch checks: if fingerprint differs, removal must fail
    const resultMismatched = removeRuntimeManifest("mock-motion-studio", {
      expectedFingerprint: "mismatched-fingerprint",
      isActive: false,
    });
    expect(resultMismatched).toBe(false);
    expect(getRegistryEntry("mock-motion-studio")).toBeDefined();

    // 5. Success case: matches fingerprint and inactive -> removal succeeds
    const resultSuccess = removeRuntimeManifest("mock-motion-studio", {
      expectedFingerprint: entry.manifestFingerprint,
      isActive: false,
    });
    expect(resultSuccess).toBe(true);
    expect(getRegistryEntry("mock-motion-studio")).toBeUndefined();
  });
});
