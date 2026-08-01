import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  dispatchRuntimeAction,
  getExecutionLog,
  clearExecutionLog,
  importExecutionHistory,
} from "../RuntimeActionDispatcher";
import {
  registerRuntimeManifest,
  disableRuntime,
  clearRuntimeRegistry,
} from "../../RuntimeRegistry";
import {
  activateRuntime,
  clearActiveRuntimes,
} from "../RuntimeActivationService";
import {
  getWorkspaceAuditEvents,
  clearWorkspaceAuditEvents,
} from "../../../workspace/WorkspaceAuditService";
import { type RuntimeManifest, type RuntimeCapability } from "../../manifest/RuntimeManifestTypes";
import { type RuntimeActivationContext } from "../RuntimeActivationTypes";
import { LOCAL_RUNTIME_EXECUTORS } from "../MockRuntimeExecutor";

describe("RuntimeActionDispatcher", () => {
  const mockManifest: RuntimeManifest = {
    manifestVersion: "1.0",
    id: "mock-motion-studio",
    name: "Mock Motion Studio",
    version: "1.0.0",
    publisher: "Axiom",
    runtimeType: "studio",
    entry: {
      moduleUrl: "/runtime-modules/mock-motion-studio.js",
      signatureMode: "development",
    },
    capabilities: ["readProject", "writeProject"],
    compatibility: {
      axiomVersion: "1.0.0",
      apiVersion: "1",
    },
  };

  const defaultContext: RuntimeActivationContext = {
    runtimeId: "mock-motion-studio",
    grantedCapabilities: ["readProject", "writeProject"],
  };

  beforeEach(() => {
    clearRuntimeRegistry();
    clearActiveRuntimes();
    clearWorkspaceAuditEvents();
    clearExecutionLog();
    vi.useRealTimers();
  });

  it("blocks unregistered runtimes with no requested log", async () => {
    clearWorkspaceAuditEvents();

    await expect(
      dispatchRuntimeAction("mock-motion-studio", "renderMotionFrame", {}, {
        grantedCapabilities: ["readProject"],
      } as RuntimeActivationContext)
    ).rejects.toThrow("was not found in the registry");

    const events = getWorkspaceAuditEvents();
    expect(events.some((e) => e.type === "runtime_execution_requested")).toBe(false);
    expect(events.some((e) => e.type === "runtime_execution_failed")).toBe(true);
  });

  it("blocks disabled runtimes with no requested log", async () => {
    registerRuntimeManifest(mockManifest, { isDevelopment: true });
    disableRuntime("mock-motion-studio");
    clearWorkspaceAuditEvents();

    await expect(
      dispatchRuntimeAction("mock-motion-studio", "renderMotionFrame", {}, defaultContext)
    ).rejects.toThrow("is disabled");

    const events = getWorkspaceAuditEvents();
    expect(events.some((e) => e.type === "runtime_execution_requested")).toBe(false);
    expect(events.some((e) => e.type === "runtime_execution_failed")).toBe(true);
  });

  it("blocks inactive runtimes with no requested log", async () => {
    registerRuntimeManifest(mockManifest, { isDevelopment: true });
    clearWorkspaceAuditEvents();

    await expect(
      dispatchRuntimeAction("mock-motion-studio", "renderMotionFrame", {}, defaultContext)
    ).rejects.toThrow("is not active");

    const events = getWorkspaceAuditEvents();
    expect(events.some((e) => e.type === "runtime_execution_requested")).toBe(false);
    expect(events.some((e) => e.type === "runtime_execution_failed")).toBe(true);
  });

  it("blocks unknown actions with no requested log", async () => {
    registerRuntimeManifest(mockManifest, { isDevelopment: true });
    await activateRuntime("mock-motion-studio", defaultContext);
    clearWorkspaceAuditEvents();

    await expect(
      dispatchRuntimeAction("mock-motion-studio", "unknownAction", {}, defaultContext)
    ).rejects.toThrow("is not defined");

    const events = getWorkspaceAuditEvents();
    expect(events.some((e) => e.type === "runtime_execution_requested")).toBe(false);
    expect(events.some((e) => e.type === "runtime_execution_failed")).toBe(true);
  });

  it("blocks executions when missing manifest-declared capability", async () => {
    // Modify manifest so it doesn't declare 'writeProject'
    const restrictedManifest = {
      ...mockManifest,
      capabilities: ["readProject"],
    };
    registerRuntimeManifest(restrictedManifest, { isDevelopment: true });
    await activateRuntime("mock-motion-studio", {
      ...defaultContext,
      grantedCapabilities: ["readProject"],
    });
    clearWorkspaceAuditEvents();

    await expect(
      dispatchRuntimeAction("mock-motion-studio", "renderMotionFrame", {}, defaultContext)
    ).rejects.toThrow("is blocked: missing");

    const events = getWorkspaceAuditEvents();
    expect(events.some((e) => e.type === "runtime_execution_requested")).toBe(false);
    expect(events.some((e) => e.type === "runtime_authority_blocked")).toBe(true);
  });

  it("blocks executions when missing workspace-granted capability", async () => {
    registerRuntimeManifest(mockManifest, { isDevelopment: true });
    await activateRuntime("mock-motion-studio", defaultContext);
    clearWorkspaceAuditEvents();

    const restrictedContext: RuntimeActivationContext = {
      ...defaultContext,
      grantedCapabilities: ["readProject"], // missing writeProject
    };

    await expect(
      dispatchRuntimeAction("mock-motion-studio", "renderMotionFrame", {}, restrictedContext)
    ).rejects.toThrow("is blocked: missing");

    const events = getWorkspaceAuditEvents();
    expect(events.some((e) => e.type === "runtime_execution_requested")).toBe(false);
    expect(events.some((e) => e.type === "runtime_authority_blocked")).toBe(true);
  });

  it("completes execution and logs correct event sequence", async () => {
    registerRuntimeManifest(mockManifest, { isDevelopment: true });
    await activateRuntime("mock-motion-studio", defaultContext);
    clearWorkspaceAuditEvents();

    const result = await dispatchRuntimeAction(
      "mock-motion-studio",
      "renderMotionFrame",
      { frame: 12 },
      defaultContext
    );

    expect(result.success).toBe(true);
    expect(result.output).toEqual({
      frame: 12,
      status: "rendered",
      durationMs: 45,
    });

    const events = getWorkspaceAuditEvents();
    expect(events).toHaveLength(2);
    expect(events[0].type).toBe("runtime_execution_requested");
    expect(events[1].type).toBe("runtime_execution_completed");
    expect(events[1].metadata?.actionId).toBe("renderMotionFrame");
  });

  it("times out execution and logs failure order", async () => {
    registerRuntimeManifest(mockManifest, { isDevelopment: true });
    await activateRuntime("mock-motion-studio", defaultContext);

    // Mock the executor to hang
    const originalExecutor = LOCAL_RUNTIME_EXECUTORS["mock-motion-studio"]["renderMotionFrame"];
    LOCAL_RUNTIME_EXECUTORS["mock-motion-studio"]["renderMotionFrame"] = () =>
      new Promise((resolve) => setTimeout(() => resolve({} as any), 12000));

    clearWorkspaceAuditEvents();

    // Use fake timers to fast forward
    vi.useFakeTimers();

    const promise = dispatchRuntimeAction("mock-motion-studio", "renderMotionFrame", {}, defaultContext);

    // Fast-forward past the 8-second limit
    await vi.advanceTimersByTimeAsync(8500);

    const result = await promise;

    expect(result.success).toBe(false);
    expect(result.failureReason).toBe("timeout");

    const events = getWorkspaceAuditEvents();
    expect(events).toHaveLength(2);
    expect(events[0].type).toBe("runtime_execution_requested");
    expect(events[1].type).toBe("runtime_execution_failed");
    expect(events[1].metadata?.failureReason).toBe("timeout");

    // Restore executor
    LOCAL_RUNTIME_EXECUTORS["mock-motion-studio"]["renderMotionFrame"] = originalExecutor;
  });

  it("handles executor error and logs failure order", async () => {
    registerRuntimeManifest(mockManifest, { isDevelopment: true });
    await activateRuntime("mock-motion-studio", defaultContext);

    const originalExecutor = LOCAL_RUNTIME_EXECUTORS["mock-motion-studio"]["renderMotionFrame"];
    LOCAL_RUNTIME_EXECUTORS["mock-motion-studio"]["renderMotionFrame"] = async () => {
      throw new Error("Simulated graphics pipeline crash");
    };

    clearWorkspaceAuditEvents();

    const result = await dispatchRuntimeAction("mock-motion-studio", "renderMotionFrame", {}, defaultContext);

    expect(result.success).toBe(false);
    expect(result.failureReason).toBe("executor_error");
    expect(result.error).toBe("Simulated graphics pipeline crash");

    const events = getWorkspaceAuditEvents();
    expect(events).toHaveLength(2);
    expect(events[0].type).toBe("runtime_execution_requested");
    expect(events[1].type).toBe("runtime_execution_failed");

    LOCAL_RUNTIME_EXECUTORS["mock-motion-studio"]["renderMotionFrame"] = originalExecutor;
  });
});

// ---------------------------------------------------------------------------
// Execution log (Phase 06)
// ---------------------------------------------------------------------------

describe("RuntimeActionDispatcher — execution log", () => {
  const mockManifest: RuntimeManifest = {
    manifestVersion: "1.0",
    id: "mock-motion-studio",
    name: "Mock Motion Studio",
    version: "1.0.0",
    publisher: "Axiom",
    runtimeType: "studio",
    entry: { moduleUrl: "/runtime-modules/mock-motion-studio.js", signatureMode: "development" },
    capabilities: ["readProject", "writeProject"],
    compatibility: { axiomVersion: "1.0.0", apiVersion: "1" },
  };

  const defaultContext: RuntimeActivationContext = {
    runtimeId: "mock-motion-studio",
    grantedCapabilities: ["readProject", "writeProject"],
  };

  beforeEach(() => {
    clearRuntimeRegistry();
    clearActiveRuntimes();
    clearWorkspaceAuditEvents();
    clearExecutionLog();
    vi.useRealTimers();
  });

  it("records a failed entry with attemptedAt but NO executionRequestedAt on preflight failure", async () => {
    await expect(
      dispatchRuntimeAction("unknown-id", "renderMotionFrame", {}, {
        runtimeId: "unknown-id",
        grantedCapabilities: ["readProject"],
      } as RuntimeActivationContext)
    ).rejects.toThrow("was not found");
    const log = getExecutionLog();
    expect(log).toHaveLength(1);
    expect(log[0].status).toBe("failed");
    expect(log[0].attemptedAt).toBeTypeOf("string");
    expect(log[0].executionRequestedAt).toBeUndefined();
    expect(log[0].failureReason).toBe("runtime_not_found");
  });

  it("records a completed entry with both attemptedAt and executionRequestedAt on success", async () => {
    registerRuntimeManifest(mockManifest, { isDevelopment: true });
    await activateRuntime("mock-motion-studio", defaultContext);
    clearWorkspaceAuditEvents();

    await dispatchRuntimeAction("mock-motion-studio", "renderMotionFrame", { frame: 1 }, defaultContext);

    const log = getExecutionLog();
    expect(log).toHaveLength(1);
    expect(log[0].status).toBe("completed");
    expect(log[0].attemptedAt).toBeTypeOf("string");
    expect(log[0].executionRequestedAt).toBeTypeOf("string");
    expect(log[0].completedAt).toBeTypeOf("string");
    expect(log[0].durationMs).toBeTypeOf("number");
    expect(log[0].runtimeId).toBe("mock-motion-studio");
    expect(log[0].actionId).toBe("renderMotionFrame");
  });

  it("records authority_blocked failure with no executionRequestedAt", async () => {
    const restrictedManifest = { ...mockManifest, capabilities: ["readProject"] as RuntimeCapability[] };
    registerRuntimeManifest(restrictedManifest, { isDevelopment: true });
    await activateRuntime("mock-motion-studio", {
      ...defaultContext,
      grantedCapabilities: ["readProject"],
    });
    clearWorkspaceAuditEvents();

    await expect(
      dispatchRuntimeAction("mock-motion-studio", "renderMotionFrame", {}, defaultContext)
    ).rejects.toThrow();

    const log = getExecutionLog();
    expect(log).toHaveLength(1);
    expect(log[0].failureReason).toBe("authority_blocked");
    expect(log[0].executionRequestedAt).toBeUndefined();
  });

  it("getExecutionLog returns a copied array, preventing external mutations", () => {
    const logBefore = getExecutionLog();
    (logBefore as any).push({ id: "mutated" });
    
    const logAfter = getExecutionLog();
    expect(logAfter).not.toContainEqual(expect.objectContaining({ id: "mutated" }));
  });

  it("verifies preflight failure logs contain attemptedAt and completedAt, but no executionRequestedAt", async () => {
    registerRuntimeManifest(mockManifest, { isDevelopment: true });
    await expect(
      dispatchRuntimeAction("mock-motion-studio", "renderMotionFrame", {}, defaultContext)
    ).rejects.toThrow("is not active");

    let log = getExecutionLog();
    let record = log.find(r => r.failureReason === "runtime_not_active");
    expect(record).toBeDefined();
    expect(record!.attemptedAt).toBeDefined();
    expect(record!.completedAt).toBeDefined();
    expect(record!.executionRequestedAt).toBeUndefined();

    await expect(
      dispatchRuntimeAction("unknown-runtime", "renderMotionFrame", {}, defaultContext)
    ).rejects.toThrow("was not found");

    log = getExecutionLog();
    record = log.find(r => r.failureReason === "runtime_not_found");
    expect(record).toBeDefined();
    expect(record!.attemptedAt).toBeDefined();
    expect(record!.completedAt).toBeDefined();
    expect(record!.executionRequestedAt).toBeUndefined();

    await activateRuntime("mock-motion-studio", defaultContext);
    await expect(
      dispatchRuntimeAction("mock-motion-studio", "invalidAction", {}, defaultContext)
    ).rejects.toThrow("is not defined");

    log = getExecutionLog();
    record = log.find(r => r.failureReason === "action_not_found");
    expect(record).toBeDefined();
    expect(record!.attemptedAt).toBeDefined();
    expect(record!.completedAt).toBeDefined();
    expect(record!.executionRequestedAt).toBeUndefined();
  });

  it("importExecutionHistory appends historical records into the log", () => {
    const historical = [
      {
        id: "h1", runtimeId: "r", actionId: "a", status: "completed" as const,
        attemptedAt: "2026-07-04T00:00:00.000Z", completedAt: "2026-07-04T00:00:01.000Z",
      },
      {
        id: "h2", runtimeId: "r", actionId: "b", status: "failed" as const,
        attemptedAt: "2026-07-04T00:01:00.000Z", completedAt: "2026-07-04T00:01:00.100Z",
        failureReason: "executor_error",
      },
    ];
    importExecutionHistory(historical);
    const log = getExecutionLog();
    expect(log).toHaveLength(2);
    expect(log[0].id).toBe("h1");
    expect(log[1].id).toBe("h2");
  });
});
