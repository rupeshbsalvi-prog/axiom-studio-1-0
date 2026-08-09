import { useEffect, useState } from "react";
import {
  Aperture,
  Check,
  CheckCircle,
  Eye,
  EyeOff,
  Sliders,
  Download,
  Settings,
  Image as ImageIcon,
  Sparkles,
  Layers,
  ArrowUp,
  ArrowDown,
  Trash2,
  AlertTriangle,
  Play,
  ShieldAlert,
} from "lucide-react";

import { eventBus } from "../../../platform/services/EventBus";
import { stateService } from "../../../platform/services/StateService";
import { PHOTO_INITIAL_STATE, hydratePhotoStateFromProject, persistPhotoStateToProject, type PhotoStudioState, type PhotoAdjustmentHistoryEntry } from "./PhotoState";
import { getPhotoTemplates, planPhotoComposition } from "../../services/photoApi";
import type { PhotoTemplate, PhotoPlanResponse, PhotoLayer, PhotoLayerAdjustments, PhotoAuditEvent } from "../../services/photoTypes";
import { ReplayAuditPanel } from "../../components/ReplayAuditPanel";
import { createPhotoAuthorityBlockedAuditEvent, evaluatePhotoRuntimeAuthority } from "./PhotoRuntimeAuthority";
import {
  createWorkspaceAuthorityBlockedEvent,
  recordWorkspaceAuditEvent,
  createWorkspaceIntentReceivedEvent,
  createWorkspacePlanGeneratedEvent,
  createWorkspaceProposalAcceptedEvent,
  createWorkspaceExportRequestedEvent,
  createWorkspaceProviderCalledEvent,
  getWorkspaceAuditEvents,
} from "../../../workspace/WorkspaceAuditService";
import { getAllActivatedRuntimes } from "../../../runtime/activation/RuntimeActivationService";
import { dispatchDryRunAction } from "../../../runtime/activation/RuntimeActionDispatcher";
import { intakeDryRunPreview, serializeCanvasPreviewState } from "../../../workspace/CanvasPreviewIntakeService";
import type { AxiomProjectDraft } from "../../projects/projectDraft";
import {
  buildPhotoProviderRequestManifest,
  validatePhotoProviderRequestManifest,
} from "./PhotoProviderRequestContract";
import { createAxpkgEnvelope } from "../../projects/axpkg/AxpkgSerializer";
import { recordImagineXFollowUpEdit } from "../../services/ImagineXOutcomeService";

interface PhotoPanelProps {
  project?: AxiomProjectDraft | null;
  onUpdateProject?: (project: AxiomProjectDraft) => void;
}

export function PhotoPanel({ project, onUpdateProject }: PhotoPanelProps = {}) {
  // Resolve active promoted Photo-capable runtime from activation service.
  // PhotoPanel must not assume the studio id "photo" is the promoted runtime id.
  const activeRuntimes = getAllActivatedRuntimes();
  const activePhotoRuntime = activeRuntimes.find((r) => r.manifestId === "photo");
  const isPhotoRuntimeActive = !!activePhotoRuntime;
  const activePhotoRuntimeId = activePhotoRuntime ? activePhotoRuntime.runtimeId : null;
  const [photoState, setPhotoState] = useState<PhotoStudioState>(PHOTO_INITIAL_STATE);
  
  // Intake planning state
  const [templates, setTemplates] = useState<PhotoTemplate | null>(null);
  const [intentInput, setIntentInput] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("product");
  const [selectedAspectRatio, setSelectedAspectRatio] = useState("1:1");
  const [selectedAesthetic, setSelectedAesthetic] = useState("luxury");
  const [selectedLighting, setSelectedLighting] = useState("studio");

  const [isPlanning, setIsPlanning] = useState(false);
  const [isOfflineWarning, setIsOfflineWarning] = useState(false);
  const [authorityWarning, setAuthorityWarning] = useState("");
  const [plannedComposition, setPlannedComposition] = useState<PhotoPlanResponse | null>(null);
  const [dispatchResultMsg, setDispatchResultMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [isDispatching, setIsDispatching] = useState(false);

  // Sync state with StateService
  useEffect(() => {
    const hydrate = () => {
      const s = stateService.getState()["photo.state"] || PHOTO_INITIAL_STATE;
      const next = hydratePhotoStateFromProject(s, project);
      if (next !== s) {
        stateService.setState({ "photo.state": next });
      }
      setPhotoState(next);
    };

    hydrate();
    const unsub = eventBus.subscribe("state:changed", () => {
      hydrate();
    });

    // Fetch templates
    const loadTemplates = async () => {
      const t = await getPhotoTemplates();
      setTemplates(t);
    };
    loadTemplates();

    return () => unsub();
  }, [project]);

  const updateState = (
    updater: (prev: PhotoStudioState) => PhotoStudioState,
    persistCanvas = false,
    outcomeEdit?: { layerId?: string; type: string; description: string }
  ) => {
    const next = updater(photoState);
    stateService.setState({
      "photo.state": next
    });
    eventBus.publish("state:changed", stateService.getState());
    if (persistCanvas && project && onUpdateProject) {
      const persisted = persistPhotoStateToProject(project, next);
      onUpdateProject(outcomeEdit
        ? recordImagineXFollowUpEdit(persisted, { studioId: "photo", ...outcomeEdit })
        : persisted);
    }
  };

  // 1. Analyze Intent -> Pre-generation Plan
  const handleAnalyzeIntent = async () => {
    if (intentInput.trim().length < 3) return;
    setIsPlanning(true);
    setIsOfflineWarning(false);
    setPlannedComposition(null);

    const plan = await planPhotoComposition({
      intent: intentInput,
      category: selectedCategory,
      aspectRatio: selectedAspectRatio,
      lighting: selectedLighting,
      style: selectedAesthetic
    });

    setPlannedComposition(plan);
    setIsPlanning(false);

    if (plan.provider.mode === "fallback") {
      setIsOfflineWarning(true);
    }

    recordWorkspaceAuditEvent(
      createWorkspaceIntentReceivedEvent({
        id: `audit_intent_${Math.random().toString(36).substring(2, 8)}`,
        studioId: "photo",
        title: "Photo Intent Received",
        message: `Plan request received: "${intentInput}"`,
        timestamp: new Date().toISOString(),
      })
    );

    recordWorkspaceAuditEvent(
      createWorkspacePlanGeneratedEvent({
        id: `audit_plan_${Math.random().toString(36).substring(2, 8)}`,
        studioId: "photo",
        title: "Photo Blueprint Generated",
        message: `Generated plan with ${plan.layerBreakdown.length} planned layers: "${plan.backgroundStrategy}"`,
        timestamp: new Date().toISOString(),
      })
    );

    recordWorkspaceAuditEvent(
      createWorkspaceProviderCalledEvent({
        id: `audit_provider_${Math.random().toString(36).substring(2, 8)}`,
        studioId: "photo",
        title: "Imagine X Provider Routed",
        message: `Routed to ${plan.provider.name} in ${plan.provider.mode} mode.`,
        timestamp: new Date().toISOString(),
      })
    );
  };

  // 2. Approve Plan -> Promoted Runtime Dry-Run Dispatch (Phase 20)
  // This path replaces the direct generatePhotoComposition() call.
  // "Analyze Intent" above is NOT gated — it remains offline-safe.
  // Only this approval+dispatch step requires an active promoted Photo runtime.
  const handleApprovePlan = async () => {
    if (!plannedComposition) return;
    if (!activePhotoRuntimeId) return; // guarded: button should already be disabled

    const authorityDecision = evaluatePhotoRuntimeAuthority("generateComposition");
    if (!authorityDecision.allowed) {
      const auditEvent = createPhotoAuthorityBlockedAuditEvent(authorityDecision);
      setAuthorityWarning(authorityDecision.message);
      updateState((prev) => ({
        ...prev,
        audit: [...prev.audit, auditEvent],
      }));
      recordWorkspaceAuditEvent(
        createWorkspaceAuthorityBlockedEvent({
          ...auditEvent,
          studioId: "photo",
          message: auditEvent.description || "",
        })
      );
      return;
    }

    setAuthorityWarning("");
    setDispatchResultMsg(null);
    setIsDispatching(true);

    try {
      const providerRequest = buildPhotoProviderRequestManifest(plannedComposition);
      const providerRequestDiagnostics = validatePhotoProviderRequestManifest(providerRequest);
      if (providerRequestDiagnostics.some((diagnostic) => diagnostic.severity === "error")) {
        setDispatchResultMsg({
          type: "error",
          text: providerRequestDiagnostics[0]?.message ?? "Provider request manifest is invalid.",
        });
        return;
      }

      // Dispatch dry-run action through the locked promoted runtime pipeline.
      // Uses the resolved activePhotoRuntimeId — NOT the literal studio id "photo".
      // Does not call generatePhotoComposition or any provider-backed function.
      const result = await dispatchDryRunAction({
        runtimeId: activePhotoRuntimeId,
        actionId: "generatePhotoLayout",
        payload: { plan: plannedComposition, providerRequest },
      });

      if (result.status === "denied" || result.status === "failed") {
        const errMsg = result.diagnostics[0]?.message ?? `Dispatch ${result.status}.`;
        setDispatchResultMsg({ type: "error", text: errMsg });
        return;
      }

      // SUCCESS: route preview into CanvasPreviewIntakeService.
      // Does NOT mutate authoritative canvas elements.
      // Does NOT call applyCanvasProjectionToDraft or rollbackCanvasProjectionMutation.
      if (result.preview) {
        const intake = intakeDryRunPreview({
          runtimeId: activePhotoRuntimeId,
          actionId: "generatePhotoLayout",
          preview: result.preview,
        });

        if (intake.success && intake.candidate) {
          if (project && onUpdateProject) {
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
          }
        }
      }

      const generationEvent: PhotoAuditEvent = {
        id: `audit_gen_${Math.random().toString(36).substring(2, 8)}`,
        type: "proposal_accepted",
        timestamp: new Date().toISOString(),
        title: "Photo Layout Preview Dispatched",
        description: `Dry-run photo layout dispatch completed via runtime "${activePhotoRuntimeId}". Preview queued for review.`,
      };

      updateState((prev) => ({
        ...prev,
        activePlan: plannedComposition,
        audit: [...prev.audit, generationEvent],
      }));

      recordWorkspaceAuditEvent(
        createWorkspaceProposalAcceptedEvent({
          id: generationEvent.id,
          studioId: "photo",
          title: generationEvent.title,
          message: generationEvent.description || "",
          timestamp: generationEvent.timestamp,
        })
      );

      setDispatchResultMsg({ type: "success", text: "Photo layout preview queued for review in Projections panel." });
      setPlannedComposition(null);
    } finally {
      setIsDispatching(false);
    }
  };

  // Layer state modifiers
  const handleSelectLayer = (id: string) => {
    updateState(prev => ({
      ...prev,
      selectedLayerId: id
    }));
  };

  const handleToggleVisibility = (id: string) => {
    updateState(prev => ({
      ...prev,
      layers: prev.layers.map(l => l.id === id ? { ...l, visible: !l.visible } : l)
    }), true, {
      layerId: id,
      type: "visibility_changed",
      description: "Changed layer visibility.",
    });
  };

  const handleOpacityChange = (id: string, opacity: number) => {
    updateState(prev => ({
      ...prev,
      layers: prev.layers.map(l => l.id === id ? { ...l, opacity } : l)
    }), true, {
      layerId: id,
      type: "opacity_changed",
      description: `Changed opacity to ${Math.round(opacity * 100)}%.`,
    });
  };

  const handleBlendModeChange = (id: string, blendMode: string) => {
    updateState(prev => ({
      ...prev,
      layers: prev.layers.map(l => l.id === id ? { ...l, blendMode } : l)
    }), true, {
      layerId: id,
      type: "blend_mode_changed",
      description: `Changed blend mode to ${blendMode}.`,
    });
  };

  const handleAdjustmentChange = (layerId: string, key: keyof PhotoLayerAdjustments, value: number) => {
    updateState(prev => {
      // Add audit history
      const historyEntry: PhotoAdjustmentHistoryEntry = {
        timestamp: new Date().toISOString(),
        layerId,
        description: `Modified ${key} to ${value}`
      };
      
      const newAudit: PhotoAuditEvent = {
        id: `audit_adj_${Math.random().toString(36).substring(2, 8)}`,
        type: "layer_adjusted",
        timestamp: new Date().toISOString(),
        title: "Layer Adjustment Staged",
        description: `Staged ${key} change on layer.`
      };

      return {
        ...prev,
        layers: prev.layers.map(l => l.id === layerId ? {
          ...l,
          adjustments: { ...l.adjustments, [key]: value }
        } : l),
        adjustmentHistory: [...prev.adjustmentHistory, historyEntry],
        audit: [...prev.audit, newAudit]
      };
    }, true, {
      layerId,
      type: "adjustment_changed",
      description: `Changed ${key} to ${value}.`,
    });
  };

  const handleMoveLayer = (id: string, direction: "up" | "down") => {
    updateState(prev => {
      const idx = prev.layerOrder.indexOf(id);
      if (idx === -1) return prev;
      const targetIdx = direction === "up" ? idx + 1 : idx - 1;
      if (targetIdx < 0 || targetIdx >= prev.layerOrder.length) return prev;

      const newOrder = [...prev.layerOrder];
      const temp = newOrder[idx];
      newOrder[idx] = newOrder[targetIdx];
      newOrder[targetIdx] = temp;

      const newAudit: PhotoAuditEvent = {
        id: `audit_move_${Math.random().toString(36).substring(2, 8)}`,
        type: "layer_reordered",
        timestamp: new Date().toISOString(),
        title: "Layers Reordered",
        description: "Reordered compilation order."
      };

      return {
        ...prev,
        layerOrder: newOrder,
        audit: [...prev.audit, newAudit]
      };
    }, true, {
      layerId: id,
      type: "layers_reordered",
      description: `Moved layer ${direction}.`,
    });
  };

  const handleDeleteLayer = (id: string) => {
    updateState(prev => {
      const newLayers = prev.layers.filter(l => l.id !== id);
      const newOrder = prev.layerOrder.filter(lid => lid !== id);
      return {
        ...prev,
        layers: newLayers,
        layerOrder: newOrder,
        selectedLayerId: prev.selectedLayerId === id ? (newLayers.length > 0 ? newLayers[0].id : null) : prev.selectedLayerId
      };
    }, true, {
      layerId: id,
      type: "layer_deleted",
      description: "Deleted layer.",
    });
  };

  // Reliable Canvas 2D composited PNG Export
  const handleExportPNG = async () => {
    if (photoState.layers.length === 0) return;
    const authorityDecision = evaluatePhotoRuntimeAuthority("exportComposition");
    if (!authorityDecision.allowed) {
      const auditEvent = createPhotoAuthorityBlockedAuditEvent(authorityDecision);
      setAuthorityWarning(authorityDecision.message);
      updateState((prev) => ({
        ...prev,
        audit: [...prev.audit, auditEvent],
      }));
      recordWorkspaceAuditEvent(
        createWorkspaceAuthorityBlockedEvent({
          ...auditEvent,
          studioId: "photo",
          message: auditEvent.description || "",
        })
      );
      return;
    }

    setAuthorityWarning("");

    const exportEvent: PhotoAuditEvent = {
      id: `audit_export_png_${Math.random().toString(36).substring(2, 8)}`,
      type: "export_requested",
      timestamp: new Date().toISOString(),
      title: "PNG Exported",
      description: "Downloaded final composited composition."
    };

    updateState(prev => ({
      ...prev,
      audit: [...prev.audit, exportEvent]
    }));

    recordWorkspaceAuditEvent(
      createWorkspaceExportRequestedEvent({
        id: exportEvent.id,
        studioId: "photo",
        title: exportEvent.title,
        message: exportEvent.description || "",
        timestamp: exportEvent.timestamp,
      })
    );

    const canvas = document.createElement("canvas");
    canvas.width = photoState.canvas.width;
    canvas.height = photoState.canvas.height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set background color
    ctx.fillStyle = photoState.canvas.background;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const getCompositeOp = (mode: string): GlobalCompositeOperation => {
      switch (mode) {
        case "multiply": return "multiply";
        case "screen": return "screen";
        case "overlay": return "overlay";
        case "color-dodge": return "color-dodge";
        case "color-burn": return "color-burn";
        case "hard-light": return "hard-light";
        case "soft-light": return "soft-light";
        default: return "source-over";
      }
    };

    // Pre-load all images
    const loadPromises = photoState.layers.map(layer => {
      return new Promise<{ layer: typeof layer; img: HTMLImageElement | null }>((resolve) => {
        if (!layer.source || layer.source === "runtime-mock" || !layer.visible) {
          resolve({ layer, img: null });
          return;
        }
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => resolve({ layer, img });
        img.onerror = () => resolve({ layer, img: null });
        img.src = layer.source;
      });
    });

    const loadedLayers = await Promise.all(loadPromises);

    // Draw bottom to top (layerOrder matches the render hierarchy)
    photoState.layerOrder.forEach((id) => {
      const item = loadedLayers.find(l => l.layer.id === id);
      if (!item) return;

      const { layer, img } = item;
      if (!img) {
        if (layer.visible && layer.source === "runtime-mock") {
          ctx.save();
          ctx.globalAlpha = layer.opacity;
          ctx.fillStyle = "#1e1b4b";
          ctx.fillRect(layer.position.x, layer.position.y, layer.position.width, layer.position.height);
          ctx.strokeStyle = "#818cf8";
          ctx.strokeRect(layer.position.x, layer.position.y, layer.position.width, layer.position.height);
          ctx.fillStyle = "#e0e7ff";
          ctx.font = "32px system-ui";
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText(
            layer.name,
            layer.position.x + layer.position.width / 2,
            layer.position.y + layer.position.height / 2
          );
          ctx.restore();
        }
        return;
      }

      ctx.save();
      ctx.globalAlpha = layer.opacity;
      ctx.globalCompositeOperation = getCompositeOp(layer.blendMode);

      const adj = layer.adjustments;
      ctx.filter = `brightness(${adj.brightness}%) contrast(${adj.contrast}%) saturate(${adj.saturation}%) blur(${adj.blur}px) hue-rotate(${adj.hueRotate}deg) grayscale(${adj.grayscale}%)`;

      ctx.drawImage(img, layer.position.x, layer.position.y, layer.position.width, layer.position.height);
      ctx.restore();
    });

    const url = canvas.toDataURL("image/png");
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "composition.png";
    anchor.click();
  };

  const handleExportAXPKG = () => {
    if (photoState.layers.length === 0) return;
    const authorityDecision = evaluatePhotoRuntimeAuthority("exportComposition");
    if (!authorityDecision.allowed) {
      const auditEvent = createPhotoAuthorityBlockedAuditEvent(authorityDecision);
      setAuthorityWarning(authorityDecision.message);
      updateState((prev) => ({
        ...prev,
        audit: [...prev.audit, auditEvent],
      }));
      recordWorkspaceAuditEvent(
        createWorkspaceAuthorityBlockedEvent({
          ...auditEvent,
          studioId: "photo",
          message: auditEvent.description || "",
        })
      );
      return;
    }

    setAuthorityWarning("");

    const exportEvent: PhotoAuditEvent = {
      id: `audit_export_axpkg_${Math.random().toString(36).substring(2, 8)}`,
      type: "export_requested",
      timestamp: new Date().toISOString(),
      title: "AXPKG Exported",
      description: "Downloaded project.axpkg.json."
    };

    const updatedState = {
      ...photoState,
      audit: [...photoState.audit, exportEvent]
    };

    updateState(() => updatedState);

    recordWorkspaceAuditEvent(
      createWorkspaceExportRequestedEvent({
        id: exportEvent.id,
        studioId: "photo",
        title: exportEvent.title,
        message: exportEvent.description || "",
        timestamp: exportEvent.timestamp,
      })
    );

    const payload = project
      ? createAxpkgEnvelope(persistPhotoStateToProject(project, updatedState))
      : {
      format: "AXPKG",
      version: "0.1.0",
      project: {
        id: updatedState.projectId,
        name: "Photo Composition Project",
        createdAt: new Date().toISOString()
      },
      plan: updatedState.activePlan,
      canvas: updatedState.canvas,
      layers: updatedState.layers,
      layerOrder: updatedState.layerOrder,
      auditTrail: getWorkspaceAuditEvents()
    };

    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "project.axpkg.json";
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const selectedLayer = photoState.layers.find(l => l.id === photoState.selectedLayerId);

  // Convert schema audit to match timeline audit types
  const convertedAuditEvents: any[] = photoState.audit.map(e => ({
    id: e.id,
    type: e.type,
    timestamp: e.timestamp,
    title: e.title,
    description: e.description
  }));

  return (
    <section
      className="studio-production-panel studio-production-panel--photo"
      aria-label="Photo production workspace"
      data-design-language="axiom-pro-panel-v1"
      style={{ display: "grid", gridTemplateColumns: "300px 1fr 320px", gap: "16px", height: "100%", overflow: "hidden", background: "#090d16", color: "#e2e8f0", fontFamily: "system-ui, -apple-system, sans-serif" }}
    >
      
      {/* ── LEFT PANEL: INTAKE & LAYERS ── */}
      <aside className="studio-panel-rail studio-panel-rail--planner" aria-label="Photo planner and layers" style={{ display: "flex", flexDirection: "column", gap: "16px", borderRight: "1px solid rgba(255,255,255,0.05)", padding: "16px", overflowY: "auto" }}>
        
        {/* Phase 20 Liveness Banner: shown when no promoted Photo runtime is active */}
        {!isPhotoRuntimeActive && (
          <div
            role="alert"
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: "8px",
              padding: "12px",
              background: "rgba(245, 158, 11, 0.07)",
              border: "1px solid rgba(245, 158, 11, 0.25)",
              borderRadius: "8px",
              color: "#fcd34d",
              fontSize: "11px",
              lineHeight: 1.45,
            }}
          >
            <ShieldAlert size={14} style={{ flexShrink: 0, marginTop: 1 }} />
            <span>
              <strong>No active promoted Photo runtime.</strong> Analyze Intent and offline layer tools remain available.
              Approve &amp; Generate Layout is disabled until a promoted Photo runtime (e.g.{" "}
              <code style={{ fontFamily: "monospace", fontSize: "10px" }}>mock-photo-studio</code>) is activated.
            </span>
          </div>
        )}

        {/* Composition Generator Intake */}
        <div style={{ display: "flex", flexDirection: "column", gap: "10px", padding: "14px", background: "rgba(99, 102, 241, 0.05)", borderRadius: "10px", border: "1px solid rgba(99, 102, 241, 0.15)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <Sparkles size={14} style={{ color: "#a5b4fc" }} />
            <span style={{ fontSize: "11px", fontWeight: 700, color: "#a5b4fc", textTransform: "uppercase", letterSpacing: "0.05em" }}>Composition Planner</span>
          </div>

          {authorityWarning ? (
            <div role="alert" style={{ padding: "8px", borderRadius: "6px", background: "rgba(239, 68, 68, 0.12)", border: "1px solid rgba(239, 68, 68, 0.28)", color: "#fecaca", fontSize: "11px", lineHeight: 1.35 }}>
              {authorityWarning}
            </div>
          ) : null}

          {dispatchResultMsg ? (
            <div
              role="status"
              style={{
                padding: "8px",
                borderRadius: "6px",
                background: dispatchResultMsg.type === "success" ? "rgba(16, 185, 129, 0.1)" : "rgba(239, 68, 68, 0.1)",
                border: `1px solid ${dispatchResultMsg.type === "success" ? "rgba(16,185,129,0.25)" : "rgba(239,68,68,0.25)"}`,
                color: dispatchResultMsg.type === "success" ? "#6ee7b7" : "#fca5a5",
                fontSize: "11px",
                lineHeight: 1.35,
              }}
            >
              {dispatchResultMsg.text}
            </div>
          ) : null}

          <label style={{ display: "flex", flexDirection: "column", gap: "4px", fontSize: "11px", color: "#94a3b8" }}>
            Creative Intent
            <textarea
              value={intentInput}
              onChange={(e) => setIntentInput(e.target.value)}
              placeholder="Describe the poster composition..."
              style={{ padding: "6px 8px", minHeight: "50px", background: "#0b0f19", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "6px", color: "#f8fafc", fontSize: "12px", resize: "none" }}
            />
          </label>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
            <label style={{ display: "flex", flexDirection: "column", gap: "4px", fontSize: "11px", color: "#94a3b8" }}>
              Category
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                style={{ padding: "5px", background: "#0b0f19", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "4px", color: "#f1f5f9", fontSize: "11px" }}
              >
                {templates?.categories.map(c => <option key={c} value={c}>{c}</option>) || <option value="product">product</option>}
              </select>
            </label>
            <label style={{ display: "flex", flexDirection: "column", gap: "4px", fontSize: "11px", color: "#94a3b8" }}>
              Aspect Ratio
              <select
                value={selectedAspectRatio}
                onChange={(e) => setSelectedAspectRatio(e.target.value)}
                style={{ padding: "5px", background: "#0b0f19", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "4px", color: "#f1f5f9", fontSize: "11px" }}
              >
                {templates?.aspectRatios.map(ar => <option key={ar} value={ar}>{ar}</option>) || <option value="1:1">1:1</option>}
              </select>
            </label>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
            <label style={{ display: "flex", flexDirection: "column", gap: "4px", fontSize: "11px", color: "#94a3b8" }}>
              Style
              <select
                value={selectedAesthetic}
                onChange={(e) => setSelectedAesthetic(e.target.value)}
                style={{ padding: "5px", background: "#0b0f19", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "4px", color: "#f1f5f9", fontSize: "11px" }}
              >
                {templates?.aesthetics.map(a => <option key={a} value={a}>{a}</option>) || <option value="luxury">luxury</option>}
              </select>
            </label>
            <label style={{ display: "flex", flexDirection: "column", gap: "4px", fontSize: "11px", color: "#94a3b8" }}>
              Lighting
              <select
                value={selectedLighting}
                onChange={(e) => setSelectedLighting(e.target.value)}
                style={{ padding: "5px", background: "#0b0f19", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "4px", color: "#f1f5f9", fontSize: "11px" }}
              >
                {templates?.lighting.map(l => <option key={l} value={l}>{l}</option>) || <option value="studio">studio</option>}
              </select>
            </label>
          </div>

          <button
            onClick={handleAnalyzeIntent}
            disabled={isPlanning || intentInput.trim().length < 3}
            style={{ padding: "8px", background: "#4f46e5", border: "none", borderRadius: "6px", color: "#fff", fontWeight: 600, fontSize: "12px", cursor: "pointer", opacity: (isPlanning || intentInput.trim().length < 3) ? 0.5 : 1 }}
          >
            {isPlanning ? "Planning..." : "Analyze Intent"}
          </button>
        </div>

        {/* First-impression plan preview */}
        {plannedComposition && (
          <div style={{ display: "flex", flexDirection: "column", gap: "10px", padding: "14px", background: "rgba(245, 158, 11, 0.04)", borderRadius: "10px", border: "1px solid rgba(245, 158, 11, 0.2)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "#f59e0b" }}>
              <AlertTriangle size={14} />
              <span style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase" }}>Composition Blueprint</span>
            </div>
            
            <div style={{ fontSize: "11px", color: "#cbd5e1", display: "flex", flexDirection: "column", gap: "4px" }}>
              <div><strong>Category:</strong> {plannedComposition.category}</div>
              <div><strong>Canvas Size:</strong> {plannedComposition.canvasSize.width}x{plannedComposition.canvasSize.height} ({plannedComposition.aspectRatio})</div>
              <div><strong>Lighting Presets:</strong> {plannedComposition.lighting}</div>
              <div><strong>Palette:</strong> {plannedComposition.colorPalette.join(", ")}</div>
              <div><strong>Background Strategy:</strong> {plannedComposition.backgroundStrategy}</div>
            </div>

            <div style={{ borderTop: "1px solid rgba(255,255,255,0.05)", paddingTop: "8px" }}>
              <span style={{ fontSize: "10px", color: "#64748b", fontWeight: 700, display: "block", marginBottom: "4px" }}>PLANNED LAYERS</span>
              {plannedComposition.layerBreakdown.map((l, i) => (
                <div key={i} style={{ fontSize: "11px", color: "#94a3b8", display: "flex", gap: "4px", marginBottom: "2px" }}>
                  <span>•</span>
                  <span>{l.name} ({l.type})</span>
                </div>
              ))}
            </div>

            {isOfflineWarning && (
              <span style={{ fontSize: "10px", color: "#f59e0b" }}>⚠️ Backend offline — loaded mock blueprint.</span>
            )}

            <button
              onClick={handleApprovePlan}
              disabled={!isPhotoRuntimeActive || isDispatching}
              style={{
                padding: "8px",
                background: "#10b981",
                border: "none",
                borderRadius: "6px",
                color: "#fff",
                fontWeight: 600,
                fontSize: "12px",
                cursor: (!isPhotoRuntimeActive || isDispatching) ? "not-allowed" : "pointer",
                opacity: (!isPhotoRuntimeActive || isDispatching) ? 0.45 : 1,
                marginTop: "4px",
              }}
            >
              {isDispatching ? "Dispatching preview..." : "Approve & Generate Layout"}
            </button>
          </div>
        )}

        {/* Layers Stack Sidebar */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "8px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "6px", borderBottom: "1px solid rgba(255,255,255,0.05)", paddingBottom: "6px" }}>
            <Layers size={14} style={{ color: "#94a3b8" }} />
            <span style={{ fontSize: "11px", fontWeight: 700, color: "#94a3b8", textTransform: "uppercase" }}>Layers Stack</span>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            {photoState.layerOrder.map((id) => {
              const layer = photoState.layers.find(l => l.id === id);
              if (!layer) return null;
              const isSelected = photoState.selectedLayerId === id;
              return (
                <div
                  key={id}
                  onClick={() => handleSelectLayer(id)}
                  style={{
                    padding: "10px",
                    background: isSelected ? "rgba(99, 102, 241, 0.08)" : "rgba(255,255,255,0.01)",
                    border: `1px solid ${isSelected ? "#6366f1" : "rgba(255,255,255,0.05)"}`,
                    borderRadius: "6px",
                    cursor: "pointer",
                    display: "flex",
                    flexDirection: "column",
                    gap: "6px"
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: "12px", fontWeight: isSelected ? 600 : 500, color: isSelected ? "#cbd5e1" : "#94a3b8" }}>
                      {layer.name}
                    </span>
                    <div style={{ display: "flex", gap: "6px" }} onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => handleToggleVisibility(id)}
                        style={{ background: "none", border: "none", cursor: "pointer", padding: 0, color: layer.visible ? "#818cf8" : "#475569" }}
                      >
                        {layer.visible ? <Eye size={14} /> : <EyeOff size={14} />}
                      </button>
                      <button
                        onClick={() => handleMoveLayer(id, "up")}
                        style={{ background: "none", border: "none", cursor: "pointer", padding: 0, color: "#64748b" }}
                      >
                        <ArrowUp size={14} />
                      </button>
                      <button
                        onClick={() => handleMoveLayer(id, "down")}
                        style={{ background: "none", border: "none", cursor: "pointer", padding: 0, color: "#64748b" }}
                      >
                        <ArrowDown size={14} />
                      </button>
                      <button
                        onClick={() => handleDeleteLayer(id)}
                        style={{ background: "none", border: "none", cursor: "pointer", padding: 0, color: "#ef4444" }}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }} onClick={(e) => e.stopPropagation()}>
                    <span style={{ fontSize: "9px", color: "#64748b", width: "40px" }}>Opacity</span>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.05"
                      value={layer.opacity}
                      onChange={(e) => handleOpacityChange(id, parseFloat(e.target.value))}
                      style={{ flex: 1, accentColor: "#6366f1", height: "3px" }}
                    />
                    <span style={{ fontSize: "9px", color: "#94a3b8", width: "25px", textAlign: "right" }}>{Math.round(layer.opacity * 100)}%</span>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }} onClick={(e) => e.stopPropagation()}>
                    <span style={{ fontSize: "9px", color: "#64748b", width: "40px" }}>Blend</span>
                    <select
                      value={layer.blendMode}
                      onChange={(e) => handleBlendModeChange(id, e.target.value)}
                      style={{ flex: 1, background: "#0b0f19", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "4px", color: "#f1f5f9", fontSize: "10px", padding: "2px" }}
                    >
                      <option value="normal">Normal</option>
                      <option value="multiply">Multiply</option>
                      <option value="screen">Screen</option>
                      <option value="overlay">Overlay</option>
                      <option value="color-dodge">Color Dodge</option>
                      <option value="color-burn">Color Burn</option>
                      <option value="hard-light">Hard Light</option>
                      <option value="soft-light">Soft Light</option>
                    </select>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </aside>

      {/* ── CENTER WORKSPACE: CANVAS WORKSPACE ── */}
      <section className="studio-panel-canvas" aria-label="Photo canvas" style={{ display: "flex", flexDirection: "column", gap: "16px", padding: "16px", overflow: "hidden" }}>
        
        {/* Canvas Toolbar */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid rgba(255,255,255,0.05)", paddingBottom: "10px" }}>
          <div>
            <h2 style={{ margin: 0, fontSize: "14px", fontWeight: 600 }}>Active Composition Canvas</h2>
            <span style={{ fontSize: "11px", color: "#64748b" }}>
              Resolution: {photoState.canvas.width}x{photoState.canvas.height} ({photoState.canvas.aspectRatio})
            </span>
          </div>
          <div style={{ display: "flex", gap: "8px" }}>
            <button
              onClick={handleExportPNG}
              disabled={photoState.layers.length === 0}
              style={{ display: "flex", alignItems: "center", gap: "6px", padding: "6px 12px", background: "rgba(16, 185, 129, 0.15)", border: "1px solid rgba(16,185,129,0.25)", borderRadius: "6px", color: "#34d399", fontSize: "12px", fontWeight: 600, cursor: "pointer", opacity: photoState.layers.length === 0 ? 0.5 : 1 }}
            >
              <Download size={14} />
              Export PNG
            </button>
            <button
              onClick={handleExportAXPKG}
              disabled={photoState.layers.length === 0}
              style={{ display: "flex", alignItems: "center", gap: "6px", padding: "6px 12px", background: "rgba(251, 191, 36, 0.15)", border: "1px solid rgba(251,191,36,0.25)", borderRadius: "6px", color: "#fbbf24", fontSize: "12px", fontWeight: 600, cursor: "pointer", opacity: photoState.layers.length === 0 ? 0.5 : 1 }}
            >
              <Download size={14} />
              Export AXPKG
            </button>
          </div>
        </div>

        {/* Viewport Sandbox */}
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(255,255,255,0.01)", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.03)", padding: "20px", overflow: "auto" }}>
          {photoState.layers.length === 0 ? (
            <div style={{ textAlign: "center", color: "#64748b" }}>
              <ImageIcon size={48} style={{ opacity: 0.2, marginBottom: "8px" }} />
              <p style={{ margin: 0, fontSize: "13px" }}>No active layers on canvas.</p>
              <p style={{ margin: "4px 0 0", fontSize: "11px" }}>Enter creative intent in the Planner to generate layouts.</p>
            </div>
          ) : (
            <div
              style={{
                width: `${photoState.canvas.width}px`,
                height: `${photoState.canvas.height}px`,
                background: photoState.canvas.background,
                position: "relative",
                boxShadow: "0 10px 30px rgba(0,0,0,0.5)",
                overflow: "hidden",
                transform: "scale(0.4)", // Scale for responsive viewport preview
                transformOrigin: "center center",
                flexShrink: 0
              }}
            >
              {/* Layers are drawn bottom-to-top by parsing layerOrder */}
              {photoState.layerOrder.map((id) => {
                const layer = photoState.layers.find(l => l.id === id);
                if (!layer || !layer.visible) return null;
                const isSelected = photoState.selectedLayerId === id;
                const adj = layer.adjustments;
                
                // Formulate adjustments filter
                const cssFilter = `brightness(${adj.brightness}%) contrast(${adj.contrast}%) saturate(${adj.saturation}%) blur(${adj.blur}px) hue-rotate(${adj.hueRotate}deg) grayscale(${adj.grayscale}%)`;

                return (
                  <div
                    key={id}
                    style={{
                      position: "absolute",
                      left: `${layer.position.x}px`,
                      top: `${layer.position.y}px`,
                      width: `${layer.position.width}px`,
                      height: `${layer.position.height}px`,
                      opacity: layer.opacity,
                      mixBlendMode: layer.blendMode as any,
                      transform: `rotate(${layer.position.rotation}deg)`,
                      outline: isSelected ? "2px dashed #818cf8" : "none",
                      outlineOffset: "-2px",
                      zIndex: photoState.layerOrder.indexOf(id) + 1,
                      pointerEvents: "none"
                    }}
                  >
                    {layer.source && layer.source !== "runtime-mock" ? (
                      <img
                        src={layer.source}
                        alt={layer.name}
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "fill",
                          filter: cssFilter
                        }}
                      />
                    ) : (
                      <div style={{ width: "100%", height: "100%", background: "rgba(99, 102, 241, 0.12)", border: "1px solid rgba(129, 140, 248, 0.35)", display: "grid", placeItems: "center", color: "#c7d2fe", fontSize: "28px" }}>
                        {layer.name}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* ── RIGHT PANEL: ADJUSTMENT PANEL & AUDIT TRAIL ── */}
      <aside className="studio-panel-rail studio-panel-rail--inspector" aria-label="Photo adjustments and audit" style={{ display: "flex", flexDirection: "column", gap: "16px", borderLeft: "1px solid rgba(255,255,255,0.05)", padding: "16px", overflowY: "auto" }}>
        
        {/* Layer Adjustment Controls */}
        <div style={{ display: "flex", flexDirection: "column", gap: "10px", padding: "14px", background: "rgba(255,255,255,0.01)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: "10px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <Sliders size={14} style={{ color: "#94a3b8" }} />
            <span style={{ fontSize: "11px", fontWeight: 700, color: "#94a3b8", textTransform: "uppercase" }}>Adjustments</span>
          </div>

          {selectedLayer ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginTop: "6px" }}>
              <span style={{ fontSize: "12px", color: "#cbd5e1", fontWeight: 600 }}>{selectedLayer.name}</span>
              
              {/* Brightness */}
              <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", color: "#94a3b8" }}>
                  <span>Brightness</span>
                  <span>{selectedLayer.adjustments.brightness}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="200"
                  value={selectedLayer.adjustments.brightness}
                  onChange={(e) => handleAdjustmentChange(selectedLayer.id, "brightness", parseFloat(e.target.value))}
                  style={{ accentColor: "#6366f1" }}
                />
              </div>

              {/* Contrast */}
              <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", color: "#94a3b8" }}>
                  <span>Contrast</span>
                  <span>{selectedLayer.adjustments.contrast}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="200"
                  value={selectedLayer.adjustments.contrast}
                  onChange={(e) => handleAdjustmentChange(selectedLayer.id, "contrast", parseFloat(e.target.value))}
                  style={{ accentColor: "#6366f1" }}
                />
              </div>

              {/* Saturation */}
              <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", color: "#94a3b8" }}>
                  <span>Saturation</span>
                  <span>{selectedLayer.adjustments.saturation}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="200"
                  value={selectedLayer.adjustments.saturation}
                  onChange={(e) => handleAdjustmentChange(selectedLayer.id, "saturation", parseFloat(e.target.value))}
                  style={{ accentColor: "#6366f1" }}
                />
              </div>

              {/* Blur */}
              <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", color: "#94a3b8" }}>
                  <span>Blur</span>
                  <span>{selectedLayer.adjustments.blur}px</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="20"
                  value={selectedLayer.adjustments.blur}
                  onChange={(e) => handleAdjustmentChange(selectedLayer.id, "blur", parseFloat(e.target.value))}
                  style={{ accentColor: "#6366f1" }}
                />
              </div>

              {/* Hue Rotate */}
              <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", color: "#94a3b8" }}>
                  <span>Hue Rotate</span>
                  <span>{selectedLayer.adjustments.hueRotate}°</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="360"
                  value={selectedLayer.adjustments.hueRotate}
                  onChange={(e) => handleAdjustmentChange(selectedLayer.id, "hueRotate", parseFloat(e.target.value))}
                  style={{ accentColor: "#6366f1" }}
                />
              </div>

              {/* Grayscale */}
              <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", color: "#94a3b8" }}>
                  <span>Grayscale</span>
                  <span>{selectedLayer.adjustments.grayscale}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={selectedLayer.adjustments.grayscale}
                  onChange={(e) => handleAdjustmentChange(selectedLayer.id, "grayscale", parseFloat(e.target.value))}
                  style={{ accentColor: "#6366f1" }}
                />
              </div>

            </div>
          ) : (
            <p style={{ margin: "6px 0 0", fontSize: "11px", color: "#64748b", fontStyle: "italic" }}>
              Select a layer to adjust properties.
            </p>
          )}
        </div>

        {/* Audit timeline */}
        <div style={{ flex: 1 }}>
          <ReplayAuditPanel events={convertedAuditEvents} />
        </div>
      </aside>
    </section>
  );
}
