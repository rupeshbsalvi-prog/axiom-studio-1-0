import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { generateBrainPlan } from "../../services/brainApi";
import type { BrainPlanResponse } from "../../services/brainTypes";
import {
  recordImagineXOutcomeFeedback,
  recordImagineXProposalOutcome,
} from "../../services/ImagineXOutcomeService";
import { createProjectDraft, type AxiomProjectDraft } from "../../projects/projectDraft";
import {
  clearCanvasPreviewIntakeState,
  serializeCanvasPreviewState,
} from "../../../workspace/CanvasPreviewIntakeService";
import {
  createWorkspacePlanGeneratedEvent,
  createWorkspaceRecommendationInfluenceAppliedEvent,
  createWorkspaceRecommendationInfluenceRolledBackEvent,
} from "../../../workspace/WorkspaceAuditService";
import { BrainXPanel } from "./BrainXPanel";

vi.mock("../../services/brainApi", () => ({
  generateBrainPlan: vi.fn(),
}));

vi.mock("./BrainXRuntimeAuthority", () => ({
  evaluateBrainXRuntimeAuthority: vi.fn(() => ({
    allowed: true,
    message: "",
  })),
  createBrainXAuthorityBlockedAuditEvent: vi.fn(),
}));

vi.mock("../../../workspace/WorkspaceAuditService", () => ({
  recordWorkspaceAuditEvent: vi.fn(),
  createWorkspaceIntentReceivedEvent: vi.fn((event) => event),
  createWorkspacePlanGeneratedEvent: vi.fn((event) => event),
  createWorkspaceRecommendationInfluenceAppliedEvent: vi.fn((event) => event),
  createWorkspaceRecommendationInfluenceRolledBackEvent: vi.fn((event) => event),
  createWorkspaceProposalAcceptedEvent: vi.fn((event) => event),
  createWorkspaceProposalRejectedEvent: vi.fn((event) => event),
  createWorkspaceExportRequestedEvent: vi.fn((event) => event),
  createWorkspaceProviderCalledEvent: vi.fn((event) => event),
  createCanvasPreviewIntakeReceivedEvent: vi.fn((event) => event),
  createCanvasPreviewAssemblyApprovedEvent: vi.fn((event) => event),
  createCanvasPreviewAssemblyRejectedEvent: vi.fn((event) => event),
  clearWorkspaceAuditEvents: vi.fn(),
  getWorkspaceAuditEvents: vi.fn(() => []),
}));

const plan: BrainPlanResponse = {
  requestId: "brain_plan_ui",
  intent: "Create a product poster",
  summary: "Local poster plan",
  objectives: [{ id: "obj_1", title: "Compose", description: "Build the poster." }],
  delegatedTasks: [
    {
      id: "task_1",
      title: "Create the image composition.",
      studio: "Photo Studio",
      priority: "high",
      status: "proposed",
    },
  ],
  confidence: 0.92,
  provider: { name: "local-imagine-x-planner", mode: "local", version: "0.2.0" },
  routes: [
    {
      taskId: "task_1",
      studio: "Photo Studio",
      provider: "local-studio-router",
      mode: "dry-run",
      reason: "Raster composition requested.",
    },
  ],
  guardian: {
    status: "passed",
    summary: "The plan is ready for user review.",
    checks: [
      {
        id: "execution_safety",
        status: "passed",
        message: "No provider execution is authorized.",
      },
    ],
  },
  proposal: {
    id: "proposal_ui",
    status: "awaiting_user_approval",
    requiresUserApproval: true,
    providerExecutionAllowed: false,
  },
  audit: [],
};

describe("BrainXPanel local plan visibility", () => {
  beforeEach(() => {
    clearCanvasPreviewIntakeState();
  });

  it("uses the shared production panel without hiding governed planning", () => {
    render(<BrainXPanel />);

    const workspace = screen.getByRole("region", { name: "Brain X production workspace" });
    expect(workspace).toHaveAttribute("data-design-language", "axiom-pro-panel-v1");
    expect(within(workspace).getByRole("complementary", { name: "Brain X mission navigator" })).toBeInTheDocument();
    expect(within(workspace).getByRole("region", { name: "Brain X reasoning canvas" })).toBeInTheDocument();
    expect(within(workspace).getByRole("complementary", { name: "Brain X authority inspector" })).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Enter creative intent/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Generate Plan" })).toBeDisabled();
  });

  it("shows routes, Guardian critique, and the approval boundary", async () => {
    vi.mocked(generateBrainPlan).mockResolvedValueOnce(plan);
    const user = userEvent.setup();
    render(<BrainXPanel />);

    await user.type(screen.getByPlaceholderText(/Enter creative intent/i), plan.intent);
    await user.click(screen.getByRole("button", { name: "Generate Plan" }));

    expect(await screen.findByText("Photo Studio · dry-run")).toBeInTheDocument();
    expect(screen.getByText("Raster composition requested.")).toBeInTheDocument();
    expect(screen.getByText("Guardian: passed")).toBeInTheDocument();
    expect(screen.getByText("The plan is ready for user review.")).toBeInTheDocument();
    expect(screen.getByText("No provider execution is authorized.")).toBeInTheDocument();
    expect(screen.getByText("Approval required · provider execution blocked")).toBeInTheDocument();
  });

  it("shows a read-only influenced-versus-baseline rating summary", () => {
    let project = createProjectDraft({
      name: "Influence evaluation",
      intent: "",
      targetStudioId: "brain-x",
    });
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
    const onUpdateProject = vi.fn();

    render(<BrainXPanel project={project} onUpdateProject={onUpdateProject} />);

    expect(screen.getByRole("region", { name: "Influence evaluation" })).toHaveTextContent(
      "Baseline: 1 rated · 3.0 average"
    );
    expect(screen.getByText("Influenced: 1 rated · 5.0 average")).toBeInTheDocument();
    expect(screen.getByText("Baseline ratings 1→5: 0 / 0 / 1 / 0 / 0")).toBeInTheDocument();
    expect(screen.getByText("Influenced ratings 1→5: 0 / 0 / 0 / 0 / 1")).toBeInTheDocument();
    expect(screen.getByText("Observed difference: +2.0")).toBeInTheDocument();
    expect(screen.getByText("influence-active: 1 rated · 5.0 average")).toBeInTheDocument();
    expect(screen.getByText("Proposal ratings 1→5: 0 / 0 / 0 / 0 / 1")).toBeInTheDocument();
    expect(screen.getByText("Prefer restrained typography.")).toBeInTheDocument();
    expect(screen.getByText("Descriptive only · no preference changes")).toBeInTheDocument();
    expect(onUpdateProject).not.toHaveBeenCalled();
  });

  it("passes the active local influence into plan generation and shows its exact effect", async () => {
    const influencedPlan = {
      ...plan,
      recommendationInfluences: ["Prefer restrained typography."],
      recommendationInfluenceSource: {
        proposalId: "influence-active",
        appliedAtUtc: "2026-07-26T00:02:00.000Z",
      },
    };
    vi.mocked(generateBrainPlan).mockResolvedValueOnce(influencedPlan);
    const onUpdateProject = vi.fn();
    const project = createProjectDraft({
      name: "Influenced plan",
      intent: plan.intent,
      targetStudioId: "brain-x",
    });
    project.brain.learningControl = {
      contractVersion: "imagine-x-learning-control.v1",
      enabled: true,
      scope: "local_workspace",
      consent: "granted",
      updatedAtUtc: "2026-07-26T00:00:00.000Z",
    };
    project.brain.recommendationInfluenceProposals = [{
      contractVersion: "imagine-x-recommendation-influence.v1",
      id: "influence-active",
      scope: "local_workspace",
      sourceCandidateIds: ["candidate-active"],
      proposedInfluences: ["Prefer restrained typography."],
      explanation: "Approved local preference.",
      status: "approved",
      applied: true,
      createdAtUtc: "2026-07-26T00:00:00.000Z",
      decidedAtUtc: "2026-07-26T00:01:00.000Z",
      appliedAtUtc: "2026-07-26T00:02:00.000Z",
      rolledBackAtUtc: null,
    }];
    const user = userEvent.setup();
    render(<BrainXPanel project={project} onUpdateProject={onUpdateProject} />);

    await user.type(screen.getByPlaceholderText(/Enter creative intent/i), plan.intent);
    await user.click(screen.getByRole("button", { name: "Generate Plan" }));

    expect(generateBrainPlan).toHaveBeenCalledWith({
      intent: plan.intent,
      recommendationInfluences: ["Prefer restrained typography."],
      recommendationInfluenceSource: {
        proposalId: "influence-active",
        appliedAtUtc: "2026-07-26T00:02:00.000Z",
      },
    });
    expect(await screen.findByText("Applied local influence: Prefer restrained typography.")).toBeInTheDocument();
    expect(screen.getByText("Influence source: influence-active · applied 2026-07-26T00:02:00.000Z")).toBeInTheDocument();
    expect(screen.getByText("Provider routes unchanged.")).toBeInTheDocument();
    expect(createWorkspacePlanGeneratedEvent).toHaveBeenCalledWith(expect.objectContaining({
      metadata: {
        recommendationInfluenceSource: {
          proposalId: "influence-active",
          appliedAtUtc: "2026-07-26T00:02:00.000Z",
        },
        recommendationInfluences: ["Prefer restrained typography."],
      },
    }));
    await user.click(screen.getByRole("button", { name: "Reject Proposal" }));
    expect(onUpdateProject).toHaveBeenCalledWith(expect.objectContaining({
      brain: expect.objectContaining({
        outcomes: [
          expect.objectContaining({
            status: "rejected",
            recommendationInfluence: {
              proposalId: "influence-active",
              appliedAtUtc: "2026-07-26T00:02:00.000Z",
              influences: ["Prefer restrained typography."],
            },
          }),
        ],
      }),
    }));
  });

  it("stages an accepted Photo Studio route for provider review without execution", async () => {
    vi.mocked(generateBrainPlan).mockResolvedValueOnce(plan);
    const user = userEvent.setup();
    const onUpdateProject = vi.fn();
    const project = createProjectDraft({
      name: "Brain outcome",
      intent: plan.intent,
      targetStudioId: "brain-x",
    });
    render(<BrainXPanel project={project} onUpdateProject={onUpdateProject} />);

    await user.type(screen.getByPlaceholderText(/Enter creative intent/i), plan.intent);
    await user.click(screen.getByRole("button", { name: "Generate Plan" }));
    await user.click(await screen.findByRole("button", { name: "Accept Proposal" }));

    const [candidate] = serializeCanvasPreviewState().candidates;
    expect(candidate.preview.metadata?.providerRequest).toMatchObject({
      contractVersion: "photo-provider-request.v1",
      studioId: "photo",
      approval: { approvedForProviderExecution: false },
      security: {
        dryRun: true,
        providerExecutionAllowed: false,
        providerExecuted: false,
        noExecutionPerformed: true,
      },
    });
    expect(candidate.status).toBe("pending_review");
    expect(onUpdateProject).toHaveBeenCalledWith(
      expect.objectContaining({
        canvasPreview: expect.objectContaining({
          candidates: expect.arrayContaining([expect.objectContaining({ id: candidate.id })]),
        }),
        brain: expect.objectContaining({
          outcomes: expect.arrayContaining([
            expect.objectContaining({
              proposalId: plan.proposal.id,
              studioId: "photo",
              status: "accepted",
              learning: { consent: "not_requested", applied: false },
            }),
          ]),
        }),
      })
    );
  });

  it("records a rejected proposal outcome locally without applying learning", async () => {
    vi.mocked(generateBrainPlan).mockResolvedValueOnce(plan);
    const user = userEvent.setup();
    const onUpdateProject = vi.fn();
    const project = {
      manifest: { id: "p1", updatedAt: "", authoredStudios: [] },
      brain: { recentPrompts: [], modelByStudio: {}, notes: [], outcomes: [] },
    } as unknown as AxiomProjectDraft;
    render(<BrainXPanel project={project} onUpdateProject={onUpdateProject} />);

    await user.type(screen.getByPlaceholderText(/Enter creative intent/i), plan.intent);
    await user.click(screen.getByRole("button", { name: "Generate Plan" }));
    await user.click(await screen.findByRole("button", { name: "Reject Proposal" }));

    expect(onUpdateProject).toHaveBeenCalledWith(
      expect.objectContaining({
        brain: expect.objectContaining({
          outcomes: [
            expect.objectContaining({
              proposalId: plan.proposal.id,
              status: "rejected",
              outputObjectCount: 0,
              learning: { consent: "not_requested", applied: false },
            }),
          ],
        }),
      })
    );
  });

  it("lets the user save and inspect explicit outcome feedback", async () => {
    vi.mocked(generateBrainPlan).mockResolvedValueOnce(plan);
    const user = userEvent.setup();
    const initialProject = createProjectDraft({
      name: "Feedback",
      intent: plan.intent,
      targetStudioId: "brain-x",
    });
    const updates = vi.fn();
    function Harness() {
      const [project, setProject] = useState(initialProject);
      return <BrainXPanel project={project} onUpdateProject={(next) => {
        updates(next);
        setProject(next);
      }} />;
    }
    render(<Harness />);

    await user.type(screen.getByPlaceholderText(/Enter creative intent/i), plan.intent);
    await user.click(screen.getByRole("button", { name: "Generate Plan" }));
    await user.click(await screen.findByRole("button", { name: "Accept Proposal" }));
    await user.selectOptions(await screen.findByLabelText("Outcome rating"), "5");
    await user.type(screen.getByLabelText("Outcome feedback"), "Strong direction and clear layers.");
    await user.click(screen.getByRole("button", { name: "Save Outcome Feedback" }));

    const savedProject = updates.mock.calls.at(-1)?.[0] as AxiomProjectDraft;
    expect(savedProject.brain.outcomes?.[0]).toMatchObject({
      proposalId: plan.proposal.id,
      rating: 5,
      feedback: "Strong direction and clear layers.",
      learning: { consent: "not_requested", applied: false },
    });
    expect(screen.getByText("Saved rating: 5/5")).toBeInTheDocument();
    expect(screen.getByText("Learning remains disabled for this outcome.")).toBeInTheDocument();
  });

  it("requires an explicit save to enable or revoke project-local learning", async () => {
    vi.mocked(generateBrainPlan).mockResolvedValueOnce(plan);
    const user = userEvent.setup();
    const initialProject = createProjectDraft({
      name: "Learning control",
      intent: plan.intent,
      targetStudioId: "brain-x",
    });
    const updates = vi.fn();
    function Harness() {
      const [project, setProject] = useState(initialProject);
      return <BrainXPanel project={project} onUpdateProject={(next) => {
        updates(next);
        setProject(next);
      }} />;
    }
    render(<Harness />);

    await user.type(screen.getByPlaceholderText(/Enter creative intent/i), plan.intent);
    await user.click(screen.getByRole("button", { name: "Generate Plan" }));
    await user.click(await screen.findByRole("button", { name: "Accept Proposal" }));

    const checkbox = screen.getByRole("checkbox", {
      name: "Allow local-only learning for this project",
    });
    expect(checkbox).not.toBeChecked();
    expect(screen.getByText("Local learning: disabled.")).toBeInTheDocument();

    await user.click(checkbox);
    expect(updates.mock.calls.at(-1)?.[0].brain.learningControl.enabled).toBe(false);
    await user.click(screen.getByRole("button", { name: "Save Learning Setting" }));

    const enabledProject = updates.mock.calls.at(-1)?.[0] as AxiomProjectDraft;
    expect(enabledProject.brain.learningControl).toMatchObject({
      enabled: true,
      scope: "local_workspace",
      consent: "granted",
    });
    expect(enabledProject.brain.outcomes?.[0].learning).toEqual({
      consent: "not_requested",
      applied: false,
    });
    expect(screen.getByText("Local learning: enabled for this project only.")).toBeInTheDocument();

    await user.click(checkbox);
    await user.click(screen.getByRole("button", { name: "Save Learning Setting" }));
    expect(updates.mock.calls.at(-1)?.[0].brain.learningControl).toMatchObject({
      enabled: false,
      scope: "local_workspace",
      consent: "not_granted",
    });
    expect(screen.getByText("Local learning: disabled.")).toBeInTheDocument();
  });

  it("previews explicit feedback as a preference candidate and requires separate approval", async () => {
    vi.mocked(generateBrainPlan).mockResolvedValueOnce(plan);
    const user = userEvent.setup();
    const initialProject = createProjectDraft({
      name: "Preference preview",
      intent: plan.intent,
      targetStudioId: "brain-x",
    });
    const updates = vi.fn();
    function Harness() {
      const [project, setProject] = useState(initialProject);
      return <BrainXPanel project={project} onUpdateProject={(next) => {
        updates(next);
        setProject(next);
      }} />;
    }
    render(<Harness />);

    await user.type(screen.getByPlaceholderText(/Enter creative intent/i), plan.intent);
    await user.click(screen.getByRole("button", { name: "Generate Plan" }));
    await user.click(await screen.findByRole("button", { name: "Accept Proposal" }));
    await user.selectOptions(screen.getByLabelText("Outcome rating"), "5");
    await user.type(
      screen.getByLabelText("Outcome feedback"),
      "Keep the restrained typography and generous spacing."
    );
    await user.click(screen.getByRole("button", { name: "Save Outcome Feedback" }));

    const previewButton = screen.getByRole("button", { name: "Preview Preference Candidate" });
    expect(previewButton).toBeDisabled();
    await user.click(screen.getByRole("checkbox", {
      name: "Allow local-only learning for this project",
    }));
    await user.click(screen.getByRole("button", { name: "Save Learning Setting" }));
    expect(previewButton).toBeEnabled();
    await user.click(previewButton);

    expect(screen.getAllByText("Keep the restrained typography and generous spacing.")).toHaveLength(2);
    expect(screen.getByText("Based on your explicit 5/5 rating and feedback.")).toBeInTheDocument();
    expect(screen.getByText("Pending explicit approval · not applied")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /^Approve Preference Candidate:/ }));
    const approvedProject = updates.mock.calls.at(-1)?.[0] as AxiomProjectDraft;
    expect(approvedProject.brain.preferenceCandidates?.[0]).toMatchObject({
      status: "approved",
      applied: false,
      scope: "local_workspace",
    });
    expect(screen.getByText("Approved · still not applied")).toBeInTheDocument();

    await user.click(screen.getByRole("checkbox", {
      name: "Allow local-only learning for this project",
    }));
    await user.click(screen.getByRole("button", { name: "Save Learning Setting" }));
    await user.click(screen.getByRole("button", { name: /^Delete Preference Candidate:/ }));

    expect(updates.mock.calls.at(-1)?.[0].brain.preferenceCandidates).toEqual([]);
    expect(screen.queryByText("Preference preview")).not.toBeInTheDocument();
  });

  it("shows the local preference profile, exports it, and requires confirmation to reset", async () => {
    const user = userEvent.setup();
    const initialProject = createProjectDraft({
      name: "Preference profile",
      intent: "",
      targetStudioId: "brain-x",
    });
    initialProject.brain.preferenceCandidates = [{
      contractVersion: "imagine-x-preference-candidate.v1",
      id: "candidate-profile",
      sourceOutcomeId: "outcome-profile",
      scope: "local_workspace",
      proposedPreference: "Prefer restrained typography.",
      explanation: "Based on your explicit 5/5 rating and feedback.",
      status: "approved",
      applied: false,
      createdAtUtc: "2026-07-26T00:00:00.000Z",
      approvedAtUtc: "2026-07-26T00:01:00.000Z",
    }];
    const updates = vi.fn();
    const createObjectURL = vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:profile");
    const revokeObjectURL = vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => undefined);
    const anchorClick = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => undefined);
    function Harness() {
      const [project, setProject] = useState(initialProject);
      return <BrainXPanel project={project} onUpdateProject={(next) => {
        updates(next);
        setProject(next);
      }} />;
    }
    render(<Harness />);

    expect(screen.getByRole("region", { name: "Local preference profile" })).toHaveTextContent(
      "Prefer restrained typography."
    );
    expect(screen.getByText("1 saved candidate")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Preview Recommendation Influence" })).toBeDisabled();
    await user.click(screen.getByRole("button", { name: "Export Preference Profile" }));
    expect(createObjectURL).toHaveBeenCalledOnce();
    expect(anchorClick).toHaveBeenCalledOnce();
    expect(revokeObjectURL).toHaveBeenCalledWith("blob:profile");

    await user.click(screen.getByRole("button", { name: "Reset Preference Profile" }));
    expect(screen.getByText("Reset removes every saved preference candidate.")).toBeInTheDocument();
    expect(updates).not.toHaveBeenCalled();
    await user.click(screen.getByRole("button", { name: "Confirm Reset Preference Profile" }));

    expect(updates.mock.calls.at(-1)?.[0].brain.preferenceCandidates).toEqual([]);
    expect(screen.getByText("No preference candidates.")).toBeInTheDocument();
    createObjectURL.mockRestore();
    revokeObjectURL.mockRestore();
    anchorClick.mockRestore();
  });

  it("shows an auditable recommendation influence preview without changing recommendations", async () => {
    const user = userEvent.setup();
    const initialProject = createProjectDraft({
      name: "Recommendation influence",
      intent: "",
      targetStudioId: "brain-x",
    });
    initialProject.brain.learningControl = {
      contractVersion: "imagine-x-learning-control.v1",
      enabled: true,
      scope: "local_workspace",
      consent: "granted",
      updatedAtUtc: "2026-07-26T00:00:00.000Z",
    };
    initialProject.brain.preferenceCandidates = [{
      contractVersion: "imagine-x-preference-candidate.v1",
      id: "candidate-influence",
      sourceOutcomeId: "outcome-influence",
      scope: "local_workspace",
      proposedPreference: "Prefer restrained typography.",
      explanation: "Based on explicit feedback.",
      status: "approved",
      applied: false,
      createdAtUtc: "2026-07-26T00:00:00.000Z",
      approvedAtUtc: "2026-07-26T00:01:00.000Z",
    }];
    const updates = vi.fn();
    function Harness() {
      const [project, setProject] = useState(initialProject);
      return <BrainXPanel project={project} onUpdateProject={(next) => {
        updates(next);
        setProject(next);
      }} />;
    }
    render(<Harness />);

    await user.click(screen.getByRole("button", { name: "Preview Recommendation Influence" }));

    const previewed = updates.mock.calls.at(-1)?.[0] as AxiomProjectDraft;
    expect(previewed.brain.recommendationInfluenceProposals?.[0]).toMatchObject({
      sourceCandidateIds: ["candidate-influence"],
      proposedInfluences: ["Prefer restrained typography."],
      status: "pending_review",
      applied: false,
    });
    expect(previewed.brain.preferenceCandidates?.[0].applied).toBe(false);
    expect(screen.getByText("Recommendation influence preview")).toBeInTheDocument();
    expect(screen.getByText(
      "Preview based on 1 explicitly approved local preference candidate."
    )).toBeInTheDocument();
    expect(screen.getByText("Before: No preference influence applied")).toBeInTheDocument();
    expect(screen.getByText("After preview: Prefer restrained typography.")).toBeInTheDocument();
    expect(screen.getByText("Pending review · no recommendation changed")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Reject Influence Preview" })).toBeEnabled();
    await user.click(screen.getByRole("button", { name: "Approve Influence Preview" }));

    const approved = updates.mock.calls.at(-1)?.[0] as AxiomProjectDraft;
    expect(approved.brain.recommendationInfluenceProposals?.[0]).toMatchObject({
      status: "approved",
      applied: false,
    });
    expect(screen.getAllByText("Approved · still not applied")).toHaveLength(2);
    expect(screen.queryByRole("button", { name: "Approve Influence Preview" })).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Apply Influence Locally" }));

    const applied = updates.mock.calls.at(-1)?.[0] as AxiomProjectDraft;
    expect(applied.brain.recommendationInfluenceProposals?.[0]).toMatchObject({
      applied: true,
    });
    expect(createWorkspaceRecommendationInfluenceAppliedEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        metadata: expect.objectContaining({
          proposalId: applied.brain.recommendationInfluenceProposals?.[0].id,
          influences: ["Prefer restrained typography."],
          appliedAtUtc: expect.any(String),
        }),
      })
    );
    expect(screen.getByText("Applied to local recommendations")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Rollback Influence" }));

    const rolledBack = updates.mock.calls.at(-1)?.[0] as AxiomProjectDraft;
    expect(rolledBack.brain.recommendationInfluenceProposals?.[0]).toMatchObject({
      applied: false,
    });
    expect(createWorkspaceRecommendationInfluenceRolledBackEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        metadata: expect.objectContaining({
          proposalId: rolledBack.brain.recommendationInfluenceProposals?.[0].id,
          influences: ["Prefer restrained typography."],
          rolledBackAtUtc: expect.any(String),
        }),
      })
    );
    expect(screen.getByText("Rolled back · not applied")).toBeInTheDocument();
  });

  it("records a manual evaluation decision without executing rollback", async () => {
    const user = userEvent.setup();
    let initialProject = createProjectDraft({
      name: "Evaluation decision",
      intent: "",
      targetStudioId: "brain-x",
    });
    initialProject.brain.recommendationInfluenceProposals = [{
      contractVersion: "imagine-x-recommendation-influence.v1",
      id: "influence-reviewed",
      scope: "local_workspace",
      sourceCandidateIds: [],
      proposedInfluences: ["Prefer restrained typography."],
      explanation: "Approved by the user.",
      status: "approved",
      applied: true,
      createdAtUtc: "2026-07-26T00:00:00.000Z",
      decidedAtUtc: "2026-07-26T00:01:00.000Z",
      appliedAtUtc: "2026-07-26T00:02:00.000Z",
      rolledBackAtUtc: null,
    }];
    initialProject.brain.influenceEvaluationDecisions = [{
      contractVersion: "imagine-x-influence-evaluation-decision.v1",
      id: "decision-older",
      proposalId: "influence-older",
      decision: "keep",
      rationale: "Earlier explicit decision.",
      recordedAtUtc: "2026-07-26T00:03:00.000Z",
      evidence: {
        contractVersion: "imagine-x-influence-evaluation.v1",
        baseline: { ratedOutcomeCount: 1, averageRating: 3, ratingDistribution: [0, 0, 1, 0, 0] },
        influenced: { ratedOutcomeCount: 1, averageRating: 4, ratingDistribution: [0, 0, 0, 1, 0] },
        observedDifference: 1,
        byInfluenceProposal: [{
          proposalId: "influence-older",
          influences: ["Prefer compact layouts."],
          ratedOutcomeCount: 1,
          averageRating: 4,
          ratingDistribution: [0, 0, 0, 1, 0],
        }],
      },
    }];
    initialProject = recordImagineXProposalOutcome(initialProject, {
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
    initialProject = recordImagineXOutcomeFeedback(initialProject, {
      proposalId: "outcome-reviewed",
      rating: 4,
      feedback: "",
    });
    const updates = vi.fn();
    function Harness() {
      const [project, setProject] = useState(initialProject);
      return <BrainXPanel project={project} onUpdateProject={(next) => {
        updates(next);
        setProject(next);
      }} />;
    }
    render(<Harness />);

    await user.selectOptions(screen.getByLabelText("Evaluation decision"), "rollback");
    await user.type(screen.getByLabelText("Evaluation rationale"), "Needs more evidence.");
    await user.click(screen.getByRole("button", { name: "Record Evaluation Decision" }));

    const decided = updates.mock.calls.at(-1)?.[0] as AxiomProjectDraft;
    expect(decided.brain.influenceEvaluationDecisions?.at(-1)).toMatchObject({
      proposalId: "influence-reviewed",
      decision: "rollback",
      rationale: "Needs more evidence.",
    });
    expect(decided.brain.recommendationInfluenceProposals?.[0].applied).toBe(true);
    expect(screen.getByText("Recorded: rollback · no action executed")).toBeInTheDocument();

    const history = screen.getByRole("region", { name: "Evaluation decision history" });
    expect(history).toHaveTextContent("influence-older");
    expect(history).toHaveTextContent("Earlier explicit decision.");
    expect(history).toHaveTextContent("influence-reviewed");
    expect(history).toHaveTextContent("Needs more evidence.");
    expect(history).toHaveTextContent("Frozen evidence");

    await user.click(within(history).getByRole("button", {
      name: "Delete Evaluation Decision: influence-older",
    }));
    const afterDelete = updates.mock.calls.at(-1)?.[0] as AxiomProjectDraft;
    expect(afterDelete.brain.influenceEvaluationDecisions).toHaveLength(1);
    expect(afterDelete.brain.influenceEvaluationDecisions?.[0].proposalId).toBe("influence-reviewed");
    expect(afterDelete.brain.recommendationInfluenceProposals?.[0].applied).toBe(true);
  });

  it("discloses workspace denial and keeps destructive user controls available", () => {
    const project = createProjectDraft({
      name: "Policy disclosure",
      intent: "",
      targetStudioId: "brain-x",
    });
    project.brain.learningControl = {
      contractVersion: "imagine-x-learning-control.v1",
      enabled: true,
      scope: "local_workspace",
      consent: "granted",
      updatedAtUtc: "2026-08-01T00:00:00.000Z",
    };
    project.brain.preferenceCandidates = [{
      contractVersion: "imagine-x-preference-candidate.v1",
      id: "policy-candidate",
      sourceOutcomeId: "policy-outcome",
      scope: "local_workspace",
      proposedPreference: "Prefer restrained typography.",
      explanation: "Based on explicit feedback.",
      status: "pending_review",
      applied: false,
      createdAtUtc: "2026-08-01T00:01:00.000Z",
      approvedAtUtc: null,
    }];

    render(<BrainXPanel
      project={project}
      onUpdateProject={vi.fn()}
      workspaceLearningPolicy={{
        status: "verified",
        authority: {
          contractVersion: "axiom-workspace-learning-authority.v1",
          membership: {
            workspaceId: "workspace-local",
            memberId: "member-local",
            role: "admin",
            status: "active",
          },
          policy: {
            policyId: "workspace-local:learning",
            policyVersion: 1,
            workspaceId: "workspace-local",
            learningAllowed: false,
            allowedScopes: ["local_workspace"],
            policyRequired: true,
            source: "server_configuration",
          },
        },
      }}
    />);

    const disclosure = screen.getByRole("region", { name: "Learning authority" });
    expect(disclosure).toHaveTextContent("Requested: enabled · local_workspace");
    expect(disclosure).toHaveTextContent("Effective: blocked");
    expect(disclosure).toHaveTextContent("Policy source: workspace_policy");
    expect(disclosure).toHaveTextContent("Workspace policy disables learning.");
    expect(screen.getByRole("button", { name: /^Approve Preference Candidate:/ })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Preview Recommendation Influence" })).toBeDisabled();
    expect(screen.getByRole("button", { name: /^Delete Preference Candidate:/ })).toBeEnabled();
    expect(screen.getByRole("button", { name: "Export Preference Profile" })).toBeEnabled();
    expect(screen.getByRole("button", { name: "Reset Preference Profile" })).toBeEnabled();
  });

  it("does not use an active influence while effective learning authority is denied", async () => {
    vi.mocked(generateBrainPlan).mockResolvedValueOnce(plan);
    const project = createProjectDraft({
      name: "Policy-blocked influence",
      intent: plan.intent,
      targetStudioId: "brain-x",
    });
    project.brain.learningControl = {
      contractVersion: "imagine-x-learning-control.v1",
      enabled: true,
      scope: "local_workspace",
      consent: "granted",
      updatedAtUtc: "2026-08-01T00:00:00.000Z",
    };
    project.brain.recommendationInfluenceProposals = [{
      contractVersion: "imagine-x-recommendation-influence.v1",
      id: "policy-active",
      scope: "local_workspace",
      sourceCandidateIds: [],
      proposedInfluences: ["Prefer restrained typography."],
      explanation: "Previously approved.",
      status: "approved",
      applied: true,
      createdAtUtc: "2026-08-01T00:00:00.000Z",
      decidedAtUtc: "2026-08-01T00:01:00.000Z",
      appliedAtUtc: "2026-08-01T00:02:00.000Z",
      rolledBackAtUtc: null,
    }];
    const user = userEvent.setup();

    render(<BrainXPanel
      project={project}
      workspaceLearningPolicy={{ status: "required_unavailable" }}
    />);
    await user.type(screen.getByPlaceholderText(/Enter creative intent/i), plan.intent);
    await user.click(screen.getByRole("button", { name: "Generate Plan" }));

    expect(generateBrainPlan).toHaveBeenCalledWith({
      intent: plan.intent,
      recommendationInfluences: [],
      recommendationInfluenceSource: undefined,
    });
    expect(screen.getByRole("region", { name: "Learning authority" })).toHaveTextContent(
      "Required workspace policy is unavailable.",
    );
    expect(screen.getByRole("button", { name: "Rollback Influence" })).toBeEnabled();
  });
});
