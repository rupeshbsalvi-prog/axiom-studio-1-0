import { describe, expect, it } from "vitest";
import { createProjectDraft } from "../../projects/projectDraft";
import { PHOTO_INITIAL_STATE, hydratePhotoStateFromProject } from "./PhotoState";

describe("hydratePhotoStateFromProject", () => {
  it("keeps an active local composition unchanged", () => {
    const current = {
      ...PHOTO_INITIAL_STATE,
      layers: [{ id: "local" }] as any,
    };

    expect(hydratePhotoStateFromProject(current)).toBe(current);
  });

  it("ignores malformed AXPKG canvas elements", () => {
    const project = createProjectDraft({ name: "Malformed", intent: "", targetStudioId: "photo" });
    project.canvas.photo.elements = [null, { id: "missing-bounds" }, { bounds: { x: 0 } }];

    expect(hydratePhotoStateFromProject(PHOTO_INITIAL_STATE, project)).toBe(PHOTO_INITIAL_STATE);
  });

  it("normalizes imported layer fields and restores projection dimensions", () => {
    const project = createProjectDraft({ name: "Imported", intent: "", targetStudioId: "photo" });
    project.canvas.photo.elements = [{
      bounds: { x: 1, y: 2, width: 300, height: 200 },
      type: "unsupported",
      opacity: 4,
    }];
    project.canvasPreview!.applications = [{
      id: "apply-1",
      projectionId: "projection-1",
      studioId: "photo",
      status: "applied",
      appliedAtUtc: new Date().toISOString(),
      appliedElementIds: [],
      previousElements: [],
      security: {
        userConfirmed: true,
        noExecutionPerformed: true,
        runtimeCodeLoaded: false,
        moduleUrlExecuted: false,
        authoritativeCanvasMutated: true,
        reversible: true,
      },
    }];
    project.canvasPreview!.projections = [{
      id: "projection-1",
      assemblyPlanId: "plan-1",
      studioId: "photo",
      status: "projected_preview",
      createdAtUtc: new Date().toISOString(),
      canvas: { width: 1200, height: 1500, aspectRatio: "4:5", background: "transparent" },
      elements: [],
      security: {
        previewOnly: true,
        noExecutionPerformed: true,
        runtimeCodeLoaded: false,
        moduleUrlExecuted: false,
        authoritativeCanvasMutated: false,
      },
    }];

    const state = hydratePhotoStateFromProject(PHOTO_INITIAL_STATE, project);

    expect(state.canvas).toEqual({ width: 1200, height: 1500, aspectRatio: "4:5", background: "transparent" });
    expect(state.layers[0]).toMatchObject({
      id: "photo-layer-1",
      name: "Photo layer 1",
      type: "image",
      opacity: 1,
      blendMode: "normal",
      position: { x: 1, y: 2, width: 300, height: 200, rotation: 0 },
    });
  });
});
