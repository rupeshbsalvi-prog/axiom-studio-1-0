import { describe, expect, it } from "vitest";
import { STUDIO_REGISTRY, getStudioById } from "./registry";

describe("studio registry", () => {
  it("declares Mission Control plus the 13 Studios in canonical order (FR1.2: brain-x added)", () => {
    expect(STUDIO_REGISTRY.map((studio) => studio.id)).toEqual([
      "mission-control",
      "photo",
      "vector",
      "brand",
      "asset-hub",
      "ui-ux",
      "typography",
      "presentation",
      "motion",
      "video",
      "whiteboard",
      "axiom-ai",
      "brain-x",
    ]);
  });

  it("exposes wiring metadata required by the locked studio contract", () => {
    const uiux = getStudioById("ui-ux");

    expect(uiux?.displayName).toBe("UI/UX Studio");
    expect(uiux?.canvasMode).toBe("frames");
    expect(uiux?.axpkgSlice).toBe("uiUx");
    expect(uiux?.exportFormats).toContain("HTML");
  });
});
