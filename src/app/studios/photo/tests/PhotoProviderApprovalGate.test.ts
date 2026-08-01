import { beforeEach, describe, expect, it } from "vitest";

import {
  approvePhotoProviderRequest,
  DEFAULT_PHOTO_PROVIDER_ADAPTER,
} from "../PhotoProviderApprovalGate";
import {
  buildPhotoProviderRequestManifest,
  type PhotoProviderRequestManifestV1,
} from "../PhotoProviderRequestContract";
import {
  clearWorkspaceAuditEvents,
  getWorkspaceAuditEvents,
} from "../../../../workspace/WorkspaceAuditService";
import type { PhotoPlanResponse } from "../../../services/photoTypes";

const PLAN: PhotoPlanResponse = {
  intent: "Create a layered product poster with transparent hero subject",
  category: "product",
  aspectRatio: "1:1",
  canvasSize: { width: 1080, height: 1080 },
  aesthetic: "luxury",
  lighting: "studio",
  colorPalette: ["#020617", "#f8fafc"],
  backgroundStrategy: "Dark studio background with transparent product subject.",
  negativePrompt: "blur, distorted product, random text",
  layerBreakdown: [
    {
      name: "Transparent product subject",
      type: "image",
      description: "Isolated product subject with transparent background.",
      blendMode: "normal",
      opacity: 1,
    },
  ],
  recommendedAdjustments: {
    brightness: 100,
    contrast: 105,
    saturation: 100,
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

describe("PhotoProviderApprovalGate — Phase 23", () => {
  beforeEach(() => {
    clearWorkspaceAuditEvents();
  });

  it("creates a validated adapter job only after explicit user approval", () => {
    const providerRequest = buildPhotoProviderRequestManifest(PLAN);

    const result = approvePhotoProviderRequest({
      providerRequest,
      adapter: DEFAULT_PHOTO_PROVIDER_ADAPTER,
      actorId: "creative-director",
      userConfirmedProviderExecution: true,
    });

    expect(result.success).toBe(true);
    expect(result.job).toMatchObject({
      contractVersion: "photo-provider-adapter-job.v1",
      status: "ready_for_provider_execution",
      approval: {
        approvedBy: "creative-director",
        userConfirmedProviderExecution: true,
      },
      security: {
        providerExecutionAllowed: true,
        providerExecuted: false,
        runtimeCodeLoaded: false,
        moduleUrlExecuted: false,
      },
    });
    expect(result.diagnostics).toEqual([]);
  });

  it("rejects approval attempts without explicit user confirmation", () => {
    const providerRequest = buildPhotoProviderRequestManifest(PLAN);

    const result = approvePhotoProviderRequest({
      providerRequest,
      adapter: DEFAULT_PHOTO_PROVIDER_ADAPTER,
      actorId: "creative-director",
      userConfirmedProviderExecution: false,
    });

    expect(result.success).toBe(false);
    expect(result.job).toBeUndefined();
    expect(result.diagnostics).toContainEqual(
      expect.objectContaining({ code: "provider_approval_missing" })
    );
  });

  it("rejects unsafe staged provider requests that self-approve execution", () => {
    const providerRequest: PhotoProviderRequestManifestV1 = {
      ...buildPhotoProviderRequestManifest(PLAN),
      approval: {
        requiresUserApproval: true,
        approvedForProviderExecution: true,
      },
    };

    const result = approvePhotoProviderRequest({
      providerRequest,
      adapter: DEFAULT_PHOTO_PROVIDER_ADAPTER,
      actorId: "creative-director",
      userConfirmedProviderExecution: true,
    });

    expect(result.success).toBe(false);
    expect(result.diagnostics).toContainEqual(
      expect.objectContaining({ code: "provider_execution_preapproved" })
    );
  });

  it("records requested and completed approval audit events for successful gate approval", () => {
    const providerRequest = buildPhotoProviderRequestManifest(PLAN);

    const result = approvePhotoProviderRequest({
      providerRequest,
      adapter: DEFAULT_PHOTO_PROVIDER_ADAPTER,
      actorId: "creative-director",
      userConfirmedProviderExecution: true,
    });

    expect(result.success).toBe(true);
    expect(getWorkspaceAuditEvents().map((event) => event.type)).toEqual([
      "provider_execution_approval_requested",
      "provider_execution_approval_completed",
    ]);
    expect(getWorkspaceAuditEvents()[1].metadata).toMatchObject({
      providerId: "imagine-x-photo",
      providerExecutionAllowed: true,
      providerExecuted: false,
      runtimeCodeLoaded: false,
      moduleUrlExecuted: false,
    });
  });

  it("records failed approval audit event without creating an adapter job", () => {
    const providerRequest = buildPhotoProviderRequestManifest(PLAN);

    const result = approvePhotoProviderRequest({
      providerRequest,
      adapter: DEFAULT_PHOTO_PROVIDER_ADAPTER,
      actorId: "creative-director",
      userConfirmedProviderExecution: false,
    });

    expect(result.success).toBe(false);
    expect(getWorkspaceAuditEvents().map((event) => event.type)).toEqual([
      "provider_execution_approval_requested",
      "provider_execution_approval_failed",
    ]);
    expect(getWorkspaceAuditEvents()[1].severity).toBe("error");
  });
});
