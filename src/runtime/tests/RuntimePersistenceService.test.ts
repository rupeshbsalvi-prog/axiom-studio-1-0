import { describe, it, expect, beforeEach } from "vitest";
import { serializeRuntimeState } from "../RuntimePersistenceService";
import {
  registerRuntimeManifest,
  disableRuntime,
  clearRuntimeRegistry,
  getAllRegistryEntries,
  getRuntimeManifestFingerprint,
} from "../RuntimeRegistry";
import { type RuntimeManifest } from "../manifest/RuntimeManifestTypes";
import { type ActivatedRuntime } from "../activation/RuntimeActivationTypes";
import { type RuntimeExecutionRecord } from "../../app/projects/projectDraft";
import { clearActiveRuntimes } from "../activation/RuntimeActivationService";
import { clearWorkspaceAuditEvents } from "../../workspace/WorkspaceAuditService";

const mockManifest: RuntimeManifest = {
  manifestVersion: "1.0",
  id: "mock-motion-studio",
  name: "Mock Motion Studio",
  version: "1.0.0",
  publisher: "axiom-internal",
  runtimeType: "studio",
  entry: { moduleUrl: "/runtime-modules/mock-motion-studio.js", signatureMode: "development" },
  capabilities: ["readProject", "writeProject"],
  compatibility: { axiomVersion: "1.0.0", apiVersion: "1" },
};

const mockActivation: ActivatedRuntime = {
  runtimeId: "mock-motion-studio",
  manifestId: "mock-motion-studio",
  actions: [{ id: "renderMotionFrame", label: "Render Frame", requiredCapabilities: ["readProject", "writeProject"] }],
  status: "active",
  activatedAt: "2026-07-04T00:01:00.000Z",
  grantedCapabilities: ["readProject", "writeProject"],
};

const mockExecution: RuntimeExecutionRecord = {
  id: "exec-1",
  runtimeId: "mock-motion-studio",
  actionId: "renderMotionFrame",
  status: "completed",
  attemptedAt: "2026-07-04T00:02:00.000Z",
  executionRequestedAt: "2026-07-04T00:02:00.001Z",
  completedAt: "2026-07-04T00:02:00.050Z",
  durationMs: 49,
  output: { frame: 1 },
};

describe("RuntimePersistenceService", () => {
  beforeEach(() => {
    clearRuntimeRegistry();
    clearActiveRuntimes();
    clearWorkspaceAuditEvents();
  });

  it("returns empty block for empty state", () => {
    const block = serializeRuntimeState([], [], []);
    expect(block.schemaVersion).toBe("0.3.0");
    expect(block.registeredRuntimes).toHaveLength(0);
    expect(block.activationLabels).toHaveLength(0);
    expect(block.executionHistory).toHaveLength(0);
    expect(block.savedAt).toBeTypeOf("string");
  });

  it("serializes a registered entry with correct fingerprint", () => {
    registerRuntimeManifest(mockManifest, { isDevelopment: true });
    const entries = getAllRegistryEntries();
    const block = serializeRuntimeState(entries, [], []);
    const record = block.registeredRuntimes[0];

    expect(record.runtimeId).toBe("mock-motion-studio");
    expect(record.status).toBe("registered");
    expect(record.fingerprint).toBe(getRuntimeManifestFingerprint(mockManifest));
    expect(record.version).toBe("1.0.0");
    expect(record.publisher).toBe("axiom-internal");
  });

  it("serializes a disabled entry with disabled status", () => {
    registerRuntimeManifest(mockManifest, { isDevelopment: true });
    disableRuntime("mock-motion-studio");
    const entries = getAllRegistryEntries();
    const block = serializeRuntimeState(entries, [], []);
    expect(block.registeredRuntimes[0].status).toBe("disabled");
  });

  it("converts activated runtime to previouslyActive label", () => {
    const block = serializeRuntimeState([], [mockActivation], []);
    expect(block.activationLabels).toHaveLength(1);
    const label = block.activationLabels[0];
    expect(label.runtimeId).toBe("mock-motion-studio");
    expect(label.restoredStatus).toBe("previouslyActive");
    expect(label.actionCount).toBe(1);
    expect(label.activatedAt).toBe("2026-07-04T00:01:00.000Z");
  });

  it("passes execution records through unchanged", () => {
    const block = serializeRuntimeState([], [], [mockExecution]);
    expect(block.executionHistory).toHaveLength(1);
    expect(block.executionHistory[0].id).toBe("exec-1");
    expect(block.executionHistory[0].output).toEqual({ frame: 1 });
    expect(block.executionHistory[0].executionRequestedAt).toBe("2026-07-04T00:02:00.001Z");
  });
});
