// ---------------------------------------------------------------------------
// Phase 12 — Promoted Runtime Dry-Run Action Dispatch Types
//
// These types define the Phase 12 dry-run dispatch contract. All four boolean
// literal fields are enforced at the type level — changing them is a compile
// error. Phase 12 does not execute runtime package code.
// ---------------------------------------------------------------------------

export type RuntimeActionDispatchStatus = "simulated" | "denied" | "failed";

export type RuntimeActionDispatchDiagnosticCode =
  | "dry_run_simulated"
  | "runtime_not_found"
  | "runtime_not_active"
  | "runtime_not_promoted"
  | "runtime_not_trusted"
  | "action_not_declared"
  | "mock_handler_missing"
  | "capability_denied"
  | "dispatch_policy_denied"
  | "dry_run_failed"
  | "unknown_dispatch_error";

export interface RuntimeActionDispatchDiagnostic {
  code: RuntimeActionDispatchDiagnosticCode;
  severity: "info" | "warning" | "error";
  message: string;
  runtimeId?: string;
  actionId?: string;
  packageId?: string;
}

export type RuntimeDryRunPreviewKind = "canvas_preview" | "export_preview" | "assembly_preview" | "photo_layout_preview";

export interface RuntimeDryRunPreviewCanvas {
  width: number;
  height: number;
  aspectRatio: string;
  background: "transparent" | "solid" | "gradient";
}

export interface RuntimeDryRunPreviewLayer {
  id: string;
  label: string;
  type: "image" | "vector" | "text" | "motion" | "video" | "effect" | "export";
  bounds: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  opacity: number;
  blendMode: "normal" | "multiply" | "screen" | "overlay";
  source: "generated" | "project" | "runtime-mock" | "export";
}

export interface RuntimeDryRunPreviewContractV1 {
  contractVersion: "runtime-dry-run-preview.v1";
  kind: RuntimeDryRunPreviewKind;
  title: string;
  summary: string;
  studioId: string;
  canvas: RuntimeDryRunPreviewCanvas;
  layers: RuntimeDryRunPreviewLayer[];
  assemblySteps: string[];
  exportTargets: string[];
  estimatedDurationMs: number;
  approvedForCanvasAssembly: false;
  security: {
    dryRun: true;
    noExecutionPerformed: true;
    runtimeCodeLoaded: false;
    moduleUrlExecuted: false;
  };
  metadata?: Record<string, unknown>;
}

/**
 * The result returned by every `dispatchDryRunAction` call.
 *
 * Security invariants are enforced at the type level:
 *   - dryRun: true           — always a simulation, never real execution
 *   - noExecutionPerformed: true — manifest.entry.moduleUrl was NOT executed
 *   - runtimeCodeLoaded: false  — no runtime JS was dynamically loaded
 *   - moduleUrlExecuted: false  — module URL was not evaluated
 */
export interface RuntimeActionDispatchResult {
  status: RuntimeActionDispatchStatus;
  runtimeId: string;
  actionId: string;
  dryRun: true;
  noExecutionPerformed: true;
  runtimeCodeLoaded: false;
  moduleUrlExecuted: false;
  output?: unknown;
  preview?: RuntimeDryRunPreviewContractV1;
  logs: string[];
  diagnostics: RuntimeActionDispatchDiagnostic[];
  dispatchedAtUtc: string;
}
