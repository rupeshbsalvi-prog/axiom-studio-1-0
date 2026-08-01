/**
 * Phase 28/29 — Photo Provider Live Execution Service
 *
 * Phase 28C: synchronous gateway. Phase 29: async enqueue via POST /api/photo/provider-gateway.
 *
 * Orchestrates the live provider job lifecycle:
 *   1. Authority evaluation (PhotoProviderLiveAuthorityService)
 *   2. Pre-execution audit
 *   3. Request payload construction (metadata-only)
 *   4. Phase 29: Async enqueue via POST /api/photo/provider-gateway (202 Accepted)
 *   5. liveRun record template built (security flags false until provider boundary confirmed)
 *   6. Post-enqueue audit (not post-execution — caller finalizes on terminal poll state)
 *
 * SECURITY INVARIANTS:
 *   - Authority must be granted before any gateway call.
 *   - Parent job security flags are NEVER mutated by this service.
 *   - No credentials, endpoint URLs, or raw response blobs enter the liveRun record.
 *   - providerExecuted/networkAccessed/providerApiCalled set false at enqueue time.
 *     Caller MUST set these true only when provider boundary was confirmed attempted.
 *   - No liveRun created for queued cancellations or non-executed jobs.
 */

import type { AxiomProjectDraft, PhotoProviderLiveRunRecordV1 } from "../../projects/projectDraft";
import type { PhotoProviderReadinessReportV1 } from "./PhotoProviderReadinessPolicyTypes";
import { PhotoProviderLiveAuthorityService } from "./PhotoProviderLiveAuthorityService";
import {
  PROMPT_LENGTH_CAP,
} from "./PhotoProviderLiveRequestTypes";
import type {
  PhotoProviderLiveRequestPayload,
} from "./PhotoProviderLiveRequestTypes";
import {
  recordWorkspaceAuditEvent,
  createProviderLiveExecutionRequestedEvent,
  createProviderLiveExecutionFailedEvent,
} from "../../../workspace/WorkspaceAuditService";
import { AXPKG_LIMITS } from "../../projects/axpkg/AxpkgTypes";

export interface PhotoProviderLiveExecutionInput {
  project: AxiomProjectDraft;
  jobId: string;
  actor: string;
  readinessReport: PhotoProviderReadinessReportV1;
  secondConfirmationAcknowledged: boolean;
  gatewayAccessToken?: string;
  gatewaySessionAuthenticated?: boolean;
}

export interface PhotoProviderLiveExecutionResult {
  success: boolean;
  /** Phase 29: returned on successful enqueue — caller uses to start polling. */
  providerJobId?: string;
  /** Phase 29: metadata for caller to build the liveRun record at terminal state. */
  liveRunMetadata?: {
    liveRunId: string;
    jobId: string;
    providerId: string;
    routeId: "photo.generate.dev";
    requestedAt: string;
    requestLimits: {
      promptLengthCap: number;
      maxWidth: number;
      maxHeight: number;
      maxLayers: number;
    };
    studioId: string;
  };
  /** Phase 28C compat: synchronous liveRun record (unused in Phase 29). */
  liveRunRecord?: import("../../projects/projectDraft").PhotoProviderLiveRunRecordV1;
  candidateId?: string;
  diagnostics: Array<{
    severity: "info" | "warning" | "error";
    code: string;
    message: string;
  }>;
}

function createId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `live_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export class PhotoProviderLiveExecutionService {
  /**
   * Executes the full live-like adapter boundary pipeline for an approved job.
   *
   * On success: returns a liveRunRecord with status "completed" and a candidateId
   *   pointing to the intake candidate for downstream review.
   *
   * On failure: returns a liveRunRecord with status "failed" and diagnostics.
   *   No candidateId is returned on failure.
   *
   * IMPORTANT: Callers are responsible for persisting the returned liveRunRecord
   * to project.photoProvider.liveRuns. This service does NOT mutate the project draft.
   */
  static async execute(
    input: PhotoProviderLiveExecutionInput
  ): Promise<PhotoProviderLiveExecutionResult> {
    const {
      project,
      jobId,
      actor,
      readinessReport,
      secondConfirmationAcknowledged,
      gatewayAccessToken,
      gatewaySessionAuthenticated = false,
    } = input;
    const requestedAt = new Date().toISOString();
    const liveRunId = `live_run_${createId()}`;
    const studioId = "photo" as const;

    // -----------------------------------------------------------------------
    // 1. Authority evaluation
    // -----------------------------------------------------------------------
    const authorityReport = PhotoProviderLiveAuthorityService.evaluateLiveAuthority({
      project,
      jobId,
      readinessReport,
      secondConfirmationAcknowledged,
    });

    if (!authorityReport.authorityGranted) {
      // Authority denied: record failed audit, return no liveRun
      recordWorkspaceAuditEvent(
        createProviderLiveExecutionFailedEvent({
          id: `audit_live_exec_auth_fail_${liveRunId}`,
          studioId,
          title: "Live Execution Authority Denied",
          message: `Live execution authority denied for job ${jobId} by actor ${actor}.`,
          timestamp: requestedAt,
          metadata: {
            liveRunId,
            jobId,
            actor,
            authorityGranted: false,
            checkCount: authorityReport.checks.length,
          },
        })
      );

      return {
        success: false,
        diagnostics: authorityReport.diagnostics,
      };
    }

    if (!gatewayAccessToken && !gatewaySessionAuthenticated) {
      const diagnostic = {
        severity: "error" as const,
        code: "gateway_access_token_missing",
        message: "An authenticated runtime access token is required for gateway dispatch.",
      };
      recordWorkspaceAuditEvent(
        createProviderLiveExecutionFailedEvent({
          id: `audit_live_exec_auth_missing_${liveRunId}`,
          studioId,
          title: "Live Execution Authentication Missing",
          message: `Live execution was not dispatched for job ${jobId}.`,
          timestamp: requestedAt,
          metadata: { liveRunId, jobId, actor, authorityGranted: true },
        })
      );
      return { success: false, diagnostics: [diagnostic] };
    }

    // -----------------------------------------------------------------------
    // 2. Pre-execution audit (authority granted, about to dispatch)
    // -----------------------------------------------------------------------
    const job = project.photoProvider!.jobs.find((j) => j.approval.approvalId === jobId)!;
    const providerId = job.adapter.providerId as "mock-photo-provider";
    const routeId = "photo.generate.dev" as const;

    recordWorkspaceAuditEvent(
      createProviderLiveExecutionRequestedEvent({
        id: `audit_live_exec_req_${liveRunId}`,
        studioId,
        title: "Live Execution Requested",
        message: `Live-like adapter boundary execution requested for job ${jobId} via routeId '${routeId}'.`,
        timestamp: requestedAt,
        metadata: {
          liveRunId,
          jobId,
          actor,
          routeId,
          providerId,
          authorityGranted: true,
        },
      })
    );

    // -----------------------------------------------------------------------
    // 3. Build metadata-only request payload (no credentials, no raw image data)
    // -----------------------------------------------------------------------
    const rawPrompt = job.providerRequest.prompt.intent;
    const truncatedPrompt = rawPrompt.slice(0, PROMPT_LENGTH_CAP);

    const requestPayload: PhotoProviderLiveRequestPayload = {
      contractVersion: "photo-provider-live-request.v1",
      routeId,
      promptText: truncatedPrompt,
      canvasHint: {
        width: job.providerRequest.canvas.width,
        height: job.providerRequest.canvas.height,
        aspectRatio: job.providerRequest.canvas.aspectRatio,
        transparentBackground: job.providerRequest.canvas.transparentBackgroundRequired,
      },
      layers: job.providerRequest.layers.map((layer) => ({
        index: layer.index,
        label: layer.name,
        type: layer.type,
        blendMode: layer.blendMode,
        opacity: layer.opacity,
        transparentBackgroundRequired: true as const,
      })),
      security: {
        dryRunPreview: false,
        noRealProviderCalled: false,
        providerId,
        secretsIncluded: false,
        endpointUrlIncluded: false,
      },
    };

    // -----------------------------------------------------------------------
    // 4. Gateway dispatch — Phase 29: enqueue async job (202 Accepted)
    // -----------------------------------------------------------------------
    let providerJobId: string | undefined;
    let enqueueSucceeded = false;
    const enqueueHeaders: Record<string, string> = { "Content-Type": "application/json" };
    if (gatewayAccessToken) enqueueHeaders.Authorization = `Bearer ${gatewayAccessToken}`;

    try {
      const enqueueResponse = await fetch("/api/photo/provider-gateway", {
        method: "POST",
        headers: enqueueHeaders,
        credentials: "include",
        body: JSON.stringify(requestPayload),
      });

      if (enqueueResponse.status === 202) {
        const enqueueData = await enqueueResponse.json();
        providerJobId = typeof enqueueData.jobId === "string" ? enqueueData.jobId : undefined;
        enqueueSucceeded = !!providerJobId;
      } else {
        const gatewayFailed = {
          success: false,
          diagnostics: [{
            severity: "error" as const,
            code: "gateway_enqueue_failed",
            message: `Provider job enqueue returned HTTP ${enqueueResponse.status}.`,
          }],
        };

        recordWorkspaceAuditEvent(
          createProviderLiveExecutionFailedEvent({
            id: `audit_live_exec_fail_${liveRunId}`,
            studioId,
            title: "Live Execution Enqueue Failed",
            message: `Provider job enqueue failed for job ${jobId}.`,
            timestamp: new Date().toISOString(),
            metadata: { liveRunId, jobId, actor, routeId, providerId },
          })
        );

        return {
          success: false,
          diagnostics: gatewayFailed.diagnostics,
        };
      }
    } catch (err) {
      recordWorkspaceAuditEvent(
        createProviderLiveExecutionFailedEvent({
          id: `audit_live_exec_fail_${liveRunId}`,
          studioId,
          title: "Live Execution Network Error",
          message: `Provider job enqueue network error for job ${jobId}.`,
          timestamp: new Date().toISOString(),
          metadata: { liveRunId, jobId, actor, routeId, providerId },
        })
      );
      return {
        success: false,
        diagnostics: [{
          severity: "error",
          code: "gateway_network_error",
          message: `Gateway enqueue failed: ${err instanceof Error ? err.message : String(err)}`,
        }],
      };
    }

    if (!enqueueSucceeded || !providerJobId) {
      return {
        success: false,
        diagnostics: [{
          severity: "error",
          code: "gateway_enqueue_no_job_id",
          message: "Provider job enqueue did not return a jobId.",
        }],
      };
    }

    // -----------------------------------------------------------------------
    // 5. Post-enqueue audit (enqueued — not yet executed)
    // -----------------------------------------------------------------------
    const completedAt = new Date().toISOString();

    recordWorkspaceAuditEvent(
      createProviderLiveExecutionRequestedEvent({
        id: `audit_live_exec_enqueued_${liveRunId}`,
        studioId,
        title: "Live Execution Enqueued",
        message: `Provider job enqueued for job ${jobId}. providerJobId: ${providerJobId}.`,
        timestamp: completedAt,
        metadata: {
          liveRunId,
          jobId,
          actor,
          routeId,
          providerId,
          providerJobId,
          // Audit truth: provider not yet executed at this point
          providerExecuted: false,
          networkAccessed: false,
          providerApiCalled: false,
        },
      })
    );

    // Return providerJobId + metadata for caller to build liveRun at terminal state.
    // Phase 29 contract: NO liveRunRecord built here with false security flags —
    // the schema requires providerExecuted: true (literal), enforced at the call site.
    return {
      success: true,
      providerJobId,
      liveRunMetadata: {
        liveRunId,
        jobId,
        providerId,
        routeId,
        requestedAt,
        requestLimits: {
          promptLengthCap: PROMPT_LENGTH_CAP,
          maxWidth: job.adapter.limits.maxWidth,
          maxHeight: job.adapter.limits.maxHeight,
          maxLayers: job.adapter.limits.maxLayers,
        },
        studioId,
      },
      diagnostics: [],
    };
  }
}
