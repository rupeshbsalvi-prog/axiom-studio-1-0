import {
  type JsonValue,
  type RuntimeActivationContext,
  type RuntimeExecutionResult,
  type RuntimeExecutionFailureReason,
} from "./RuntimeActivationTypes";
import { type RuntimeExecutionRecord } from "../../app/projects/projectDraft";
import { getRegistryEntry } from "../RuntimeRegistry";
import { getActivatedRuntime } from "./RuntimeActivationService";
import { LOCAL_RUNTIME_ACTIONS, LOCAL_RUNTIME_EXECUTORS } from "./MockRuntimeExecutor";
import { evaluateExternalRuntimeAuthority } from "../../workspace/RuntimeAuthorityGate";
import {
  recordWorkspaceAuditEvent,
  createRuntimeExecutionRequestedEvent,
  createRuntimeExecutionCompletedEvent,
  createRuntimeExecutionFailedEvent,
  createRuntimeActionDispatchRequestedEvent,
  createRuntimeActionDryRunCompletedEvent,
  createRuntimeActionDryRunFailedEvent,
} from "../../workspace/WorkspaceAuditService";
import { verifyPromotedPackageLiveness } from "./RuntimeActivationEligibilityPolicy";
import { getMockHandler } from "./RuntimeMockActionRegistry";
import {
  type RuntimeActionDispatchResult,
  type RuntimeActionDispatchDiagnostic,
  type RuntimeActionDispatchDiagnosticCode,
} from "./RuntimeActionDispatchTypes";

// ---------------------------------------------------------------------------
// Execution history log — persisted to AXPKG on save
// ---------------------------------------------------------------------------

/** Max number of execution records retained in memory. Oldest evicted on overflow. */
const EXECUTION_LOG_CAP = 500;

const executionLog: RuntimeExecutionRecord[] = [];

function pushExecutionRecord(record: RuntimeExecutionRecord): void {
  if (executionLog.length >= EXECUTION_LOG_CAP) {
    executionLog.shift();
  }
  executionLog.push(record);
}

/** Returns a snapshot of the current execution log (oldest first). */
export function getExecutionLog(): RuntimeExecutionRecord[] {
  return [...executionLog];
}

/** Clears the in-memory execution log. */
export function clearExecutionLog(): void {
  executionLog.length = 0;
}

/**
 * Imports historical execution records from a restored AXPKG draft.
 * Records are appended in order. Cap is still enforced.
 */
export function importExecutionHistory(records: RuntimeExecutionRecord[]): void {
  for (const record of records) {
    pushExecutionRecord(record);
  }
}

function failDispatchAttempt(params: {
  runtimeId: string;
  actionId: string;
  attemptedAt: string;
  failureReason: RuntimeExecutionFailureReason;
  message: string;
}): never {
  pushExecutionRecord({
    id: `exec_err_${params.runtimeId}_${params.actionId}_${Date.now()}`,
    runtimeId: params.runtimeId,
    actionId: params.actionId,
    status: "failed",
    attemptedAt: params.attemptedAt,
    completedAt: new Date().toISOString(),
    durationMs: 0,
    failureReason: params.failureReason,
  });

  throw new Error(params.message);
}

export async function dispatchRuntimeAction(
  runtimeId: string,
  actionId: string,
  payload: JsonValue | undefined,
  context: RuntimeActivationContext
): Promise<RuntimeExecutionResult> {
  const attemptedAt = new Date().toISOString();
  const timestamp = attemptedAt;
  const recordId = `exec_${runtimeId}_${actionId}_${Date.now()}`;

  // 1. Preflight: Registry check
  const registryEntry = getRegistryEntry(runtimeId);
  if (!registryEntry) {
    const failureReason: RuntimeExecutionFailureReason = "runtime_not_found";
    recordWorkspaceAuditEvent(
      createRuntimeExecutionFailedEvent({
        id: `execution_fail_${runtimeId}_${actionId}_${Date.now()}`,
        title: "Runtime Execution Failed",
        message: `Execution failed: Runtime '${runtimeId}' was not found in the registry.`,
        timestamp,
        metadata: { phase: "preflight", failureReason },
      })
    );
    failDispatchAttempt({
      runtimeId,
      actionId,
      attemptedAt,
      failureReason,
      message: `Runtime '${runtimeId}' was not found in the registry.`,
    });
  }

  // 2. Preflight: Disabled check
  if (registryEntry.status === "disabled") {
    const failureReason: RuntimeExecutionFailureReason = "runtime_disabled";
    recordWorkspaceAuditEvent(
      createRuntimeExecutionFailedEvent({
        id: `execution_fail_${runtimeId}_${actionId}_${Date.now()}`,
        title: "Runtime Execution Failed",
        message: `Execution failed: Runtime '${runtimeId}' is disabled.`,
        timestamp,
        metadata: { phase: "preflight", failureReason },
      })
    );
    failDispatchAttempt({
      runtimeId,
      actionId,
      attemptedAt,
      failureReason,
      message: `Runtime '${runtimeId}' is disabled.`,
    });
  }

  // 3. Preflight: Activation check
  const activated = getActivatedRuntime(runtimeId);
  if (!activated || activated.status !== "active") {
    const failureReason: RuntimeExecutionFailureReason = "runtime_not_active";
    recordWorkspaceAuditEvent(
      createRuntimeExecutionFailedEvent({
        id: `execution_fail_${runtimeId}_${actionId}_${Date.now()}`,
        title: "Runtime Execution Failed",
        message: `Execution failed: Runtime '${runtimeId}' is not active.`,
        timestamp,
        metadata: { phase: "preflight", failureReason },
      })
    );
    failDispatchAttempt({
      runtimeId,
      actionId,
      attemptedAt,
      failureReason,
      message: `Runtime '${runtimeId}' is not active.`,
    });
  }

  // 4. Preflight: Action definition check
  const actions = LOCAL_RUNTIME_ACTIONS[runtimeId] || [];
  const actionDef = actions.find((a) => a.id === actionId);
  if (!actionDef) {
    const failureReason: RuntimeExecutionFailureReason = "action_not_found";
    recordWorkspaceAuditEvent(
      createRuntimeExecutionFailedEvent({
        id: `execution_fail_${runtimeId}_${actionId}_${Date.now()}`,
        title: "Runtime Execution Failed",
        message: `Execution failed: Action '${actionId}' is not defined for runtime '${runtimeId}'.`,
        timestamp,
        metadata: { phase: "preflight", failureReason },
      })
    );
    failDispatchAttempt({
      runtimeId,
      actionId,
      attemptedAt,
      failureReason,
      message: `Action '${actionId}' is not defined for runtime '${runtimeId}'.`,
    });
  }

  // 5. Preflight: Executor mapping check
  const executors = LOCAL_RUNTIME_EXECUTORS[runtimeId] || {};
  const executor = executors[actionId];
  if (!executor) {
    const failureReason: RuntimeExecutionFailureReason = "executor_missing";
    recordWorkspaceAuditEvent(
      createRuntimeExecutionFailedEvent({
        id: `execution_fail_${runtimeId}_${actionId}_${Date.now()}`,
        title: "Runtime Execution Failed",
        message: `Execution failed: No executor is mapped for action '${actionId}' in runtime '${runtimeId}'.`,
        timestamp,
        metadata: { phase: "preflight", failureReason },
      })
    );
    failDispatchAttempt({
      runtimeId,
      actionId,
      attemptedAt,
      failureReason,
      message: `No executor is mapped for action '${actionId}' in runtime '${runtimeId}'.`,
    });
  }

  // 6. Preflight: Authority gate check (Dual capability validation)
  const authorityCheck = evaluateExternalRuntimeAuthority({
    runtimeId,
    action: actionId,
    requiredCapabilities: actionDef.requiredCapabilities,
    declaredCapabilities: registryEntry.manifest.capabilities,
    grantedCapabilities: context.grantedCapabilities,
  });

  if (!authorityCheck.allowed) {
    const failureReason: RuntimeExecutionFailureReason = "authority_blocked";
    failDispatchAttempt({
      runtimeId,
      actionId,
      attemptedAt,
      failureReason,
      message: authorityCheck.reason || "Authority check failed",
    });
  }

  // 7. Request Logging: After all preflight checks pass
  const executionRequestedAt = new Date().toISOString();
  recordWorkspaceAuditEvent(
    createRuntimeExecutionRequestedEvent({
      id: `execution_request_${runtimeId}_${actionId}_${Date.now()}`,
      title: "Runtime Action Dispatch",
      message: `Executing action '${actionId}' on sandbox runtime '${runtimeId}'.`,
      timestamp: executionRequestedAt,
      metadata: { runtimeId, actionId },
    })
  );

  const startTime = Date.now();
  let timeoutId: any;

  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(new Error("timeout"));
    }, 8000);
  });

  try {
    const output = await Promise.race([executor(payload), timeoutPromise]);
    clearTimeout(timeoutId);
    const durationMs = Date.now() - startTime;
    const completedAt = new Date().toISOString();

    recordWorkspaceAuditEvent(
      createRuntimeExecutionCompletedEvent({
        id: `execution_complete_${runtimeId}_${actionId}_${Date.now()}`,
        title: "Runtime Action Completed",
        message: `Action '${actionId}' completed successfully on runtime '${runtimeId}' in ${durationMs}ms.`,
        timestamp: completedAt,
        metadata: { runtimeId, actionId, durationMs },
      })
    );

    pushExecutionRecord({
      id: recordId, runtimeId, actionId,
      status: "completed",
      attemptedAt, executionRequestedAt, completedAt,
      durationMs, output,
    });

    return {
      success: true,
      runtimeId,
      actionId,
      output,
      durationMs,
    };
  } catch (err: unknown) {
    clearTimeout(timeoutId);
    const durationMs = Date.now() - startTime;
    const completedAt = new Date().toISOString();
    const errMessage = err instanceof Error ? err.message : String(err);

    if (errMessage === "timeout") {
      const failureReason: RuntimeExecutionFailureReason = "timeout";
      recordWorkspaceAuditEvent(
        createRuntimeExecutionFailedEvent({
          id: `execution_fail_${runtimeId}_${actionId}_${Date.now()}`,
          title: "Runtime Execution Timed Out",
          message: `Action '${actionId}' timed out on runtime '${runtimeId}' after 8000ms.`,
          timestamp: completedAt,
          metadata: { runtimeId, actionId, durationMs, failureReason },
        })
      );
      pushExecutionRecord({
        id: recordId, runtimeId, actionId,
        status: "failed",
        attemptedAt, executionRequestedAt, completedAt,
        durationMs, failureReason,
      });
      return {
        success: false,
        runtimeId,
        actionId,
        failureReason,
        error: "Execution timed out after 8 seconds.",
        durationMs,
      };
    } else {
      const failureReason: RuntimeExecutionFailureReason = "executor_error";
      recordWorkspaceAuditEvent(
        createRuntimeExecutionFailedEvent({
          id: `execution_fail_${runtimeId}_${actionId}_${Date.now()}`,
          title: "Runtime Execution Failed",
          message: `Action '${actionId}' failed during execution: ${errMessage}`,
          timestamp: completedAt,
          metadata: { runtimeId, actionId, durationMs, failureReason },
        })
      );
      pushExecutionRecord({
        id: recordId, runtimeId, actionId,
        status: "failed",
        attemptedAt, executionRequestedAt, completedAt,
        durationMs, failureReason,
      });
      return {
        success: false,
        runtimeId,
        actionId,
        failureReason,
        error: errMessage,
        durationMs,
      };
    }
  }
}

// ---------------------------------------------------------------------------
// Phase 12 — Promoted Runtime Dry-Run Action Dispatch
//
// SECURITY CONTRACT (all guaranteed by construction):
//   - No import() of runtime package code
//   - No eval(), new Function(), script injection, or iframe execution
//   - No manifest.entry.moduleUrl execution
//   - No handler registration from manifest metadata
//   - All action handling routes through trusted local mock simulation handlers
//   - grantedCapabilities are read from the active runtime record, not the caller
// ---------------------------------------------------------------------------

// (All Phase 12 imports are at the top of this file)

// Dry-run security metadata injected on every audit event and result
const DRY_RUN_SECURITY_TAGS = {
  dryRun: true as const,
  noExecutionPerformed: true as const,
  runtimeCodeLoaded: false as const,
  moduleUrlExecuted: false as const,
} as const;

function makeDeniedResult(
  runtimeId: string,
  actionId: string,
  code: RuntimeActionDispatchDiagnosticCode,
  message: string,
  packageId?: string
): RuntimeActionDispatchResult {
  const diagnostic: RuntimeActionDispatchDiagnostic = {
    code,
    severity: "error",
    message,
    runtimeId,
    actionId,
    packageId,
  };
  return {
    status: "denied",
    runtimeId,
    actionId,
    ...DRY_RUN_SECURITY_TAGS,
    logs: [],
    diagnostics: [diagnostic],
    dispatchedAtUtc: new Date().toISOString(),
  };
}

/**
 * Phase 12 — Dispatch a dry-run action for an active, promoted, trusted runtime.
 *
 * This function is the ONLY promoted-package dispatch path. It does not
 * execute any runtime package code. All simulation is performed by trusted
 * local mock handlers registered in RuntimeMockActionRegistry.
 *
 * Caller must NOT supply grantedCapabilities — they are read from the
 * active runtime record produced by Phase 11 activation.
 */
export async function dispatchDryRunAction(input: {
  runtimeId: string;
  actionId: string;
  payload?: unknown;
}): Promise<RuntimeActionDispatchResult> {
  const { runtimeId, actionId, payload } = input;
  const dispatchedAtUtc = new Date().toISOString();

  // ── Precondition 1-4: Registry entry, allowlist gate, trust, promotion ──────
  const livenessResult = verifyPromotedPackageLiveness(runtimeId);
  if (!livenessResult.valid) {
    const code = livenessResult.code as RuntimeActionDispatchDiagnosticCode;
    const entry = getRegistryEntry(runtimeId);
    const packageId = entry?.packageId;

    recordWorkspaceAuditEvent(
      createRuntimeActionDispatchRequestedEvent({
        id: `dry_run_req_${runtimeId}_${actionId}_${Date.now()}`,
        title: "Dry-Run Dispatch Requested",
        message: `Dry-run dispatch requested for action '${actionId}' on runtime '${runtimeId}'.`,
        timestamp: dispatchedAtUtc,
        metadata: {
          ...DRY_RUN_SECURITY_TAGS,
          runtimeId,
          actionId,
          packageId,
        },
      })
    );

    const result = makeDeniedResult(runtimeId, actionId, code, livenessResult.message, packageId);

    recordWorkspaceAuditEvent(
      createRuntimeActionDryRunFailedEvent({
        id: `dry_run_fail_${runtimeId}_${actionId}_${Date.now()}`,
        title: "Dry-Run Dispatch Denied",
        message: livenessResult.message,
        timestamp: new Date().toISOString(),
        metadata: {
          ...DRY_RUN_SECURITY_TAGS,
          runtimeId,
          actionId,
          packageId,
          diagnostics: result.diagnostics,
        },
      })
    );

    return result;
  }

  const entry = getRegistryEntry(runtimeId)!;
  const packageId = entry.packageId;

  // ── Emit dispatch-requested event (preconditions 1-4 passed) ─────────────
  recordWorkspaceAuditEvent(
    createRuntimeActionDispatchRequestedEvent({
      id: `dry_run_req_${runtimeId}_${actionId}_${Date.now()}`,
      title: "Dry-Run Dispatch Requested",
      message: `Dry-run dispatch requested for action '${actionId}' on runtime '${runtimeId}'.`,
      timestamp: dispatchedAtUtc,
      metadata: {
        ...DRY_RUN_SECURITY_TAGS,
        runtimeId,
        actionId,
        packageId,
      },
    })
  );

  // ── Precondition 5: Active runtime state ──────────────────────────────────
  const activeRuntime = getActivatedRuntime(runtimeId);
  if (!activeRuntime || activeRuntime.status !== "active") {
    const result = makeDeniedResult(
      runtimeId,
      actionId,
      "runtime_not_active",
      `Dispatch denied: Runtime '${runtimeId}' is not currently active.`,
      packageId
    );
    recordWorkspaceAuditEvent(
      createRuntimeActionDryRunFailedEvent({
        id: `dry_run_fail_${runtimeId}_${actionId}_${Date.now()}`,
        title: "Dry-Run Dispatch Denied — Runtime Not Active",
        message: result.diagnostics[0].message,
        timestamp: new Date().toISOString(),
        metadata: {
          ...DRY_RUN_SECURITY_TAGS,
          runtimeId,
          actionId,
          packageId,
          diagnostics: result.diagnostics,
        },
      })
    );
    return result;
  }

  // ── Precondition 8: Action in trusted local action definition map ─────────
  const actionDefs = LOCAL_RUNTIME_ACTIONS[runtimeId] ?? [];
  const actionDef = actionDefs.find((a) => a.id === actionId);
  if (!actionDef) {
    const result = makeDeniedResult(
      runtimeId,
      actionId,
      "action_not_declared",
      `Dispatch denied: Action '${actionId}' is not declared in the trusted action definition map for runtime '${runtimeId}'.`,
      packageId
    );
    recordWorkspaceAuditEvent(
      createRuntimeActionDryRunFailedEvent({
        id: `dry_run_fail_${runtimeId}_${actionId}_${Date.now()}`,
        title: "Dry-Run Dispatch Denied — Action Not Declared",
        message: result.diagnostics[0].message,
        timestamp: new Date().toISOString(),
        metadata: {
          ...DRY_RUN_SECURITY_TAGS,
          runtimeId,
          actionId,
          packageId,
          diagnostics: result.diagnostics,
        },
      })
    );
    return result;
  }

  // ── Precondition 9: Trusted local mock handler exists ────────────────────
  const handler = getMockHandler(runtimeId, actionId);
  if (!handler) {
    const result = makeDeniedResult(
      runtimeId,
      actionId,
      "mock_handler_missing",
      `Dispatch denied: No trusted local mock handler is registered for action '${actionId}' on runtime '${runtimeId}'.`,
      packageId
    );
    recordWorkspaceAuditEvent(
      createRuntimeActionDryRunFailedEvent({
        id: `dry_run_fail_${runtimeId}_${actionId}_${Date.now()}`,
        title: "Dry-Run Dispatch Denied — No Mock Handler",
        message: result.diagnostics[0].message,
        timestamp: new Date().toISOString(),
        metadata: {
          ...DRY_RUN_SECURITY_TAGS,
          runtimeId,
          actionId,
          packageId,
          diagnostics: result.diagnostics,
        },
      })
    );
    return result;
  }

  // ── Precondition 10: Required capabilities ⊆ activeRuntime.grantedCapabilities
  // Read from the active runtime record — never from the caller.
  const grantedCapabilities = activeRuntime.grantedCapabilities;
  const missingCaps = actionDef.requiredCapabilities.filter(
    (cap) => !grantedCapabilities.includes(cap)
  );
  if (missingCaps.length > 0) {
    const result = makeDeniedResult(
      runtimeId,
      actionId,
      "capability_denied",
      `Dispatch denied: Action '${actionId}' requires capabilities [${missingCaps.join(", ")}] not present in active runtime grants.`,
      packageId
    );
    recordWorkspaceAuditEvent(
      createRuntimeActionDryRunFailedEvent({
        id: `dry_run_fail_${runtimeId}_${actionId}_${Date.now()}`,
        title: "Dry-Run Dispatch Denied — Capability Denied",
        message: result.diagnostics[0].message,
        timestamp: new Date().toISOString(),
        metadata: {
          ...DRY_RUN_SECURITY_TAGS,
          runtimeId,
          actionId,
          packageId,
          missingCaps,
          diagnostics: result.diagnostics,
        },
      })
    );
    return result;
  }

  // ── All preconditions satisfied — invoke trusted mock handler ─────────────
  try {
    const handlerResult = await handler(payload, { runtimeId, actionId });

    const successDiagnostic: RuntimeActionDispatchDiagnostic = {
      code: "dry_run_simulated",
      severity: "info",
      message: "Dry-run simulation completed successfully.",
      runtimeId,
      actionId,
      packageId,
    };

    const finalResult: RuntimeActionDispatchResult = {
      status: "simulated",
      runtimeId,
      actionId,
      ...DRY_RUN_SECURITY_TAGS,
      output: handlerResult.output,
      preview: handlerResult.preview,
      logs: handlerResult.logs,
      diagnostics: [successDiagnostic],
      dispatchedAtUtc,
    };

    recordWorkspaceAuditEvent(
      createRuntimeActionDryRunCompletedEvent({
        id: `dry_run_ok_${runtimeId}_${actionId}_${Date.now()}`,
        title: "Dry-Run Dispatch Completed",
        message: `Dry-run action '${actionId}' simulated successfully on runtime '${runtimeId}'.`,
        timestamp: new Date().toISOString(),
        metadata: {
          ...DRY_RUN_SECURITY_TAGS,
          runtimeId,
          actionId,
          packageId,
          output: handlerResult.output,
          preview: handlerResult.preview,
        },
      })
    );

    return finalResult;
  } catch (err: unknown) {
    const errMessage = err instanceof Error ? err.message : String(err);
    const result = makeDeniedResult(
      runtimeId,
      actionId,
      "dry_run_failed",
      `Dry-run handler threw an error for action '${actionId}': ${errMessage}`,
      packageId
    );
    const failResult: RuntimeActionDispatchResult = { ...result, status: "failed" };

    recordWorkspaceAuditEvent(
      createRuntimeActionDryRunFailedEvent({
        id: `dry_run_fail_${runtimeId}_${actionId}_${Date.now()}`,
        title: "Dry-Run Dispatch Failed",
        message: failResult.diagnostics[0].message,
        timestamp: new Date().toISOString(),
        metadata: {
          ...DRY_RUN_SECURITY_TAGS,
          runtimeId,
          actionId,
          packageId,
          diagnostics: failResult.diagnostics,
        },
      })
    );

    return failResult;
  }
}
