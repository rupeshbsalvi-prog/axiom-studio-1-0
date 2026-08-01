// ----------------------------------------------------
// MissionTypes.ts — Brain X Mission Architecture v1.0
//
// Location: src/app/studios/brain-x/mission/
// Status:   FROZEN — 2026-06-21
//
// This file is the Brain X equivalent of the Platform Constitution.
// All downstream files (engines, services, state, UI, tests) are
// consumers of these types. They do not redefine concepts.
//
// Dependency direction:
//   MissionTypes
//     ↓
//   ReasoningGraphEngine / MissionService / DelegationEngine / CognitivePromotionEngine
//     ↓
//   BrainXState / BrainXStudio / BrainXPanel
//
// This file has ZERO imports. It is the root of the Brain X type graph.
// ----------------------------------------------------

// ─────────────────────────────────────────────────────────────────────────────
// PROGRAM
// The long-lived human endeavor. Organizational only — does not execute.
// ─────────────────────────────────────────────────────────────────────────────

export interface Program {
  id: string;
  title: string;
  vision: string;              // the long-lived human intention
  missionIds: string[];        // ordered: chronological
  createdAt: number;
  updatedAt: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// OUTCOME DEFINITION
// Brain X knows what it is doing. OutcomeDefinition makes explicit when
// it has succeeded. A Mission finishes because its outcome is satisfied —
// not because every node in the ReasoningGraph has executed.
// ─────────────────────────────────────────────────────────────────────────────

export interface OutcomeDefinition {
  successCriteria: string[];         // what Brain X verifies automatically
  acceptanceCriteria: string[];      // what the user considers done
  completionCondition: string;       // single declarative statement of completion
}

// ─────────────────────────────────────────────────────────────────────────────
// MISSION
// The executable unit of intent. Everything operational belongs here.
// A Mission ends when its OutcomeDefinition is satisfied — not when
// the user stops talking.
// ─────────────────────────────────────────────────────────────────────────────

export type MissionStatus =
  | "created"      // intent captured, not yet planned
  | "planning"     // Brain X deriving objectives + reasoning graph
  | "active"       // delegations in flight, observations accumulating
  | "paused"       // waiting on human Decision
  | "completing"   // all objectives met, Judgment + Reflection in progress
  | "completed"    // OutcomeDefinition satisfied, cognitive record consolidated
  | "failed"
  | "abandoned";   // user cancelled

export interface Mission {
  id: string;
  programId?: string;          // optional — Missions may exist outside a Program
  title: string;               // Brain X derives — never user-named
  intent: string;              // raw human input, preserved verbatim
  outcome: OutcomeDefinition;  // explicit success definition
  status: MissionStatus;
  objectives: Objective[];
  reasoningGraph: ReasoningGraph;
  delegations: Delegation[];
  decisions: Decision[];
  observations: Observation[];
  judgments: JudgmentResult[];
  reflections: Reflection[];
  cognitiveRecord: CognitiveEntry[];
  createdAt: number;
  updatedAt: number;
  completedAt?: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// OBJECTIVE
// A structured decomposition of intent. Dependencies between Objectives
// are expressed as ReasoningEdges — not embedded fields.
// ─────────────────────────────────────────────────────────────────────────────

export type ObjectiveStatus =
  | "pending"
  | "active"
  | "blocked"
  | "completed"
  | "failed";

export interface Objective {
  id: string;
  description: string;
  deliverables: string[];
  assignedTo?: string;         // Studio id — EventBus routing only, never a direct import
  status: ObjectiveStatus;
}

// ─────────────────────────────────────────────────────────────────────────────
// REASONING GRAPH
// A first-class object — not a flat array. Brain X reasons about
// dependencies, uncertainty, alternatives, and verification.
// Execution is one output of reasoning, not the definition of it.
// ─────────────────────────────────────────────────────────────────────────────

export interface ReasoningGraph {
  nodes: ReasoningNode[];
  edges: ReasoningEdge[];
}

export type NodeType =
  | "task"
  | "decision"
  | "delegation"
  | "wait"
  | "observation"
  | "reflection"
  | "judgment";

export type NodeStatus =
  | "pending"
  | "active"
  | "completed"
  | "failed"
  | "skipped";

export interface ReasoningNode {
  id: string;
  objectiveId: string;
  type: NodeType;
  status: NodeStatus;
  rationale?: string;          // why Brain X placed this node in the graph
  output?: unknown;
}

export type EdgeRelationship =
  | "depends-on"               // standard prerequisite — from must complete before to
  | "blocks"                   // from actively prevents to from starting
  | "enables"                  // from makes to possible, but to is not mandatory
  | "alternative"              // either from or to satisfies the objective
  | "derived-from"             // to uses the output of from as its input
  | "verifies";                // from validates the output of to

export interface ReasoningEdge {
  from: string;                // ReasoningNode id
  to: string;                  // ReasoningNode id
  relationship: EdgeRelationship;
  rationale?: string;          // why this relationship exists
}

// ─────────────────────────────────────────────────────────────────────────────
// DELEGATION
// Brain X never performs work directly. It routes work to Studios via
// EventBus only. OutputContract defines what a valid response looks like
// before the delegation is sent.
// ─────────────────────────────────────────────────────────────────────────────

export type DelegationStatus =
  | "sent"
  | "acknowledged"
  | "completed"
  | "failed"
  | "rejected";

export interface OutputContract {
  schema: string;              // expected shape description
  validationRules: string[];   // conditions the result must satisfy
}

export interface Delegation {
  id: string;
  missionId: string;
  objectiveId: string;
  targetStudio: string;        // EventBus routing target — never a direct import
  payload: unknown;
  expectedOutput: OutputContract;
  status: DelegationStatus;
  sentAt: number;
  completedAt?: number;
  result?: unknown;
  validationPassed?: boolean;  // set by DelegationEngine after result arrives
}

// ─────────────────────────────────────────────────────────────────────────────
// DECISION
// Brain X explains before asking. Users receive a reasoned recommendation,
// not a blank question. Decisions block execution until resolved.
// ─────────────────────────────────────────────────────────────────────────────

export interface Decision {
  id: string;
  missionId: string;
  objectiveId: string;
  question: string;            // what Brain X needs resolved
  options?: string[];          // choices Brain X has identified
  recommendation?: string;     // Brain X's preferred option
  confidence?: number;         // 0–1 — how confident Brain X is
  rationale?: string;          // "I recommend Option B because..."
  userChoice?: string;         // resolved by user
  userReason?: string;         // optional — user's explanation
  resolvedAt?: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// OBSERVATION
// What Brain X noticed during execution. High-impact observations
// trigger a Judgment cycle.
// ─────────────────────────────────────────────────────────────────────────────

export type PlanImpact = "none" | "minor" | "major" | "mission-critical";

export interface Observation {
  id: string;
  missionId: string;
  timestamp: number;
  source: string;              // which Studio or event triggered this
  content: string;
  planImpact: PlanImpact;
}

// ─────────────────────────────────────────────────────────────────────────────
// JUDGMENT RESULT
// The sixth cognitive domain. Sits between Observation and Reflection.
// Answers: Is this good enough? Should I ask the user? Continue, adapt, or halt?
// Without Judgment, Reflection has too much responsibility.
// ─────────────────────────────────────────────────────────────────────────────

export type JudgmentVerdict = "accept" | "reject" | "escalate" | "defer";

export type JudgmentAction =
  | "continue"
  | "ask-user"
  | "adapt-plan"
  | "promote-to-knowledge"
  | "halt";

export interface JudgmentResult {
  id: string;
  missionId: string;
  timestamp: number;
  subject: string;             // what was judged (delegationId, observationId, etc.)
  verdict: JudgmentVerdict;
  confidence: number;          // 0–1
  rationale: string;
  action: JudgmentAction;
}

// ─────────────────────────────────────────────────────────────────────────────
// REFLECTION
// Post-execution analysis. Produces CognitiveEntries that may promote
// through the evidence chain.
// ─────────────────────────────────────────────────────────────────────────────

export interface Reflection {
  id: string;
  missionId: string;
  timestamp: number;
  type: "success" | "failure" | "learning" | "pattern";
  content: string;
  scope: string[];             // future Mission types this reflection applies to
}

// ─────────────────────────────────────────────────────────────────────────────
// COGNITIVE ENTRY
// Evidence-based promotion. Promotion requires accumulation —
// not a single trigger. Memory is the end of an evidence chain.
//
// Promotion path:
//   observation (×3 min, conf ≥ 0.40) → learning
//   learning    (×2 min, conf ≥ 0.72) → knowledge
//   knowledge   (×2 min, conf ≥ 0.91) → memory  (persists across Missions)
// ─────────────────────────────────────────────────────────────────────────────

export type CognitiveStage = "observation" | "learning" | "knowledge" | "memory";

export interface CognitiveEntry {
  id: string;
  stage: CognitiveStage;
  content: string;
  key?: string;                // semantic identifier (memory stage)
  value?: unknown;             // structured value (memory stage)
  confidence: number;          // 0–1, rises with corroborating evidence
  evidenceIds: string[];       // CognitiveEntry ids that support this entry
  promotionThreshold: number;  // minimum evidence count before promotion attempt
  derivedFrom: string;         // Mission id
  promotedFrom?: string;       // CognitiveEntry id this was promoted from
  timestamp: number;
}

// Confidence thresholds that must be reached before promotion to the next stage
export const PROMOTION_CONFIDENCE_THRESHOLDS = {
  observation: 0.40,           // can promote to learning
  learning:    0.72,           // can promote to knowledge
  knowledge:   0.91,           // can promote to memory
} as const;

// Minimum corroborating evidence count required at each stage
export const PROMOTION_EVIDENCE_MINIMUM = {
  observation: 3,              // 3 corroborating observations → candidate for learning
  learning:    2,              // 2 corroborating learnings → candidate for knowledge
  knowledge:   2,              // 2 corroborating knowledge entries → candidate for memory
} as const;

// ─────────────────────────────────────────────────────────────────────────────
// BRAIN X STATE DATA
// The complete state contract stored under brainX.* in StateService.
// StateService requires ZERO modification to hold this state.
// ─────────────────────────────────────────────────────────────────────────────

export interface BrainXMissionStateData {
  programs: Program[];
  missions: Mission[];
  focusMissionId: string | null;   // the Mission Brain X concentrates on
  globalMemory: CognitiveEntry[];  // stage = "memory", persists across Missions
}

export const BRAIN_X_MISSION_INITIAL_STATE: BrainXMissionStateData = {
  programs: [],
  missions: [],
  focusMissionId: null,
  globalMemory: [],
};

// ─────────────────────────────────────────────────────────────────────────────
// ID GENERATOR
// Shared across all engines. Stable format: <prefix>-<timestamp>-<random5>
// ─────────────────────────────────────────────────────────────────────────────

export function generateId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}
