import { describe, it, expect } from "vitest";
import { validateRuntimeManifest } from "./RuntimeManifestValidator";

describe("RuntimeManifestValidator", () => {
  const getValidManifest = (): any => ({
    manifestVersion: "1.0",
    id: "mock-studio",
    name: "Mock Studio",
    version: "1.0.0",
    publisher: "Axiom",
    runtimeType: "studio",
    entry: {
      moduleUrl: "/runtime-modules/mock-studio.js",
      signatureMode: "development",
    },
    capabilities: ["readProject", "writeProject"],
    compatibility: {
      axiomVersion: "1.0.0",
      apiVersion: "1",
    },
  });

  it("should validate a correct manifest", () => {
    const manifest = getValidManifest();
    const result = validateRuntimeManifest(manifest);
    expect(result.valid).toBe(true);
    expect(result.error).toBeUndefined();
  });

  it("should reject manifest with incorrect manifestVersion", () => {
    const manifest = getValidManifest();
    manifest.manifestVersion = "2.0";
    const result = validateRuntimeManifest(manifest);
    expect(result.valid).toBe(false);
    expect(result.error).toContain("Unsupported or missing manifestVersion");
  });

  it("should reject when missing required fields", () => {
    const manifest = getValidManifest();
    delete manifest.id;
    const result = validateRuntimeManifest(manifest);
    expect(result.valid).toBe(false);
    expect(result.error).toContain("Missing required field: 'id'");
  });

  it("should reject empty or invalid ids", () => {
    const manifest = getValidManifest();
    manifest.id = "   ";
    const result = validateRuntimeManifest(manifest);
    expect(result.valid).toBe(false);
    expect(result.error).toContain("Field 'id' must be a non-empty string");
  });

  it("should reject unsupported runtimeType", () => {
    const manifest = getValidManifest();
    manifest.runtimeType = "invalid-type";
    const result = validateRuntimeManifest(manifest);
    expect(result.valid).toBe(false);
    expect(result.error).toContain("Invalid runtimeType");
  });

  it("should reject remote or protocol-based moduleUrl", () => {
    const manifest = getValidManifest();
    
    // HTTP
    manifest.entry.moduleUrl = "http://example.com/plugin.js";
    expect(validateRuntimeManifest(manifest).valid).toBe(false);

    // HTTPS
    manifest.entry.moduleUrl = "https://example.com/plugin.js";
    expect(validateRuntimeManifest(manifest).valid).toBe(false);

    // Data URI
    manifest.entry.moduleUrl = "data:text/javascript,console.log('unsafe')";
    expect(validateRuntimeManifest(manifest).valid).toBe(false);
  });

  it("should reject moduleUrl path traversal", () => {
    const manifest = getValidManifest();
    manifest.entry.moduleUrl = "/runtime-modules/../../unsafe.js";
    const result = validateRuntimeManifest(manifest);
    expect(result.valid).toBe(false);
    expect(result.error).toContain("path traversal is prohibited");
  });

  it("should reject unknown moduleUrl prefixes", () => {
    const manifest = getValidManifest();
    manifest.entry.moduleUrl = "/public/mock-studio.js";
    const result = validateRuntimeManifest(manifest);
    expect(result.valid).toBe(false);
    expect(result.error).toContain("Unsafe or absolute entry.moduleUrl");
  });

  it("should reject unsupported capabilities", () => {
    const manifest = getValidManifest();
    manifest.capabilities.push("unsafeCapability");
    const result = validateRuntimeManifest(manifest);
    expect(result.valid).toBe(false);
    expect(result.error).toContain("Unsupported capability");
  });
});
