import React from "react";
import { describe, expect, it, beforeEach } from "vitest";
import { render } from "@testing-library/react";
import { RuntimeRegistryPanel } from "../../runtime/RuntimeRegistryPanel";
import { getWorkspaceAuditEvents, clearWorkspaceAuditEvents } from "../WorkspaceAuditService";

describe("RuntimeActivationEligibilityPanel", () => {
  beforeEach(() => {
    clearWorkspaceAuditEvents();
  });

  it("17. RuntimeRegistryPanel render does not emit eligibility audit events", () => {
    // Render the registry panel
    render(<RuntimeRegistryPanel />);

    // Retrieve events after rendering
    const events = getWorkspaceAuditEvents();

    // Verify no activation eligibility checked event was recorded
    const eligibilityCheckedEvents = events.filter((e) => e.type === "runtime_activation_eligibility_checked");
    expect(eligibilityCheckedEvents.length).toBe(0);
  });
});
