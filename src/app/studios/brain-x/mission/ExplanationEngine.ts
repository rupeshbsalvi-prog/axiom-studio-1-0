// ----------------------------------------------------
// ExplanationEngine.ts — Brain X Explanation Derivation Engine
//
// Location: src/app/studios/brain-x/mission/
// Layer:    Explainability (NOT platform, NOT UI)
// Status:   Active (Phase 8)
//
// All functions are pure mappings. No side effects.
// ----------------------------------------------------

import type { Mission, CognitiveEntry, Objective } from "./MissionTypes";
import type { ExplanationContractV1, ExplanationNode, ExplanationEdge, ExplanationDelegation, ExplanationDecision } from "./ExplanationContract";
import { findCriticalPath } from "./ReasoningGraphEngine";

/**
 * Derives an ExplanationContractV1 from a raw Mission and global memory state.
 * Enforces the UI Invariant: UI elements must only render derived explanation data.
 */
export function deriveExplanation(
  mission: Mission,
  globalMemory: CognitiveEntry[] = []
): ExplanationContractV1 {
  // 1. Derive Timeline
  const currentStage = mapStatusToStage(mission.status);
  const { completedStages, pendingStages } = getTimelineStages(mission.status);
  const durationMs = mission.completedAt
    ? mission.completedAt - mission.createdAt
    : Date.now() - mission.createdAt;

  // 2. Derive Reasoning Graph & Critical Path
  const criticalPathNodeIds = findCriticalPath(mission.reasoningGraph);
  const explanationNodes: ExplanationNode[] = mission.reasoningGraph.nodes.map((node) => {
    const objective = mission.objectives.find((obj) => obj.id === node.objectiveId);
    return {
      id: node.id,
      label: objective
        ? `${node.type.toUpperCase()}: ${objective.description}`
        : `${node.type.toUpperCase()}: ${node.id}`,
      type: node.type,
      status: node.status,
      rationale: node.rationale || `Reasoning node for objective ${node.objectiveId}`,
      objectiveDescription: objective?.description,
    };
  });

  const explanationEdges: ExplanationEdge[] = mission.reasoningGraph.edges.map((edge) => ({
    from: edge.from,
    to: edge.to,
    relationship: edge.relationship,
    rationale: edge.rationale || `Edge relationship: ${edge.relationship}`,
  }));

  // 3. Derive Delegations
  const explanationDelegations: ExplanationDelegation[] = mission.delegations.map((del) => {
    let progressPercent = 0;
    switch (del.status) {
      case "sent":
        progressPercent = 25;
        break;
      case "acknowledged":
        progressPercent = 50;
        break;
      case "completed":
      case "failed":
      case "rejected":
        progressPercent = 100;
        break;
    }

    const payloadSummary = del.payload
      ? typeof del.payload === "string"
        ? del.payload
        : JSON.stringify(del.payload).slice(0, 80)
      : "No payload";

    const expectedOutputSummary = del.expectedOutput
      ? `${del.expectedOutput.schema} (${del.expectedOutput.validationRules.join(", ")})`
      : "No contract";

    return {
      id: del.id,
      targetStudio: del.targetStudio,
      status: del.status,
      payloadSummary,
      expectedOutputSummary,
      progressPercent,
      validationPassed: del.validationPassed,
    };
  });

  // 4. Derive Active Decision
  const activeDecision = mission.decisions.find((dec) => dec.resolvedAt === undefined);
  const explanationDecision: ExplanationDecision | undefined = activeDecision
    ? {
        id: activeDecision.id,
        question: activeDecision.question,
        options: activeDecision.options || [],
        recommendation: activeDecision.recommendation || "No recommendation available",
        confidence: activeDecision.confidence ?? 0.5,
        rationale: activeDecision.rationale || "Decision explanation pending",
      }
    : undefined;

  // 5. Derive Cognitive Evolution
  const allCognitive = [...mission.cognitiveRecord, ...globalMemory];
  const observationsCount = allCognitive.filter((c) => c.stage === "observation").length;
  const learningsCount = allCognitive.filter((c) => c.stage === "learning").length;
  const knowledgeCount = allCognitive.filter((c) => c.stage === "knowledge").length;

  const recentReflections = [...mission.reflections]
    .sort((a, b) => b.timestamp - a.timestamp)
    .map((ref) => ({
      type: ref.type,
      content: ref.content,
      timestamp: ref.timestamp,
    }));

  const promotedLearnings = mission.cognitiveRecord
    .filter((c) => c.stage === "learning")
    .map((c) => ({
      content: c.content,
      confidence: c.confidence,
    }));

  const promotedKnowledge = mission.cognitiveRecord
    .filter((c) => c.stage === "knowledge")
    .map((c) => ({
      content: c.content,
      confidence: c.confidence,
    }));

  // 6. Derive Predictability (What happens next?)
  const predictability = derivePredictability(mission, explanationDecision);

  return {
    missionId: mission.id,
    title: mission.title,
    intent: mission.intent,
    status: mission.status,
    timeline: {
      currentStage,
      completedStages,
      pendingStages,
      durationMs,
      completedAt: mission.completedAt,
    },
    reasoningGraph: {
      nodes: explanationNodes,
      edges: explanationEdges,
      criticalPathNodeIds,
    },
    delegations: explanationDelegations,
    activeDecision: explanationDecision,
    cognitiveEvolution: {
      observationsCount,
      learningsCount,
      knowledgeCount,
      recentReflections,
      promotedLearnings,
      promotedKnowledge,
    },
    predictability,
  };
}

function mapStatusToStage(status: string): string {
  switch (status) {
    case "created":
      return "Created";
    case "planning":
      return "Planning";
    case "active":
      return "Executing";
    case "paused":
      return "Paused";
    case "completing":
      return "Verifying";
    case "completed":
      return "Completed";
    case "failed":
      return "Failed";
    case "abandoned":
      return "Abandoned";
    default:
      return "Unknown";
  }
}

function getTimelineStages(status: string): { completedStages: string[]; pendingStages: string[] } {
  const allStages = ["Created", "Planning", "Executing", "Verifying", "Completed"];
  const current = mapStatusToStage(status);
  const currentIndex = allStages.indexOf(current);

  if (currentIndex === -1) {
    // paused, failed, abandoned
    if (status === "paused") {
      return {
        completedStages: ["Created", "Planning"],
        pendingStages: ["Executing", "Verifying", "Completed"],
      };
    }
    return {
      completedStages: ["Created", "Planning"],
      pendingStages: [],
    };
  }

  return {
    completedStages: allStages.slice(0, currentIndex),
    pendingStages: allStages.slice(currentIndex + 1),
  };
}

function derivePredictability(
  mission: Mission,
  activeDecision?: ExplanationDecision
): { predictedNextAction: string; confidence: number; rationale: string } {
  const status = mission.status;

  if (status === "created") {
    return {
      predictedNextAction: "Transition to Planning stage and decompose intent into Objectives",
      confidence: 0.95,
      rationale: "The mission has been registered. The reasoning engine must now decompose the verbatim user intent into structured objectives.",
    };
  }

  if (status === "planning") {
    return {
      predictedNextAction: "Construct Reasoning Graph and identify executable nodes",
      confidence: 0.90,
      rationale: "Brain X is analyzing dependencies and topological order to construct the execution plan.",
    };
  }

  if (status === "paused" || activeDecision) {
    return {
      predictedNextAction: `User resolution of decision regarding: "${activeDecision?.question || "pending choice"}"`,
      confidence: 1.0,
      rationale: "The execution path is blocked until the user resolves the active decision.",
    };
  }

  if (status === "active") {
    // Check for active delegations
    const activeDelegation = mission.delegations.find(
      (del) => del.status === "sent" || del.status === "acknowledged"
    );
    if (activeDelegation) {
      return {
        predictedNextAction: `Await result validation from Studio: "${activeDelegation.targetStudio}"`,
        confidence: 0.85,
        rationale: `A task has been delegated to ${activeDelegation.targetStudio}. Brain X is awaiting the output contract fulfillment.`,
      };
    }

    // Check for pending/executable nodes
    const pendingNodes = mission.reasoningGraph.nodes.filter((n) => n.status === "pending");
    if (pendingNodes.length > 0) {
      return {
        predictedNextAction: "Evaluate next executable nodes in topological sequence",
        confidence: 0.80,
        rationale: "Some graph nodes are still pending execution. Brain X will evaluate which nodes can run next based on satisfied dependencies.",
      };
    }

    return {
      predictedNextAction: "Evaluate outcome criteria and verify execution completeness",
      confidence: 0.85,
      rationale: "All graph nodes have executed. Brain X will now verify success conditions to see if outcome criteria are met.",
    };
  }

  if (status === "completing") {
    return {
      predictedNextAction: "Consolidate learning reflections and transition to Completed",
      confidence: 0.95,
      rationale: "Objectives are satisfied. Running final judgment and reflection to promote cognitive entries.",
    };
  }

  if (status === "completed") {
    return {
      predictedNextAction: "Mission completed successfully. Awaiting new instructions.",
      confidence: 1.0,
      rationale: "Outcome criteria have been fully met, and cognitive learnings are archived.",
    };
  }

  return {
    predictedNextAction: "Awaiting new instructions.",
    confidence: 1.0,
    rationale: "The current mission has terminated.",
  };
}
