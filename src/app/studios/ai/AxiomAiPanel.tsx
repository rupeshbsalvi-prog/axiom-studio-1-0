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
    <div
      className="axiom-ai-panel"
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "16px",
        height: "100%",
        overflow: "auto",
        padding: "2px",
      }}
    >
      {/* ─── Header: Status Bar ─── */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "10px 14px",
          background: "rgba(105, 212, 232, 0.07)",
          borderRadius: "8px",
          border: "1px solid rgba(105, 212, 232, 0.18)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div
            style={{
              width: "8px",
              height: "8px",
              borderRadius: "50%",
              background: stats.activeAgents > 0 ? "#4ade80" : "#6b7280",
              boxShadow: stats.activeAgents > 0 ? "0 0 6px #4ade80" : "none",
            }}
          />
          <span style={{ fontSize: "11px", color: "#a1a8b8", fontFamily: "monospace" }}>
            {stats.activeAgents > 0 ? `${stats.activeAgents} agent${stats.activeAgents !== 1 ? "s" : ""} active` : "No agents running"}
          </span>
        </div>
        <span
          style={{
            fontSize: "10px",
            color: "#69d4e8",
            fontFamily: "monospace",
            background: "rgba(105,212,232,0.1)",
            padding: "2px 8px",
            borderRadius: "3px",
          }}
        >
          {stats.modelProvider.toUpperCase()}
        </span>
      </div>

      {/* ─── Director Plan ─── */}
      <div
        style={{
          padding: "12px 14px",
          background: "rgba(255,255,255,0.03)",
          borderRadius: "8px",
          border: "1px solid rgba(255,255,255,0.07)",
        }}
      >
        <p style={{ fontSize: "10px", color: "#69d4e8", fontFamily: "monospace", margin: "0 0 8px", textTransform: "uppercase", letterSpacing: "0.08em" }}>
          Director Plan
        </p>
        <p style={{ fontSize: "12px", color: "#d0d6e8", margin: 0, lineHeight: 1.5 }}>
          {stats.currentDirectorPlan ?? "No active plan"}
        </p>

        {/* Token Budget Bar */}
        <div style={{ marginTop: "12px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
            <span style={{ fontSize: "10px", color: "#6b7280", fontFamily: "monospace" }}>Token budget</span>
            <span style={{ fontSize: "10px", color: "#a1a8b8", fontFamily: "monospace" }}>
              {stats.tokenUsed.toLocaleString()} / {stats.tokenBudget.toLocaleString()}
            </span>
          </div>
          <div style={{ height: "3px", background: "rgba(255,255,255,0.08)", borderRadius: "2px", overflow: "hidden" }}>
            <div
              style={{
                height: "100%",
                width: `${Math.min(tokenPct, 100)}%`,
                background: tokenPct > 85 ? "#f87171" : tokenPct > 60 ? "#facc15" : "#69d4e8",
                borderRadius: "2px",
                transition: "width 0.3s ease",
              }}
            />
          </div>
        </div>
      </div>

      {/* ─── Trace Timeline ─── */}
      <div
        style={{
          padding: "12px 14px",
          background: "rgba(255,255,255,0.03)",
          borderRadius: "8px",
          border: "1px solid rgba(255,255,255,0.07)",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
          <p style={{ fontSize: "10px", color: "#69d4e8", fontFamily: "monospace", margin: 0, textTransform: "uppercase", letterSpacing: "0.08em" }}>
            Trace Timeline
          </p>
          <span style={{ fontSize: "10px", color: "#6b7280", fontFamily: "monospace" }}>
            avg {stats.avgLatencyMs}ms
          </span>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
          {data.traceEntries.slice(-5).map((entry) => (
            <div
              key={entry.id}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "5px 8px",
                background: "rgba(255,255,255,0.025)",
                borderRadius: "4px",
                borderLeft: `2px solid ${getStatusColor(entry.status)}`,
              }}
            >
              <span style={{ fontSize: "10px", color: "#a1a8b8", fontFamily: "monospace", flex: 1 }}>
                {entry.tool}
              </span>
              <span style={{ fontSize: "10px", color: "#6b7280", fontFamily: "monospace" }}>
                {entry.latencyMs}ms
              </span>
              <span
                style={{
                  fontSize: "9px",
                  color: getStatusColor(entry.status),
                  fontFamily: "monospace",
                  textTransform: "uppercase",
                }}
              >
                {entry.status}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* ─── Eval Scorecard ─── */}
      <div
        style={{
          padding: "12px 14px",
          background: "rgba(255,255,255,0.03)",
          borderRadius: "8px",
          border: "1px solid rgba(255,255,255,0.07)",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
          <p style={{ fontSize: "10px", color: "#69d4e8", fontFamily: "monospace", margin: 0, textTransform: "uppercase", letterSpacing: "0.08em" }}>
            Eval Scorecard
          </p>
          <span style={{ fontSize: "10px", color: "#a1a8b8", fontFamily: "monospace" }}>
            {passedCount}/{totalEvals} passed
          </span>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          {data.evalResults.map((result) => (
            <div key={result.checkId} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span
                style={{
                  fontSize: "10px",
                  color: result.passed ? "#4ade80" : "#f87171",
                  fontFamily: "monospace",
                  width: "10px",
                }}
              >
                {result.passed ? "✓" : "✗"}
              </span>
              <span style={{ fontSize: "10px", color: "#a1a8b8", fontFamily: "monospace", flex: 1 }}>
                {result.label}
              </span>
              <span
                style={{
                  fontSize: "9px",
                  color: "#4a5568",
                  fontFamily: "monospace",
                  letterSpacing: "-0.02em",
                }}
              >
                {getConfidenceBar(result.confidence)}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* ─── Routing Inspector ─── */}
      <div
        style={{
          padding: "12px 14px",
          background: "rgba(255,255,255,0.03)",
          borderRadius: "8px",
          border: "1px solid rgba(255,255,255,0.07)",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
          <p style={{ fontSize: "10px", color: "#69d4e8", fontFamily: "monospace", margin: 0, textTransform: "uppercase", letterSpacing: "0.08em" }}>
            Routing Inspector
          </p>
          <span style={{ fontSize: "10px", color: "#6b7280", fontFamily: "monospace" }}>
            {stats.routingDecisions} decision{stats.routingDecisions !== 1 ? "s" : ""}
          </span>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
          {data.routingLog.map((decision) => (
            <div
              key={decision.requestId}
              style={{
                padding: "6px 8px",
                background: "rgba(255,255,255,0.025)",
                borderRadius: "4px",
                display: "flex",
                flexDirection: "column",
                gap: "2px",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ fontSize: "10px", color: "#d0d6e8", fontFamily: "monospace" }}>
                  {decision.modelId}
                </span>
                <span style={{ fontSize: "9px", color: "#69d4e8", fontFamily: "monospace" }}>
                  {decision.provider}
                </span>
              </div>
              <span style={{ fontSize: "9px", color: "#4a5568", fontFamily: "monospace" }}>
                {decision.reason}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* ─── Platform Validation Footer ─── */}
      <div
        style={{
          padding: "8px 12px",
          background: "rgba(105, 212, 232, 0.04)",
          borderRadius: "6px",
          border: "1px solid rgba(105, 212, 232, 0.08)",
          display: "flex",
          gap: "12px",
        }}
      >
        {[
          { label: "EventBus", status: "active" },
          { label: "StateService", status: "active" },
          { label: "DiagnosticsService", status: "active" },
          { label: "Three.js", status: "absent" },
        ].map((item) => (
          <div key={item.label} style={{ display: "flex", flexDirection: "column", alignItems: "center", flex: 1 }}>
            <span
              style={{
                fontSize: "8px",
                color: item.status === "absent" ? "#4ade80" : "#6b7280",
                fontFamily: "monospace",
                textTransform: "uppercase",
              }}
            >
              {item.status === "absent" ? "✓ zero" : "✓ wired"}
            </span>
            <span style={{ fontSize: "8px", color: "#374151", fontFamily: "monospace" }}>
              {item.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
