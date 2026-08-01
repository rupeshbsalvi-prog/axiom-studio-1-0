import { describe, it, expect } from "vitest";
import { validateRuntimePackageEnvelope } from "../RuntimePackageValidator";

describe("RuntimePackageValidator", () => {
  it("rejects non-object package envelope candidate structures", () => {
    const result = validateRuntimePackageEnvelope(null);
    expect(result.some((d) => d.code === "package_parse_failed")).toBe(true);
  });

  it("checks envelope headers, incompatible versions, and missing manifests", () => {
    const candidate = {
      packageType: "axiom.runtime-package-wrong",
      packageVersion: "2.0.0",
      packageId: "pkg-1",
      runtimeId: "rt-1",
      // missing name, version, publisher, manifest, etc.
    };

    const diagnostics = validateRuntimePackageEnvelope(candidate);
    const codes = diagnostics.map((d) => d.code);

    expect(codes).toContain("invalid_runtime_package");
    expect(codes).toContain("incompatible_package");
    expect(codes).toContain("invalid_runtime_package");
  });
});
