import type { AxpkgImportDiagnostic } from "./AxpkgTypes";

export interface AxpkgSignatureBlock {
  signatureVersion: "1.0.0";
  algorithm: "ECDSA-P256-SHA256";
  keyId: string;
  signedAt: string;
  signatureBase64Url: string;
}

export type AxpkgTrustLevel =
  | "trusted"
  | "unsigned"
  | "untrusted"
  | "tampered"
  | "incompatible"
  | "blocked";

export interface AxpkgTrustResult {
  level: AxpkgTrustLevel;
  trusted: boolean;
  canOpen: boolean;
  requiresUserConfirmation: boolean;
  diagnostics: AxpkgImportDiagnostic[];
  signer?: {
    keyId: string;
    label?: string;
  };
}

export interface TrustedAxpkgKey {
  keyId: string;
  label: string;
  algorithm: "ECDSA-P256-SHA256";
  publicKeyJwk: JsonWebKey;
  enabled: boolean;
}

export interface AxpkgTrustPolicy {
  allowUnsignedPackages: boolean;
  allowUnknownSignersWithWarning: boolean;
  trustedKeys: TrustedAxpkgKey[];
  blockedKeyIds: string[];
}
