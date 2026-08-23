import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { stateService } from "../../../../platform/services/StateService";
import { eventBus } from "../../../../platform/services/EventBus";
import { AxiomAiPanel } from "../AxiomAiPanel";

describe("Axiom AI shared production panel", () => {
  beforeEach(() => {
    stateService.setState({
      "axiomAi.currentDirectorPlan": "Review the governed creative brief",
      "axiomAi.modelProvider": "gemini",
      "axiomAi.tokenBudget": 8192,
      "axiomAi.tokenUsed": 1024,
      "axiomAi.traceEntries": [],
      "axiomAi.evalResults": [],
      "axiomAi.routingLog": [],
    });
  });

  afterEach(() => {
    cleanup();
    stateService.clear();
    eventBus.clear();
  });

  it("uses the shared three-rail production language without losing runtime surfaces", async () => {
    render(<AxiomAiPanel />);

    const workspace = screen.getByRole("region", { name: "Axiom AI production workspace" });
    expect(workspace).toHaveAttribute("data-design-language", "axiom-pro-panel-v1");
    expect(within(workspace).getByRole("complementary", { name: "Axiom AI director and budget" })).toBeInTheDocument();
    expect(within(workspace).getByRole("region", { name: "Axiom AI intelligence canvas" })).toBeInTheDocument();
    expect(within(workspace).getByRole("complementary", { name: "Axiom AI routing and platform audit" })).toBeInTheDocument();
    expect(await screen.findByText("Review the governed creative brief")).toBeInTheDocument();
    expect(screen.getByText("Trace Timeline")).toBeInTheDocument();
    expect(screen.getByText("Eval Scorecard")).toBeInTheDocument();
    expect(screen.getByText("Routing Inspector")).toBeInTheDocument();
  });
});
