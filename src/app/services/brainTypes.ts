export interface BrainPlanRequest {
  intent: string;
  sessionId?: string;
  creativeMode?: string;
  recommendationInfluences?: string[];
  recommendationInfluenceSource?: RecommendationInfluenceSource;
}

export interface RecommendationInfluenceSource {
  proposalId: string;
  appliedAtUtc: string;
}

export interface BrainObjective {
  id: string;
  title: string;
  description: string;
}

export interface BrainDelegatedTask {
  id: string;
  title: string;
  studio: string;
  priority: "high" | "medium" | "low";
  status: string;
}

export interface ReplayAuditEvent {
  id: string;
  type: string;
  timestamp: string;
  title: string;
  description?: string | null;
  metadata?: Record<string, unknown> | null;
}

export interface BrainProviderInfo {
  name: string;
  mode: string;
  version: string;
}

export interface BrainProviderRoute {
  taskId: string;
  studio: string;
  provider: string;
  mode: "dry-run";
  reason: string;
}

export interface BrainGuardianCritique {
  status: "passed" | "repair_required";
  summary: string;
  checks: Array<{
    id: string;
    status: "passed" | "warning" | "failed";
    message: string;
  }>;
}

export interface BrainProposal {
  id: string;
  status: "awaiting_user_approval";
  requiresUserApproval: true;
  providerExecutionAllowed: false;
}

export interface BrainPlanResponse {
  requestId: string;
  intent: string;
  summary: string;
  objectives: BrainObjective[];
  delegatedTasks: BrainDelegatedTask[];
  confidence: number;
  provider: BrainProviderInfo;
  routes: BrainProviderRoute[];
  guardian: BrainGuardianCritique;
  proposal: BrainProposal;
  audit: ReplayAuditEvent[];
  recommendationInfluences?: string[];
  recommendationInfluenceSource?: RecommendationInfluenceSource;
}

export interface ProviderDetail {
  id: string;
  name: string;
  type: string;
  active: boolean;
  status: string;
}

export interface ProviderStatusResponse {
  providers: ProviderDetail[];
}
