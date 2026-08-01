// ----------------------------------------------------
// AxiomAiStudio.ts — Platform Runtime Generality Proof
//
// This Studio is the second consumer of Platform Runtime v5.
// It proves that the runtime is not coupled to WebGL or Three.js.
//
// ARCHITECTURE GATE: This file contains ZERO Three.js imports.
// PLATFORM GATE: This file modifies ZERO platform files.
//
// Integration pattern:
//   AxiomAiStudio → EventBus → PlatformRuntime → DiagnosticsService → Overlay
//
// Formal StudioModule contract:
//   initialize() → activate() → [update loop] → deactivate() → dispose()
// ----------------------------------------------------

import { platformRuntime } from "../../../platform/runtime/PlatformRuntime";
import { eventBus } from "../../../platform/services/EventBus";
import { stateService } from "../../../platform/services/StateService";
import { diagnosticsService } from "../../../platform/services/DiagnosticsService";
import { AxiomAiProvider } from "./diagnostics/AxiomAiProvider";
import {
  type AxiomAiStateData,
  type TraceEntry,
  type EvalResult,
  type RoutingDecision,
  AXIOM_AI_INITIAL_STATE,
} from "./AxiomAiState";

// ----------------------------------------------------
// StudioModule — Formal Studio Contract
//
// Every Studio in the platform implements this interface.
// The Runtime interacts with all Studios identically.
// This interface is defined in the Studio layer, not the platform.
// ----------------------------------------------------
export interface StudioModule {
  readonly id: string;
  initialize(): Promise<void> | void;
  activate(): void;
  deactivate(): void;
  dispose(): void;
}

// ----------------------------------------------------
// Simulated AI Director Data
// In production these would come from live agent orchestration.
// For FR1.1 the goal is to prove the platform contract, not build the AI system.
// ----------------------------------------------------
const MOCK_TRACE_ENTRIES: TraceEntry[] = [
  { id: "t-001", tool: "search_web", latencyMs: 312, status: "success", timestamp: Date.now() - 5000 },
  { id: "t-002", tool: "read_file", latencyMs: 48, status: "success", timestamp: Date.now() - 4200 },
  { id: "t-003", tool: "generate_image", latencyMs: 1820, status: "success", timestamp: Date.now() - 2800 },
  { id: "t-004", tool: "run_command", latencyMs: 94, status: "error", timestamp: Date.now() - 1100 },
  { id: "t-005", tool: "write_to_file", latencyMs: 67, status: "pending", timestamp: Date.now() },
];

const MOCK_EVAL_RESULTS: EvalResult[] = [
  { checkId: "eval-coherence", label: "Plan Coherence", passed: true, confidence: 0.94 },
  { checkId: "eval-tool-use", label: "Tool Use Accuracy", passed: true, confidence: 0.88 },
  { checkId: "eval-latency", label: "Response Latency", passed: false, confidence: 0.61 },
  { checkId: "eval-token-eff", label: "Token Efficiency", passed: true, confidence: 0.79 },
];

const MOCK_ROUTING_LOG: RoutingDecision[] = [
  { requestId: "req-1", provider: "Google", modelId: "gemini-2.5-pro", reason: "Complex reasoning task" },
  { requestId: "req-2", provider: "Google", modelId: "gemini-2.0-flash", reason: "Fast tool invocation" },
  { requestId: "req-3", provider: "Anthropic", modelId: "claude-3-5-sonnet", reason: "Code generation" },
];

// ----------------------------------------------------
// AxiomAiStudio — Second Platform Consumer
// ----------------------------------------------------
export class AxiomAiStudio implements StudioModule {
  readonly id = "axiom-ai";

  private provider: AxiomAiProvider | null = null;
  private metricsInterval: ReturnType<typeof setInterval> | null = null;
  private sessionStartTime = 0;

  // Current in-memory state (mirrors what StateService holds)
  private currentState: AxiomAiStateData = { ...AXIOM_AI_INITIAL_STATE };

  // -------------------------
  // initialize()
  // Called once when the studio is first mounted.
  // -------------------------
  initialize(): void {
    this.sessionStartTime = Date.now();

    // 1. Register this studio with the Platform Runtime.
    //    The runtime does not need to know this is an "AI studio."
    //    It only knows it is a studio.
    platformRuntime.registerStudio(this);

    // 2. Register our diagnostics provider.
    //    The DiagnosticsService aggregates it automatically via collect().
    //    Zero code changes to DiagnosticsService required.
    this.provider = new AxiomAiProvider();
    diagnosticsService.registerProvider(this.provider);

    // 3. Seed the StateService with our namespaced initial state.
    //    Namespace: axiomAi.*
    //    These keys coexist cleanly alongside axCore.* keys.
    stateService.setState({
      "axiomAi.activeAgents": this.currentState.activeAgents,
      "axiomAi.currentDirectorPlan": "Analyzing user request...",
      "axiomAi.modelProvider": this.currentState.modelProvider,
      "axiomAi.tokenBudget": this.currentState.tokenBudget,
      "axiomAi.tokenUsed": 0,
      "axiomAi.traceEntries": MOCK_TRACE_ENTRIES,
      "axiomAi.evalResults": MOCK_EVAL_RESULTS,
      "axiomAi.routingLog": MOCK_ROUTING_LOG,
    });

    // 4. Publish ready event.
    //    The Studio does not know who subscribes. It only publishes.
    //    EventBus chain: AxiomAiStudio → EventBus → Runtime → Diagnostics → Overlay
    eventBus.publish("studio:axiomAi:ready", {
      studioId: this.id,
      timestamp: this.sessionStartTime,
    });
  }

  // -------------------------
  // activate()
  // Called when this studio becomes the active view.
  // -------------------------
  activate(): void {
    // Begin periodic metric snapshots while the studio is active.
    // This drives the AxiomAiProvider via EventBus — no direct provider access.
    this.metricsInterval = setInterval(() => {
      this._publishMetricsSnapshot();
    }, 1000);

    // Simulate agent activity ramping up
    this._updateAgentCount(2);
    stateService.updateState("axiomAi.currentDirectorPlan", "Executing plan: FR1.1 platform validation");

    eventBus.publish("studio:axiomAi:activated", { studioId: this.id });
  }

  // -------------------------
  // deactivate()
  // Called when another studio becomes active.
  // -------------------------
  deactivate(): void {
    if (this.metricsInterval !== null) {
      clearInterval(this.metricsInterval);
      this.metricsInterval = null;
    }

    this._updateAgentCount(0);

    eventBus.publish("studio:axiomAi:deactivated", { studioId: this.id });
  }

  // -------------------------
  // dispose()
  // Called when the studio is unmounted.
  // Clean teardown — zero platform residue after this call.
  // -------------------------
  dispose(): void {
    // Clear interval if still running
    if (this.metricsInterval !== null) {
      clearInterval(this.metricsInterval);
      this.metricsInterval = null;
    }

    // Unregister our diagnostics provider.
    // After this, DiagnosticsService holds no reference to this studio.
    if (this.provider) {
      diagnosticsService.unregisterProvider(this.provider.id);
      this.provider = null;
    }

    // Unregister from the runtime.
    // After this, PlatformRuntime holds no reference to this studio.
    platformRuntime.unregisterStudio(this);

    eventBus.publish("studio:axiomAi:disposed", { studioId: this.id });
  }

  // -------------------------
  // _publishMetricsSnapshot()
  // Internal helper — publishes the metrics event that AxiomAiProvider listens to.
  // Validates: Studio → EventBus → Provider → DiagnosticsService → Overlay
  // -------------------------
  private _publishMetricsSnapshot(): void {
    const traceEntries = (stateService.getState()["axiomAi.traceEntries"] as TraceEntry[]) || [];
    const evalResults = (stateService.getState()["axiomAi.evalResults"] as EvalResult[]) || [];

    const traceCount = traceEntries.length;
    const avgLatencyMs =
      traceCount > 0
        ? traceEntries.reduce((sum, t) => sum + t.latencyMs, 0) / traceCount
        : 0;
    const passed = evalResults.filter((e) => e.passed).length;
    const evalPassRate = evalResults.length > 0 ? passed / evalResults.length : 1.0;

    // Simulate token usage incrementing
    const currentUsed = (stateService.getState()["axiomAi.tokenUsed"] as number) || 0;
    const newUsed = Math.min(currentUsed + Math.floor(Math.random() * 120), this.currentState.tokenBudget);
    stateService.updateState("axiomAi.tokenUsed", newUsed);

    eventBus.publish("axiomAi:metrics:snapshot", {
      activeAgents: this.currentState.activeAgents,
      traceCount,
      avgLatencyMs: Math.round(avgLatencyMs),
      evalPassRate: Math.round(evalPassRate * 100) / 100,
      routingDecisions: (stateService.getState()["axiomAi.routingLog"] as RoutingDecision[])?.length ?? 0,
    });
  }

  private _updateAgentCount(count: number): void {
    this.currentState.activeAgents = count;
    stateService.updateState("axiomAi.activeAgents", count);
  }

  // -------------------------
  // Public accessors for panel/test consumption
  // -------------------------
  getState(): AxiomAiStateData {
    return { ...this.currentState };
  }
}

// Singleton instance — mirrors the pattern established by AX-CORE
export const axiomAiStudio = new AxiomAiStudio();
