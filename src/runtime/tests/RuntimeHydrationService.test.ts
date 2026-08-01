import { describe, it, expect, beforeEach } from "vitest";
import {
  planRuntimeHydration,
  applyRuntimeHydrationPlan,
} from "../RuntimeHydrationService";
import {
  registerRuntimeManifest,
  clearRuntimeRegistry,
  getAllRegistryEntries,
  getRuntimeManifestFingerprint,
} from "../RuntimeRegistry";
import { clearRestoredLabels, getRestoredLabel, storeRestoredLabel } from "../RuntimeRestoredLabels";
import { clearExecutionLog, getExecutionLog } from "../activation/RuntimeActionDispatcher";
import { type AxiomProjectRuntimeBlock, type RuntimeExecutionRecord } from "../../app/projects/projectDraft";

const DEV_CTX = { isDevelopment: true };

const mockManifest: any = {
  manifestVersion: "1.0" as const,
  id: "mock-motion-studio",
  name: "Mock Motion Studio",
  version: "1.0.0",
  publisher: "axiom-internal",
  runtimeType: "studio" as const,
  entry: { moduleUrl: "/runtime-modules/mock-motion", signatureMode: "development" },
  capabilities: ["readProject" as const],
  compatibility: { axiomVersion: "1.0.0", apiVersion: "1" },
};

function makeBlock(overrides: Partial<AxiomProjectRuntimeBlock> = {}): AxiomProjectRuntimeBlock {
  return {
    schemaVersion: "0.3.0",
    savedAt: "2026-07-04T00:00:00.000Z",
    registeredRuntimes: [],
    activationLabels: [],
    executionHistory: [],
    ...overrides,
  };
}

describe("RuntimeHydrationService — planRuntimeHydration", () => {
  beforeEach(() => {
    clearRuntimeRegistry();
    clearRestoredLabels();
    clearExecutionLog();
  });

  it("returns empty plan for undefined block (0.2.0 draft)", () => {
    const plan = planRuntimeHydration(undefined, []);
    expect(plan.actions).toHaveLength(0);
    expect(plan.warnings).toHaveLength(0);
  });

  it("returns empty plan for null", () => {
    const plan = planRuntimeHydration(null, []);
    expect(plan.actions).toHaveLength(0);
  });

  it("returns empty plan for corrupted block (missing schemaVersion)", () => {
    const plan = planRuntimeHydration({ schemaVersion: "0.2.0", registeredRuntimes: [] }, []);
    expect(plan.actions).toHaveLength(0);
  });

  it("returns empty plan for valid 0.3.0 block with no records", () => {
    const plan = planRuntimeHydration(makeBlock(), []);
    expect(plan.actions).toHaveLength(0);
    expect(plan.warnings).toHaveLength(0);
  });

  it("skips persisted runtime when live manifest is missing", () => {
    const block = makeBlock({
      registeredRuntimes: [{
        manifestId: "missing-id", runtimeId: "missing-id", runtimeName: "Missing",
        version: "1.0.0", publisher: "test", fingerprint: "fp",
        status: "registered", registeredAt: "2026-07-04T00:00:00.000Z",
      }],
    });
    const plan = planRuntimeHydration(block, []);
    expect(plan.actions).toHaveLength(1);
    expect(plan.actions[0].type).toBe("skip");
    expect(plan.warnings).toHaveLength(1);
    expect(plan.warnings[0]).toContain("no live registered manifest found");
  });

  it("skips persisted runtime when fingerprint mismatches", () => {
    registerRuntimeManifest(mockManifest, DEV_CTX);
    const liveEntries = getAllRegistryEntries();
    const block = makeBlock({
      registeredRuntimes: [{
        manifestId: "mock-motion-studio", runtimeId: "mock-motion-studio",
        runtimeName: "Mock Motion Studio", version: "1.0.0", publisher: "axiom-internal",
        fingerprint: "wrong-fingerprint",
        status: "registered", registeredAt: "2026-07-04T00:00:00.000Z",
      }],
    });
    const plan = planRuntimeHydration(block, liveEntries);
    const skip = plan.actions.find((a) => a.type === "skip");
    expect(skip).toBeDefined();
    expect(plan.warnings.some((w) => w.includes("fingerprint mismatch"))).toBe(true);
  });

  it("generates restore_disabled for a disabled entry with fingerprint match", () => {
    registerRuntimeManifest(mockManifest, DEV_CTX);
    const liveEntries = getAllRegistryEntries();
    const fingerprint = getRuntimeManifestFingerprint(mockManifest);
    const block = makeBlock({
      registeredRuntimes: [{
        manifestId: "mock-motion-studio", runtimeId: "mock-motion-studio",
        runtimeName: "Mock Motion Studio", version: "1.0.0", publisher: "axiom-internal",
        fingerprint, status: "disabled", registeredAt: "2026-07-04T00:00:00.000Z",
        disabledAt: "2026-07-04T00:05:00.000Z",
      }],
    });
    const plan = planRuntimeHydration(block, liveEntries);
    expect(plan.actions.some((a) => a.type === "restore_disabled")).toBe(true);
  });

  it("skips rejected runtime records", () => {
    const block = makeBlock({
      registeredRuntimes: [{
        manifestId: "bad-id", runtimeId: "bad-id", runtimeName: "Bad", version: "1.0.0",
        publisher: "test", fingerprint: "x", status: "rejected", registeredAt: "2026-07-04T00:00:00.000Z",
      }],
    });
    const plan = planRuntimeHydration(block, []);
    expect(plan.actions[0].type).toBe("skip");
    expect(plan.warnings[0]).toContain("rejected");
  });

  it("skips untrusted runtime records", () => {
    const block = makeBlock({
      registeredRuntimes: [{
        manifestId: "bad-id", runtimeId: "bad-id", runtimeName: "Bad", version: "1.0.0",
        publisher: "test", fingerprint: "x", status: "untrusted", registeredAt: "2026-07-04T00:00:00.000Z",
      }],
    });
    const plan = planRuntimeHydration(block, []);
    expect(plan.actions[0].type).toBe("skip");
    expect(plan.warnings[0]).toContain("untrusted");
  });

  it("restores activation label only when runtime passed fingerprint matching", () => {
    registerRuntimeManifest(mockManifest, DEV_CTX);
    const liveEntries = getAllRegistryEntries();
    const fingerprint = getRuntimeManifestFingerprint(mockManifest);
    const block = makeBlock({
      registeredRuntimes: [{
        manifestId: "mock-motion-studio", runtimeId: "mock-motion-studio",
        runtimeName: "Mock Motion Studio", version: "1.0.0", publisher: "axiom-internal",
        fingerprint, status: "registered", registeredAt: "2026-07-04T00:00:00.000Z",
      }],
      activationLabels: [{
        runtimeId: "mock-motion-studio", manifestId: "mock-motion-studio",
        activatedAt: "2026-07-04T00:01:00.000Z", actionCount: 3, restoredStatus: "previouslyActive",
      }],
    });
    const plan = planRuntimeHydration(block, liveEntries);
    expect(plan.actions.some((a) => a.type === "restore_activation_label")).toBe(true);
  });

  it("skips activation label when its runtime did not pass fingerprint matching", () => {
    const block = makeBlock({
      registeredRuntimes: [],
      activationLabels: [{
        runtimeId: "orphan-id", manifestId: "orphan-id",
        activatedAt: "2026-07-04T00:01:00.000Z", actionCount: 1, restoredStatus: "previouslyActive",
      }],
    });
    const plan = planRuntimeHydration(block, []);
    expect(plan.actions.every((a) => a.type !== "restore_activation_label")).toBe(true);
    expect(plan.warnings.some((w) => w.includes("Activation label skipped"))).toBe(true);
  });

  it("restores execution records as restore_execution_records action", () => {
    const record: RuntimeExecutionRecord = {
      id: "exec-1", runtimeId: "r", actionId: "a", status: "completed",
      attemptedAt: "2026-07-04T00:00:00.000Z", completedAt: "2026-07-04T00:00:01.000Z",
    };
    const block = makeBlock({ executionHistory: [record] });
    const plan = planRuntimeHydration(block, []);
    expect(plan.actions.some((a) => a.type === "restore_execution_records")).toBe(true);
  });
});

describe("RuntimeHydrationService — applyRuntimeHydrationPlan", () => {
  beforeEach(() => {
    clearRuntimeRegistry();
    clearRestoredLabels();
    clearExecutionLog();
  });

  it("applies restore_disabled action", () => {
    registerRuntimeManifest(mockManifest, DEV_CTX);
    const liveEntries = getAllRegistryEntries();
    const fingerprint = getRuntimeManifestFingerprint(mockManifest);
    const block = makeBlock({
      registeredRuntimes: [{
        manifestId: "mock-motion-studio", runtimeId: "mock-motion-studio",
        runtimeName: "Mock Motion Studio", version: "1.0.0", publisher: "axiom-internal",
        fingerprint, status: "disabled", registeredAt: "2026-07-04T00:00:00.000Z",
      }],
    });
    const plan = planRuntimeHydration(block, liveEntries);
    const result = applyRuntimeHydrationPlan(plan);
    expect(result.restoredDisabledCount).toBe(1);
    const restored = getAllRegistryEntries().find((e) => e.manifest.id === "mock-motion-studio");
    expect(restored?.status).toBe("disabled");
  });

  it("never calls activateRuntime or dispatchRuntimeAction", () => {
    registerRuntimeManifest({ ...mockManifest, id: "r" }, DEV_CTX);
    const liveEntries = getAllRegistryEntries();
    const fingerprint = getRuntimeManifestFingerprint({ ...mockManifest, id: "r" } as any);
    const block = makeBlock({
      registeredRuntimes: [{
        manifestId: "r", runtimeId: "r", runtimeName: "Mock", version: "1.0.0", publisher: "axiom-internal",
        fingerprint, status: "registered", registeredAt: "2026-07-04T00:00:00.000Z",
      }],
      activationLabels: [{
        runtimeId: "r", manifestId: "r", activatedAt: "2026-07-04T00:00:00.000Z",
        actionCount: 1, restoredStatus: "previouslyActive",
      }],
    });
    const plan = planRuntimeHydration(block, liveEntries);
    applyRuntimeHydrationPlan(plan);
    expect(getExecutionLog()).toHaveLength(0);
  });

  it("stores activation label in RuntimeRestoredLabels", () => {
    const label = {
      runtimeId: "mock-motion-studio", manifestId: "mock-motion-studio",
      activatedAt: "2026-07-04T00:01:00.000Z", actionCount: 2, restoredStatus: "previouslyActive" as const,
    };
    applyRuntimeHydrationPlan({
      actions: [{ type: "restore_activation_label", label }],
      warnings: [],
    });
    const stored = getRestoredLabel("mock-motion-studio");
    expect(stored).toBeDefined();
    expect(stored!.restoredStatus).toBe("previouslyActive");
  });

  it("imports execution history into execution log", () => {
    const record: RuntimeExecutionRecord = {
      id: "exec-hist-1", runtimeId: "r", actionId: "a", status: "completed",
      attemptedAt: "2026-07-04T00:00:00.000Z", completedAt: "2026-07-04T00:00:01.000Z",
    };
    applyRuntimeHydrationPlan({
      actions: [{ type: "restore_execution_records", records: [record] }],
      warnings: [],
    });
    const log = getExecutionLog();
    expect(log).toHaveLength(1);
    expect(log[0].id).toBe("exec-hist-1");
  });

  it("clears old restored labels and logs before applying a new plan to prevent leakage", () => {
    storeRestoredLabel({
      runtimeId: "leak-id",
      manifestId: "leak-id",
      activatedAt: "2026-07-04T00:00:00.000Z",
      actionCount: 1,
      restoredStatus: "previouslyActive",
    });

    const record: RuntimeExecutionRecord = {
      id: "exec-leak-1", runtimeId: "r", actionId: "a", status: "completed",
      attemptedAt: "2026-07-04T00:00:00.000Z", completedAt: "2026-07-04T00:00:01.000Z",
    };
    applyRuntimeHydrationPlan({
      actions: [{ type: "restore_execution_records", records: [record] }],
      warnings: [],
    });
    
    applyRuntimeHydrationPlan({ actions: [], warnings: [] });

    expect(getRestoredLabel("leak-id")).toBeUndefined();
    expect(getExecutionLog()).toHaveLength(0);
  });
});
