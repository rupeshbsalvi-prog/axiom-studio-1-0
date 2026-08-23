import { act, cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { stateService } from "../../../../platform/services/StateService";
import { eventBus } from "../../../../platform/services/EventBus";
import { diagnosticsService } from "../../../../platform/services/DiagnosticsService";
import { AxiomAiPanel } from "../AxiomAiPanel";

describe("Axiom AI shared production panel", () => {
  beforeEach(() => {
    stateService.setState({
      "axiomAi.currentDirectorPlan": "Review the governed creative brief",
      "axiomAi.modelProvider": "gemini",
      "axiomAi.tokenBudget": 8192,
      "axiomAi.tokenUsed": 1024,
      "axiomAi.traceEntries": [
        { id: "trace-1", tool: "search_web", latencyMs: 80, status: "success", timestamp: 1 },
        { id: "trace-2", tool: "render_asset", latencyMs: 140, status: "error", timestamp: 2 },
        { id: "trace-3", tool: "await_approval", latencyMs: 10, status: "pending", timestamp: 3 },
      ],
      "axiomAi.evalResults": [
        { checkId: "eval-1", label: "Plan coherence", passed: true, confidence: 0.9 },
        { checkId: "eval-2", label: "Authority", passed: false, confidence: 0.5 },
      ],
      "axiomAi.routingLog": [
        { requestId: "route-1", provider: "Google", modelId: "gemini-2.5-pro", reason: "Creative planning" },
      ],
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

  it("reflects state and diagnostics events from the existing platform services", async () => {
    const diagnostics = vi.spyOn(diagnosticsService, "collectAll").mockReturnValue({
      activeAgents: 1,
      traceCount: 7,
      avgLatencyMs: 96,
      evalPassRate: 0.75,
      routingDecisions: 4,
    });
    render(<AxiomAiPanel />);

    act(() => {
      eventBus.publish("state:changed", {
        "axiomAi.activeAgents": 1,
        "axiomAi.tokenUsed": 7200,
        "axiomAi.tokenBudget": 8000,
        "axiomAi.modelProvider": "openai",
        "axiomAi.currentDirectorPlan": "Await explicit approval",
        "axiomAi.traceEntries": [],
        "axiomAi.evalResults": [],
        "axiomAi.routingLog": [],
      });
      eventBus.publish("axiomAi:metrics:snapshot", {});
    });

    expect(await screen.findByText("1 agent active")).toBeInTheDocument();
    expect(screen.getByText("OPENAI")).toBeInTheDocument();
    expect(screen.getByText("Await explicit approval")).toBeInTheDocument();
    expect(screen.getByText("7")).toBeInTheDocument();
    expect(screen.getByText("75%")).toBeInTheDocument();
    expect(screen.getByText("Awaiting runtime trace.")).toBeInTheDocument();
    expect(screen.getByText("No evaluations recorded.")).toBeInTheDocument();
    expect(screen.getByText("No routing decisions recorded.")).toBeInTheDocument();
    diagnostics.mockRestore();
  });

  it("keeps safe defaults when runtime values are absent", async () => {
    stateService.clear();
    const diagnostics = vi.spyOn(diagnosticsService, "collectAll");
    diagnostics.mockReturnValueOnce({}).mockReturnValueOnce({ activeAgents: 2, routingDecisions: 1 });
    render(<AxiomAiPanel />);

    expect(await screen.findByText("No agents running")).toBeInTheDocument();
    expect(screen.getByText("No active plan")).toBeInTheDocument();
    expect(screen.getByText("Ready")).toBeInTheDocument();

    act(() => {
      eventBus.publish("state:changed", {});
      eventBus.publish("axiomAi:metrics:snapshot", {});
      eventBus.publish("state:changed", { "axiomAi.activeAgents": 2, "axiomAi.tokenBudget": 0 });
      eventBus.publish("axiomAi:metrics:snapshot", {});
    });

    expect(await screen.findByText("2 agents active")).toBeInTheDocument();
    expect(screen.getByText("1 decision observed.")).toBeInTheDocument();
    diagnostics.mockRestore();
  });
});
