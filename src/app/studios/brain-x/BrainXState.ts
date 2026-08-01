// ----------------------------------------------------
// BrainXState.ts — Brain X Studio State Contract
//
// Location: src/app/studios/brain-x/
// Layer:    Studio (NOT platform)
//
// ARCHITECTURE GATE: This file is the Brain X state contract.
// It lives entirely in the Studio layer.
// The StateService stores this under the brainX.* namespace.
// The platform StateService requires ZERO modification to hold this state.
//
// PRODUCT WAVE 1 UPDATE:
// Mission Architecture v1.0 state is introduced alongside the existing
// workflow scaffolding. The workflow types are retained for backward
// compatibility with FR1.2 tests and the existing BrainXStudio lifecycle.
// Mission state keys use the brainX.mission.* namespace prefix.
// ----------------------------------------------------

// ─────────────────────────────────────────────────────────────────────────────
// LEGACY WORKFLOW TYPES (FR1.2 — retained for test compatibility)
// ─────────────────────────────────────────────────────────────────────────────

export type WorkflowStatus =
  | "idle"
  | "planning"
  | "reasoning"
  | "executing"
  | "evaluating"
  | "complete"
  | "failed";

export interface WorkflowStep {
  id: string;
  label: string;
  status: WorkflowStatus;
  startedAt: number | null;
  completedAt: number | null;
  outputSummary: string | null;
  /** Simulated duration in ms — for test determinism */
  durationMs: number;
}

export interface Workflow {
  id: string;
  name: string;
  status: WorkflowStatus;
  steps: WorkflowStep[];
  createdAt: number;
  completedAt: number | null;
}

export interface MemoryNode {
  id: string;
  concept: string;
  linkedTo: string[];
  confidence: number;
  lastAccessed: number;
}

export interface ScheduledTask {
  taskId: string;
  label: string;
  scheduledAt: number;
  executeAt: number;
  status: "pending" | "executing" | "complete" | "cancelled";
}

// ─────────────────────────────────────────────────────────────────────────────
// BRAIN X STATE DATA
// Combines legacy workflow scaffolding with Mission Architecture v1.0 state.
// Mission-related keys are accessed under brainX.mission.* in StateService.
// ─────────────────────────────────────────────────────────────────────────────

export interface BrainXStateData {
  // ── Legacy workflow scaffolding (FR1.2) ──────────────────────────────────
  activeWorkflows: Workflow[];
  completedWorkflows: number;
  failedWorkflows: number;
  memoryGraph: MemoryNode[];
  scheduledTasks: ScheduledTask[];
  pendingTaskCount: number;
  reasoningDepth: number;
  // Cross-Studio observations — read via EventBus, never via direct import
  crossStudioObservations: {
    "axCore.fps"?: number;
    "axCore.drawCalls"?: number;
    "axiomAi.activeAgents"?: number;
    "axiomAi.tokenUsed"?: number;
    [key: string]: number | undefined;
  };

  // ── Mission Architecture v1.0 ─────────────────────────────────────────
  // Stored under brainX.mission.* namespace in StateService
  missionPrograms: import("./mission/MissionTypes").Program[];
  missionList: import("./mission/MissionTypes").Mission[];
  focusMissionId: string | null;
  globalMemory: import("./mission/MissionTypes").CognitiveEntry[];
}

// ─────────────────────────────────────────────────────────────────────────────
// INITIAL STATE
// ─────────────────────────────────────────────────────────────────────────────

export const BRAIN_X_INITIAL_STATE: BrainXStateData = {
  // Legacy
  activeWorkflows: [],
  completedWorkflows: 0,
  failedWorkflows: 0,
  memoryGraph: [],
  scheduledTasks: [],
  pendingTaskCount: 0,
  reasoningDepth: 3,
  crossStudioObservations: {},
  // Mission Architecture v1.0
  missionPrograms: [],
  missionList: [],
  focusMissionId: null,
  globalMemory: [],
};

// ─────────────────────────────────────────────────────────────────────────────
// LEGACY FACTORY (FR1.2 — retained for test compatibility)
// ─────────────────────────────────────────────────────────────────────────────

/** Standard 4-step reasoning pipeline template */
export function createReasoningWorkflow(name: string): Workflow {
  return {
    id: `wf-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    name,
    status: "idle",
    createdAt: Date.now(),
    completedAt: null,
    steps: [
      { id: "plan",     label: "Planning",    status: "idle", startedAt: null, completedAt: null, outputSummary: null, durationMs: 40 },
      { id: "reason",   label: "Reasoning",   status: "idle", startedAt: null, completedAt: null, outputSummary: null, durationMs: 60 },
      { id: "execute",  label: "Executing",   status: "idle", startedAt: null, completedAt: null, outputSummary: null, durationMs: 50 },
      { id: "evaluate", label: "Evaluating",  status: "idle", startedAt: null, completedAt: null, outputSummary: null, durationMs: 30 },
    ],
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// STATE NAMESPACE KEYS
// Centralizes the StateService key strings for Mission Architecture state.
// BrainXStudio uses these constants — no magic strings in the Studio file.
// ─────────────────────────────────────────────────────────────────────────────

export const MISSION_STATE_KEYS = {
  programs:       "brainX.mission.programs",
  missions:       "brainX.mission.list",
  focusMissionId: "brainX.mission.focusId",
  globalMemory:   "brainX.mission.globalMemory",
} as const;
