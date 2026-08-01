import { describe, it, expect } from "vitest";
import { evaluateRuntimePackageTrust } from "../RuntimePackageTrustService";
import { generateRuntimeDevKeyPair, signRuntimeDevPackage } from "../index";
import { createRuntimePackageFingerprint, createRuntimeManifestFingerprint } from "../RuntimePackageFingerprint";
import type { RuntimePackageEnvelope } from "../RuntimePackageEnvelope";
import type { AxpkgTrustPolicy } from "../../../app/projects/axpkg/AxpkgSignatureTypes";

describe("RuntimePackageTrustService", () => {
  const manifest = {
    manifestVersion: "1.0",
    id: "test-rt-trust",
    name: "Test Runtime",
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

  function createBaseEnvelope(): RuntimePackageEnvelope {
    const env: RuntimePackageEnvelope = {
      packageType: "axiom.runtime-package",
      packageVersion: "1.0.0",
      exportedAt: new Date().toISOString(),
      packageId: "pkg-trust",
      runtimeId: "test-rt-trust",
      name: "Test Package",
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

  it("identifies tampered fingerprint mismatch before signature verification", async () => {
    const envelope = createBaseEnvelope();
    envelope.integrity.packageFingerprint = "corrupted-fingerprint";

    const result = await evaluateRuntimePackageTrust({ envelope });
    expect(result.level).toBe("tampered");
    expect(result.diagnostics.some((d: any) => d.code === "tampered_package_blocked")).toBe(true);
  });

  it("identifies unsigned envelope as unsigned trust status", async () => {
    const envelope = createBaseEnvelope();

    const result = await evaluateRuntimePackageTrust({ envelope });
    expect(result.level).toBe("unsigned");
    expect(result.requiresUserConfirmation).toBe(true);
    expect(result.diagnostics.some((d: any) => d.code === "unsigned_package_requires_confirmation")).toBe(true);
  });

  it("validates trusted signer successfully using Web Crypto P-256", async () => {
    const envelope = createBaseEnvelope();
    const keyPair = await generateRuntimeDevKeyPair();

    const signed = (await signRuntimeDevPackage({
      envelope: envelope as any,
      privateKey: keyPair.privateKey,
      keyId: "trusted-signer-id",
    })) as unknown as RuntimePackageEnvelope;

    const policy: AxpkgTrustPolicy = {
      allowUnsignedPackages: true,
      allowUnknownSignersWithWarning: true,
      trustedKeys: [
        {
          keyId: "trusted-signer-id",
          label: "Enterprise Publisher",
          algorithm: "ECDSA-P256-SHA256",
          publicKeyJwk: keyPair.publicKeyJwk,
          enabled: true,
        },
      ],
      blockedKeyIds: [],
    };

    const result = await evaluateRuntimePackageTrust({ envelope: signed, policy });
    expect(result.level).toBe("trusted");
    expect(result.trusted).toBe(true);
    expect(result.signer?.label).toBe("Enterprise Publisher");
    expect(result.diagnostics.some((d: any) => d.code === "trusted_package")).toBe(true);
  });
});
