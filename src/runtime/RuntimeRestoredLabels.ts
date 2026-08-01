import type { RuntimeRestoredActivationLabel } from "../app/projects/projectDraft";

/**
 * Module-level store for "previouslyActive" UI labels restored from AXPKG.
 * Isolated from RuntimeActivationService — ActivatedRuntime.status is unchanged.
 * The Registry Panel reads these to show "Previously active — needs reactivation".
 */
const restoredLabels = new Map<string, RuntimeRestoredActivationLabel>();

export function storeRestoredLabel(label: RuntimeRestoredActivationLabel): void {
  restoredLabels.set(label.runtimeId, label);
}

export function getRestoredLabel(runtimeId: string): RuntimeRestoredActivationLabel | undefined {
  return restoredLabels.get(runtimeId);
}

export function getAllRestoredLabels(): RuntimeRestoredActivationLabel[] {
  return Array.from(restoredLabels.values());
}

export function clearRestoredLabels(): void {
  restoredLabels.clear();
}
