import { beforeEach, describe, expect, it, vi } from "vitest";
import { eventBus } from "../platform/services/EventBus";
import {
  clearWorkspaceAuditEvents,
  createWorkspaceAuthorityBlockedEvent,
  createWorkspaceIntentReceivedEvent,
  createWorkspaceRecommendationInfluenceAppliedEvent,
  createWorkspaceRecommendationInfluenceRolledBackEvent,
  createWorkspacePlanGeneratedEvent,
  createWorkspaceProposalAcceptedEvent,
  createWorkspaceProposalRejectedEvent,
  createWorkspaceExportRequestedEvent,
  createWorkspaceExportCompletedEvent,
  createWorkspaceLifecycleEvent,
  createWorkspaceProviderCalledEvent,
  createWorkspaceProviderFailedEvent,
  createProviderExecutionApprovalCompletedEvent,
  createProviderExecutionApprovalFailedEvent,
  createProviderExecutionApprovalRequestedEvent,
  createProviderLiveExecutionRequestedEvent,
  createProviderLiveExecutionCompletedEvent,
  createProviderLiveExecutionFailedEvent,
  getWorkspaceAuditEvents,
  recordWorkspaceAuditEvent,
} from "./WorkspaceAuditService";

describe("WorkspaceAuditService", () => {
  beforeEach(() => {
    clearWorkspaceAuditEvents();
    eventBus.clear();
  });

  it("records workspace audit events and returns immutable snapshots", () => {
    const event = createWorkspaceAuthorityBlockedEvent({
      id: "audit-1",
      studioId: "photo",
      title: "Photo generation Blocked",
      message: "Runtime authority blocks use providers.",
      timestamp: "2026-07-04T00:00:00.000Z",
    });

    recordWorkspaceAuditEvent(event);
    const events = getWorkspaceAuditEvents();
    events.pop();

    expect(getWorkspaceAuditEvents()).toEqual([event]);
  });

  it("publishes recorded audit events for workspace-level replay subscribers", () => {
    const listener = vi.fn();
    eventBus.subscribe("workspace:audit:recorded", listener);

    const event = createWorkspaceAuthorityBlockedEvent({
      id: "audit-2",
      studioId: "vector",
      title: "Vector generation Blocked",
      message: "Runtime authority blocks use providers.",
      timestamp: "2026-07-04T00:00:00.000Z",
    });

    recordWorkspaceAuditEvent(event);

    expect(listener).toHaveBeenCalledWith(event);
  });

  it("clears workspace audit state for isolated sessions and tests", () => {
    recordWorkspaceAuditEvent(
      createWorkspaceAuthorityBlockedEvent({
        id: "audit-3",
        studioId: "photo",
        title: "Photo export Blocked",
        message: "Runtime authority blocks export.",
        timestamp: "2026-07-04T00:00:00.000Z",
      }),
    );

    clearWorkspaceAuditEvents();

    expect(getWorkspaceAuditEvents()).toEqual([]);
  });

  it("creates dedicated recommendation influence activation and rollback events", () => {
    const input = {
      id: "influence-event",
      studioId: "brain-x" as const,
      title: "Recommendation influence",
      message: "Local influence state changed.",
      timestamp: "2026-07-26T00:02:00.000Z",
      metadata: { proposalId: "influence-active" },
    };

    expect(createWorkspaceRecommendationInfluenceAppliedEvent(input)).toMatchObject({
      type: "recommendation_influence_applied",
      severity: "success",
      source: "brain-x",
      metadata: { proposalId: "influence-active" },
    });
    expect(createWorkspaceRecommendationInfluenceRolledBackEvent(input)).toMatchObject({
      type: "recommendation_influence_rolled_back",
      severity: "warning",
      source: "brain-x",
      metadata: { proposalId: "influence-active" },
    });
  });

  it("enforces cap limit of 1000 events in memory", () => {
    for (let i = 0; i < 1010; i++) {
      recordWorkspaceAuditEvent(
        createWorkspaceLifecycleEvent({
          id: `lifecycle-${i}`,
          studioId: "photo",
          title: `Init ${i}`,
          message: `Msg ${i}`,
          timestamp: new Date().toISOString(),
        }),
      );
    }

    const events = getWorkspaceAuditEvents();
    expect(events.length).toBe(1000);
    expect(events[0].id).toBe("lifecycle-10");
    expect(events[999].id).toBe("lifecycle-1009");
  });

  it("verifies correctness of helper factories", () => {
    const timestamp = "2026-07-04T00:00:00.000Z";

    const intent = createWorkspaceIntentReceivedEvent({
      id: "intent",
      studioId: "photo",
      title: "Intent Received",
      message: "Build poster",
      timestamp,
    });
    expect(intent.type).toBe("intent_received");
    expect(intent.source).toBe("photo");
    expect(intent.severity).toBe("info");

    const plan = createWorkspacePlanGeneratedEvent({
      id: "plan",
      studioId: "vector",
      title: "Plan Generated",
      message: "Svg plan details",
      timestamp,
    });
    expect(plan.type).toBe("plan_generated");
    expect(plan.source).toBe("vector");

    const accepted = createWorkspaceProposalAcceptedEvent({
      id: "accepted",
      studioId: "brain-x",
      title: "Proposal Accepted",
      message: "Approved plan",
      timestamp,
    });
    expect(accepted.type).toBe("proposal_accepted");
    expect(accepted.severity).toBe("success");

    const rejected = createWorkspaceProposalRejectedEvent({
      id: "rejected",
      studioId: "axiom-ai",
      title: "Proposal Rejected",
      message: "Disapproved plan",
      timestamp,
    });
    expect(rejected.type).toBe("proposal_rejected");
    expect(rejected.severity).toBe("warning");

    const exportReq = createWorkspaceExportRequestedEvent({
      id: "exportReq",
      studioId: "photo",
      title: "Export Req",
      message: "PNG download",
      timestamp,
    });
    expect(exportReq.type).toBe("export_requested");

    const exportComp = createWorkspaceExportCompletedEvent({
      id: "exportComp",
      studioId: "vector",
      title: "Export Comp",
      message: "SVG downloaded successfully",
      timestamp,
    });
    expect(exportComp.type).toBe("export_completed");
    expect(exportComp.severity).toBe("success");

    const lifecycle = createWorkspaceLifecycleEvent({
      id: "lifecycle",
      studioId: "photo",
      title: "Initialized",
      message: "Photo initialized",
      timestamp,
    });
    expect(lifecycle.type).toBe("lifecycle");
    expect(lifecycle.source).toBe("system");

    const providerCall = createWorkspaceProviderCalledEvent({
      id: "providerCall",
      studioId: "brain-x",
      title: "Provider Called",
      message: "Invoked Gemini pro",
      timestamp,
    });
    expect(providerCall.type).toBe("provider_called");

    const providerFail = createWorkspaceProviderFailedEvent({
      id: "providerFail",
      studioId: "axiom-ai",
      title: "Provider Failed",
      message: "Rate limit",
      timestamp,
    });
    expect(providerFail.type).toBe("provider_failed");
    expect(providerFail.severity).toBe("warning");

    const providerApprovalRequested = createProviderExecutionApprovalRequestedEvent({
      id: "providerApprovalRequested",
      studioId: "photo",
      title: "Provider Approval Requested",
      message: "Approval requested",
      timestamp,
    });
    expect(providerApprovalRequested.type).toBe("provider_execution_approval_requested");
    expect(providerApprovalRequested.metadata).toMatchObject({
      providerApprovalGate: true,
      providerExecuted: false,
      runtimeCodeLoaded: false,
      moduleUrlExecuted: false,
    });

    const providerApprovalCompleted = createProviderExecutionApprovalCompletedEvent({
      id: "providerApprovalCompleted",
      studioId: "photo",
      title: "Provider Approval Completed",
      message: "Approval completed",
      timestamp,
    });
    expect(providerApprovalCompleted.type).toBe("provider_execution_approval_completed");
    expect(providerApprovalCompleted.severity).toBe("success");
    expect(providerApprovalCompleted.metadata).toMatchObject({
      providerExecutionAllowed: true,
      providerExecuted: false,
    });

    const providerApprovalFailed = createProviderExecutionApprovalFailedEvent({
      id: "providerApprovalFailed",
      studioId: "photo",
      title: "Provider Approval Failed",
      message: "Approval failed",
      timestamp,
    });
    expect(providerApprovalFailed.type).toBe("provider_execution_approval_failed");
    expect(providerApprovalFailed.severity).toBe("error");
  });

  describe("Phase 28 — Live Execution Audit Event Factories", () => {
    const timestamp = "2026-07-11T00:00:00.000Z";

    it("createProviderLiveExecutionRequestedEvent sets type and severity", () => {
      const event = createProviderLiveExecutionRequestedEvent({
        id: "live-req-1",
        studioId: "photo",
        title: "Live Execution Requested",
        message: "Requesting live execution for job-123",
        timestamp,
      });
      expect(event.type).toBe("provider_live_execution_requested");
      expect(event.severity).toBe("info");
    });

    it("createProviderLiveExecutionRequestedEvent injects providerExecuted:false in metadata", () => {
      const event = createProviderLiveExecutionRequestedEvent({
        id: "live-req-2",
        studioId: "photo",
        title: "Live Execution Requested",
        message: "Requesting",
        timestamp,
      });
      expect(event.metadata?.providerExecuted).toBe(false);
      expect(event.metadata?.runtimeCodeLoaded).toBe(false);
      expect(event.metadata?.secretPersisted).toBe(false);
    });

    it("createProviderLiveExecutionCompletedEvent sets type and severity", () => {
      const event = createProviderLiveExecutionCompletedEvent({
        id: "live-comp-1",
        studioId: "photo",
        title: "Live Execution Completed",
        message: "Completed for job-123",
        timestamp,
      });
      expect(event.type).toBe("provider_live_execution_completed");
      expect(event.severity).toBe("success");
    });

    it("createProviderLiveExecutionCompletedEvent injects providerExecuted:true in metadata", () => {
      const event = createProviderLiveExecutionCompletedEvent({
        id: "live-comp-2",
        studioId: "photo",
        title: "Live Execution Completed",
        message: "Completed",
        timestamp,
      });
      expect(event.metadata?.providerExecuted).toBe(true);
      expect(event.metadata?.networkAccessed).toBe(true);
      expect(event.metadata?.providerApiCalled).toBe(true);
      expect(event.metadata?.runtimeCodeLoaded).toBe(false);
      expect(event.metadata?.moduleUrlExecuted).toBe(false);
      expect(event.metadata?.secretPersisted).toBe(false);
      expect(event.metadata?.secretExported).toBe(false);
    });

    it("createProviderLiveExecutionFailedEvent sets type and severity", () => {
      const event = createProviderLiveExecutionFailedEvent({
        id: "live-fail-1",
        studioId: "photo",
        title: "Live Execution Failed",
        message: "Failed for job-123",
        timestamp,
      });
      expect(event.type).toBe("provider_live_execution_failed");
      expect(event.severity).toBe("error");
    });

    it("createProviderLiveExecutionFailedEvent injects non-execution flags in metadata", () => {
      const event = createProviderLiveExecutionFailedEvent({
        id: "live-fail-2",
        studioId: "photo",
        title: "Live Execution Failed",
        message: "Failed",
        timestamp,
      });
      expect(event.metadata?.providerExecuted).toBe(false);
      expect(event.metadata?.runtimeCodeLoaded).toBe(false);
      expect(event.metadata?.secretPersisted).toBe(false);
    });
  });
});
