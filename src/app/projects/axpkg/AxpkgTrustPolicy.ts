import type { AxpkgTrustPolicy, TrustedAxpkgKey } from "./AxpkgSignatureTypes";

export const DEFAULT_AXPKG_TRUST_POLICY: AxpkgTrustPolicy = {
  allowUnsignedPackages: true,
  allowUnknownSignersWithWarning: true,
  trustedKeys: [],
  blockedKeyIds: [],
};

export function findTrustedKey(
  policy: AxpkgTrustPolicy,
  keyId: string
): TrustedAxpkgKey | undefined {
  return policy.trustedKeys.find((k) => k.keyId === keyId);
}
