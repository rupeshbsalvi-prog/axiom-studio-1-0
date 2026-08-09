import React, { useEffect, useState, useRef } from "react";
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Film,
  Sliders,
  Layers,
  CheckCircle,
  AlertTriangle,
  Download,
} from "lucide-react";

import { eventBus } from "../../../platform/services/EventBus";
import { stateService } from "../../../platform/services/StateService";
import { MOTION_INITIAL_STATE, type MotionStudioState } from "./MotionState";
import { evaluateMotionRuntimeAuthority } from "./MotionRuntimeAuthority";
import { isRuntimeActive } from "../../../runtime/activation/RuntimeActivationService";
import { dispatchDryRunAction } from "../../../runtime/activation/RuntimeActionDispatcher";
import {
  intakeDryRunPreview,
  serializeCanvasPreviewState,
} from "../../../workspace/CanvasPreviewIntakeService";
import type { AxiomProjectDraft } from "../../projects/projectDraft";
import type { MotionLayer } from "../../services/motionTypes";

interface MotionPanelProps {
  project?: AxiomProjectDraft | null;
  onUpdateProject?: (project: AxiomProjectDraft) => void;
}

export function MotionPanel({ project, onUpdateProject }: MotionPanelProps) {
  const [motionState, setMotionState] = useState<MotionStudioState>(MOTION_INITIAL_STATE);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playhead, setPlayhead] = useState(0);
  const [duration, setDuration] = useState(100);
  const [selectedLayerId, setSelectedLayerId] = useState<string | null>(null);

  const [dispatchResultMsg, setDispatchResultMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [isDispatching, setIsDispatching] = useState(false);

  const playbackIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Check active promoted motion runtime liveness
  const isMockMotionActive = isRuntimeActive("mock-motion-studio");

  // Sync state with StateService
  useEffect(() => {
    const hydrate = () => {
      const s = stateService.getState()["motion.state"] || MOTION_INITIAL_STATE;
      setMotionState(s);
      setPlayhead(s.playheadFrame);
      setDuration(s.durationFrames);
      setSelectedLayerId(s.selectedLayerId);
    };

    hydrate();
    const unsub = eventBus.subscribe("state:changed", hydrate);
    return () => {
      unsub();
      if (playbackIntervalRef.current) {
        clearInterval(playbackIntervalRef.current);
      }
    };
  }, []);

  const updateState = (updater: (prev: MotionStudioState) => MotionStudioState) => {
    const next = updater(motionState);
    stateService.setState({
      "motion.state": next,
    });
    eventBus.publish("state:changed", stateService.getState());
  };

  // Timeline playback loop (changes local UI state only)
  useEffect(() => {
    if (isPlaying) {
      playbackIntervalRef.current = setInterval(() => {
        setPlayhead((prev) => {
          const next = prev >= duration - 1 ? 0 : prev + 1;
          updateState((curr) => ({ ...curr, playheadFrame: next }));
          return next;
        });
      }, 100);
    } else {
      if (playbackIntervalRef.current) {
        clearInterval(playbackIntervalRef.current);
        playbackIntervalRef.current = null;
      }
    }
    return () => {
      if (playbackIntervalRef.current) {
        clearInterval(playbackIntervalRef.current);
      }
    };
  }, [isPlaying, duration]);

  const handlePlayToggle = () => {
    setIsPlaying(!isPlaying);
    updateState((curr) => ({ ...curr, isPlaying: !isPlaying }));
  };

  const handleScrub = (val: number) => {
    setPlayhead(val);
    updateState((curr) => ({ ...curr, playheadFrame: val }));
  };

  const handleSelectLayer = (layerId: string) => {
    const nextSelected = selectedLayerId === layerId ? null : layerId;
    setSelectedLayerId(nextSelected);
    updateState((curr) => ({ ...curr, selectedLayerId: nextSelected }));
  };

  const handleAddLayer = (type: MotionLayer["type"]) => {
    const newLayer: MotionLayer = {
      id: `layer_motion_${Math.random().toString(36).substring(2, 8)}`,
      name: `${type.toUpperCase()} Layer`,
      type,
      visible: true,
      opacity: 1,
      blendMode: "normal",
      bounds: { x: 100, y: 100, width: 300, height: 200 },
      source: "runtime-mock",
    };

    updateState((curr) => {
      const nextLayers = [...curr.layers, newLayer];
      return {
        ...curr,
        layers: nextLayers,
        layerOrder: [...curr.layerOrder, newLayer.id],
      };
    });
  };

  // Dispatch motion dry-run frame render
  const handleDispatchFrame = async () => {
    if (!project || !onUpdateProject) return;
    if (!isMockMotionActive) return;

    setDispatchResultMsg(null);
    setIsDispatching(true);

    // 1. Evaluate Motion runtime authority (Studio UI Level)
    const authority = evaluateMotionRuntimeAuthority("generateMotion");
    if (!authority.allowed) {
      setDispatchResultMsg({
        type: "error",
        text: authority.message,
      });
      setIsDispatching(false);
      return;
    }

    try {
      // 2. Dispatch Dry-Run action (Sandbox level - must use "mock-motion-studio" runtime id explicitly)
      const result = await dispatchDryRunAction({
        runtimeId: "mock-motion-studio",
        actionId: "renderMotionFrame",
        payload: { frame: playhead },
      });

      // 3. Prevent preview intake if dispatch is denied/failed
      if (result.status === "denied") {
        setDispatchResultMsg({
          type: "error",
          text: result.diagnostics[0]?.message || "Dispatch denied by sandbox policy.",
        });
        setIsDispatching(false);
        return;
      }

      if (!result.preview) {
        setDispatchResultMsg({
          type: "error",
          text: "No preview payload returned from dispatch.",
        });
        setIsDispatching(false);
        return;
      }

      // 4. Submit successful dry-run preview to intake service
      const intake = intakeDryRunPreview({
        runtimeId: "mock-motion-studio",
        actionId: "renderMotionFrame",
        preview: result.preview,
      });

      if (intake.success && intake.candidate) {
        // 5. Serialize and update WorkspaceShell project state
        const intakeState = serializeCanvasPreviewState();
        const updatedProject: AxiomProjectDraft = {
          ...project,
          canvasPreview: {
            ...project.canvasPreview,
            schemaVersion: "0.5.0",
            savedAt: new Date().toISOString(),
            candidates: intakeState.candidates,
            assemblyPlans: intakeState.assemblyPlans,
            projections: project.canvasPreview?.projections || [],
            applications: project.canvasPreview?.applications || [],
          },
        };
        onUpdateProject(updatedProject);

        setDispatchResultMsg({
          type: "success",
          text: `Frame ${playhead} preview successfully dispatched and queued.`,
        });
      } else {
        setDispatchResultMsg({
          type: "error",
          text: intake.diagnostics[0]?.message || "Intake validation failed.",
        });
      }
    } catch (err: any) {
      setDispatchResultMsg({
        type: "error",
        text: err.message || "An unexpected error occurred during dispatch.",
      });
    } finally {
      setIsDispatching(false);
    }
  };

  return (
    <section
      className="studio-production-panel studio-production-panel--motion"
      aria-label="Motion production workspace"
      data-design-language="axiom-pro-panel-v1"
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        background: "#090d16",
        color: "#f8fafc",
        fontFamily: "sans-serif",
      }}
    >
      {/* Header bar */}
      <header
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "16px 24px",
          borderBottom: "1px solid rgba(255, 255, 255, 0.05)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <Film size={20} style={{ color: "#a5b4fc" }} />
          <h2 style={{ fontSize: "16px", fontWeight: 600, margin: 0 }}>Motion Studio</h2>
        </div>
        <button
          onClick={handleDispatchFrame}
          disabled={isDispatching || !isMockMotionActive}
          style={{
            background: isMockMotionActive ? "rgba(99, 102, 241, 0.2)" : "rgba(255, 255, 255, 0.04)",
            border: "1px solid " + (isMockMotionActive ? "rgba(99, 102, 241, 0.4)" : "rgba(255, 255, 255, 0.08)"),
            borderRadius: "6px",
            color: isMockMotionActive ? "#a5b4fc" : "#64748b",
            fontSize: "12px",
            fontWeight: 600,
            cursor: isMockMotionActive ? "pointer" : "not-allowed",
            padding: "8px 16px",
          }}
        >
          {isDispatching ? "Dispatching..." : "Dispatch Frame Render"}
        </button>
      </header>

      {/* Main Workspace split */}
      <div className="studio-motion-body" style={{ display: "flex", flex: 1, overflow: "hidden" }}>
        {/* Left Side: Layer Manager */}
        <aside
          className="studio-panel-rail studio-panel-rail--planner"
          aria-label="Motion layers"
          style={{
            width: "280px",
            borderRight: "1px solid rgba(255, 255, 255, 0.05)",
            display: "flex",
            flexDirection: "column",
            background: "rgba(15, 23, 42, 0.3)",
          }}
        >
          <div style={{ padding: "16px", borderBottom: "1px solid rgba(255, 255, 255, 0.05)" }}>
            <h3 style={{ fontSize: "12px", color: "#64748b", fontWeight: 600, margin: "0 0 12px 0", textTransform: "uppercase" }}>
              Animation Layers
            </h3>
            <div style={{ display: "flex", gap: "8px" }}>
              <button
                onClick={() => handleAddLayer("motion")}
                style={{
                  flex: 1,
                  background: "rgba(255, 255, 255, 0.05)",
                  border: "none",
                  borderRadius: "4px",
                  color: "#e2e8f0",
                  fontSize: "11px",
                  padding: "6px",
                  cursor: "pointer",
                }}
              >
                + Motion
              </button>
              <button
                onClick={() => handleAddLayer("effect")}
                style={{
                  flex: 1,
                  background: "rgba(255, 255, 255, 0.05)",
                  border: "none",
                  borderRadius: "4px",
                  color: "#e2e8f0",
                  fontSize: "11px",
                  padding: "6px",
                  cursor: "pointer",
                }}
              >
                + Effect
              </button>
            </div>
          </div>

          <div style={{ flex: 1, overflowY: "auto", padding: "8px" }}>
            {motionState.layers.length === 0 ? (
              <p style={{ fontSize: "11px", color: "#475569", textAlign: "center", marginTop: "24px" }}>
                No layers defined yet.
              </p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                {motionState.layers.map((layer) => (
                  <div
                    key={layer.id}
                    data-testid="motion-layer-item"
                    onClick={() => handleSelectLayer(layer.id)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "8px 12px",
                      borderRadius: "4px",
                      background: selectedLayerId === layer.id ? "rgba(99, 102, 241, 0.15)" : "transparent",
                      border: "1px solid " + (selectedLayerId === layer.id ? "rgba(99, 102, 241, 0.3)" : "transparent"),
                      cursor: "pointer",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <Layers size={13} style={{ color: "#94a3b8" }} />
                      <span style={{ fontSize: "12px", color: "#e2e8f0" }}>{layer.name}</span>
                    </div>
                    <span style={{ fontSize: "10px", color: "#475569", textTransform: "uppercase" }}>
                      {layer.type}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </aside>

        {/* Center: Canvas View & Warnings */}
        <section
          className="studio-panel-canvas studio-panel-canvas--motion"
          aria-label="Motion canvas"
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "24px",
            position: "relative",
          }}
        >
          {/* Active Promoted Runtime Guard Banner */}
          {!isMockMotionActive && (
            <div
              data-testid="guarded-state-banner"
              style={{
                position: "absolute",
                top: "24px",
                left: "24px",
                right: "24px",
                background: "rgba(239, 68, 68, 0.1)",
                border: "1px solid rgba(239, 68, 68, 0.3)",
                borderRadius: "6px",
                padding: "12px 16px",
                display: "flex",
                alignItems: "center",
                gap: "12px",
              }}
            >
              <AlertTriangle size={18} style={{ color: "#ef4444" }} />
              <div>
                <strong style={{ fontSize: "12px", color: "#fca5a5" }}>Guarded State Active</strong>
                <p style={{ fontSize: "11px", color: "#f87171", margin: "2px 0 0 0" }}>
                  No active promoted Motion runtime is available. Please activate 'mock-motion-studio' in the Registry panel.
                </p>
              </div>
            </div>
          )}

          {/* Telemetry/Dispatch Result banner */}
          {dispatchResultMsg && (
            <div
              style={{
                position: "absolute",
                top: isMockMotionActive ? "24px" : "90px",
                left: "24px",
                right: "24px",
                background: dispatchResultMsg.type === "success" ? "rgba(16, 185, 129, 0.1)" : "rgba(239, 68, 68, 0.1)",
                border: "1px solid " + (dispatchResultMsg.type === "success" ? "rgba(16, 185, 129, 0.3)" : "rgba(239, 68, 68, 0.3)"),
                borderRadius: "6px",
                padding: "12px 16px",
                display: "flex",
                alignItems: "center",
                gap: "12px",
              }}
            >
              {dispatchResultMsg.type === "success" ? (
                <CheckCircle size={18} style={{ color: "#10b981" }} />
              ) : (
                <AlertTriangle size={18} style={{ color: "#ef4444" }} />
              )}
              <span style={{ fontSize: "11px", color: dispatchResultMsg.type === "success" ? "#a7f3d0" : "#fca5a5" }}>
                {dispatchResultMsg.text}
              </span>
            </div>
          )}

          {/* Virtual Canvas Box */}
          <div
            style={{
              width: "480px",
              height: "270px",
              background: "#020617",
              border: "1px solid rgba(255, 255, 255, 0.05)",
              boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.3)",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              position: "relative",
            }}
          >
            <div style={{ fontSize: "11px", color: "#475569" }}>Virtual Motion Canvas (16:9)</div>
            <div style={{ fontSize: "10px", color: "#475569", marginTop: "4px" }}>
              Active Playhead Frame: {playhead}
            </div>
          </div>
        </section>
      </div>

      {/* Bottom Area: Playback Timeline & Scrubbing */}
      <footer
        className="studio-motion-timeline"
        aria-label="Motion timeline"
        style={{
          borderTop: "1px solid rgba(255, 255, 255, 0.05)",
          background: "rgba(15, 23, 42, 0.4)",
          padding: "16px 24px",
          display: "flex",
          flexDirection: "column",
          gap: "12px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          {/* Playback Controls */}
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <button
              aria-label="Skip Back"
              onClick={() => handleScrub(0)}
              style={{
                background: "transparent",
                border: "none",
                color: "#94a3b8",
                cursor: "pointer",
              }}
            >
              <SkipBack size={16} />
            </button>
            <button
              aria-label="Play/Pause"
              onClick={handlePlayToggle}
              style={{
                background: "rgba(99, 102, 241, 0.2)",
                border: "1px solid rgba(99, 102, 241, 0.4)",
                borderRadius: "50%",
                color: "#a5b4fc",
                width: "32px",
                height: "32px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
              }}
            >
              {isPlaying ? <Pause size={16} /> : <Play size={16} />}
            </button>
            <button
              aria-label="Skip Forward"
              onClick={() => handleScrub(duration - 1)}
              style={{
                background: "transparent",
                border: "none",
                color: "#94a3b8",
                cursor: "pointer",
              }}
            >
              <SkipForward size={16} />
            </button>
          </div>

          {/* Timeline slider */}
          <div style={{ flex: 1, display: "flex", alignItems: "center", gap: "12px" }}>
            <span style={{ fontSize: "11px", color: "#64748b", minWidth: "24px" }}>{playhead}</span>
            <input
              type="range"
              min={0}
              max={duration - 1}
              value={playhead}
              onChange={(e) => handleScrub(Number(e.target.value))}
              style={{
                flex: 1,
                cursor: "pointer",
                accentColor: "#6366f1",
              }}
            />
            <span style={{ fontSize: "11px", color: "#64748b", minWidth: "24px" }}>{duration - 1}</span>
          </div>
        </div>
      </footer>
    </section>
  );
}
