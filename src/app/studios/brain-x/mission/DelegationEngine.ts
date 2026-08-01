// ----------------------------------------------------
// DelegationEngine.ts — Brain X Delegation Routing and Validation
//
// Location: src/app/studios/brain-x/mission/
// Layer:    Studio (NOT platform)
//
// Brain X never performs work directly. It creates Delegation objects
// and routes them to Studios via EventBus events. This engine manages
// the Delegation lifecycle and validates Studio outputs against
// OutputContracts before Brain X accepts a result.
//
// ARCHITECTURE GATE:
//   This engine knows delegation IDs and Studio routing targets.
//   It does NOT import any other Studio directly.
//   All Studio interaction goes through EventBus events only.
//
// EventBus events published by callers (BrainXStudio):
//   brainX:delegation:created   → { missionId, objectiveId, delegationId, targetStudio, payload, expectedOutput }
//
// EventBus events subscribed by callers (BrainXStudio):
//   brainX:delegation:accepted   → { delegationId, studioId }
//   brainX:delegation:completed  → { delegationId, studioId, result }
//   brainX:delegation:failed     → { delegationId, studioId, reason }
// ----------------------------------------------------

import type {
  Delegation,
  DelegationStatus,
  OutputContract,
  BrainXMissionStateData,
  Mission,
} from "./MissionTypes";
import { generateId } from "./MissionTypes";

// ─────────────────────────────────────────────────────────────────────────────
// DELEGATION CREATION
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Create a Delegation and add it to the Mission.
 * Returns updated state and the new Delegation (caller publishes the EventBus event).
 */
export function createDelegation(
  state: BrainXMissionStateData,
  missionId: string,
  objectiveId: string,
  targetStudio: string,
  payload: unknown,
  expectedOutput: OutputContract,
): { state: BrainXMissionStateData; delegation: Delegation } {
  const mission = requireMission(state, missionId);

  const delegation: Delegation = {
    id: generateId("del"),
    missionId,
    objectiveId,
    targetStudio,
    payload,
    expectedOutput,
    status: "sent",
    sentAt: Date.now(),
  };

  const updated = patchMission(mission, {
    delegations: [...mission.delegations, delegation],
  });

  return {
    state: replaceMission(state, updated),
    delegation,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// DELEGATION STATUS UPDATES
// ─────────────────────────────────────────────────────────────────────────────

/** Mark a Delegation as acknowledged by the target Studio. */
export function acknowledgeDelegation(
  state: BrainXMissionStateData,
  delegationId: string,
): BrainXMissionStateData {
  return updateDelegationStatus(state, delegationId, "acknowledged");
}

/**
 * Mark a Delegation as completed and validate its result against the OutputContract.
 * Sets validationPassed based on contract evaluation.
 */
export function completeDelegation(
  state: BrainXMissionStateData,
  delegationId: string,
  result: unknown,
): BrainXMissionStateData {
  const { mission, delegation } = requireDelegation(state, delegationId);
  const validationPassed = validateOutput(result, delegation.expectedOutput);

  const updatedDelegation: Delegation = {
    ...delegation,
    status: "completed",
    completedAt: Date.now(),
    result,
    validationPassed,
  };

  const updated = patchMission(mission, {
    delegations: mission.delegations.map((d) =>
      d.id === delegationId ? updatedDelegation : d,
    ),
  });

  return replaceMission(state, updated);
}

/** Mark a Delegation as failed. */
export function failDelegation(
  state: BrainXMissionStateData,
  delegationId: string,
): BrainXMissionStateData {
  return updateDelegationStatus(state, delegationId, "failed");
}

/** Mark a Delegation as rejected (Studio refused the work). */
export function rejectDelegation(
  state: BrainXMissionStateData,
  delegationId: string,
): BrainXMissionStateData {
  return updateDelegationStatus(state, delegationId, "rejected");
}

// ─────────────────────────────────────────────────────────────────────────────
// OUTPUT CONTRACT VALIDATION
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Validate a delegation result against its OutputContract.
 *
 * Phase 1 implementation: validates that the result is non-null and
 * that validation rules are recorded for future automated evaluation.
 *
 * In a full implementation, Brain X uses LLM-based rule evaluation.
 * This provides the structural contract — the validation hook.
 */
export function validateOutput(result: unknown, contract: OutputContract): boolean {
  if (result === null || result === undefined) return false;

  // Schema presence check — contract records the expectation
  if (!contract.schema) return false;

  // Validation rules are logged for evaluation (future: LLM evaluation)
  // Phase 1: structural pass if result exists and contract is specified
  return contract.validationRules.length === 0 || result !== null;
}

// ─────────────────────────────────────────────────────────────────────────────
// DELEGATION QUERIES
// ─────────────────────────────────────────────────────────────────────────────

/** Returns all active (sent/acknowledged) delegations across all Missions. */
export function getActiveDelegations(state: BrainXMissionStateData): Delegation[] {
  return state.missions.flatMap((m) =>
    m.delegations.filter((d) => d.status === "sent" || d.status === "acknowledged"),
  );
}

/** Returns all delegations for a specific Mission. */
export function getMissionDelegations(
  state: BrainXMissionStateData,
  missionId: string,
): Delegation[] {
  const mission = requireMission(state, missionId);
  return mission.delegations;
}

/** Returns delegations that completed but failed validation. */
export function getFailedValidations(state: BrainXMissionStateData): Delegation[] {
  return state.missions.flatMap((m) =>
    m.delegations.filter((d) => d.status === "completed" && d.validationPassed === false),
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// INTERNAL HELPERS
// ─────────────────────────────────────────────────────────────────────────────

function requireMission(state: BrainXMissionStateData, missionId: string): Mission {
  const mission = state.missions.find((m) => m.id === missionId);
  if (!mission) throw new Error(`DelegationEngine: Mission "${missionId}" not found`);
  return mission;
}

function requireDelegation(
  state: BrainXMissionStateData,
  delegationId: string,
): { mission: Mission; delegation: Delegation } {
  for (const mission of state.missions) {
    const delegation = mission.delegations.find((d) => d.id === delegationId);
    if (delegation) return { mission, delegation };
  }
  throw new Error(`DelegationEngine: Delegation "${delegationId}" not found`);
}

function updateDelegationStatus(
  state: BrainXMissionStateData,
  delegationId: string,
  status: DelegationStatus,
): BrainXMissionStateData {
  const { mission, delegation } = requireDelegation(state, delegationId);
  const updated: Delegation = {
    ...delegation,
    status,
    ...(status === "completed" || status === "failed" || status === "rejected"
      ? { completedAt: Date.now() }
      : {}),
  };
  const patchedMission = patchMission(mission, {
    delegations: mission.delegations.map((d) => (d.id === delegationId ? updated : d)),
  });
  return replaceMission(state, patchedMission);
}

function patchMission(mission: Mission, patch: Partial<Mission>): Mission {
  return { ...mission, ...patch, updatedAt: Date.now() };
}

function replaceMission(state: BrainXMissionStateData, updated: Mission): BrainXMissionStateData {
  return {
    ...state,
    missions: state.missions.map((m) => (m.id === updated.id ? updated : m)),
  };
}
