// ----------------------------------------------------
// MissionService.ts — Program and Mission Lifecycle Management
//
// Location: src/app/studios/brain-x/mission/
// Layer:    Studio (NOT platform)
//
// Creates and manages Programs and Missions. Owns status transitions,
// Focus selection, Objective management, and Mission completion logic.
//
// MissionService is a pure object — it does NOT interact with StateService
// or EventBus directly. Callers (BrainXStudio) are responsible for
// persisting returned state and publishing events.
//
// This separation keeps the service fully testable without platform mocks.
// ----------------------------------------------------

import type {
  Program,
  Mission,
  MissionStatus,
  Objective,
  ObjectiveStatus,
  OutcomeDefinition,
  Decision,
  Observation,
  JudgmentResult,
  Reflection,
  PlanImpact,
  JudgmentVerdict,
  JudgmentAction,
  BrainXMissionStateData,
} from "./MissionTypes";
import { generateId, BRAIN_X_MISSION_INITIAL_STATE } from "./MissionTypes";
export { BRAIN_X_MISSION_INITIAL_STATE };
import { createReasoningGraph } from "./ReasoningGraphEngine";

// Re-export for callers
export { createReasoningGraph };

// ─────────────────────────────────────────────────────────────────────────────
// PROGRAM OPERATIONS
// ─────────────────────────────────────────────────────────────────────────────

/** Create a new Program representing a long-lived human intention. */
export function createProgram(
  state: BrainXMissionStateData,
  vision: string,
  title?: string,
): { state: BrainXMissionStateData; program: Program } {
  const program: Program = {
    id: generateId("prog"),
    title: title ?? vision.slice(0, 60),
    vision,
    missionIds: [],
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
  return {
    program,
    state: { ...state, programs: [...state.programs, program] },
  };
}

/** Associate an existing Mission with a Program. */
export function addMissionToProgram(
  state: BrainXMissionStateData,
  programId: string,
  missionId: string,
): BrainXMissionStateData {
  const programs = state.programs.map((p) =>
    p.id === programId
      ? { ...p, missionIds: [...p.missionIds, missionId], updatedAt: Date.now() }
      : p,
  );
  return { ...state, programs };
}

// ─────────────────────────────────────────────────────────────────────────────
// MISSION OPERATIONS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Create a new Mission from raw user intent.
 * Brain X derives the title — it is never user-named.
 * OutcomeDefinition must be provided: Brain X knows when it has succeeded.
 */
export function createMission(
  state: BrainXMissionStateData,
  intent: string,
  outcome: OutcomeDefinition,
  programId?: string,
): { state: BrainXMissionStateData; mission: Mission } {
  const now = Date.now();
  const mission: Mission = {
    id: generateId("mission"),
    programId,
    title: deriveTitleFromIntent(intent),
    intent,
    outcome,
    status: "created",
    objectives: [],
    reasoningGraph: createReasoningGraph(),
    delegations: [],
    decisions: [],
    observations: [],
    judgments: [],
    reflections: [],
    cognitiveRecord: [],
    createdAt: now,
    updatedAt: now,
  };

  let nextState: BrainXMissionStateData = {
    ...state,
    missions: [...state.missions, mission],
    // First Mission automatically becomes the Focus
    focusMissionId: state.focusMissionId ?? mission.id,
  };

  // If a programId was provided, link the Mission to the Program
  if (programId) {
    nextState = addMissionToProgram(nextState, programId, mission.id);
  }

  return { state: nextState, mission };
}

/**
 * Transition a Mission's status.
 * Valid transitions are enforced — invalid ones are rejected with an error.
 */
export function transitionMissionStatus(
  state: BrainXMissionStateData,
  missionId: string,
  newStatus: MissionStatus,
): BrainXMissionStateData {
  const mission = requireMission(state, missionId);
  assertValidTransition(mission.status, newStatus);

  const now = Date.now();
  const updated: Mission = {
    ...mission,
    status: newStatus,
    updatedAt: now,
    ...(newStatus === "completed" || newStatus === "failed" || newStatus === "abandoned"
      ? { completedAt: now }
      : {}),
  };

  return replaceMission(state, updated);
}

/**
 * Set the Focus Mission — the one Brain X is concentrating on.
 * All other Missions remain accessible but unfocused.
 */
export function setFocusMission(
  state: BrainXMissionStateData,
  missionId: string,
): BrainXMissionStateData {
  requireMission(state, missionId); // validates existence
  return { ...state, focusMissionId: missionId };
}

// ─────────────────────────────────────────────────────────────────────────────
// OBJECTIVE OPERATIONS
// ─────────────────────────────────────────────────────────────────────────────

/** Add an Objective to a Mission. */
export function addObjective(
  state: BrainXMissionStateData,
  missionId: string,
  description: string,
  deliverables: string[],
  assignedTo?: string,
): { state: BrainXMissionStateData; objectiveId: string } {
  const mission = requireMission(state, missionId);
  const objective: Objective = {
    id: generateId("obj"),
    description,
    deliverables,
    assignedTo,
    status: "pending",
  };
  const updated = touchMission(mission, {
    objectives: [...mission.objectives, objective],
  });
  return { state: replaceMission(state, updated), objectiveId: objective.id };
}

/** Update the status of an Objective within a Mission. */
export function updateObjectiveStatus(
  state: BrainXMissionStateData,
  missionId: string,
  objectiveId: string,
  status: ObjectiveStatus,
): BrainXMissionStateData {
  const mission = requireMission(state, missionId);
  const objectives = mission.objectives.map((o) =>
    o.id === objectiveId ? { ...o, status } : o,
  );
  return replaceMission(state, touchMission(mission, { objectives }));
}

// ─────────────────────────────────────────────────────────────────────────────
// DECISION OPERATIONS
// ─────────────────────────────────────────────────────────────────────────────

/** Add a Decision to a Mission (transitions Mission to "paused"). */
export function addDecision(
  state: BrainXMissionStateData,
  missionId: string,
  objectiveId: string,
  question: string,
  options?: string[],
  recommendation?: string,
  confidence?: number,
  rationale?: string,
): { state: BrainXMissionStateData; decisionId: string } {
  const mission = requireMission(state, missionId);
  const decision: Decision = {
    id: generateId("dec"),
    missionId,
    objectiveId,
    question,
    options,
    recommendation,
    confidence,
    rationale,
  };
  let updated = touchMission(mission, {
    decisions: [...mission.decisions, decision],
  });
  // Decisions always pause the Mission
  updated = { ...updated, status: "paused" as MissionStatus };
  return { state: replaceMission(state, updated), decisionId: decision.id };
}

/** Resolve a Decision (transitions Mission back to "active"). */
export function resolveDecision(
  state: BrainXMissionStateData,
  missionId: string,
  decisionId: string,
  userChoice: string,
  userReason?: string,
): BrainXMissionStateData {
  const mission = requireMission(state, missionId);
  const decisions = mission.decisions.map((d) =>
    d.id === decisionId
      ? { ...d, userChoice, userReason, resolvedAt: Date.now() }
      : d,
  );
  const allResolved = decisions.every((d) => d.resolvedAt !== undefined);
  const updated = touchMission(mission, {
    decisions,
    status: allResolved ? "active" : "paused",
  });
  return replaceMission(state, updated);
}

// ─────────────────────────────────────────────────────────────────────────────
// OBSERVATION OPERATIONS
// ─────────────────────────────────────────────────────────────────────────────

/** Record an Observation against a Mission. */
export function addObservation(
  state: BrainXMissionStateData,
  missionId: string,
  source: string,
  content: string,
  planImpact: PlanImpact = "none",
): { state: BrainXMissionStateData; observationId: string } {
  const mission = requireMission(state, missionId);
  const observation: Observation = {
    id: generateId("obs"),
    missionId,
    timestamp: Date.now(),
    source,
    content,
    planImpact,
  };
  const updated = touchMission(mission, {
    observations: [...mission.observations, observation],
  });
  return { state: replaceMission(state, updated), observationId: observation.id };
}

// ─────────────────────────────────────────────────────────────────────────────
// JUDGMENT OPERATIONS
// ─────────────────────────────────────────────────────────────────────────────

/** Record a JudgmentResult against a Mission. */
export function addJudgment(
  state: BrainXMissionStateData,
  missionId: string,
  subject: string,
  verdict: JudgmentVerdict,
  confidence: number,
  rationale: string,
  action: JudgmentAction,
): { state: BrainXMissionStateData; judgmentId: string } {
  const mission = requireMission(state, missionId);
  const judgment: JudgmentResult = {
    id: generateId("jdg"),
    missionId,
    timestamp: Date.now(),
    subject,
    verdict,
    confidence,
    rationale,
    action,
  };
  const updated = touchMission(mission, {
    judgments: [...mission.judgments, judgment],
  });
  return { state: replaceMission(state, updated), judgmentId: judgment.id };
}

// ─────────────────────────────────────────────────────────────────────────────
// REFLECTION OPERATIONS
// ─────────────────────────────────────────────────────────────────────────────

/** Add a post-execution Reflection to a Mission. */
export function addReflection(
  state: BrainXMissionStateData,
  missionId: string,
  type: Reflection["type"],
  content: string,
  scope: string[],
): { state: BrainXMissionStateData; reflectionId: string } {
  const mission = requireMission(state, missionId);
  const reflection: Reflection = {
    id: generateId("ref"),
    missionId,
    timestamp: Date.now(),
    type,
    content,
    scope,
  };
  const updated = touchMission(mission, {
    reflections: [...mission.reflections, reflection],
  });
  return { state: replaceMission(state, updated), reflectionId: reflection.id };
}

// ─────────────────────────────────────────────────────────────────────────────
// OUTCOME EVALUATION
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Evaluate whether a Mission's OutcomeDefinition is satisfied.
 * Returns an object describing which criteria are met.
 *
 * Note: in a full implementation, Brain X uses LLM-based evaluation.
 * This provides the structural contract — the evaluation hook.
 */
export function evaluateOutcome(
  mission: Mission,
  satisfiedCriteria: string[],
): {
  successSatisfied: boolean;
  acceptanceSatisfied: boolean;
  completionSatisfied: boolean;
  isComplete: boolean;
} {
  const successSatisfied = mission.outcome.successCriteria.every((c) =>
    satisfiedCriteria.includes(c),
  );
  const acceptanceSatisfied = mission.outcome.acceptanceCriteria.every((c) =>
    satisfiedCriteria.includes(c),
  );
  // completionCondition is evaluated externally — here we accept a boolean signal
  const completionSatisfied = satisfiedCriteria.includes(mission.outcome.completionCondition);

  return {
    successSatisfied,
    acceptanceSatisfied,
    completionSatisfied,
    isComplete: successSatisfied && acceptanceSatisfied && completionSatisfied,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// INTERNAL HELPERS
// ─────────────────────────────────────────────────────────────────────────────

function requireMission(state: BrainXMissionStateData, missionId: string): Mission {
  const mission = state.missions.find((m) => m.id === missionId);
  if (!mission) throw new Error(`MissionService: Mission "${missionId}" not found`);
  return mission;
}

function replaceMission(state: BrainXMissionStateData, updated: Mission): BrainXMissionStateData {
  return {
    ...state,
    missions: state.missions.map((m) => (m.id === updated.id ? updated : m)),
  };
}

function touchMission(mission: Mission, patch: Partial<Mission>): Mission {
  return { ...mission, ...patch, updatedAt: Date.now() };
}

/** Derive a short title from raw intent. Brain X always names Missions — never the user. */
function deriveTitleFromIntent(intent: string): string {
  const cleaned = intent.trim().replace(/[^a-zA-Z0-9\s]/g, "");
  const words = cleaned.split(/\s+/).slice(0, 6);
  return words.join(" ");
}

/** Valid MissionStatus transitions. */
const VALID_TRANSITIONS: Partial<Record<MissionStatus, MissionStatus[]>> = {
  created:    ["planning", "abandoned"],
  planning:   ["active", "failed", "abandoned"],
  active:     ["paused", "completing", "failed", "abandoned"],
  paused:     ["active", "abandoned"],
  completing: ["completed", "active", "failed"],
  completed:  [],
  failed:     [],
  abandoned:  [],
};

function assertValidTransition(from: MissionStatus, to: MissionStatus): void {
  const allowed = VALID_TRANSITIONS[from] ?? [];
  if (!allowed.includes(to)) {
    throw new Error(
      `MissionService: invalid status transition "${from}" → "${to}"`,
    );
  }
}
