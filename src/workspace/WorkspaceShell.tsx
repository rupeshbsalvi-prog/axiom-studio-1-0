import { useEffect, useMemo, useState, useRef } from "react";
import {
  Activity,
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  Command,
  Cpu,
  Database,
  Download,
  FileArchive,
  Layers3,
  PanelRight,
  Shield,
  Sparkles,
  Upload,
} from "lucide-react";
import { createProjectDraft, type AxiomProjectDraft } from "../app/projects/projectDraft";
import type { ImagineXWorkspaceLearningPolicyState } from "../app/services/ImagineXLearningAuthority";
import { getDefaultStudio, getStudioById, STUDIO_REGISTRY, type StudioId } from "../app/studios/registry";
import { useStudioLifecycle } from "./useStudioLifecycle";
import { StudioPanelRouter } from "./StudioPanelRouter";
import { summarizeRuntimeAuthority } from "./RuntimeAuthorityGate";
import { WorkspaceReplayPanel } from "./WorkspaceReplayPanel";
import { WorkspaceProjectionsPanel } from "./WorkspaceProjectionsPanel";
import { type WorkspaceAuditEvent } from "./WorkspaceAuditService";
import { eventBus } from "../platform/services/EventBus";
import { RuntimeRegistryPanel } from "../runtime/RuntimeRegistryPanel";
import { loadLocalManifests } from "../runtime/manifest/LocalRuntimeManifestLoader";
import { serializeRuntimeState } from "../runtime/RuntimePersistenceService";
import { getAllRegistryEntries } from "../runtime/RuntimeRegistry";
import { getAllActivatedRuntimes } from "../runtime/activation/RuntimeActivationService";
import { getExecutionLog } from "../runtime/activation/RuntimeActionDispatcher";
import { planRuntimeHydration, applyRuntimeHydrationPlan } from "../runtime/RuntimeHydrationService";
import {
  importCanvasPreviewState,
  serializeCanvasPreviewState,
} from "./CanvasPreviewIntakeService";
import {
  createAxpkgEnvelope,
  serializeAxpkgEnvelope,
  createAxpkgFilename,
  importAxpkgFromString,
  type AxpkgImportDiagnostic,
  type AxpkgTrustLevel,
  DEFAULT_AXPKG_TRUST_POLICY,
} from "../app/projects/axpkg";

function formatSliceNames(draft: AxiomProjectDraft): string {
  return Object.keys(draft.canvas).join(", ");
}

function formatRuntimeAuthority(runtimeManifest: ReturnType<typeof useStudioLifecycle>): string {
  const authority = runtimeManifest.runtimeRecord?.authority;

  if (!authority) {
    return "no runtime authority";
  }

  const permissions = [
    authority.canReadProject ? "read project" : null,
    authority.canWriteCanvas ? "write canvas" : null,
    authority.canExport ? "export" : null,
    authority.canUseProviders ? "providers" : null,
    authority.requiresApproval ? "approval required" : "auto-approved",
  ].filter(Boolean);

  return permissions.join(", ");
}

interface WorkspaceShellProps {
  project?: AxiomProjectDraft;
  onCloseProject?: () => void;
  onSaveProject?: (project: AxiomProjectDraft) => void;
  workspaceLearningPolicy?: ImagineXWorkspaceLearningPolicyState;
  workspaceEntry?: WorkspaceEntryContext;
  onChangeWorkspace?: () => void;
  onLogout?: () => void | Promise<void>;
  logoutError?: string;
}

export type WorkspaceEntryContext =
  | { mode: "local" }
  | { mode: "authenticated"; workspaceId: string; role: "owner" | "admin" | "member" | "viewer"; email: string | null };

export function WorkspaceShell({
  project,
  onCloseProject,
  onSaveProject,
  workspaceLearningPolicy,
  workspaceEntry,
  onChangeWorkspace,
  onLogout,
  logoutError,
}: WorkspaceShellProps = {}) {
  const [activeStudioId, setActiveStudioId] = useState<StudioId>(getDefaultStudio().id);
  const [projectName, setProjectName] = useState("Axiom Campaign Draft");
  const [creativeIntent, setCreativeIntent] = useState("");
  const [localProject, setLocalProject] = useState<AxiomProjectDraft | null>(null);
  const [showRightSidebar, setShowRightSidebar] = useState<"none" | "replay" | "registry" | "projections">("none");
  const [manifestsLoaded, setManifestsLoaded] = useState(false);
  const [hydratedRuntimeKey, setHydratedRuntimeKey] = useState<string | null>(null);
  const [hydratedCanvasPreviewKey, setHydratedCanvasPreviewKey] = useState<string | null>(null);
  const [importResultBanner, setImportResultBanner] = useState<{
    success: boolean;
    message: string;
    trustLevel?: AxpkgTrustLevel;
    requiresUserConfirmation?: boolean;
    diagnostics: AxpkgImportDiagnostic[];
  } | null>(null);
  const [pendingImportProject, setPendingImportProject] = useState<AxiomProjectDraft | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const activeProject = project ?? localProject;

  const runtimeKey = activeProject?.runtime
    ? `${activeProject.manifest.id}:${activeProject.runtime.schemaVersion}:${activeProject.runtime.savedAt}`
    : null;
  const canvasPreviewKey = activeProject?.canvasPreview
    ? `${activeProject.manifest.id}:${activeProject.canvasPreview.schemaVersion}:${activeProject.canvasPreview.savedAt}`
    : null;

  // Load local manifests on startup
  useEffect(() => {
    let cancelled = false;

    async function loadRuntimeManifests() {
      await loadLocalManifests({ isDevelopment: import.meta.env.DEV || import.meta.env.MODE === "test" }).catch((err) => {
        console.error("Failed to load local manifests on startup:", err);
      });

      if (!cancelled) {
        setManifestsLoaded(true);
      }
    }

    loadRuntimeManifests();

    return () => {
      cancelled = true;
    };
  }, []);

  const runtimeManifest = useStudioLifecycle(activeStudioId);

  // Sync draft audit trail dynamically with Workspace events
  useEffect(() => {
    const handleRecorded = (event: WorkspaceAuditEvent) => {
      setLocalProject((currentDraft) => {
        if (!currentDraft) return currentDraft;
        if (currentDraft.audit?.some((e) => e.id === event.id)) {
          return currentDraft;
        }
        const updatedAudit = [...(currentDraft.audit ?? []), event];
        if (updatedAudit.length > 1000) {
          updatedAudit.shift();
        }
        const updated = {
          ...currentDraft,
          audit: updatedAudit,
        };
        onSaveProject?.(updated);
        return updated;
      });
    };

    const unsubscribe = eventBus.subscribe("workspace:audit:recorded", handleRecorded);
    return () => {
      unsubscribe();
    };
  }, [onSaveProject]);

  const handleSaveRuntimeState = () => {
    if (!activeProject) return;
    const serializedBlock = serializeRuntimeState(
      getAllRegistryEntries(),
      getAllActivatedRuntimes(),
      getExecutionLog()
    );
    const canvasPreviewState = serializeCanvasPreviewState();
    const nextProject = {
      ...activeProject,
      runtime: serializedBlock,
      canvasPreview: {
        schemaVersion: "0.5.0" as const,
        savedAt: new Date().toISOString(),
        candidates: canvasPreviewState.candidates,
        assemblyPlans: canvasPreviewState.assemblyPlans,
        projections: activeProject.canvasPreview?.projections ?? [],
        applications: activeProject.canvasPreview?.applications ?? [],
      },
    };
    setLocalProject(nextProject);
    onSaveProject?.(nextProject);
  };

  const handleRestoreRuntimeState = async () => {
    if (!activeProject || !activeProject.runtime) return;
    await loadLocalManifests({ isDevelopment: import.meta.env.DEV || import.meta.env.MODE === "test" }).catch(() => {});
    const plan = planRuntimeHydration(activeProject.runtime, getAllRegistryEntries());
    const result = applyRuntimeHydrationPlan(plan);
    // Sync the hydration key so we don't auto-hydrate again immediately
    const nextKey = `${activeProject.manifest.id}:${activeProject.runtime.schemaVersion}:${activeProject.runtime.savedAt}`;
    setHydratedRuntimeKey(nextKey);
    return result;
  };

  const handleExportProject = () => {
    if (!activeProject) return;
    const envelope = createAxpkgEnvelope(activeProject);
    const jsonStr = serializeAxpkgEnvelope(envelope);
    const filename = createAxpkgFilename(activeProject);

    const blob = new Blob([jsonStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleImportFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Reset value to allow re-importing the same file
    event.target.value = "";

    try {
      const text = await file.text();
      const result = await importAxpkgFromString(text, {
        trustPolicy: DEFAULT_AXPKG_TRUST_POLICY,
      });

      if (result.success) {
        if (result.trust.requiresUserConfirmation) {
          setPendingImportProject(result.project);
          setImportResultBanner({
            success: true,
            message: `The package is signed by an untrusted key '${result.trust.signer?.keyId || "unknown"}'. Open anyway?`,
            trustLevel: result.trust.level,
            requiresUserConfirmation: true,
            diagnostics: result.diagnostics,
          });
        } else {
          setLocalProject(result.project);
          onSaveProject?.(result.project);
          setImportResultBanner({
            success: true,
            message: `Successfully imported project '${result.project.manifest.name}'`,
            trustLevel: result.trust.level,
            diagnostics: result.diagnostics,
          });
        }
      } else {
        setImportResultBanner({
          success: false,
          message: "Failed to import AXPKG package.",
          trustLevel: result.trust?.level,
          diagnostics: result.diagnostics,
        });
      }
    } catch (err) {
      setImportResultBanner({
        success: false,
        message: "An unexpected error occurred during import.",
        diagnostics: [
          {
            severity: "error",
            code: "invalid_json",
            message: err instanceof Error ? err.message : String(err),
          },
        ],
      });
    }
  };

  const handleConfirmUntrustedOpen = () => {
    if (!pendingImportProject) return;
    setLocalProject(pendingImportProject);
    onSaveProject?.(pendingImportProject);
    setImportResultBanner((prev) =>
      prev
        ? {
            ...prev,
            requiresUserConfirmation: false,
            message: `Successfully imported project '${pendingImportProject.manifest.name}' (untrusted signer)`,
          }
        : null
    );
    setPendingImportProject(null);
  };

  const handleCancelUntrustedOpen = () => {
    setPendingImportProject(null);
    setImportResultBanner(null);
  };

  // Auto-hydrate metadata only on draft load
  useEffect(() => {
    if (manifestsLoaded && runtimeKey && hydratedRuntimeKey !== runtimeKey) {
      const plan = planRuntimeHydration(activeProject!.runtime, getAllRegistryEntries());
      applyRuntimeHydrationPlan(plan);
      setHydratedRuntimeKey(runtimeKey);
    }
  }, [manifestsLoaded, runtimeKey, hydratedRuntimeKey, activeProject]);

  useEffect(() => {
    if (canvasPreviewKey && hydratedCanvasPreviewKey !== canvasPreviewKey && activeProject?.canvasPreview) {
      importCanvasPreviewState({
        candidates: activeProject.canvasPreview.candidates,
        assemblyPlans: activeProject.canvasPreview.assemblyPlans,
      });
      setHydratedCanvasPreviewKey(canvasPreviewKey);
    }
  }, [canvasPreviewKey, hydratedCanvasPreviewKey, activeProject]);

  const activeStudio = getStudioById(activeStudioId) ?? getDefaultStudio();
  const ActiveIcon = activeStudio.icon;

  const phaseMetrics = useMemo(
    () => [
      { label: "Studios", value: String(STUDIO_REGISTRY.length), icon: Layers3 },
      { label: "AXPKG", value: activeProject ? "draft ready" : "local draft", icon: FileArchive },
      { label: "Imagine X", value: "planning", icon: Cpu },
      { label: "Runtime", value: "advisory", icon: Database },
    ],
    [activeProject],
  );

  const createDraft = () => {
    const nextDraft = createProjectDraft({
      name: projectName,
      intent: creativeIntent,
      targetStudioId: activeStudioId,
    });
    setLocalProject(nextDraft);
  };

  return (
    <div className="app-shell">
      <aside className="navigation-spine" aria-label="Studio navigation">
        <div className="brand-mark">
          <img
            className="brand-icon"
            src="/assets/branding/ax-logo-core-symbol.svg"
            alt="Axiom Core"
            width="42"
            height="42"
          />
          <div>
            <strong>Axiom</strong>
            <span>Studio 1.0</span>
          </div>
        </div>

        <nav className="studio-list">
          {STUDIO_REGISTRY.map((studio) => {
            const Icon = studio.icon;
            return (
              <button
                key={studio.id}
                type="button"
                data-testid="studio-nav-item"
                className={studio.id === activeStudioId ? "studio-nav-item active" : "studio-nav-item"}
                onClick={() => setActiveStudioId(studio.id)}
                aria-pressed={studio.id === activeStudioId}
              >
                <Icon size={18} />
                <span>{studio.displayName}</span>
              </button>
            );
          })}
        </nav>
      </aside>

      <main className="workspace">
        <header className="studio-header">
          <div>
            <p className="eyebrow">Phase 01 Product Shell</p>
            <h1>{activeStudio.displayName}</h1>
          </div>
          <div className="header-actions">
            {workspaceEntry && (
              <div className="workspace-session-summary" aria-label="Workspace session">
                <span>
                  {workspaceEntry.mode === "local"
                    ? "Local workspace"
                    : `${workspaceEntry.workspaceId} · ${workspaceEntry.role}`}
                </span>
                {workspaceEntry.mode === "authenticated" && workspaceEntry.email && (
                  <small>{workspaceEntry.email}</small>
                )}
                {logoutError && <small className="auth-error" role="alert">{logoutError}</small>}
                {onChangeWorkspace && (
                  <button type="button" className="ghost-button" onClick={onChangeWorkspace}>Change workspace</button>
                )}
                {onLogout && (
                  <button type="button" className="ghost-button" onClick={() => void onLogout()}>Sign out</button>
                )}
              </div>
            )}
            <input
              type="file"
              accept=".json,.axpkg.json"
              onChange={handleImportFileChange}
              style={{ display: "none" }}
              ref={fileInputRef}
              data-testid="axpkg-file-input"
            />
            <button
              type="button"
              className="ghost-button"
              onClick={handleExportProject}
              disabled={!activeProject}
              data-testid="export-axpkg-button"
            >
              <Download size={16} />
              Export AXPKG
            </button>
            <button
              type="button"
              className="ghost-button"
              onClick={() => fileInputRef.current?.click()}
              data-testid="import-axpkg-button"
            >
              <Upload size={16} />
              Import AXPKG
            </button>
            <button type="button" className="ghost-button">
              <Command size={16} />
              Command
            </button>
            <button type="button" className="primary-button">
              <Sparkles size={16} />
              Axiom Imagine X
            </button>
          </div>
        </header>

        {importResultBanner && (
          <div
            data-testid="import-diagnostics-banner"
            className="import-banner"
            style={{
              background: importResultBanner.success
                ? importResultBanner.requiresUserConfirmation
                  ? "rgba(245, 158, 11, 0.1)"
                  : "rgba(16, 185, 129, 0.1)"
                : "rgba(239, 68, 68, 0.1)",
              borderBottom: importResultBanner.success
                ? importResultBanner.requiresUserConfirmation
                  ? "1px solid rgba(245, 158, 11, 0.2)"
                  : "1px solid rgba(16, 185, 129, 0.2)"
                : "1px solid rgba(239, 68, 68, 0.2)",
              padding: "12px 24px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: "16px",
              flexShrink: 0,
            }}
          >
            <div style={{ display: "flex", flexDirection: "column", gap: "4px", width: "100%" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <div
                  style={{
                    width: "8px",
                    height: "8px",
                    borderRadius: "50%",
                    background: importResultBanner.success
                      ? importResultBanner.requiresUserConfirmation
                        ? "#f59e0b"
                        : "#10b981"
                      : "#ef4444",
                  }}
                />
                <strong style={{
                  color: importResultBanner.success
                    ? importResultBanner.requiresUserConfirmation
                      ? "#fbbf24"
                      : "#34d399"
                    : "#f87171",
                  fontSize: "13px",
                  fontWeight: 600
                }}>
                  {importResultBanner.success
                    ? importResultBanner.requiresUserConfirmation
                      ? "Untrusted Signer Warning"
                      : "Import Success"
                    : "Import Failed"}
                </strong>
                {importResultBanner.trustLevel && (
                  <span style={{
                    marginLeft: "4px",
                    padding: "2px 6px",
                    fontSize: "9px",
                    fontWeight: 700,
                    borderRadius: "3px",
                    letterSpacing: "0.5px",
                    background:
                      importResultBanner.trustLevel === "trusted" ? "rgba(16, 185, 129, 0.2)" :
                      importResultBanner.trustLevel === "unsigned" ? "rgba(156, 163, 175, 0.2)" :
                      importResultBanner.trustLevel === "untrusted" ? "rgba(245, 158, 11, 0.2)" :
                      importResultBanner.trustLevel === "tampered" ? "rgba(239, 68, 68, 0.2)" :
                      importResultBanner.trustLevel === "blocked" ? "rgba(220, 38, 38, 0.3)" :
                      "rgba(255, 255, 255, 0.1)",
                    color:
                      importResultBanner.trustLevel === "trusted" ? "#10b981" :
                      importResultBanner.trustLevel === "unsigned" ? "#9ca3af" :
                      importResultBanner.trustLevel === "untrusted" ? "#f59e0b" :
                      importResultBanner.trustLevel === "tampered" ? "#ef4444" :
                      importResultBanner.trustLevel === "blocked" ? "#dc2626" :
                      "#ffffff",
                  }}>
                    {importResultBanner.trustLevel.toUpperCase()}
                  </span>
                )}
              </div>
              <p style={{ margin: 0, fontSize: "12px", color: "#94a3b8" }}>{importResultBanner.message}</p>
              {importResultBanner.diagnostics.length > 0 && (
                <div style={{ marginTop: "4px" }}>
                  <p style={{ margin: "0 0 4px 0", fontSize: "11px", fontWeight: 500, color: "#cbd5e1" }}>
                    Diagnostics & Warnings:
                  </p>
                  <ul style={{ margin: 0, paddingLeft: "16px", fontSize: "11px", color: "#94a3b8", display: "flex", flexDirection: "column", gap: "2px" }}>
                    {importResultBanner.diagnostics.map((d, i) => (
                      <li key={i} style={{ listStyleType: "disc" }}>
                        <span style={{ color: d.severity === "error" ? "#f87171" : d.severity === "warning" ? "#fbbf24" : "#60a5fa", fontWeight: 600, marginRight: "4px" }}>
                          [{d.code}]
                        </span>
                        {d.message}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {importResultBanner.requiresUserConfirmation && (
                <div style={{ display: "flex", gap: "8px", marginTop: "12px" }}>
                  <button
                    onClick={handleConfirmUntrustedOpen}
                    data-testid="confirm-untrusted-open-btn"
                    style={{
                      background: "rgba(245, 158, 11, 0.2)",
                      border: "1px solid rgba(245, 158, 11, 0.4)",
                      borderRadius: "4px",
                      color: "#fbbf24",
                      cursor: "pointer",
                      padding: "6px 12px",
                      fontSize: "11px",
                      fontWeight: 600,
                    }}
                  >
                    Open Anyway
                  </button>
                  <button
                    onClick={handleCancelUntrustedOpen}
                    data-testid="cancel-untrusted-open-btn"
                    style={{
                      background: "rgba(255,255,255,0.06)",
                      border: "1px solid rgba(255,255,255,0.1)",
                      borderRadius: "4px",
                      color: "#94a3b8",
                      cursor: "pointer",
                      padding: "6px 12px",
                      fontSize: "11px",
                    }}
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
            {!importResultBanner.requiresUserConfirmation && (
              <button
                onClick={() => setImportResultBanner(null)}
                style={{
                  background: "rgba(255,255,255,0.06)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: "4px",
                  color: "#94a3b8",
                  cursor: "pointer",
                  padding: "4px 8px",
                  fontSize: "11px",
                }}
              >
                Dismiss
              </button>
            )}
          </div>
        )}

        <section className="mission-grid" style={{ display: "flex", flex: 1, overflow: "hidden" }}>
          <article className="stage-surface" aria-label={`${activeStudio.displayName} workspace`} style={{ flex: 1, minWidth: 0 }}>
            <div className="studio-title-row">
              <div className="studio-emblem">
                <ActiveIcon size={30} />
              </div>
              <div>
                <p className="eyebrow">{activeStudio.canvasMode}</p>
                <p className="stage-title">{activeStudio.displayName}</p>
              </div>
            </div>
            <p className="studio-summary">{activeStudio.summary}</p>

            <StudioPanelRouter
              activeStudio={activeStudio}
              project={activeProject}
              workspaceLearningPolicy={workspaceLearningPolicy}
              onUpdateProject={(updatedProject) => {
                setLocalProject(updatedProject);
                onSaveProject?.(updatedProject);
              }}
            />
          </article>

          {showRightSidebar === "replay" && (
            <aside style={{ width: "320px", borderLeft: "1px solid rgba(255,255,255,0.08)", display: "flex", flexDirection: "column", height: "100%", flexShrink: 0 }}>
              <WorkspaceReplayPanel />
            </aside>
          )}

          {showRightSidebar === "registry" && (
            <aside style={{ width: "320px", borderLeft: "1px solid rgba(255,255,255,0.08)", display: "flex", flexDirection: "column", height: "100%", flexShrink: 0 }}>
              <RuntimeRegistryPanel
                onSaveRuntimeState={handleSaveRuntimeState}
                onRestoreRuntimeState={handleRestoreRuntimeState}
              />
            </aside>
          )}

          {showRightSidebar === "projections" && (
            <aside style={{ width: "320px", borderLeft: "1px solid rgba(255,255,255,0.08)", display: "flex", flexDirection: "column", height: "100%", flexShrink: 0 }}>
              <WorkspaceProjectionsPanel
                project={activeProject}
                onUpdateProject={(updatedProject) => {
                  setLocalProject(updatedProject);
                  onSaveProject?.(updatedProject);
                }}
              />
            </aside>
          )}

          <aside className="inspector-rail" aria-label="Inspector" style={{ flexShrink: 0 }}>
            <div className="panel-title">
              <PanelRight size={18} />
              <span>Inspector Rail</span>
            </div>
            <dl className="inspector-list">
              <div>
                <dt>Studio slice</dt>
                <dd>{activeStudio.axpkgSlice}</dd>
              </div>
              <div>
                <dt>Initial depth</dt>
                <dd>{activeStudio.initialDepth}</dd>
              </div>
              <div>
                <dt>Authority</dt>
                <dd>Advisory until semantic runtime approval</dd>
              </div>
              <div>
                <dt>Runtime</dt>
                <dd>{runtimeManifest.status}</dd>
              </div>
              <div>
                <dt>Manifest entry</dt>
                <dd>{runtimeManifest.hasRuntimeEntry ? "lazy runtime registered" : "foundation fallback"}</dd>
              </div>
              <div>
                <dt>Runtime source</dt>
                <dd>{runtimeManifest.runtimeRecord?.source ?? "none"}</dd>
              </div>
              <div>
                <dt>Runtime phase</dt>
                <dd>{runtimeManifest.runtimeRecord?.phase ?? "not scheduled"}</dd>
              </div>
              <div>
                <dt>Runtime capability</dt>
                <dd>{runtimeManifest.runtimeRecord?.capabilities.join(", ") ?? "fallback canvas"}</dd>
              </div>
              <div>
                <dt>Runtime authority</dt>
                <dd>{formatRuntimeAuthority(runtimeManifest)}</dd>
              </div>
              <div>
                <dt>Authority gate</dt>
                <dd>{summarizeRuntimeAuthority(runtimeManifest.runtimeRecord?.authority)}</dd>
              </div>
              <div>
                <dt>Loaded modules</dt>
                <dd>{runtimeManifest.loadedStudioIds.length > 0 ? runtimeManifest.loadedStudioIds.join(", ") : "none"}</dd>
              </div>
            </dl>
          </aside>
        </section>

        <section className="lower-grid">
          <form
            className="mission-control-panel"
            onSubmit={(event) => {
              event.preventDefault();
              createDraft();
            }}
          >
            <div className="panel-title">
              <ClipboardList size={18} />
              <span>Mission Control Draft</span>
            </div>
            <label>
              Project name
              <input value={projectName} onChange={(event) => setProjectName(event.target.value)} />
            </label>
            <label>
              Creative intent
              <textarea
                value={creativeIntent}
                onChange={(event) => setCreativeIntent(event.target.value)}
                placeholder="Describe the first Axiom Studio project..."
              />
            </label>
            <button type="submit" className="primary-button wide">
              Create local draft
              <ChevronRight size={16} />
            </button>

            {activeProject ? (
              <div className="draft-status" role="status">
                <CheckCircle2 size={18} />
                <div>
                  <strong>AXPKG draft ready</strong>
                  <span>
                    {activeProject.manifest.name} · slices: {formatSliceNames(activeProject)}
                  </span>
                </div>
              </div>
            ) : null}
          </form>

          <div className="creative-dock">
            {phaseMetrics.map((metric) => {
              const Icon = metric.icon;
              return (
                <div className="metric" key={metric.label}>
                  <Icon size={18} />
                  <span>{metric.label}</span>
                  <strong>{metric.value}</strong>
                </div>
              );
            })}
            <button
              type="button"
              className={`metric ${showRightSidebar === "replay" ? "active" : ""}`}
              onClick={() => setShowRightSidebar(showRightSidebar === "replay" ? "none" : "replay")}
              style={{
                background: showRightSidebar === "replay" ? "rgba(99, 102, 241, 0.12)" : "transparent",
                border: "1px solid rgba(255, 255, 255, 0.08)",
                borderRadius: "6px",
                color: "#e2e8f0",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "8px 12px",
                textAlign: "left",
              }}
            >
              <Activity size={18} style={{ color: showRightSidebar === "replay" ? "#818cf8" : "#94a3b8" }} />
              <div style={{ display: "flex", flexDirection: "column" }}>
                <span style={{ fontSize: "10px", color: "#94a3b8" }}>Replay</span>
                <strong style={{ fontSize: "11px", color: showRightSidebar === "replay" ? "#a5b4fc" : "#e2e8f0" }}>
                  {showRightSidebar === "replay" ? "Active" : "Toggle Trail"}
                </strong>
              </div>
            </button>

            <button
              type="button"
              data-testid="registry-toggle"
              className={`metric ${showRightSidebar === "registry" ? "active" : ""}`}
              onClick={() => setShowRightSidebar(showRightSidebar === "registry" ? "none" : "registry")}
              style={{
                background: showRightSidebar === "registry" ? "rgba(59, 130, 246, 0.12)" : "transparent",
                border: "1px solid rgba(255, 255, 255, 0.08)",
                borderRadius: "6px",
                color: "#e2e8f0",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "8px 12px",
                textAlign: "left",
              }}
            >
              <Shield size={18} style={{ color: showRightSidebar === "registry" ? "#3b82f6" : "#94a3b8" }} />
              <div style={{ display: "flex", flexDirection: "column" }}>
                <span style={{ fontSize: "10px", color: "#94a3b8" }}>Registry</span>
                <strong style={{ fontSize: "11px", color: showRightSidebar === "registry" ? "#93c5fd" : "#e2e8f0" }}>
                  {showRightSidebar === "registry" ? "Active" : "Sandbox"}
                </strong>
              </div>
            </button>

            <button
              type="button"
              data-testid="projections-toggle"
              className={`metric ${showRightSidebar === "projections" ? "active" : ""}`}
              onClick={() => setShowRightSidebar(showRightSidebar === "projections" ? "none" : "projections")}
              style={{
                background: showRightSidebar === "projections" ? "rgba(99, 102, 241, 0.12)" : "transparent",
                border: "1px solid rgba(255, 255, 255, 0.08)",
                borderRadius: "6px",
                color: "#e2e8f0",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "8px 12px",
                textAlign: "left",
              }}
            >
              <Sparkles size={18} style={{ color: showRightSidebar === "projections" ? "#a5b4fc" : "#94a3b8" }} />
              <div style={{ display: "flex", flexDirection: "column" }}>
                <span style={{ fontSize: "10px", color: "#94a3b8" }}>Projections</span>
                <strong style={{ fontSize: "11px", color: showRightSidebar === "projections" ? "#a5b4fc" : "#e2e8f0" }}>
                  {showRightSidebar === "projections" ? "Active" : "Apply/Rollback"}
                </strong>
              </div>
            </button>
          </div>
        </section>
      </main>
    </div>
  );
}
