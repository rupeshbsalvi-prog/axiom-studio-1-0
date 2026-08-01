// ----------------------------------------------------
// MissionArchitecture.test.ts — Brain X Mission Architecture v1.0 Tests
//
// Location: src/app/studios/brain-x/tests/
//
// Validates all engines against the frozen Mission Architecture spec.
// Tests are organized by engine, following the implementation order.
//
// Phase 1: MissionTypes — structural validation
// Phase 2: ReasoningGraphEngine — graph operations
// Phase 3: MissionService — lifecycle and transitions
// Phase 4: DelegationEngine — delegation routing and validation
// Phase 5: CognitivePromotionEngine — evidence-based promotion
// ----------------------------------------------------

import { describe, it, expect } from "vitest";
import {
  PROMOTION_CONFIDENCE_THRESHOLDS,
  PROMOTION_EVIDENCE_MINIMUM,
  BRAIN_X_MISSION_INITIAL_STATE,
  generateId,
} from "../mission/MissionTypes";
import type { BrainXMissionStateData, OutcomeDefinition } from "../mission/MissionTypes";

import {
  createReasoningGraph,
  addNode,
  addEdge,
  updateNodeStatus,
  topologicalSort,
  findExecutableNodes,
  findCriticalPath,
  findAlternatives,
  findVerifiers,
  hasCycle,
  graphStats,
  isGraphComplete,
} from "../mission/ReasoningGraphEngine";

import {
  createProgram,
  createMission,
  transitionMissionStatus,
  setFocusMission,
  addObjective,
  updateObjectiveStatus,
  addDecision,
  resolveDecision,
  addObservation,
  addJudgment,
  addReflection,
  evaluateOutcome,
} from "../mission/MissionService";

import {
  createDelegation,
  acknowledgeDelegation,
  completeDelegation,
  failDelegation,
  getActiveDelegations,
  getFailedValidations,
  validateOutput,
} from "../mission/DelegationEngine";

import {
  addCognitiveObservation,
  addEvidence,
  attemptPromotion,
  consolidateMissionCognition,
  getEntriesByStage,
  cognitiveStageStats,
  findRelevantMemory,
} from "../mission/CognitivePromotionEngine";

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

function emptyState(): BrainXMissionStateData {
  return { ...BRAIN_X_MISSION_INITIAL_STATE };
}

const SAMPLE_OUTCOME: OutcomeDefinition = {
  successCriteria: ["deliverable-a", "deliverable-b"],
  acceptanceCriteria: ["user-approved"],
  completionCondition: "campaign-live",
};

// ─────────────────────────────────────────────────────────────────────────────
// PHASE 1 — MissionTypes
// ─────────────────────────────────────────────────────────────────────────────

describe("MissionTypes", () => {
  it("BRAIN_X_MISSION_INITIAL_STATE has correct shape", () => {
    const s = BRAIN_X_MISSION_INITIAL_STATE;
    expect(s.programs).toEqual([]);
    expect(s.missions).toEqual([]);
    expect(s.focusMissionId).toBeNull();
    expect(s.globalMemory).toEqual([]);
  });

  it("generateId produces unique ids with the correct prefix", () => {
    const a = generateId("mission");
    const b = generateId("mission");
    expect(a).toMatch(/^mission-/);
    expect(b).toMatch(/^mission-/);
    expect(a).not.toBe(b);
  });

  it("PROMOTION_EVIDENCE_MINIMUM enforces evidence chain minimums", () => {
    expect(PROMOTION_EVIDENCE_MINIMUM.observation).toBe(3);
    expect(PROMOTION_EVIDENCE_MINIMUM.learning).toBe(2);
    expect(PROMOTION_EVIDENCE_MINIMUM.knowledge).toBe(2);
  });

  it("PROMOTION_CONFIDENCE_THRESHOLDS are ordered correctly", () => {
    expect(PROMOTION_CONFIDENCE_THRESHOLDS.observation).toBeLessThan(
      PROMOTION_CONFIDENCE_THRESHOLDS.learning,
    );
    expect(PROMOTION_CONFIDENCE_THRESHOLDS.learning).toBeLessThan(
      PROMOTION_CONFIDENCE_THRESHOLDS.knowledge,
    );
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// PHASE 2 — ReasoningGraphEngine
// ─────────────────────────────────────────────────────────────────────────────

describe("ReasoningGraphEngine", () => {
  describe("createReasoningGraph", () => {
    it("returns an empty graph", () => {
      const g = createReasoningGraph();
      expect(g.nodes).toEqual([]);
      expect(g.edges).toEqual([]);
    });
  });

  describe("addNode", () => {
    it("adds a node in pending status", () => {
      const g = addNode(createReasoningGraph(), "obj-1", "task", "planning rationale");
      expect(g.nodes).toHaveLength(1);
      expect(g.nodes[0].status).toBe("pending");
      expect(g.nodes[0].objectiveId).toBe("obj-1");
      expect(g.nodes[0].rationale).toBe("planning rationale");
    });

    it("is immutable — original graph unchanged", () => {
      const original = createReasoningGraph();
      addNode(original, "obj-1", "task");
      expect(original.nodes).toHaveLength(0);
    });
  });

  describe("addEdge", () => {
    it("adds a typed edge between nodes", () => {
      let g = createReasoningGraph();
      g = addNode(g, "obj-1", "task");
      g = addNode(g, "obj-1", "delegation");
      const [n1, n2] = g.nodes;
      g = addEdge(g, n1.id, n2.id, "depends-on", "must plan before delegating");
      expect(g.edges).toHaveLength(1);
      expect(g.edges[0].relationship).toBe("depends-on");
      expect(g.edges[0].rationale).toBe("must plan before delegating");
    });

    it("throws on self-loop", () => {
      let g = addNode(createReasoningGraph(), "obj-1", "task");
      const id = g.nodes[0].id;
      expect(() => addEdge(g, id, id, "depends-on")).toThrow("self-loop");
    });

    it("throws when source node does not exist", () => {
      let g = addNode(createReasoningGraph(), "obj-1", "task");
      expect(() => addEdge(g, "nonexistent", g.nodes[0].id, "enables")).toThrow("not found");
    });
  });

  describe("topologicalSort", () => {
    it("returns nodes in dependency order", () => {
      let g = createReasoningGraph();
      g = addNode(g, "obj-1", "task");            // A — first
      g = addNode(g, "obj-1", "delegation");      // B — depends on A
      g = addNode(g, "obj-1", "judgment");        // C — depends on B
      const [A, B, C] = g.nodes;
      g = addEdge(g, A.id, B.id, "depends-on");
      g = addEdge(g, B.id, C.id, "depends-on");
      const sorted = topologicalSort(g);
      expect(sorted[0].id).toBe(A.id);
      expect(sorted[1].id).toBe(B.id);
      expect(sorted[2].id).toBe(C.id);
    });

    it("throws on cycle", () => {
      let g = createReasoningGraph();
      g = addNode(g, "obj-1", "task");
      g = addNode(g, "obj-1", "task");
      const [A, B] = g.nodes;
      g = addEdge(g, A.id, B.id, "depends-on");
      g = addEdge(g, B.id, A.id, "depends-on");
      expect(() => topologicalSort(g)).toThrow("cycle");
    });
  });

  describe("findExecutableNodes", () => {
    it("returns only pending nodes with all predecessors completed", () => {
      let g = createReasoningGraph();
      g = addNode(g, "obj-1", "task");
      g = addNode(g, "obj-1", "delegation");
      const [A, B] = g.nodes;
      g = addEdge(g, A.id, B.id, "depends-on");

      // Initially only A is executable
      let executable = findExecutableNodes(g);
      expect(executable.map((n) => n.id)).toContain(A.id);
      expect(executable.map((n) => n.id)).not.toContain(B.id);

      // After completing A, B becomes executable
      g = updateNodeStatus(g, A.id, "completed");
      executable = findExecutableNodes(g);
      expect(executable.map((n) => n.id)).toContain(B.id);
    });
  });

  describe("findCriticalPath", () => {
    it("returns the longest dependency chain", () => {
      let g = createReasoningGraph();
      g = addNode(g, "obj-1", "task");
      g = addNode(g, "obj-1", "task");
      g = addNode(g, "obj-1", "task");
      const [A, B, C] = g.nodes;
      g = addEdge(g, A.id, B.id, "depends-on");
      g = addEdge(g, B.id, C.id, "depends-on");
      const path = findCriticalPath(g);
      expect(path).toEqual([A.id, B.id, C.id]);
    });
  });

  describe("findAlternatives and findVerifiers", () => {
    it("finds alternative nodes", () => {
      let g = createReasoningGraph();
      g = addNode(g, "obj-1", "task");
      g = addNode(g, "obj-1", "task");
      const [A, B] = g.nodes;
      g = addEdge(g, A.id, B.id, "alternative");
      const alts = findAlternatives(g, A.id);
      expect(alts.map((n) => n.id)).toContain(B.id);
    });

    it("finds verifier nodes", () => {
      let g = createReasoningGraph();
      g = addNode(g, "obj-1", "task");
      g = addNode(g, "obj-1", "judgment");
      const [A, B] = g.nodes;
      g = addEdge(g, B.id, A.id, "verifies");
      const verifiers = findVerifiers(g, A.id);
      expect(verifiers.map((n) => n.id)).toContain(B.id);
    });
  });

  describe("graphStats and isGraphComplete", () => {
    it("counts nodes by status", () => {
      let g = createReasoningGraph();
      g = addNode(g, "obj-1", "task");
      g = addNode(g, "obj-1", "task");
      g = updateNodeStatus(g, g.nodes[0].id, "completed");
      const stats = graphStats(g);
      expect(stats.total).toBe(2);
      expect(stats.completed).toBe(1);
      expect(stats.pending).toBe(1);
      expect(stats.completionPercent).toBe(50);
    });

    it("isGraphComplete returns true when all nodes are completed or skipped", () => {
      let g = createReasoningGraph();
      g = addNode(g, "obj-1", "task");
      g = addNode(g, "obj-1", "task");
      g = updateNodeStatus(g, g.nodes[0].id, "completed");
      g = updateNodeStatus(g, g.nodes[1].id, "skipped");
      expect(isGraphComplete(g)).toBe(true);
    });
  });

  describe("hasCycle", () => {
    it("returns false for acyclic graph", () => {
      let g = createReasoningGraph();
      g = addNode(g, "obj-1", "task");
      g = addNode(g, "obj-1", "task");
      g = addEdge(g, g.nodes[0].id, g.nodes[1].id, "depends-on");
      expect(hasCycle(g)).toBe(false);
    });

    it("returns true for cyclic graph", () => {
      let g = createReasoningGraph();
      g = addNode(g, "obj-1", "task");
      g = addNode(g, "obj-1", "task");
      const [A, B] = g.nodes;
      g = addEdge(g, A.id, B.id, "depends-on");
      g = addEdge(g, B.id, A.id, "depends-on");
      expect(hasCycle(g)).toBe(true);
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// PHASE 3 — MissionService
// ─────────────────────────────────────────────────────────────────────────────

describe("MissionService", () => {
  describe("createProgram", () => {
    it("creates a Program with the given vision", () => {
      const { program, state } = createProgram(emptyState(), "Build Axiom Studio");
      expect(program.vision).toBe("Build Axiom Studio");
      expect(state.programs).toHaveLength(1);
    });

    it("derives title from vision when no title provided", () => {
      const { program } = createProgram(emptyState(), "Build Axiom Studio");
      expect(program.title).toBeTruthy();
    });
  });

  describe("createMission", () => {
    it("creates a Mission with status 'created'", () => {
      const { mission, state } = createMission(emptyState(), "Launch campaign", SAMPLE_OUTCOME);
      expect(mission.status).toBe("created");
      expect(mission.intent).toBe("Launch campaign");
      expect(mission.outcome).toEqual(SAMPLE_OUTCOME);
      expect(state.missions).toHaveLength(1);
    });

    it("sets focusMissionId to first Mission automatically", () => {
      const { state } = createMission(emptyState(), "First mission", SAMPLE_OUTCOME);
      expect(state.focusMissionId).toBe(state.missions[0].id);
    });

    it("links Mission to Program when programId provided", () => {
      let state = emptyState();
      const { program, state: s1 } = createProgram(state, "Build Axiom");
      state = s1;
      const { mission, state: s2 } = createMission(state, "Launch campaign", SAMPLE_OUTCOME, program.id);
      state = s2;
      const prog = state.programs.find((p) => p.id === program.id)!;
      expect(prog.missionIds).toContain(mission.id);
    });

    it("preserves raw intent verbatim", () => {
      const intent = "I need a launch campaign for the Axiom announcement!";
      const { mission } = createMission(emptyState(), intent, SAMPLE_OUTCOME);
      expect(mission.intent).toBe(intent);
    });
  });

  describe("transitionMissionStatus", () => {
    it("allows valid transitions", () => {
      let { state, mission } = createMission(emptyState(), "test", SAMPLE_OUTCOME);
      state = transitionMissionStatus(state, mission.id, "planning");
      state = transitionMissionStatus(state, mission.id, "active");
      state = transitionMissionStatus(state, mission.id, "completing");
      state = transitionMissionStatus(state, mission.id, "completed");
      expect(state.missions[0].status).toBe("completed");
      expect(state.missions[0].completedAt).toBeDefined();
    });

    it("rejects invalid transitions", () => {
      const { state, mission } = createMission(emptyState(), "test", SAMPLE_OUTCOME);
      expect(() => transitionMissionStatus(state, mission.id, "completed")).toThrow(
        "invalid status transition",
      );
    });

    it("throws when Mission does not exist", () => {
      expect(() =>
        transitionMissionStatus(emptyState(), "nonexistent-id", "planning"),
      ).toThrow("not found");
    });
  });

  describe("setFocusMission", () => {
    it("sets focusMissionId correctly", () => {
      let state = emptyState();
      const { mission: m1, state: s1 } = createMission(state, "A", SAMPLE_OUTCOME);
      const { mission: m2, state: s2 } = createMission(s1, "B", SAMPLE_OUTCOME);
      state = setFocusMission(s2, m2.id);
      expect(state.focusMissionId).toBe(m2.id);
    });
  });

  describe("addObjective", () => {
    it("adds an Objective in pending status", () => {
      const { state, mission } = createMission(emptyState(), "test", SAMPLE_OUTCOME);
      const { state: s2 } = addObjective(state, mission.id, "Define brief", ["brief.pdf"]);
      expect(s2.missions[0].objectives).toHaveLength(1);
      expect(s2.missions[0].objectives[0].status).toBe("pending");
    });
  });

  describe("addDecision and resolveDecision", () => {
    it("pauses Mission on Decision and resumes when resolved", () => {
      let state = emptyState();
      const { state: s1, mission } = createMission(state, "test", SAMPLE_OUTCOME);
      state = transitionMissionStatus(s1, mission.id, "planning");
      state = transitionMissionStatus(state, mission.id, "active");

      const { state: s2, decisionId } = addDecision(
        state,
        mission.id,
        "obj-1",
        "Approve tone?",
        ["professional", "casual"],
        "professional",
        0.82,
        "Based on 3 prior Missions",
      );
      expect(s2.missions[0].status).toBe("paused");

      const s3 = resolveDecision(s2, mission.id, decisionId, "professional");
      expect(s3.missions[0].status).toBe("active");
      expect(s3.missions[0].decisions[0].userChoice).toBe("professional");
      expect(s3.missions[0].decisions[0].resolvedAt).toBeDefined();
    });
  });

  describe("addObservation", () => {
    it("records an Observation on the Mission", () => {
      const { state, mission } = createMission(emptyState(), "test", SAMPLE_OUTCOME);
      const { state: s2 } = addObservation(
        state,
        mission.id,
        "axiomAi",
        "Token usage spike detected",
        "minor",
      );
      expect(s2.missions[0].observations).toHaveLength(1);
      expect(s2.missions[0].observations[0].planImpact).toBe("minor");
    });
  });

  describe("addJudgment", () => {
    it("records a JudgmentResult on the Mission", () => {
      const { state, mission } = createMission(emptyState(), "test", SAMPLE_OUTCOME);
      const { state: s2 } = addJudgment(
        state,
        mission.id,
        "del-001",
        "accept",
        0.91,
        "Output matches contract",
        "continue",
      );
      expect(s2.missions[0].judgments).toHaveLength(1);
      expect(s2.missions[0].judgments[0].verdict).toBe("accept");
      expect(s2.missions[0].judgments[0].action).toBe("continue");
    });
  });

  describe("addReflection", () => {
    it("records a Reflection on the Mission", () => {
      const { state, mission } = createMission(emptyState(), "test", SAMPLE_OUTCOME);
      const { state: s2 } = addReflection(
        state,
        mission.id,
        "learning",
        "Dark UI preferred in creative context",
        ["creative-production", "design"],
      );
      expect(s2.missions[0].reflections).toHaveLength(1);
      expect(s2.missions[0].reflections[0].scope).toContain("creative-production");
    });
  });

  describe("evaluateOutcome", () => {
    it("returns isComplete true when all criteria are satisfied", () => {
      const { mission } = createMission(emptyState(), "test", SAMPLE_OUTCOME);
      const result = evaluateOutcome(mission, [
        "deliverable-a",
        "deliverable-b",
        "user-approved",
        "campaign-live",
      ]);
      expect(result.isComplete).toBe(true);
    });

    it("returns isComplete false when criteria are missing", () => {
      const { mission } = createMission(emptyState(), "test", SAMPLE_OUTCOME);
      const result = evaluateOutcome(mission, ["deliverable-a"]);
      expect(result.isComplete).toBe(false);
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// PHASE 4 — DelegationEngine
// ─────────────────────────────────────────────────────────────────────────────

describe("DelegationEngine", () => {
  function missionWithDelegation() {
    const { state: s1, mission } = createMission(emptyState(), "test", SAMPLE_OUTCOME);
    const { state: s2, delegation } = createDelegation(
      s1,
      mission.id,
      "obj-1",
      "imagine-x",
      { prompt: "hero image" },
      { schema: "png-1920x1080", validationRules: ["size<5MB"] },
    );
    return { state: s2, mission, delegation };
  }

  describe("createDelegation", () => {
    it("creates a Delegation with status 'sent'", () => {
      const { delegation } = missionWithDelegation();
      expect(delegation.status).toBe("sent");
      expect(delegation.targetStudio).toBe("imagine-x");
      expect(delegation.expectedOutput.schema).toBe("png-1920x1080");
    });

    it("throws when Mission does not exist", () => {
      expect(() =>
        createDelegation(emptyState(), "nonexistent", "obj-1", "imagine-x", {}, {
          schema: "png",
          validationRules: [],
        }),
      ).toThrow("not found");
    });
  });

  describe("acknowledgeDelegation", () => {
    it("transitions status to 'acknowledged'", () => {
      const { state, delegation } = missionWithDelegation();
      const s2 = acknowledgeDelegation(state, delegation.id);
      const del = s2.missions[0].delegations[0];
      expect(del.status).toBe("acknowledged");
    });
  });

  describe("completeDelegation", () => {
    it("marks delegation completed with result and validation", () => {
      const { state, delegation } = missionWithDelegation();
      const result = { url: "https://cdn.example.com/hero.png", sizeKB: 2048 };
      const s2 = completeDelegation(state, delegation.id, result);
      const del = s2.missions[0].delegations[0];
      expect(del.status).toBe("completed");
      expect(del.result).toEqual(result);
      expect(del.validationPassed).toBe(true);
    });

    it("marks validationPassed false for null result", () => {
      const { state, delegation } = missionWithDelegation();
      const s2 = completeDelegation(state, delegation.id, null);
      expect(s2.missions[0].delegations[0].validationPassed).toBe(false);
    });
  });

  describe("failDelegation", () => {
    it("marks delegation as failed", () => {
      const { state, delegation } = missionWithDelegation();
      const s2 = failDelegation(state, delegation.id);
      expect(s2.missions[0].delegations[0].status).toBe("failed");
    });
  });

  describe("getActiveDelegations", () => {
    it("returns only sent or acknowledged delegations", () => {
      const { state, delegation } = missionWithDelegation();
      expect(getActiveDelegations(state)).toHaveLength(1);
      const s2 = completeDelegation(state, delegation.id, { ok: true });
      expect(getActiveDelegations(s2)).toHaveLength(0);
    });
  });

  describe("getFailedValidations", () => {
    it("returns delegations that completed but failed validation", () => {
      const { state, delegation } = missionWithDelegation();
      const s2 = completeDelegation(state, delegation.id, null);
      expect(getFailedValidations(s2)).toHaveLength(1);
    });
  });

  describe("validateOutput", () => {
    it("returns false for null result", () => {
      expect(validateOutput(null, { schema: "png", validationRules: [] })).toBe(false);
    });

    it("returns true for valid result with schema", () => {
      expect(validateOutput({ url: "img.png" }, { schema: "png", validationRules: [] })).toBe(true);
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// PHASE 5 — CognitivePromotionEngine
// ─────────────────────────────────────────────────────────────────────────────

describe("CognitivePromotionEngine", () => {
  function missionState() {
    const { state, mission } = createMission(emptyState(), "test", SAMPLE_OUTCOME);
    return { state, missionId: mission.id };
  }

  describe("addCognitiveObservation", () => {
    it("creates an observation-stage entry", () => {
      const { state, missionId } = missionState();
      const { state: s2 } = addCognitiveObservation(state, missionId, "User prefers dark UI");
      const entries = getEntriesByStage(s2, missionId, "observation");
      expect(entries).toHaveLength(1);
      expect(entries[0].content).toBe("User prefers dark UI");
      expect(entries[0].stage).toBe("observation");
    });
  });

  describe("addEvidence", () => {
    it("increases confidence and evidence count", () => {
      const { state, missionId } = missionState();
      const { state: s1, entryId: e1 } = addCognitiveObservation(state, missionId, "obs A");
      const { state: s2, entryId: e2 } = addCognitiveObservation(s1, missionId, "obs B");
      const s3 = addEvidence(s2, missionId, e1, e2);
      const entry = s3.missions[0].cognitiveRecord.find((e) => e.id === e1)!;
      expect(entry.evidenceIds).toContain(e2);
      expect(entry.confidence).toBeGreaterThan(0.30);
    });

    it("is idempotent — same evidence not added twice", () => {
      const { state, missionId } = missionState();
      const { state: s1, entryId: e1 } = addCognitiveObservation(state, missionId, "obs A");
      const { state: s2, entryId: e2 } = addCognitiveObservation(s1, missionId, "obs B");
      const s3 = addEvidence(s2, missionId, e1, e2);
      const s4 = addEvidence(s3, missionId, e1, e2);
      const entry = s4.missions[0].cognitiveRecord.find((e) => e.id === e1)!;
      expect(entry.evidenceIds.filter((id) => id === e2)).toHaveLength(1);
    });
  });

  describe("attemptPromotion", () => {
    it("does NOT promote observation without sufficient evidence", () => {
      const { state, missionId } = missionState();
      const { state: s1, entryId } = addCognitiveObservation(state, missionId, "obs A", 0.50);
      const result = attemptPromotion(s1, missionId, entryId);
      expect(result.promoted).toBe(false);
    });

    it("promotes observation to learning when evidence + confidence thresholds are met", () => {
      let { state, missionId } = missionState();

      // Add the target observation with confidence above threshold
      const { state: s1, entryId: target } = addCognitiveObservation(
        state, missionId, "User prefers dark UI", 0.45,
      );
      state = s1;

      // Add enough corroborating evidence (minimum 3)
      const { state: s2, entryId: e2 } = addCognitiveObservation(state, missionId, "corr 1", 0.40);
      const { state: s3, entryId: e3 } = addCognitiveObservation(s2, missionId, "corr 2", 0.40);
      const { state: s4, entryId: e4 } = addCognitiveObservation(s3, missionId, "corr 3", 0.40);
      state = addEvidence(s4, missionId, target, e2);
      state = addEvidence(state, missionId, target, e3);
      state = addEvidence(state, missionId, target, e4);

      const result = attemptPromotion(state, missionId, target);
      expect(result.promoted).toBe(true);
      expect(result.newStage).toBe("learning");
    });

    it("does not promote memory (terminal stage)", () => {
      // Memory promotion should always return promoted: false
      const { state, missionId } = missionState();
      const { state: s1, entryId } = addCognitiveObservation(state, missionId, "obs", 0.99);
      // Manually set stage to memory via the record (testing terminal guard)
      const s2 = {
        ...s1,
        missions: s1.missions.map((m) =>
          m.id === missionId
            ? {
                ...m,
                cognitiveRecord: m.cognitiveRecord.map((e) =>
                  e.id === entryId ? { ...e, stage: "memory" as const } : e,
                ),
              }
            : m,
        ),
      };
      const result = attemptPromotion(s2, missionId, entryId);
      expect(result.promoted).toBe(false);
    });
  });

  describe("cognitiveStageStats", () => {
    it("counts entries by stage", () => {
      const { state, missionId } = missionState();
      const { state: s1 } = addCognitiveObservation(state, missionId, "obs 1");
      const { state: s2 } = addCognitiveObservation(s1, missionId, "obs 2");
      const stats = cognitiveStageStats(s2, missionId);
      expect(stats.observation).toBe(2);
      expect(stats.learning).toBe(0);
      expect(stats.knowledge).toBe(0);
      expect(stats.memory).toBe(0);
    });
  });

  describe("findRelevantMemory", () => {
    it("returns memory entries matching a topic keyword", () => {
      const { state, missionId } = missionState();
      const { state: s1, entryId } = addCognitiveObservation(state, missionId, "dark UI preferred", 0.95);
      // Manually promote to memory for test
      const s2 = {
        ...s1,
        missions: s1.missions.map((m) =>
          m.id === missionId
            ? {
                ...m,
                cognitiveRecord: m.cognitiveRecord.map((e) =>
                  e.id === entryId ? { ...e, stage: "memory" as const } : e,
                ),
              }
            : m,
        ),
        globalMemory: [
          ...s1.globalMemory,
          { ...s1.missions[0].cognitiveRecord[0], id: entryId, stage: "memory" as const },
        ],
      };
      const results = findRelevantMemory(s2, "dark UI");
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].content).toContain("dark UI");
    });
  });
});
