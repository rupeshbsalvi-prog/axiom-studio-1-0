import type { PhotoPlanResponse } from "../../services/photoTypes";

export interface PhotoProviderRequestLayerV1 {
  index: number;
  name: string;
  type: string;
  providerPrompt: string;
  blendMode: string;
  opacity: number;
  transparentBackgroundRequired: true;
}

export interface PhotoProviderRequestManifestV1 {
  contractVersion: "photo-provider-request.v1";
  studioId: "photo";
  provider: {
    requestedName: string;
    planningMode: string;
    planningStatus: string;
  };
  prompt: {
    intent: string;
    negativePrompt: string;
    backgroundStrategy: string;
    aesthetic: string;
    lighting: string;
    colorPalette: string[];
  };
  canvas: {
    width: number;
    height: number;
    aspectRatio: string;
    transparentBackgroundRequired: true;
  };
  layers: PhotoProviderRequestLayerV1[];
  approval: {
    requiresUserApproval: true;
    approvedForProviderExecution: boolean;
  };
  security: {
    dryRun: true;
    providerExecutionAllowed: false;
    providerExecuted: false;
    noExecutionPerformed: true;
  };
}

export interface PhotoProviderRequestDiagnostic {
  code:
    | "invalid_contract_version"
    | "missing_intent"
    | "empty_layer_set"
    | "provider_execution_preapproved"
    | "unsafe_provider_security";
  severity: "error";
  message: string;
}

function cleanText(value: unknown, fallback: string): string {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : fallback;
}

export function buildPhotoProviderRequestManifest(plan: PhotoPlanResponse): PhotoProviderRequestManifestV1 {
  return {
    contractVersion: "photo-provider-request.v1",
    studioId: "photo",
    provider: {
      requestedName: cleanText(plan.provider?.name, "unassigned-photo-provider"),
      planningMode: cleanText(plan.provider?.mode, "planned"),
      planningStatus: cleanText(plan.provider?.status, "pending"),
    },
    prompt: {
      intent: cleanText(plan.intent, "Untitled photo composition"),
      negativePrompt: cleanText(plan.negativePrompt, "low quality, blurry, distorted"),
      backgroundStrategy: cleanText(plan.backgroundStrategy, "Transparent-safe studio composition."),
      aesthetic: cleanText(plan.aesthetic, "studio"),
      lighting: cleanText(plan.lighting, "balanced"),
      colorPalette: plan.colorPalette.length > 0 ? [...plan.colorPalette] : ["#0f172a", "#f8fafc"],
    },
    canvas: {
      width: plan.canvasSize.width,
      height: plan.canvasSize.height,
      aspectRatio: cleanText(plan.aspectRatio, "1:1"),
      transparentBackgroundRequired: true,
    },
    layers: plan.layerBreakdown.map((layer, index) => ({
      index,
      name: cleanText(layer.name, `Photo layer ${index + 1}`),
      type: cleanText(layer.type, "image"),
      providerPrompt: cleanText(layer.description, layer.name || `Photo layer ${index + 1}`),
      blendMode: cleanText(layer.blendMode, "normal"),
      opacity: typeof layer.opacity === "number" ? layer.opacity : 1,
      transparentBackgroundRequired: true,
    })),
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
  };
}

export function validatePhotoProviderRequestManifest(
  manifest: PhotoProviderRequestManifestV1
): PhotoProviderRequestDiagnostic[] {
  const diagnostics: PhotoProviderRequestDiagnostic[] = [];

  if (manifest.contractVersion !== "photo-provider-request.v1") {
    diagnostics.push({
      code: "invalid_contract_version",
      severity: "error",
      message: "Photo provider request manifest must use photo-provider-request.v1.",
    });
  }

  if (manifest.prompt.intent.trim().length === 0) {
    diagnostics.push({
      code: "missing_intent",
      severity: "error",
      message: "Photo provider request manifest requires an intent prompt.",
    });
  }

  if (manifest.layers.length === 0) {
    diagnostics.push({
      code: "empty_layer_set",
      severity: "error",
      message: "Photo provider request manifest requires at least one layer request.",
    });
  }

  if (manifest.approval.approvedForProviderExecution !== false) {
    diagnostics.push({
      code: "provider_execution_preapproved",
      severity: "error",
      message: "Photo provider execution must not be pre-approved by the dry-run request.",
    });
  }

  if (
    manifest.security.dryRun !== true ||
    manifest.security.providerExecutionAllowed !== false ||
    manifest.security.providerExecuted !== false ||
    manifest.security.noExecutionPerformed !== true
  ) {
    diagnostics.push({
      code: "unsafe_provider_security",
      severity: "error",
      message: "Photo provider request manifest must preserve the non-execution security boundary.",
    });
  }

  return diagnostics;
}
