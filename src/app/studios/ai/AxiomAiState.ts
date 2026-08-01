// ----------------------------------------------------
// AxiomAiState.ts — Axiom AI Studio State Contract
//
// Domain: Studio Layer (src/app/studios/ai/)
// Platform: Knows nothing about these types.
// Namespace in StateService: axiomAi.*
// ----------------------------------------------------

export interface TraceEntry {
  id: string;
  tool: string;
  latencyMs: number;
  status: "success" | "error" | "pending";
  timestamp: number;
}

export interface EvalResult {
  checkId: string;
  label: string;
  passed: boolean;
  confidence: number;
}

export interface RoutingDecision {
  requestId: string;
  provider: string;
  modelId: string;
  reason: string;
}

export interface AxiomAiStateData {
  activeAgents: number;
  currentDirectorPlan: string | null;
  traceEntries: TraceEntry[];
  evalResults: EvalResult[];
  routingLog: RoutingDecision[];
  modelProvider: "gemini" | "openai" | "anthropic" | "local";
  tokenBudget: number;
  tokenUsed: number;
}

export const AXIOM_AI_INITIAL_STATE: AxiomAiStateData = {
  activeAgents: 0,
  currentDirectorPlan: null,
  traceEntries: [],
  evalResults: [],
  routingLog: [],
  modelProvider: "gemini",
  tokenBudget: 8192,
  tokenUsed: 0,
};
