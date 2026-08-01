import { describe, expect, it, vi } from "vitest";
import { createProjectDraft } from "../projects/projectDraft";
import {
  applyImagineXRecommendationInfluence,
  approveImagineXPreferenceCandidate,
  createImagineXPreferenceProfileExport,
  decideImagineXRecommendationInfluence,
  deleteImagineXPreferenceCandidate,
  deleteImagineXInfluenceEvaluationDecision,
  previewImagineXPreferenceCandidate,
  previewImagineXRecommendationInfluence,
  recordImagineXInfluenceEvaluationDecision,
  recordImagineXFollowUpEdit,
  recordImagineXOutcomeFeedback,
  recordImagineXProposalOutcome,
  resetImagineXPreferenceProfile,
  rollbackImagineXRecommendationInfluence,
  setImagineXLocalLearningEnabled,
  summarizeImagineXInfluenceEvaluation,
} from "./ImagineXOutcomeService";

describe("ImagineXOutcomeService", () => {
  it("records an explainable accepted outcome without enabling learning", () => {
    const project = createProjectDraft({ name: "Outcome", intent: "Create poster", targetStudioId: "photo" });
    const updated = recordImagineXProposalOutcome(project, {
      proposalId: "proposal-1",
      studioId: "photo",
      intent: "Create poster",
      providerRoutes: [{ studio: "Photo Studio", provider: "local-studio-router", mode: "dry-run" }],
      status: "accepted",
      outputObjectCount: 2,
    });

    expect(updated.brain.outcomes).toEqual([
      expect.objectContaining({
        contractVersion: "imagine-x-outcome.v1",
        proposalId: "proposal-1",
        status: "accepted",
        outputObjectCount: 2,
        rating: null,
        feedback: null,
        followUpEdits: [],
        recommendationInfluence: null,
        learning: { consent: "not_requested", applied: false },
      }),
    ]);
    expect(project.brain.outcomes).toEqual([]);
  });

  it("copies generated-plan influence provenance into the historical outcome", () => {
    const project = createProjectDraft({ name: "Outcome", intent: "Create poster", targetStudioId: "photo" });
    const recommendationInfluence = {
      proposalId: "influence-active",
      appliedAtUtc: "2026-07-26T00:02:00.000Z",
      influences: ["Prefer restrained typography."],
    };

    const updated = recordImagineXProposalOutcome(project, {
      proposalId: "proposal-influenced",
      studioId: "photo",
      intent: "Create poster",
      providerRoutes: [],
      status: "accepted",
      outputObjectCount: 1,
      recommendationInfluence,
    });
    recommendationInfluence.influences.push("Later mutation.");

    expect(updated.brain.outcomes?.[0].recommendationInfluence).toEqual({
      proposalId: "influence-active",
      appliedAtUtc: "2026-07-26T00:02:00.000Z",
      influences: ["Prefer restrained typography."],
    });
  });

  it("summarizes only explicitly rated baseline and influenced outcomes", () => {
    let project = createProjectDraft({ name: "Evaluation", intent: "", targetStudioId: "brain-x" });
    project = recordImagineXProposalOutcome(project, {
      proposalId: "baseline-rated",
      studioId: "brain-x",
      intent: "Baseline",
      providerRoutes: [],
      status: "accepted",
      outputObjectCount: 0,
    });
    project = recordImagineXOutcomeFeedback(project, {
      proposalId: "baseline-rated",
      rating: 3,
      feedback: "",
    });
    project = recordImagineXProposalOutcome(project, {
      proposalId: "influenced-rated",
      studioId: "brain-x",
      intent: "Influenced",
      providerRoutes: [],
      status: "accepted",
      outputObjectCount: 0,
      recommendationInfluence: {
        proposalId: "influence-active",
        appliedAtUtc: "2026-07-26T00:02:00.000Z",
        influences: ["Prefer restrained typography."],
      },
    });
    project = recordImagineXOutcomeFeedback(project, {
      proposalId: "influenced-rated",
      rating: 5,
      feedback: "",
    });
    project = recordImagineXProposalOutcome(project, {
      proposalId: "influenced-unrated",
      studioId: "brain-x",
      intent: "Unrated",
      providerRoutes: [],
      status: "rejected",
      outputObjectCount: 0,
      recommendationInfluence: {
        proposalId: "influence-active",
        appliedAtUtc: "2026-07-26T00:02:00.000Z",
        influences: ["Prefer restrained typography."],
      },
    });
    project = recordImagineXProposalOutcome(project, {
      proposalId: "influenced-other",
      studioId: "brain-x",
      intent: "Other influence",
      providerRoutes: [],
      status: "accepted",
      outputObjectCount: 0,
      recommendationInfluence: {
        proposalId: "influence-other",
        appliedAtUtc: "2026-07-26T00:03:00.000Z",
        influences: ["Prefer warmer colors."],
      },
    });
    project = recordImagineXOutcomeFeedback(project, {
      proposalId: "influenced-other",
      rating: 1,
      feedback: "",
    });

    expect(summarizeImagineXInfluenceEvaluation(project)).toEqual({
      contractVersion: "imagine-x-influence-evaluation.v1",
      baseline: {
        ratedOutcomeCount: 1,
        averageRating: 3,
        ratingDistribution: [0, 0, 1, 0, 0],
      },
      influenced: {
        ratedOutcomeCount: 2,
        averageRating: 3,
        ratingDistribution: [1, 0, 0, 0, 1],
      },
      observedDifference: 0,
      byInfluenceProposal: [
        {
          proposalId: "influence-active",
          influences: ["Prefer restrained typography."],
          ratedOutcomeCount: 1,
          averageRating: 5,
          ratingDistribution: [0, 0, 0, 0, 1],
        },
        {
          proposalId: "influence-other",
          influences: ["Prefer warmer colors."],
          ratedOutcomeCount: 1,
          averageRating: 1,
          ratingDistribution: [1, 0, 0, 0, 0],
        },
      ],
    });
  });

  it("reports no observed difference without ratings in both groups", () => {
    const project = createProjectDraft({ name: "Evaluation", intent: "", targetStudioId: "brain-x" });

    expect(summarizeImagineXInfluenceEvaluation(project)).toEqual({
      contractVersion: "imagine-x-influence-evaluation.v1",
      baseline: {
        ratedOutcomeCount: 0,
        averageRating: null,
        ratingDistribution: [0, 0, 0, 0, 0],
      },
      influenced: {
        ratedOutcomeCount: 0,
        averageRating: null,
        ratingDistribution: [0, 0, 0, 0, 0],
      },
      observedDifference: null,
      byInfluenceProposal: [],
    });
  });

  it("records an explicit evaluation decision with a frozen B7 evidence snapshot", () => {
    let project = createProjectDraft({ name: "Decision", intent: "", targetStudioId: "brain-x" });
    project.brain.recommendationInfluenceProposals = [{
      contractVersion: "imagine-x-recommendation-influence.v1",
      id: "influence-reviewed",
      scope: "local_workspace",
      sourceCandidateIds: ["candidate-reviewed"],
      proposedInfluences: ["Prefer restrained typography."],
      explanation: "Approved by the user.",
      status: "approved",
      applied: true,
      createdAtUtc: "2026-07-26T00:00:00.000Z",
      decidedAtUtc: "2026-07-26T00:01:00.000Z",
      appliedAtUtc: "2026-07-26T00:02:00.000Z",
      rolledBackAtUtc: null,
    }];
    project = recordImagineXProposalOutcome(project, {
      proposalId: "outcome-reviewed",
      studioId: "brain-x",
      intent: "Influenced result",
      providerRoutes: [],
      status: "accepted",
      outputObjectCount: 0,
      recommendationInfluence: {
        proposalId: "influence-reviewed",
        appliedAtUtc: "2026-07-26T00:02:00.000Z",
        influences: ["Prefer restrained typography."],
      },
    });
    project = recordImagineXOutcomeFeedback(project, {
      proposalId: "outcome-reviewed",
      rating: 4,
      feedback: "",
    });

    const decided = recordImagineXInfluenceEvaluationDecision(project, {
      proposalId: "influence-reviewed",
      decision: "rollback",
      rationale: "  Too little evidence.  ",
    });

    expect(decided.brain.influenceEvaluationDecisions).toEqual([
      expect.objectContaining({
        contractVersion: "imagine-x-influence-evaluation-decision.v1",
        proposalId: "influence-reviewed",
        decision: "rollback",
        rationale: "Too little evidence.",
        evidence: expect.objectContaining({
          contractVersion: "imagine-x-influence-evaluation.v1",
          byInfluenceProposal: [expect.objectContaining({
            proposalId: "influence-reviewed",
            ratedOutcomeCount: 1,
            ratingDistribution: [0, 0, 0, 1, 0],
          })],
        }),
      }),
    ]);
    expect(decided.brain.recommendationInfluenceProposals?.[0].applied).toBe(true);
    expect(project.brain.influenceEvaluationDecisions).toEqual([]);
    expect(recordImagineXInfluenceEvaluationDecision(decided, {
      proposalId: "influence-reviewed",
      decision: "keep",
      rationale: "Change it.",
    })).toBe(decided);

    const exported = createImagineXPreferenceProfileExport(decided);
    expect(exported.evaluationDecisions).toEqual(decided.brain.influenceEvaluationDecisions);
    expect(exported.evaluationDecisions).not.toBe(decided.brain.influenceEvaluationDecisions);
    expect(exported.evaluationDecisions[0].evidence).not.toBe(
      decided.brain.influenceEvaluationDecisions?.[0].evidence
    );

    const deleted = deleteImagineXInfluenceEvaluationDecision(
      setImagineXLocalLearningEnabled(decided, false),
      decided.brain.influenceEvaluationDecisions?.[0].id ?? ""
    );
    expect(deleted.brain.influenceEvaluationDecisions).toEqual([]);
    expect(deleted.brain.outcomes).toEqual(decided.brain.outcomes);
    expect(deleted.brain.recommendationInfluenceProposals).toEqual(
      decided.brain.recommendationInfluenceProposals
    );
    expect(deleteImagineXInfluenceEvaluationDecision(deleted, "missing")).toBe(deleted);
    expect(resetImagineXPreferenceProfile(decided).brain.influenceEvaluationDecisions).toEqual([]);
  });

  it("rejects evaluation decisions without rated evidence for the proposal", () => {
    const project = createProjectDraft({ name: "Decision", intent: "", targetStudioId: "brain-x" });
    project.brain.recommendationInfluenceProposals = [{
      contractVersion: "imagine-x-recommendation-influence.v1",
      id: "influence-unrated",
      scope: "local_workspace",
      sourceCandidateIds: [],
      proposedInfluences: ["Prefer warmer colors."],
      explanation: "Approved by the user.",
      status: "approved",
      applied: true,
      createdAtUtc: "2026-07-26T00:00:00.000Z",
      decidedAtUtc: "2026-07-26T00:01:00.000Z",
      appliedAtUtc: "2026-07-26T00:02:00.000Z",
      rolledBackAtUtc: null,
    }];

    expect(recordImagineXInfluenceEvaluationDecision(project, {
      proposalId: "influence-unrated",
      decision: "inconclusive",
      rationale: "No ratings yet.",
    })).toBe(project);
  });

  it("attaches a local Photo edit to the latest accepted outcome", () => {
    const project = createProjectDraft({ name: "Outcome", intent: "Create poster", targetStudioId: "photo" });
    const accepted = recordImagineXProposalOutcome(project, {
      proposalId: "proposal-1",
      studioId: "photo",
      intent: "Create poster",
      providerRoutes: [],
      status: "accepted",
      outputObjectCount: 1,
    });
    const updated = recordImagineXFollowUpEdit(accepted, {
      studioId: "photo",
      layerId: "hero",
      type: "opacity_changed",
      description: "Changed opacity to 40%.",
    });

    expect(updated.brain.outcomes?.[0].followUpEdits).toEqual([
      expect.objectContaining({
        studioId: "photo",
        layerId: "hero",
        type: "opacity_changed",
        description: "Changed opacity to 40%.",
      }),
    ]);
  });

  it("does not invent an outcome when no accepted proposal exists", () => {
    const project = createProjectDraft({ name: "Outcome", intent: "", targetStudioId: "photo" });

    expect(recordImagineXFollowUpEdit(project, {
      studioId: "photo",
      layerId: "hero",
      type: "opacity_changed",
      description: "Changed opacity.",
    })).toBe(project);
  });

  it("replaces the same proposal outcome and normalizes invalid object counts", () => {
    const project = createProjectDraft({ name: "Outcome", intent: "", targetStudioId: "photo" });
    const accepted = recordImagineXProposalOutcome(project, {
      proposalId: "proposal-1",
      studioId: "photo",
      intent: "Create poster",
      providerRoutes: [],
      status: "accepted",
      outputObjectCount: 1,
    });
    const rejected = recordImagineXProposalOutcome(accepted, {
      proposalId: "proposal-1",
      studioId: "photo",
      intent: "Create poster",
      providerRoutes: [],
      status: "rejected",
      outputObjectCount: -4,
      durationMs: 12,
      failure: "User rejected the direction.",
    });

    expect(rejected.brain.outcomes).toHaveLength(1);
    expect(rejected.brain.outcomes?.[0]).toMatchObject({
      status: "rejected",
      outputObjectCount: 0,
      durationMs: 12,
      failure: "User rejected the direction.",
    });
  });

  it("creates a local fallback id when randomUUID is unavailable", () => {
    const project = createProjectDraft({ name: "Outcome", intent: "", targetStudioId: "photo" });
    vi.stubGlobal("crypto", undefined);

    const updated = recordImagineXProposalOutcome(project, {
      proposalId: "proposal-fallback",
      studioId: "photo",
      intent: "",
      providerRoutes: [],
      status: "rejected",
      outputObjectCount: 0,
    });

    expect(updated.brain.outcomes?.[0].id).toMatch(/^imagine_x_outcome_/);
    vi.unstubAllGlobals();
  });

  it("stores explicit rating and bounded feedback without changing learning consent", () => {
    const project = createProjectDraft({ name: "Outcome", intent: "", targetStudioId: "photo" });
    const accepted = recordImagineXProposalOutcome(project, {
      proposalId: "proposal-feedback",
      studioId: "photo",
      intent: "Create poster",
      providerRoutes: [],
      status: "accepted",
      outputObjectCount: 1,
    });

    const updated = recordImagineXOutcomeFeedback(accepted, {
      proposalId: "proposal-feedback",
      rating: 5,
      feedback: `  ${"Clear direction. ".repeat(100)}  `,
    });

    expect(updated.brain.outcomes?.[0]).toMatchObject({
      rating: 5,
      learning: { consent: "not_requested", applied: false },
    });
    expect(updated.brain.outcomes?.[0].feedback?.length).toBeLessThanOrEqual(1000);
    expect(updated.brain.outcomes?.[0].feedback?.startsWith("Clear direction.")).toBe(true);
  });

  it("rejects invalid ratings and unknown proposal ids", () => {
    const project = createProjectDraft({ name: "Outcome", intent: "", targetStudioId: "photo" });

    expect(recordImagineXOutcomeFeedback(project, {
      proposalId: "missing",
      rating: 4,
      feedback: "",
    })).toBe(project);
    expect(recordImagineXOutcomeFeedback(project, {
      proposalId: "missing",
      rating: 0,
      feedback: "",
    })).toBe(project);
    expect(recordImagineXOutcomeFeedback(project, {
      proposalId: "missing",
      rating: 6,
      feedback: "",
    })).toBe(project);
    expect(recordImagineXOutcomeFeedback(project, {
      proposalId: "missing",
      rating: 2.5,
      feedback: "",
    })).toBe(project);
  });

  it("stores empty feedback as null without changing other outcomes", () => {
    const project = createProjectDraft({ name: "Outcome", intent: "", targetStudioId: "photo" });
    const first = recordImagineXProposalOutcome(project, {
      proposalId: "proposal-1",
      studioId: "photo",
      intent: "",
      providerRoutes: [],
      status: "accepted",
      outputObjectCount: 1,
    });
    const second = recordImagineXProposalOutcome(first, {
      proposalId: "proposal-2",
      studioId: "photo",
      intent: "",
      providerRoutes: [],
      status: "accepted",
      outputObjectCount: 1,
    });

    const updated = recordImagineXOutcomeFeedback(second, {
      proposalId: "proposal-2",
      rating: 1,
      feedback: "   ",
    });

    expect(updated.brain.outcomes?.[0].rating).toBeNull();
    expect(updated.brain.outcomes?.[1]).toMatchObject({ rating: 1, feedback: null });
  });

  it("defaults local learning to disabled and requires an explicit saved opt-in", () => {
    const project = createProjectDraft({ name: "Outcome", intent: "", targetStudioId: "photo" });

    expect(project.brain.learningControl).toMatchObject({
      contractVersion: "imagine-x-learning-control.v1",
      enabled: false,
      scope: "local_workspace",
      consent: "not_granted",
    });

    const enabled = setImagineXLocalLearningEnabled(project, true);
    expect(enabled.brain.learningControl).toMatchObject({
      enabled: true,
      scope: "local_workspace",
      consent: "granted",
    });
  });

  it("revokes local learning without applying learning to recorded outcomes", () => {
    const project = createProjectDraft({ name: "Outcome", intent: "", targetStudioId: "photo" });
    const accepted = recordImagineXProposalOutcome(project, {
      proposalId: "proposal-learning",
      studioId: "photo",
      intent: "",
      providerRoutes: [],
      status: "accepted",
      outputObjectCount: 1,
    });

    const enabled = setImagineXLocalLearningEnabled(accepted, true);
    const disabled = setImagineXLocalLearningEnabled(enabled, false);

    expect(disabled.brain.learningControl).toMatchObject({
      enabled: false,
      scope: "local_workspace",
      consent: "not_granted",
    });
    expect(disabled.brain.outcomes?.[0].learning).toEqual({
      consent: "not_requested",
      applied: false,
    });
  });

  it("previews an explicit preference candidate only after local consent", () => {
    const project = createProjectDraft({ name: "Outcome", intent: "", targetStudioId: "photo" });
    const accepted = recordImagineXProposalOutcome(project, {
      proposalId: "proposal-preference",
      studioId: "photo",
      intent: "Create a restrained editorial layout",
      providerRoutes: [],
      status: "accepted",
      outputObjectCount: 1,
    });
    const rated = recordImagineXOutcomeFeedback(accepted, {
      proposalId: "proposal-preference",
      rating: 5,
      feedback: "Keep the restrained typography and generous spacing.",
    });

    expect(previewImagineXPreferenceCandidate(rated, "proposal-preference")).toBe(rated);

    const consented = setImagineXLocalLearningEnabled(rated, true);
    const previewed = previewImagineXPreferenceCandidate(consented, "proposal-preference");
    expect(previewed.brain.preferenceCandidates).toEqual([
      expect.objectContaining({
        contractVersion: "imagine-x-preference-candidate.v1",
        sourceOutcomeId: consented.brain.outcomes?.[0].id,
        scope: "local_workspace",
        proposedPreference: "Keep the restrained typography and generous spacing.",
        explanation: "Based on your explicit 5/5 rating and feedback.",
        status: "pending_review",
        applied: false,
        approvedAtUtc: null,
      }),
    ]);
  });

  it("requires explicit approval and active consent while keeping the candidate unapplied", () => {
    const project = createProjectDraft({ name: "Outcome", intent: "", targetStudioId: "photo" });
    const accepted = recordImagineXProposalOutcome(project, {
      proposalId: "proposal-approve",
      studioId: "photo",
      intent: "",
      providerRoutes: [],
      status: "accepted",
      outputObjectCount: 1,
    });
    const rated = recordImagineXOutcomeFeedback(accepted, {
      proposalId: "proposal-approve",
      rating: 4,
      feedback: "Prefer this visual balance.",
    });
    const previewed = previewImagineXPreferenceCandidate(
      setImagineXLocalLearningEnabled(rated, true),
      "proposal-approve"
    );
    const candidate = previewed.brain.preferenceCandidates?.[0];

    expect(candidate?.status).toBe("pending_review");
    const approved = approveImagineXPreferenceCandidate(previewed, candidate?.id ?? "");
    expect(approved.brain.preferenceCandidates?.[0]).toMatchObject({
      status: "approved",
      applied: false,
    });
    expect(approved.brain.preferenceCandidates?.[0].approvedAtUtc).not.toBeNull();

    const revoked = setImagineXLocalLearningEnabled(previewed, false);
    expect(approveImagineXPreferenceCandidate(revoked, candidate?.id ?? "")).toBe(revoked);
  });

  it("does not create candidates from weak, empty, rejected, or missing outcome feedback", () => {
    const project = setImagineXLocalLearningEnabled(
      createProjectDraft({ name: "Outcome", intent: "", targetStudioId: "photo" }),
      true
    );
    const rejected = recordImagineXProposalOutcome(project, {
      proposalId: "proposal-rejected",
      studioId: "photo",
      intent: "",
      providerRoutes: [],
      status: "rejected",
      outputObjectCount: 0,
    });
    const weak = recordImagineXOutcomeFeedback(rejected, {
      proposalId: "proposal-rejected",
      rating: 3,
      feedback: "Not enough evidence.",
    });

    expect(previewImagineXPreferenceCandidate(weak, "proposal-rejected")).toBe(weak);
    expect(previewImagineXPreferenceCandidate(weak, "missing")).toBe(weak);
    expect(approveImagineXPreferenceCandidate(weak, "missing")).toBe(weak);
  });

  it("deletes a selected candidate even after local learning is revoked", () => {
    const project = createProjectDraft({ name: "Outcome", intent: "", targetStudioId: "photo" });
    const accepted = recordImagineXProposalOutcome(project, {
      proposalId: "proposal-delete",
      studioId: "photo",
      intent: "",
      providerRoutes: [],
      status: "accepted",
      outputObjectCount: 1,
    });
    const rated = recordImagineXOutcomeFeedback(accepted, {
      proposalId: "proposal-delete",
      rating: 5,
      feedback: "Prefer this spacing.",
    });
    const previewed = previewImagineXPreferenceCandidate(
      setImagineXLocalLearningEnabled(rated, true),
      "proposal-delete"
    );
    const revoked = setImagineXLocalLearningEnabled(previewed, false);
    const candidateId = revoked.brain.preferenceCandidates?.[0].id ?? "";

    const deleted = deleteImagineXPreferenceCandidate(revoked, candidateId);
    expect(deleted.brain.preferenceCandidates).toEqual([]);
    expect(revoked.brain.preferenceCandidates).toHaveLength(1);
    expect(deleteImagineXPreferenceCandidate(deleted, "missing")).toBe(deleted);
  });

  it("exports only the local preference profile with its consent state", () => {
    const project = createProjectDraft({ name: "Outcome", intent: "", targetStudioId: "photo" });
    const accepted = recordImagineXProposalOutcome(project, {
      proposalId: "proposal-export",
      studioId: "photo",
      intent: "",
      providerRoutes: [],
      status: "accepted",
      outputObjectCount: 1,
    });
    const rated = recordImagineXOutcomeFeedback(accepted, {
      proposalId: "proposal-export",
      rating: 5,
      feedback: "Prefer this spacing.",
    });
    const previewed = previewImagineXPreferenceCandidate(
      setImagineXLocalLearningEnabled(rated, true),
      "proposal-export"
    );

    const exported = createImagineXPreferenceProfileExport(previewed);
    expect(exported).toMatchObject({
      contractVersion: "imagine-x-preference-profile.v1",
      projectId: previewed.manifest.id,
      scope: "local_workspace",
      learningEnabled: true,
      candidates: [
        expect.objectContaining({
          proposedPreference: "Prefer this spacing.",
          applied: false,
        }),
      ],
    });
    expect(exported).not.toHaveProperty("outcomes");
    expect(exported.candidates).not.toBe(previewed.brain.preferenceCandidates);
    expect(exported.evaluationDecisions).toEqual([]);
  });

  it("resets preference candidates without changing consent or source outcomes", () => {
    const project = createProjectDraft({ name: "Outcome", intent: "", targetStudioId: "photo" });
    const accepted = recordImagineXProposalOutcome(project, {
      proposalId: "proposal-reset",
      studioId: "photo",
      intent: "",
      providerRoutes: [],
      status: "accepted",
      outputObjectCount: 1,
    });
    const rated = recordImagineXOutcomeFeedback(accepted, {
      proposalId: "proposal-reset",
      rating: 5,
      feedback: "Prefer this spacing.",
    });
    const previewed = previewImagineXPreferenceCandidate(
      setImagineXLocalLearningEnabled(rated, true),
      "proposal-reset"
    );

    const approved = approveImagineXPreferenceCandidate(
      previewed,
      previewed.brain.preferenceCandidates?.[0].id ?? ""
    );
    const influenced = previewImagineXRecommendationInfluence(approved);
    const reset = resetImagineXPreferenceProfile(influenced);
    expect(reset.brain.preferenceCandidates).toEqual([]);
    expect(reset.brain.recommendationInfluenceProposals).toEqual([]);
    expect(reset.brain.learningControl).toEqual(influenced.brain.learningControl);
    expect(reset.brain.outcomes).toEqual(influenced.brain.outcomes);
    expect(resetImagineXPreferenceProfile(reset)).toBe(reset);
  });

  it("previews recommendation influence only from approved candidates with active consent", () => {
    const project = createProjectDraft({ name: "Outcome", intent: "", targetStudioId: "photo" });
    project.brain.preferenceCandidates = [
      {
        contractVersion: "imagine-x-preference-candidate.v1",
        id: "candidate-approved",
        sourceOutcomeId: "outcome-approved",
        scope: "local_workspace",
        proposedPreference: "Prefer restrained typography.",
        explanation: "Based on explicit feedback.",
        status: "approved",
        applied: false,
        createdAtUtc: "2026-07-26T00:00:00.000Z",
        approvedAtUtc: "2026-07-26T00:01:00.000Z",
      },
      {
        contractVersion: "imagine-x-preference-candidate.v1",
        id: "candidate-pending",
        sourceOutcomeId: "outcome-pending",
        scope: "local_workspace",
        proposedPreference: "Prefer louder colors.",
        explanation: "Based on explicit feedback.",
        status: "pending_review",
        applied: false,
        createdAtUtc: "2026-07-26T00:02:00.000Z",
        approvedAtUtc: null,
      },
    ];

    expect(previewImagineXRecommendationInfluence(project)).toBe(project);
    const consented = setImagineXLocalLearningEnabled(project, true);
    const previewed = previewImagineXRecommendationInfluence(consented);

    expect(previewed.brain.recommendationInfluenceProposals).toEqual([
      expect.objectContaining({
        contractVersion: "imagine-x-recommendation-influence.v1",
        scope: "local_workspace",
        sourceCandidateIds: ["candidate-approved"],
        proposedInfluences: ["Prefer restrained typography."],
        recommendationDiff: {
          before: [],
          after: ["Prefer restrained typography."],
        },
        explanation: "Preview based on 1 explicitly approved local preference candidate.",
        status: "pending_review",
        applied: false,
      }),
    ]);
    expect(previewed.brain.preferenceCandidates).toEqual(consented.brain.preferenceCandidates);
  });

  it("does not create recommendation influence without approved candidates", () => {
    const project = setImagineXLocalLearningEnabled(
      createProjectDraft({ name: "Outcome", intent: "", targetStudioId: "photo" }),
      true
    );

    expect(previewImagineXRecommendationInfluence(project)).toBe(project);
  });

  it("approves a pending influence preview with active consent without applying it", () => {
    const project = setImagineXLocalLearningEnabled(
      createProjectDraft({ name: "Outcome", intent: "", targetStudioId: "photo" }),
      true
    );
    project.brain.preferenceCandidates = [{
      contractVersion: "imagine-x-preference-candidate.v1",
      id: "candidate-decision",
      sourceOutcomeId: "outcome-decision",
      scope: "local_workspace",
      proposedPreference: "Prefer restrained typography.",
      explanation: "Based on explicit feedback.",
      status: "approved",
      applied: false,
      createdAtUtc: "2026-07-26T00:00:00.000Z",
      approvedAtUtc: "2026-07-26T00:01:00.000Z",
    }];
    const previewed = previewImagineXRecommendationInfluence(project);
    const proposalId = previewed.brain.recommendationInfluenceProposals?.[0].id ?? "";

    const approved = decideImagineXRecommendationInfluence(previewed, {
      proposalId,
      decision: "approved",
    });
    expect(approved.brain.recommendationInfluenceProposals?.[0]).toMatchObject({
      status: "approved",
      applied: false,
    });
    expect(approved.brain.recommendationInfluenceProposals?.[0].decidedAtUtc).not.toBeNull();
    expect(approved.brain.preferenceCandidates?.[0].applied).toBe(false);
    expect(decideImagineXRecommendationInfluence(approved, {
      proposalId,
      decision: "rejected",
    })).toBe(approved);
  });

  it("allows rejection after consent revocation but blocks approval", () => {
    const project = setImagineXLocalLearningEnabled(
      createProjectDraft({ name: "Outcome", intent: "", targetStudioId: "photo" }),
      true
    );
    project.brain.preferenceCandidates = [{
      contractVersion: "imagine-x-preference-candidate.v1",
      id: "candidate-reject",
      sourceOutcomeId: "outcome-reject",
      scope: "local_workspace",
      proposedPreference: "Prefer restrained typography.",
      explanation: "Based on explicit feedback.",
      status: "approved",
      applied: false,
      createdAtUtc: "2026-07-26T00:00:00.000Z",
      approvedAtUtc: "2026-07-26T00:01:00.000Z",
    }];
    const previewed = previewImagineXRecommendationInfluence(project);
    const proposalId = previewed.brain.recommendationInfluenceProposals?.[0].id ?? "";
    const revoked = setImagineXLocalLearningEnabled(previewed, false);

    expect(decideImagineXRecommendationInfluence(revoked, {
      proposalId,
      decision: "approved",
    })).toBe(revoked);
    const rejected = decideImagineXRecommendationInfluence(revoked, {
      proposalId,
      decision: "rejected",
    });
    expect(rejected.brain.recommendationInfluenceProposals?.[0]).toMatchObject({
      status: "rejected",
      applied: false,
    });
    expect(decideImagineXRecommendationInfluence(rejected, {
      proposalId: "missing",
      decision: "rejected",
    })).toBe(rejected);
  });

  it("explicitly applies one approved influence and allows rollback after consent revocation", () => {
    const project = setImagineXLocalLearningEnabled(
      createProjectDraft({ name: "Outcome", intent: "", targetStudioId: "photo" }),
      true
    );
    project.brain.preferenceCandidates = [{
      contractVersion: "imagine-x-preference-candidate.v1",
      id: "candidate-apply",
      sourceOutcomeId: "outcome-apply",
      scope: "local_workspace",
      proposedPreference: "Prefer restrained typography.",
      explanation: "Based on explicit feedback.",
      status: "approved",
      applied: false,
      createdAtUtc: "2026-07-26T00:00:00.000Z",
      approvedAtUtc: "2026-07-26T00:01:00.000Z",
    }];
    const previewed = previewImagineXRecommendationInfluence(project);
    const proposalId = previewed.brain.recommendationInfluenceProposals?.[0].id ?? "";

    expect(applyImagineXRecommendationInfluence(previewed, proposalId)).toBe(previewed);
    const approved = decideImagineXRecommendationInfluence(previewed, {
      proposalId,
      decision: "approved",
    });
    const applied = applyImagineXRecommendationInfluence(approved, proposalId);
    expect(applied.brain.recommendationInfluenceProposals?.[0]).toMatchObject({
      status: "approved",
      applied: true,
      rolledBackAtUtc: null,
    });
    expect(applied.brain.recommendationInfluenceProposals?.[0].appliedAtUtc).not.toBeNull();
    expect(applyImagineXRecommendationInfluence(applied, proposalId)).toBe(applied);

    const revoked = setImagineXLocalLearningEnabled(applied, false);
    const rolledBack = rollbackImagineXRecommendationInfluence(revoked, proposalId);
    expect(rolledBack.brain.recommendationInfluenceProposals?.[0]).toMatchObject({
      applied: false,
    });
    expect(rolledBack.brain.recommendationInfluenceProposals?.[0].rolledBackAtUtc).not.toBeNull();
    expect(rollbackImagineXRecommendationInfluence(rolledBack, proposalId)).toBe(rolledBack);
  });

  it("blocks learning creation, approval, and activation when effective authority is denied", () => {
    let project = setImagineXLocalLearningEnabled(
      createProjectDraft({ name: "Policy", intent: "", targetStudioId: "brain-x" }),
      true,
    );
    project = recordImagineXProposalOutcome(project, {
      proposalId: "policy-outcome",
      studioId: "brain-x",
      intent: "Policy-controlled result",
      providerRoutes: [],
      status: "accepted",
      outputObjectCount: 0,
    });
    project = recordImagineXOutcomeFeedback(project, {
      proposalId: "policy-outcome",
      rating: 5,
      feedback: "Prefer restrained typography.",
    });
    const denied = {
      requestedEnabled: true,
      effectiveEnabled: false,
      scope: "local_workspace" as const,
      source: "workspace_policy" as const,
      reason: "Workspace policy disables learning.",
    };

    expect(previewImagineXPreferenceCandidate(project, "policy-outcome", denied)).toBe(project);

    project.brain.preferenceCandidates = [{
      contractVersion: "imagine-x-preference-candidate.v1",
      id: "policy-candidate",
      sourceOutcomeId: "policy-outcome",
      scope: "local_workspace",
      proposedPreference: "Prefer restrained typography.",
      explanation: "Based on explicit feedback.",
      status: "pending_review",
      applied: false,
      createdAtUtc: "2026-08-01T00:00:00.000Z",
      approvedAtUtc: null,
    }];
    expect(approveImagineXPreferenceCandidate(project, "policy-candidate", denied)).toBe(project);

    project.brain.preferenceCandidates[0] = {
      ...project.brain.preferenceCandidates[0],
      status: "approved",
      approvedAtUtc: "2026-08-01T00:01:00.000Z",
    };
    expect(previewImagineXRecommendationInfluence(project, denied)).toBe(project);

    project.brain.recommendationInfluenceProposals = [{
      contractVersion: "imagine-x-recommendation-influence.v1",
      id: "policy-influence",
      scope: "local_workspace",
      sourceCandidateIds: ["policy-candidate"],
      proposedInfluences: ["Prefer restrained typography."],
      explanation: "Explicit preview.",
      status: "pending_review",
      applied: false,
      createdAtUtc: "2026-08-01T00:02:00.000Z",
      decidedAtUtc: null,
      appliedAtUtc: null,
      rolledBackAtUtc: null,
    }];
    expect(decideImagineXRecommendationInfluence(project, {
      proposalId: "policy-influence",
      decision: "approved",
    }, denied)).toBe(project);

    project.brain.recommendationInfluenceProposals[0] = {
      ...project.brain.recommendationInfluenceProposals[0],
      status: "approved",
      decidedAtUtc: "2026-08-01T00:03:00.000Z",
    };
    expect(applyImagineXRecommendationInfluence(project, "policy-influence", denied)).toBe(project);
  });
});
