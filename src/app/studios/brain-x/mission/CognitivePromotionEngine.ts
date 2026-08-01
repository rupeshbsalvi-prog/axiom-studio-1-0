// ----------------------------------------------------
// CognitivePromotionEngine.ts — Evidence-Based Cognitive Promotion
//
// Location: src/app/studios/brain-x/mission/
// Layer:    Studio (NOT platform)
//
// Manages the evidence chain through which Brain X accumulates expertise.
//
// Promotion path:
//   observation  (×3 min evidence, conf ≥ 0.40)  →  learning
//   learning     (×2 min evidence, conf ≥ 0.72)  →  knowledge
//   knowledge    (×2 min evidence, conf ≥ 0.91)  →  memory
//
// Memory entries persist across Missions in globalMemory.
//
// Key design constraints:
//   - Promotion requires evidence count AND confidence threshold
//   - A single observation cannot become knowledge in one step
//   - Memory is the end of an evidence chain, not an inference
//   - This prevents Brain X from over-generalizing
// ----------------------------------------------------

import type {
  CognitiveEntry,
  CognitiveStage,
  BrainXMissionStateData,
  Mission,
} from "./MissionTypes";
import {
  generateId,
  PROMOTION_CONFIDENCE_THRESHOLDS,
  PROMOTION_EVIDENCE_MINIMUM,
} from "./MissionTypes";

// ─────────────────────────────────────────────────────────────────────────────
// OBSERVATION CREATION
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Create a new observation-stage CognitiveEntry and add it to a Mission.
 * Observations are raw — they have not been generalized or validated.
 */
export function addCognitiveObservation(
  state: BrainXMissionStateData,
  missionId: string,
  content: string,
  initialConfidence: number = 0.30,
): { state: BrainXMissionStateData; entryId: string } {
  const mission = requireMission(state, missionId);

  const entry: CognitiveEntry = {
    id: generateId("cog"),
    stage: "observation",
    content,
    confidence: clamp(initialConfidence),
    evidenceIds: [],
    promotionThreshold: PROMOTION_EVIDENCE_MINIMUM.observation,
    derivedFrom: missionId,
    timestamp: Date.now(),
  };

  const updated = patchMission(mission, {
    cognitiveRecord: [...mission.cognitiveRecord, entry],
  });

  return { state: replaceMission(state, updated), entryId: entry.id };
}

// ─────────────────────────────────────────────────────────────────────────────
// EVIDENCE ACCUMULATION
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Add corroborating evidence to an existing CognitiveEntry.
 * Evidence increases confidence toward the promotion threshold.
 * Confidence grows proportionally: each new evidence id raises it toward 1.0.
 */
export function addEvidence(
  state: BrainXMissionStateData,
  missionId: string,
  entryId: string,
  supportingEntryId: string,
): BrainXMissionStateData {
  const mission = requireMission(state, missionId);
  const cognitiveRecord = mission.cognitiveRecord.map((e) => {
    if (e.id !== entryId) return e;
    if (e.evidenceIds.includes(supportingEntryId)) return e; // idempotent

    const newEvidenceIds = [...e.evidenceIds, supportingEntryId];
    // Confidence increases as evidence accumulates, asymptotically approaching 1.0
    const newConfidence = clamp(1 - (1 - e.confidence) * 0.75);

    return {
      ...e,
      evidenceIds: newEvidenceIds,
      confidence: newConfidence,
    };
  });

  return replaceMission(state, patchMission(mission, { cognitiveRecord }));
}

// ─────────────────────────────────────────────────────────────────────────────
// PROMOTION
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Attempt to promote a CognitiveEntry to the next stage.
 *
 * Promotion conditions:
 *   1. Evidence count >= promotionThreshold for the current stage
 *   2. Confidence >= PROMOTION_CONFIDENCE_THRESHOLDS[currentStage]
 *
 * Returns the updated state. If conditions are not met, state is unchanged.
 */
export function attemptPromotion(
  state: BrainXMissionStateData,
  missionId: string,
  entryId: string,
  promotedContent?: string,  // optional — caller may refine the content on promotion
): {
  state: BrainXMissionStateData;
  promoted: boolean;
  newStage: CognitiveStage | null;
  newEntryId: string | null;
} {
  const mission = requireMission(state, missionId);
  const entry = mission.cognitiveRecord.find((e) => e.id === entryId);

  if (!entry) {
    return { state, promoted: false, newStage: null, newEntryId: null };
  }

  // Memory is the terminal stage — no further promotion
  if (entry.stage === "memory") {
    return { state, promoted: false, newStage: null, newEntryId: null };
  }

  const minEvidence = PROMOTION_EVIDENCE_MINIMUM[entry.stage];
  const minConfidence = PROMOTION_CONFIDENCE_THRESHOLDS[entry.stage];

  if (entry.evidenceIds.length < minEvidence || entry.confidence < minConfidence) {
    return { state, promoted: false, newStage: null, newEntryId: null };
  }

  const nextStage = getNextStage(entry.stage);
  const now = Date.now();

  const promoted: CognitiveEntry = {
    id: generateId("cog"),
    stage: nextStage,
    content: promotedContent ?? entry.content,
    confidence: entry.confidence * 0.85, // confidence resets slightly on promotion
    evidenceIds: [entry.id],             // the promoted entry itself is the first evidence
    promotionThreshold: nextStage === "memory" ? 0 : PROMOTION_EVIDENCE_MINIMUM[nextStage as keyof typeof PROMOTION_EVIDENCE_MINIMUM] ?? 0,
    derivedFrom: entry.derivedFrom,
    promotedFrom: entry.id,
    timestamp: now,
  };

  let nextState: BrainXMissionStateData;

  if (nextStage === "memory") {
    // Memory entries move to globalMemory and are added to cognitiveRecord for traceability
    const updatedMission = patchMission(mission, {
      cognitiveRecord: [...mission.cognitiveRecord, promoted],
    });
    nextState = {
      ...replaceMission(state, updatedMission),
      globalMemory: [...state.globalMemory, promoted],
    };
  } else {
    const updatedMission = patchMission(mission, {
      cognitiveRecord: [...mission.cognitiveRecord, promoted],
    });
    nextState = replaceMission(state, updatedMission);
  }

  return { state: nextState, promoted: true, newStage: nextStage, newEntryId: promoted.id };
}

// ─────────────────────────────────────────────────────────────────────────────
// BATCH PROMOTION SCAN
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Scan all CognitiveEntries in a Mission and promote any that meet the threshold.
 * Called by Brain X's Reflection phase after Mission completion.
 * Returns a log of all promotions that occurred.
 */
export function consolidateMissionCognition(
  state: BrainXMissionStateData,
  missionId: string,
): {
  state: BrainXMissionStateData;
  promotions: Array<{ entryId: string; fromStage: CognitiveStage; toStage: CognitiveStage }>;
} {
  const mission = requireMission(state, missionId);
  const promotions: Array<{
    entryId: string;
    fromStage: CognitiveStage;
    toStage: CognitiveStage;
  }> = [];

  let currentState = state;

  // Process in stage order: observations first, then learnings, then knowledge
  const stageOrder: CognitiveStage[] = ["observation", "learning", "knowledge"];

  for (const stage of stageOrder) {
    const candidateIds = requireMission(currentState, missionId)
      .cognitiveRecord.filter((e) => e.stage === stage)
      .map((e) => e.id);

    for (const entryId of candidateIds) {
      const entry = requireMission(currentState, missionId).cognitiveRecord.find(
        (e) => e.id === entryId,
      );
      if (!entry) continue;

      const result = attemptPromotion(currentState, missionId, entryId);
      if (result.promoted && result.newStage) {
        promotions.push({
          entryId,
          fromStage: entry.stage,
          toStage: result.newStage,
        });
        currentState = result.state;
      }
    }
  }

  return { state: currentState, promotions };
}

// ─────────────────────────────────────────────────────────────────────────────
// QUERIES
// ─────────────────────────────────────────────────────────────────────────────

/** Returns all CognitiveEntries at a given stage within a Mission. */
export function getEntriesByStage(
  state: BrainXMissionStateData,
  missionId: string,
  stage: CognitiveStage,
): CognitiveEntry[] {
  const mission = requireMission(state, missionId);
  return mission.cognitiveRecord.filter((e) => e.stage === stage);
}

/** Returns the full global memory (memory-stage entries that crossed Mission boundaries). */
export function getGlobalMemory(state: BrainXMissionStateData): CognitiveEntry[] {
  return state.globalMemory;
}

/**
 * Find global memory entries relevant to a given content topic.
 * Simple keyword match — future implementation uses semantic search.
 */
export function findRelevantMemory(
  state: BrainXMissionStateData,
  topic: string,
): CognitiveEntry[] {
  const keywords = topic.toLowerCase().split(/\s+/);
  return state.globalMemory.filter((e) =>
    keywords.some((kw) => e.content.toLowerCase().includes(kw)),
  );
}

/**
 * Returns cognitive stage counts for a Mission — used by Mission Control UI.
 */
export function cognitiveStageStats(
  state: BrainXMissionStateData,
  missionId: string,
): Record<CognitiveStage, number> {
  const mission = requireMission(state, missionId);
  return {
    observation: mission.cognitiveRecord.filter((e) => e.stage === "observation").length,
    learning:    mission.cognitiveRecord.filter((e) => e.stage === "learning").length,
    knowledge:   mission.cognitiveRecord.filter((e) => e.stage === "knowledge").length,
    memory:      mission.cognitiveRecord.filter((e) => e.stage === "memory").length,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// INTERNAL HELPERS
// ─────────────────────────────────────────────────────────────────────────────

function requireMission(state: BrainXMissionStateData, missionId: string): Mission {
  const mission = state.missions.find((m) => m.id === missionId);
  if (!mission) {
    throw new Error(`CognitivePromotionEngine: Mission "${missionId}" not found`);
  }
  return mission;
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

function getNextStage(stage: CognitiveStage): CognitiveStage {
  const progression: Record<CognitiveStage, CognitiveStage> = {
    observation: "learning",
    learning:    "knowledge",
    knowledge:   "memory",
    memory:      "memory", // terminal
  };
  return progression[stage];
}

function clamp(value: number): number {
  return Math.max(0, Math.min(1, value));
}
