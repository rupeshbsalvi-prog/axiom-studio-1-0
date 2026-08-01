import type { RuntimePackageEnvelope } from "./RuntimePackageEnvelope";
import type {
  PackageInstallRecord,
  RuntimePackageInstallPreview,
  PackageInstallResult,
  RuntimePackageInstallPolicy,
  PackageInstallDiagnostic,
} from "./PackageRegistryTypes";
import { validateRuntimePackageEnvelope } from "./RuntimePackageValidator";
import { evaluateRuntimePackageTrust } from "./RuntimePackageTrustService";
import { resolveInstallPolicyAction } from "./PackageInstallPolicy";
import { createRuntimeManifestFingerprint } from "./RuntimePackageFingerprint";
import { removeRuntimeManifest } from "../RuntimeRegistry";
import { isRuntimeActive } from "../activation/RuntimeActivationService";
let installedRecords: PackageInstallRecord[] = [];

// Load persisted packages from localStorage in browser context
if (typeof window !== "undefined" && window.localStorage) {
  try {
    const data = window.localStorage.getItem("axiom.installed_runtime_packages");
    if (data) {
      installedRecords = JSON.parse(data);
    }
  } catch (e) {
    console.error("Failed to load installed runtime packages from localStorage:", e);
  }
}

function saveToStorage() {
  if (typeof window !== "undefined" && window.localStorage) {
    try {
      window.localStorage.setItem("axiom.installed_runtime_packages", JSON.stringify(installedRecords));
    } catch (e) {
      console.error("Failed to save installed runtime packages to localStorage:", e);
    }
  }
}

export function getInstalledPackages(): PackageInstallRecord[] {
  return [...installedRecords];
}

export function clearInstalledPackagesRegistry(): void {
  installedRecords = [];
  saveToStorage();
}

export async function previewRuntimePackageInstall(
  rawPackage: string,
  policy?: RuntimePackageInstallPolicy
): Promise<{
  success: boolean;
  preview?: RuntimePackageInstallPreview;
  diagnostics: PackageInstallDiagnostic[];
}> {
  let parsed: unknown;
  try {
    parsed = JSON.parse(rawPackage);
  } catch (err) {
    const diag: PackageInstallDiagnostic = {
      severity: "error",
      code: "package_parse_failed",
      message: `Failed to parse package JSON: ${err instanceof Error ? err.message : String(err)}`,
    };
    return { success: false, diagnostics: [diag] };
  }

  const diagnostics = validateRuntimePackageEnvelope(parsed);
  const hasErrors = diagnostics.some((d) => d.severity === "error");
  if (hasErrors) {
    return { success: false, diagnostics };
  }

  const envelope = parsed as RuntimePackageEnvelope;

  // Evaluate trust asynchronously
  const trustResult = await evaluateRuntimePackageTrust({ envelope });
  diagnostics.push(...(trustResult.diagnostics as any[]));

  const policyAction = resolveInstallPolicyAction(trustResult.level, policy);

  const canInstall = policyAction !== "block" && trustResult.level !== "incompatible";
  const requiresConfirmation = policyAction === "confirm";

  const preview: RuntimePackageInstallPreview = {
    previewId: `prev-${Math.random().toString(36).substring(2, 11)}`,
    packageEnvelope: envelope,
    packageId: envelope.packageId,
    runtimeId: envelope.runtimeId,
    name: envelope.name,
    version: envelope.version,
    publisher: envelope.publisher,
    runtimeType: envelope.manifest.runtimeType,
    declaredCapabilities: envelope.manifest.capabilities,
    entryModuleUrl: envelope.manifest.entry.moduleUrl,
    trustLevel: trustResult.level,
    policyAction,
    canInstall,
    requiresConfirmation,
    diagnostics,
  };

  return {
    success: true,
    preview,
    diagnostics,
  };
}

export async function installRuntimePackage(
  preview: RuntimePackageInstallPreview,
  options?: {
    confirmed?: boolean;
  }
): Promise<PackageInstallResult> {
  const envelope = preview.packageEnvelope;
  const diagnostics = [...preview.diagnostics];

  // 1. Gating by policy action
  if (preview.policyAction === "block" || !preview.canInstall) {
    diagnostics.push({
      severity: "error",
      code: "tampered_package_blocked",
      message: "Package installation blocked due to safety policy constraints.",
    });
    return {
      success: false,
      status: "blocked",
      trustLevel: preview.trustLevel,
      diagnostics,
      preview,
    };
  }

  // 2. Requires user confirmation
  if (preview.requiresConfirmation && options?.confirmed !== true) {
    diagnostics.push({
      severity: "warning",
      code:
        preview.trustLevel === "unsigned"
          ? "unsigned_package_requires_confirmation"
          : "untrusted_package_requires_confirmation",
      message: `Package requires user confirmation before installing: ${preview.trustLevel} signer state.`,
    });
    return {
      success: false,
      status: "pending_confirmation",
      trustLevel: preview.trustLevel,
      diagnostics,
      preview,
    };
  }

  // 3. Check duplicate or upgrade status
  const existing = installedRecords.find((r) => r.packageId === preview.packageId && r.status === "installed");
  if (existing) {
    if (existing.version === preview.version) {
      diagnostics.push({
        severity: "error",
        code: "duplicate_package_version",
        message: `Package '${preview.packageId}' version ${preview.version} is already installed.`,
      });
      return {
        success: false,
        status: "failed",
        trustLevel: preview.trustLevel,
        diagnostics,
        preview,
      };
    } else {
      diagnostics.push({
        severity: "error",
        code: "upgrade_not_supported_yet",
        message: `Upgrades are not supported yet in Axiom Studio (existing: ${existing.version}, target: ${preview.version}).`,
      });
      return {
        success: false,
        status: "failed",
        trustLevel: preview.trustLevel,
        diagnostics,
        preview,
      };
    }
  }

  // Add the strict "no execution performed" diagnostic to the record logs
  diagnostics.push({
    severity: "info",
    code: "no_execution_performed",
    message: "Installation complete: Metadata persisted only. No code execution was triggered.",
  });

  diagnostics.push({
    severity: "info",
    code: "install_success",
    message: `Package '${preview.name}' successfully registered.`,
  });

  const record: PackageInstallRecord = {
    id: `rec-${Math.random().toString(36).substring(2, 11)}`,
    packageId: preview.packageId,
    runtimeId: preview.runtimeId,
    name: preview.name,
    version: preview.version,
    publisher: preview.publisher,
    installedAt: new Date().toISOString(),
    status: "installed",
    trustLevel: preview.trustLevel,
    policyAction: preview.policyAction,
    manifestFingerprint: envelope.integrity.manifestFingerprint,
    packageFingerprint: envelope.integrity.packageFingerprint,
    signature: envelope.signature
      ? {
          keyId: envelope.signature.keyId,
          algorithm: envelope.signature.algorithm,
          signedAt: envelope.signature.signedAt,
        }
      : undefined,
    diagnostics,
    manifest: envelope.manifest,
  };

  installedRecords.push(record);
  saveToStorage();

  return {
    success: true,
    record,
    diagnostics,
  };
}

export function uninstallRuntimePackage(packageId: string): {
  success: boolean;
  diagnostics: PackageInstallDiagnostic[];
} {
  const index = installedRecords.findIndex((r) => r.packageId === packageId && r.status === "installed");
  if (index === -1) {
    return {
      success: false,
      diagnostics: [
        {
          severity: "error",
          code: "invalid_runtime_package",
          message: `Cannot uninstall: Package '${packageId}' is not currently installed.`,
        },
      ],
    };
  }

  const record = installedRecords[index];
  removeRuntimeManifest(record.runtimeId, {
    expectedFingerprint: record.manifestFingerprint,
    isActive: isRuntimeActive(record.runtimeId),
  });

  installedRecords.splice(index, 1);
  saveToStorage();

  return {
    success: true,
    diagnostics: [
      {
        severity: "info",
        code: "uninstall_success",
        message: `Package '${packageId}' successfully uninstalled.`,
      },
    ],
  };
}
