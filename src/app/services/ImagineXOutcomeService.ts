import type {
  AxiomProjectDraft,
  ImagineXOutcomeRecordV1,
} from "../projects/projectDraft";
import type { ImagineXLearningAuthorityResolution } from "./ImagineXLearningAuthority";

const OUTCOME_CAP = 200;
const FOLLOW_UP_EDIT_CAP = 100;
const PREFERENCE_CANDIDATE_CAP = 100;
const RECOMMENDATION_INFLUENCE_CAP = 50;
const INFLUENCE_EVALUATION_DECISION_CAP = 50;

function canUseImagineXLearning(
  project: AxiomProjectDraft,
  authority?: ImagineXLearningAuthorityResolution,
): boolean {
  return Boolean(
    project.brain.learningControl?.enabled &&
    project.brain.learningControl.consent === "granted" &&
    (authority?.effectiveEnabled ?? true)
  );
}

function createId(prefix: string): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `${prefix}_${crypto.randomUUID()}`;
  }
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function summarizeImagineXInfluenceEvaluation(project: AxiomProjectDraft) {
  const ratedOutcomes = (project.brain.outcomes ?? []).filter(
    (outcome): outcome is ImagineXOutcomeRecordV1 & { rating: number } =>
      outcome.rating !== null &&
      Number.isInteger(outcome.rating) &&
      outcome.rating >= 1 &&
      outcome.rating <= 5
  );
  const summarize = (ratings: number[]) => {
    const ratingDistribution = [0, 0, 0, 0, 0];
    for (const rating of ratings) ratingDistribution[rating - 1] += 1;
    return {
      ratedOutcomeCount: ratings.length,
      averageRating: ratings.length > 0
        ? ratings.reduce((total, rating) => total + rating, 0) / ratings.length
        : null,
      ratingDistribution,
    };
  };
  const baseline = summarize(
    ratedOutcomes
      .filter((outcome) => !outcome.recommendationInfluence)
      .map((outcome) => outcome.rating)
  );
  const influenced = summarize(
    ratedOutcomes
      .filter((outcome) => Boolean(outcome.recommendationInfluence))
      .map((outcome) => outcome.rating)
  );
  const ratingsByProposal = new Map<
    string,
    { influences: string[]; ratings: number[] }
  >();
  for (const outcome of ratedOutcomes) {
    const attribution = outcome.recommendationInfluence;
    if (!attribution) continue;
    const existing = ratingsByProposal.get(attribution.proposalId);
    if (existing) {
      existing.ratings.push(outcome.rating);
    } else {
      ratingsByProposal.set(attribution.proposalId, {
        influences: [...attribution.influences],
        ratings: [outcome.rating],
      });
    }
  }
  const byInfluenceProposal = Array.from(
    ratingsByProposal,
    ([proposalId, { influences, ratings }]) => ({
      proposalId,
      influences,
      ...summarize(ratings),
    })
  ).sort((left, right) => left.proposalId.localeCompare(right.proposalId));

  return {
    contractVersion: "imagine-x-influence-evaluation.v1" as const,
    baseline,
    influenced,
    observedDifference:
      baseline.averageRating !== null && influenced.averageRating !== null
        ? influenced.averageRating - baseline.averageRating
        : null,
    byInfluenceProposal,
  };
}

export function recordImagineXInfluenceEvaluationDecision(
  project: AxiomProjectDraft,
  input: {
    proposalId: string;
    decision: "keep" | "rollback" | "inconclusive";
    rationale: string;
  }
): AxiomProjectDraft {
  if (
    !["keep", "rollback", "inconclusive"].includes(input.decision) ||
    project.brain.influenceEvaluationDecisions?.some(
      (record) => record.proposalId === input.proposalId
    )
  ) {
    return project;
  }
  const proposal = project.brain.recommendationInfluenceProposals?.find(
    (item) => item.id === input.proposalId
  );
  if (!proposal?.appliedAtUtc) return project;

  const evidence = summarizeImagineXInfluenceEvaluation(project);
  if (!evidence.byInfluenceProposal.some(
    (item) => item.proposalId === input.proposalId && item.ratedOutcomeCount > 0
  )) {
    return project;
  }

  const recordedAtUtc = new Date().toISOString();
  const record = {
    contractVersion: "imagine-x-influence-evaluation-decision.v1" as const,
    id: createId("imagine_x_evaluation_decision"),
    proposalId: input.proposalId,
    decision: input.decision,
    rationale: input.rationale.trim().slice(0, 1000) || null,
    recordedAtUtc,
    evidence,
  };
  return {
    ...project,
    manifest: { ...project.manifest, updatedAt: recordedAtUtc },
    brain: {
      ...project.brain,
      influenceEvaluationDecisions: [
        ...(project.brain.influenceEvaluationDecisions ?? []),
        record,
      ].slice(-INFLUENCE_EVALUATION_DECISION_CAP),
    },
  };
}

export function recordImagineXProposalOutcome(
  project: AxiomProjectDraft,
  input: {
    proposalId: string;
    studioId: string;
    intent: string;
    providerRoutes: ImagineXOutcomeRecordV1["providerRoutes"];
    status: ImagineXOutcomeRecordV1["status"];
    outputObjectCount: number;
    durationMs?: number | null;
    failure?: string | null;
    recommendationInfluence?: ImagineXOutcomeRecordV1["recommendationInfluence"];
  }
): AxiomProjectDraft {
  const outcome: ImagineXOutcomeRecordV1 = {
    contractVersion: "imagine-x-outcome.v1",
    id: createId("imagine_x_outcome"),
    proposalId: input.proposalId,
    studioId: input.studioId,
    intent: input.intent,
    providerRoutes: input.providerRoutes.map((route) => ({ ...route })),
    status: input.status,
    recordedAtUtc: new Date().toISOString(),
    durationMs: input.durationMs ?? null,
    failure: input.failure ?? null,
    outputObjectCount: Math.max(0, Math.floor(input.outputObjectCount)),
    rating: null,
    feedback: null,
    recommendationInfluence: input.recommendationInfluence
      ? {
          ...input.recommendationInfluence,
          influences: [...input.recommendationInfluence.influences],
        }
      : null,
    followUpEdits: [],
    learning: {
      consent: "not_requested",
      applied: false,
    },
  };
  const existing = (project.brain.outcomes ?? []).filter(
    (item) => item.proposalId !== input.proposalId
  );

  return {
    ...project,
    manifest: { ...project.manifest, updatedAt: outcome.recordedAtUtc },
    brain: {
      ...project.brain,
      outcomes: [...existing, outcome].slice(-OUTCOME_CAP),
    },
  };
}

export function recordImagineXFollowUpEdit(
  project: AxiomProjectDraft,
  input: {
    studioId: string;
    layerId?: string;
    type: string;
    description: string;
  }
): AxiomProjectDraft {
  const outcomes = project.brain.outcomes ?? [];
  let outcomeIndex = -1;
  for (let index = outcomes.length - 1; index >= 0; index -= 1) {
    if (outcomes[index].status === "accepted" && outcomes[index].studioId === input.studioId) {
      outcomeIndex = index;
      break;
    }
  }
  if (outcomeIndex < 0) {
    return project;
  }

  const recordedAtUtc = new Date().toISOString();
  const followUpEdit = {
    id: createId("imagine_x_edit"),
    studioId: input.studioId,
    layerId: input.layerId,
    type: input.type,
    description: input.description,
    recordedAtUtc,
  };
  const nextOutcomes = outcomes.map((outcome, index) =>
    index === outcomeIndex
      ? {
          ...outcome,
          followUpEdits: [...outcome.followUpEdits, followUpEdit].slice(-FOLLOW_UP_EDIT_CAP),
        }
      : outcome
  );

  return {
    ...project,
    manifest: { ...project.manifest, updatedAt: recordedAtUtc },
    brain: { ...project.brain, outcomes: nextOutcomes },
  };
}

export function recordImagineXOutcomeFeedback(
  project: AxiomProjectDraft,
  input: {
    proposalId: string;
    rating: number;
    feedback: string;
  }
): AxiomProjectDraft {
  if (!Number.isInteger(input.rating) || input.rating < 1 || input.rating > 5) {
    return project;
  }

  const outcomes = project.brain.outcomes ?? [];
  const outcomeIndex = outcomes.findIndex((outcome) => outcome.proposalId === input.proposalId);
  if (outcomeIndex < 0) {
    return project;
  }

  const recordedAtUtc = new Date().toISOString();
  const feedback = input.feedback.trim().slice(0, 1000) || null;
  return {
    ...project,
    manifest: { ...project.manifest, updatedAt: recordedAtUtc },
    brain: {
      ...project.brain,
      outcomes: outcomes.map((outcome, index) =>
        index === outcomeIndex
          ? { ...outcome, rating: input.rating, feedback }
          : outcome
      ),
    },
  };
}

export function setImagineXLocalLearningEnabled(
  project: AxiomProjectDraft,
  enabled: boolean
): AxiomProjectDraft {
  const updatedAtUtc = new Date().toISOString();
  return {
    ...project,
    manifest: { ...project.manifest, updatedAt: updatedAtUtc },
    brain: {
      ...project.brain,
      learningControl: {
        contractVersion: "imagine-x-learning-control.v1",
        enabled,
        scope: "local_workspace",
        consent: enabled ? "granted" : "not_granted",
        updatedAtUtc,
      },
    },
  };
}

export function previewImagineXPreferenceCandidate(
  project: AxiomProjectDraft,
  proposalId: string,
  authority?: ImagineXLearningAuthorityResolution,
): AxiomProjectDraft {
  if (!canUseImagineXLearning(project, authority)) {
    return project;
  }
  const outcome = project.brain.outcomes?.find((item) => item.proposalId === proposalId);
  if (
    !outcome ||
    outcome.status !== "accepted" ||
    outcome.rating === null ||
    outcome.rating < 4 ||
    !outcome.feedback
  ) {
    return project;
  }

  const createdAtUtc = new Date().toISOString();
  const candidate = {
    contractVersion: "imagine-x-preference-candidate.v1" as const,
    id: createId("imagine_x_preference"),
    sourceOutcomeId: outcome.id,
    scope: "local_workspace" as const,
    proposedPreference: outcome.feedback,
    explanation: `Based on your explicit ${outcome.rating}/5 rating and feedback.`,
    status: "pending_review" as const,
    applied: false as const,
    createdAtUtc,
    approvedAtUtc: null,
  };
  const existing = (project.brain.preferenceCandidates ?? []).filter(
    (item) => item.sourceOutcomeId !== outcome.id
  );
  return {
    ...project,
    manifest: { ...project.manifest, updatedAt: createdAtUtc },
    brain: {
      ...project.brain,
      preferenceCandidates: [...existing, candidate].slice(-PREFERENCE_CANDIDATE_CAP),
    },
  };
}

export function decideImagineXRecommendationInfluence(
  project: AxiomProjectDraft,
  input: {
    proposalId: string;
    decision: "approved" | "rejected";
  },
  authority?: ImagineXLearningAuthorityResolution,
): AxiomProjectDraft {
  const proposals = project.brain.recommendationInfluenceProposals ?? [];
  const proposalIndex = proposals.findIndex((proposal) => proposal.id === input.proposalId);
  if (proposalIndex < 0 || proposals[proposalIndex].status !== "pending_review") {
    return project;
  }
  if (
    input.decision === "approved" &&
    (
      !canUseImagineXLearning(project, authority)
    )
  ) {
    return project;
  }

  const decidedAtUtc = new Date().toISOString();
  return {
    ...project,
    manifest: { ...project.manifest, updatedAt: decidedAtUtc },
    brain: {
      ...project.brain,
      recommendationInfluenceProposals: proposals.map((proposal, index) =>
        index === proposalIndex
          ? { ...proposal, status: input.decision, decidedAtUtc }
          : proposal
      ),
    },
  };
}

export function applyImagineXRecommendationInfluence(
  project: AxiomProjectDraft,
  proposalId: string,
  authority?: ImagineXLearningAuthorityResolution,
): AxiomProjectDraft {
  const proposals = project.brain.recommendationInfluenceProposals ?? [];
  const proposalIndex = proposals.findIndex((proposal) => proposal.id === proposalId);
  if (
    proposalIndex < 0 ||
    proposals[proposalIndex].status !== "approved" ||
    proposals[proposalIndex].applied ||
    proposals.some((proposal) => proposal.applied) ||
    !canUseImagineXLearning(project, authority)
  ) {
    return project;
  }

  const appliedAtUtc = new Date().toISOString();
  return {
    ...project,
    manifest: { ...project.manifest, updatedAt: appliedAtUtc },
    brain: {
      ...project.brain,
      recommendationInfluenceProposals: proposals.map((proposal, index) =>
        index === proposalIndex
          ? { ...proposal, applied: true, appliedAtUtc, rolledBackAtUtc: null }
          : proposal
      ),
    },
  };
}

export function rollbackImagineXRecommendationInfluence(
  project: AxiomProjectDraft,
  proposalId: string
): AxiomProjectDraft {
  const proposals = project.brain.recommendationInfluenceProposals ?? [];
  const proposalIndex = proposals.findIndex((proposal) => proposal.id === proposalId);
  if (proposalIndex < 0 || !proposals[proposalIndex].applied) {
    return project;
  }

  const rolledBackAtUtc = new Date().toISOString();
  return {
    ...project,
    manifest: { ...project.manifest, updatedAt: rolledBackAtUtc },
    brain: {
      ...project.brain,
      recommendationInfluenceProposals: proposals.map((proposal, index) =>
        index === proposalIndex
          ? { ...proposal, applied: false, rolledBackAtUtc }
          : proposal
      ),
    },
  };
}

export function approveImagineXPreferenceCandidate(
  project: AxiomProjectDraft,
  candidateId: string,
  authority?: ImagineXLearningAuthorityResolution,
): AxiomProjectDraft {
  if (!canUseImagineXLearning(project, authority)) {
    return project;
  }
  const candidates = project.brain.preferenceCandidates ?? [];
  const candidateIndex = candidates.findIndex((item) => item.id === candidateId);
  if (candidateIndex < 0) {
    return project;
  }

  const approvedAtUtc = new Date().toISOString();
  return {
    ...project,
    manifest: { ...project.manifest, updatedAt: approvedAtUtc },
    brain: {
      ...project.brain,
      preferenceCandidates: candidates.map((candidate, index) =>
        index === candidateIndex
          ? { ...candidate, status: "approved", approvedAtUtc }
          : candidate
      ),
    },
  };
}

export function deleteImagineXPreferenceCandidate(
  project: AxiomProjectDraft,
  candidateId: string
): AxiomProjectDraft {
  const candidates = project.brain.preferenceCandidates ?? [];
  const remaining = candidates.filter((candidate) => candidate.id !== candidateId);
  if (remaining.length === candidates.length) {
    return project;
  }

  const updatedAtUtc = new Date().toISOString();
  return {
    ...project,
    manifest: { ...project.manifest, updatedAt: updatedAtUtc },
    brain: { ...project.brain, preferenceCandidates: remaining },
  };
}

export function deleteImagineXInfluenceEvaluationDecision(
  project: AxiomProjectDraft,
  decisionId: string
): AxiomProjectDraft {
  const decisions = project.brain.influenceEvaluationDecisions ?? [];
  const remaining = decisions.filter((decision) => decision.id !== decisionId);
  if (remaining.length === decisions.length) return project;

  const updatedAtUtc = new Date().toISOString();
  return {
    ...project,
    manifest: { ...project.manifest, updatedAt: updatedAtUtc },
    brain: { ...project.brain, influenceEvaluationDecisions: remaining },
  };
}

export function createImagineXPreferenceProfileExport(project: AxiomProjectDraft) {
  return {
    contractVersion: "imagine-x-preference-profile.v1" as const,
    projectId: project.manifest.id,
    scope: "local_workspace" as const,
    learningEnabled: Boolean(
      project.brain.learningControl?.enabled &&
      project.brain.learningControl.consent === "granted"
    ),
    exportedAtUtc: new Date().toISOString(),
    candidates: (project.brain.preferenceCandidates ?? []).map((candidate) => ({
      ...candidate,
    })),
    evaluationDecisions: structuredClone(
      project.brain.influenceEvaluationDecisions ?? []
    ),
  };
}

export function resetImagineXPreferenceProfile(project: AxiomProjectDraft): AxiomProjectDraft {
  if (
    (project.brain.preferenceCandidates ?? []).length === 0 &&
    (project.brain.recommendationInfluenceProposals ?? []).length === 0 &&
    (project.brain.influenceEvaluationDecisions ?? []).length === 0
  ) {
    return project;
  }
  const updatedAtUtc = new Date().toISOString();
  return {
    ...project,
    manifest: { ...project.manifest, updatedAt: updatedAtUtc },
    brain: {
      ...project.brain,
      preferenceCandidates: [],
      recommendationInfluenceProposals: [],
      influenceEvaluationDecisions: [],
    },
  };
}

export function previewImagineXRecommendationInfluence(
  project: AxiomProjectDraft,
  authority?: ImagineXLearningAuthorityResolution,
): AxiomProjectDraft {
  if (!canUseImagineXLearning(project, authority)) {
    return project;
  }
  const approvedCandidates = (project.brain.preferenceCandidates ?? []).filter(
    (candidate) => candidate.status === "approved"
  );
  if (approvedCandidates.length === 0) {
    return project;
  }

  const createdAtUtc = new Date().toISOString();
  const count = approvedCandidates.length;
  const appliedInfluences = (project.brain.recommendationInfluenceProposals ?? [])
    .find((proposal) => proposal.applied)?.proposedInfluences ?? [];
  const proposal = {
    contractVersion: "imagine-x-recommendation-influence.v1" as const,
    id: createId("imagine_x_recommendation_influence"),
    scope: "local_workspace" as const,
    sourceCandidateIds: approvedCandidates.map((candidate) => candidate.id),
    proposedInfluences: approvedCandidates.map((candidate) => candidate.proposedPreference),
    recommendationDiff: {
      before: appliedInfluences,
      after: approvedCandidates.map((candidate) => candidate.proposedPreference),
    },
    explanation: `Preview based on ${count} explicitly approved local preference candidate${count === 1 ? "" : "s"}.`,
    status: "pending_review" as const,
    applied: false as const,
    createdAtUtc,
    decidedAtUtc: null,
    appliedAtUtc: null,
    rolledBackAtUtc: null,
  };
  return {
    ...project,
    manifest: { ...project.manifest, updatedAt: createdAtUtc },
    brain: {
      ...project.brain,
      recommendationInfluenceProposals: [
        ...(project.brain.recommendationInfluenceProposals ?? []),
        proposal,
      ].slice(-RECOMMENDATION_INFLUENCE_CAP),
    },
  };
}
