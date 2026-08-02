import type {
  BrainPlanRequest,
  BrainPlanResponse,
  ReplayAuditEvent,
} from "./brainTypes";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isRecommendationInfluenceSource(value: unknown): boolean {
  return (
    isRecord(value) &&
    typeof value.proposalId === "string" &&
    typeof value.appliedAtUtc === "string"
  );
}

function isBrainPlanResponse(value: unknown): value is BrainPlanResponse {
  if (!isRecord(value) || !Array.isArray(value.objectives) || !Array.isArray(value.delegatedTasks)) {
    return false;
  }
  if (!Array.isArray(value.audit) || !Array.isArray(value.routes) || !isRecord(value.provider)) return false;
  if (!isRecord(value.guardian) || !isRecord(value.proposal)) return false;
  if (
    value.recommendationInfluences !== undefined &&
    (
      !Array.isArray(value.recommendationInfluences) ||
      !value.recommendationInfluences.every((item) => typeof item === "string")
    )
  ) return false;
  if (
    value.recommendationInfluenceSource !== undefined &&
    !isRecommendationInfluenceSource(value.recommendationInfluenceSource)
  ) return false;

  const strings = ["requestId", "intent", "summary"] as const;
  if (strings.some((key) => typeof value[key] !== "string")) return false;
  if (typeof value.confidence !== "number" || value.confidence < 0 || value.confidence > 1) return false;

  const objectivesValid = value.objectives.every(
    (item) =>
      isRecord(item) &&
      typeof item.id === "string" &&
      typeof item.title === "string" &&
      typeof item.description === "string",
  );
  const tasksValid = value.delegatedTasks.every(
    (item) =>
      isRecord(item) &&
      typeof item.id === "string" &&
      typeof item.title === "string" &&
      typeof item.studio === "string" &&
      ["high", "medium", "low"].includes(String(item.priority)) &&
      typeof item.status === "string",
  );
  const providerValid =
    typeof value.provider.name === "string" &&
    typeof value.provider.mode === "string" &&
    typeof value.provider.version === "string";
  const taskIds = new Set(
    value.delegatedTasks
      .filter(isRecord)
      .map((task) => task.id)
      .filter((id): id is string => typeof id === "string"),
  );
  const routesValid =
    value.routes.length === taskIds.size &&
    value.routes.every(
      (route) =>
        isRecord(route) &&
        typeof route.taskId === "string" &&
        taskIds.has(route.taskId) &&
        typeof route.studio === "string" &&
        typeof route.provider === "string" &&
        route.mode === "dry-run" &&
        typeof route.reason === "string",
    );
  const guardianValid =
    ["passed", "repair_required"].includes(String(value.guardian.status)) &&
    typeof value.guardian.summary === "string" &&
    Array.isArray(value.guardian.checks) &&
    value.guardian.checks.every(
      (check) =>
        isRecord(check) &&
        typeof check.id === "string" &&
        ["passed", "warning", "failed"].includes(String(check.status)) &&
        typeof check.message === "string",
    );
  const proposalValid =
    typeof value.proposal.id === "string" &&
    value.proposal.status === "awaiting_user_approval" &&
    value.proposal.requiresUserApproval === true &&
    value.proposal.providerExecutionAllowed === false;
  const auditValid = value.audit.every(
    (item) =>
      isRecord(item) &&
      typeof item.id === "string" &&
      typeof item.type === "string" &&
      typeof item.timestamp === "string" &&
      typeof item.title === "string" &&
      (item.description === undefined ||
        item.description === null ||
        typeof item.description === "string") &&
      (item.metadata === undefined || item.metadata === null || isRecord(item.metadata)),
  );

  return objectivesValid && tasksValid && providerValid && routesValid && guardianValid && proposalValid && auditValid;
}

const generateFallbackPlan = (
  intent: string,
  recommendationInfluences: string[] = [],
  recommendationInfluenceSource?: BrainPlanRequest["recommendationInfluenceSource"]
): BrainPlanResponse => {
  const reqId = `req_fallback_${Math.random().toString(36).substring(2, 10)}`;
  return {
    requestId: reqId,
    intent,
    summary: `Local Fallback Plan for: "${intent}"`,
    objectives: [
      {
        id: "obj_1",
        title: "Initialize Local Creative Sandbox",
        description: "Set up frontend workspace fallback environment."
      },
      {
        id: "obj_2",
        title: "Render Offline Diagnostics Panel",
        description: "Activate secondary canvas visualizers and debug dashboards."
      },
      ...(recommendationInfluences.length > 0
        ? [{
            id: "obj_local_preferences",
            title: "Apply approved local preferences",
            description: recommendationInfluences.join("; "),
          }]
        : []),
    ],
    delegatedTasks: [
      {
        id: "task_1",
        title: "Mock Asset Generation",
        studio: "Asset Hub",
        priority: "medium",
        status: "proposed",
      },
      {
        id: "task_2",
        title: "Offline UI Polish",
        studio: "UI/UX Studio",
        priority: "low",
        status: "proposed",
      }
    ],
    confidence: 0.85,
    provider: {
      name: "frontend-fallback-mock",
      mode: "fallback",
      version: "0.1.0",
    },
    routes: [
      {
        taskId: "task_1",
        studio: "Asset Hub",
        provider: "frontend-fallback-router",
        mode: "dry-run",
        reason: "Backend unavailable; keep work local.",
      },
      {
        taskId: "task_2",
        studio: "UI/UX Studio",
        provider: "frontend-fallback-router",
        mode: "dry-run",
        reason: "Backend unavailable; keep work local.",
      },
    ],
    guardian: {
      status: "passed",
      summary: "Fallback plan is safe for user review.",
      checks: [
        {
          id: "execution_safety",
          status: "passed",
          message: "No provider execution is authorized.",
        },
      ],
    },
    proposal: {
      id: `proposal_fallback_${Math.random().toString(36).substring(2, 10)}`,
      status: "awaiting_user_approval",
      requiresUserApproval: true,
      providerExecutionAllowed: false,
    },
    audit: [
      {
        id: `audit_init_${Math.random().toString(36).substring(2, 8)}`,
        type: "intent_received",
        timestamp: new Date().toISOString(),
        title: "Intent Intake Captured",
        description: `Captured raw creative intent: "${intent}"`
      },
      {
        id: `audit_gen_${Math.random().toString(36).substring(2, 8)}`,
        type: "plan_generated",
        timestamp: new Date().toISOString(),
        title: "Fallback Plan Generated",
        description: "Axiom Studio fallback planner routed intent locally."
      },
      ...(recommendationInfluenceSource
        ? [{
            id: `audit_influence_${Math.random().toString(36).substring(2, 8)}`,
            type: "recommendation_influence_applied",
            timestamp: new Date().toISOString(),
            title: "Local recommendation influence applied",
            description: "Fallback plan includes an explicitly activated local influence.",
            metadata: {
              proposalId: recommendationInfluenceSource.proposalId,
              appliedAtUtc: recommendationInfluenceSource.appliedAtUtc,
            },
          }]
        : []),
    ],
    recommendationInfluences,
    recommendationInfluenceSource,
  };
};

export async function generateBrainPlan(request: BrainPlanRequest): Promise<BrainPlanResponse> {
  const recommendationInfluences = (request.recommendationInfluences ?? [])
    .filter((item) => typeof item === "string" && item.trim().length > 0)
    .map((item) => item.trim().slice(0, 1000))
    .slice(0, 10);
  const recommendationInfluenceSource =
    recommendationInfluences.length > 0 &&
    isRecommendationInfluenceSource(request.recommendationInfluenceSource)
      ? request.recommendationInfluenceSource
      : undefined;
  const normalizedRequest = {
    ...request,
    recommendationInfluences,
    recommendationInfluenceSource,
  };
  const envBaseUrl = typeof import.meta !== "undefined" && import.meta.env
    ? import.meta.env.VITE_API_BASE_URL
    : undefined;
  
  const baseUrl = envBaseUrl || "";
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 8000);

  try {
    const response = await fetch(`${baseUrl}/api/brain/plan`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(normalizedRequest),
      credentials: "include",
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data: unknown = await response.json();
    if (!isBrainPlanResponse(data)) throw new Error("Invalid Brain plan response.");
    if (
      recommendationInfluences.length > 0 &&
      JSON.stringify(data.recommendationInfluences) !== JSON.stringify(recommendationInfluences)
    ) {
      throw new Error("Brain plan omitted active recommendation influences.");
    }
    if (
      recommendationInfluenceSource &&
      JSON.stringify(data.recommendationInfluenceSource) !==
        JSON.stringify(recommendationInfluenceSource)
    ) {
      throw new Error("Brain plan omitted recommendation influence provenance.");
    }
    return data;
  } catch (error) {
    clearTimeout(timeoutId);
    console.warn("Axiom Brain backend offline or timed out. Falling back to offline client mode.", error);
    return generateFallbackPlan(
      request.intent,
      recommendationInfluences,
      recommendationInfluenceSource
    );
  }
}
