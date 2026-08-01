// ----------------------------------------------------
// ExplanationContract.ts — Brain X Explanation Contract
//
// Location: src/app/studios/brain-x/mission/
// Layer:    Explainability (NOT platform, NOT UI)
// Status:   Active (Phase 8)
//
// UI INVARIANT:
//   Every visible Brain X element must be derivable from exactly one
//   ExplanationContract. The UI never reasons, never interprets, and
//   only renders fields from this contract.
// ----------------------------------------------------

export interface ExplanationNode {
  id: string;
  label: string;
  type: string;
  status: string;
  rationale: string;
  objectiveDescription?: string;
}

export interface ExplanationEdge {
  from: string;
  to: string;
  relationship: string;
  rationale: string;
}

export interface ExplanationDelegation {
  id: string;
  targetStudio: string;
  status: string;
  payloadSummary: string;
  expectedOutputSummary: string;
  progressPercent: number; // 0–100 derived value
  validationPassed?: boolean;
}

export interface ExplanationDecision {
  id: string;
  question: string;
  options: string[];
  recommendation: string;
  confidence: number;
  rationale: string;
}

export interface ExplanationTimeline {
  currentStage: string;
  completedStages: string[];
  pendingStages: string[];
  durationMs: number;
  completedAt?: number;
}

export interface CognitiveEvolutionSummary {
  observationsCount: number;
  learningsCount: number;
  knowledgeCount: number;
  recentReflections: Array<{
    type: string;
    content: string;
    timestamp: number;
  }>;
  promotedLearnings: Array<{
    content: string;
    confidence: number;
  }>;
  promotedKnowledge: Array<{
    content: string;
    confidence: number;
  }>;
}

export interface PredictabilitySummary {
  predictedNextAction: string;
  confidence: number; // 0–1
  rationale: string;
}

export interface ExplanationContractV1 {
  missionId: string;
  title: string;
  intent: string;
  status: string;
  timeline: ExplanationTimeline;
  reasoningGraph: {
    nodes: ExplanationNode[];
    edges: ExplanationEdge[];
    criticalPathNodeIds: string[];
  };
  delegations: ExplanationDelegation[];
  activeDecision?: ExplanationDecision;
  cognitiveEvolution: CognitiveEvolutionSummary;
  predictability: PredictabilitySummary;
}

