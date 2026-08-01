import { getRegistryEntry } from "../RuntimeRegistry";
import { isRuntimeActive } from "./RuntimeActivationService";
import { getInstalledPackages } from "../registry/PackageRegistryService";
import { createRuntimeManifestFingerprint } from "../registry/RuntimePackageFingerprint";
import {
  type RuntimeActivationEligibilityContext,
  type RuntimeActivationEligibilityResult,
  type RuntimeActivationEligibilityReason,
  type RuntimeActivationEligibilityDiagnostic,
} from "./RuntimeActivationEligibilityTypes";

export function checkActivationEligibility(
  runtimeId: string,
  context?: RuntimeActivationEligibilityContext
): RuntimeActivationEligibilityResult {
  const diagnostics: RuntimeActivationEligibilityDiagnostic[] = [];

  const entry = getRegistryEntry(runtimeId);
  if (!entry) {
    return {
      eligible: false,
      reason: "runtime_not_found",
      diagnostics: [
        {
          code: "runtime_not_found",
          severity: "error",
          message: `Activation ineligible: Runtime '${runtimeId}' is not found in the registry.`,
          runtimeId,
        },
      ],
    };
  }

  if (entry.status !== "registered") {
    return {
      eligible: false,
      reason: "runtime_not_registered",
      diagnostics: [
        {
          code: "runtime_not_registered",
          severity: "error",
          message: `Activation ineligible: Runtime '${runtimeId}' status is '${entry.status}'.`,
          runtimeId,
        },
      ],
    };
  }

  if (isRuntimeActive(runtimeId)) {
    return {
      eligible: false,
      reason: "runtime_already_active",
      diagnostics: [
        {
          code: "runtime_already_active",
          severity: "warning",
          message: `Activation ineligible: Runtime '${runtimeId}' is already active.`,
          runtimeId,
        },
      ],
    };
  }

  // Capability checks
  const declared = entry.manifest.capabilities ?? [];
  const granted = context?.grantedCapabilities ?? [];

  const undeclared = granted.filter((cap) => !declared.includes(cap));
  if (undeclared.length > 0) {
    return {
      eligible: false,
      reason: "undeclared_capability_granted",
      diagnostics: [
        {
          code: "undeclared_capability_granted",
          severity: "error",
          message: `Activation ineligible: Undeclared capability granted: [${undeclared.join(", ")}].`,
          runtimeId,
        },
      ],
    };
  }

  const missing = declared.filter((cap) => !granted.includes(cap));
  if (missing.length > 0) {
    return {
      eligible: false,
      reason: "required_capability_not_granted",
      diagnostics: [
        {
          code: "required_capability_not_granted",
          severity: "error",
          message: `Activation ineligible: Missing required capability: [${missing.join(", ")}].`,
          runtimeId,
        },
      ],
    };
  }

  // Eligibility logic depending on whether the runtime is promoted or first-party
  if (entry.isPromoted) {
    const installed = getInstalledPackages();
    const record = installed.find((r) => r.runtimeId === runtimeId);

    if (!record) {
      return {
        eligible: false,
        reason: "package_record_missing",
        diagnostics: [
          {
            code: "package_record_missing",
            severity: "error",
            message: `Activation ineligible: No installed package found for runtime '${runtimeId}'.`,
            runtimeId,
          },
        ],
      };
    }

    if (record.status !== "installed") {
      return {
        eligible: false,
        reason: "package_not_installed",
        diagnostics: [
          {
            code: "package_not_installed",
            severity: "error",
            message: `Activation ineligible: Package for runtime '${runtimeId}' status is '${record.status}'.`,
            runtimeId,
            packageId: record.packageId,
          },
        ],
      };
    }

    if (!record.promotion || record.promotion.status !== "promoted") {
      return {
        eligible: false,
        reason: "package_promotion_not_promoted",
        diagnostics: [
          {
            code: "package_promotion_not_promoted",
            severity: "error",
            message: `Activation ineligible: Package for runtime '${runtimeId}' is not promoted.`,
            runtimeId,
            packageId: record.packageId,
          },
        ],
      };
    }

    if (!entry.packageId) {
      return {
        eligible: false,
        reason: "package_id_missing",
        diagnostics: [
          {
            code: "package_id_missing",
            severity: "error",
            message: `Activation ineligible: Promoted entry for runtime '${runtimeId}' is missing package ownership metadata.`,
            runtimeId,
          },
        ],
      };
    }

    if (entry.packageId !== record.packageId) {
      return {
        eligible: false,
        reason: "package_id_mismatch",
        diagnostics: [
          {
            code: "package_id_mismatch",
            severity: "error",
            message: `Activation ineligible: Promoted entry packageId '${entry.packageId}' does not match installed record packageId '${record.packageId}'.`,
            runtimeId,
            packageId: record.packageId,
          },
        ],
      };
    }

    // Promoted packages must be trusted only (no development trust allowed)
    if (entry.verificationStatus !== "trusted") {
      return {
        eligible: false,
        reason: "verification_status_not_trusted",
        diagnostics: [
          {
            code: "verification_status_not_trusted",
            severity: "error",
            message: `Activation ineligible: Promoted runtime verification status is '${entry.verificationStatus}', expected 'trusted'.`,
            runtimeId,
            packageId: record.packageId,
          },
        ],
      };
    }

    const calculatedFingerprint = createRuntimeManifestFingerprint(entry.manifest);
    if (calculatedFingerprint !== record.manifestFingerprint || record.promotion.manifestFingerprint !== record.manifestFingerprint) {
      return {
        eligible: false,
        reason: "manifest_fingerprint_mismatch",
        diagnostics: [
          {
            code: "manifest_fingerprint_mismatch",
            severity: "error",
            message: `Activation ineligible: Manifest fingerprint mismatch.`,
            runtimeId,
            packageId: record.packageId,
          },
        ],
      };
    }
  } else {
    // Local / First-party: Allow trusted or development
    if (entry.verificationStatus !== "trusted" && entry.verificationStatus !== "development") {
      return {
        eligible: false,
        reason: "verification_status_not_trusted",
        diagnostics: [
          {
            code: "verification_status_not_trusted",
            severity: "error",
            message: `Activation ineligible: Local runtime verification status is '${entry.verificationStatus}', expected 'trusted' or 'development'.`,
            runtimeId,
          },
        ],
      };
    }
  }

  // All checks passed
  return {
    eligible: true,
    reason: "eligible",
    diagnostics: [
      {
        code: "eligible",
        severity: "info",
        message: `Runtime '${runtimeId}' is eligible for activation.`,
        runtimeId,
      },
    ],
  };
}

// ---------------------------------------------------------------------------
// Phase 12 — Package liveness verification (dispatch-time freshness check)
//
// Intentionally does NOT re-check activation state (isRuntimeActive).
// Used by dispatchDryRunAction to ensure package trust/promotion/fingerprint
// is still valid after activation, without interfering with the active state.
// ---------------------------------------------------------------------------

export type PromotedPackageLivenessResult =
  | { valid: true }
  | { valid: false; code: string; message: string };

export function verifyPromotedPackageLiveness(
  runtimeId: string
): PromotedPackageLivenessResult {
  const entry = getRegistryEntry(runtimeId);
  if (!entry) {
    return {
      valid: false,
      code: "runtime_not_found",
      message: `Dispatch denied: Runtime '${runtimeId}' not found in registry.`,
    };
  }

  if (entry.status !== "registered") {
    return {
      valid: false,
      code: "dispatch_policy_denied",
      message: `Dispatch denied: Runtime '${runtimeId}' registry status is '${entry.status}', expected 'registered'.`,
    };
  }

  if (entry.verificationStatus !== "trusted") {
    return {
      valid: false,
      code: "runtime_not_trusted",
      message: `Dispatch denied: Runtime '${runtimeId}' verificationStatus is '${entry.verificationStatus}', expected 'trusted'.`,
    };
  }

  if (!entry.isPromoted) {
    return {
      valid: false,
      code: "runtime_not_promoted",
      message: `Dispatch denied: Runtime '${runtimeId}' is not a promoted package.`,
    };
  }

  const installed = getInstalledPackages();
  const record = installed.find((r) => r.runtimeId === runtimeId);

  if (!record) {
    return {
      valid: false,
      code: "runtime_not_promoted",
      message: `Dispatch denied: No installed package record found for runtime '${runtimeId}'.`,
    };
  }

  if (record.status !== "installed") {
    return {
      valid: false,
      code: "runtime_not_promoted",
      message: `Dispatch denied: Package for runtime '${runtimeId}' install status is '${record.status}'.`,
    };
  }

  if (!record.promotion || record.promotion.status !== "promoted") {
    return {
      valid: false,
      code: "runtime_not_promoted",
      message: `Dispatch denied: Package for runtime '${runtimeId}' is not promoted.`,
    };
  }

  if (!entry.packageId || entry.packageId !== record.packageId) {
    return {
      valid: false,
      code: "runtime_not_promoted",
      message: `Dispatch denied: Package ownership mismatch for runtime '${runtimeId}'.`,
    };
  }

  const calculatedFingerprint = createRuntimeManifestFingerprint(entry.manifest);
  if (
    calculatedFingerprint !== record.manifestFingerprint ||
    record.promotion.manifestFingerprint !== record.manifestFingerprint
  ) {
    return {
      valid: false,
      code: "dispatch_policy_denied",
      message: `Dispatch denied: Manifest fingerprint mismatch for runtime '${runtimeId}'. Package may have changed since activation.`,
    };
  }

  return { valid: true };
}

