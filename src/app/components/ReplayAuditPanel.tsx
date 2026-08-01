import { memo } from "react";
import type { ReplayAuditEvent } from "../services/brainTypes";
import { CheckCircle, XCircle, FileJson, Clock, Play } from "lucide-react";

export interface ReplayAuditPanelProps {
  events: ReplayAuditEvent[];
}

export const ReplayAuditPanel = memo(function ReplayAuditPanel({ events }: ReplayAuditPanelProps) {
  const getIcon = (type: string) => {
    switch (type) {
      case "intent_received":
        return <Play size={14} style={{ color: "#38bdf8" }} />;
      case "plan_generated":
        return <Clock size={14} style={{ color: "#818cf8" }} />;
      case "proposal_accepted":
        return <CheckCircle size={14} style={{ color: "#34d399" }} />;
      case "proposal_rejected":
      case "authority_blocked":
        return <XCircle size={14} style={{ color: "#f87171" }} />;
      case "export_requested":
        return <FileJson size={14} style={{ color: "#fbbf24" }} />;
      default:
        return <Clock size={14} style={{ color: "#94a3b8" }} />;
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "10px", padding: "16px", background: "rgba(255,255,255,0.01)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: "8px" }}>
      <h4 style={{ margin: 0, fontSize: "11px", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em" }}>Session Audit Trail</h4>
      <div style={{ display: "flex", flexDirection: "column", gap: "12px", position: "relative", marginTop: "6px" }}>
        {events.map((event, index) => (
          <div key={event.id} style={{ display: "flex", gap: "12px", position: "relative" }}>
            {/* Timeline Line */}
            {index < events.length - 1 && (
              <div style={{ position: "absolute", left: "9px", top: "20px", bottom: "-12px", width: "1px", background: "rgba(255,255,255,0.05)" }} />
            )}
            
            {/* Icon container */}
            <div style={{ width: "20px", height: "20px", borderRadius: "50%", background: "rgba(15, 23, 42, 0.8)", border: "1px solid rgba(255,255,255,0.08)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1 }}>
              {getIcon(event.type)}
            </div>

            {/* Content */}
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                <span style={{ fontSize: "12px", fontWeight: 600, color: "#f1f5f9" }}>{event.title}</span>
                <span style={{ fontSize: "9px", color: "#64748b", fontFamily: "monospace" }}>
                  {new Date(event.timestamp).toLocaleTimeString()}
                </span>
              </div>
              {event.description && (
                <p style={{ margin: "2px 0 0", fontSize: "11px", color: "#94a3b8" }}>{event.description}</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
});
