// ----------------------------------------------------
// AxiomAiProvider.ts — Diagnostics Provider for Axiom AI Studio
//
// Location: src/app/studios/ai/diagnostics/
// Implements: DiagnosticsProvider (platform interface — unchanged)
// Validates: DiagnosticsService aggregates any provider without modification.
// ----------------------------------------------------

import { DiagnosticsProvider } from "../../../../platform/services/DiagnosticsService";
import { eventBus } from "../../../../platform/services/EventBus";

export class AxiomAiProvider implements DiagnosticsProvider {
  id = "axiomAi";

  private unsubscribe: (() => void) | null = null;
  private data = {
    activeAgents: 0,
    traceCount: 0,
    avgLatencyMs: 0,
    evalPassRate: 1.0,
    routingDecisions: 0,
  };

  initialize(): void {
    // Subscribe to metric snapshots published by AxiomAiStudio.
    // The DiagnosticsService does NOT need to know this event exists.
    // It simply calls collect() — the same contract every provider uses.
    this.unsubscribe = eventBus.subscribe(
      "axiomAi:metrics:snapshot",
      (payload: any) => {
        if (payload.activeAgents !== undefined)
          this.data.activeAgents = payload.activeAgents;
        if (payload.traceCount !== undefined)
          this.data.traceCount = payload.traceCount;
        if (payload.avgLatencyMs !== undefined)
          this.data.avgLatencyMs = payload.avgLatencyMs;
        if (payload.evalPassRate !== undefined)
          this.data.evalPassRate = payload.evalPassRate;
        if (payload.routingDecisions !== undefined)
          this.data.routingDecisions = payload.routingDecisions;
      }
    );
  }

  collect(): Record<string, any> {
    return { ...this.data };
  }

  dispose(): void {
    if (this.unsubscribe) {
      this.unsubscribe();
      this.unsubscribe = null;
    }
  }
}
