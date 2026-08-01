import React, { useState } from "react";
import type { AxiomProjectDraft } from "../app/projects/projectDraft";
import { createEmptyPhotoProviderBlock, isSandboxProvenanceV1 } from "../app/projects/projectDraft";
import { projectAssemblyPlanToCanvasPreview } from "./CanvasAssemblyProjectionService";
import { applyCanvasProjectionToDraft, rollbackCanvasProjectionMutation } from "./CanvasApplyService";
import { AlertTriangle, CheckCircle, RefreshCw, Layers, History, Shield, Play } from "lucide-react";
import {
  approvePhotoProviderRequest,
  DEFAULT_PHOTO_PROVIDER_ADAPTER,
} from "../app/studios/photo/PhotoProviderApprovalGate";
import type { PhotoProviderRequestManifestV1 } from "../app/studios/photo/PhotoProviderRequestContract";
import { PhotoProviderSandboxService } from "../app/studios/photo/PhotoProviderSandboxService";
import { PhotoProviderReadinessPolicyService } from "../app/studios/photo/PhotoProviderReadinessPolicyService";
import type { PhotoProviderReadinessReportV1 } from "../app/studios/photo/PhotoProviderReadinessPolicyTypes";
import { serializeCanvasPreviewState } from "./CanvasPreviewIntakeService";
import { PhotoProviderLiveAuthorityService } from "../app/studios/photo/PhotoProviderLiveAuthorityService";
import { PhotoProviderLiveExecutionService } from "../app/studios/photo/PhotoProviderLiveExecutionService";
import { PhotoProviderLiveEnablementService } from "../app/studios/photo/PhotoProviderLiveEnablementService";
import { establishConfiguredPhotoGatewaySession } from "../app/studios/photo/PhotoProviderGatewaySessionService";
import {
  startPolling,
  stopPolling,
} from "../app/studios/photo/PhotoProviderJobPollingService";
import type { PhotoProviderJobStatus } from "../app/studios/photo/PhotoProviderJobPollingService";

export interface WorkspaceProjectionsPanelProps {
  project: AxiomProjectDraft | null;
  onUpdateProject: (project: AxiomProjectDraft) => void;
  actorId?: string;
  gatewayAccessToken?: string;
  gatewaySessionAuthenticated?: boolean;
}

export function WorkspaceProjectionsPanel({
  project,
  onUpdateProject,
  actorId = "workspace-ui",
  gatewayAccessToken,
  gatewaySessionAuthenticated = false,
}: WorkspaceProjectionsPanelProps) {
  const [confirmedProjectionId, setConfirmedProjectionId] = useState<string | null>(null);
  const [confirmedProviderCandidateId, setConfirmedProviderCandidateId] = useState<string | null>(null);
  const [rollbackReasons, setRollbackReasons] = useState<Record<string, string>>({});
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [readinessReports, setReadinessReports] = useState<Record<string, PhotoProviderReadinessReportV1>>({});
  const [mockCredentialsStaged, setMockCredentialsStaged] = useState<Record<string, boolean>>({});
  const [checkingReadinessId, setCheckingReadinessId] = useState<string | null>(null);
  const [secondConfirmations, setSecondConfirmations] = useState<Record<string, boolean>>({});
  const [executingLiveId, setExecutingLiveId] = useState<string | null>(null);
  const [gatewaySessionReady, setGatewaySessionReady] = useState(gatewaySessionAuthenticated);
  // Phase 29: per-job async status (transient — never persisted to liveRuns or project draft)
  const [activeJobStatuses, setActiveJobStatuses] = useState<Record<string, PhotoProviderJobStatus | null>>({});
  const [pollingTimeoutJobs, setPollingTimeoutJobs] = useState<Record<string, boolean>>({});
  // Maps frontendJobId → backend providerJobId for cancel operations
  const [activeProviderJobIds, setActiveProviderJobIds] = useState<Record<string, string>>({});

  const renderProvenanceEvidence = (metadata: Record<string, unknown> | undefined) => {
    if (!metadata?.provenance) {
      return (
        <span style={{ fontSize: "8px", background: "rgba(148, 163, 184, 0.15)", color: "#94a3b8", padding: "2px 6px", borderRadius: "4px", fontWeight: 600 }}>
          Not sandbox-origin
        </span>
      );
    }

    const prov = metadata.provenance;
    if (typeof prov === "object" && prov !== null && (prov as any).type === "photo-provider-sandbox-provenance.v1") {
      if (isSandboxProvenanceV1(prov)) {
        return (
          <div style={{ display: "flex", flexDirection: "column", gap: "4px", margin: "6px 0", background: "rgba(16, 185, 129, 0.05)", border: "1px solid rgba(16, 185, 129, 0.15)", padding: "8px", borderRadius: "6px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                <Shield size={10} style={{ color: "#34d399" }} />
                <span style={{ fontSize: "9px", fontWeight: 700, color: "#34d399" }}>SANDBOX PROVENANCE VERIFIED</span>
              </div>
              <span style={{ fontSize: "8px", color: "#64748b", fontFamily: "monospace" }}>Run: {prov.sandboxRunId.slice(-6)}</span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4px", fontSize: "8px", color: "#a7f3d0", fontFamily: "monospace" }}>
              <div>✔ providerExecuted: false</div>
              <div>✔ runtimeCodeLoaded: false</div>
              <div>✔ moduleUrlExecuted: false</div>
              <div>✔ networkAccessed: false</div>
              <div>✔ providerApiCalled: false</div>
            </div>
          </div>
        );
      } else {
        return (
          <div style={{ display: "flex", flexDirection: "column", gap: "4px", margin: "6px 0", background: "rgba(239, 68, 68, 0.05)", border: "1px solid rgba(239, 68, 68, 0.2)", padding: "8px", borderRadius: "6px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
              <AlertTriangle size={12} style={{ color: "#f87171" }} />
              <span style={{ fontSize: "9px", fontWeight: 700, color: "#f87171" }}>UNTRUSTED/INVALID SANDBOX PROVENANCE</span>
            </div>
            <div style={{ fontSize: "8px", color: "#fca5a5" }}>
              Security checks failed: provenance payload does not match non-execution invariants.
            </div>
          </div>
        );
      }
    }

    return (
      <span style={{ fontSize: "8px", background: "rgba(148, 163, 184, 0.15)", color: "#94a3b8", padding: "2px 6px", borderRadius: "4px", fontWeight: 600 }}>
        Not sandbox-origin
      </span>
    );
  };

  if (!project) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", gap: "8px", opacity: 0.4, padding: "16px" }}>
        <AlertTriangle size={24} />
        <span style={{ fontSize: "11px", textAlign: "center" }}>No active project draft loaded.</span>
      </div>
    );
  }

  const previewBlock = project.canvasPreview || {
    candidates: [],
    assemblyPlans: [],
    projections: [],
    applications: [],
  };

  const handleGenerateProjection = (planId: string) => {
    setErrorMsg(null);
    setSuccessMsg(null);
    const plan = previewBlock.assemblyPlans.find((p) => p.id === planId);
    if (!plan) {
      setErrorMsg("Assembly plan not found.");
      return;
    }

    const result = projectAssemblyPlanToCanvasPreview(plan);
    if (result.success && result.projection) {
      const updatedProject: AxiomProjectDraft = {
        ...project,
        canvasPreview: {
          ...previewBlock,
          schemaVersion: "0.5.0",
          savedAt: new Date().toISOString(),
          projections: [
            ...previewBlock.projections.filter((p) => p.assemblyPlanId !== planId),
            result.projection,
          ],
        },
      };
      onUpdateProject(updatedProject);
      setSuccessMsg(`Preview projection generated for plan '${planId}'.`);
    } else {
      setErrorMsg(result.diagnostics[0]?.message || "Failed to project assembly plan.");
    }
  };

  const getProviderRequestFromCandidate = (candidate: typeof previewBlock.candidates[number]) => {
    const request = candidate.preview.metadata?.providerRequest;
    return request && typeof request === "object"
      ? (request as PhotoProviderRequestManifestV1)
      : null;
  };

  const handleApproveProviderRequest = (candidateId: string) => {
    setErrorMsg(null);
    setSuccessMsg(null);

    const candidate = previewBlock.candidates.find((item) => item.id === candidateId);
    if (!candidate) {
      setErrorMsg("Provider request candidate not found.");
      return;
    }

    const providerRequest = getProviderRequestFromCandidate(candidate);
    if (!providerRequest) {
      setErrorMsg("Provider request metadata not found.");
      return;
    }

    const isConfirmed = confirmedProviderCandidateId === candidateId;
    const result = approvePhotoProviderRequest({
      providerRequest,
      adapter: DEFAULT_PHOTO_PROVIDER_ADAPTER,
      actorId,
      userConfirmedProviderExecution: isConfirmed,
    });

    if (!result.success || !result.job) {
      setErrorMsg(result.diagnostics[0]?.message || "Provider approval failed.");
      return;
    }

    // Persist the approved job into the typed AXPKG 0.6.0 photo provider block.
    // Guard for legacy session objects that pre-date Phase 24 (photoProvider may be absent).
    const existingBlock = project.photoProvider ?? createEmptyPhotoProviderBlock();
    const existingJobs = existingBlock.jobs ?? [];

    onUpdateProject({
      ...project,
      photoProvider: {
        ...existingBlock,
        savedAt: new Date().toISOString(),
        jobs: [...existingJobs, result.job],
      },
    });
    setConfirmedProviderCandidateId(null);
    setSuccessMsg(`Provider adapter job approved for '${result.job.adapter.providerId}'.`);
  };

  const handleRunSandboxSimulation = (jobId: string) => {
    setErrorMsg(null);
    setSuccessMsg(null);

    const existingBlock = project.photoProvider ?? createEmptyPhotoProviderBlock();
    const job = existingBlock.jobs?.find((j) => j.approval.approvalId === jobId);
    if (!job) {
      setErrorMsg("Job not found.");
      return;
    }

    try {
      const runRecord = PhotoProviderSandboxService.simulate(job);
      const existingRuns = existingBlock.sandboxRuns ?? [];

      onUpdateProject({
        ...project,
        photoProvider: {
          ...existingBlock,
          savedAt: new Date().toISOString(),
          sandboxRuns: [...existingRuns, runRecord],
        },
      });

      if (runRecord.status === "simulated_completed") {
        setSuccessMsg(`Sandbox simulation completed successfully. Candidate queued.`);
      } else {
        setErrorMsg(`Sandbox simulation failed: ${runRecord.diagnostics[0]?.message || "unknown error"}`);
      }
    } catch (err: any) {
      setErrorMsg(`Sandbox simulation crashed: ${err.message || err}`);
    }
  };

  const handleToggleMockCredential = (providerId: string) => {
    const currentlyStaged = !!mockCredentialsStaged[providerId];
    if (currentlyStaged) {
      PhotoProviderReadinessPolicyService.clearMockProviderCredential(providerId);
      setMockCredentialsStaged(prev => ({ ...prev, [providerId]: false }));
    } else {
      PhotoProviderReadinessPolicyService.stageMockProviderCredential(providerId);
      setMockCredentialsStaged(prev => ({ ...prev, [providerId]: true }));
    }
  };

  const handleCheckReadiness = async (jobId: string) => {
    setCheckingReadinessId(jobId);
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      const report = await PhotoProviderReadinessPolicyService.verifyReadiness({
        project,
        jobId,
        actor: actorId,
        environment: {
          sandboxIsolationVerified: true,
          networkPolicyBlocked: true,
          providerApiPolicyBlocked: true
        }
      });
      setReadinessReports(prev => ({ ...prev, [jobId]: report }));
      if (report.readinessSatisfied) {
        setSuccessMsg("Execution readiness check passed.");
      } else {
        setErrorMsg("Execution readiness check failed.");
      }
    } catch (e: any) {
      setErrorMsg(`Readiness policy check failed: ${e.message}`);
    } finally {
      setCheckingReadinessId(null);
    }
  };

  /**
   * Phase 29 — Async live execution.
   *
   * Enqueues a provider job via POST /api/photo/provider-gateway (returns 202 + jobId).
   * Starts polling via PhotoProviderJobPollingService (2s interval, 120s max).
   * Polling timeout stops UI only — does NOT cancel the backend job.
   *
   * GUARDRAILS:
   *   - No liveRun created for queued cancellation or non-executed jobs.
   *   - liveRun only appended when provider boundary was actually attempted
   *     AND security flags are truthful (completed or failed with provider attempt).
   *   - providerExecuted/networkAccessed/providerApiCalled true only when
   *     gateway/provider attempt actually occurred.
   */
  const handleExecuteLive = async (jobId: string) => {
    setErrorMsg(null);
    setSuccessMsg(null);
    setPollingTimeoutJobs(prev => ({ ...prev, [jobId]: false }));
    const existingBlock = project.photoProvider || createEmptyPhotoProviderBlock();

    const job = existingBlock.jobs.find((j) => j.approval.approvalId === jobId);
    if (!job) {
      setErrorMsg("Job not found.");
      return;
    }

    const report = readinessReports[jobId];
    if (!report || !report.readinessSatisfied) {
      setErrorMsg("Readiness check has not passed.");
      return;
    }

    setExecutingLiveId(jobId);
    setActiveJobStatuses(prev => ({ ...prev, [jobId]: null }));

    try {
      // Phase 29: enqueue via async route (202 Accepted)
      const result = await PhotoProviderLiveExecutionService.execute({
        project,
        jobId,
        actor: actorId,
        readinessReport: report,
        secondConfirmationAcknowledged: !!secondConfirmations[jobId],
        gatewaySessionAuthenticated: gatewaySessionReady,
      });

      if (!result.success || !result.providerJobId) {
        // Authority denied or enqueue failed — no liveRun created
        setErrorMsg(result.diagnostics[0]?.message || "Live execution enqueue failed.");
        setExecutingLiveId(null);
        return;
      }

      const providerJobId = result.providerJobId;
      // Track backend job ID so the cancel button can reference it from render scope
      setActiveProviderJobIds(prev => ({ ...prev, [jobId]: providerJobId }));

      startPolling(
        providerJobId,
        (status) => {
          setActiveJobStatuses(prev => ({ ...prev, [jobId]: status }));
        },
        (terminalStatus, timedOut) => {
          setActiveJobStatuses(prev => ({ ...prev, [jobId]: terminalStatus }));
          setExecutingLiveId(null);

          if (timedOut) {
            // Polling timeout: UI-only stop, backend job continues.
            // No liveRun created, no failed audit.
            setPollingTimeoutJobs(prev => ({ ...prev, [jobId]: true }));
            return;
          }

          // Queued cancellation: no liveRun, no providerExecuted flags
          if (terminalStatus.status === "cancelled") {
            // Guard: was the job cancelled before the provider boundary was crossed?
            // In Phase 29, cancellation is queued-only, so provider was never called.
            // Do NOT create a liveRun. Only emit a minimal audit event.
            setErrorMsg("Job was cancelled before execution.");
            return;
          }

          // Only here when provider boundary was attempted (completed or failed)
          const wasProviderAttempted = terminalStatus.status === "completed" || terminalStatus.status === "failed";
          if (!wasProviderAttempted) {
            return;
          }

          if (result.liveRunMetadata) {
            const meta = result.liveRunMetadata;
            // Build liveRun record with correct literal types (providerExecuted: true is required by schema).
            // This is safe: we only reach this branch when wasProviderAttempted === true.
            const liveRunRecord: import("../app/projects/projectDraft").PhotoProviderLiveRunRecordV1 = {
              contractVersion: "photo-provider-live-run.v1",
              id: meta.liveRunId,
              jobId: meta.jobId,
              candidateId: undefined,
              providerId: meta.providerId as "mock-photo-provider",
              routeId: meta.routeId,
              status: terminalStatus.status === "completed" ? "completed" : "failed",
              requestedAt: meta.requestedAt,
              completedAt: new Date().toISOString(),
              requestLimits: meta.requestLimits,
              responseLayerCount: undefined,
              diagnostics: terminalStatus.diagnostics.map((d) => ({
                severity: d.severity,
                code: d.code,
                message: d.message,
              })),
              security: {
                // Literal true: safe because this branch only runs when provider boundary
                // was confirmed attempted (completed or failed after provider attempt).
                providerExecuted: true,
                networkAccessed: true,
                providerApiCalled: true,
                runtimeCodeLoaded: false,
                moduleUrlExecuted: false,
                secretPersisted: false,
                secretExported: false,
              },
            };

            const existingLiveRuns = (project.photoProvider ?? createEmptyPhotoProviderBlock()).liveRuns ?? [];
            const canvasPreviewState = serializeCanvasPreviewState();
            onUpdateProject({
              ...project,
              canvasPreview: {
                ...project.canvasPreview,
                savedAt: new Date().toISOString(),
                candidates: canvasPreviewState.candidates,
                assemblyPlans: canvasPreviewState.assemblyPlans,
              } as any,
              photoProvider: {
                ...(project.photoProvider ?? createEmptyPhotoProviderBlock()),
                savedAt: new Date().toISOString(),
                liveRuns: [...existingLiveRuns, liveRunRecord],
              },
            });

            if (terminalStatus.status === "completed") {
              setSuccessMsg(`Live provider job completed. Asset ready for intake.`);
            } else {
              setErrorMsg(`Live provider job failed: ${terminalStatus.diagnostics[0]?.message || "unknown error"}`);
            }
          }

        }
      );
    } catch (err: any) {
      setErrorMsg(`Live provider execution crashed: ${err.message || err}`);
      setExecutingLiveId(null);
    }
  };

  const handleCancelJob = async (providerJobId: string, frontendJobId: string) => {
    try {
      const resp = await fetch(`/api/photo/provider-jobs/${providerJobId}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (resp.status === 204) {
        stopPolling(providerJobId);
        setActiveJobStatuses(prev => ({
          ...prev,
          [frontendJobId]: { ...prev[frontendJobId]!, status: "cancelled" },
        }));
        setExecutingLiveId(null);
      } else if (resp.status === 409) {
        setErrorMsg("Job cannot be cancelled: already processing or terminal.");
      } else {
        setErrorMsg(`Cancel returned HTTP ${resp.status}.`);
      }
    } catch {
      setErrorMsg("Cancel request failed.");
    }
  };

  const handleRetryJob = (jobId: string) => {
    setActiveJobStatuses(prev => ({ ...prev, [jobId]: null }));
    setPollingTimeoutJobs(prev => ({ ...prev, [jobId]: false }));
    handleExecuteLive(jobId);
  };

  const handleEnableLive = async (jobId: string) => {
    const report = readinessReports[jobId];
    if (!report) return;

    const result = PhotoProviderLiveEnablementService.enable({
      jobId,
      actor: actorId,
      readinessReport: report,
      operatorAcknowledgedNetworkExecution: !!secondConfirmations[jobId],
    });

    if (result.success) {
      if (!gatewaySessionReady) {
        if (!gatewayAccessToken) {
          setErrorMsg("An authenticated gateway session is required before live execution can be enabled.");
          return;
        }
        const session = await establishConfiguredPhotoGatewaySession(gatewayAccessToken);
        if (!session.success) {
          setErrorMsg(`Gateway session could not be established: ${session.code ?? "unknown error"}.`);
          return;
        }
        setGatewaySessionReady(true);
      }
      setReadinessReports((previous) => ({ ...previous, [jobId]: result.report }));
      setSuccessMsg("Live provider execution enabled for this job.");
    } else {
      setErrorMsg(result.diagnostics[0]?.message ?? "Live execution enablement failed.");
    }
  };


  const handleApplyProjection = (projectionId: string) => {
    setErrorMsg(null);
    setSuccessMsg(null);
    const projection = previewBlock.projections.find((p) => p.id === projectionId);
    if (!projection) {
      setErrorMsg("Projection not found.");
      return;
    }

    const isConfirmed = confirmedProjectionId === projectionId;
    const result = applyCanvasProjectionToDraft({
      project,
      projection,
      userConfirmed: isConfirmed,
      actorId,
    });

    if (result.success && result.project) {
      onUpdateProject(result.project);
      setSuccessMsg(`Projection applied successfully to studio '${projection.studioId}'.`);
      setConfirmedProjectionId(null); // Reset confirmation
    } else {
      setErrorMsg(result.diagnostics[0]?.message || "Failed to apply projection.");
    }
  };

  const handleRollbackMutation = (mutationId: string) => {
    setErrorMsg(null);
    setSuccessMsg(null);
    const reason = rollbackReasons[mutationId] || "";
    const result = rollbackCanvasProjectionMutation({
      project,
      mutationId,
      actorId,
      reason: reason.trim() || undefined,
    });

    if (result.success && result.project) {
      onUpdateProject(result.project);
      setSuccessMsg(`Mutation '${mutationId}' successfully rolled back.`);
      setRollbackReasons((prev) => {
        const next = { ...prev };
        delete next[mutationId];
        return next;
      });
    } else {
      setErrorMsg(result.diagnostics[0]?.message || "Failed to rollback mutation.");
    }
  };

  // 1. Pending projections: approved plans that don't have a projection yet
  const pendingPlans = previewBlock.assemblyPlans.filter(
    (plan) => !previewBlock.projections.some((proj) => proj.assemblyPlanId === plan.id)
  );

  // 2. Active projections: projections that are not applied
  const activeProjections = previewBlock.projections.filter(
    (proj) =>
      !previewBlock.applications.some(
        (app) => app.projectionId === proj.id && app.status === "applied"
      )
  );

  // 3. Mutation applications sorted by applied date descending
  const sortedApplications = [...(previewBlock.applications || [])].sort(
    (a, b) => new Date(b.appliedAtUtc).getTime() - new Date(a.appliedAtUtc).getTime()
  );
  const providerRequestCandidates = previewBlock.candidates.filter(
    (candidate) => candidate.preview.metadata?.requiredAdapterContract === "photo-provider-adapter.v1" && getProviderRequestFromCandidate(candidate)
  );

  // Read approved provider jobs from the typed AXPKG block (Phase 24+)
  const approvedProviderJobs = (project.photoProvider?.jobs ?? []);

  return (
    <div className="workspace-projections-panel">
      {/* Title Header */}
      <div className="workspace-projections-panel__header">
        <Layers size={16} className="workspace-projections-panel__header-icon" />
        <span className="workspace-projections-panel__header-title">
          Projections Manager
        </span>
      </div>

      {/* Messages */}
      {(errorMsg || successMsg) && (
        <div style={{ padding: "12px 16px", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
          {errorMsg && (
            <div style={{ background: "rgba(239, 68, 68, 0.1)", border: "1px solid rgba(239, 68, 68, 0.2)", borderRadius: "6px", padding: "8px 12px", display: "flex", gap: "6px", alignItems: "center", fontSize: "11px", color: "#f87171" }}>
              <AlertTriangle size={14} />
              <span>{errorMsg}</span>
            </div>
          )}
          {successMsg && (
            <div style={{ background: "rgba(16, 185, 129, 0.1)", border: "1px solid rgba(16, 185, 129, 0.2)", borderRadius: "6px", padding: "8px 12px", display: "flex", gap: "6px", alignItems: "center", fontSize: "11px", color: "#34d399" }}>
              <CheckCircle size={14} />
              <span>{successMsg}</span>
            </div>
          )}
        </div>
      )}

      {/* Main Content */}
      <div className="workspace-projections-panel__content">
        {/* Section 0: Provider Approval Gate */}
        <div className="workspace-projections-panel__section">
          <h3 className="workspace-projections-panel__section-title">
            Provider Approval Gate ({providerRequestCandidates.length})
          </h3>
          {providerRequestCandidates.length === 0 ? (
            <div className="workspace-projections-panel__empty-state">
              No staged provider requests.
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {providerRequestCandidates.map((candidate) => {
                const providerRequest = getProviderRequestFromCandidate(candidate)!;
                const isConfirmed = confirmedProviderCandidateId === candidate.id;
                return (
                  <div key={candidate.id} className="workspace-projections-panel__card">
                    <div className="workspace-projections-panel__card-header">
                      <div>
                        <div className="workspace-projections-panel__card-title">{providerRequest.provider.requestedName}</div>
                        <div className="workspace-projections-panel__card-subtitle">Canvas: {providerRequest.canvas.width}x{providerRequest.canvas.height} · Layers: {providerRequest.layers.length}</div>
                      </div>
                      <span style={{ fontSize: "8px", fontWeight: 700, background: "rgba(245, 158, 11, 0.15)", color: "#fbbf24", padding: "2px 6px", borderRadius: "4px" }}>
                        APPROVAL REQUIRED
                      </span>
                    </div>
                    <div style={{ fontSize: "10px", color: "#94a3b8", margin: "8px 0" }}>
                      {providerRequest.prompt.intent}
                    </div>
                    {renderProvenanceEvidence(candidate.preview.metadata)}
                    <div className="workspace-projections-panel__checkbox-wrapper">
                      <input
                        type="checkbox"
                        id={`confirm-provider-${candidate.id}`}
                        checked={isConfirmed}
                        onChange={(e) => setConfirmedProviderCandidateId(e.target.checked ? candidate.id : null)}
                        style={{ cursor: "pointer" }}
                      />
                      <label htmlFor={`confirm-provider-${candidate.id}`} className="workspace-projections-panel__checkbox-label">
                        I approve provider adapter job creation
                      </label>
                    </div>
                    <button
                      onClick={() => handleApproveProviderRequest(candidate.id)}
                      disabled={!isConfirmed}
                      className="workspace-projections-panel__btn workspace-projections-panel__btn--warning"
                    >
                      <Shield size={12} />
                      Approve Provider Job
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Section 0.5: Photo Provider Approved Jobs & Sandbox Simulations */}
        <div className="workspace-projections-panel__section">
          <h3 className="workspace-projections-panel__section-title">
            Photo Provider Jobs & Sandbox runs ({approvedProviderJobs.length})
          </h3>
          {approvedProviderJobs.length === 0 ? (
            <div className="workspace-projections-panel__empty-state">
              No approved photo provider jobs.
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {approvedProviderJobs.map((job) => {
                const isExecuted = (job.security.providerExecuted as any) === true;
                const isEligible =
                  job.status === "ready_for_provider_execution" &&
                  job.approval.userConfirmedProviderExecution === true &&
                  job.security.providerExecutionAllowed === true &&
                  !isExecuted;

                const jobRuns = (project.photoProvider?.sandboxRuns ?? []).filter(
                  (run) => run.jobId === job.approval.approvalId
                );

                return (
                  <div key={job.approval.approvalId} className="workspace-projections-panel__card">
                    <div className="workspace-projections-panel__card-header">
                      <div>
                        <div className="workspace-projections-panel__card-title">{job.adapter.displayName}</div>
                        <div className="workspace-projections-panel__card-subtitle">ID: {job.approval.approvalId.slice(0, 8)}... · Status: {job.status}</div>
                      </div>
                      <span style={{ fontSize: "8px", fontWeight: 700, background: isEligible ? "rgba(16, 185, 129, 0.15)" : "rgba(239, 68, 68, 0.15)", color: isEligible ? "#34d399" : "#f87171", padding: "2px 6px", borderRadius: "4px" }}>
                        {isEligible ? "SANDBOX ELIGIBLE" : "INELIGIBLE"}
                      </span>
                    </div>

                    <div style={{ fontSize: "10px", color: "#94a3b8", margin: "6px 0" }}>
                      <strong>Prompt:</strong> {job.providerRequest.prompt.intent}
                    </div>

                    {/* Run Trigger Button */}
                    <button
                      onClick={() => handleRunSandboxSimulation(job.approval.approvalId)}
                      disabled={!isEligible}
                      className="workspace-projections-panel__btn workspace-projections-panel__btn--info"
                      style={{ marginBottom: "8px" }}
                    >
                      <Play size={12} />
                      Run Sandbox Simulation
                    </button>

                    {/* Past Runs list */}
                    {jobRuns.length > 0 && (
                      <div className="workspace-projections-panel__runs-section">
                        <span className="workspace-projections-panel__runs-title">Simulation Runs ({jobRuns.length})</span>
                        <ol className="workspace-projections-panel__run-list">
                          {jobRuns.map((run) => (
                            <li key={run.id} className="workspace-projections-panel__run-item">
                              <details className="workspace-projections-panel__run-details">
                                <summary className="workspace-projections-panel__run-summary">
                                  <span>Run: {run.id.slice(-6)}</span>
                                  <span className={`workspace-projections-panel__run-status workspace-projections-panel__run-status--${run.status === "simulated_completed" ? "completed" : "failed"}`}>
                                    {run.status === "simulated_completed" ? "COMPLETED" : "FAILED"}
                                  </span>
                                </summary>
                                <div className="workspace-projections-panel__run-content">
                                  <div className="workspace-projections-panel__run-meta">
                                    <span>Requested: {new Date(run.requestedAt).toLocaleTimeString()}</span>
                                    {run.completedAt && <span>Completed: {new Date(run.completedAt).toLocaleTimeString()}</span>}
                                  </div>
                                  {run.candidateId && (
                                    <div className="workspace-projections-panel__run-candidate">
                                      <strong>Candidate:</strong>{" "}
                                      <span className="workspace-projections-panel__run-candidate-id">
                                        {run.candidateId}
                                      </span>
                                    </div>
                                  )}
                                  <div className="workspace-projections-panel__run-security">
                                    <div className="workspace-projections-panel__run-security-title">
                                      <Shield size={10} />
                                      <span>Verified Security Invariants (Simulated Offline)</span>
                                    </div>
                                    <div className="workspace-projections-panel__run-security-grid">
                                      <div>✔ providerExecuted: {String(run.security.providerExecuted)}</div>
                                      <div>✔ runtimeCodeLoaded: {String(run.security.runtimeCodeLoaded)}</div>
                                      <div>✔ moduleUrlExecuted: {String(run.security.moduleUrlExecuted)}</div>
                                      <div>✔ networkAccessed: {String(run.security.networkAccessed)}</div>
                                      <div>✔ providerApiCalled: {String(run.security.providerApiCalled)}</div>
                                    </div>
                                  </div>
                                  {run.diagnostics.length > 0 && (
                                    <div className="workspace-projections-panel__run-diagnostics">
                                      <strong>Diagnostics:</strong>
                                      {run.diagnostics.map((d, idx) => (
                                        <div key={idx} className={`workspace-projections-panel__diagnostic workspace-projections-panel__diagnostic--${d.severity}`}>
                                          • [{d.severity.toUpperCase()}] {d.message}
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              </details>
                            </li>
                          ))}
                        </ol>
                      </div>
                    )}

                    {/* Mock Credentials & Policy Check section */}
                    <div style={{ marginTop: "10px", background: "rgba(0,0,0,0.15)", borderRadius: "6px", padding: "8px", border: "1px solid rgba(255,255,255,0.03)" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                        <span style={{ fontSize: "10px", fontWeight: 700, color: "#94a3b8" }}>LIVE READINESS POLICY GATE</span>
                        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                          <span style={{ fontSize: "9px", color: "#cbd5e1" }}>Mock Credential:</span>
                          <button
                            onClick={() => handleToggleMockCredential(job.adapter.providerId)}
                            style={{
                              background: mockCredentialsStaged[job.adapter.providerId] ? "rgba(16, 185, 129, 0.2)" : "rgba(255,255,255,0.05)",
                              border: mockCredentialsStaged[job.adapter.providerId] ? "1px solid rgba(16, 185, 129, 0.4)" : "1px solid rgba(255,255,255,0.1)",
                              borderRadius: "4px",
                              color: mockCredentialsStaged[job.adapter.providerId] ? "#34d399" : "#cbd5e1",
                              padding: "2px 8px",
                              fontSize: "9px",
                              cursor: "pointer",
                            }}
                          >
                            {mockCredentialsStaged[job.adapter.providerId] ? "Staged" : "Unstaged"}
                          </button>
                        </div>
                      </div>

                      <button
                        onClick={() => handleCheckReadiness(job.approval.approvalId)}
                        disabled={checkingReadinessId === job.approval.approvalId}
                        className="workspace-projections-panel__btn workspace-projections-panel__btn--success"
                        style={{ marginBottom: "8px" }}
                      >
                        {checkingReadinessId === job.approval.approvalId ? "Checking..." : "Verify Live Execution Readiness"}
                      </button>

                      {/* Display report if exists */}
                      {readinessReports[job.approval.approvalId] && (() => {
                        const report = readinessReports[job.approval.approvalId];
                        const passedCount = report.checks.filter(c => c.passed).length;
                        const failedCount = report.checks.filter(c => !c.passed).length;
                        const summaryText = report.readinessSatisfied
                          ? `${passedCount} checks passed`
                          : `${failedCount} check${failedCount > 1 ? "s" : ""} failed`;

                        return (
                          <div style={{ display: "flex", flexDirection: "column", gap: "6px", fontSize: "9px", marginTop: "8px" }}>
                            <details className="workspace-projections-panel__details">
                              <summary className="workspace-projections-panel__summary">
                                <span className={report.readinessSatisfied ? "workspace-projections-panel__summary-text--passed" : "workspace-projections-panel__summary-text--failed"}>
                                  {summaryText}
                                </span>
                              </summary>

                              <div className="workspace-projections-panel__policy-details">
                                <div className="workspace-projections-panel__policy-header">
                                  <span>Readiness Status: {report.readinessSatisfied ? "PASSED" : "FAILED"}</span>
                                  <span>Policy Block: {report.executionBlockedByPhasePolicy ? "ACTIVE" : "CLEARED"}</span>
                                </div>

                                <div className="workspace-projections-panel__checks-grid">
                                  {report.checks.map((chk, idx) => (
                                    <div key={idx} className="workspace-projections-panel__check-row">
                                      <span>{chk.name}:</span>
                                      <span className={chk.passed ? "workspace-projections-panel__check--passed" : "workspace-projections-panel__check--failed"}>
                                        {chk.passed ? "✔ PASS" : "✘ FAIL"}
                                      </span>
                                    </div>
                                  ))}
                                </div>

                                {report.diagnostics.length > 0 && (
                                  <div style={{ padding: "4px", background: "rgba(0,0,0,0.2)", borderRadius: "4px", color: "#fbbf24", display: "flex", flexDirection: "column", gap: "2px" }}>
                                    <strong style={{ color: "#cbd5e1" }}>Diagnostics:</strong>
                                    {report.diagnostics.map((d, idx) => (
                                      <div key={idx} className={`workspace-projections-panel__diagnostic workspace-projections-panel__diagnostic--${d.severity}`}>
                                        • {d.message}
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </details>

                            {/* Execute Live Section — Phase 29 Async */}
                            {report.readinessSatisfied ? (
                              (() => {
                                const authorityReport = PhotoProviderLiveAuthorityService.evaluateLiveAuthority({
                                  project,
                                  jobId: job.approval.approvalId,
                                  readinessReport: report,
                                  secondConfirmationAcknowledged: !!secondConfirmations[job.approval.approvalId],
                                });
                                const isSecondConfirmed = !!secondConfirmations[job.approval.approvalId];
                                const isExecuting = executingLiveId === job.approval.approvalId;
                                const phasePolicyBlocksLive =
                                  report.executionBlockedByPhasePolicy || !report.liveExecutionAvailable;
                                const jobStatus = activeJobStatuses[job.approval.approvalId];
                                const isTimedOut = !!pollingTimeoutJobs[job.approval.approvalId];

                                return (
                                  <div style={{ marginTop: "6px" }}>
                                    {/* Phase 29 status pill */}
                                    {jobStatus && (
                                      <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "6px" }}>
                                        <span
                                          id={`job-status-pill-${job.approval.approvalId}`}
                                          className={`workspace-projections-panel__status-pill workspace-projections-panel__status-pill--${jobStatus.status}`}
                                        >
                                          {jobStatus.status}
                                        </span>
                                        {jobStatus.retryCount > 0 && (
                                          <span style={{ fontSize: "8px", color: "#94a3b8" }}>Retry {jobStatus.retryCount}/2</span>
                                        )}
                                      </div>
                                    )}

                                    {/* Polling timeout banner */}
                                    {isTimedOut && (
                                      <div
                                        id={`polling-timeout-banner-${job.approval.approvalId}`}
                                        style={{
                                          fontSize: "9px",
                                          color: "#fbbf24",
                                          background: "rgba(245,158,11,0.08)",
                                          border: "1px solid rgba(245,158,11,0.2)",
                                          borderRadius: "4px",
                                          padding: "4px 8px",
                                          marginBottom: "6px",
                                        }}
                                      >
                                        Job still running. Refresh or check status later.
                                      </div>
                                    )}

                                    {/* Diagnostics on failure */}
                                    {jobStatus?.status === "failed" && jobStatus.diagnostics.length > 0 && (
                                      <div style={{ fontSize: "8px", color: "#fca5a5", marginBottom: "4px", fontFamily: "monospace" }}>
                                        {jobStatus.diagnostics.map((d, i) => (
                                          <div key={i}>• {d.message}</div>
                                        ))}
                                      </div>
                                    )}

                                    <div className="workspace-projections-panel__checkbox-wrapper">
                                      <input
                                        type="checkbox"
                                        id={`confirm-live-${job.approval.approvalId}`}
                                        checked={isSecondConfirmed}
                                        onChange={(e) => setSecondConfirmations(prev => ({ ...prev, [job.approval.approvalId]: e.target.checked }))}
                                        style={{ cursor: "pointer" }}
                                        disabled={isExecuting}
                                      />
                                      <label htmlFor={`confirm-live-${job.approval.approvalId}`} className="workspace-projections-panel__checkbox-label">
                                        I confirm live provider execution and agree to network access
                                      </label>
                                    </div>

                                    {phasePolicyBlocksLive && (
                                      <button
                                        id={`enable-live-btn-${job.approval.approvalId}`}
                                        onClick={() => handleEnableLive(job.approval.approvalId)}
                                        disabled={!isSecondConfirmed || isExecuting}
                                        className="workspace-projections-panel__btn workspace-projections-panel__btn--warning"
                                        style={{ marginBottom: "6px" }}
                                      >
                                        Enable Live Execution
                                      </button>
                                    )}

                                    {/* Execute / Cancel / Retry row */}
                                    <div style={{ display: "flex", gap: "6px" }}>
                                      {/* Execute button — hidden during polling */}
                                      {!isExecuting && (
                                        <button
                                          id={`execute-live-btn-${job.approval.approvalId}`}
                                          onClick={() => handleExecuteLive(job.approval.approvalId)}
                                          disabled={!authorityReport.authorityGranted || !gatewaySessionReady}
                                          className="workspace-projections-panel__btn workspace-projections-panel__btn--success workspace-projections-panel__btn--flex"
                                        >
                                          {phasePolicyBlocksLive ? "Execute Live (Policy Block)" : "Execute Live"}
                                        </button>
                                      )}

                                      {/* Cancel button — visible when queued or processing */}
                                      {isExecuting && jobStatus && (jobStatus.status === "queued" || jobStatus.status === "processing") && (
                                        <button
                                          id={`cancel-job-btn-${job.approval.approvalId}`}
                                          onClick={() => {
                                            const pjId = activeProviderJobIds[job.approval.approvalId];
                                            if (pjId) {
                                              handleCancelJob(pjId, job.approval.approvalId);
                                            }
                                          }}
                                          className="workspace-projections-panel__btn workspace-projections-panel__btn--danger workspace-projections-panel__btn--flex"
                                        >
                                          Cancel
                                        </button>
                                      )}

                                      {/* Retry button — visible on failed/cancelled/timeout */}
                                      {(jobStatus?.status === "failed" || jobStatus?.status === "cancelled" || isTimedOut) && (
                                        <button
                                          id={`retry-job-btn-${job.approval.approvalId}`}
                                          onClick={() => handleRetryJob(job.approval.approvalId)}
                                          className="workspace-projections-panel__btn workspace-projections-panel__btn--info workspace-projections-panel__btn--flex"
                                        >
                                          Retry
                                        </button>
                                      )}
                                    </div>

                                    {/* Executing spinner */}
                                    {isExecuting && (!jobStatus || jobStatus.status === "queued" || jobStatus.status === "processing") && (
                                      <div style={{ fontSize: "8px", color: "#60a5fa", textAlign: "center", marginTop: "4px" }}>
                                        {jobStatus?.status === "processing" ? "Provider processing…" : "Queued, awaiting worker…"}
                                      </div>
                                    )}
                                  </div>
                                );
                              })()
                            ) : (
                              <div style={{ marginTop: "6px" }}>
                                <button
                                  disabled
                                  className="workspace-projections-panel__btn"
                                >
                                  Execute Live (Phase 28 Policy Block)
                                </button>
                                <div style={{ fontSize: "8px", color: "#ef4444", textAlign: "center", marginTop: "4px" }}>
                                  Live execution blocked: readiness policy checks failed.
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
        
        {/* Section 1: Pending Projections */}
        <div className="workspace-projections-panel__section">
          <h3 className="workspace-projections-panel__section-title">
            Pending Projections ({pendingPlans.length})
          </h3>
          {pendingPlans.length === 0 ? (
            <div className="workspace-projections-panel__empty-state">
              No pending assembly plans.
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {pendingPlans.map((plan) => (
                <div key={plan.id} className="workspace-projections-panel__card">
                  <div className="workspace-projections-panel__card-header">
                    <div>
                      <div className="workspace-projections-panel__card-title">{plan.runtimeId} : {plan.actionId}</div>
                      <div className="workspace-projections-panel__card-subtitle">Studio: {plan.studioId} · Size: {plan.canvas.width}x{plan.canvas.height}</div>
                    </div>
                    <span style={{ fontSize: "8px", fontWeight: 700, background: "rgba(99, 102, 241, 0.15)", color: "#a5b4fc", padding: "2px 6px", borderRadius: "4px" }}>
                      APPROVED PLAN
                    </span>
                  </div>
                  {renderProvenanceEvidence(plan.metadata)}
                  <button
                    onClick={() => handleGenerateProjection(plan.id)}
                    className="workspace-projections-panel__btn workspace-projections-panel__btn--info"
                  >
                    <Play size={12} />
                    Generate Preview Projection
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Section 2: Approved Projections */}
        <div className="workspace-projections-panel__section">
          <h3 className="workspace-projections-panel__section-title">
            Approved Projections ({activeProjections.length})
          </h3>
          {activeProjections.length === 0 ? (
            <div className="workspace-projections-panel__empty-state">
              No active preview projections.
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {activeProjections.map((proj) => {
                const isConfirmed = confirmedProjectionId === proj.id;
                return (
                  <div key={proj.id} className="workspace-projections-panel__card">
                    <div className="workspace-projections-panel__card-header">
                      <div>
                        <div className="workspace-projections-panel__card-title">Projection: {proj.id.slice(0, 12)}...</div>
                        <div className="workspace-projections-panel__card-subtitle">Studio: {proj.studioId} · {proj.elements.length} elements</div>
                      </div>
                      <span style={{ fontSize: "8px", fontWeight: 700, background: "rgba(14, 165, 233, 0.15)", color: "#7dd3fc", padding: "2px 6px", borderRadius: "4px" }}>
                        PREVIEW ONLY
                      </span>
                    </div>

                    {renderProvenanceEvidence(proj.metadata)}

                    <div className="workspace-projections-panel__checkbox-wrapper">
                      <input
                        type="checkbox"
                        id={`confirm-apply-${proj.id}`}
                        checked={isConfirmed}
                        onChange={(e) => setConfirmedProjectionId(e.target.checked ? proj.id : null)}
                        style={{ cursor: "pointer" }}
                      />
                      <label htmlFor={`confirm-apply-${proj.id}`} className="workspace-projections-panel__checkbox-label">
                        I confirm canvas mutation
                      </label>
                    </div>

                    <button
                      onClick={() => handleApplyProjection(proj.id)}
                      disabled={!isConfirmed}
                      className="workspace-projections-panel__btn workspace-projections-panel__btn--success"
                    >
                      Apply Projection
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Section 3: Applied Mutations & Rollback Controls */}
        <div className="workspace-projections-panel__section">
          <h3 className="workspace-projections-panel__section-title">
            Applied Mutation Trail ({sortedApplications.length})
          </h3>
          {sortedApplications.length === 0 ? (
            <div className="workspace-projections-panel__empty-state">
              No mutations applied yet.
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {sortedApplications.map((app) => {
                const isApplied = app.status === "applied";
                return (
                  <div key={app.id} className="workspace-projections-panel__card">
                    <div className="workspace-projections-panel__card-header">
                      <div>
                        <div className="workspace-projections-panel__card-title">Mutation: {app.id.slice(0, 12)}...</div>
                        <div className="workspace-projections-panel__card-subtitle">Studio: {app.studioId} · {app.appliedElementIds.length} elements</div>
                        <div className="workspace-projections-panel__card-subtitle">
                          Applied: {new Date(app.appliedAtUtc).toLocaleTimeString()}
                        </div>
                      </div>
                      <span
                        style={{
                          fontSize: "8px",
                          fontWeight: 700,
                          background: isApplied ? "rgba(16, 185, 129, 0.15)" : "rgba(245, 158, 11, 0.15)",
                          color: isApplied ? "#34d399" : "#fbbf24",
                          padding: "2px 6px",
                          borderRadius: "4px",
                        }}
                      >
                        {app.status.toUpperCase()}
                      </span>
                    </div>
                    {renderProvenanceEvidence(app.metadata)}

                    {!isApplied && app.rolledBackAtUtc && (
                      <div style={{ fontSize: "9px", color: "#f59e0b", margin: "4px 0", fontStyle: "italic" }}>
                        Rolled back: {new Date(app.rolledBackAtUtc).toLocaleTimeString()}
                        {app.rollbackReason && <span> (Reason: {app.rollbackReason})</span>}
                      </div>
                    )}

                    {isApplied && (
                      <div style={{ marginTop: "10px", display: "flex", flexDirection: "column", gap: "6px" }}>
                        <input
                          type="text"
                          placeholder="Reason for rollback (optional)..."
                          value={rollbackReasons[app.id] || ""}
                          onChange={(e) => {
                            const val = e.target.value;
                            setRollbackReasons((prev) => ({ ...prev, [app.id]: val }));
                          }}
                          style={{
                            background: "#0d131f",
                            border: "1px solid rgba(255,255,255,0.1)",
                            borderRadius: "4px",
                            color: "#e2e8f0",
                            padding: "4px 8px",
                            fontSize: "10px",
                          }}
                        />
                        <button
                          onClick={() => handleRollbackMutation(app.id)}
                          className="workspace-projections-panel__btn workspace-projections-panel__btn--danger"
                        >
                          <RefreshCw size={11} />
                          Rollback Mutation
                        </button>
                      </div>
                    )}

                    {!isApplied && (
                      <button
                        disabled
                        className="workspace-projections-panel__btn"
                        style={{ marginTop: "6px" }}
                      >
                        Rollback Disabled
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
