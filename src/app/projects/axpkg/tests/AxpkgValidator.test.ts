import { describe, it, expect } from "vitest";
import { validateAxpkgEnvelope } from "../AxpkgValidator";
import { createProjectDraft } from "../../projectDraft";
import { createAxpkgEnvelope } from "../AxpkgSerializer";

describe("AxpkgValidator", () => {
  it("rejects invalid packageType", () => {
    const invalidEnvelope = {
      packageType: "invalid.type",
      packageVersion: "1.0.0",
      project: createProjectDraft({ name: "T", intent: "T", targetStudioId: "photo" }),
      integrity: { algorithm: "stable-json-cyrb53", projectFingerprint: "123" },
    };

    const diagnostics = validateAxpkgEnvelope(invalidEnvelope);
    const hasTypeError = diagnostics.some((d) => d.code === "invalid_package_type");
    expect(hasTypeError).toBe(true);
  });

  it("rejects unsupported packageVersion", () => {
    const invalidEnvelope = {
      packageType: "axiom.axpkg",
      packageVersion: "2.0.0",
      project: createProjectDraft({ name: "T", intent: "T", targetStudioId: "photo" }),
      integrity: { algorithm: "stable-json-cyrb53", projectFingerprint: "123" },
    };

    const diagnostics = validateAxpkgEnvelope(invalidEnvelope);
    const hasVersionError = diagnostics.some((d) => d.code === "unsupported_package_version");
    expect(hasVersionError).toBe(true);
  });

  it("rejects missing project", () => {
    const invalidEnvelope = {
      packageType: "axiom.axpkg",
      packageVersion: "1.0.0",
      integrity: { algorithm: "stable-json-cyrb53", projectFingerprint: "123" },
    };

    const diagnostics = validateAxpkgEnvelope(invalidEnvelope);
    const hasProjectError = diagnostics.some((d) => d.code === "missing_project");
    expect(hasProjectError).toBe(true);
  });

  it("accepts a valid 0.3.0 project envelope", () => {
    const project = createProjectDraft({ name: "T", intent: "T", targetStudioId: "photo" });
    const envelope = createAxpkgEnvelope(project);

    const diagnostics = validateAxpkgEnvelope(envelope);
    const errors = diagnostics.filter((d) => d.severity === "error");
    expect(errors.length).toBe(0);
  });
});
