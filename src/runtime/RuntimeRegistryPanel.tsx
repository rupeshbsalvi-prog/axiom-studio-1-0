import React, { useEffect, useState, useRef } from "react";
import {
  getAllRegistryEntries,
  disableRuntime,
  enableRuntime,
  RuntimeRegistryEntry,
} from "./RuntimeRegistry";
import {
  activateRuntime,
  isRuntimeActive,
  deactivateRuntime,
} from "./activation/RuntimeActivationService";
import { checkActivationEligibility } from "./activation/RuntimeActivationEligibilityPolicy";
import { getExecutionLog, dispatchDryRunAction } from "./activation/RuntimeActionDispatcher";
import { LOCAL_RUNTIME_ACTIONS } from "./activation/MockRuntimeExecutor";
import type { RuntimeActionDispatchResult } from "./activation/RuntimeActionDispatchTypes";
import {
  approveCanvasPreviewForAssembly,
  intakeDryRunPreview,
  type CanvasAssemblyPlan,
  type CanvasPreviewCandidate,
} from "../workspace/CanvasPreviewIntakeService";
import { loadLocalManifests } from "./manifest/LocalRuntimeManifestLoader";
import { getAllRestoredLabels } from "./RuntimeRestoredLabels";
import {
  RefreshCw,
  Play,
  Shield,
  Power,
  Upload,
  AlertTriangle,
  CheckCircle,
  Trash2,
  FileText,
  AlertOctagon,
} from "lucide-react";
import {
  previewRuntimePackageInstall,
  installRuntimePackage,
  uninstallRuntimePackage,
  getInstalledPackages,
  promotePackageToRuntime,
} from "./registry";
import type {
  PackageInstallRecord,
  RuntimePackageInstallPreview,
  PackageInstallDiagnostic,
} from "./registry";
import type { RuntimeRestoredActivationLabel, RuntimeExecutionRecord } from "../app/projects/projectDraft";
import type { HydrationResult } from "./RuntimeHydrationService";

type PanelTab = "runtimes" | "installed" | "install" | "execution-history";

export interface RuntimeRegistryPanelProps {
  onSaveRuntimeState?: () => void;
  onRestoreRuntimeState?: () => Promise<HydrationResult | undefined> | HydrationResult | undefined | void;
}

export function RuntimeRegistryPanel({ onSaveRuntimeState, onRestoreRuntimeState }: RuntimeRegistryPanelProps = {}) {
  const [activeTab, setActiveTab] = useState<PanelTab>("runtimes");
  const [entries, setEntries] = useState<RuntimeRegistryEntry[]>([]);
  const [isReloading, setIsReloading] = useState(false);
  const [restoredLabels, setRestoredLabels] = useState<RuntimeRestoredActivationLabel[]>([]);
  const [executionLogs, setExecutionLogs] = useState<RuntimeExecutionRecord[]>([]);
  const [hydrationResult, setHydrationResult] = useState<HydrationResult | null>(null);

  // Install package flow states
  const [uploadText, setUploadText] = useState("");
  const [installPreview, setInstallPreview] = useState<RuntimePackageInstallPreview | null>(null);
  const [previewDiagList, setPreviewDiagList] = useState<PackageInstallDiagnostic[]>([]);
  const [installResultMsg, setInstallResultMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [isInstalling, setIsInstalling] = useState(false);
  const [installedList, setInstalledList] = useState<PackageInstallRecord[]>([]);
  const [promoMsg, setPromoMsg] = useState<{ [packageId: string]: string }>({});
  // Phase 12 — dry-run dispatch results keyed by "runtimeId::actionId"
  const [dryRunResults, setDryRunResults] = useState<Record<string, RuntimeActionDispatchResult | null>>({});
  const [previewCandidates, setPreviewCandidates] = useState<Record<string, CanvasPreviewCandidate | null>>({});
  const [assemblyPlans, setAssemblyPlans] = useState<Record<string, CanvasAssemblyPlan | null>>({});
  const [previewMessages, setPreviewMessages] = useState<Record<string, string>>({});

  const handlePromotePackage = (pkgId: string) => {
    try {
      const res = promotePackageToRuntime(pkgId);
      if (res.success) {
        setPromoMsg((prev) => ({
          ...prev,
          [pkgId]: "Promoted to RuntimeRegistry. Activation required manually. No execution performed.",
        }));
        refreshEntries();
      } else {
        const diag = res.diagnostics[res.diagnostics.length - 1]?.message || "Promotion blocked by policy.";
        setPromoMsg((prev) => ({
          ...prev,
          [pkgId]: `Error: ${diag}`,
        }));
      }
    } catch (err: any) {
      setPromoMsg((prev) => ({
        ...prev,
        [pkgId]: `Error: ${err.message || String(err)}`,
      }));
    }
  };

  const fileInputRef = useRef<HTMLInputElement>(null);

  const refreshEntries = () => {
    setEntries(getAllRegistryEntries());
    setRestoredLabels(getAllRestoredLabels());
    setExecutionLogs(getExecutionLog());
    setInstalledList(getInstalledPackages());
  };

  useEffect(() => {
    refreshEntries();
    const interval = setInterval(refreshEntries, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleRestore = async () => {
    if (onRestoreRuntimeState) {
      const result = await onRestoreRuntimeState();
      refreshEntries();
      if (result) {
        setHydrationResult(result);
      }
    }
  };

  const handleReload = async () => {
    setIsReloading(true);
    try {
      await loadLocalManifests({ isDevelopment: true });
    } catch (err) {
      console.error(err);
    } finally {
      setIsReloading(false);
      refreshEntries();
    }
  };

  const handleToggleEnable = (entry: RuntimeRegistryEntry) => {
    if (entry.status === "registered") {
      disableRuntime(entry.manifest.id);
      deactivateRuntime(entry.manifest.id);
    } else if (entry.status === "disabled") {
      enableRuntime(entry.manifest.id);
    }
    refreshEntries();
  };

  const handleActivate = async (runtimeId: string) => {
    try {
      const entry = entries.find((e) => e.manifest.id === runtimeId);
      const capabilities = entry?.manifest.capabilities ?? [];
      await activateRuntime(runtimeId, {
        grantedCapabilities: capabilities,
      });
    } catch (err: any) {
      console.error(err);
    }
    refreshEntries();
  };

  const handleDeactivate = (runtimeId: string) => {
    deactivateRuntime(runtimeId);
    refreshEntries();
  };

  const handleDryRunDispatch = async (runtimeId: string, actionId: string) => {
    const key = `${runtimeId}::${actionId}`;
    setDryRunResults((prev) => ({ ...prev, [key]: null }));
    setPreviewCandidates((prev) => ({ ...prev, [key]: null }));
    setAssemblyPlans((prev) => ({ ...prev, [key]: null }));
    setPreviewMessages((prev) => ({ ...prev, [key]: "" }));
    const result = await dispatchDryRunAction({ runtimeId, actionId });
    setDryRunResults((prev) => ({ ...prev, [key]: result }));
  };

  const handleQueuePreview = (runtimeId: string, actionId: string, result: RuntimeActionDispatchResult) => {
    const key = `${runtimeId}::${actionId}`;
    if (!result.preview) {
      setPreviewMessages((prev) => ({ ...prev, [key]: "No preview payload is available for this dry run." }));
      return;
    }

    const intake = intakeDryRunPreview({
      runtimeId,
      actionId,
      preview: result.preview,
    });

    if (intake.success && intake.candidate) {
      setPreviewCandidates((prev) => ({ ...prev, [key]: intake.candidate! }));
      setPreviewMessages((prev) => ({ ...prev, [key]: "Preview queued for canvas review. Approval still required." }));
    } else {
      setPreviewMessages((prev) => ({
        ...prev,
        [key]: intake.diagnostics[0]?.message || "Preview intake failed.",
      }));
    }
  };

  const handleApprovePreview = (runtimeId: string, actionId: string) => {
    const key = `${runtimeId}::${actionId}`;
    const candidate = previewCandidates[key];
    if (!candidate) return;

    const approval = approveCanvasPreviewForAssembly({
      previewId: candidate.id,
      reviewerId: "runtime-registry-panel",
      note: "Approved from Runtime Registry dry-run preview panel.",
    });

    if (approval.success && approval.assemblyPlan && approval.candidate) {
      setPreviewCandidates((prev) => ({ ...prev, [key]: approval.candidate! }));
      setAssemblyPlans((prev) => ({ ...prev, [key]: approval.assemblyPlan! }));
      setPreviewMessages((prev) => ({ ...prev, [key]: "Assembly plan created after explicit approval." }));
    } else {
      setPreviewMessages((prev) => ({
        ...prev,
        [key]: approval.diagnostics[0]?.message || "Preview approval failed.",
      }));
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const text = event.target?.result as string;
      setUploadText(text);
      await processPackageText(text);
    };
    reader.readAsText(file);
  };

  const processPackageText = async (text: string) => {
    setInstallResultMsg(null);
    setInstallPreview(null);
    setPreviewDiagList([]);

    const result = await previewRuntimePackageInstall(text);
    if (!result.success) {
      setPreviewDiagList(result.diagnostics);
      setInstallResultMsg({
        type: "error",
        text: result.diagnostics[0]?.message || "Package parsing failed.",
      });
      return;
    }

    if (result.preview) {
      setInstallPreview(result.preview);
      setPreviewDiagList(result.diagnostics);
    }
  };

  const triggerInstall = async (confirmOverride = false) => {
    if (!installPreview) return;
    setIsInstalling(true);
    try {
      const res = await installRuntimePackage(installPreview, { confirmed: confirmOverride });
      if (res.success) {
        setInstallResultMsg({
          type: "success",
          text: `Successfully installed package: ${res.record.name} v${res.record.version}.`,
        });
        setInstallPreview(null);
        setUploadText("");
        if (fileInputRef.current) fileInputRef.current.value = "";
        refreshEntries();
      } else {
        setPreviewDiagList(res.diagnostics);
        if (res.status === "pending_confirmation") {
          setInstallResultMsg({
            type: "error",
            text: "Installation requires explicit user confirmation. Click 'Confirm & Install' to proceed.",
          });
        } else {
          setInstallResultMsg({
            type: "error",
            text: res.diagnostics[res.diagnostics.length - 1]?.message || "Install blocked by policy.",
          });
        }
      }
    } catch (e: any) {
      setInstallResultMsg({
        type: "error",
        text: `Installation failed: ${e.message || String(e)}`,
      });
    } finally {
      setIsInstalling(false);
    }
  };

  const triggerUninstall = (pkgId: string) => {
    const res = uninstallRuntimePackage(pkgId);
    if (res.success) {
      refreshEntries();
    } else {
      alert(res.diagnostics[0]?.message || "Failed to uninstall package.");
    }
  };

  const getTrustBadgeStyle = (level: string) => {
    switch (level) {
      case "trusted":
        return { bg: "rgba(16, 185, 129, 0.15)", border: "1px solid rgba(16, 185, 129, 0.3)", color: "#34d399", label: "TRUSTED SIGNATURE" };
      case "unsigned":
        return { bg: "rgba(245, 158, 11, 0.15)", border: "1px solid rgba(245, 158, 11, 0.3)", color: "#fbbf24", label: "UNSIGNED PACKAGE" };
      case "untrusted":
        return { bg: "rgba(249, 115, 22, 0.15)", border: "1px solid rgba(249, 115, 22, 0.3)", color: "#fb923c", label: "UNKNOWN SIGNER" };
      case "tampered":
        return { bg: "rgba(239, 68, 68, 0.15)", border: "1px solid rgba(239, 68, 68, 0.3)", color: "#f87171", label: "TAMPERED / CORRUPTED" };
      case "blocked":
        return { bg: "rgba(220, 38, 38, 0.2)", border: "1px solid rgba(220, 38, 38, 0.4)", color: "#fca5a5", label: "BLOCKED PUBLISHER" };
      default:
        return { bg: "rgba(148, 163, 184, 0.15)", border: "1px solid rgba(148, 163, 184, 0.3)", color: "#cbd5e1", label: "UNKNOWN" };
    }
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        background: "#090d16",
        color: "#e2e8f0",
        fontFamily: "system-ui, -apple-system, sans-serif",
      }}
    >
      {/* Header */}
      <div style={{ padding: "16px", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <Shield size={16} style={{ color: "#3b82f6" }} />
            <span style={{ fontWeight: 600, fontSize: "14px" }}>Runtime Registry & Installation Policy</span>
          </div>
          <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
            {onSaveRuntimeState && (
              <button
                onClick={onSaveRuntimeState}
                style={{
                  background: "rgba(59, 130, 246, 0.15)",
                  border: "1px solid rgba(59, 130, 246, 0.3)",
                  borderRadius: "4px",
                  color: "#60a5fa",
                  cursor: "pointer",
                  padding: "4px 8px",
                  fontSize: "11px",
                }}
              >
                Save
              </button>
            )}
            {onRestoreRuntimeState && (
              <button
                onClick={handleRestore}
                style={{
                  background: "rgba(16, 185, 129, 0.15)",
                  border: "1px solid rgba(16, 185, 129, 0.3)",
                  borderRadius: "4px",
                  color: "#34d399",
                  cursor: "pointer",
                  padding: "4px 8px",
                  fontSize: "11px",
                }}
              >
                Restore
              </button>
            )}
            <button onClick={handleReload} disabled={isReloading} style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "4px", color: "#94a3b8", cursor: "pointer", padding: "4px 8px", fontSize: "11px" }}>
              <RefreshCw size={12} className={isReloading ? "spin" : ""} />
            </button>
          </div>
        </div>

        {/* Tab Selection */}
        <div style={{ display: "flex", gap: "4px", borderBottom: "1px solid #1e293b" }}>
          {([
            { id: "runtimes", label: "Registered Runtimes" },
            { id: "installed", label: "Installed Packages" },
            { id: "install", label: "Install Runtime Package" },
            { id: "execution-history", label: "Execution History" }
          ] as { id: PanelTab; label: string }[]).map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: "8px 12px",
                background: activeTab === tab.id ? "#1e293b" : "transparent",
                border: "none",
                borderBottom: activeTab === tab.id ? "2px solid #3b82f6" : "2px solid transparent",
                color: activeTab === tab.id ? "#3b82f6" : "#64748b",
                cursor: "pointer",
                fontSize: "12px",
                fontWeight: activeTab === tab.id ? 500 : 400,
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content Area */}
      <div style={{ flex: 1, overflowY: "auto", padding: "16px" }}>
        
        {/* Tab 1: Registered Runtimes */}
        {activeTab === "runtimes" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {hydrationResult && hydrationResult.warnings.length > 0 && (
              <div style={{ background: "rgba(239, 68, 68, 0.1)", border: "1px solid rgba(239, 68, 68, 0.2)", borderRadius: "6px", padding: "12px", marginBottom: "16px" }}>
                <div style={{ fontSize: "11px", fontWeight: 600, color: "#f87171", marginBottom: "4px" }}>Hydration Warnings:</div>
                {hydrationResult.warnings.map((w, idx) => (
                  <div key={idx} style={{ fontSize: "10px", color: "#fca5a5" }}>• {w}</div>
                ))}
              </div>
            )}
            {entries.length === 0 ? (
              <div style={{ color: "#64748b", fontSize: "12px", textAlign: "center", padding: "24px" }}>No registered runtimes found.</div>
            ) : (
              entries.map((entry) => {
                const isActive = isRuntimeActive(entry.manifest.id);
                const eligibility = checkActivationEligibility(entry.manifest.id, {
                  grantedCapabilities: entry.manifest.capabilities ?? [],
                });
                const wasPreviouslyActive = restoredLabels.some((l) => l.runtimeId === entry.manifest.id);

                // Build status progression flow stage
                let flowStage = "Installed";
                if (entry.isPromoted) {
                  flowStage += " → Promoted";
                  if (eligibility.eligible) {
                    flowStage += " → Eligible";
                  }
                  if (isActive) {
                    flowStage += " → Activated";
                  }
                } else {
                  flowStage += " (First-Party)";
                  if (isActive) {
                    flowStage += " → Activated";
                  }
                }

                return (
                  <div key={entry.manifest.id} style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "8px", padding: "12px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px", alignItems: "flex-start" }}>
                      <div>
                        <h4 style={{ margin: 0, fontSize: "13px", color: "#f8fafc" }}>{entry.manifest.name ?? entry.manifest.id}</h4>
                        <div style={{ fontSize: "10px", color: "#64748b", marginTop: "4px" }}>ID: {entry.manifest.id} | Publisher: {entry.manifest.publisher}</div>
                        <div style={{ fontSize: "10px", color: "#94a3b8", marginTop: "4px" }}>Flow: <strong>{flowStage}</strong></div>
                        {wasPreviouslyActive && (
                          <span style={{ fontSize: "9px", color: "#f59e0b", background: "rgba(245, 158, 11, 0.1)", padding: "2px 4px", borderRadius: "4px", marginTop: "6px", display: "inline-block" }}>Previously Active</span>
                        )}
                        {!eligibility.eligible && !isActive && (
                          <div style={{ fontSize: "10px", color: "#f87171", marginTop: "6px", display: "flex", alignItems: "center", gap: "4px" }}>
                            <AlertTriangle size={11} />
                            <span>Ineligible: {eligibility.diagnostics[0]?.message}</span>
                          </div>
                        )}
                      </div>
                      <span style={{ fontSize: "9px", fontWeight: 600, color: isActive ? "#10b981" : eligibility.eligible ? "#60a5fa" : "#ef4444", background: isActive ? "rgba(16,185,129,0.1)" : eligibility.eligible ? "rgba(59,130,246,0.1)" : "rgba(239,68,68,0.1)", padding: "2px 6px", borderRadius: "4px" }}>
                        {isActive ? "ACTIVE" : eligibility.eligible ? "ELIGIBLE" : "INELIGIBLE"}
                      </span>
                    </div>
                    <div style={{ display: "flex", gap: "8px", marginTop: "12px" }}>
                      <button onClick={() => handleToggleEnable(entry)} style={{ flex: 1, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "4px", color: "#cbd5e1", padding: "6px", cursor: "pointer", fontSize: "11px" }}>
                        <Power size={11} style={{ marginRight: "4px" }} /> {entry.status === "disabled" ? "Enable" : "Disable"}
                      </button>
                      {entry.status === "registered" && (
                        <button
                          onClick={() => isActive ? handleDeactivate(entry.manifest.id) : handleActivate(entry.manifest.id)}
                          disabled={!isActive && !eligibility.eligible}
                          style={{
                            flex: 1,
                            background: isActive
                              ? "rgba(239,68,68,0.1)"
                              : eligibility.eligible
                              ? "rgba(16,185,129,0.1)"
                              : "rgba(255,255,255,0.02)",
                            border: "none",
                            borderRadius: "4px",
                            color: isActive
                              ? "#ef4444"
                              : eligibility.eligible
                              ? "#10b981"
                              : "#475569",
                            padding: "6px",
                            cursor: (!isActive && !eligibility.eligible) ? "not-allowed" : "pointer",
                            fontSize: "11px",
                          }}
                        >
                          <Play size={11} style={{ marginRight: "4px" }} /> {isActive ? "Deactivate" : "Activate"}
                        </button>
                      )}
                    </div>

                    {/* Phase 12 — Dry-Run Dispatch section for active promoted runtimes */}
                    {isActive && entry.isPromoted && (() => {
                      const actionDefs = LOCAL_RUNTIME_ACTIONS[entry.manifest.id] ?? [];
                      if (actionDefs.length === 0) return null;
                      return (
                        <div style={{ marginTop: "12px", borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: "10px" }}>
                          <div style={{ fontSize: "10px", color: "#94a3b8", marginBottom: "8px", fontWeight: 600, letterSpacing: "0.05em", textTransform: "uppercase" }}>
                            Dry-Run Actions
                          </div>
                          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                            {actionDefs.map((action) => {
                              const key = `${entry.manifest.id}::${action.id}`;
                              const result = dryRunResults[key];
                              const candidate = previewCandidates[key];
                              const assemblyPlan = assemblyPlans[key];
                              const previewMessage = previewMessages[key];
                              return (
                                <div key={action.id} style={{ background: "rgba(255,255,255,0.03)", borderRadius: "6px", padding: "8px 10px", border: "1px solid rgba(255,255,255,0.05)" }}>
                                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                    <div>
                                      <div style={{ fontSize: "11px", color: "#e2e8f0", fontWeight: 600 }}>{action.label}</div>
                                      <div style={{ fontSize: "9px", color: "#64748b", marginTop: "2px" }}>
                                        Caps: {action.requiredCapabilities.join(", ") || "none"}
                                      </div>
                                    </div>
                                    <button
                                      id={`dry-run-${entry.manifest.id}-${action.id}`}
                                      onClick={() => handleDryRunDispatch(entry.manifest.id, action.id)}
                                      style={{
                                        background: "rgba(99,102,241,0.12)",
                                        border: "1px solid rgba(99,102,241,0.3)",
                                        borderRadius: "4px",
                                        color: "#a5b4fc",
                                        padding: "4px 10px",
                                        cursor: "pointer",
                                        fontSize: "10px",
                                        display: "flex",
                                        alignItems: "center",
                                        gap: "4px",
                                      }}
                                    >
                                      <Play size={10} />
                                      Dispatch (Dry Run)
                                    </button>
                                  </div>
                                  {result !== undefined && result !== null && (
                                    <div style={{ marginTop: "8px", borderTop: "1px solid rgba(255,255,255,0.05)", paddingTop: "6px" }}>
                                      <div style={{ display: "flex", alignItems: "center", gap: "4px", marginBottom: "4px" }}>
                                        {result.status === "simulated" ? (
                                          <CheckCircle size={10} style={{ color: "#10b981" }} />
                                        ) : (
                                          <AlertTriangle size={10} style={{ color: "#f87171" }} />
                                        )}
                                        <span style={{ fontSize: "10px", fontWeight: 600, color: result.status === "simulated" ? "#10b981" : "#f87171", textTransform: "uppercase" }}>
                                          {result.status}
                                        </span>
                                      </div>
                                      {result.preview && (
                                        <div style={{ background: "rgba(14,165,233,0.08)", border: "1px solid rgba(14,165,233,0.18)", borderRadius: "6px", padding: "8px", margin: "6px 0" }}>
                                          <div style={{ fontSize: "10px", color: "#bae6fd", fontWeight: 700, marginBottom: "4px" }}>
                                            {result.preview.title}
                                          </div>
                                          <div style={{ fontSize: "9px", color: "#93c5fd", lineHeight: 1.45 }}>
                                            {result.preview.summary}
                                          </div>
                                          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: "6px", marginTop: "8px" }}>
                                            <div style={{ background: "rgba(0,0,0,0.2)", borderRadius: "4px", padding: "5px" }}>
                                              <div style={{ fontSize: "8px", color: "#64748b", textTransform: "uppercase" }}>Canvas</div>
                                              <div style={{ fontSize: "9px", color: "#e0f2fe" }}>{result.preview.canvas.width} x {result.preview.canvas.height}</div>
                                              <div style={{ fontSize: "8px", color: "#94a3b8" }}>{result.preview.canvas.aspectRatio} / {result.preview.canvas.background}</div>
                                            </div>
                                            <div style={{ background: "rgba(0,0,0,0.2)", borderRadius: "4px", padding: "5px" }}>
                                              <div style={{ fontSize: "8px", color: "#64748b", textTransform: "uppercase" }}>Layers</div>
                                              <div style={{ fontSize: "9px", color: "#e0f2fe" }}>{result.preview.layers.length} preview layers</div>
                                              <div style={{ fontSize: "8px", color: "#94a3b8" }}>{result.preview.kind}</div>
                                            </div>
                                            <div style={{ background: "rgba(0,0,0,0.2)", borderRadius: "4px", padding: "5px" }}>
                                              <div style={{ fontSize: "8px", color: "#64748b", textTransform: "uppercase" }}>Estimate</div>
                                              <div style={{ fontSize: "9px", color: "#e0f2fe" }}>{result.preview.estimatedDurationMs}ms</div>
                                              <div style={{ fontSize: "8px", color: "#94a3b8" }}>approval required</div>
                                            </div>
                                          </div>
                                          <div style={{ marginTop: "8px", display: "flex", flexDirection: "column", gap: "3px" }}>
                                            {result.preview.assemblySteps.map((step, i) => (
                                              <div key={i} style={{ fontSize: "8px", color: "#cbd5e1" }}>
                                                {i + 1}. {step}
                                              </div>
                                            ))}
                                          </div>
                                          <div style={{ marginTop: "6px", display: "flex", flexWrap: "wrap", gap: "4px" }}>
                                            {result.preview.exportTargets.map((target) => (
                                              <span key={target} style={{ fontSize: "8px", color: "#7dd3fc", border: "1px solid rgba(125,211,252,0.2)", borderRadius: "4px", padding: "2px 5px" }}>
                                                {target}
                                              </span>
                                            ))}
                                          </div>
                                          <div style={{ display: "flex", gap: "6px", marginTop: "8px" }}>
                                            <button
                                              type="button"
                                              onClick={() => handleQueuePreview(entry.manifest.id, action.id, result)}
                                              disabled={candidate?.status === "pending_review" || candidate?.status === "assembly_approved"}
                                              style={{
                                                background: "rgba(14,165,233,0.12)",
                                                border: "1px solid rgba(14,165,233,0.28)",
                                                borderRadius: "4px",
                                                color: "#7dd3fc",
                                                cursor: candidate?.status === "pending_review" || candidate?.status === "assembly_approved" ? "not-allowed" : "pointer",
                                                fontSize: "9px",
                                                padding: "4px 7px",
                                              }}
                                            >
                                              Queue Preview
                                            </button>
                                            <button
                                              type="button"
                                              onClick={() => handleApprovePreview(entry.manifest.id, action.id)}
                                              disabled={candidate?.status !== "pending_review"}
                                              style={{
                                                background: "rgba(16,185,129,0.12)",
                                                border: "1px solid rgba(16,185,129,0.28)",
                                                borderRadius: "4px",
                                                color: "#86efac",
                                                cursor: candidate?.status === "pending_review" ? "pointer" : "not-allowed",
                                                fontSize: "9px",
                                                padding: "4px 7px",
                                              }}
                                            >
                                              Approve Assembly
                                            </button>
                                          </div>
                                          {candidate && (
                                            <div style={{ fontSize: "8px", color: "#bae6fd", marginTop: "5px" }}>
                                              Review status: {candidate.status}
                                            </div>
                                          )}
                                          {assemblyPlan && (
                                            <div style={{ fontSize: "8px", color: "#86efac", marginTop: "5px" }}>
                                              Assembly plan ready: {assemblyPlan.elements.length} elements / {assemblyPlan.canvas.width} x {assemblyPlan.canvas.height}
                                            </div>
                                          )}
                                          {previewMessage && (
                                            <div style={{ fontSize: "8px", color: previewMessage.includes("failed") ? "#fca5a5" : "#cbd5e1", marginTop: "5px" }}>
                                              {previewMessage}
                                            </div>
                                          )}
                                        </div>
                                      )}
                                      {result.output !== undefined && (
                                        <pre style={{ fontSize: "9px", color: "#94a3b8", background: "rgba(0,0,0,0.3)", borderRadius: "4px", padding: "6px", margin: "4px 0", overflowX: "auto", whiteSpace: "pre-wrap", wordBreak: "break-all" }}>
                                          {JSON.stringify(result.output, null, 2)}
                                        </pre>
                                      )}
                                      {result.logs.length > 0 && (
                                        <div style={{ fontSize: "9px", color: "#64748b", marginTop: "4px" }}>
                                          {result.logs.map((log, i) => <div key={i}>{log}</div>)}
                                        </div>
                                      )}
                                      {result.diagnostics.map((d, i) => (
                                        <div key={i} style={{ fontSize: "9px", color: d.severity === "error" ? "#f87171" : "#94a3b8", marginTop: "2px", display: "flex", alignItems: "center", gap: "4px" }}>
                                          {d.severity === "error" && <AlertTriangle size={9} />}
                                          {d.message}
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* Tab 2: Installed Packages (Metadata Only) */}
        {activeTab === "installed" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <div style={{ fontSize: "11px", color: "#94a3b8", background: "rgba(59, 130, 246, 0.05)", border: "1px solid rgba(59, 130, 246, 0.15)", borderRadius: "6px", padding: "10px" }}>
              Note: Runtime Packages are isolated metadata-only registrations containing manifest rules and signature blocks. No activation or executable runtime runs from these packages.
            </div>

            {installedList.length === 0 ? (
              <div style={{ color: "#64748b", fontSize: "12px", textAlign: "center", padding: "24px" }}>No packages installed. Go to the "Install" tab to upload one.</div>
            ) : (
              installedList.map((pkg) => {
                const badge = getTrustBadgeStyle(pkg.trustLevel);
                return (
                  <div key={pkg.packageId} style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "8px", padding: "12px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px" }}>
                      <div>
                        <h4 style={{ margin: 0, fontSize: "13px", color: "#f8fafc" }}>{pkg.name}</h4>
                        <div style={{ fontSize: "10px", color: "#64748b", marginTop: "4px" }}>
                          ID: {pkg.packageId} | Version: {pkg.version} | Publisher: {pkg.publisher}
                        </div>
                      </div>
                      <span style={{ fontSize: "8px", fontWeight: 600, background: badge.bg, border: badge.border, color: badge.color, padding: "2px 6px", borderRadius: "4px" }}>
                        {badge.label}
                      </span>
                    </div>

                    <div style={{ marginTop: "12px", padding: "8px", background: "rgba(0,0,0,0.2)", borderRadius: "6px", fontSize: "10px", fontFamily: "monospace" }}>
                      <div>Manifest SHA-256 (Cyrb53): <span style={{ color: "#38bdf8" }}>{pkg.manifestFingerprint}</span></div>
                      <div>Package SHA-256 (Cyrb53): <span style={{ color: "#38bdf8" }}>{pkg.packageFingerprint}</span></div>
                      {pkg.signature && (
                        <div style={{ marginTop: "4px", color: "#94a3b8" }}>
                          Signed by: {pkg.signature.keyId} ({pkg.signature.algorithm})
                        </div>
                      )}
                    </div>

                    {/* Promotion Status / Actions */}
                    <div style={{ marginTop: "12px", borderTop: "1px solid rgba(255,255,255,0.04)", paddingTop: "12px" }}>
                      {pkg.promotion?.status === "promoted" ? (
                        <div style={{ background: "rgba(16, 185, 129, 0.1)", border: "1px solid rgba(16, 185, 129, 0.2)", borderRadius: "6px", padding: "8px", fontSize: "11px", color: "#34d399" }}>
                          <CheckCircle size={12} style={{ display: "inline", marginRight: "4px", verticalAlign: "middle" }} />
                          <strong>Promoted to RuntimeRegistry</strong>
                          <div style={{ fontSize: "10px", color: "#a7f3d0", marginTop: "4px" }}>
                            Activation required manually. No execution performed.
                          </div>
                        </div>
                      ) : pkg.trustLevel !== "trusted" ? (
                        <div style={{ background: "rgba(239, 68, 68, 0.1)", border: "1px solid rgba(239, 68, 68, 0.2)", borderRadius: "6px", padding: "8px", fontSize: "11px", color: "#f87171" }}>
                          <AlertTriangle size={12} style={{ display: "inline", marginRight: "4px", verticalAlign: "middle" }} />
                          <strong>Promotion blocked by policy</strong>
                          <div style={{ fontSize: "10px", color: "#fca5a5", marginTop: "4px" }}>
                            Unsigned or untrusted packages cannot be promoted to RuntimeRegistry in this phase.
                          </div>
                        </div>
                      ) : (
                        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                          <button
                            onClick={() => handlePromotePackage(pkg.packageId)}
                            style={{
                              background: "rgba(59, 130, 246, 0.15)",
                              border: "1px solid rgba(59, 130, 246, 0.3)",
                              borderRadius: "4px",
                              color: "#60a5fa",
                              cursor: "pointer",
                              padding: "6px 12px",
                              fontSize: "11px",
                              fontWeight: 500,
                              textAlign: "center"
                            }}
                          >
                            Promote to Runtime
                          </button>
                          <div style={{ fontSize: "9px", color: "#64748b" }}>
                            * Promotion only registers manifest metadata. It does not activate or execute runtime code.
                          </div>
                        </div>
                      )}
                      
                      {promoMsg[pkg.packageId] && (
                        <div style={{ marginTop: "6px", fontSize: "10px", color: promoMsg[pkg.packageId].startsWith("Error") ? "#ef4444" : "#10b981" }}>
                          {promoMsg[pkg.packageId]}
                        </div>
                      )}
                    </div>

                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "12px" }}>
                      <span style={{ fontSize: "10px", color: "#64748b" }}>Installed: {new Date(pkg.installedAt).toLocaleString()}</span>
                      <button
                        onClick={() => triggerUninstall(pkg.packageId)}
                        style={{
                          background: "rgba(239, 68, 68, 0.1)",
                          border: "1px solid rgba(239, 68, 68, 0.2)",
                          borderRadius: "4px",
                          color: "#f87171",
                          padding: "4px 8px",
                          cursor: "pointer",
                          fontSize: "11px",
                          display: "flex",
                          alignItems: "center",
                          gap: "4px"
                        }}
                      >
                        <Trash2 size={11} /> Uninstall
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* Tab 3: Install Runtime Package */}
        {activeTab === "install" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <label style={{ fontSize: "12px", fontWeight: 600, color: "#94a3b8" }}>Upload Envelope (.json)</label>
              <div style={{ display: "flex", gap: "8px" }}>
                <input
                  type="file"
                  accept=".json"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  style={{ display: "none" }}
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  style={{
                    flex: 1,
                    background: "#1e293b",
                    border: "1px dashed rgba(255,255,255,0.15)",
                    borderRadius: "6px",
                    color: "#cbd5e1",
                    padding: "16px",
                    cursor: "pointer",
                    textAlign: "center",
                    fontSize: "12px",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: "8px"
                  }}
                >
                  <Upload size={18} style={{ color: "#3b82f6" }} />
                  Select Runtime Package JSON File
                </button>
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <label style={{ fontSize: "12px", fontWeight: 600, color: "#94a3b8" }}>Or Paste Raw Package JSON Payload</label>
              <textarea
                value={uploadText}
                onChange={(e) => {
                  setUploadText(e.target.value);
                  if (e.target.value.trim()) processPackageText(e.target.value);
                }}
                placeholder='{ "packageType": "axiom.runtime-package", ... }'
                style={{
                  height: "100px",
                  background: "#0d131f",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: "6px",
                  color: "#e2e8f0",
                  fontFamily: "monospace",
                  fontSize: "11px",
                  padding: "8px",
                  resize: "vertical"
                }}
              />
            </div>

            {/* Install Result Notifications */}
            {installResultMsg && (
              <div
                style={{
                  background: installResultMsg.type === "success" ? "rgba(16, 185, 129, 0.1)" : "rgba(239, 68, 68, 0.1)",
                  border: installResultMsg.type === "success" ? "1px solid rgba(16, 185, 129, 0.2)" : "1px solid rgba(239, 68, 68, 0.2)",
                  borderRadius: "6px",
                  padding: "10px",
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "8px"
                }}
              >
                {installResultMsg.type === "success" ? (
                  <CheckCircle size={14} style={{ color: "#34d399", marginTop: "2px" }} />
                ) : (
                  <AlertTriangle size={14} style={{ color: "#f87171", marginTop: "2px" }} />
                )}
                <span style={{ fontSize: "11px", color: installResultMsg.type === "success" ? "#a7f3d0" : "#fca5a5" }}>
                  {installResultMsg.text}
                </span>
              </div>
            )}

            {/* Preview Section */}
            {installPreview && (
              <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "8px", padding: "16px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid rgba(255,255,255,0.08)", paddingBottom: "10px", marginBottom: "12px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <FileText size={14} style={{ color: "#38bdf8" }} />
                    <span style={{ fontSize: "12px", fontWeight: 600 }}>Envelope Metadata Preview</span>
                  </div>
                  <span
                    style={{
                      fontSize: "8px",
                      fontWeight: 600,
                      background: getTrustBadgeStyle(installPreview.trustLevel).bg,
                      border: getTrustBadgeStyle(installPreview.trustLevel).border,
                      color: getTrustBadgeStyle(installPreview.trustLevel).color,
                      padding: "2px 6px",
                      borderRadius: "4px"
                    }}
                  >
                    {getTrustBadgeStyle(installPreview.trustLevel).label}
                  </span>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "8px", fontSize: "11px" }}>
                  <div>Package ID: <span style={{ color: "#f8fafc" }}>{installPreview.packageId}</span></div>
                  <div>Name: <span style={{ color: "#f8fafc" }}>{installPreview.name}</span></div>
                  <div>Version: <span style={{ color: "#f8fafc" }}>{installPreview.version}</span></div>
                  <div>Publisher: <span style={{ color: "#f8fafc" }}>{installPreview.publisher}</span></div>
                  <div>Runtime Type: <span style={{ color: "#f8fafc", textTransform: "capitalize" }}>{installPreview.runtimeType}</span></div>
                  <div>Entry Point URL: <span style={{ color: "#f59e0b", fontFamily: "monospace" }}>{installPreview.entryModuleUrl}</span></div>
                  
                  <div style={{ marginTop: "4px" }}>
                    Declared Capabilities:{" "}
                    {installPreview.declaredCapabilities.length === 0 ? (
                      <span style={{ color: "#64748b" }}>None</span>
                    ) : (
                      installPreview.declaredCapabilities.map((cap) => (
                        <span key={cap} style={{ background: "rgba(59, 130, 246, 0.1)", color: "#60a5fa", padding: "2px 6px", borderRadius: "4px", fontSize: "9px", marginRight: "4px", display: "inline-block" }}>
                          {cap}
                        </span>
                      ))
                    )}
                  </div>
                </div>

                {/* Diagnostics Logger */}
                {previewDiagList.length > 0 && (
                  <div style={{ marginTop: "12px", background: "rgba(0,0,0,0.2)", borderRadius: "6px", padding: "10px" }}>
                    <div style={{ fontSize: "10px", fontWeight: 600, color: "#cbd5e1", marginBottom: "6px" }}>Diagnostics & Safety Log:</div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                      {previewDiagList.map((diag, index) => (
                        <div key={index} style={{ display: "flex", gap: "6px", alignItems: "flex-start", fontSize: "10px" }}>
                          {diag.severity === "error" ? (
                            <AlertOctagon size={10} style={{ color: "#ef4444", marginTop: "2px" }} />
                          ) : diag.severity === "warning" ? (
                            <AlertTriangle size={10} style={{ color: "#f59e0b", marginTop: "2px" }} />
                          ) : (
                            <CheckCircle size={10} style={{ color: "#10b981", marginTop: "2px" }} />
                          )}
                          <span style={{ color: diag.severity === "error" ? "#fca5a5" : diag.severity === "warning" ? "#fde047" : "#a7f3d0" }}>
                            {diag.message}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Installation Trigger Actions */}
                <div style={{ marginTop: "16px", display: "flex", gap: "8px" }}>
                  {installPreview.requiresConfirmation ? (
                    <button
                      onClick={() => triggerInstall(true)}
                      disabled={isInstalling}
                      style={{
                        flex: 1,
                        background: "rgba(245, 158, 11, 0.2)",
                        border: "1px solid rgba(245, 158, 11, 0.4)",
                        borderRadius: "4px",
                        color: "#fbbf24",
                        padding: "8px",
                        fontWeight: 600,
                        cursor: "pointer",
                        fontSize: "12px",
                        textAlign: "center",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "4px"
                      }}
                    >
                      <AlertTriangle size={12} />
                      Confirm & Install
                    </button>
                  ) : installPreview.canInstall ? (
                    <button
                      onClick={() => triggerInstall(false)}
                      disabled={isInstalling}
                      style={{
                        flex: 1,
                        background: "rgba(59, 130, 246, 0.2)",
                        border: "1px solid rgba(59, 130, 246, 0.4)",
                        borderRadius: "4px",
                        color: "#60a5fa",
                        padding: "8px",
                        fontWeight: 600,
                        cursor: "pointer",
                        fontSize: "12px",
                        textAlign: "center"
                      }}
                    >
                      Install Package
                    </button>
                  ) : (
                    <button
                      disabled
                      style={{
                        flex: 1,
                        background: "rgba(239, 68, 68, 0.05)",
                        border: "1px solid rgba(239, 68, 68, 0.15)",
                        borderRadius: "4px",
                        color: "#f87171",
                        padding: "8px",
                        fontSize: "12px",
                        cursor: "not-allowed",
                        textAlign: "center"
                      }}
                    >
                      Blocked by Policy
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab 4: Execution History */}
        {activeTab === "execution-history" && (
          <div style={{ fontFamily: "monospace", fontSize: "11px", display: "flex", flexDirection: "column", gap: "8px" }}>
            {executionLogs.length === 0 ? (
              <div style={{ color: "#64748b", fontSize: "11px" }}>No execution records yet.</div>
            ) : (
              executionLogs.map((log, idx) => (
                <div key={log.id ?? idx} style={{ padding: "8px", borderBottom: "1px solid #1e293b" }}>
                  <div style={{ color: log.status === "completed" ? "#10b981" : "#ef4444" }}>
                    [{log.attemptedAt.slice(0, 19).replace("T", " ")}] {log.runtimeId} : {log.actionId} — {log.status}
                    {log.durationMs !== undefined && <span style={{ color: "#64748b" }}> ({log.durationMs}ms)</span>}
                  </div>
                  {log.failureReason && <div style={{ color: "#f87171", fontSize: "10px" }}>✗ {log.failureReason}</div>}
                </div>
              ))
            )}
          </div>
        )}

      </div>
    </div>
  );
}
