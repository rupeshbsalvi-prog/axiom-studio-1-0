import {
  type RuntimeRegistryEntry,
  getRuntimeManifestFingerprint,
  disableRuntime,
} from "./RuntimeRegistry";
import { importExecutionHistory, clearExecutionLog } from "./activation/RuntimeActionDispatcher";
import { storeRestoredLabel, clearRestoredLabels } from "./RuntimeRestoredLabels";
import {
  type AxiomProjectRuntimeBlock,
  type RuntimeRestoredActivationLabel,
  type RuntimeExecutionRecord,
} from "../app/projects/projectDraft";

// ---------------------------------------------------------------------------
// Type guard
// ---------------------------------------------------------------------------

function isAxiomProjectRuntimeBlock(value: unknown): value is AxiomProjectRuntimeBlock {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return false;
  }
  const candidate = value as Partial<AxiomProjectRuntimeBlock>;
  return (
    candidate.schemaVersion === "0.3.0" &&
    Array.isArray(candidate.registeredRuntimes) &&
    Array.isArray(candidate.activationLabels) &&
    Array.isArray(candidate.executionHistory)
  );
}

// ---------------------------------------------------------------------------
// Hydration action types (planner output)
// ---------------------------------------------------------------------------

export type RuntimeHydrationAction =
  | { type: "restore_disabled"; runtimeId: string }
  | { type: "restore_activation_label"; label: RuntimeRestoredActivationLabel }
  | { type: "restore_execution_records"; records: RuntimeExecutionRecord[] }
  | { type: "skip"; runtimeId: string; reason: string };

export type RuntimeHydrationPlan = {
  actions: RuntimeHydrationAction[];
  warnings: string[];
};

// ---------------------------------------------------------------------------
// Phase 1: Pure planner (no side effects)
// ---------------------------------------------------------------------------

/**
 * Accepts unknown input to safely handle 0.2.0 drafts (no runtime block) and
 * corrupted blocks. Returns an empty plan for any invalid/missing input.
 */
export function planRuntimeHydration(
  block: unknown,
  liveEntries: RuntimeRegistryEntry[],
): RuntimeHydrationPlan {
  const actions: RuntimeHydrationAction[] = [];
  const warnings: string[] = [];

  if (!isAxiomProjectRuntimeBlock(block)) {
    // 0.2.0 draft or corrupted block — treat as no-op (backward compat)
    return { actions, warnings };
  }

  // Build a lookup of live registry entries by runtimeId for O(1) access.
  const liveByRuntimeId = new Map<string, RuntimeRegistryEntry>();
  for (const entry of liveEntries) {
    liveByRuntimeId.set(entry.manifest.id, entry);
  }

  // Track which runtimeIds are restorable (registered or disabled + fingerprint match).
  // Activation labels are only restored for runtimes in this set.
  const restorableRuntimeIds = new Set<string>();

  for (const record of block.registeredRuntimes) {
    // Skip unsafe states — never restore rejected or untrusted records.
    if (record.status === "rejected" || record.status === "untrusted") {
      warnings.push(
        `Skipped runtime '${record.runtimeId}': persisted status '${record.status}' is not restorable.`
      );
      actions.push({ type: "skip", runtimeId: record.runtimeId, reason: `status is '${record.status}'` });
      continue;
    }

    const liveEntry = liveByRuntimeId.get(record.runtimeId);

    if (!liveEntry) {
      warnings.push(
        `Skipped runtime '${record.runtimeId}': no live registered manifest found. Manifest may have been removed.`
      );
      actions.push({ type: "skip", runtimeId: record.runtimeId, reason: "live manifest not registered" });
      continue;
    }

    const liveFingerprint = getRuntimeManifestFingerprint(liveEntry.manifest);
    if (liveFingerprint !== record.fingerprint) {
      warnings.push(
        `Skipped runtime '${record.runtimeId}': fingerprint mismatch — manifest may have changed since last save.`
      );
      actions.push({ type: "skip", runtimeId: record.runtimeId, reason: "fingerprint mismatch" });
      continue;
    }

    // Fingerprint matched. Mark as restorable.
    restorableRuntimeIds.add(record.runtimeId);

    // Reapply disabled state only if the persisted record was disabled.
    if (record.status === "disabled" && liveEntry.status !== "disabled") {
      actions.push({ type: "restore_disabled", runtimeId: record.runtimeId });
    }
    // If status === "registered" and live entry is registered: no action needed.
  }

  // Restore activation labels only for runtimes that passed fingerprint matching.
  for (const label of block.activationLabels) {
    if (restorableRuntimeIds.has(label.runtimeId)) {
      actions.push({ type: "restore_activation_label", label });
    } else {
      warnings.push(
        `Activation label skipped for runtime '${label.runtimeId}': runtime was not restorable.`
      );
    }
  }

  // Always restore execution history (read-only; no replay).
  if (block.executionHistory.length > 0) {
    actions.push({ type: "restore_execution_records", records: block.executionHistory });
  }

  return { actions, warnings };
}

// ---------------------------------------------------------------------------
// Phase 2: Applier (explicit side effects)
// ---------------------------------------------------------------------------

export type HydrationResult = {
  restoredDisabledCount: number;
  restoredActivationLabelCount: number;
  restoredExecutionRecords: number;
  skippedCount: number;
  warnings: string[];
};

/**
 * Applies a RuntimeHydrationPlan produced by planRuntimeHydration.
 * This is the only function in this module that mutates runtime state.
 *
 * IMPORTANT: This function NEVER calls activateRuntime or dispatchRuntimeAction.
 */
export function applyRuntimeHydrationPlan(plan: RuntimeHydrationPlan): HydrationResult {
  clearRestoredLabels();
  clearExecutionLog();

  let restoredDisabledCount = 0;
  let restoredActivationLabelCount = 0;
  let restoredExecutionRecords = 0;
  let skippedCount = 0;

  for (const action of plan.actions) {
    switch (action.type) {
      case "restore_disabled":
        disableRuntime(action.runtimeId);
        restoredDisabledCount++;
        break;
      case "restore_activation_label":
        storeRestoredLabel(action.label);
        restoredActivationLabelCount++;
        break;
      case "restore_execution_records":
        importExecutionHistory(action.records);
        restoredExecutionRecords += action.records.length;
        break;
      case "skip":
        skippedCount++;
        break;
    }
  }

  return {
    restoredDisabledCount,
    restoredActivationLabelCount,
    restoredExecutionRecords,
    skippedCount,
    warnings: [...plan.warnings],
  };
}
