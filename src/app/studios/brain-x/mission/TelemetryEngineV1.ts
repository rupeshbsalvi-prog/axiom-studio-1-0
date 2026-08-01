// ----------------------------------------------------
// TelemetryEngineV1.ts — Brain X Telemetry Engine
//
// Location: src/app/studios/brain-x/mission/
// Layer:    Explainability (NOT platform, NOT UI)
// Status:   Active (Phase 8 Refinement)
//
// All functions are pure mappings. No side effects.
// ----------------------------------------------------

import type { TelemetryInputV1, TelemetrySnapshotV1, TelemetryHealthStateV1, CognitiveLoadLevelV1 } from "./TelemetrySnapshotV1";

/**
 * Derives a TelemetrySnapshotV1 from a TelemetryInputV1.
 * Enforces the Telemetry Invariant: UI elements must only render pre-computed telemetry.
 * Predictability features are consumed directly from the ExplanationContractV1 to ensure single-source accuracy.
 */
export function deriveTelemetrySnapshotV1(input: TelemetryInputV1): TelemetrySnapshotV1 {
  const { missions, explanation, timestamp } = input;

  // 1. Next action confidence is owned by ExplanationContractV1 predictability
  const nextActionConfidence = explanation.predictability.confidence;
  const cts = Math.round(nextActionConfidence * 100);

  // 2. Calculate CLS (Cognitive Load Score) using ExplanationContract nodes and delegations
  const pendingNodesCount = explanation.reasoningGraph.nodes.filter((n) => n.status === "pending").length;
  const activeDelegationsCount = explanation.delegations.filter(
    (d) => d.status === "sent" || d.status === "acknowledged"
  ).length;
  const activeDecision = explanation.activeDecision;
  const decisionLoad = activeDecision ? 35 : 0;
  const cls = Math.min(100, Math.round(activeDelegationsCount * 15 + pendingNodesCount * 5 + decisionLoad));

  // Determine load level label
  let cognitiveLoadLevel: CognitiveLoadLevelV1 = "low";
  if (cls >= 75) {
    cognitiveLoadLevel = "high";
  } else if (cls >= 40) {
    cognitiveLoadLevel = "medium";
  }

  // 3. Calculate MCS (Model Consistency Score) using the context's mission history
  const completedMissions = missions.filter((m) => m.status === "completed").length;
  const totalAdaptations = missions.reduce(
    (acc, m) => acc + m.judgments.filter((j) => j.action === "adapt-plan").length,
    0
  );
  const consistencyFactor =
    completedMissions > 0 ? Math.max(0, 1 - totalAdaptations / (completedMissions * 2)) : 1.0;
  const mcs = Math.round((0.7 * nextActionConfidence + 0.3 * consistencyFactor) * 100);

  // 4. Calculate EES (Explanation Efficiency Score)
  const ees = Math.max(
    50,
    Math.min(
      100,
      Math.round(100 - (pendingNodesCount * 2 + activeDelegationsCount * 3 + (activeDecision ? 15 : 0)))
    )
  );

  // 5. Derive healthState
  let healthState: TelemetryHealthStateV1 = "healthy";
  if (cls >= 85 || mcs < 60 || ees < 60) {
    healthState = "critical";
  } else if (cls >= 60 || mcs < 75 || ees < 75 || cts < 75) {
    healthState = "attention";
  } else if (cls < 30 && mcs >= 90 && ees >= 90 && cts >= 90) {
    healthState = "optimal";
  }

  return {
    derivedState: {
      healthState,
      nextActionConfidence,
      cognitiveLoadLevel,
    },
    productMetrics: {
      cts,
      cls,
      mcs,
      ees,
    },
    timestamp,
  };
}
