import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  previewRuntimePackageInstall,
  installRuntimePackage,
  uninstallRuntimePackage,
  getInstalledPackages,
  clearInstalledPackagesRegistry,
} from "../PackageRegistryService";
import { generateRuntimeDevKeyPair, signRuntimeDevPackage } from "../index";
import { createRuntimePackageFingerprint, createRuntimeManifestFingerprint } from "../RuntimePackageFingerprint";
import type { RuntimePackageEnvelope } from "../RuntimePackageEnvelope";
import type { AxpkgTrustPolicy } from "../../../app/projects/axpkg/AxpkgSignatureTypes";

// Mock runtime side-effect targets to spy on
import * as runtimeRegistry from "../../RuntimeRegistry";
import * as runtimeActivation from "../../activation/RuntimeActivationService";
import * as runtimeDispatcher from "../../activation/RuntimeActionDispatcher";
import * as manifestLoader from "../../manifest/LocalRuntimeManifestLoader";

describe("PackageRegistryService", () => {
  const manifest = {
    manifestVersion: "1.0",
    id: "test-plugin-registry",
    name: "Registry Test Plugin",
    version: "1.0.0",
    publisher: "Axiom",
    runtimeType: "studio",
    entry: {
      moduleUrl: "/runtime-modules/photo.js",
    },
    capabilities: ["readProject"],
    compatibility: {
      axiomVersion: "1.0.0",
      apiVersion: "1.0.0",
    },
  } as any;

  function createEnvelope(packageId = "pkg-registry-1", version = "1.0.0"): RuntimePackageEnvelope {
    const env: RuntimePackageEnvelope = {
      packageType: "axiom.runtime-package",
      packageVersion: "1.0.0",
      exportedAt: new Date().toISOString(),
      packageId,
      runtimeId: "test-plugin-registry",
      name: "Registry Test Plugin",
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
    vi.restoreAllMocks();
  });

  it("Preview does not mutate registry or call registration side-effects", async () => {
    const spyRegister = vi.spyOn(runtimeRegistry, "registerRuntimeManifest");
    const envelope = createEnvelope();
    const raw = JSON.stringify(envelope);

    const prevResult = await previewRuntimePackageInstall(raw);
    expect(prevResult.success).toBe(true);
    expect(getInstalledPackages().length).toBe(0);
    expect(spyRegister).not.toHaveBeenCalled();
  });

  it("Install does not invoke runtime registry registration or execution code", async () => {
    const spyRegister = vi.spyOn(runtimeRegistry, "registerRuntimeManifest");
    const spyActivate = vi.spyOn(runtimeActivation, "activateRuntime");
    const spyDispatch = vi.spyOn(runtimeDispatcher, "dispatchRuntimeAction");
    const spyLoader = vi.spyOn(manifestLoader, "loadLocalManifests");

    const envelope = createEnvelope();
    const raw = JSON.stringify(envelope);

    const prevResult = await previewRuntimePackageInstall(raw);
    expect(prevResult.success).toBe(true);

    const installResult = await installRuntimePackage(prevResult.preview!, { confirmed: true });
    expect(installResult.success).toBe(true);

    // Verify metadata registry stores correctly
    expect(getInstalledPackages().length).toBe(1);
    expect(getInstalledPackages()[0].packageId).toBe("pkg-registry-1");

    // Side effects checking
    expect(spyRegister).not.toHaveBeenCalled();
    expect(spyActivate).not.toHaveBeenCalled();
    expect(spyDispatch).not.toHaveBeenCalled();
    expect(spyLoader).not.toHaveBeenCalled();

    // Verify diagnostics audit
    const diagnostics = installResult.diagnostics;
    expect(diagnostics.some((d) => d.code === "no_execution_performed")).toBe(true);
    expect(diagnostics.some((d) => d.code === "install_success")).toBe(true);
  });

  it("Unsigned packages require explicit user confirmation to install", async () => {
    const envelope = createEnvelope();
    const raw = JSON.stringify(envelope);

    const prev = await previewRuntimePackageInstall(raw);
    expect(prev.preview?.requiresConfirmation).toBe(true);

    // Try installing without confirmed flag
    const res1 = (await installRuntimePackage(prev.preview!)) as any;
    expect(res1.success).toBe(false);
    expect(res1.status).toBe("pending_confirmation");
    expect(getInstalledPackages().length).toBe(0);

    // Try installing with confirmed flag
    const res2 = (await installRuntimePackage(prev.preview!, { confirmed: true })) as any;
    expect(res2.success).toBe(true);
    expect(res2.record.status).toBe("installed");
    expect(getInstalledPackages().length).toBe(1);
  });

  it("Untrusted key ID packages require confirmation to install", async () => {
    const envelope = createEnvelope();
    const keyPair = await generateRuntimeDevKeyPair();
    const signed = await signRuntimeDevPackage({
      envelope: envelope as any,
      privateKey: keyPair.privateKey,
      keyId: "unknown-signer-key",
    });

    const prev = await previewRuntimePackageInstall(JSON.stringify(signed));
    expect(prev.preview?.trustLevel).toBe("untrusted");
    expect(prev.preview?.requiresConfirmation).toBe(true);

    const res = (await installRuntimePackage(prev.preview!)) as any;
    expect(res.success).toBe(false);
    expect(res.status).toBe("pending_confirmation");
  });

  it("Tampered fingerprint packages are blocked from installation", async () => {
    const envelope = createEnvelope();
    envelope.integrity.packageFingerprint = "incorrect-hash";

    const prev = await previewRuntimePackageInstall(JSON.stringify(envelope));
    // Since envelope has invalid fingerprint, validator or trust check will catch it as error.
    expect(prev.success).toBe(true);
    expect(prev.preview?.trustLevel).toBe("tampered");
    expect(prev.preview?.canInstall).toBe(false);

    const res = (await installRuntimePackage(prev.preview!)) as any;
    expect(res.success).toBe(false);
    expect(res.status).toBe("blocked");
  });

  it("Duplicate versions are rejected and different versions block upgrades", async () => {
    const envelopeV1 = createEnvelope("duplicate-pkg", "1.0.0");
    const envelopeV1Copy = createEnvelope("duplicate-pkg", "1.0.0");
    const envelopeV2 = createEnvelope("duplicate-pkg", "2.0.0");

    // Install V1
    const p1 = await previewRuntimePackageInstall(JSON.stringify(envelopeV1));
    const r1 = await installRuntimePackage(p1.preview!, { confirmed: true });
    expect(r1.success).toBe(true);

    // Try installing same version duplicate
    const p1c = await previewRuntimePackageInstall(JSON.stringify(envelopeV1Copy));
    const r1c = await installRuntimePackage(p1c.preview!, { confirmed: true });
    expect(r1c.success).toBe(false);
    expect(r1c.diagnostics.some((d) => d.code === "duplicate_package_version")).toBe(true);

    // Try installing a different version (upgrade)
    const p2 = await previewRuntimePackageInstall(JSON.stringify(envelopeV2));
    const r2 = await installRuntimePackage(p2.preview!, { confirmed: true });
    expect(r2.success).toBe(false);
    expect(r2.diagnostics.some((d) => d.code === "upgrade_not_supported_yet")).toBe(true);
  });

  it("Uninstall removes the package metadata record", async () => {
    const envelope = createEnvelope("uninstall-pkg");
    const p = await previewRuntimePackageInstall(JSON.stringify(envelope));
    const r = await installRuntimePackage(p.preview!, { confirmed: true });
    expect(r.success).toBe(true);
    expect(getInstalledPackages().length).toBe(1);

    const un = uninstallRuntimePackage("uninstall-pkg");
    expect(un.success).toBe(true);
    expect(getInstalledPackages().length).toBe(0);
  });
});
