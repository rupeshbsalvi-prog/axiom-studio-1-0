import { describe, expect, it } from "vitest";

import {
  createPhotoProviderAdapterJob,
  validatePhotoProviderAdapterDescriptor,
  validatePhotoProviderAdapterJob,
  type PhotoProviderAdapterDescriptorV1,
} from "../PhotoProviderAdapterContract";
import {
  buildPhotoProviderRequestManifest,
} from "../PhotoProviderRequestContract";
import type { PhotoPlanResponse } from "../../../services/photoTypes";

const PLAN: PhotoPlanResponse = {
  intent: "Create a premium watch campaign with separated product layers",
  category: "product",
  aspectRatio: "1:1",
  canvasSize: { width: 1080, height: 1080 },
  aesthetic: "luxury",
  lighting: "studio",
  colorPalette: ["#030712", "#f8fafc"],
  backgroundStrategy: "Dark reflective studio background.",
  negativePrompt: "blur, warped watch, random text",
  layerBreakdown: [
    {
      name: "Watch hero",
      type: "image",
      description: "Polished watch isolated with transparent background.",
      blendMode: "normal",
      opacity: 1,
    },
  ],
  recommendedAdjustments: {
    brightness: 100,
    contrast: 105,
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

const ADAPTER: PhotoProviderAdapterDescriptorV1 = {
  contractVersion: "photo-provider-adapter.v1",
  providerId: "imagine-x-photo",
  displayName: "Imagine X Photo Adapter",
  capabilities: {
    imageGeneration: true,
    transparentBackground: true,
    layeredOutput: true,
  },
  limits: {
    maxWidth: 2048,
    maxHeight: 2048,
    maxLayers: 8,
  },
  security: {
    requiresExplicitApproval: true,
    executesOutsideRuntimeMock: true,
    storesSecrets: false,
  },
};

describe("PhotoProviderAdapterContract — Phase 22", () => {
  it("validates a compatible adapter descriptor", () => {
    expect(validatePhotoProviderAdapterDescriptor(ADAPTER)).toEqual([]);
  });

  it("rejects adapters that cannot produce transparent layered output", () => {
    const diagnostics = validatePhotoProviderAdapterDescriptor({
      ...ADAPTER,
      capabilities: {
        ...ADAPTER.capabilities,
        transparentBackground: false,
        layeredOutput: false,
      },
    });

    expect(diagnostics).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: "transparent_background_unsupported" }),
        expect.objectContaining({ code: "layered_output_unsupported" }),
      ])
    );
  });

  it("creates a provider adapter job only as a non-executed approved envelope", () => {
    const providerRequest = buildPhotoProviderRequestManifest(PLAN);
    const job = createPhotoProviderAdapterJob({
      providerRequest,
      adapter: ADAPTER,
      approval: {
        approvalId: "approval-photo-provider-1",
        approvedBy: "user",
        approvedAtUtc: "2026-07-06T00:00:00.000Z",
        userConfirmedProviderExecution: true,
      },
    });

    expect(job).toMatchObject({
      contractVersion: "photo-provider-adapter-job.v1",
      status: "ready_for_provider_execution",
      providerRequest,
      adapter: {
        providerId: "imagine-x-photo",
      },
      approval: {
        userConfirmedProviderExecution: true,
      },
      security: {
        providerExecutionAllowed: true,
        providerExecuted: false,
        runtimeCodeLoaded: false,
        moduleUrlExecuted: false,
      },
    });
    expect(validatePhotoProviderAdapterJob(job)).toEqual([]);
  });

  it("rejects adapter jobs without explicit provider approval", () => {
    const providerRequest = buildPhotoProviderRequestManifest(PLAN);
    const job = createPhotoProviderAdapterJob({
      providerRequest,
      adapter: ADAPTER,
      approval: {
        approvalId: "approval-photo-provider-2",
        approvedBy: "user",
        approvedAtUtc: "2026-07-06T00:00:00.000Z",
        userConfirmedProviderExecution: false,
      },
    });

    expect(validatePhotoProviderAdapterJob(job)).toContainEqual(
      expect.objectContaining({ code: "provider_approval_missing" })
    );
  });

  it("rejects adapter jobs when provider limits cannot satisfy the request", () => {
    const providerRequest = buildPhotoProviderRequestManifest(PLAN);
    const job = createPhotoProviderAdapterJob({
      providerRequest,
      adapter: {
        ...ADAPTER,
        limits: { maxWidth: 512, maxHeight: 512, maxLayers: 1 },
      },
      approval: {
        approvalId: "approval-photo-provider-3",
        approvedBy: "user",
        approvedAtUtc: "2026-07-06T00:00:00.000Z",
        userConfirmedProviderExecution: true,
      },
    });

    expect(validatePhotoProviderAdapterJob(job)).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: "canvas_limit_exceeded" }),
      ])
    );
  });
});
