import type { PackageInstallDiagnostic } from "./PackageRegistryTypes";
import { validateRuntimeManifest } from "../manifest/RuntimeManifestValidator";

export function validateRuntimePackageEnvelope(candidate: unknown): PackageInstallDiagnostic[] {
  const diagnostics: PackageInstallDiagnostic[] = [];

  if (!candidate || typeof candidate !== "object" || Array.isArray(candidate)) {
    diagnostics.push({
      severity: "error",
      code: "package_parse_failed",
      message: "The package file is not a valid JSON object.",
    });
    return diagnostics;
  }

  const envelope = candidate as Record<string, any>;

  if (envelope.packageType !== "axiom.runtime-package") {
    diagnostics.push({
      severity: "error",
      code: "invalid_runtime_package",
      message: `Invalid packageType: '${envelope.packageType || "none"}'. Expected 'axiom.runtime-package'.`,
      path: "packageType",
    });
  }

  if (envelope.packageVersion !== "1.0.0") {
    diagnostics.push({
      severity: "error",
      code: "incompatible_package",
      message: `Unsupported packageVersion: '${envelope.packageVersion || "none"}'. Expected '1.0.0'.`,
      path: "packageVersion",
    });
  }

  // Required header fields
  const requiredHeader = ["packageId", "runtimeId", "name", "version", "publisher", "manifest", "compatibility", "integrity"];
  for (const field of requiredHeader) {
    if (envelope[field] === undefined || envelope[field] === null) {
      diagnostics.push({
        severity: "error",
        code: "invalid_runtime_package",
        message: `Missing required package envelope header field: '${field}'.`,
        path: field,
      });
    }
  }

  if (envelope.manifest) {
    const manifestResult = validateRuntimeManifest(envelope.manifest);
    if (!manifestResult.valid) {
      diagnostics.push({
        severity: "error",
        code: "invalid_runtime_manifest",
        message: `Embedded runtime manifest is invalid: ${manifestResult.error || "unknown error"}.`,
        path: "manifest",
      });
    }
  }

  if (envelope.integrity) {
    if (envelope.integrity.algorithm !== "stable-json-cyrb53") {
      diagnostics.push({
        severity: "error",
        code: "incompatible_package",
        message: `Unsupported integrity algorithm: '${envelope.integrity.algorithm || "none"}'. Expected 'stable-json-cyrb53'.`,
        path: "integrity.algorithm",
      });
    }
    if (typeof envelope.integrity.packageFingerprint !== "string") {
      diagnostics.push({
        severity: "error",
        code: "invalid_runtime_package",
        message: "Missing integrity packageFingerprint.",
        path: "integrity.packageFingerprint",
      });
    }
    if (typeof envelope.integrity.manifestFingerprint !== "string") {
      diagnostics.push({
        severity: "error",
        code: "invalid_runtime_package",
        message: "Missing integrity manifestFingerprint.",
        path: "integrity.manifestFingerprint",
      });
    }
  }

  return diagnostics;
}
