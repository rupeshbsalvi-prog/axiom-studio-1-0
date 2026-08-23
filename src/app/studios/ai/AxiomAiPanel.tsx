// ----------------------------------------------------
// AxiomAiPanel.tsx — Axiom AI Studio UI Panel
//
// Location: src/app/studios/ai/
// Data sources: StateService + DiagnosticsService ONLY (via EventBus)
// Zero direct data fetching. Pure platform-mediated rendering.
//
// Platform validation proof:
//   - Listens to state:changed:axiomAi.* events from StateService
//   - Reads AI telemetry from diagnosticsService.collectAll()
//   - The platform services require zero modifications to power this panel
// ----------------------------------------------------

import { useEffect, useState } from "react";
import { eventBus } from "../../../platform/services/EventBus";
import { stateService } from "../../../platform/services/StateService";
import { diagnosticsService } from "../../../platform/services/DiagnosticsService";
import type { TraceEntry, EvalResult, RoutingDecision } from "./AxiomAiState";

interface AiPanelStats {
  activeAgents: number;
  traceCount: number;
  avgLatencyMs: number;
  evalPassRate: number;
  routingDecisions: number;
  tokenBudget: number;
  tokenUsed: number;
  modelProvider: string;
  currentDirectorPlan: string | null;
}

interface AiPanelData {
  traceEntries: TraceEntry[];
  evalResults: EvalResult[];
  routingLog: RoutingDecision[];
}

function getStatusColor(status: TraceEntry["status"]): string {
  if (status === "success") return "#4ade80";
  if (status === "error") return "#f87171";
  return "#facc15";
}

function getConfidenceBar(confidence: number): string {
  const filled = Math.round(confidence * 10);
  return "█".repeat(filled) + "░".repeat(10 - filled);
}

export function AxiomAiPanel() {
  const [stats, setStats] = useState<AiPanelStats>({
    activeAgents: 0,
    traceCount: 0,
    avgLatencyMs: 0,
    evalPassRate: 1.0,
    routingDecisions: 0,
    tokenBudget: 8192,
    tokenUsed: 0,
    modelProvider: "gemini",
    currentDirectorPlan: null,
  });

  const [data, setData] = useState<AiPanelData>({
    traceEntries: [],
    evalResults: [],
    routingLog: [],
  });

  useEffect(() => {
    // Pull initial state from StateService (seeded by AxiomAiStudio.initialize())
    const initialState = stateService.getState();
    setStats((prev) => ({
      ...prev,
      activeAgents: initialState["axiomAi.activeAgents"] ?? 0,
      tokenBudget: initialState["axiomAi.tokenBudget"] ?? 8192,
      tokenUsed: initialState["axiomAi.tokenUsed"] ?? 0,
      modelProvider: initialState["axiomAi.modelProvider"] ?? "gemini",
      currentDirectorPlan: initialState["axiomAi.currentDirectorPlan"] ?? null,
    }));
    setData({
      traceEntries: initialState["axiomAi.traceEntries"] ?? [],
      evalResults: initialState["axiomAi.evalResults"] ?? [],
      routingLog: initialState["axiomAi.routingLog"] ?? [],
    });

    // Subscribe to platform state changes — namespace: axiomAi.*
    const unsubState = eventBus.subscribe("state:changed", (newState: Record<string, any>) => {
      setStats((prev) => ({
        ...prev,
        activeAgents: newState["axiomAi.activeAgents"] ?? prev.activeAgents,
        tokenUsed: newState["axiomAi.tokenUsed"] ?? prev.tokenUsed,
        tokenBudget: newState["axiomAi.tokenBudget"] ?? prev.tokenBudget,
        modelProvider: newState["axiomAi.modelProvider"] ?? prev.modelProvider,
        currentDirectorPlan: newState["axiomAi.currentDirectorPlan"] ?? prev.currentDirectorPlan,
      }));
      if (newState["axiomAi.traceEntries"]) {
        setData((prev) => ({ ...prev, traceEntries: newState["axiomAi.traceEntries"] }));
      }
      if (newState["axiomAi.evalResults"]) {
        setData((prev) => ({ ...prev, evalResults: newState["axiomAi.evalResults"] }));
      }
      if (newState["axiomAi.routingLog"]) {
        setData((prev) => ({ ...prev, routingLog: newState["axiomAi.routingLog"] }));
      }
    });

    // Subscribe to AI metric snapshots published through EventBus
    // Chain: AxiomAiStudio → EventBus → here → DiagnosticsService.collectAll() → overlay
    const unsubMetrics = eventBus.subscribe("axiomAi:metrics:snapshot", () => {
      const aggregated = diagnosticsService.collectAll();
      if (aggregated.activeAgents !== undefined) {
        setStats((prev) => ({
          ...prev,
          traceCount: aggregated.traceCount ?? prev.traceCount,
          avgLatencyMs: aggregated.avgLatencyMs ?? prev.avgLatencyMs,
          evalPassRate: aggregated.evalPassRate ?? prev.evalPassRate,
          routingDecisions: aggregated.routingDecisions ?? prev.routingDecisions,
        }));
      }
    });

    return () => {
      unsubState();
      unsubMetrics();
    };
  }, []);

  const tokenPct = stats.tokenBudget > 0 ? (stats.tokenUsed / stats.tokenBudget) * 100 : 0;
  const passedCount = data.evalResults.filter((e) => e.passed).length;
  const totalEvals = data.evalResults.length;

  return (
    <section
      className="studio-production-panel studio-production-panel--axiom-ai"
      aria-label="Axiom AI production workspace"
      data-design-language="axiom-pro-panel-v1"
    >
      <aside className="studio-panel-rail studio-panel-rail--planner axiom-ai-director" aria-label="Axiom AI director and budget">
        <header className="axiom-ai-heading">
          <span>Director console</span>
          <h2>Axiom Imagine X</h2>
          <p>Observable orchestration for human-directed creative work.</p>
        </header>
        <div className="axiom-ai-status">
          <i className={stats.activeAgents > 0 ? "is-active" : ""} aria-hidden="true" />
          <span>{stats.activeAgents > 0 ? `${stats.activeAgents} agent${stats.activeAgents !== 1 ? "s" : ""} active` : "No agents running"}</span>
          <strong>{stats.modelProvider.toUpperCase()}</strong>
        </div>
        <section className="axiom-ai-card">
          <span>Director Plan</span>
          <p>{stats.currentDirectorPlan ?? "No active plan"}</p>
          <div className="axiom-ai-budget">
            <div><small>Token budget</small><small>{stats.tokenUsed.toLocaleString()} / {stats.tokenBudget.toLocaleString()}</small></div>
            <progress value={Math.min(tokenPct, 100)} max="100" aria-label="Token budget used" />
          </div>
        </section>
        <section className="axiom-ai-card axiom-ai-authority">
          <span>Operating boundary</span>
          <p><strong>Advisory by default.</strong> Execution remains subject to workspace authority and explicit user direction.</p>
        </section>
      </aside>

      <section className="studio-panel-canvas axiom-ai-canvas" aria-label="Axiom AI intelligence canvas">
        <header className="axiom-ai-canvas-bar">
          <div><span>Live intelligence map</span><strong>Runtime mediated</strong></div>
          <small>{stats.traceCount} traces · {stats.avgLatencyMs}ms avg</small>
        </header>
        <div className="axiom-ai-orchestration" aria-label="Imagine X orchestration map">
          <div className="axiom-ai-orbit" aria-hidden="true"><i /><i /><i /></div>
          <div className="axiom-ai-core"><small>Axiom</small><strong>Imagine X</strong><span>{stats.activeAgents > 0 ? "Orchestrating" : "Ready"}</span></div>
          <div className="axiom-ai-node axiom-ai-node--intent"><span>01</span><strong>Intent</strong></div>
          <div className="axiom-ai-node axiom-ai-node--plan"><span>02</span><strong>Plan</strong></div>
          <div className="axiom-ai-node axiom-ai-node--route"><span>03</span><strong>Route</strong></div>
          <div className="axiom-ai-node axiom-ai-node--eval"><span>04</span><strong>Evaluate</strong></div>
        </div>
        <div className="axiom-ai-metrics">
          <div><span>Agents</span><strong>{stats.activeAgents}</strong></div>
          <div><span>Traces</span><strong>{stats.traceCount}</strong></div>
          <div><span>Eval pass</span><strong>{Math.round(stats.evalPassRate * 100)}%</strong></div>
          <div><span>Routes</span><strong>{stats.routingDecisions}</strong></div>
        </div>
        <section className="axiom-ai-card axiom-ai-traces">
          <header><span>Trace Timeline</span><small>avg {stats.avgLatencyMs}ms</small></header>
          {data.traceEntries.length === 0 && <p className="axiom-ai-empty">Awaiting runtime trace.</p>}
          {data.traceEntries.slice(-5).map((entry) => (
            <div key={entry.id} style={{ borderLeftColor: getStatusColor(entry.status) }}>
              <span>{entry.tool}</span><small>{entry.latencyMs}ms</small><b style={{ color: getStatusColor(entry.status) }}>{entry.status}</b>
            </div>
          ))}
        </section>
        <section className="axiom-ai-card axiom-ai-evals">
          <header><span>Eval Scorecard</span><small>{passedCount}/{totalEvals} passed</small></header>
          {data.evalResults.length === 0 && <p className="axiom-ai-empty">No evaluations recorded.</p>}
          {data.evalResults.map((result) => (
            <div key={result.checkId}>
              <b className={result.passed ? "is-passed" : "is-failed"}>{result.passed ? "✓" : "✗"}</b>
              <span>{result.label}</span><small>{getConfidenceBar(result.confidence)}</small>
            </div>
          ))}
        </section>
      </section>

      <aside className="studio-panel-rail studio-panel-rail--inspector axiom-ai-routing" aria-label="Axiom AI routing and platform audit">
        <header className="axiom-ai-heading"><span>Model authority</span><h2>Routing Inspector</h2><p>{stats.routingDecisions} decision{stats.routingDecisions !== 1 ? "s" : ""} observed.</p></header>
        <div className="axiom-ai-route-list">
          {data.routingLog.length === 0 && <p className="axiom-ai-empty">No routing decisions recorded.</p>}
          {data.routingLog.map((decision) => (
            <article key={decision.requestId}><div><strong>{decision.modelId}</strong><span>{decision.provider}</span></div><p>{decision.reason}</p></article>
          ))}
        </div>
        <section className="axiom-ai-card axiom-ai-platform">
          <span>Platform audit</span>
          {[
            { label: "EventBus", status: "wired" },
            { label: "StateService", status: "wired" },
            { label: "DiagnosticsService", status: "wired" },
            { label: "Three.js", status: "zero" },
          ].map((item) => <div key={item.label}><span>{item.label}</span><strong>✓ {item.status}</strong></div>)}
        </section>
      </aside>
    </section>
  );
}
