import { describe, expect, it } from "vitest";

import {
  buildPhotoProviderRequestManifest,
  validatePhotoProviderRequestManifest,
  type PhotoProviderRequestManifestV1,
} from "../PhotoProviderRequestContract";
import type { PhotoPlanResponse } from "../../../services/photoTypes";

const PLAN: PhotoPlanResponse = {
  intent: "Create a premium product launch poster with chrome headphones",
  category: "product",
  aspectRatio: "4:5",
  canvasSize: { width: 1200, height: 1500 },
  aesthetic: "luxury",
  lighting: "studio",
  colorPalette: ["#0f172a", "#f8fafc", "#d4af37"],
  backgroundStrategy: "Layered dark studio background with soft product halo.",
  negativePrompt: "blurry, distorted logo, extra text",
  layerBreakdown: [
    {
      name: "Studio Backdrop",
      type: "image",
      description: "Dark gradient background rendered with transparent subject safe area.",
      blendMode: "normal",
      opacity: 1,
    },
    {
      name: "Headphone Subject",
      type: "image",
      description: "Chrome headphones isolated on transparent background.",
      blendMode: "normal",
      opacity: 1,
    },
  ],
  recommendedAdjustments: {
    brightness: 100,
    contrast: 110,
    saturation: 95,
    blur: 0,
    hueRotate: 0,
    grayscale: 0,
  },
  audit: [],
  provider: {
    name: "imagine-x-photo",
    mode: "planned",
    status: "ready",
  },
};

describe("PhotoProviderRequestContract — Phase 21", () => {
  it("builds a portable non-executing provider manifest from a photo plan", () => {
    const manifest = buildPhotoProviderRequestManifest(PLAN);

    expect(manifest).toMatchObject({
      contractVersion: "photo-provider-request.v1",
      studioId: "photo",
      provider: {
        requestedName: "imagine-x-photo",
        planningMode: "planned",
        planningStatus: "ready",
      },
      prompt: {
        intent: PLAN.intent,
        negativePrompt: PLAN.negativePrompt,
      },
      canvas: {
        width: 1200,
        height: 1500,
        aspectRatio: "4:5",
        transparentBackgroundRequired: true,
      },
      approval: {
        requiresUserApproval: true,
        approvedForProviderExecution: false,
      },
      security: {
        dryRun: true,
        providerExecutionAllowed: false,
        providerExecuted: false,
        noExecutionPerformed: true,
      },
    });
    expect(manifest.layers).toHaveLength(2);
    expect(manifest.layers[1]).toMatchObject({
      name: "Headphone Subject",
      providerPrompt: "Chrome headphones isolated on transparent background.",
      transparentBackgroundRequired: true,
    });
  });

  it("validates provider manifests as execution-blocked until a future explicit provider phase", () => {
    const manifest = buildPhotoProviderRequestManifest(PLAN);
    const diagnostics = validatePhotoProviderRequestManifest(manifest);

    expect(diagnostics).toEqual([]);
  });

  it("rejects manifests that are already approved for provider execution", () => {
    const manifest: PhotoProviderRequestManifestV1 = {
      ...buildPhotoProviderRequestManifest(PLAN),
      approval: {
        requiresUserApproval: true,
        approvedForProviderExecution: true,
      },
    };

    expect(validatePhotoProviderRequestManifest(manifest)).toContainEqual(
      expect.objectContaining({
        code: "provider_execution_preapproved",
        severity: "error",
      })
    );
  });
});
