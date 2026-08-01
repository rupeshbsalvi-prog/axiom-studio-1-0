import type { AxiomPackageEnvelope } from "./AxpkgTypes";
import type { AxpkgTrustPolicy, AxpkgTrustResult, AxpkgTrustLevel } from "./AxpkgSignatureTypes";
import { DEFAULT_AXPKG_TRUST_POLICY, findTrustedKey } from "./AxpkgTrustPolicy";
import { createProjectFingerprint } from "./stableJson";
import { verifyAxpkgSignature } from "./AxpkgSignatureVerifier";

export async function evaluateAxpkgTrust(params: {
  envelope: AxiomPackageEnvelope;
  policy?: AxpkgTrustPolicy;
}): Promise<AxpkgTrustResult> {
  const policy = params.policy ?? DEFAULT_AXPKG_TRUST_POLICY;
  const envelope = params.envelope;

  // 1. Recompute project fingerprint and check for structural tempering
  const recomputed = createProjectFingerprint(envelope.project);
  if (recomputed !== envelope.integrity?.projectFingerprint) {
    return {
      level: "tampered",
      trusted: false,
      canOpen: false,
      requiresUserConfirmation: false,
      diagnostics: [
        {
          severity: "error",
          code: "fingerprint_mismatch",
          message: "The project fingerprint mismatch: the project payload is corrupted or modified.",
          path: "integrity.projectFingerprint",
        },
      ],
    };
  }

  // 2. Check for signature block presence
  if (!envelope.signature) {
    return {
      level: "unsigned",
      trusted: false,
      canOpen: policy.allowUnsignedPackages,
      requiresUserConfirmation: false,
      diagnostics: [
        {
          severity: "warning",
          code: "unsigned_package",
          message: "This package does not contain a cryptographic signature.",
          path: "signature",
        },
      ],
    };
  }

  const sig = envelope.signature;

  // 3. Check for incompatible signature algorithm/version
  if (sig.algorithm !== "ECDSA-P256-SHA256" || sig.signatureVersion !== "1.0.0") {
    return {
      level: "incompatible",
      trusted: false,
      canOpen: false,
      requiresUserConfirmation: false,
      diagnostics: [
        {
          severity: "error",
          code: "unsupported_signature_algorithm",
          message: `Unsupported signature algorithm or version: '${sig.algorithm}' (v${sig.signatureVersion}).`,
          path: "signature.algorithm",
        },
      ],
    };
  }

  // 4. Check if signer is blocked
  if (policy.blockedKeyIds.includes(sig.keyId)) {
    return {
      level: "blocked",
      trusted: false,
      canOpen: false,
      requiresUserConfirmation: false,
      diagnostics: [
        {
          severity: "error",
          code: "blocked_signer",
          message: `The package signer key ID '${sig.keyId}' is explicitly blocked by trust policy.`,
          path: "signature.keyId",
        },
      ],
    };
  }

  // 5. Look up key in trusted keys
  const trustedKey = findTrustedKey(policy, sig.keyId);

  if (!trustedKey || !trustedKey.enabled) {
    // Unknown or disabled key -> Untrusted (Signature cannot be verified)
    return {
      level: "untrusted",
      trusted: false,
      canOpen: policy.allowUnknownSignersWithWarning,
      requiresUserConfirmation: true,
      diagnostics: [
        {
          severity: "warning",
          code: "untrusted_signer",
          message: `The package signer key ID '${sig.keyId}' is unknown or disabled. Signature could not be verified.`,
          path: "signature.keyId",
        },
      ],
    };
  }

  // 6. Verify signature against public key
  const verification = await verifyAxpkgSignature({
    envelope,
    publicKeyJwk: trustedKey.publicKeyJwk,
  });

  if (!verification.valid) {
    return {
      level: "tampered",
      trusted: false,
      canOpen: false,
      requiresUserConfirmation: false,
      diagnostics: [
        {
          severity: "error",
          code: "signature_verification_failed",
          message: `Cryptographic signature verification failed: ${verification.reason ?? "invalid signature bytes"}.`,
          path: "signature.signatureBase64Url",
        },
      ],
    };
  }

  return {
    level: "trusted",
    trusted: true,
    canOpen: true,
    requiresUserConfirmation: false,
    diagnostics: [
      {
        severity: "info",
        code: "trusted_signature_verified",
        message: `Cryptographic signature verified successfully. Signer: '${trustedKey.label}'.`,
      },
    ],
    signer: {
      keyId: trustedKey.keyId,
      label: trustedKey.label,
    },
  };
}
