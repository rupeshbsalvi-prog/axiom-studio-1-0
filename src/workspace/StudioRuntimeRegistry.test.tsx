import { describe, expect, it } from "vitest";
import { STUDIO_RUNTIME_MANIFEST, getStudioRuntimeManifestRecord } from "./StudioRuntimeManifest";
import { STUDIO_RUNTIME_REGISTRY, getStudioRuntimeEntry } from "./StudioRuntimeRegistry";

describe("StudioRuntimeRegistry", () => {
  it("loads runtime capability records from the manifest source", () => {
    expect(STUDIO_RUNTIME_MANIFEST.map((entry) => entry.id)).toEqual(["axiom-ai", "brain-x", "photo", "vector", "motion"]);
    expect(getStudioRuntimeManifestRecord("photo")).toEqual(
      expect.objectContaining({
        runtimeKey: "photo",
        source: "first-party",
        status: "implemented",
        capabilities: expect.arrayContaining(["studio-panel", "lifecycle", "generation-canvas"]),
        authority: {
          canReadProject: true,
          canWriteCanvas: true,
          canExport: true,
          canUseProviders: true,
          requiresApproval: true,
        },
      }),
    );
    expect(getStudioRuntimeManifestRecord("brand")).toBeUndefined();
  });

  it("registers concrete runtime entries for implemented studios", () => {
    expect(STUDIO_RUNTIME_REGISTRY.map((entry) => entry.id)).toEqual(["axiom-ai", "brain-x", "photo", "vector", "motion"]);
  });

  it("exposes module lifecycle loaders and panel components", async () => {
    const photoEntry = getStudioRuntimeEntry("photo");
    const photoModule = await photoEntry?.loadModule();

    expect(photoModule?.initialize).toEqual(expect.any(Function));
    expect(photoModule?.activate).toEqual(expect.any(Function));
    expect(photoModule?.deactivate).toEqual(expect.any(Function));
    expect(photoModule?.dispose).toEqual(expect.any(Function));
    expect(photoEntry?.Panel).toBeTruthy();
    expect(getStudioRuntimeEntry("brand")).toBeUndefined();
  });
});
