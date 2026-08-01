import {
  type ActivatedRuntime,
  type RuntimeActivationFailureReason,
} from "./RuntimeActivationTypes";
import { type RuntimeCapability } from "../manifest/RuntimeManifestTypes";
import { getRegistryEntry } from "../RuntimeRegistry";
import { LOCAL_RUNTIME_ACTIONS } from "./MockRuntimeExecutor";
import {
  recordWorkspaceAuditEvent,
  createRuntimeActivationRequestedEvent,
  createRuntimeActivationCompletedEvent,
  createRuntimeActivationFailedEvent,
  createRuntimeActivationEligibilityCheckedEvent,
} from "../../workspace/WorkspaceAuditService";
import { checkActivationEligibility } from "./RuntimeActivationEligibilityPolicy";

const activeRuntimes = new Map<string, ActivatedRuntime>();

export async function activateRuntime(
  runtimeId: string,
  context: { grantedCapabilities: RuntimeCapability[] }
): Promise<ActivatedRuntime> {
  const timestamp = new Date().toISOString();

  // Log Activation Request
  recordWorkspaceAuditEvent(
    createRuntimeActivationRequestedEvent({
      id: `activation_request_${runtimeId}_${Date.now()}`,
      title: "Runtime Activation Requested",
      message: `Request received to activate runtime '${runtimeId}'.`,
      timestamp,
      metadata: { runtimeId },
    })
  );

  // 1. Run pure eligibility check
  const eligibility = checkActivationEligibility(runtimeId, context);

  // 2. Emit eligibility checked event (Only inside explicit activation attempt!)
  recordWorkspaceAuditEvent(
    createRuntimeActivationEligibilityCheckedEvent({
      id: `activation_eligibility_${runtimeId}_${Date.now()}`,
      title: "Runtime Activation Eligibility Checked",
      message: eligibility.eligible
        ? `Runtime '${runtimeId}' passed activation eligibility checks.`
        : `Runtime '${runtimeId}' failed activation eligibility check: ${eligibility.reason}.`,
      timestamp,
      metadata: {
        runtimeId,
        eligible: eligibility.eligible,
        reason: eligibility.reason,
        diagnostics: eligibility.diagnostics,
      },
    })
  );

  // 3. Fail closed if not eligible
  if (!eligibility.eligible) {
    let reason: RuntimeActivationFailureReason = "activation_error";
    if (eligibility.reason === "runtime_not_found") {
      reason = "runtime_not_found";
    } else if (eligibility.reason === "runtime_not_registered" || eligibility.reason === "package_not_installed") {
      reason = "runtime_disabled";
    }

    const errorMsg = eligibility.diagnostics[0]?.message || `Activation failed: Runtime '${runtimeId}' is ineligible.`;

    recordWorkspaceAuditEvent(
      createRuntimeActivationFailedEvent({
        id: `activation_fail_${runtimeId}_${Date.now()}`,
        title: "Runtime Activation Failed",
        message: errorMsg,
        timestamp,
        metadata: {
          runtimeId,
          reason,
          availableActionsCount: 0,
          status: "failed",
        },
      })
    );
    throw new Error(errorMsg);
  }

  const registryEntry = getRegistryEntry(runtimeId)!;

  // 4. Preflight: Action Definition Check
  const actions = LOCAL_RUNTIME_ACTIONS[runtimeId];
  if (!actions || actions.length === 0) {
    const reason: RuntimeActivationFailureReason = "no_actions_defined";
    const errorMsg = `Activation failed: No action definitions mapped for runtime '${runtimeId}'.`;

    recordWorkspaceAuditEvent(
      createRuntimeActivationFailedEvent({
        id: `activation_fail_${runtimeId}_${Date.now()}`,
        title: "Runtime Activation Failed",
        message: errorMsg,
        timestamp,
        metadata: {
          runtimeId,
          reason,
          availableActionsCount: 0,
          status: "failed",
        },
      })
    );
    throw new Error(errorMsg);
  }

  // 5. Successful Activation
  const activeRecord: ActivatedRuntime = {
    runtimeId,
    manifestId: registryEntry.manifest.id,
    actions,
    status: "active",
    activatedAt: timestamp,
    grantedCapabilities: context.grantedCapabilities,
  };

  activeRuntimes.set(runtimeId, activeRecord);

  recordWorkspaceAuditEvent(
    createRuntimeActivationCompletedEvent({
      id: `activation_complete_${runtimeId}_${Date.now()}`,
      title: "Runtime Activated",
      message: `Successfully activated sandbox runtime '${registryEntry.manifest.name}' (${runtimeId}) with ${actions.length} actions.`,
      timestamp,
      metadata: {
        runtimeId,
        availableActionsCount: actions.length,
        status: "active",
      },
    })
  );

  return activeRecord;
}

export function deactivateRuntime(runtimeId: string): void {
  const active = activeRuntimes.get(runtimeId);
  if (active) {
    activeRuntimes.delete(runtimeId);
  }
}

export function getActivatedRuntime(runtimeId: string): ActivatedRuntime | undefined {
  return activeRuntimes.get(runtimeId);
}

export function isRuntimeActive(runtimeId: string): boolean {
  const active = activeRuntimes.get(runtimeId);
  return active ? active.status === "active" : false;
}

export function clearActiveRuntimes(): void {
  activeRuntimes.clear();
}

/** Returns all currently activated runtimes. Used by RuntimePersistenceService for serialization. */
export function getAllActivatedRuntimes(): ActivatedRuntime[] {
  return Array.from(activeRuntimes.values());
}
