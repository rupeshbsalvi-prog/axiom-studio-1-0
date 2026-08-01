// ----------------------------------------------------
// BrainXStudio.ts — Brain X Reasoning / Orchestration Studio
//
// Location: src/app/studios/brain-x/
//
// ARCHITECTURE GATE: This file contains ZERO Three.js imports.
// It proves the Platform Runtime is not coupled to WebGL.
//
// FR1.2 Validation Proof:
//   This is the THIRD platform consumer. It stresses the runtime
//   in ways FR1.0 and FR1.1 did not:
//
//   1. Async concurrent workflows  — EventBus handles parallel event streams
//   2. Cross-Studio observation     — reads axCore.* + axiomAi.* via EventBus only
//   3. Internal scheduler           — implemented in Studio layer, not platform
//   4. Long-running state           — brainX.memoryGraph accumulates across cycles
//   5. Three-namespace coexistence  — axCore.* + axiomAi.* + brainX.* simultaneously
//
// PRODUCT WAVE 1 — Mission Architecture v1.0:
//   Mission state initialized under brainX.mission.* namespace.
//   Delegation events subscribed with RT-001 re-entrancy guard.
//   All engine calls are pure — no StateService access inside engines.
//
// StudioModule contract: initialize → activate → deactivate → dispose
// No orchestration-specific lifecycle methods added to the platform.
// ----------------------------------------------------

import { platformRuntime } from "../../../platform/runtime/PlatformRuntime";
import { diagnosticsService } from "../../../platform/services/DiagnosticsService";
import { eventBus } from "../../../platform/services/EventBus";
import { stateService } from "../../../platform/services/StateService";
import { BrainXProvider } from "./diagnostics/BrainXProvider";
import {
  BRAIN_X_INITIAL_STATE,
  MISSION_STATE_KEYS,
  createReasoningWorkflow,
  type Workflow,
  type MemoryNode,
  type BrainXStateData,
} from "./BrainXState";
import {
  completeDelegation,
  failDelegation,
  acknowledgeDelegation,
} from "./mission/DelegationEngine";
import type { BrainXMissionStateData } from "./mission/MissionTypes";
import { BRAIN_X_MISSION_INITIAL_STATE } from "./mission/MissionTypes";

export class BrainXStudio {
  private provider: BrainXProvider | null = null;
  private observerUnsubscribers: Array<() => void> = [];
  private schedulerHandles: ReturnType<typeof setTimeout>[] = [];
  private sessionStartTime: number | null = null;
  // RT-001 Re-entrancy guard: StateService publishes full merged state on every setState() call.
  // Without this flag, writing brainX.crossStudioObservations re-triggers this subscriber
  // because the merged state still contains axiomAi.* keys — causing a stack overflow.
  private isProcessingObservation = false;
  // RT-001 Re-entrancy guard for Mission delegation result writes.
  private isProcessingDelegation = false;

  // ---------------------------------------------------------
  // initialize()
  // Called once on workspace mount.
  // Registers the Studio and its provider.
  // Seeds the brainX.* state namespace.
  // ---------------------------------------------------------
  initialize(): void {
    // Register with PlatformRuntime — same call as AX-CORE and Axiom AI
    platformRuntime.registerStudio(this);

    // Register the 8th DiagnosticsProvider — zero DiagnosticsService changes
    this.provider = new BrainXProvider();
    diagnosticsService.registerProvider(this.provider);
    this.provider.initialize();

    // Seed brainX.* state namespace in StateService
    // StateService requires NO modification — it holds generic key-value pairs
    const initial = BRAIN_X_INITIAL_STATE;
    stateService.setState({
      "brainX.activeWorkflows": initial.activeWorkflows,
      "brainX.completedWorkflows": initial.completedWorkflows,
      "brainX.failedWorkflows": initial.failedWorkflows,
      "brainX.memoryGraph": initial.memoryGraph,
      "brainX.scheduledTasks": initial.scheduledTasks,
      "brainX.pendingTaskCount": initial.pendingTaskCount,
      "brainX.reasoningDepth": initial.reasoningDepth,
      "brainX.crossStudioObservations": initial.crossStudioObservations,
    });

    // Seed Mission Architecture v1.0 state namespace
    const missionInitial = BRAIN_X_MISSION_INITIAL_STATE;
    stateService.setState({
      [MISSION_STATE_KEYS.programs]:       missionInitial.programs,
      [MISSION_STATE_KEYS.missions]:        missionInitial.missions,
      [MISSION_STATE_KEYS.focusMissionId]:  missionInitial.focusMissionId,
      [MISSION_STATE_KEYS.globalMemory]:    missionInitial.globalMemory,
    });

    eventBus.publish("studio:brainX:ready", { studioId: "brain-x" });
  }

  // ---------------------------------------------------------
  // activate()
  // Called when Brain X becomes the active Studio.
  // Starts cross-Studio observers and the internal scheduler.
  //
  // CRITICAL: Cross-Studio observation uses EventBus ONLY.
  // Brain X NEVER imports AxiomAiStudio or AXCoreRoot directly.
  // ---------------------------------------------------------
  activate(): void {
    this.sessionStartTime = Date.now();

    // ── Cross-Studio Observer: AX-CORE ────────────────────────────────
    // Listens to telemetry events from the rendering Studio without coupling
    this.observerUnsubscribers.push(
      eventBus.subscribe("telemetry:updated", (data: Record<string, number>) => {
        const current = stateService.getState()["brainX.crossStudioObservations"] ?? {};
        const updated = {
          ...current,
          "axCore.fps": data.fps ?? current["axCore.fps"],
          "axCore.drawCalls": data.drawCalls ?? current["axCore.drawCalls"],
        };
        stateService.setState({ "brainX.crossStudioObservations": updated });
        eventBus.publish("brainX:crossStudio:observed", {
          count: Object.keys(updated).length,
        });
      }),
    );

    // ── Cross-Studio Observer: Axiom AI ───────────────────────────────
    // Listens to AI state changes — adapts reasoning budget accordingly
    this.observerUnsubscribers.push(
      eventBus.subscribe("state:changed", (newState: Record<string, any>) => {
        // Re-entrancy guard: prevent recursive triggering when we write brainX.* state
        if (this.isProcessingObservation) return;
        if (
          newState["axiomAi.activeAgents"] === undefined &&
          newState["axiomAi.tokenUsed"] === undefined
        ) {
          return;
        }
        const current = stateService.getState()["brainX.crossStudioObservations"] ?? {};
        const updated = { ...current };
        if (newState["axiomAi.activeAgents"] !== undefined) {
          updated["axiomAi.activeAgents"] = newState["axiomAi.activeAgents"];
        }
        if (newState["axiomAi.tokenUsed"] !== undefined) {
          updated["axiomAi.tokenUsed"] = newState["axiomAi.tokenUsed"];
        }
        try {
          this.isProcessingObservation = true;
          stateService.setState({ "brainX.crossStudioObservations": updated });
        } finally {
          this.isProcessingObservation = false;
        }
        eventBus.publish("brainX:crossStudio:observed", {
          count: Object.keys(updated).length,
        });
      }),
    );

    // ── Internal Scheduler ────────────────────────────────────────────
    // Schedules a sample reasoning workflow demonstration.
    // Implemented entirely within the Studio — the platform has no scheduler.
    this._scheduleTask("Initial reasoning pipeline", 200, () => {
      const workflow = createReasoningWorkflow("Cross-Studio Context Analysis");
      void this._runWorkflow(workflow);
    });

    // ── Mission Delegation Result Handler ────────────────────────────────
    // Subscribes to delegation lifecycle events from Studios.
    // RT-001 guard: writing Mission state re-triggers state:changed, so we
    // guard against recursive writes with isProcessingDelegation.
    //
    // ARCHITECTURE GATE: Brain X never imports other Studios directly.
    // All Studio interaction goes through EventBus events only.
    this.observerUnsubscribers.push(
      eventBus.subscribe(
        "brainX:delegation:accepted",
        (payload: { delegationId: string; studioId: string }) => {
          if (this.isProcessingDelegation) return;
          try {
            this.isProcessingDelegation = true;
            this._applyMissionState(
              acknowledgeDelegation(this._getMissionState(), payload.delegationId),
            );
          } finally {
            this.isProcessingDelegation = false;
          }
        },
      ),
    );

    this.observerUnsubscribers.push(
      eventBus.subscribe(
        "brainX:delegation:completed",
        (payload: { delegationId: string; studioId: string; result: unknown }) => {
          if (this.isProcessingDelegation) return;
          try {
            this.isProcessingDelegation = true;
            this._applyMissionState(
              completeDelegation(
                this._getMissionState(),
                payload.delegationId,
                payload.result,
              ),
            );
          } finally {
            this.isProcessingDelegation = false;
          }
          eventBus.publish("brainX:delegation:result:applied", {
            delegationId: payload.delegationId,
          });
        },
      ),
    );

    this.observerUnsubscribers.push(
      eventBus.subscribe(
        "brainX:delegation:failed",
        (payload: { delegationId: string; studioId: string; reason: string }) => {
          if (this.isProcessingDelegation) return;
          try {
            this.isProcessingDelegation = true;
            this._applyMissionState(
              failDelegation(this._getMissionState(), payload.delegationId),
            );
          } finally {
            this.isProcessingDelegation = false;
          }
        },
      ),
    );

    eventBus.publish("studio:brainX:activated", { studioId: "brain-x" });
  }

  // ---------------------------------------------------------
  // deactivate()
  // Called when Brain X loses focus or another Studio becomes active.
  // Stops cross-Studio observers and clears pending scheduler tasks.
  // ---------------------------------------------------------
  deactivate(): void {
    // Unsubscribe all cross-Studio observers
    for (const unsub of this.observerUnsubscribers) {
      unsub();
    }
    this.observerUnsubscribers = [];

    // Clear all pending scheduled tasks (internal scheduler cleanup)
    for (const handle of this.schedulerHandles) {
      clearTimeout(handle);
    }
    this.schedulerHandles = [];

    eventBus.publish("studio:brainX:deactivated", { studioId: "brain-x" });
  }

  // ---------------------------------------------------------
  // dispose()
  // Full teardown. Zero platform residue after this call.
  // Only src/app/studios/brain-x/ needs to be deleted.
  // ---------------------------------------------------------
  dispose(): void {
    this.deactivate();

    if (this.provider) {
      this.provider.dispose();
      diagnosticsService.unregisterProvider("brainX");
      this.provider = null;
    }

    platformRuntime.unregisterStudio(this);
    eventBus.publish("studio:brainX:disposed", { studioId: "brain-x" });
  }

  // ---------------------------------------------------------
  // runWorkflow() — Async 4-step reasoning pipeline
  //
  // FR1.2 Validation: EventBus handles async concurrent event streams.
  // Multiple workflows can run simultaneously. Each publishes its own
  // step events independently. The EventBus routes all streams correctly.
  //
  // Event ordering (FIFO within a workflow):
  //   brainX:workflow:started
  //   brainX:workflow:step:complete (×4, in order: plan, reason, execute, evaluate)
  //   brainX:workflow:complete
  //
  // EventBus isolation: workflow A events never overwrite workflow B state.
  // ---------------------------------------------------------
  async runWorkflow(workflow: Workflow): Promise<void> {
    return this._runWorkflow(workflow);
  }

  private async _runWorkflow(workflow: Workflow): Promise<void> {
    const startedAt = Date.now();
    workflow.status = "planning";

    // Publish workflow start — other studios can observe this without coupling
    eventBus.publish("brainX:workflow:started", { workflowId: workflow.id, name: workflow.name });

    // Update state
    const currentWorkflows = [
      ...(stateService.getState()["brainX.activeWorkflows"] ?? []),
      workflow,
    ];
    stateService.setState({ "brainX.activeWorkflows": currentWorkflows });

    // Execute steps in strict FIFO order within this workflow
    const stepStatuses: WorkflowStatus[] = ["planning", "reasoning", "executing", "evaluating"];
    for (let i = 0; i < workflow.steps.length; i++) {
      const step = workflow.steps[i];
      const stepStatus = stepStatuses[i];
      step.status = stepStatus;
      step.startedAt = Date.now();
      workflow.status = stepStatus;

      // Simulate async work — this is where async concurrency happens
      await new Promise<void>((resolve) => setTimeout(resolve, step.durationMs));

      step.status = "complete";
      step.completedAt = Date.now();
      step.outputSummary = `${step.label} complete`;

      // Publish each step completion in order (FIFO guarantee within this workflow)
      eventBus.publish("brainX:workflow:step:complete", {
        workflowId: workflow.id,
        stepId: step.id,
        stepIndex: i,
        label: step.label,
        durationMs: step.durationMs,
      });
    }

    // Workflow complete
    workflow.status = "complete";
    workflow.completedAt = Date.now();
    const totalDuration = Date.now() - startedAt;

    // Remove from active, increment completed count
    const activeWorkflows = (stateService.getState()["brainX.activeWorkflows"] as Workflow[] ?? [])
      .filter((w) => w.id !== workflow.id);
    const completedCount = (stateService.getState()["brainX.completedWorkflows"] as number ?? 0) + 1;

    stateService.setState({
      "brainX.activeWorkflows": activeWorkflows,
      "brainX.completedWorkflows": completedCount,
    });

    eventBus.publish("brainX:workflow:complete", {
      workflowId: workflow.id,
      name: workflow.name,
      durationMs: totalDuration,
    });

    // Update memory graph — long-running state accumulation
    this._updateMemoryGraph(workflow.name);
  }

  // ---------------------------------------------------------
  // Internal Scheduler
  // Implemented entirely in the Studio layer.
  // Platform has no scheduler service — this proves it doesn't need one.
  // ---------------------------------------------------------
  private _scheduleTask(label: string, delayMs: number, task: () => void): void {
    const pending = (stateService.getState()["brainX.pendingTaskCount"] as number ?? 0) + 1;
    stateService.setState({ "brainX.pendingTaskCount": pending });
    eventBus.publish("brainX:scheduler:queued", { pending });

    const handle = setTimeout(() => {
      const newPending = Math.max(0, (stateService.getState()["brainX.pendingTaskCount"] as number ?? 0) - 1);
      stateService.setState({ "brainX.pendingTaskCount": newPending });
      task();
    }, delayMs);

    this.schedulerHandles.push(handle);
  }

  // ---------------------------------------------------------
  // Memory Graph — long-running state accumulation
  // Nodes accumulate across activate/deactivate cycles within a session.
  // Demonstrates StateService holds growing state without modification.
  // ---------------------------------------------------------
  private _updateMemoryGraph(concept: string): void {
    const existing = (stateService.getState()["brainX.memoryGraph"] as MemoryNode[] ?? []);
    const newNode: MemoryNode = {
      id: `node-${Date.now()}`,
      concept,
      linkedTo: existing.slice(-2).map((n) => n.id),
      confidence: 0.7 + Math.random() * 0.3,
      lastAccessed: Date.now(),
    };

    const updated = [...existing, newNode].slice(-50); // keep last 50 nodes
    stateService.setState({ "brainX.memoryGraph": updated });
    eventBus.publish("brainX:memory:updated", { nodeCount: updated.length });
  }

  // ─────────────────────────────────────────────────────────────────────
  // MISSION STATE ACCESSORS
  // Bridge between BrainXMissionStateData (pure engine format)
  // and the StateService key-value store.
  // ─────────────────────────────────────────────────────────────────────

  private _getMissionState(): BrainXMissionStateData {
    const s = stateService.getState();
    return {
      programs:       (s[MISSION_STATE_KEYS.programs]      as BrainXMissionStateData["programs"])      ?? [],
      missions:       (s[MISSION_STATE_KEYS.missions]       as BrainXMissionStateData["missions"])       ?? [],
      focusMissionId: (s[MISSION_STATE_KEYS.focusMissionId] as string | null)                            ?? null,
      globalMemory:   (s[MISSION_STATE_KEYS.globalMemory]   as BrainXMissionStateData["globalMemory"])   ?? [],
    };
  }

  private _applyMissionState(missionState: BrainXMissionStateData): void {
    stateService.setState({
      [MISSION_STATE_KEYS.programs]:       missionState.programs,
      [MISSION_STATE_KEYS.missions]:        missionState.missions,
      [MISSION_STATE_KEYS.focusMissionId]:  missionState.focusMissionId,
      [MISSION_STATE_KEYS.globalMemory]:    missionState.globalMemory,
    });
  }
}

// Singleton — same pattern as axiomAiStudio and platformRuntime
export const brainXStudio = new BrainXStudio();

// WorkflowStatus re-export for use in tests without importing BrainXState
type WorkflowStatus = Workflow["status"];
