import React, { useEffect, useMemo, useState } from "react";
import { eventBus } from "../platform/services/EventBus";
import {
  type WorkspaceAuditEvent,
  getWorkspaceAuditEvents,
  clearWorkspaceAuditEvents,
} from "./WorkspaceAuditService";
import {
  Play,
  Shield,
  Download,
  RefreshCw,
  AlertTriangle,
  FileJson,
  ChevronDown,
  ChevronUp,
  Trash2,
  CheckCircle,
  XCircle,
  Info,
} from "lucide-react";

type FilterType = "All" | "Creative" | "Authority" | "Export" | "Lifecycle" | "Runtime" | "Projections" | "Sandbox" | "Live" | "Errors";

export function WorkspaceReplayPanel() {
  const [events, setEvents] = useState<WorkspaceAuditEvent[]>([]);
  const [activeFilter, setActiveFilter] = useState<FilterType>("All");
  const [expandedEventIds, setExpandedEventIds] = useState<Set<string>>(new Set());

  // Load initial events
  useEffect(() => {
    setEvents(getWorkspaceAuditEvents());

    const handleRecorded = (event: WorkspaceAuditEvent) => {
      setEvents((current) => {
        if (current.some((e) => e.id === event.id)) {
          return current;
        }
        const next = [...current, event];
        if (next.length > 1000) {
          next.shift();
        }
        return next;
      });
    };

    const unsubscribe = eventBus.subscribe("workspace:audit:recorded", handleRecorded);
    return () => {
      unsubscribe();
    };
  }, []);

  const handleClear = () => {
    clearWorkspaceAuditEvents();
    setEvents([]);
  };

  const toggleExpand = (id: string) => {
    setExpandedEventIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // Group events by categories for tabs and badges
  const filteredEvents = useMemo(() => {
    return events.filter((event) => {
      switch (activeFilter) {
        case "Creative":
          return [
            "intent_received",
            "plan_generated",
            "proposal_accepted",
            "proposal_rejected",
          ].includes(event.type);
        case "Authority":
          return event.type === "authority_blocked";
        case "Export":
          return ["export_requested", "export_completed"].includes(event.type);
        case "Lifecycle":
          return event.type === "lifecycle";
        case "Runtime":
          return [
            "runtime_manifest_discovered",
            "runtime_manifest_validated",
            "runtime_manifest_registered",
            "runtime_manifest_rejected",
            "runtime_manifest_disabled",
            "runtime_manifest_enabled",
            "runtime_authority_blocked",
            "runtime_activation_requested",
            "runtime_activation_completed",
            "runtime_activation_failed",
            "runtime_execution_requested",
            "runtime_execution_completed",
            "runtime_execution_failed",
            "runtime_package_promotion_requested",
            "runtime_package_promotion_completed",
            "runtime_package_promotion_failed",
            "runtime_package_promotion_blocked",
            "runtime_activation_eligibility_checked",
            "runtime_action_dispatch_requested",
            "runtime_action_dry_run_completed",
            "runtime_action_dry_run_failed",
            "provider_execution_approval_requested",
            "provider_execution_approval_completed",
            "provider_execution_approval_failed",
            "provider_sandbox_execution_requested",
            "provider_sandbox_execution_completed",
            "provider_sandbox_execution_failed",
            "provider_readiness_check_requested",
            "provider_readiness_check_completed",
            "provider_readiness_check_failed",
          ].includes(event.type);
        case "Projections":
          return [
            "canvas_preview_intake_received",
            "canvas_preview_assembly_approved",
            "canvas_preview_assembly_rejected",
            "canvas_projection_applied",
            "canvas_projection_rolled_back",
            "provider_execution_approval_requested",
            "provider_execution_approval_completed",
            "provider_execution_approval_failed",
            "provider_readiness_check_requested",
            "provider_readiness_check_completed",
            "provider_readiness_check_failed",
          ].includes(event.type);
        case "Sandbox":
          return [
            "provider_sandbox_execution_requested",
            "provider_sandbox_execution_completed",
            "provider_sandbox_execution_failed",
            "provider_readiness_check_requested",
            "provider_readiness_check_completed",
            "provider_readiness_check_failed",
          ].includes(event.type);
        case "Live":
          return [
            "provider_live_execution_requested",
            "provider_live_execution_completed",
            "provider_live_execution_failed",
          ].includes(event.type);
        case "Errors":
          return (
            event.severity === "error" ||
            event.type === "provider_failed" ||
            event.type === "authority_blocked" ||
            event.type === "runtime_manifest_rejected" ||
            event.type === "runtime_authority_blocked" ||
            event.type === "runtime_activation_failed" ||
            event.type === "runtime_execution_failed" ||
            event.type === "runtime_action_dry_run_failed" ||
            event.type === "provider_execution_approval_failed" ||
            event.type === "provider_live_execution_failed" ||
            (event.type === "canvas_projection_rolled_back" && event.severity === "warning")
          );
        default:
          return true;
      }
    });
  }, [events, activeFilter]);

  const counts = useMemo(() => {
    const acc = { All: 0, Creative: 0, Authority: 0, Export: 0, Lifecycle: 0, Runtime: 0, Projections: 0, Sandbox: 0, Live: 0, Errors: 0 };
    events.forEach((event) => {
      acc.All++;
      if (
        ["intent_received", "plan_generated", "proposal_accepted", "proposal_rejected"].includes(
          event.type
        )
      ) {
        acc.Creative++;
      }
      if (event.type === "authority_blocked") {
        acc.Authority++;
      }
      if (["export_requested", "export_completed"].includes(event.type)) {
        acc.Export++;
      }
      if (event.type === "lifecycle") {
        acc.Lifecycle++;
      }
      if (
        [
          "runtime_manifest_discovered",
          "runtime_manifest_validated",
          "runtime_manifest_registered",
          "runtime_manifest_rejected",
          "runtime_manifest_disabled",
          "runtime_manifest_enabled",
          "runtime_authority_blocked",
          "runtime_activation_requested",
          "runtime_activation_completed",
          "runtime_activation_failed",
          "runtime_execution_requested",
          "runtime_execution_completed",
          "runtime_execution_failed",
          "runtime_package_promotion_requested",
          "runtime_package_promotion_completed",
          "runtime_package_promotion_failed",
          "runtime_package_promotion_blocked",
          "runtime_activation_eligibility_checked",
          "runtime_action_dispatch_requested",
          "runtime_action_dry_run_completed",
          "runtime_action_dry_run_failed",
          "provider_execution_approval_requested",
          "provider_execution_approval_completed",
          "provider_execution_approval_failed",
          "provider_sandbox_execution_requested",
          "provider_sandbox_execution_completed",
          "provider_sandbox_execution_failed",
          "provider_readiness_check_requested",
          "provider_readiness_check_completed",
          "provider_readiness_check_failed",
        ].includes(event.type)
      ) {
        acc.Runtime++;
      }
      if (
        [
          "canvas_preview_intake_received",
          "canvas_preview_assembly_approved",
          "canvas_preview_assembly_rejected",
          "canvas_projection_applied",
          "canvas_projection_rolled_back",
          "provider_execution_approval_requested",
          "provider_execution_approval_completed",
          "provider_execution_approval_failed",
          "provider_sandbox_execution_requested",
          "provider_sandbox_execution_completed",
          "provider_sandbox_execution_failed",
          "provider_readiness_check_requested",
          "provider_readiness_check_completed",
          "provider_readiness_check_failed",
        ].includes(event.type)
      ) {
        acc.Projections++;
      }
      if (
        [
          "provider_sandbox_execution_requested",
          "provider_sandbox_execution_completed",
          "provider_sandbox_execution_failed",
          "provider_readiness_check_requested",
          "provider_readiness_check_completed",
          "provider_readiness_check_failed",
        ].includes(event.type)
      ) {
        acc.Sandbox++;
      }
      if (
        [
          "provider_live_execution_requested",
          "provider_live_execution_completed",
          "provider_live_execution_failed",
        ].includes(event.type)
      ) {
        acc.Live++;
      }
      if (
        event.severity === "error" ||
        event.type === "provider_failed" ||
        event.type === "authority_blocked" ||
        event.type === "runtime_manifest_rejected" ||
        event.type === "runtime_authority_blocked" ||
        event.type === "runtime_activation_failed" ||
        event.type === "runtime_execution_failed" ||
        event.type === "runtime_action_dry_run_failed" ||
        event.type === "provider_execution_approval_failed" ||
        event.type === "provider_sandbox_execution_failed" ||
        event.type === "provider_live_execution_failed" ||
        (event.type === "canvas_projection_rolled_back" && event.severity === "warning")
      ) {
        acc.Errors++;
      }
    });
    return acc;
  }, [events]);

  const getEventIcon = (event: WorkspaceAuditEvent) => {
    switch (event.type) {
      case "authority_blocked":
      case "runtime_authority_blocked":
        return <Shield size={14} style={{ color: "#ef4444" }} />;
      case "runtime_activation_eligibility_checked":
        return <Shield size={14} style={{ color: event.metadata?.eligible ? "#10b981" : "#f59e0b" }} />;
      case "runtime_action_dispatch_requested":
        return <Play size={14} style={{ color: "#6366f1" }} />;
      case "runtime_action_dry_run_completed":
        return <CheckCircle size={14} style={{ color: "#10b981" }} />;
      case "runtime_action_dry_run_failed":
        return <XCircle size={14} style={{ color: "#ef4444" }} />;
      case "provider_execution_approval_requested":
      case "provider_sandbox_execution_requested":
      case "provider_readiness_check_requested":
      case "provider_live_execution_requested":
        return <Shield size={14} style={{ color: "#3b82f6" }} />;
      case "provider_execution_approval_completed":
      case "provider_sandbox_execution_completed":
      case "provider_readiness_check_completed":
      case "provider_live_execution_completed":
        return <CheckCircle size={14} style={{ color: "#10b981" }} />;
      case "provider_execution_approval_failed":
      case "provider_sandbox_execution_failed":
      case "provider_readiness_check_failed":
      case "provider_live_execution_failed":
        return <XCircle size={14} style={{ color: "#ef4444" }} />;
      case "proposal_accepted":
      case "export_completed":
      case "runtime_activation_completed":
      case "runtime_execution_completed":
      case "runtime_package_promotion_completed":
        return <CheckCircle size={14} style={{ color: "#10b981" }} />;
      case "proposal_rejected":
      case "provider_failed":
        return <XCircle size={14} style={{ color: "#f59e0b" }} />;
      case "runtime_manifest_rejected":
      case "runtime_activation_failed":
      case "runtime_execution_failed":
      case "runtime_package_promotion_failed":
        return <XCircle size={14} style={{ color: "#ef4444" }} />;
      case "runtime_manifest_registered":
      case "runtime_manifest_validated":
      case "runtime_manifest_enabled":
        return <FileJson size={14} style={{ color: "#10b981" }} />;
      case "runtime_manifest_discovered":
      case "runtime_activation_requested":
      case "runtime_package_promotion_requested":
        return <Play size={14} style={{ color: "#3b82f6" }} />;
      case "runtime_execution_requested":
        return <Play size={14} style={{ color: "#818cf8" }} />;
      case "runtime_manifest_disabled":
      case "runtime_package_promotion_blocked":
        return <XCircle size={14} style={{ color: "#64748b" }} />;
      case "canvas_preview_intake_received":
        return <Play size={14} style={{ color: "#3b82f6" }} />;
      case "canvas_preview_assembly_approved":
        return <CheckCircle size={14} style={{ color: "#10b981" }} />;
      case "canvas_preview_assembly_rejected":
        return <XCircle size={14} style={{ color: "#f59e0b" }} />;
      case "canvas_projection_applied":
        return <CheckCircle size={14} style={{ color: "#10b981" }} />;
      case "canvas_projection_rolled_back":
        return <RefreshCw size={14} style={{ color: "#f59e0b" }} />;
      case "export_requested":
        return <Download size={14} style={{ color: "#3b82f6" }} />;
      case "lifecycle":
        return <RefreshCw size={14} style={{ color: "#64748b" }} />;
      case "intent_received":
        return <Play size={14} style={{ color: "#818cf8" }} />;
      default:
        return <Info size={14} style={{ color: "#94a3b8" }} />;
    }
  };

  const getSeverityStyle = (severity: string) => {
    switch (severity) {
      case "error":
        return { borderLeft: "3px solid #ef4444" };
      case "warning":
        return { borderLeft: "3px solid #f59e0b" };
      case "success":
        return { borderLeft: "3px solid #10b981" };
      default:
        return { borderLeft: "3px solid #3b82f6" };
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", background: "#090d16", color: "#e2e8f0", fontFamily: "system-ui, -apple-system, sans-serif" }}>
      {/* Header section */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", borderBottom: "1px solid rgba(255,255,255,0.08)", background: "rgba(15, 23, 42, 0.4)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <FileJson size={16} style={{ color: "#6366f1" }} />
          <span style={{ fontSize: "12px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: "#f8fafc" }}>
            Workspace Replay Trail
          </span>
        </div>
        <button
          onClick={handleClear}
          disabled={events.length === 0}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "4px",
            background: "none",
            border: "none",
            color: events.length === 0 ? "#475569" : "#94a3b8",
            fontSize: "11px",
            cursor: events.length === 0 ? "default" : "pointer",
            padding: "4px 8px",
            borderRadius: "4px",
            transition: "all 0.2s",
          }}
        >
          <Trash2 size={12} />
          Clear
        </button>
      </div>

      {/* Tabs / Filter bar */}
      <div style={{ display: "flex", gap: "4px", padding: "8px 12px", borderBottom: "1px solid rgba(255,255,255,0.05)", background: "rgba(15, 23, 42, 0.2)", overflowX: "auto" }}>
        {(["All", "Creative", "Authority", "Export", "Lifecycle", "Runtime", "Projections", "Sandbox", "Live", "Errors"] as FilterType[]).map((tab) => {
          const isActive = activeFilter === tab;
          const count = counts[tab];
          return (
            <button
              key={tab}
              onClick={() => setActiveFilter(tab)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                padding: "6px 10px",
                borderRadius: "6px",
                background: isActive ? "rgba(99, 102, 241, 0.15)" : "transparent",
                border: "none",
                color: isActive ? "#a5b4fc" : "#64748b",
                fontSize: "11px",
                fontWeight: 600,
                cursor: "pointer",
                whiteSpace: "nowrap",
              }}
            >
              {tab}
              <span
                style={{
                  fontSize: "9px",
                  padding: "1px 5px",
                  borderRadius: "10px",
                  background: isActive ? "rgba(99, 102, 241, 0.25)" : "rgba(255,255,255,0.06)",
                  color: isActive ? "#c7d2fe" : "#475569",
                }}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Replay Trail List */}
      <div style={{ flex: 1, overflowY: "auto", padding: "12px", display: "flex", flexDirection: "column", gap: "8px" }}>
        {filteredEvents.length === 0 ? (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", gap: "8px", opacity: 0.4 }}>
            <AlertTriangle size={24} />
            <span style={{ fontSize: "11px" }}>No replay events match the filter criteria.</span>
          </div>
        ) : (
          filteredEvents.map((event) => {
            const isExpanded = expandedEventIds.has(event.id);
            const isLifecycle = event.type === "lifecycle";
            return (
              <div
                key={event.id}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  background: isLifecycle ? "rgba(255, 255, 255, 0.01)" : "rgba(15, 23, 42, 0.45)",
                  border: "1px solid rgba(255,255,255,0.04)",
                  borderRadius: "8px",
                  padding: "8px 12px",
                  opacity: isLifecycle && !isExpanded ? 0.6 : 1,
                  ...getSeverityStyle(event.severity),
                }}
              >
                {/* Header info */}
                <div
                  onClick={() => toggleExpand(event.id)}
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    justifyContent: "space-between",
                    cursor: "pointer",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "20px", height: "20px", borderRadius: "4px", background: "rgba(255,255,255,0.03)" }}>
                      {getEventIcon(event)}
                    </div>
                    <div style={{ display: "flex", flexDirection: "column" }}>
                      <span style={{ fontSize: "12px", fontWeight: 600, color: "#f1f5f9" }}>
                        {event.title}
                      </span>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px", marginTop: "2px" }}>
                        <span style={{ fontSize: "9px", textTransform: "uppercase", padding: "1px 4px", borderRadius: "3px", background: "rgba(255,255,255,0.06)", color: "#94a3b8" }}>
                          {event.source}
                        </span>
                        <span style={{ fontSize: "9px", color: "#475569" }}>
                          {new Date(event.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div>
                    {isExpanded ? <ChevronUp size={14} style={{ color: "#64748b" }} /> : <ChevronDown size={14} style={{ color: "#64748b" }} />}
                  </div>
                </div>

                {/* Details view */}
                {isExpanded && (
                  <div style={{ marginTop: "8px", paddingTop: "8px", borderTop: "1px solid rgba(255,255,255,0.05)", fontSize: "11px", color: "#cbd5e1", lineHeight: 1.45 }}>
                    <p style={{ margin: "0 0 6px 0" }}>
                      {event.message || event.description}
                    </p>
                    {(() => {
                      const meta = event.metadata as any;
                      if ((event.type.startsWith("provider_sandbox_execution") || event.type.startsWith("provider_readiness_check") || event.type.startsWith("provider_live_execution")) && meta) {
                        return (
                          <div style={{ marginTop: "6px", display: "flex", flexDirection: "column", gap: "6px" }}>
                            <div style={{ display: "grid", gridTemplateColumns: "140px 1fr", gap: "4px", background: "rgba(0,0,0,0.2)", padding: "6px", borderRadius: "4px", fontFamily: "monospace", fontSize: "10px" }}>
                              {meta.liveRunId && (
                                <>
                                  <span style={{ color: "#94a3b8" }}>Live Run ID:</span>
                                  <span style={{ color: "#e2e8f0" }}>{String(meta.liveRunId)}</span>
                                </>
                              )}
                              {meta.runId || meta.sandboxRunId ? (
                                <>
                                  <span style={{ color: "#94a3b8" }}>Sandbox Run ID:</span>
                                  <span style={{ color: "#e2e8f0" }}>{String(meta.runId || meta.sandboxRunId)}</span>
                                </>
                              ) : null}
                              <span style={{ color: "#94a3b8" }}>Job ID:</span>
                              <span style={{ color: "#e2e8f0" }}>{String(meta.jobId || "-")}</span>
                              {meta.candidateId && (
                                <>
                                  <span style={{ color: "#94a3b8" }}>Candidate ID:</span>
                                  <span style={{ color: "#a5b4fc", textDecoration: "underline", cursor: "pointer" }}>{String(meta.candidateId)}</span>
                                </>
                              )}
                              {meta.actor && (
                                <>
                                  <span style={{ color: "#94a3b8" }}>Actor:</span>
                                  <span style={{ color: "#e2e8f0" }}>{String(meta.actor)}</span>
                                </>
                              )}
                              {event.type.startsWith("provider_readiness_check") && (
                                <>
                                  <span style={{ color: "#94a3b8" }}>Readiness Status:</span>
                                  <span style={{ color: meta.readinessSatisfied ? "#34d399" : "#f87171", fontWeight: 700 }}>
                                    {meta.readinessSatisfied ? "PASSED" : "FAILED"}
                                  </span>
                                  <span style={{ color: "#94a3b8" }}>Policy Block:</span>
                                  <span style={{ color: "#ef4444", fontWeight: 700 }}>ACTIVE</span>
                                </>
                              )}
                            </div>

                            {/* Security Evidence Checks */}
                            <div style={{ background: "rgba(16, 185, 129, 0.04)", border: "1px solid rgba(16, 185, 129, 0.15)", borderRadius: "4px", padding: "6px" }}>
                              <div style={{ fontWeight: 600, color: "#34d399", marginBottom: "4px", display: "flex", alignItems: "center", gap: "4px" }}>
                                <Shield size={10} />
                                <span>Verified Security Invariants</span>
                              </div>
                              <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "2px", fontFamily: "monospace", fontSize: "9px", color: "#a7f3d0" }}>
                                <div>✔ providerExecuted: {String(meta.providerExecuted ?? false)}</div>
                                <div>✔ runtimeCodeLoaded: {String(meta.runtimeCodeLoaded ?? false)}</div>
                                <div>✔ moduleUrlExecuted: {String(meta.moduleUrlExecuted ?? false)}</div>
                                <div>✔ networkAccessed: {String(meta.networkAccessed ?? false)}</div>
                                <div>✔ providerApiCalled: {String(meta.providerApiCalled ?? false)}</div>
                                <div>✔ executionBlockedByPhasePolicy: {String(meta.executionBlockedByPhasePolicy ?? true)}</div>
                              </div>
                            </div>

                            {meta.diagnostics && Array.isArray(meta.diagnostics) && meta.diagnostics.length > 0 && (
                              <div style={{ marginTop: "4px" }}>
                                <div style={{ fontWeight: 600, color: "#94a3b8" }}>Diagnostics:</div>
                                {meta.diagnostics.map((d: any, idx: number) => (
                                  <div key={idx} style={{ color: d.severity === "error" ? "#f87171" : "#fbbf24", paddingLeft: "4px" }}>
                                    • [{d.severity.toUpperCase()}] {d.message}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      } else if (meta && Object.keys(meta).length > 0) {
                        return (
                          <pre style={{ margin: "4px 0 0 0", padding: "8px", background: "rgba(0,0,0,0.3)", borderRadius: "4px", fontSize: "10px", color: "#a5b4fc", overflowX: "auto", fontFamily: "monospace" }}>
                            {JSON.stringify(meta, null, 2)}
                          </pre>
                        );
                      }
                      return null;
                    })()}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
