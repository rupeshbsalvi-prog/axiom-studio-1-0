import { describe, it, expect, beforeEach } from "vitest";
import {
  clearRuntimeRegistry,
  getRegistryEntry,
  promoteManifestToRegistry,
} from "../RuntimeRegistry";

describe("RuntimeRegistryPromotion", () => {
  const manifest = {
    manifestVersion: "1.0",
    id: "promo-test-plugin",
    name: "Promotion Test Plugin",
    version: "1.2.3",
    publisher: "Axiom",
    runtimeType: "studio",
    entry: {
      moduleUrl: "/runtime-modules/promo-test.js",
    },
    capabilities: ["readProject"],
    compatibility: {
      axiomVersion: "1.0.0",
      apiVersion: "1.0.0",
    },
  } as any;

  beforeEach(() => {
    clearRuntimeRegistry();
  });

  it("promoteManifestToRegistry enforces manifest validation", () => {
    const invalidManifest = { ...manifest, id: "" };
    expect(() => {
      promoteManifestToRegistry(invalidManifest, "trusted");
    }).toThrow();
  });

  it("promoteManifestToRegistry blocks unsigned/untrusted promotions without explicit flag", () => {
    expect(() => {
      promoteManifestToRegistry(manifest, "unsigned");
    }).toThrow();

    expect(() => {
      promoteManifestToRegistry(manifest, "untrusted");
    }).toThrow();
  });

  it("promoteManifestToRegistry registers trusted manifests and maps trust level to verificationStatus", () => {
    const entry = promoteManifestToRegistry(manifest, "trusted");
    expect(entry.status).toBe("registered");
    expect(entry.verificationStatus).toBe("trusted");

    const retrieved = getRegistryEntry("promo-test-plugin");
    expect(retrieved).toBeDefined();
    expect(retrieved?.manifest.id).toBe("promo-test-plugin");
  });

  it("promoteManifestToRegistry allows unsigned/untrusted with allowUnsafe flag and maps to status untrusted", () => {
    const unsignedEntry = promoteManifestToRegistry(manifest, "unsigned", true);
    expect(unsignedEntry.status).toBe("untrusted");
    expect(unsignedEntry.verificationStatus).toBe("missing");

    clearRuntimeRegistry();

    const untrustedEntry = promoteManifestToRegistry(manifest, "untrusted", true);
    expect(untrustedEntry.status).toBe("untrusted");
    expect(untrustedEntry.verificationStatus).toBe("untrusted");
  });

  it("promoteManifestToRegistry rejects duplicate conflicting manifests but permits identical configurations", () => {
    const entry1 = promoteManifestToRegistry(manifest, "trusted");
    const entry2 = promoteManifestToRegistry(manifest, "trusted");
    expect(entry1).toBe(entry2); // Identical (idempotent)

    const conflictingManifest = { ...manifest, version: "2.0.0" };
    expect(() => {
      promoteManifestToRegistry(conflictingManifest, "trusted");
    }).toThrow(/conflict/i);
  });
});
