import { type RuntimeCapability } from "../manifest/RuntimeManifestTypes";

export type RuntimeActivationEligibilityReason =
  | "runtime_not_found"
  | "runtime_not_registered"
  | "runtime_already_active"
  | "runtime_active"
  | "package_record_missing"
  | "package_not_installed"
  | "package_not_trusted"
  | "manifest_fingerprint_mismatch"
  | "verification_status_not_trusted"
  | "undeclared_capability_granted"
  | "required_capability_not_granted"
  | "authority_denied"
  | "package_id_missing"
  | "package_id_mismatch"
  | "package_promotion_not_promoted"
  | "eligible";

export interface RuntimeActivationEligibilityDiagnostic {
  code: RuntimeActivationEligibilityReason;
  severity: "info" | "warning" | "error";
  message: string;
  runtimeId?: string;
  packageId?: string;
}

export interface RuntimeActivationEligibilityResult {
  eligible: boolean;
  reason?: RuntimeActivationEligibilityReason;
  diagnostics: RuntimeActivationEligibilityDiagnostic[];
}

export interface RuntimeActivationEligibilityContext {
  grantedCapabilities?: RuntimeCapability[];
}
