import type { AxpkgImportDiagnostic } from "./AxpkgTypes";

export function validateAxpkgEnvelope(candidate: unknown): AxpkgImportDiagnostic[] {
  const diagnostics: AxpkgImportDiagnostic[] = [];

  if (!candidate || typeof candidate !== "object" || Array.isArray(candidate)) {
    diagnostics.push({
      severity: "error",
      code: "invalid_json",
      message: "The imported file is not a valid JSON object.",
    });
    return diagnostics;
  }

  const envelope = candidate as Record<string, unknown>;

  if (envelope.packageType !== "axiom.axpkg") {
    diagnostics.push({
      severity: "error",
      code: "invalid_package_type",
      message: `Unsupported package type: '${envelope.packageType || "none"}'. Expected 'axiom.axpkg'.`,
      path: "packageType",
    });
  }

  if (envelope.packageVersion !== "1.0.0" && envelope.packageVersion !== "1.1.0") {
    diagnostics.push({
      severity: "error",
      code: "unsupported_package_version",
      message: `Unsupported package version: '${envelope.packageVersion || "none"}'. Expected '1.0.0' or '1.1.0'.`,
      path: "packageVersion",
    });
  }

  const project = envelope.project as Record<string, unknown> | undefined;
  if (!project || typeof project !== "object" || Array.isArray(project)) {
    diagnostics.push({
      severity: "error",
      code: "missing_project",
      message: "The package does not contain a project payload.",
      path: "project",
    });
    return diagnostics;
  }

  const manifest = project.manifest as Record<string, unknown> | undefined;
  if (!manifest || typeof manifest !== "object" || Array.isArray(manifest) || typeof manifest.id !== "string" || typeof manifest.name !== "string") {
    diagnostics.push({
      severity: "error",
      code: "invalid_project",
      message: "The project payload contains an invalid or missing manifest.",
      path: "project.manifest",
    });
  }

  const integrity = envelope.integrity as Record<string, unknown> | undefined;
  if (!integrity || typeof integrity !== "object" || Array.isArray(integrity) || typeof integrity.projectFingerprint !== "string") {
    diagnostics.push({
      severity: "error",
      code: "fingerprint_mismatch",
      message: "Integrity fingerprint metadata is missing or corrupted.",
      path: "integrity",
    });
  } else if (integrity.algorithm !== "stable-json-cyrb53") {
    diagnostics.push({
      severity: "warning",
      code: "fingerprint_mismatch",
      message: `Unknown integrity fingerprint algorithm: '${integrity.algorithm || "none"}'.`,
      path: "integrity.algorithm",
    });
  }

  return diagnostics;
}
