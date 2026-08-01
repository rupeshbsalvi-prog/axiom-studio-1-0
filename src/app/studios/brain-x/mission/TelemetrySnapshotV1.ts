// ----------------------------------------------------
// TelemetrySnapshotV1.ts — Brain X Telemetry Contract
//
// Location: src/app/studios/brain-x/mission/
// Layer:    Explainability (NOT platform, NOT UI)
// Status:   Active (Phase 8 Refinement)
//
// TELEMETRY INVARIANT:
//   Every metric displayed in the UI is derived exclusively from a
//   TelemetrySnapshotV1. The UI does no mathematical processing or
//   interpretation of telemetry state.
// ----------------------------------------------------

import type { Mission } from "./MissionTypes";
import type { ExplanationContractV1 } from "./ExplanationContract";

export type TelemetryHealthStateV1 = "optimal" | "healthy" | "attention" | "critical";
export type CognitiveLoadLevelV1 = "low" | "medium" | "high";

export interface TelemetrySnapshotV1 {
  derivedState: {
    healthState: TelemetryHealthStateV1;
    nextActionConfidence: number; // 0–1 predictability confidence
    cognitiveLoadLevel: CognitiveLoadLevelV1;
  };
  productMetrics: {
    cts: number; // Cognitive Transparency Score (0–100)
    cls: number; // Cognitive Load Score (0–100)
    mcs: number; // Model Consistency Score (0–100)
    ees: number; // Explanation Efficiency Score (0–100)
  };
  timestamp: number;
}

export interface TelemetryInputV1 {
  activeMission: Mission;
  missions: Mission[];
  explanation: ExplanationContractV1;
  timestamp: number;
}
