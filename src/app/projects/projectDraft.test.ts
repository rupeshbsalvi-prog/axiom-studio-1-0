import { describe, expect, it } from "vitest";
import { createProjectDraft } from "./projectDraft";
import { planRuntimeHydration } from "../../runtime/RuntimeHydrationService";

describe("project draft foundation", () => {
  it("creates a local AXPKG-ready draft from Mission Control intent", () => {
    const draft = createProjectDraft({
      name: "Launch Campaign",
      intent: "Create a premium product launch campaign",
      targetStudioId: "photo",
    });

    expect(draft.schemaVersion).toBe("0.8.0");
    expect(draft.manifest.name).toBe("Launch Campaign");
    expect(draft.manifest.version).toBe("0.1.0");
    expect(draft.manifest.authoredStudios).toEqual(["photo"]);
    expect(draft.brain.recentPrompts).toContain("Create a premium product launch campaign");
    expect(draft.canvas.photo.elements).toEqual([]);
    expect(draft.audit).toBeDefined();
    expect(draft.audit!.length).toBe(1);
    expect(draft.audit![0].type).toBe("intent_received");
    expect(draft.audit![0].message).toContain("Launch Campaign");
  });

  it("defaults empty intents to Mission Control without losing project durability fields", () => {
    const draft = createProjectDraft({ name: "", intent: "", targetStudioId: "mission-control" });

    expect(draft.schemaVersion).toBe("0.8.0");
    expect(draft.manifest.name).toBe("Untitled Axiom Project");
    expect(draft.manifest.authoredStudios).toEqual(["mission-control"]);
    expect(draft.manifest.createdAt).toBeTypeOf("string");
    expect(draft.manifest.updatedAt).toBeTypeOf("string");
    expect(draft.audit!.length).toBe(1);
  });

  it("initialises an empty runtime block with schema 0.3.0", () => {
    const draft = createProjectDraft({ name: "Test", intent: "", targetStudioId: "photo" });

    expect(draft.runtime).toBeDefined();
    expect(draft.runtime!.schemaVersion).toBe("0.3.0");
    expect(draft.runtime!.registeredRuntimes).toEqual([]);
    expect(draft.runtime!.activationLabels).toEqual([]);
    expect(draft.runtime!.executionHistory).toEqual([]);
    expect(draft.runtime!.savedAt).toBeTypeOf("string");
  });

  it("initialises an empty canvas preview block with schema 0.5.0", () => {
    const draft = createProjectDraft({ name: "Test", intent: "", targetStudioId: "photo" });

    expect(draft.canvasPreview).toBeDefined();
    expect(draft.canvasPreview!.schemaVersion).toBe("0.5.0");
    expect(draft.canvasPreview!.candidates).toEqual([]);
    expect(draft.canvasPreview!.assemblyPlans).toEqual([]);
    expect(draft.canvasPreview!.projections).toEqual([]);
    expect(draft.canvasPreview!.applications).toEqual([]);
    expect(draft.canvasPreview!.savedAt).toBeTypeOf("string");
  });

  it("initialises an empty photo provider block with schema 0.8.0", () => {
    const draft = createProjectDraft({ name: "Test", intent: "", targetStudioId: "photo" });

    expect(draft.photoProvider).toBeDefined();
    expect(draft.photoProvider!.schemaVersion).toBe("0.8.0");
    expect(draft.photoProvider!.jobs).toEqual([]);
    expect(draft.photoProvider!.sandboxRuns).toEqual([]);
    expect(draft.photoProvider!.liveRuns).toEqual([]);
    expect(draft.photoProvider!.savedAt).toBeTypeOf("string");
  });

  it("backward compat: 0.2.0 draft with no runtime block produces empty hydration plan", () => {
    // Simulate a 0.2.0 draft (no runtime field)
    const legacyDraft: unknown = { schemaVersion: "0.2.0" };
    const plan = planRuntimeHydration(
      typeof legacyDraft === "object" && legacyDraft !== null && "runtime" in legacyDraft
        ? (legacyDraft as { runtime?: unknown }).runtime
        : undefined,
      []
    );

    expect(plan.actions).toHaveLength(0);
    expect(plan.warnings).toHaveLength(0);
  });
});
