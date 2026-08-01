import {
  type RuntimeManifest,
  type SignatureVerificationStatus,
  type SignatureVerificationContext,
} from "./manifest/RuntimeManifestTypes";
import { validateRuntimeManifest } from "./manifest/RuntimeManifestValidator";
import { verifyRuntimeSignature } from "./manifest/RuntimeSignatureVerifier";
import {
  recordWorkspaceAuditEvent,
  createRuntimeManifestValidatedEvent,
  createRuntimeManifestRegisteredEvent,
  createRuntimeManifestRejectedEvent,
  createRuntimeManifestDisabledEvent,
  createRuntimeManifestEnabledEvent,
} from "../workspace/WorkspaceAuditService";

export type RuntimeRegistrationStatus = "registered" | "disabled" | "rejected" | "untrusted";

export interface RuntimeRegistryEntry {
  manifest: RuntimeManifest;
  status: RuntimeRegistrationStatus;
  verificationStatus: SignatureVerificationStatus;
  registeredAt: string;
  disabledAt?: string;
  rejectionReason?: string;
  isPromoted?: boolean;
  manifestFingerprint?: string;
  packageId?: string;
}

const registryEntries = new Map<string, RuntimeRegistryEntry>();

export function getRuntimeManifestFingerprint(manifest: RuntimeManifest): string {
  return JSON.stringify({
    id: manifest.id,
    version: manifest.version,
    publisher: manifest.publisher,
    runtimeType: manifest.runtimeType,
    moduleUrl: manifest.entry.moduleUrl,
    integrity: manifest.entry.integrity ?? null,
    signature: manifest.entry.signature ?? null,
    signatureMode: manifest.entry.signatureMode ?? null,
    capabilities: [...manifest.capabilities].sort(),
    compatibility: manifest.compatibility,
  });
}

export function getRawManifestFingerprint(candidate: unknown): string {
  if (!candidate || typeof candidate !== "object") return "";
  const c = candidate as Record<string, any>;
  return JSON.stringify({
    id: c.id ?? "",
    version: c.version ?? "",
    publisher: c.publisher ?? "",
    runtimeType: c.runtimeType ?? "",
    moduleUrl: c.entry?.moduleUrl ?? "",
    integrity: c.entry?.integrity ?? null,
    signature: c.entry?.signature ?? null,
    signatureMode: c.entry?.signatureMode ?? null,
    capabilities: Array.isArray(c.capabilities) ? [...c.capabilities].sort() : [],
    compatibility: c.compatibility ?? null,
  });
}

export function registerRuntimeManifest(
  manifest: any,
  context: SignatureVerificationContext
): RuntimeRegistryEntry {
  const timestamp = new Date().toISOString();
  const candidateId = manifest?.id || "unknown";

  // 1. Schema Validation
  const validation = validateRuntimeManifest(manifest);
  if (!validation.valid) {
    const entry: RuntimeRegistryEntry = {
      manifest: manifest as RuntimeManifest,
      status: "rejected",
      verificationStatus: "invalid",
      registeredAt: timestamp,
      rejectionReason: validation.error || "Schema validation failed",
    };

    recordWorkspaceAuditEvent(
      createRuntimeManifestRejectedEvent({
        id: `manifest_reject_${candidateId}_${Date.now()}`,
        title: "Runtime Manifest Rejected",
        message: `Schema validation failed for runtime '${candidateId}': ${validation.error}`,
        timestamp,
        metadata: { manifestId: candidateId, reason: validation.error },
      })
    );

    return entry;
  }

  const typedManifest = manifest as RuntimeManifest;

  // 2. Idempotency Check (Unchanged fingerprint)
  if (registryEntries.has(typedManifest.id)) {
    const existing = registryEntries.get(typedManifest.id)!;
    if (existing.status === "registered" || existing.status === "disabled") {
      const existingFingerprint = getRuntimeManifestFingerprint(existing.manifest);
      const newFingerprint = getRuntimeManifestFingerprint(typedManifest);

      if (existingFingerprint === newFingerprint) {
        // Return existing entry, skip validation and registration logging
        return existing;
      }

      // If ID matches but fingerprint differs -> Duplicate conflict rejection
      const errorMsg = `Duplicate runtime ID: '${typedManifest.id}' is already registered with a different configuration.`;
      const entry: RuntimeRegistryEntry = {
        manifest: typedManifest,
        status: "rejected",
        verificationStatus: "invalid",
        registeredAt: timestamp,
        rejectionReason: errorMsg,
      };

      recordWorkspaceAuditEvent(
        createRuntimeManifestRejectedEvent({
          id: `manifest_reject_${typedManifest.id}_${Date.now()}`,
          title: "Runtime Manifest Rejected",
          message: errorMsg,
          timestamp,
          metadata: { manifestId: typedManifest.id, reason: errorMsg },
        })
      );

      return entry;
    }
  }

  // 3. Signature Verification
  const verification = verifyRuntimeSignature(typedManifest, context);
  const allowedStatus = ["trusted", "development"].includes(verification.status);

  if (!allowedStatus) {
    const errorMsg = verification.reason || `Signature verification failed: status is '${verification.status}'`;
    const entry: RuntimeRegistryEntry = {
      manifest: typedManifest,
      status: "rejected",
      verificationStatus: verification.status,
      registeredAt: timestamp,
      rejectionReason: errorMsg,
    };

    recordWorkspaceAuditEvent(
      createRuntimeManifestRejectedEvent({
        id: `manifest_reject_${typedManifest.id}_${Date.now()}`,
        title: "Runtime Manifest Rejected",
        message: `Signature verification failed for runtime '${typedManifest.id}': ${errorMsg}`,
        timestamp,
        metadata: {
          manifestId: typedManifest.id,
          verificationStatus: verification.status,
          reason: errorMsg,
        },
      })
    );

    return entry;
  }

  // Log validation success (since this is a new or replacement registration)
  recordWorkspaceAuditEvent(
    createRuntimeManifestValidatedEvent({
      id: `manifest_validate_${typedManifest.id}_${Date.now()}`,
      title: "Runtime Manifest Validated",
      message: `Successfully validated schema and signature for runtime '${typedManifest.id}'.`,
      timestamp,
      metadata: { manifestId: typedManifest.id, verificationStatus: verification.status },
    })
  );

  // 4. Register Entry
  const entry: RuntimeRegistryEntry = {
    manifest: typedManifest,
    status: "registered",
    verificationStatus: verification.status,
    registeredAt: timestamp,
  };

  registryEntries.set(typedManifest.id, entry);

  recordWorkspaceAuditEvent(
    createRuntimeManifestRegisteredEvent({
      id: `manifest_register_${typedManifest.id}_${Date.now()}`,
      title: "Runtime Manifest Registered",
      message: `Successfully registered runtime '${typedManifest.name}' (${typedManifest.id}).`,
      timestamp,
      metadata: { manifestId: typedManifest.id },
    })
  );

  return entry;
}

export function disableRuntime(id: string): void {
  const entry = registryEntries.get(id);
  if (entry && entry.status === "registered") {
    const timestamp = new Date().toISOString();
    entry.status = "disabled";
    entry.disabledAt = timestamp;
    registryEntries.set(id, entry);

    recordWorkspaceAuditEvent(
      createRuntimeManifestDisabledEvent({
        id: `manifest_disable_${id}_${Date.now()}`,
        title: "Runtime Manifest Disabled",
        message: `Runtime '${entry.manifest.name}' (${id}) has been disabled.`,
        timestamp,
        metadata: { manifestId: id },
      })
    );
  }
}

export function enableRuntime(id: string): void {
  const entry = registryEntries.get(id);
  if (entry && entry.status === "disabled") {
    const timestamp = new Date().toISOString();
    entry.status = "registered";
    delete entry.disabledAt;
    registryEntries.set(id, entry);

    recordWorkspaceAuditEvent(
      createRuntimeManifestEnabledEvent({
        id: `manifest_enable_${id}_${Date.now()}`,
        title: "Runtime Manifest Enabled",
        message: `Runtime '${entry.manifest.name}' (${id}) has been enabled.`,
        timestamp,
        metadata: { manifestId: id },
      })
    );
  }
}

export function getRegistryEntry(id: string): RuntimeRegistryEntry | undefined {
  return registryEntries.get(id);
}

export function getAllRegistryEntries(): RuntimeRegistryEntry[] {
  return Array.from(registryEntries.values());
}

export function getRegisteredManifests(): RuntimeManifest[] {
  const manifests: RuntimeManifest[] = [];
  for (const entry of registryEntries.values()) {
    if (entry.status === "registered") {
      manifests.push(entry.manifest);
    }
  }
  return manifests;
}

export function clearRuntimeRegistry(): void {
  registryEntries.clear();
}

export function removeRuntimeManifest(
  id: string,
  options?: {
    expectedFingerprint?: string;
    isActive?: boolean;
  }
): boolean {
  const entry = registryEntries.get(id);
  if (!entry) return false;

  if (entry.isPromoted !== true) {
    return false;
  }

  if (options?.expectedFingerprint && entry.manifestFingerprint !== options.expectedFingerprint) {
    return false;
  }

  if (options?.isActive) {
    return false;
  }

  return registryEntries.delete(id);
}

export function promoteManifestToRegistry(
  manifest: any,
  trustLevel: string,
  allowUnsafe = false,
  packageId?: string
): RuntimeRegistryEntry {
  const timestamp = new Date().toISOString();
  const candidateId = manifest?.id || "unknown";

  // 1. Schema Validation
  const validation = validateRuntimeManifest(manifest);
  if (!validation.valid) {
    throw new Error(`Promoted manifest schema validation failed for runtime '${candidateId}': ${validation.error}`);
  }

  const typedManifest = manifest as RuntimeManifest;

  // Guardrail 1: Non-trusted trust levels must be rejected unless allowUnsafe is explicitly allowed
  if (trustLevel !== "trusted" && !allowUnsafe) {
    throw new Error(`Promotion blocked: Non-trusted package '${candidateId}' cannot be promoted under default policy.`);
  }

  const newFingerprint = getRuntimeManifestFingerprint(typedManifest);

  // 2. Idempotency & Conflict Check
  if (registryEntries.has(typedManifest.id)) {
    const existing = registryEntries.get(typedManifest.id)!;
    const existingFingerprint = getRuntimeManifestFingerprint(existing.manifest);

    if (existingFingerprint === newFingerprint) {
      // Idempotent duplicate: return existing registry entry, do not create duplicate audit spam
      return existing;
    } else {
      // Conflict: Duplicate ID with different fingerprint configuration
      throw new Error(`Conflict: Duplicate runtime ID '${typedManifest.id}' is already registered with a different configuration.`);
    }
  }

  // 3. Map trust status into registry semantics
  let status: RuntimeRegistrationStatus = "registered";
  let verificationStatus: SignatureVerificationStatus = "trusted";

  if (trustLevel === "unsigned") {
    status = "untrusted";
    verificationStatus = "missing";
  } else if (trustLevel === "untrusted") {
    status = "untrusted";
    verificationStatus = "untrusted";
  } else if (trustLevel === "tampered") {
    status = "rejected";
    verificationStatus = "invalid";
  }

  const entry: RuntimeRegistryEntry = {
    manifest: typedManifest,
    status,
    verificationStatus,
    registeredAt: timestamp,
    isPromoted: true,
    manifestFingerprint: newFingerprint,
    packageId,
  };

  // Register Entry in the active Map (Metadata only)
  registryEntries.set(typedManifest.id, entry);

  recordWorkspaceAuditEvent(
    createRuntimeManifestValidatedEvent({
      id: `manifest_validate_promoted_${typedManifest.id}_${Date.now()}`,
      title: "Promoted Runtime Manifest Validated",
      message: `Successfully validated schema for promoted runtime '${typedManifest.id}'.`,
      timestamp,
      metadata: {
        manifestId: typedManifest.id,
        verificationStatus,
        source: "runtime_package_promotion",
        noExecutionPerformed: true,
      },
    })
  );

  recordWorkspaceAuditEvent(
    createRuntimeManifestRegisteredEvent({
      id: `manifest_register_promoted_${typedManifest.id}_${Date.now()}`,
      title: "Promoted Runtime Manifest Registered",
      message: `Successfully promoted runtime '${typedManifest.name}' (${typedManifest.id}).`,
      timestamp,
      metadata: {
        manifestId: typedManifest.id,
        source: "runtime_package_promotion",
        noExecutionPerformed: true,
      },
    })
  );

  return entry;
}

