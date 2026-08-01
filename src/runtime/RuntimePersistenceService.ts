import {
  type RuntimeRegistryEntry,
  getRuntimeManifestFingerprint,
} from "./RuntimeRegistry";
import { type ActivatedRuntime } from "./activation/RuntimeActivationTypes";
import {
  type AxiomProjectRuntimeBlock,
  type RuntimeEntryRecord,
  type RuntimeRestoredActivationLabel,
  type RuntimeExecutionRecord,
} from "../app/projects/projectDraft";

/**
 * Pure serializer. No side effects.
 * Converts live registry/activation/execution state into an AxiomProjectRuntimeBlock
 * suitable for persistence in the AXPKG project draft.
 */
export function serializeRuntimeState(
  registryEntries: RuntimeRegistryEntry[],
  activations: ActivatedRuntime[],
  executions: RuntimeExecutionRecord[],
): AxiomProjectRuntimeBlock {
  const registeredRuntimes: RuntimeEntryRecord[] = registryEntries.map((entry) => ({
    manifestId: entry.manifest.id,
    runtimeId: entry.manifest.id,
    runtimeName: entry.manifest.name,
    version: entry.manifest.version,
    publisher: entry.manifest.publisher,
    fingerprint: getRuntimeManifestFingerprint(entry.manifest),
    status: entry.status,
    registeredAt: entry.registeredAt,
    ...(entry.disabledAt ? { disabledAt: entry.disabledAt } : {}),
    ...(entry.rejectionReason ? { rejectionReason: entry.rejectionReason } : {}),
  }));

  const activationLabels: RuntimeRestoredActivationLabel[] = activations.map((active) => ({
    runtimeId: active.runtimeId,
    manifestId: active.manifestId,
    activatedAt: active.activatedAt,
    actionCount: active.actions.length,
    restoredStatus: "previouslyActive",
  }));

  return {
    schemaVersion: "0.3.0",
    savedAt: new Date().toISOString(),
    registeredRuntimes,
    activationLabels,
    executionHistory: [...executions],
  };
}
