import type { AxpkgTrustLevel } from "../../app/projects/axpkg/AxpkgSignatureTypes";
import type { RuntimePackageEnvelope } from "./RuntimePackageEnvelope";
import type { RuntimeManifest, RuntimeCapability } from "../manifest/RuntimeManifestTypes";

export type PackageInstallStatus =
  | "installed"
  | "pending_confirmation"
  | "blocked"
  | "failed"
  | "uninstalled";

export type InstallPolicyAction = "allow" | "confirm" | "block";

export interface RuntimePackageInstallPolicy {
  trusted: "allow";
  unsigned: "confirm" | "block";
  untrusted: "confirm" | "block";
  tampered: "block";
  incompatible: "block";
  blocked: "block";
}

export type PackageInstallDiagnosticCode =
  | "package_parse_failed"
  | "invalid_runtime_package"
  | "invalid_runtime_manifest"
  | "trusted_package"
  | "unsigned_package_requires_confirmation"
  | "untrusted_package_requires_confirmation"
  | "tampered_package_blocked"
  | "blocked_signer"
  | "incompatible_package"
  | "duplicate_package_version"
  | "upgrade_not_supported_yet"
  | "install_success"
  | "uninstall_success"
  | "no_execution_performed"
  | "promotion_success"
  | "promotion_failed"
  | "promotion_blocked"
  | "promotion_fingerprint_mismatch"
  | "promotion_duplicate_conflict"
  | "promotion_unsigned_blocked"
  | "promotion_untrusted_blocked";

export interface PackageInstallDiagnostic {
  severity: "info" | "warning" | "error";
  code: PackageInstallDiagnosticCode;
  message: string;
  path?: string;
}

export type PackagePromotionStatus =
  | "not_promoted"
  | "promoted"
  | "promotion_blocked"
  | "promotion_failed";

export interface PackageInstallRecord {
  id: string;
  packageId: string;
  runtimeId: string;
  name: string;
  version: string;
  publisher: string;
  installedAt: string;
  status: PackageInstallStatus;
  trustLevel: AxpkgTrustLevel;
  policyAction: InstallPolicyAction;
  manifestFingerprint: string;
  packageFingerprint: string;
  signature?: {
    keyId: string;
    algorithm: string;
    signedAt: string;
  };
  diagnostics: PackageInstallDiagnostic[];
  manifest: RuntimeManifest;
  promotion?: {
    status: PackagePromotionStatus;
    promotedAt?: string;
    runtimeId?: string;
    registryEntryId?: string;
    manifestFingerprint?: string;
    diagnostics: PackageInstallDiagnostic[];
  };
}

export interface RuntimePackageInstallPreview {
  previewId: string;
  packageEnvelope: RuntimePackageEnvelope;
  packageId: string;
  runtimeId: string;
  name: string;
  version: string;
  publisher: string;
  runtimeType: RuntimeManifest["runtimeType"];
  declaredCapabilities: RuntimeCapability[];
  entryModuleUrl: string;
  trustLevel: AxpkgTrustLevel;
  policyAction: InstallPolicyAction;
  canInstall: boolean;
  requiresConfirmation: boolean;
  diagnostics: PackageInstallDiagnostic[];
}

export type PackageInstallResult =
  | {
      success: true;
      record: PackageInstallRecord;
      diagnostics: PackageInstallDiagnostic[];
    }
  | {
      success: false;
      status: "pending_confirmation" | "blocked" | "failed";
      trustLevel?: AxpkgTrustLevel;
      diagnostics: PackageInstallDiagnostic[];
      preview?: RuntimePackageInstallPreview;
    };

export interface PackagePromotionPreview {
  packageId: string;
  runtimeId: string;
  packageTrustLevel: AxpkgTrustLevel;
  promotionAction: "allow" | "confirm" | "block";
  canPromote: boolean;
  requiresConfirmation: boolean;
  manifestValid: boolean;
  manifestFingerprintMatches: boolean;
  duplicateStatus: "none" | "same_fingerprint" | "conflict";
  diagnostics: PackageInstallDiagnostic[];
}

export type RuntimePackagePromotionAction = "allow" | "confirm" | "block";

export interface RuntimePackagePromotionPolicy {
  trusted: RuntimePackagePromotionAction;
  unsigned: RuntimePackagePromotionAction;
  untrusted: RuntimePackagePromotionAction;
  tampered: "block";
  incompatible: "block";
  blocked: "block";
}

export type PackagePromotionResult =
  | {
      success: true;
      packageId: string;
      runtimeId: string;
      registryEntryId: string;
      idempotent: boolean;
      diagnostics: PackageInstallDiagnostic[];
    }
  | {
      success: false;
      packageId?: string;
      runtimeId?: string;
      status: "promotion_blocked" | "promotion_failed";
      diagnostics: PackageInstallDiagnostic[];
    };

