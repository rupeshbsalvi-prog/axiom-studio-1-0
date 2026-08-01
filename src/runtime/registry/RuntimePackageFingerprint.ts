import type { RuntimePackageEnvelope } from "./RuntimePackageEnvelope";
import { stableJsonStringify, cyrb53 } from "../../app/projects/axpkg/stableJson";

export function createRuntimeManifestFingerprint(manifest: any): string {
  return cyrb53(stableJsonStringify(manifest));
}

export function createRuntimePackageFingerprint(envelope: RuntimePackageEnvelope): string {
  // Exclude signature and integrity.packageFingerprint (and integrity.manifestFingerprint if it was calculated afterwards,
  // but to match the required formula: "package envelope without signature and without integrity.packageFingerprint")
  const { signature, integrity, ...coreEnvelope } = envelope;
  
  // Re-include integrity block but without the packageFingerprint property to avoid self-reference
  const cleanedIntegrity = integrity
    ? {
        algorithm: integrity.algorithm,
        manifestFingerprint: integrity.manifestFingerprint,
      }
    : undefined;

  const targetEnvelope = {
    ...coreEnvelope,
    integrity: cleanedIntegrity,
  };

  return cyrb53(stableJsonStringify(targetEnvelope));
}

export function createRuntimePackageSigningPayload(envelope: RuntimePackageEnvelope): string {
  // Exclude signature block
  const { signature, ...unsignedEnvelope } = envelope;
  return stableJsonStringify(unsignedEnvelope);
}
