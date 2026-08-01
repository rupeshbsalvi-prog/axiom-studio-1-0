import type { RuntimePackageEnvelope } from "./RuntimePackageEnvelope";
import type { AxpkgTrustPolicy, AxpkgTrustResult } from "../../app/projects/axpkg/AxpkgSignatureTypes";
import { DEFAULT_AXPKG_TRUST_POLICY, findTrustedKey } from "../../app/projects/axpkg/AxpkgTrustPolicy";
import { createRuntimePackageFingerprint, createRuntimePackageSigningPayload } from "./RuntimePackageFingerprint";
import { decodeBase64Url } from "../../app/projects/axpkg/base64Url";
import type { PackageInstallDiagnostic } from "./PackageRegistryTypes";

export async function evaluateRuntimePackageTrust(params: {
  envelope: RuntimePackageEnvelope;
  policy?: AxpkgTrustPolicy;
}): Promise<AxpkgTrustResult> {
  const policy = params.policy ?? DEFAULT_AXPKG_TRUST_POLICY;
  const envelope = params.envelope;

  // 1. Recompute package fingerprint and check for structural tempering
  const recomputed = createRuntimePackageFingerprint(envelope);
  if (recomputed !== envelope.integrity?.packageFingerprint) {
    return {
      level: "tampered",
      trusted: false,
      canOpen: false,
      requiresUserConfirmation: false,
      diagnostics: [
        {
          severity: "error",
          code: "tampered_package_blocked",
          message: "The package fingerprint mismatch: the package payload is corrupted or modified.",
          path: "integrity.packageFingerprint",
        } as any,
      ],
    };
  }

  // 2. Check for signature block presence
  if (!envelope.signature) {
    return {
      level: "unsigned",
      trusted: false,
      canOpen: policy.allowUnsignedPackages,
      requiresUserConfirmation: true,
      diagnostics: [
        {
          severity: "warning",
          code: "unsigned_package_requires_confirmation",
          message: "This package does not contain a cryptographic signature.",
          path: "signature",
        } as any,
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
          code: "incompatible_package",
          message: `Unsupported signature algorithm or version: '${sig.algorithm}' (v${sig.signatureVersion}).`,
          path: "signature.algorithm",
        } as any,
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
        } as any,
      ],
    };
  }

  // 5. Look up key in trusted keys
  const trustedKey = findTrustedKey(policy, sig.keyId);

  if (!trustedKey || !trustedKey.enabled) {
    return {
      level: "untrusted",
      trusted: false,
      canOpen: policy.allowUnknownSignersWithWarning,
      requiresUserConfirmation: true,
      diagnostics: [
        {
          severity: "warning",
          code: "untrusted_package_requires_confirmation",
          message: `The package signer key ID '${sig.keyId}' is unknown or disabled. Signature could not be verified.`,
          path: "signature.keyId",
        } as any,
      ],
    };
  }

  // 6. Verify signature against public key
  try {
    const publicKey = await crypto.subtle.importKey(
      "jwk",
      trustedKey.publicKeyJwk,
      {
        name: "ECDSA",
        namedCurve: "P-256",
      },
      false,
      ["verify"]
    );

    const payloadStr = createRuntimePackageSigningPayload(envelope);
    const data = new TextEncoder().encode(payloadStr);
    const sigBytes = decodeBase64Url(sig.signatureBase64Url);

    const isValid = await crypto.subtle.verify(
      {
        name: "ECDSA",
        hash: { name: "SHA-256" },
      },
      publicKey,
      sigBytes as any,
      data
    );

    if (!isValid) {
      return {
        level: "tampered",
        trusted: false,
        canOpen: false,
        requiresUserConfirmation: false,
        diagnostics: [
          {
            severity: "error",
            code: "tampered_package_blocked",
            message: "Cryptographic signature verification failed: invalid signature bytes.",
            path: "signature.signatureBase64Url",
          } as any,
        ],
      };
    }
  } catch (err) {
    return {
      level: "tampered",
      trusted: false,
      canOpen: false,
      requiresUserConfirmation: false,
      diagnostics: [
        {
          severity: "error",
          code: "tampered_package_blocked",
          message: `Cryptographic signature verification failed: ${err instanceof Error ? err.message : String(err)}.`,
          path: "signature.signatureBase64Url",
        } as any,
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
        code: "trusted_package",
        message: `Cryptographic signature verified successfully. Signer: '${trustedKey.label}'.`,
      } as any,
    ],
    signer: {
      keyId: trustedKey.keyId,
      label: trustedKey.label,
    },
  };
}
