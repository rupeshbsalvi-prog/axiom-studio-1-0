// ----------------------------------------------------
// BrainXProvider.ts — Diagnostics Provider for Brain X
//
// Location: src/app/studios/brain-x/diagnostics/
//
// ARCHITECTURE GATE:
//   DiagnosticsService.collectAll() gains an 8th provider
//   with ZERO changes to the DiagnosticsService implementation.
//   Only a new provider is registered. The service contract
//   (id, initialize, collect, dispose) is identical to all
//   other providers — it has no Brain X awareness.
// ----------------------------------------------------

import type { DiagnosticsProvider } from "../../../../platform/services/DiagnosticsService";
import { eventBus } from "../../../../platform/services/EventBus";

export interface BrainXDiagnostics {
  activeWorkflows: number;
  completedWorkflows: number;
  failedWorkflows: number;
  memoryNodes: number;
  scheduledTasks: number;
  avgWorkflowDurationMs: number;
  crossStudioObservations: number;
}

export class BrainXProvider implements DiagnosticsProvider {
  readonly id = "brainX";

  private activeWorkflows = 0;
  private completedWorkflows = 0;
  private failedWorkflows = 0;
  private memoryNodes = 0;
  private scheduledTasks = 0;
  private workflowDurations: number[] = [];
  private crossStudioObservations = 0;

  private unsubscribeHandlers: Array<() => void> = [];

  initialize(): void {
    // Subscribe to Brain X orchestration events to build telemetry
    // All subscriptions go through the EventBus — zero platform modification
    this.unsubscribeHandlers.push(
      eventBus.subscribe("brainX:workflow:started", () => {
        this.activeWorkflows++;
      }),
      eventBus.subscribe("brainX:workflow:complete", (data: { durationMs: number }) => {
        this.activeWorkflows = Math.max(0, this.activeWorkflows - 1);
        this.completedWorkflows++;
        this.workflowDurations.push(data.durationMs);
        // Keep rolling window of last 20 durations
        if (this.workflowDurations.length > 20) this.workflowDurations.shift();
      }),
      eventBus.subscribe("brainX:workflow:failed", () => {
        this.activeWorkflows = Math.max(0, this.activeWorkflows - 1);
        this.failedWorkflows++;
      }),
      eventBus.subscribe("brainX:memory:updated", (data: { nodeCount: number }) => {
        this.memoryNodes = data.nodeCount;
      }),
      eventBus.subscribe("brainX:scheduler:queued", (data: { pending: number }) => {
        this.scheduledTasks = data.pending;
      }),
      eventBus.subscribe("brainX:crossStudio:observed", (data: { count: number }) => {
        this.crossStudioObservations = data.count;
      }),
    );
  }

  collect(): BrainXDiagnostics {
    const durations = this.workflowDurations;
    const avg =
      durations.length > 0
        ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length)
        : 0;

    return {
      activeWorkflows: this.activeWorkflows,
      completedWorkflows: this.completedWorkflows,
      failedWorkflows: this.failedWorkflows,
      memoryNodes: this.memoryNodes,
      scheduledTasks: this.scheduledTasks,
      avgWorkflowDurationMs: avg,
      crossStudioObservations: this.crossStudioObservations,
    };
  }

  dispose(): void {
    for (const unsub of this.unsubscribeHandlers) {
      unsub();
    }
    this.unsubscribeHandlers = [];
    // Reset metrics on dispose — no platform state to clean
    this.activeWorkflows = 0;
    this.completedWorkflows = 0;
    this.failedWorkflows = 0;
    this.workflowDurations = [];
  }
}
