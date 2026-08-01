import {
  createPhotoProviderAdapterJob,
  validatePhotoProviderAdapterDescriptor,
  validatePhotoProviderAdapterJob,
  type PhotoProviderAdapterDescriptorV1,
  type PhotoProviderAdapterDiagnostic,
  type PhotoProviderAdapterJobV1,
} from "./PhotoProviderAdapterContract";
import {
  validatePhotoProviderRequestManifest,
  type PhotoProviderRequestDiagnostic,
  type PhotoProviderRequestManifestV1,
} from "./PhotoProviderRequestContract";
import {
  createProviderExecutionApprovalCompletedEvent,
  createProviderExecutionApprovalFailedEvent,
  createProviderExecutionApprovalRequestedEvent,
  recordWorkspaceAuditEvent,
} from "../../../workspace/WorkspaceAuditService";

export const DEFAULT_PHOTO_PROVIDER_ADAPTER: PhotoProviderAdapterDescriptorV1 = {
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
    maxLayers: 12,
  },
  security: {
    requiresExplicitApproval: true,
    executesOutsideRuntimeMock: true,
    storesSecrets: false,
  },
};

export type PhotoProviderApprovalDiagnostic =
  | PhotoProviderAdapterDiagnostic
  | PhotoProviderRequestDiagnostic;

export interface PhotoProviderApprovalResult {
  success: boolean;
  job?: PhotoProviderAdapterJobV1;
  diagnostics: PhotoProviderApprovalDiagnostic[];
}

function createId(prefix: string): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `${prefix}_${crypto.randomUUID()}`;
  }
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function approvePhotoProviderRequest(input: {
  providerRequest: PhotoProviderRequestManifestV1;
  adapter?: PhotoProviderAdapterDescriptorV1;
  actorId: string;
  userConfirmedProviderExecution: boolean;
  approvedAtUtc?: string;
}): PhotoProviderApprovalResult {
  const adapter = input.adapter ?? DEFAULT_PHOTO_PROVIDER_ADAPTER;
  const now = input.approvedAtUtc ?? new Date().toISOString();
  const approvalId = createId("photo_provider_approval");

  recordWorkspaceAuditEvent(
    createProviderExecutionApprovalRequestedEvent({
      id: `${approvalId}_requested`,
      studioId: "photo",
      title: "Photo Provider Approval Requested",
      message: `Provider approval requested for '${adapter.providerId}'.`,
      timestamp: now,
      metadata: {
        approvalId,
        providerId: adapter.providerId,
        actorId: input.actorId,
        userConfirmedProviderExecution: input.userConfirmedProviderExecution,
      },
    })
  );

  const diagnostics: PhotoProviderApprovalDiagnostic[] = [
    ...validatePhotoProviderRequestManifest(input.providerRequest),
    ...validatePhotoProviderAdapterDescriptor(adapter),
  ];

  if (!input.userConfirmedProviderExecution) {
    diagnostics.push({
      code: "provider_approval_missing",
      severity: "error",
      message: "Photo provider approval requires explicit user confirmation.",
    });
  }

  if (diagnostics.length > 0) {
    recordWorkspaceAuditEvent(
      createProviderExecutionApprovalFailedEvent({
        id: `${approvalId}_failed`,
        studioId: "photo",
        title: "Photo Provider Approval Failed",
        message: diagnostics[0]?.message ?? "Photo provider approval failed.",
        timestamp: now,
        metadata: {
          approvalId,
          providerId: adapter.providerId,
          actorId: input.actorId,
          diagnosticCodes: diagnostics.map((diagnostic) => diagnostic.code),
        },
      })
    );
    return { success: false, diagnostics };
  }

  const job = createPhotoProviderAdapterJob({
    providerRequest: input.providerRequest,
    adapter,
    approval: {
      approvalId,
      approvedBy: input.actorId,
      approvedAtUtc: now,
      userConfirmedProviderExecution: input.userConfirmedProviderExecution,
    },
  });

  const jobDiagnostics = validatePhotoProviderAdapterJob(job);
  if (jobDiagnostics.length > 0) {
    recordWorkspaceAuditEvent(
      createProviderExecutionApprovalFailedEvent({
        id: `${approvalId}_failed`,
        studioId: "photo",
        title: "Photo Provider Approval Failed",
        message: jobDiagnostics[0]?.message ?? "Photo provider adapter job validation failed.",
        timestamp: now,
        metadata: {
          approvalId,
          providerId: adapter.providerId,
          actorId: input.actorId,
          diagnosticCodes: jobDiagnostics.map((diagnostic) => diagnostic.code),
        },
      })
    );
    return { success: false, diagnostics: jobDiagnostics };
  }

  recordWorkspaceAuditEvent(
    createProviderExecutionApprovalCompletedEvent({
      id: `${approvalId}_completed`,
      studioId: "photo",
      title: "Photo Provider Approval Completed",
      message: `Provider adapter job approved for '${adapter.providerId}' without executing provider code.`,
      timestamp: now,
      metadata: {
        approvalId,
        providerId: adapter.providerId,
        actorId: input.actorId,
        jobContractVersion: job.contractVersion,
        providerExecutionAllowed: job.security.providerExecutionAllowed,
        providerExecuted: job.security.providerExecuted,
        runtimeCodeLoaded: job.security.runtimeCodeLoaded,
        moduleUrlExecuted: job.security.moduleUrlExecuted,
      },
    })
  );

  return { success: true, job, diagnostics: [] };
}
