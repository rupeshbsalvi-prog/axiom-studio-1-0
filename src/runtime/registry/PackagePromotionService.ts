import type {
  PackageInstallRecord,
  PackageInstallDiagnostic,
  RuntimePackagePromotionPolicy,
  PackagePromotionPreview,
  PackagePromotionResult,
} from "./PackageRegistryTypes";
import { getInstalledPackages } from "./PackageRegistryService";
import { resolvePromotionPolicyAction } from "./PackagePromotionPolicy";
import { validateRuntimeManifest } from "../manifest/RuntimeManifestValidator";
import { createRuntimeManifestFingerprint } from "./RuntimePackageFingerprint";
import { promoteManifestToRegistry, getRegistryEntry } from "../RuntimeRegistry";
import {
  recordWorkspaceAuditEvent,
  createRuntimePackagePromotionRequestedEvent,
  createRuntimePackagePromotionCompletedEvent,
  createRuntimePackagePromotionFailedEvent,
  createRuntimePackagePromotionBlockedEvent,
} from "../../workspace/WorkspaceAuditService";

export function previewPackagePromotion(
  packageId: string,
  policy?: RuntimePackagePromotionPolicy
): PackagePromotionPreview {
  const diagnostics: PackageInstallDiagnostic[] = [];
  const records = getInstalledPackages();
  const record = records.find((r) => r.packageId === packageId && r.status === "installed");

  if (!record) {
    diagnostics.push({
      severity: "error",
      code: "invalid_runtime_package",
      message: `Promotion failed: Package '${packageId}' is not currently installed.`,
    });
    return {
      packageId,
      runtimeId: "",
      packageTrustLevel: "unsigned",
      promotionAction: "block",
      canPromote: false,
      requiresConfirmation: false,
      manifestValid: false,
      manifestFingerprintMatches: false,
      duplicateStatus: "none",
      diagnostics,
    };
  }

  // 1. Schema check
  const val = validateRuntimeManifest(record.manifest);
  const manifestValid = val.valid;
  if (!manifestValid) {
    diagnostics.push({
      severity: "error",
      code: "invalid_runtime_manifest",
      message: `Invalid manifest: ${val.error || "validation error"}`,
    });
  }

  // 2. Fingerprint check
  const actualFingerprint = createRuntimeManifestFingerprint(record.manifest);
  const manifestFingerprintMatches = record.manifestFingerprint === actualFingerprint;
  if (!manifestFingerprintMatches) {
    diagnostics.push({
      severity: "error",
      code: "promotion_fingerprint_mismatch",
      message: `Manifest fingerprint mismatch: Expected '${record.manifestFingerprint}', calculated '${actualFingerprint}'.`,
    });
  }

  // 3. Resolve policy action
  const action = resolvePromotionPolicyAction(record.trustLevel, policy);

  // 4. Duplicate Check
  let duplicateStatus: "none" | "same_fingerprint" | "conflict" = "none";
  const existing = getRegistryEntry(record.runtimeId);
  if (existing) {
    const existingFingerprint = createRuntimeManifestFingerprint(existing.manifest);
    if (existingFingerprint === actualFingerprint) {
      duplicateStatus = "same_fingerprint";
      diagnostics.push({
        severity: "info",
        code: "no_execution_performed",
        message: `Idempotent Promotion: Package '${record.runtimeId}' is already registered with identical configuration.`,
      });
    } else {
      duplicateStatus = "conflict";
      diagnostics.push({
        severity: "error",
        code: "promotion_duplicate_conflict",
        message: `Conflict: Runtime ID '${record.runtimeId}' is registered with a different configuration.`,
      });
    }
  }

  // 5. Audit Policy constraints
  if (action === "block") {
    diagnostics.push({
      severity: "error",
      code:
        record.trustLevel === "unsigned"
          ? "promotion_unsigned_blocked"
          : record.trustLevel === "untrusted"
          ? "promotion_untrusted_blocked"
          : "promotion_blocked",
      message: `Promotion blocked: Policy forbids promoting package with '${record.trustLevel}' trust level.`,
    });
  }

  const canPromote =
    manifestValid &&
    manifestFingerprintMatches &&
    duplicateStatus !== "conflict" &&
    action !== "block";

  const requiresConfirmation = action === "confirm" && duplicateStatus !== "same_fingerprint";

  return {
    packageId: record.packageId,
    runtimeId: record.runtimeId,
    packageTrustLevel: record.trustLevel,
    promotionAction: action,
    canPromote,
    requiresConfirmation,
    manifestValid,
    manifestFingerprintMatches,
    duplicateStatus,
    diagnostics,
  };
}

export function promotePackageToRuntime(
  packageId: string,
  options?: {
    confirmed?: boolean;
    policy?: RuntimePackagePromotionPolicy;
  }
): PackagePromotionResult {
  const timestamp = new Date().toISOString();

  // Audit requested
  recordWorkspaceAuditEvent(
    createRuntimePackagePromotionRequestedEvent({
      id: `promo_req_${packageId}_${Date.now()}`,
      title: "Package Promotion Requested",
      message: `Request to promote package '${packageId}' to active RuntimeRegistry.`,
      timestamp,
      metadata: { packageId },
    })
  );

  const preview = previewPackagePromotion(packageId, options?.policy);
  const diagnostics = [...preview.diagnostics];

  if (!preview.canPromote) {
    diagnostics.push({
      severity: "error",
      code: "promotion_failed",
      message: "Promotion failed pre-flight security checks.",
    });

    recordWorkspaceAuditEvent(
      createRuntimePackagePromotionFailedEvent({
        id: `promo_fail_${packageId}_${Date.now()}`,
        title: "Package Promotion Failed",
        message: `Preflight checks failed for promoting package '${packageId}'.`,
        timestamp,
        metadata: { packageId, diagnostics },
      })
    );

    return {
      success: false,
      packageId,
      runtimeId: preview.runtimeId,
      status: "promotion_failed",
      diagnostics,
    };
  }

  if (preview.requiresConfirmation && options?.confirmed !== true) {
    diagnostics.push({
      severity: "warning",
      code: "promotion_blocked",
      message: "Promotion requires explicit confirmation.",
    });

    recordWorkspaceAuditEvent(
      createRuntimePackagePromotionBlockedEvent({
        id: `promo_block_${packageId}_${Date.now()}`,
        title: "Package Promotion Blocked",
        message: `Promotion of package '${packageId}' requires explicit user confirmation.`,
        timestamp,
        metadata: { packageId },
      })
    );

    return {
      success: false,
      packageId,
      runtimeId: preview.runtimeId,
      status: "promotion_blocked",
      diagnostics,
    };
  }

  const records = getInstalledPackages();
  const record = records.find((r) => r.packageId === packageId && r.status === "installed")!;

  try {
    const isIdempotent = preview.duplicateStatus === "same_fingerprint";
    
    // Call the lower-level promote manifest API (allowUnsafe true if confirm action approved)
    const allowUnsafe = preview.promotionAction === "confirm" && options?.confirmed === true;
    const entry = promoteManifestToRegistry(record.manifest, record.trustLevel, allowUnsafe, record.packageId);

    // Save status into the install record
    record.promotion = {
      status: "promoted",
      promotedAt: timestamp,
      runtimeId: record.runtimeId,
      registryEntryId: record.runtimeId,
      manifestFingerprint: record.manifestFingerprint,
      diagnostics,
    };

    // Ensure we include the no_execution_performed diagnostic to satisfy the contract requirement
    diagnostics.push({
      severity: "info",
      code: "no_execution_performed",
      message: "Promotion complete: Metadata promoted only. No code execution was triggered.",
    });

    diagnostics.push({
      severity: "info",
      code: "promotion_success",
      message: `Package '${record.name}' successfully promoted to RuntimeRegistry as ${entry.status}.`,
    });

    recordWorkspaceAuditEvent(
      createRuntimePackagePromotionCompletedEvent({
        id: `promo_success_${packageId}_${Date.now()}`,
        title: "Package Promotion Completed",
        message: `Successfully promoted package '${record.name}' (${packageId}) to RuntimeRegistry.`,
        timestamp,
        metadata: {
          packageId,
          runtimeId: record.runtimeId,
          idempotent: isIdempotent,
          noExecutionPerformed: true,
        },
      })
    );

    return {
      success: true,
      packageId,
      runtimeId: record.runtimeId,
      registryEntryId: record.runtimeId,
      idempotent: isIdempotent,
      diagnostics,
    };
  } catch (err: any) {
    diagnostics.push({
      severity: "error",
      code: "promotion_failed",
      message: err.message || String(err),
    });

    recordWorkspaceAuditEvent(
      createRuntimePackagePromotionFailedEvent({
        id: `promo_fail_${packageId}_${Date.now()}`,
        title: "Package Promotion Failed",
        message: `Failed to promote package '${packageId}': ${err.message || String(err)}`,
        timestamp,
        metadata: { packageId, error: err.message || String(err) },
      })
    );

    return {
      success: false,
      packageId,
      runtimeId: record.runtimeId,
      status: "promotion_failed",
      diagnostics,
    };
  }
}
