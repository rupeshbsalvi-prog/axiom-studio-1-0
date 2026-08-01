import React from "react";
import { describe, expect, it, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { WorkspaceReplayPanel } from "../WorkspaceReplayPanel";
import {
  clearWorkspaceAuditEvents,
  recordWorkspaceAuditEvent,
  createRuntimePackagePromotionRequestedEvent,
  createRuntimePackagePromotionCompletedEvent,
  createRuntimePackagePromotionFailedEvent,
  createRuntimePackagePromotionBlockedEvent,
} from "../WorkspaceAuditService";

describe("RuntimePackagePromotionPanel & WorkspaceReplayPanel", () => {
  beforeEach(() => {
    clearWorkspaceAuditEvents();
  });

  it("WorkspaceReplayPanel Runtime tab includes package promotion events", () => {
    const timestamp = new Date().toISOString();

    // 1. Record requested event
    recordWorkspaceAuditEvent(
      createRuntimePackagePromotionRequestedEvent({
        id: "test_requested_event",
        title: "Requested Promotion Test",
        message: "Promotion has been requested for testing",
        timestamp,
      })
    );

    // 2. Record completed event
    recordWorkspaceAuditEvent(
      createRuntimePackagePromotionCompletedEvent({
        id: "test_completed_event",
        title: "Completed Promotion Test",
        message: "Promotion has been completed for testing",
        timestamp,
      })
    );

    // 3. Record failed event
    recordWorkspaceAuditEvent(
      createRuntimePackagePromotionFailedEvent({
        id: "test_failed_event",
        title: "Failed Promotion Test",
        message: "Promotion has failed for testing",
        timestamp,
      })
    );

    // 4. Record blocked event
    recordWorkspaceAuditEvent(
      createRuntimePackagePromotionBlockedEvent({
        id: "test_blocked_event",
        title: "Blocked Promotion Test",
        message: "Promotion has been blocked for testing",
        timestamp,
      })
    );

    // Render the panel
    render(<WorkspaceReplayPanel />);

    // Click on the "Runtime" tab button
    const runtimeTabButton = screen.getByRole("button", { name: /Runtime/i });
    expect(runtimeTabButton).toBeInTheDocument();
    fireEvent.click(runtimeTabButton);

    // Verify all four events exist under the Runtime filter tab
    expect(screen.getByText("Requested Promotion Test")).toBeInTheDocument();
    expect(screen.getByText("Completed Promotion Test")).toBeInTheDocument();
    expect(screen.getByText("Failed Promotion Test")).toBeInTheDocument();
    expect(screen.getByText("Blocked Promotion Test")).toBeInTheDocument();
  });
});
