import {
  type RuntimeManifest,
  type SignatureVerificationContext,
  type VerificationResult,
} from "./RuntimeManifestTypes";

export function verifyRuntimeSignature(
  manifest: RuntimeManifest,
  context: SignatureVerificationContext
): VerificationResult {
  const entry = manifest.entry;
  if (!entry) {
    return {
      status: "missing",
      reason: "Manifest entry section is missing.",
    };
  }

  const mode = entry.signatureMode || "signed";

  if (mode === "development") {
    if (context.isDevelopment) {
      return { status: "development" };
    } else {
      return {
        status: "invalid",
        reason: "Development mode signature is not allowed in production environments.",
      };
    }
  }

  if (mode === "signed") {
    if (!entry.signature) {
      return {
        status: "missing",
        reason: "Manifest signature is required but missing.",
      };
    }

    // Phase 04 stub signature verification:
    // Any signature starting with "valid-sig-" is trusted.
    if (entry.signature.startsWith("valid-sig-")) {
      return { status: "trusted" };
    }

    return {
      status: "invalid",
      reason: "Invalid manifest signature signature checks failed.",
    };
  }

  return {
    status: "untrusted",
    reason: `Unsupported signature mode: '${mode}'.`,
  };
}
