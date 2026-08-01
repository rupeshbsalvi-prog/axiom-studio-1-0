import type { PhotoProviderRequestManifestV1 } from "./PhotoProviderRequestContract";

export interface PhotoProviderAdapterDescriptorV1 {
  contractVersion: "photo-provider-adapter.v1";
  providerId: string;
  displayName: string;
  capabilities: {
    imageGeneration: boolean;
    transparentBackground: boolean;
    layeredOutput: boolean;
  };
  limits: {
    maxWidth: number;
    maxHeight: number;
    maxLayers: number;
  };
  security: {
    requiresExplicitApproval: true;
    executesOutsideRuntimeMock: true;
    storesSecrets: false;
  };
}

export interface PhotoProviderExecutionApprovalV1 {
  approvalId: string;
  approvedBy: string;
  approvedAtUtc: string;
  userConfirmedProviderExecution: boolean;
}

export interface PhotoProviderAdapterJobV1 {
  contractVersion: "photo-provider-adapter-job.v1";
  status: "ready_for_provider_execution";
  providerRequest: PhotoProviderRequestManifestV1;
  adapter: PhotoProviderAdapterDescriptorV1;
  approval: PhotoProviderExecutionApprovalV1;
  security: {
    providerExecutionAllowed: boolean;
    providerExecuted: false;
    runtimeCodeLoaded: false;
    moduleUrlExecuted: false;
  };
}

export interface PhotoProviderAdapterDiagnostic {
  code:
    | "invalid_adapter_contract"
    | "provider_id_missing"
    | "image_generation_unsupported"
    | "transparent_background_unsupported"
    | "layered_output_unsupported"
    | "unsafe_adapter_security"
    | "provider_approval_missing"
    | "provider_request_preapproved"
    | "canvas_limit_exceeded"
    | "layer_limit_exceeded"
    | "provider_already_executed";
  severity: "error";
  message: string;
}

export function validatePhotoProviderAdapterDescriptor(
  adapter: PhotoProviderAdapterDescriptorV1
): PhotoProviderAdapterDiagnostic[] {
  const diagnostics: PhotoProviderAdapterDiagnostic[] = [];

  if (adapter.contractVersion !== "photo-provider-adapter.v1") {
    diagnostics.push({
      code: "invalid_adapter_contract",
      severity: "error",
      message: "Photo provider adapter must use photo-provider-adapter.v1.",
    });
  }

  if (adapter.providerId.trim().length === 0) {
    diagnostics.push({
      code: "provider_id_missing",
      severity: "error",
      message: "Photo provider adapter requires a provider id.",
    });
  }

  if (adapter.capabilities.imageGeneration !== true) {
    diagnostics.push({
      code: "image_generation_unsupported",
      severity: "error",
      message: "Photo provider adapter must support image generation.",
    });
  }

  if (adapter.capabilities.transparentBackground !== true) {
    diagnostics.push({
      code: "transparent_background_unsupported",
      severity: "error",
      message: "Photo provider adapter must support transparent-background generation.",
    });
  }

  if (adapter.capabilities.layeredOutput !== true) {
    diagnostics.push({
      code: "layered_output_unsupported",
      severity: "error",
      message: "Photo provider adapter must support layered output.",
    });
  }

  if (
    adapter.security.requiresExplicitApproval !== true ||
    adapter.security.executesOutsideRuntimeMock !== true ||
    adapter.security.storesSecrets !== false
  ) {
    diagnostics.push({
      code: "unsafe_adapter_security",
      severity: "error",
      message: "Photo provider adapter security flags do not preserve the approval boundary.",
    });
  }

  return diagnostics;
}

export function createPhotoProviderAdapterJob(input: {
  providerRequest: PhotoProviderRequestManifestV1;
  adapter: PhotoProviderAdapterDescriptorV1;
  approval: PhotoProviderExecutionApprovalV1;
}): PhotoProviderAdapterJobV1 {
  return {
    contractVersion: "photo-provider-adapter-job.v1",
    status: "ready_for_provider_execution",
    providerRequest: input.providerRequest,
    adapter: input.adapter,
    approval: input.approval,
    security: {
      providerExecutionAllowed: input.approval.userConfirmedProviderExecution === true,
      providerExecuted: false,
      runtimeCodeLoaded: false,
      moduleUrlExecuted: false,
    },
  };
}

export function validatePhotoProviderAdapterJob(
  job: PhotoProviderAdapterJobV1
): PhotoProviderAdapterDiagnostic[] {
  const diagnostics: PhotoProviderAdapterDiagnostic[] = [
    ...validatePhotoProviderAdapterDescriptor(job.adapter),
  ];

  if (job.approval.userConfirmedProviderExecution !== true || job.security.providerExecutionAllowed !== true) {
    diagnostics.push({
      code: "provider_approval_missing",
      severity: "error",
      message: "Photo provider adapter jobs require explicit user confirmation before provider execution.",
    });
  }

  if (job.providerRequest.approval.approvedForProviderExecution !== false) {
    diagnostics.push({
      code: "provider_request_preapproved",
      severity: "error",
      message: "Provider request manifests must not self-approve provider execution.",
    });
  }

  if (
    job.providerRequest.canvas.width > job.adapter.limits.maxWidth ||
    job.providerRequest.canvas.height > job.adapter.limits.maxHeight
  ) {
    diagnostics.push({
      code: "canvas_limit_exceeded",
      severity: "error",
      message: "Photo provider request canvas exceeds adapter limits.",
    });
  }

  if (job.providerRequest.layers.length > job.adapter.limits.maxLayers) {
    diagnostics.push({
      code: "layer_limit_exceeded",
      severity: "error",
      message: "Photo provider request layer count exceeds adapter limits.",
    });
  }

  if (
    job.security.providerExecuted !== false ||
    job.security.runtimeCodeLoaded !== false ||
    job.security.moduleUrlExecuted !== false
  ) {
    diagnostics.push({
      code: "provider_already_executed",
      severity: "error",
      message: "Photo provider adapter jobs must be non-executed envelopes at creation time.",
    });
  }

  return diagnostics;
}
