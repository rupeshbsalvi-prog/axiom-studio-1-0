import { describe, it, expect, beforeEach } from "vitest";
import {
  storeRestoredLabel,
  getRestoredLabel,
  getAllRestoredLabels,
  clearRestoredLabels,
} from "../RuntimeRestoredLabels";
import type { RuntimeRestoredActivationLabel } from "../../app/projects/projectDraft";

const label: RuntimeRestoredActivationLabel = {
  runtimeId: "mock-motion-studio",
  manifestId: "mock-motion-studio",
  activatedAt: "2026-07-04T00:01:00.000Z",
  actionCount: 3,
  restoredStatus: "previouslyActive",
};

describe("RuntimeRestoredLabels", () => {
  beforeEach(() => clearRestoredLabels());

  it("stores and retrieves a label by runtimeId", () => {
    storeRestoredLabel(label);
    const stored = getRestoredLabel("mock-motion-studio");
    expect(stored).toBeDefined();
    expect(stored!.restoredStatus).toBe("previouslyActive");
    expect(stored!.actionCount).toBe(3);
  });

  it("returns undefined for an unknown runtimeId", () => {
    expect(getRestoredLabel("unknown-id")).toBeUndefined();
  });

  it("returns all stored labels", () => {
    const label2: RuntimeRestoredActivationLabel = {
      ...label, runtimeId: "other-runtime", manifestId: "other-runtime",
    };
    storeRestoredLabel(label);
    storeRestoredLabel(label2);
    expect(getAllRestoredLabels()).toHaveLength(2);
  });

  it("clearRestoredLabels empties the store", () => {
    storeRestoredLabel(label);
    clearRestoredLabels();
    expect(getAllRestoredLabels()).toHaveLength(0);
  });

  it("restoredStatus is always 'previouslyActive' — not an ActivatedRuntime.status value", () => {
    storeRestoredLabel(label);
    const stored = getRestoredLabel("mock-motion-studio");
    expect(stored!.restoredStatus).toBe("previouslyActive");
    expect((stored as any).status).toBeUndefined();
  });
});
