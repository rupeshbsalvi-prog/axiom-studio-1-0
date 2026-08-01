import { memo } from "react";
import type { HardwareTier } from "../director/ExperienceDirector";
import type { SignatureFlags, CinematicStats, LifecycleTestStatus, LifecycleTestMetrics } from "./types";

export interface CinematicDiagnosticsPanelProps {
  quality: HardwareTier;
  onChangeQuality: (quality: HardwareTier) => void;
  variant: "A" | "B" | "C";
  onChangeVariant: (variant: "A" | "B" | "C") => void;
  signature: SignatureFlags;
  onChangeSignature: (patch: Partial<SignatureFlags>) => void;
  stressCycling: boolean;
  onToggleStressCycling: () => void;
  continuousResize: boolean;
  onToggleContinuousResize: () => void;
  performanceStress: boolean;
  onTogglePerformanceStress: () => void;
  lossSimulation: boolean;
  onSimulateContextLoss: () => void;
  lifecycleTestStatus: LifecycleTestStatus;
  lifecycleTestMetrics: LifecycleTestMetrics | null;
  onRunLifecycleValidation: () => void;
  onResetDiagnostics: () => void;
  stats: CinematicStats;
  compliance: { label: string; className: string };
}

export const CinematicDiagnosticsPanel = memo(function CinematicDiagnosticsPanel({
  quality,
  onChangeQuality,
  variant,
  onChangeVariant,
  signature,
  onChangeSignature,
  stressCycling,
  onToggleStressCycling,
  continuousResize,
  onToggleContinuousResize,
  performanceStress,
  onTogglePerformanceStress,
  lossSimulation,
  onSimulateContextLoss,
  lifecycleTestStatus,
  lifecycleTestMetrics,
  onRunLifecycleValidation,
  onResetDiagnostics,
  stats,
  compliance,
}: CinematicDiagnosticsPanelProps) {
  const renderLifecycleMetrics = () => {
    if (!lifecycleTestMetrics) return null;
    if (typeof lifecycleTestMetrics === "string") {
      return lifecycleTestMetrics;
    }
    const initial = lifecycleTestMetrics.initialMetrics;
    const final = lifecycleTestMetrics.finalMetrics;
    const resultStr = lifecycleTestMetrics.passed ? "PASSED" : "FAILED";
    return `${resultStr}: 100 cycles. Geoms: ${initial?.geometries ?? 0}->${final?.geometries ?? 0}, Progs: ${initial?.programs ?? 0}->${final?.programs ?? 0}`;
  };

  return (
    <div className="webgl-overlay-controls" style={{ pointerEvents: "auto" }}>
      {/* Header with Compliance Status Badge */}
      <div className="dashboard-section header-section">
        <h2>Platform Diagnostics</h2>
        <span className={`compliance-badge ${compliance.className}`}>
          STATUS: {compliance.label}
        </span>
      </div>

      {/* Setting Quality & Variants */}
      <div className="dashboard-section">
        <h3>Quality Preset & LOD</h3>
        <div className="control-row grid-2">
          {(["high", "medium", "low"] as const).map((q) => (
            <button
              key={q}
              type="button"
              className={`control-btn ${quality === q ? "active" : ""}`}
              onClick={() => onChangeQuality(q)}
            >
              {q.toUpperCase()}
            </button>
          ))}
        </div>
        <div className="control-row" style={{ marginTop: "6px" }}>
          {(["A", "B", "C"] as const).map((v) => (
            <button
              key={v}
              type="button"
              className={`control-btn ${variant === v ? "active" : ""}`}
              onClick={() => onChangeVariant(v)}
              style={{ flex: 1 }}
            >
              Variant {v}
            </button>
          ))}
        </div>
      </div>

      {/* Signature Tests by Group */}
      <div className="dashboard-section signatures-section">
        <h3>Signature Tests</h3>
        
        <div className="sig-group">
          <span className="sig-label">Identity:</span>
          <div className="control-row grid-2">
            <button
              type="button"
              className={`control-btn ${signature.monochrome ? "active" : ""}`}
              onClick={() => onChangeSignature({ monochrome: !signature.monochrome })}
            >
              Monochrome
            </button>
            <button
              type="button"
              className={`control-btn ${signature.wireframe ? "active" : ""}`}
              onClick={() => onChangeSignature({ wireframe: !signature.wireframe })}
            >
              Wireframe
            </button>
            <button
              type="button"
              className={`control-btn ${signature.flatDiffuse ? "active" : ""}`}
              onClick={() => onChangeSignature({ flatDiffuse: !signature.flatDiffuse })}
            >
              Flat Diffuse
            </button>
            <button
              type="button"
              className={`control-btn ${signature.basicShader ? "active" : ""}`}
              onClick={() => onChangeSignature({ basicShader: !signature.basicShader })}
            >
              Basic Shader
            </button>
          </div>
        </div>

        <div className="sig-group" style={{ marginTop: "8px" }}>
          <span className="sig-label">Rendering & Motion:</span>
          <div className="control-row grid-2">
            <button
              type="button"
              className={`control-btn ${signature.opaque ? "active" : ""}`}
              onClick={() => onChangeSignature({ opaque: !signature.opaque })}
            >
              Opaque Shell
            </button>
            <button
              type="button"
              className={`control-btn ${signature.noLights ? "active" : ""}`}
              onClick={() => onChangeSignature({ noLights: !signature.noLights })}
            >
              No Lights
            </button>
            <button
              type="button"
              className={`control-btn ${signature.noBloom ? "active" : ""}`}
              onClick={() => onChangeSignature({ noBloom: !signature.noBloom })}
            >
              No Bloom
            </button>
            <button
              type="button"
              className={`control-btn ${signature.paused ? "active" : ""}`}
              onClick={() => onChangeSignature({ paused: !signature.paused })}
            >
              Paused
            </button>
          </div>
        </div>

        <div className="sig-group" style={{ marginTop: "8px" }}>
          <span className="sig-label">Scale Scenarios:</span>
          <div className="control-row grid-2">
            {(["favicon32", "favicon64", "thumbnail", "hero"] as const).map((mode) => (
              <button
                key={mode}
                type="button"
                className={`control-btn ${signature.scaleMode === mode ? "active" : ""}`}
                onClick={() => onChangeSignature({ scaleMode: mode })}
              >
                {mode === "favicon32"
                  ? "32x32 Favicon"
                  : mode === "favicon64"
                    ? "64x64 Preview"
                    : mode === "thumbnail"
                      ? "Thumbnail"
                      : "Hero Scale"}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Runtime Stress Tools */}
      <div className="dashboard-section stress-tools">
        <h3>Stress & Diagnostics Tools</h3>
        <div className="control-row grid-2">
          <button
            type="button"
            className={`control-btn ${stressCycling ? "active" : ""}`}
            onClick={onToggleStressCycling}
          >
            Rapid Cycling
          </button>
          <button
            type="button"
            className={`control-btn ${continuousResize ? "active" : ""}`}
            onClick={onToggleContinuousResize}
          >
            Resize Wiggle
          </button>
          <button
            type="button"
            className={`control-btn ${performanceStress ? "active" : ""}`}
            onClick={onTogglePerformanceStress}
          >
            CPU Stress Mode
          </button>
          <button
            type="button"
            className={`control-btn ${lossSimulation ? "active" : ""}`}
            onClick={onSimulateContextLoss}
          >
            {lossSimulation ? "Lost Context..." : "Lose Context"}
          </button>
        </div>
        <div style={{ display: "flex", gap: "6px", marginTop: "6px" }}>
          <button
            type="button"
            className="control-btn"
            style={{ flex: 1 }}
            onClick={onRunLifecycleValidation}
          >
            {lifecycleTestStatus && lifecycleTestStatus !== "idle"
              ? `Lifecycle: ${lifecycleTestStatus.toUpperCase()}`
              : "Lifecycle Stress Test"}
          </button>
          <button
            type="button"
            className="control-btn danger"
            onClick={onResetDiagnostics}
          >
            Reset
          </button>
        </div>
        {lifecycleTestMetrics && (
          <div className="lifecycle-log" style={{ fontSize: "10px", marginTop: "6px", background: "rgba(0,0,0,0.25)", padding: "5px", borderRadius: "3px", borderLeft: "2px solid #69d4e8" }}>
            {renderLifecycleMetrics()}
          </div>
        )}
      </div>

      {/* Observability Telemetry Categories */}
      <div className="dashboard-section telemetry">
        <h3>Diagnostics Telemetry</h3>
        
        <div className="telemetry-category">
          <h4>Rendering</h4>
          <div className="telemetry-grid">
            <div>
              <span>FPS</span>
              <strong>{stats.fps}</strong>
            </div>
            <div>
              <span>Frame Total</span>
              <strong>{stats.frameTime} ms</strong>
            </div>
            <div>
              <span>GPU Render</span>
              <strong>{stats.gpuTime} ms</strong>
            </div>
            <div>
              <span>CPU Update</span>
              <strong>{stats.cpuTime} ms</strong>
            </div>
          </div>
        </div>

        <div className="telemetry-category" style={{ marginTop: "6px" }}>
          <h4>Geometry</h4>
          <div className="telemetry-grid">
            <div>
              <span>Draw Calls</span>
              <strong>{stats.drawCalls}</strong>
            </div>
            <div>
              <span>Triangles</span>
              <strong>{stats.triangles}</strong>
            </div>
            <div>
              <span>Vertices</span>
              <strong>{stats.vertices}</strong>
            </div>
            <div>
              <span>Mesh Count</span>
              <strong>{stats.meshCount}</strong>
            </div>
          </div>
        </div>

        <div className="telemetry-category" style={{ marginTop: "6px" }}>
          <h4>Memory Estimates</h4>
          <div className="telemetry-grid">
            <div>
              <span>GPU Memory</span>
              <strong>{stats.gpuMemory} MB</strong>
            </div>
            <div>
              <span>Geometry Buff</span>
              <strong>{stats.geometryMemory} KB</strong>
            </div>
          </div>
        </div>

        <div className="telemetry-category" style={{ marginTop: "6px" }}>
          <h4>Runtime & Browser Details</h4>
          <div className="telemetry-grid">
            <div>
              <span>Active Profile</span>
              <span className="telemetry-val">{stats.activeState}</span>
            </div>
            <div>
              <span>LOD Particles</span>
              <strong>{stats.particleCount}</strong>
            </div>
            <div>
              <span>DPR / Screen</span>
              <span className="telemetry-val">{stats.dpr.toFixed(1)} / {stats.canvasSize}</span>
            </div>
            <div>
              <span>WebGL Vendor</span>
              <span className="telemetry-val" title={stats.webglRenderer}>{stats.vendor.substring(0, 15)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});
