import { describe, expect, it, vi } from "vitest";
import { generateBrainPlan } from "./brainApi";

const canonicalPlan = {
  requestId: "brain_plan_123",
  intent: "Create a launch campaign",
  summary: "Launch campaign plan",
  objectives: [{ id: "obj_1", title: "Direction", description: "Set direction" }],
  delegatedTasks: [
    {
      id: "task_1",
      title: "Create hero",
      studio: "Photo Studio",
      priority: "high",
      status: "proposed",
    },
  ],
  confidence: 0.92,
  provider: { name: "mock-planner", mode: "mock", version: "0.1.0" },
  routes: [
    {
      taskId: "task_1",
      studio: "Photo Studio",
      provider: "local-studio-router",
      mode: "dry-run",
      reason: "Image output requested.",
    },
  ],
  guardian: {
    status: "passed",
    summary: "Plan is ready for user review.",
    checks: [
      {
        id: "route_coverage",
        status: "passed",
        message: "Every task has a route.",
      },
    ],
  },
  proposal: {
    id: "proposal_123",
    status: "awaiting_user_approval",
    requiresUserApproval: true,
    providerExecutionAllowed: false,
  },
  audit: [
    {
      id: "audit_1",
      type: "plan_generated",
      timestamp: "2026-07-26T00:00:00Z",
      title: "Plan generated",
      description: null,
      metadata: { source: "local" },
    },
  ],
};

describe("generateBrainPlan contract boundary", () => {
  it("accepts the canonical backend contract", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(JSON.stringify(canonicalPlan), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );

    const plan = await generateBrainPlan({ intent: canonicalPlan.intent });

    expect(plan.provider.version).toBe("0.1.0");
    expect(plan.delegatedTasks[0].status).toBe("proposed");
    expect(plan.guardian.status).toBe("passed");
    expect(plan.proposal.requiresUserApproval).toBe(true);
  });

  it("fails closed to the local contract when backend data drifts", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          ...canonicalPlan,
          guardian: undefined,
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      ),
    );

    const plan = await generateBrainPlan({ intent: canonicalPlan.intent });

    expect(plan.provider).toEqual({
      name: "frontend-fallback-mock",
      mode: "fallback",
      version: "0.1.0",
    });
  });

  it("preserves active local recommendation influences in fallback plans", async () => {
    vi.mocked(fetch).mockRejectedValueOnce(new Error("offline"));

    const plan = await generateBrainPlan({
      intent: canonicalPlan.intent,
      recommendationInfluences: ["Prefer restrained typography."],
      recommendationInfluenceSource: {
        proposalId: "influence-active",
        appliedAtUtc: "2026-07-26T00:02:00.000Z",
      },
    });

    expect(plan.recommendationInfluences).toEqual(["Prefer restrained typography."]);
    expect(plan.recommendationInfluenceSource).toEqual({
      proposalId: "influence-active",
      appliedAtUtc: "2026-07-26T00:02:00.000Z",
    });
    expect(plan.objectives).toContainEqual(expect.objectContaining({
      title: "Apply approved local preferences",
      description: "Prefer restrained typography.",
    }));
    expect(plan.audit).toContainEqual(expect.objectContaining({
      type: "recommendation_influence_applied",
      metadata: {
        proposalId: "influence-active",
        appliedAtUtc: "2026-07-26T00:02:00.000Z",
      },
    }));
    expect(plan.proposal.providerExecutionAllowed).toBe(false);
  });
});
