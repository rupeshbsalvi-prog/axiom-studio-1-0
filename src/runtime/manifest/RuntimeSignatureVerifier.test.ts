import { describe, it, expect } from "vitest";
import { verifyRuntimeSignature } from "./RuntimeSignatureVerifier";
import { type RuntimeManifest } from "./RuntimeManifestTypes";

describe("RuntimeSignatureVerifier", () => {
  const getMockManifest = (mode: "signed" | "development", signature?: string): RuntimeManifest => ({
    manifestVersion: "1.0",
    id: "mock-studio",
    name: "Mock Studio",
    version: "1.0.0",
    publisher: "Axiom",
    runtimeType: "studio",
    entry: {
      moduleUrl: "/runtime-modules/mock-studio.js",
      signatureMode: mode,
      signature,
    },
    capabilities: ["readProject"],
    compatibility: {
      axiomVersion: "1.0.0",
      apiVersion: "1",
    },
  });

  it("should allow development mode in dev environment", () => {
    const manifest = getMockManifest("development");
    const result = verifyRuntimeSignature(manifest, { isDevelopment: true });
    expect(result.status).toBe("development");
  });

  it("should reject development mode in production environment", () => {
    const manifest = getMockManifest("development");
    const result = verifyRuntimeSignature(manifest, { isDevelopment: false });
    expect(result.status).toBe("invalid");
    expect(result.reason).toContain("Development mode signature is not allowed in production");
  });

  it("should verify valid signature as trusted", () => {
    const manifest = getMockManifest("signed", "valid-sig-12345");
    const result = verifyRuntimeSignature(manifest, { isDevelopment: false });
    expect(result.status).toBe("trusted");
  });

  it("should reject invalid signature as invalid", () => {
    const manifest = getMockManifest("signed", "invalid-sig-54321");
    const result = verifyRuntimeSignature(manifest, { isDevelopment: false });
    expect(result.status).toBe("invalid");
    expect(result.reason).toContain("Invalid manifest signature");
  });

  it("should report missing signature when required", () => {
    const manifest = getMockManifest("signed");
    const result = verifyRuntimeSignature(manifest, { isDevelopment: false });
    expect(result.status).toBe("missing");
    expect(result.reason).toContain("Manifest signature is required but missing");
  });

  it("should handle unknown signature mode as untrusted", () => {
    const manifest = getMockManifest("signed");
    manifest.entry.signatureMode = "unknown-mode" as any;
    const result = verifyRuntimeSignature(manifest, { isDevelopment: false });
    expect(result.status).toBe("untrusted");
    expect(result.reason).toContain("Unsupported signature mode");
  });
});
