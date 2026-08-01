import React from "react";
import { describe, expect, it, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { WorkspaceReplayPanel } from "../WorkspaceReplayPanel";
import {
  recordWorkspaceAuditEvent,
  clearWorkspaceAuditEvents,
  createProviderSandboxExecutionCompletedEvent,
  createReadinessCheckCompletedEvent,
  createProviderLiveExecutionCompletedEvent,
} from "../WorkspaceAuditService";

describe("WorkspaceReplayPanel Component", () => {
  beforeEach(() => {
    clearWorkspaceAuditEvents();
  });

  it("renders the Sandbox filter tab and updates counts", () => {
    // Record sandbox events
    recordWorkspaceAuditEvent(
      createProviderSandboxExecutionCompletedEvent({
        id: "sandbox-event-1",
        studioId: "photo",
        title: "Sandbox Completed",
        message: "Simulation finished offline.",
        timestamp: new Date().toISOString(),
        metadata: {
          runId: "run-xyz",
          jobId: "job-xyz",
          candidateId: "preview-xyz",
          providerExecuted: false,
          runtimeCodeLoaded: false,
          moduleUrlExecuted: false,
          networkAccessed: false,
          providerApiCalled: false,
          diagnostics: []
        }
      })
    );

    render(<WorkspaceReplayPanel />);

    // Check that Sandbox tab is visible and shows count 1
    const sandboxTab = screen.getByRole("button", { name: /Sandbox/ });
    expect(sandboxTab).toBeInTheDocument();
    expect(sandboxTab).toHaveTextContent("Sandbox1");
  });

  it("filters events by Sandbox when the Sandbox tab is clicked", () => {
    recordWorkspaceAuditEvent(
      createProviderSandboxExecutionCompletedEvent({
        id: "sandbox-event-1",
        studioId: "photo",
        title: "Sandbox Completed",
        message: "Simulation finished offline.",
        timestamp: new Date().toISOString(),
        metadata: {
          runId: "run-xyz",
          jobId: "job-xyz",
          candidateId: "preview-xyz",
          providerExecuted: false,
          runtimeCodeLoaded: false,
          moduleUrlExecuted: false,
          networkAccessed: false,
          providerApiCalled: false,
          diagnostics: []
        }
      })
    );

    render(<WorkspaceReplayPanel />);

    // Click the Sandbox filter tab
    const sandboxTab = screen.getByRole("button", { name: /Sandbox/ });
    fireEvent.click(sandboxTab);

    // Verify event title is displayed in list
    expect(screen.getByText("Sandbox Completed")).toBeInTheDocument();
  });

  it("renders detailed safety evidence checklist in expanded sandbox event card", () => {
    recordWorkspaceAuditEvent(
      createProviderSandboxExecutionCompletedEvent({
        id: "sandbox-event-1",
        studioId: "photo",
        title: "Sandbox Completed",
        message: "Simulation finished offline.",
        timestamp: new Date().toISOString(),
        metadata: {
          runId: "run-xyz",
          jobId: "job-xyz",
          candidateId: "preview-xyz",
          providerExecuted: false,
          runtimeCodeLoaded: false,
          moduleUrlExecuted: false,
          networkAccessed: false,
          providerApiCalled: false,
          diagnostics: [{ severity: "info", code: "ok", message: "Check passed" }]
        }
      })
    );

    render(<WorkspaceReplayPanel />);

    // Expand the card
    const titleBtn = screen.getByText("Sandbox Completed");
    fireEvent.click(titleBtn);

    // Verify formatted metadata is shown
    expect(screen.getByText("run-xyz")).toBeInTheDocument();
    expect(screen.getByText("job-xyz")).toBeInTheDocument();
    expect(screen.getByText("preview-xyz")).toBeInTheDocument();
    expect(screen.getByText("✔ providerExecuted: false")).toBeInTheDocument();
    expect(screen.getByText("✔ runtimeCodeLoaded: false")).toBeInTheDocument();
    expect(screen.getByText("✔ moduleUrlExecuted: false")).toBeInTheDocument();
    expect(screen.getByText("✔ networkAccessed: false")).toBeInTheDocument();
    expect(screen.getByText("✔ providerApiCalled: false")).toBeInTheDocument();
    expect(screen.getByText("• [INFO] Check passed")).toBeInTheDocument();
  });

  it("renders detailed readiness check policy results in expanded readiness event card", () => {
    recordWorkspaceAuditEvent(
      createReadinessCheckCompletedEvent({
        id: "readiness-event-1",
        studioId: "photo",
        title: "Readiness Check Completed",
        message: "Policy checks satisfied.",
        timestamp: new Date().toISOString(),
        metadata: {
          jobId: "job-readiness-xyz",
          readinessSatisfied: true,
          executionBlockedByPhasePolicy: true,
          liveExecutionAvailable: false,
          providerExecuted: false,
          runtimeCodeLoaded: false,
          moduleUrlExecuted: false,
          networkAccessed: false,
          providerApiCalled: false,
        }
      })
    );

    render(<WorkspaceReplayPanel />);

    // Expand the card
    const titleBtn = screen.getByText("Readiness Check Completed");
    fireEvent.click(titleBtn);

    // Verify formatted metadata is shown
    expect(screen.getByText("job-readiness-xyz")).toBeInTheDocument();
    expect(screen.getByText("✔ executionBlockedByPhasePolicy: true")).toBeInTheDocument();
    expect(screen.getByText("✔ providerExecuted: false")).toBeInTheDocument();
    expect(screen.getByText("✔ networkAccessed: false")).toBeInTheDocument();
    expect(screen.getByText("✔ providerApiCalled: false")).toBeInTheDocument();
  });

  it("renders the Live filter tab and filters live execution events", () => {
    recordWorkspaceAuditEvent(
      createProviderLiveExecutionCompletedEvent({
        id: "live-event-1",
        studioId: "photo",
        title: "Live Execution Completed",
        message: "Live adapter boundary run completed.",
        timestamp: new Date().toISOString(),
        metadata: {
          liveRunId: "live-run-1234",
          jobId: "job-live-abc",
          candidateId: "preview-live-abc",
          providerExecuted: true,
          runtimeCodeLoaded: false,
          moduleUrlExecuted: false,
          networkAccessed: true,
          providerApiCalled: true,
          secretPersisted: false,
          secretExported: false,
        }
      })
    );

    render(<WorkspaceReplayPanel />);

    // Check Live tab is visible and shows count 1
    const liveTab = screen.getByRole("button", { name: /Live/ });
    expect(liveTab).toBeInTheDocument();
    expect(liveTab).toHaveTextContent("Live1");

    // Click Live tab
    fireEvent.click(liveTab);

    // Verify live event card is displayed
    expect(screen.getByText("Live Execution Completed")).toBeInTheDocument();

    // Expand the card
    fireEvent.click(screen.getByText("Live Execution Completed"));

    // Verify detailed metadata is shown
    expect(screen.getByText("live-run-1234")).toBeInTheDocument();
    expect(screen.getByText("job-live-abc")).toBeInTheDocument();
    expect(screen.getByText("✔ providerExecuted: true")).toBeInTheDocument();
    expect(screen.getByText("✔ networkAccessed: true")).toBeInTheDocument();
    expect(screen.getByText("✔ providerApiCalled: true")).toBeInTheDocument();
  });
});
