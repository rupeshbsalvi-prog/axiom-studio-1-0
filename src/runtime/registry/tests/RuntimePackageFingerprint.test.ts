import { describe, it, expect } from "vitest";
import type { RuntimePackageEnvelope } from "../RuntimePackageEnvelope";
import {
  createRuntimeManifestFingerprint,
  createRuntimePackageFingerprint,
  createRuntimePackageSigningPayload,
} from "../RuntimePackageFingerprint";

describe("RuntimePackageFingerprint", () => {
  const manifest = {
    manifestVersion: "1.0",
    id: "test-rt",
    name: "Test Runtime",
    version: "1.0.0",
    publisher: "Axiom",
    runtimeType: "photo",
    entry: {
      moduleUrl: "/runtime-modules/photo.js",
    },
    capabilities: ["readProject"],
    compatibility: {
      axiomVersion: "1.0.0",
    },
  } as any;

  const envelope: RuntimePackageEnvelope = {
    packageType: "axiom.runtime-package",
    packageVersion: "1.0.0",
    exportedAt: new Date().toISOString(),
    packageId: "pkg-1",
    runtimeId: "test-rt",
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
      manifestFingerprint: "",
    },
  };

  it("calculates deterministic fingerprints", () => {
    const mf1 = createRuntimeManifestFingerprint(manifest);
    const mf2 = createRuntimeManifestFingerprint({ ...manifest });
    expect(mf1).toBe(mf2);

    const pf1 = createRuntimePackageFingerprint(envelope);
    const pf2 = createRuntimePackageFingerprint({
      ...envelope,
      signature: {
        signatureVersion: "1.0.0",
        algorithm: "ECDSA-P256-SHA256",
        keyId: "dev",
        signedAt: new Date().toISOString(),
        signatureBase64Url: "abcdef...",
      },
    });
    expect(pf1).toBe(pf2);
  });
});
