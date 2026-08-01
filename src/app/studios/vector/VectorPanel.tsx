import { useEffect, useState } from "react";
import {
  Sparkles,
  Layers,
  ArrowUp,
  ArrowDown,
  Trash2,
  AlertTriangle,
  Download,
  Sliders,
  Type,
  Lock,
  Unlock,
  Copy,
  FolderOpen,
  Square,
  Circle,
  MousePointer,
  Eye,
  EyeOff,
  Image
} from "lucide-react";

import { eventBus } from "../../../platform/services/EventBus";
import { stateService } from "../../../platform/services/StateService";
import { VECTOR_INITIAL_STATE, type VectorStudioState } from "./VectorState";
import { getVectorTemplates, planVectorComposition, VECTOR_CANVAS_PRESETS } from "../../services/vectorApi";
import type { VectorTemplate, VectorPlanResponse, VectorShape, VectorRectShape, VectorCircleShape, VectorTextShape, VectorPathShape, VectorAuditEvent } from "../../services/vectorTypes";
import { createRectShape, createCircleShape, createTextShape } from "./vectorShapeFactory";
import { serializeVectorStateToSvg } from "./vectorSerializer";
import { validateShape } from "./vectorValidation";
import { ReplayAuditPanel } from "../../components/ReplayAuditPanel";
import { createVectorAuthorityBlockedAuditEvent, evaluateVectorRuntimeAuthority } from "./VectorRuntimeAuthority";
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

interface VectorPanelProps {
  project?: AxiomProjectDraft | null;
  onUpdateProject?: (project: AxiomProjectDraft) => void;
}

export function VectorPanel({ project, onUpdateProject }: VectorPanelProps = {}) {
  const [vectorState, setVectorState] = useState<any>(VECTOR_INITIAL_STATE);
  
  // Resolve active promoted Vector-capable runtime
  const activeRuntimes = getAllActivatedRuntimes();
  const activeVectorRuntime = activeRuntimes.find((r) => r.manifestId === "vector");
  const isMockVectorActive = !!activeVectorRuntime;
  const activeVectorRuntimeId = activeVectorRuntime ? activeVectorRuntime.runtimeId : null;

  // Intake planning state
  const [templates, setTemplates] = useState<VectorTemplate | null>(null);
  const [intentInput, setIntentInput] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("logo");
  const [selectedAspectRatio, setSelectedAspectRatio] = useState("1:1");
  const [selectedAesthetic, setSelectedAesthetic] = useState("modern");
  const [selectedPalette, setSelectedPalette] = useState("brand");

  const [isPlanning, setIsPlanning] = useState(false);
  const [isOfflineWarning, setIsOfflineWarning] = useState(false);
  const [authorityWarning, setAuthorityWarning] = useState("");
  const [plannedComposition, setPlannedComposition] = useState<VectorPlanResponse | null>(null);
  const [dispatchResultMsg, setDispatchResultMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [isDispatching, setIsDispatching] = useState(false);

  // Sync state with StateService
  useEffect(() => {
    const hydrate = () => {
      const s = stateService.getState()["vector.state"] || {
        projectId: "",
        activePlan: null,
        selectedShapeId: null,
        canvas: { width: 1024, height: 1024, viewBox: "0 0 1024 1024", background: "#0b0f19" },
        shapes: {},
        shapeOrder: [],
        audit: []
      };
      setVectorState(s);
    };

    hydrate();
    const unsub = eventBus.subscribe("state:changed", () => {
      hydrate();
    });

    // Fetch templates
    const loadTemplates = async () => {
      const t = await getVectorTemplates();
      setTemplates(t);
    };
    loadTemplates();

    return () => unsub();
  }, []);

  const updateState = (updater: (prev: any) => any) => {
    const next = updater(vectorState);
    stateService.setState({
      "vector.state": next
    });
    eventBus.publish("state:changed", stateService.getState());
  };

  // Keyboard basics: nudge, escape, delete
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!vectorState.selectedShapeId) return;
      const shape = vectorState.shapes[vectorState.selectedShapeId];
      if (!shape || shape.locked) return;

      if (document.activeElement?.tagName === "INPUT" || document.activeElement?.tagName === "TEXTAREA") {
        return;
      }

      if (e.key === "Delete" || e.key === "Backspace") {
        e.preventDefault();
        handleDeleteShape(shape.id);
      } else if (e.key === "Escape") {
        e.preventDefault();
        handleSelectShape(null);
      } else if (e.key.startsWith("Arrow")) {
        e.preventDefault();
        const delta = e.shiftKey ? 10 : 1;
        let dx = 0;
        let dy = 0;
        if (e.key === "ArrowLeft") dx = -delta;
        if (e.key === "ArrowRight") dx = delta;
        if (e.key === "ArrowUp") dy = -delta;
        if (e.key === "ArrowDown") dy = delta;

        handleNudgeShape(shape.id, dx, dy);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [vectorState]);

  // 1. Analyze Intent -> Blueprint
  const handleAnalyzeIntent = async () => {
    if (intentInput.trim().length < 3) return;
    setIsPlanning(true);
    setIsOfflineWarning(false);
    setPlannedComposition(null);
    setDispatchResultMsg(null);

    const plan = await planVectorComposition({
      intent: intentInput,
      category: selectedCategory,
      aspectRatio: selectedAspectRatio,
      palette: selectedPalette,
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
        studioId: "vector",
        title: "Vector Intent Received",
        message: `Plan request received: "${intentInput}"`,
        timestamp: new Date().toISOString(),
      })
    );

    recordWorkspaceAuditEvent(
      createWorkspacePlanGeneratedEvent({
        id: `audit_plan_${Math.random().toString(36).substring(2, 8)}`,
        studioId: "vector",
        title: "Vector Blueprint Generated",
        message: `Generated plan with ${plan.shapeBreakdown.length} planned vector elements: "${plan.compositionStrategy}"`,
        timestamp: new Date().toISOString(),
      })
    );

    recordWorkspaceAuditEvent(
      createWorkspaceProviderCalledEvent({
        id: `audit_provider_${Math.random().toString(36).substring(2, 8)}`,
        studioId: "vector",
        title: "Imagine X Provider Routed",
        message: `Routed to ${plan.provider.name} in ${plan.provider.mode} mode.`,
        timestamp: new Date().toISOString(),
      })
    );
  };

  // 2. Approve Blueprint -> Dispatch Dry-Run Action
  const handleApprovePlan = async () => {
    if (!plannedComposition) return;

    if (!activeVectorRuntimeId) {
      setDispatchResultMsg({
        type: "error",
        text: "Guarded State: No active promoted Vector runtime is available. Please register and activate a promoted Vector-capable runtime first.",
      });
      return;
    }

    const authorityDecision = evaluateVectorRuntimeAuthority("previewVectorComposition");
    if (!authorityDecision.allowed) {
      const auditEvent = createVectorAuthorityBlockedAuditEvent(authorityDecision);
      setAuthorityWarning(authorityDecision.message);
      updateState((prev: any) => ({
        ...prev,
        audit: [...prev.audit, auditEvent],
      }));
      recordWorkspaceAuditEvent(
        createWorkspaceAuthorityBlockedEvent({
          ...auditEvent,
          studioId: "vector",
          message: auditEvent.description || "",
        })
      );
      return;
    }

    setAuthorityWarning("");
    setIsDispatching(true);
    setDispatchResultMsg(null);

    try {
      const result = await dispatchDryRunAction({
        runtimeId: activeVectorRuntimeId,
        actionId: "generateVectorComposition",
        payload: { plan: plannedComposition },
      });

      if (result.status === "denied" || result.status === "failed") {
        const errorMsg = result.diagnostics?.map((d: any) => d.message).join("; ") || "Dispatch failed or was denied.";
        setDispatchResultMsg({
          type: "error",
          text: errorMsg,
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

      // Submit successful dry-run preview to intake service
      const intake = intakeDryRunPreview({
        runtimeId: activeVectorRuntimeId,
        actionId: "generateVectorComposition",
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

        setDispatchResultMsg({
          type: "success",
          text: "Vector composition preview successfully dispatched and queued.",
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
      setPlannedComposition(null);
    }
  };

  // Manual shape creation helpers
  const handleAddRect = () => {
    const canvasWidth = vectorState.canvas.width;
    const canvasHeight = vectorState.canvas.height;
    const newShape = createRectShape("Rectangle Layer", canvasWidth * 0.3, canvasHeight * 0.3, canvasWidth * 0.4, canvasHeight * 0.4);
    
    updateState(prev => {
      const updatedAudit: VectorAuditEvent = {
        id: `audit_add_rect_${Math.random().toString(36).substring(2, 8)}`,
        type: "shape_created",
        timestamp: new Date().toISOString(),
        title: "Rectangle Shape Added",
        description: "Manually created rectangle shape layer."
      };
      return {
        ...prev,
        shapes: { ...prev.shapes, [newShape.id]: newShape },
        shapeOrder: [...prev.shapeOrder, newShape.id],
        selectedShapeId: newShape.id,
        audit: [...prev.audit, updatedAudit]
      };
    });
  };

  const handleAddCircle = () => {
    const canvasWidth = vectorState.canvas.width;
    const canvasHeight = vectorState.canvas.height;
    const newShape = createCircleShape("Circle Layer", canvasWidth / 2, canvasHeight / 2, Math.min(canvasWidth, canvasHeight) * 0.2);
    
    updateState(prev => {
      const updatedAudit: VectorAuditEvent = {
        id: `audit_add_circle_${Math.random().toString(36).substring(2, 8)}`,
        type: "shape_created",
        timestamp: new Date().toISOString(),
        title: "Circle Shape Added",
        description: "Manually created circle shape layer."
      };
      return {
        ...prev,
        shapes: { ...prev.shapes, [newShape.id]: newShape },
        shapeOrder: [...prev.shapeOrder, newShape.id],
        selectedShapeId: newShape.id,
        audit: [...prev.audit, updatedAudit]
      };
    });
  };

  const handleAddText = () => {
    const canvasWidth = vectorState.canvas.width;
    const canvasHeight = vectorState.canvas.height;
    const newShape = createTextShape("Text Layer", canvasWidth * 0.3, canvasHeight / 2, "Axiom Vector");
    
    updateState(prev => {
      const updatedAudit: VectorAuditEvent = {
        id: `audit_add_text_${Math.random().toString(36).substring(2, 8)}`,
        type: "shape_created",
        timestamp: new Date().toISOString(),
        title: "Text Shape Added",
        description: "Manually created text shape layer."
      };
      return {
        ...prev,
        shapes: { ...prev.shapes, [newShape.id]: newShape },
        shapeOrder: [...prev.shapeOrder, newShape.id],
        selectedShapeId: newShape.id,
        audit: [...prev.audit, updatedAudit]
      };
    });
  };

  // Selection & mutations
  const handleSelectShape = (id: string | null) => {
    updateState(prev => ({
      ...prev,
      selectedShapeId: id
    }));
  };

  const handleToggleVisibility = (id: string) => {
    updateState(prev => ({
      ...prev,
      shapes: {
        ...prev.shapes,
        [id]: { ...prev.shapes[id], visible: !prev.shapes[id].visible }
      }
    }));
  };

  const handleToggleLock = (id: string) => {
    updateState(prev => ({
      ...prev,
      shapes: {
        ...prev.shapes,
        [id]: { ...prev.shapes[id], locked: !prev.shapes[id].locked }
      }
    }));
  };

  const handleDuplicateShape = (id: string) => {
    const shape = vectorState.shapes[id];
    if (!shape) return;

    const newId = `shape_dup_${Math.random().toString(36).substring(2, 8)}`;
    
    // Nudge the duplicated shape coordinates slightly
    let duplicated = { ...shape, id: newId, name: `${shape.name} (Copy)` };
    if (duplicated.type === "rect") {
      duplicated.x += 20;
      duplicated.y += 20;
    } else if (duplicated.type === "circle") {
      duplicated.cx += 20;
      duplicated.cy += 20;
    } else if (duplicated.type === "text") {
      duplicated.x += 20;
      duplicated.y += 20;
    }

    updateState(prev => {
      const updatedAudit: VectorAuditEvent = {
        id: `audit_dup_${Math.random().toString(36).substring(2, 8)}`,
        type: "shape_created",
        timestamp: new Date().toISOString(),
        title: "Shape Duplicated",
        description: `Cloned shape layer: ${shape.name}`
      };
      return {
        ...prev,
        shapes: { ...prev.shapes, [newId]: duplicated },
        shapeOrder: [...prev.shapeOrder, newId],
        selectedShapeId: newId,
        audit: [...prev.audit, updatedAudit]
      };
    });
  };

  const handleDeleteShape = (id: string) => {
    updateState(prev => {
      const newShapes = { ...prev.shapes };
      delete newShapes[id];
      const newOrder = prev.shapeOrder.filter((sid: string) => sid !== id);
      return {
        ...prev,
        shapes: newShapes,
        shapeOrder: newOrder,
        selectedShapeId: prev.selectedShapeId === id ? null : prev.selectedShapeId
      };
    });
  };

  const handleMoveShapeOrder = (id: string, direction: "up" | "down") => {
    updateState(prev => {
      const idx = prev.shapeOrder.indexOf(id);
      if (idx === -1) return prev;
      const targetIdx = direction === "up" ? idx + 1 : idx - 1;
      if (targetIdx < 0 || targetIdx >= prev.shapeOrder.length) return prev;

      const newOrder = [...prev.shapeOrder];
      const temp = newOrder[idx];
      newOrder[idx] = newOrder[targetIdx];
      newOrder[targetIdx] = temp;

      return {
        ...prev,
        shapeOrder: newOrder
      };
    });
  };

  const handleNudgeShape = (id: string, dx: number, dy: number) => {
    updateState(prev => {
      const shape = prev.shapes[id];
      if (!shape || shape.locked) return prev;
      
      const updated = { ...shape };
      if (updated.type === "rect") {
        updated.x += dx;
        updated.y += dy;
      } else if (updated.type === "circle") {
        updated.cx += dx;
        updated.cy += dy;
      } else if (updated.type === "text") {
        updated.x += dx;
        updated.y += dy;
      }

      // Check bounds validation before updating
      const validation = validateShape(updated);
      if (!validation.valid) return prev;

      return {
        ...prev,
        shapes: { ...prev.shapes, [id]: updated }
      };
    });
  };

  const handlePropertyChange = (id: string, key: string, value: any) => {
    updateState(prev => {
      const shape = prev.shapes[id];
      if (!shape || shape.locked) return prev;

      let updated = { ...shape, [key]: value };
      
      // Parse numeric fields
      const numericFields = ["x", "y", "width", "height", "rx", "cx", "cy", "r", "fontSize", "strokeWidth", "opacity"];
      if (numericFields.includes(key)) {
        updated[key] = parseFloat(value) || 0;
      }

      // Check validation
      const validation = validateShape(updated);
      if (!validation.valid) {
        console.warn("Property validation failed: ", validation.error);
        return prev;
      }

      return {
        ...prev,
        shapes: { ...prev.shapes, [id]: updated }
      };
    });
  };

  // Safe State SVG Exporter
  const handleExportSVG = () => {
    const s = stateService.getState()["vector.state"];
    if (!s || s.shapeOrder.length === 0) return;
    const authorityDecision = evaluateVectorRuntimeAuthority("exportVector");
    if (!authorityDecision.allowed) {
      const auditEvent = createVectorAuthorityBlockedAuditEvent(authorityDecision);
      setAuthorityWarning(authorityDecision.message);
      updateState((prev: any) => ({
        ...prev,
        audit: [...prev.audit, auditEvent],
      }));
      recordWorkspaceAuditEvent(
        createWorkspaceAuthorityBlockedEvent({
          ...auditEvent,
          studioId: "vector",
          message: auditEvent.description || "",
        })
      );
      return;
    }

    setAuthorityWarning("");

    const exportEvent: VectorAuditEvent = {
      id: `audit_export_svg_${Math.random().toString(36).substring(2, 8)}`,
      type: "export_requested",
      timestamp: new Date().toISOString(),
      title: "SVG Vector Exported",
      description: "Serialized state vector nodes and downloaded SVG."
    };

    updateState(prev => ({
      ...prev,
      audit: [...prev.audit, exportEvent]
    }));

    recordWorkspaceAuditEvent(
      createWorkspaceExportRequestedEvent({
        id: exportEvent.id,
        studioId: "vector",
        title: exportEvent.title,
        message: exportEvent.description || "",
        timestamp: exportEvent.timestamp,
      })
    );

    const svgXml = serializeVectorStateToSvg({
      ...s,
      audit: [...s.audit, exportEvent]
    });

    const blob = new Blob([svgXml], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "vector_composition.svg";
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const handleExportAXPKG = () => {
    if (vectorState.shapeOrder.length === 0) return;
    const authorityDecision = evaluateVectorRuntimeAuthority("exportVector");
    if (!authorityDecision.allowed) {
      const auditEvent = createVectorAuthorityBlockedAuditEvent(authorityDecision);
      setAuthorityWarning(authorityDecision.message);
      updateState((prev: any) => ({
        ...prev,
        audit: [...prev.audit, auditEvent],
      }));
      recordWorkspaceAuditEvent(
        createWorkspaceAuthorityBlockedEvent({
          ...auditEvent,
          studioId: "vector",
          message: auditEvent.description || "",
        })
      );
      return;
    }

    setAuthorityWarning("");

    const exportEvent: VectorAuditEvent = {
      id: `audit_export_axpkg_${Math.random().toString(36).substring(2, 8)}`,
      type: "export_requested",
      timestamp: new Date().toISOString(),
      title: "AXPKG Exported",
      description: "Downloaded project.axpkg.json."
    };

    const updatedState = {
      ...vectorState,
      audit: [...vectorState.audit, exportEvent]
    };

    updateState(() => updatedState);

    recordWorkspaceAuditEvent(
      createWorkspaceExportRequestedEvent({
        id: exportEvent.id,
        studioId: "vector",
        title: exportEvent.title,
        message: exportEvent.description || "",
        timestamp: exportEvent.timestamp,
      })
    );

    const payload = {
      format: "AXPKG",
      version: "0.1.0",
      project: {
        id: updatedState.projectId,
        name: "Vector Studio Project",
        createdAt: new Date().toISOString()
      },
      plan: updatedState.activePlan,
      canvas: updatedState.canvas,
      shapes: updatedState.shapes,
      shapeOrder: updatedState.shapeOrder,
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

  const selectedShape = vectorState.shapes[vectorState.selectedShapeId];

  // Convert schema audit to match timeline audit types
  const convertedAuditEvents: any[] = vectorState.audit.map((e: any) => ({
    id: e.id,
    type: e.type,
    timestamp: e.timestamp,
    title: e.title,
    description: e.description
  }));

  return (
    <div style={{ display: "grid", gridTemplateColumns: "300px 1fr 320px", gap: "16px", height: "100%", overflow: "hidden", background: "#090d16", color: "#e2e8f0", fontFamily: "system-ui, -apple-system, sans-serif" }}>
      
      {/* ── LEFT PANEL: INTAKE & LAYERS ── */}
      <div style={{ display: "flex", flexDirection: "column", gap: "16px", borderRight: "1px solid rgba(255,255,255,0.05)", padding: "16px", overflowY: "auto" }}>
        
        {/* Vector Planner Intake */}
        <div style={{ display: "flex", flexDirection: "column", gap: "10px", padding: "14px", background: "rgba(99, 102, 241, 0.05)", borderRadius: "10px", border: "1px solid rgba(99, 102, 241, 0.15)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <Sparkles size={14} style={{ color: "#a5b4fc" }} />
            <span style={{ fontSize: "11px", fontWeight: 700, color: "#a5b4fc", textTransform: "uppercase", letterSpacing: "0.05em" }}>Vector Planner</span>
          </div>

          {!isMockVectorActive && (
            <div
              role="alert"
              style={{
                padding: "8px 10px",
                borderRadius: "6px",
                background: "rgba(239, 68, 68, 0.12)",
                border: "1px solid rgba(239, 68, 68, 0.28)",
                color: "#fca5a5",
                fontSize: "11px",
                lineHeight: 1.4,
              }}
            >
              <div style={{ display: "flex", gap: "6px", alignItems: "flex-start" }}>
                <AlertTriangle size={14} style={{ flexShrink: 0, marginTop: "1px" }} />
                <span>
                  <strong>Guarded State:</strong> No active promoted Vector runtime is available. Please register and activate a promoted Vector-capable runtime first.
                </span>
              </div>
            </div>
          )}

          {dispatchResultMsg && (
            <div
              role="alert"
              style={{
                padding: "8px 10px",
                borderRadius: "6px",
                background: dispatchResultMsg.type === "success" ? "rgba(16, 185, 129, 0.12)" : "rgba(239, 68, 68, 0.12)",
                border: `1px solid ${dispatchResultMsg.type === "success" ? "rgba(16, 185, 129, 0.28)" : "rgba(239, 68, 68, 0.28)"}`,
                color: dispatchResultMsg.type === "success" ? "#a7f3d0" : "#fca5a5",
                fontSize: "11px",
                lineHeight: 1.35,
              }}
            >
              {dispatchResultMsg.text}
            </div>
          )}

          {authorityWarning ? (
            <div role="alert" style={{ padding: "8px", borderRadius: "6px", background: "rgba(239, 68, 68, 0.12)", border: "1px solid rgba(239, 68, 68, 0.28)", color: "#fecaca", fontSize: "11px", lineHeight: 1.35 }}>
              {authorityWarning}
            </div>
          ) : null}

          <label style={{ display: "flex", flexDirection: "column", gap: "4px", fontSize: "11px", color: "#94a3b8" }}>
            Creative Intent
            <textarea
              value={intentInput}
              onChange={(e) => setIntentInput(e.target.value)}
              placeholder="Describe the logo / icon illustration..."
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
                {templates?.categories.map(c => <option key={c} value={c}>{c}</option>) || <option value="logo">logo</option>}
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
                {templates?.aesthetics.map(a => <option key={a} value={a}>{a}</option>) || <option value="modern">modern</option>}
              </select>
            </label>
            <label style={{ display: "flex", flexDirection: "column", gap: "4px", fontSize: "11px", color: "#94a3b8" }}>
              Palette
              <select
                value={selectedPalette}
                onChange={(e) => setSelectedPalette(e.target.value)}
                style={{ padding: "5px", background: "#0b0f19", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "4px", color: "#f1f5f9", fontSize: "11px" }}
              >
                {templates?.palettes.map(p => <option key={p} value={p}>{p}</option>) || <option value="brand">brand</option>}
              </select>
            </label>
          </div>

          <button
            onClick={handleAnalyzeIntent}
            disabled={!isMockVectorActive || isPlanning || intentInput.trim().length < 3}
            style={{ padding: "8px", background: "#4f46e5", border: "none", borderRadius: "6px", color: "#fff", fontWeight: 600, fontSize: "12px", cursor: "pointer", opacity: (!isMockVectorActive || isPlanning || intentInput.trim().length < 3) ? 0.5 : 1 }}
          >
            {isPlanning ? "Planning..." : "Analyze Intent"}
          </button>
        </div>

        {/* Blueprint preview */}
        {plannedComposition && (
          <div style={{ display: "flex", flexDirection: "column", gap: "10px", padding: "14px", background: "rgba(245, 158, 11, 0.04)", borderRadius: "10px", border: "1px solid rgba(245, 158, 11, 0.2)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "#f59e0b" }}>
              <AlertTriangle size={14} />
              <span style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase" }}>Vector Blueprint</span>
            </div>
            
            <div style={{ fontSize: "11px", color: "#cbd5e1", display: "flex", flexDirection: "column", gap: "4px" }}>
              <div><strong>Category:</strong> {plannedComposition.category}</div>
              <div><strong>viewBox:</strong> {plannedComposition.canvas.viewBox}</div>
              <div><strong>Aesthetic:</strong> {plannedComposition.aesthetic}</div>
              <div><strong>Palette:</strong> {plannedComposition.palette} ({plannedComposition.colorPalette.join(", ")})</div>
              <div><strong>Strategy:</strong> {plannedComposition.compositionStrategy}</div>
            </div>

            <div style={{ borderTop: "1px solid rgba(255,255,255,0.05)", paddingTop: "8px" }}>
              <span style={{ fontSize: "10px", color: "#64748b", fontWeight: 700, display: "block", marginBottom: "4px" }}>PLANNED SHAPES</span>
              {plannedComposition.shapeBreakdown.map((s, i) => (
                <div key={i} style={{ fontSize: "11px", color: "#94a3b8", display: "flex", gap: "4px", marginBottom: "2px" }}>
                  <span>•</span>
                  <span>{s.name} ({s.type})</span>
                </div>
              ))}
            </div>

            {isOfflineWarning && (
              <span style={{ fontSize: "10px", color: "#f59e0b" }}>⚠️ Backend offline — loaded mock blueprint.</span>
            )}

            <button
              onClick={handleApprovePlan}
              disabled={!isMockVectorActive || isDispatching}
              style={{ padding: "8px", background: "#10b981", border: "none", borderRadius: "6px", color: "#fff", fontWeight: 600, fontSize: "12px", cursor: "pointer", marginTop: "4px", opacity: (!isMockVectorActive || isDispatching) ? 0.5 : 1 }}
            >
              {isDispatching ? "Dispatching..." : "Approve & Dispatch Canvas Preview"}
            </button>
          </div>
        )}

        {/* Layers sidebar */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "8px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "6px", borderBottom: "1px solid rgba(255,255,255,0.05)", paddingBottom: "6px" }}>
            <Layers size={14} style={{ color: "#94a3b8" }} />
            <span style={{ fontSize: "11px", fontWeight: 700, color: "#94a3b8", textTransform: "uppercase" }}>Shape Layers</span>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            {vectorState.shapeOrder.map((id: string) => {
              const shape = vectorState.shapes[id];
              if (!shape) return null;
              const isSelected = vectorState.selectedShapeId === id;
              return (
                <div
                  key={id}
                  onClick={() => handleSelectShape(id)}
                  style={{
                    padding: "8px 10px",
                    background: isSelected ? "rgba(99, 102, 241, 0.08)" : "rgba(255,255,255,0.01)",
                    border: `1px solid ${isSelected ? "#6366f1" : "rgba(255,255,255,0.05)"}`,
                    borderRadius: "6px",
                    cursor: "pointer",
                    display: "flex",
                    flexDirection: "column",
                    gap: "4px"
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: "12px", fontWeight: isSelected ? 600 : 500, color: isSelected ? "#cbd5e1" : "#94a3b8" }}>
                      {shape.name} <span style={{ fontSize: "10px", color: "#64748b" }}>({shape.type})</span>
                    </span>
                    <div style={{ display: "flex", gap: "6px" }} onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => handleToggleLock(id)}
                        style={{ background: "none", border: "none", cursor: "pointer", padding: 0, color: shape.locked ? "#f59e0b" : "#475569" }}
                      >
                        {shape.locked ? <Lock size={12} /> : <Unlock size={12} />}
                      </button>
                      <button
                        onClick={() => handleToggleVisibility(id)}
                        style={{ background: "none", border: "none", cursor: "pointer", padding: 0, color: shape.visible ? "#818cf8" : "#475569" }}
                      >
                        {shape.visible ? <Eye size={12} /> : <EyeOff size={12} />}
                      </button>
                      <button
                        onClick={() => handleDuplicateShape(id)}
                        style={{ background: "none", border: "none", cursor: "pointer", padding: 0, color: "#64748b" }}
                      >
                        <Copy size={12} />
                      </button>
                      <button
                        onClick={() => handleMoveShapeOrder(id, "up")}
                        style={{ background: "none", border: "none", cursor: "pointer", padding: 0, color: "#64748b" }}
                      >
                        <ArrowUp size={12} />
                      </button>
                      <button
                        onClick={() => handleMoveShapeOrder(id, "down")}
                        style={{ background: "none", border: "none", cursor: "pointer", padding: 0, color: "#64748b" }}
                      >
                        <ArrowDown size={12} />
                      </button>
                      <button
                        onClick={() => handleDeleteShape(id)}
                        style={{ background: "none", border: "none", cursor: "pointer", padding: 0, color: "#ef4444" }}
                        disabled={shape.locked}
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── CENTER WORKSPACE: CANVAS ── */}
      <div style={{ display: "flex", flexDirection: "column", gap: "16px", padding: "16px", overflow: "hidden" }}>
        
        {/* Canvas Toolbar */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid rgba(255,255,255,0.05)", paddingBottom: "10px" }}>
          <div>
            <h2 style={{ margin: 0, fontSize: "14px", fontWeight: 600 }}>SVG Workspace Viewport</h2>
            <span style={{ fontSize: "11px", color: "#64748b" }}>
              viewBox: {vectorState.canvas.viewBox}
            </span>
          </div>
          <div style={{ display: "flex", gap: "8px" }}>
            <button
              onClick={handleExportSVG}
              disabled={vectorState.shapeOrder.length === 0}
              style={{ display: "flex", alignItems: "center", gap: "6px", padding: "6px 12px", background: "rgba(16, 185, 129, 0.15)", border: "1px solid rgba(16,185,129,0.25)", borderRadius: "6px", color: "#34d399", fontSize: "12px", fontWeight: 600, cursor: "pointer", opacity: vectorState.shapeOrder.length === 0 ? 0.5 : 1 }}
            >
              <Download size={14} />
              Export SVG
            </button>
            <button
              onClick={handleExportAXPKG}
              disabled={vectorState.shapeOrder.length === 0}
              style={{ display: "flex", alignItems: "center", gap: "6px", padding: "6px 12px", background: "rgba(251, 191, 36, 0.15)", border: "1px solid rgba(251,191,36,0.25)", borderRadius: "6px", color: "#fbbf24", fontSize: "12px", fontWeight: 600, cursor: "pointer", opacity: vectorState.shapeOrder.length === 0 ? 0.5 : 1 }}
            >
              <Download size={14} />
              Export AXPKG
            </button>
          </div>
        </div>

        {/* Viewport Sandbox with Tools Rail */}
        <div style={{ flex: 1, display: "grid", gridTemplateColumns: "50px 1fr", gap: "12px", background: "rgba(255,255,255,0.01)", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.03)", padding: "16px", overflow: "hidden" }}>
          
          {/* Tools Rail */}
          <div style={{ display: "flex", flexDirection: "column", gap: "8px", borderRight: "1px solid rgba(255,255,255,0.05)", paddingRight: "8px", alignItems: "center" }}>
            <button
              title="Select Tool"
              onClick={() => handleSelectShape(null)}
              style={{ width: "32px", height: "32px", borderRadius: "6px", border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.02)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#cbd5e1" }}
            >
              <MousePointer size={16} />
            </button>
            <button
              title="Create Rectangle"
              onClick={handleAddRect}
              style={{ width: "32px", height: "32px", borderRadius: "6px", border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.02)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#cbd5e1" }}
            >
              <Square size={16} />
            </button>
            <button
              title="Create Circle"
              onClick={handleAddCircle}
              style={{ width: "32px", height: "32px", borderRadius: "6px", border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.02)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#cbd5e1" }}
            >
              <Circle size={16} />
            </button>
            <button
              title="Create Text"
              onClick={handleAddText}
              style={{ width: "32px", height: "32px", borderRadius: "6px", border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.02)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#cbd5e1" }}
            >
              <Type size={16} />
            </button>
          </div>

          {/* Canvas workspace */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", overflow: "auto" }}>
            {vectorState.shapeOrder.length === 0 ? (
              <div style={{ textAlign: "center", color: "#64748b" }}>
                <Image size={48} style={{ opacity: 0.2, marginBottom: "8px" }} />
                <p style={{ margin: 0, fontSize: "13px" }}>No vector shapes on canvas.</p>
                <p style={{ margin: "4px 0 0", fontSize: "11px" }}>Generate assets using the Planner or use manual shape tools.</p>
              </div>
            ) : (
              <div
                style={{
                  width: `${vectorState.canvas.width}px`,
                  height: `${vectorState.canvas.height}px`,
                  background: vectorState.canvas.background,
                  position: "relative",
                  boxShadow: "0 10px 30px rgba(0,0,0,0.5)",
                  transform: "scale(0.4)", // Scale responsive viewBox view
                  transformOrigin: "center center",
                  flexShrink: 0
                }}
              >
                <svg
                  width="100%"
                  height="100%"
                  viewBox={vectorState.canvas.viewBox}
                  xmlns="http://www.w3.org/2000/svg"
                  style={{ pointerEvents: "auto" }}
                >
                  {vectorState.shapeOrder.map((id: string) => {
                    const shape = vectorState.shapes[id];
                    if (!shape || !shape.visible) return null;
                    const isSelected = vectorState.selectedShapeId === id;
                    
                    // Render base SVG elements directly to React
                    const baseProps = {
                      onClick: (e: any) => {
                        e.stopPropagation();
                        handleSelectShape(id);
                      },
                      style: { cursor: shape.locked ? "not-allowed" : "pointer", pointerEvents: "visiblePainted" as any },
                      fill: shape.fill,
                      stroke: shape.stroke,
                      strokeWidth: shape.strokeWidth,
                      opacity: shape.opacity,
                      transform: shape.transform
                        ? `translate(${shape.transform.x} ${shape.transform.y}) rotate(${shape.transform.rotation}) scale(${shape.transform.scaleX} ${shape.transform.scaleY})`
                        : undefined
                    };

                    if (shape.type === "rect") {
                      return (
                        <g key={id}>
                          <rect x={shape.x} y={shape.y} width={shape.width} height={shape.height} rx={shape.rx} {...baseProps} />
                          {isSelected && !shape.locked && (
                            <rect x={shape.x - 2} y={shape.y - 2} width={shape.width + 4} height={shape.height + 4} fill="none" stroke="#818cf8" strokeWidth={1} strokeDasharray="3,3" />
                          )}
                        </g>
                      );
                    } else if (shape.type === "circle") {
                      return (
                        <g key={id}>
                          <circle cx={shape.cx} cy={shape.cy} r={shape.r} {...baseProps} />
                          {isSelected && !shape.locked && (
                            <circle cx={shape.cx} cy={shape.cy} r={shape.r + 2} fill="none" stroke="#818cf8" strokeWidth={1} strokeDasharray="3,3" />
                          )}
                        </g>
                      );
                    } else if (shape.type === "text") {
                      return (
                        <text key={id} x={shape.x} y={shape.y} fontSize={shape.fontSize} fontFamily={shape.fontFamily || "sans-serif"} {...baseProps}>
                          {shape.text}
                        </text>
                      );
                    } else if (shape.type === "path") {
                      return (
                        <path key={id} d={shape.d} {...baseProps} />
                      );
                    }
                    return null;
                  })}
                </svg>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── RIGHT PANEL: PROPERTIES INSPECTOR ── */}
      <div style={{ display: "flex", flexDirection: "column", gap: "16px", borderLeft: "1px solid rgba(255,255,255,0.05)", padding: "16px", overflowY: "auto" }}>
        
        {/* Properties Inspector Panel */}
        <div style={{ display: "flex", flexDirection: "column", gap: "10px", padding: "14px", background: "rgba(255,255,255,0.01)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: "10px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <Sliders size={14} style={{ color: "#94a3b8" }} />
            <span style={{ fontSize: "11px", fontWeight: 700, color: "#94a3b8", textTransform: "uppercase" }}>Shape Properties</span>
          </div>

          {selectedShape ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginTop: "6px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: "12px", color: "#cbd5e1", fontWeight: 600 }}>{selectedShape.name}</span>
                {selectedShape.locked && <span style={{ fontSize: "10px", color: "#f59e0b" }}>Locked</span>}
              </div>

              {/* Name */}
              <label style={{ display: "flex", flexDirection: "column", gap: "4px", fontSize: "11px", color: "#94a3b8" }}>
                Name
                <input
                  type="text"
                  value={selectedShape.name}
                  onChange={(e) => handlePropertyChange(selectedShape.id, "name", e.target.value)}
                  disabled={selectedShape.locked}
                  style={{ padding: "4px 8px", background: "#0b0f19", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "4px", color: "#f1f5f9" }}
                />
              </label>

              {/* Fill & Stroke colors */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                <label style={{ display: "flex", flexDirection: "column", gap: "4px", fontSize: "11px", color: "#94a3b8" }}>
                  Fill Hex
                  <input
                    type="text"
                    value={selectedShape.fill}
                    onChange={(e) => handlePropertyChange(selectedShape.id, "fill", e.target.value)}
                    disabled={selectedShape.locked}
                    style={{ padding: "4px 8px", background: "#0b0f19", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "4px", color: "#f1f5f9" }}
                  />
                </label>
                <label style={{ display: "flex", flexDirection: "column", gap: "4px", fontSize: "11px", color: "#94a3b8" }}>
                  Stroke Hex
                  <input
                    type="text"
                    value={selectedShape.stroke}
                    onChange={(e) => handlePropertyChange(selectedShape.id, "stroke", e.target.value)}
                    disabled={selectedShape.locked}
                    style={{ padding: "4px 8px", background: "#0b0f19", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "4px", color: "#f1f5f9" }}
                  />
                </label>
              </div>

              {/* Opacity & Stroke Width */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                <label style={{ display: "flex", flexDirection: "column", gap: "4px", fontSize: "11px", color: "#94a3b8" }}>
                  Stroke Width
                  <input
                    type="number"
                    value={selectedShape.strokeWidth}
                    onChange={(e) => handlePropertyChange(selectedShape.id, "strokeWidth", e.target.value)}
                    disabled={selectedShape.locked}
                    style={{ padding: "4px 8px", background: "#0b0f19", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "4px", color: "#f1f5f9" }}
                  />
                </label>
                <label style={{ display: "flex", flexDirection: "column", gap: "4px", fontSize: "11px", color: "#94a3b8" }}>
                  Opacity
                  <input
                    type="number"
                    min="0"
                    max="1"
                    step="0.1"
                    value={selectedShape.opacity}
                    onChange={(e) => handlePropertyChange(selectedShape.id, "opacity", e.target.value)}
                    disabled={selectedShape.locked}
                    style={{ padding: "4px 8px", background: "#0b0f19", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "4px", color: "#f1f5f9" }}
                  />
                </label>
              </div>

              {/* Discriminated shape properties */}
              {selectedShape.type === "rect" && (
                <>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                    <label style={{ display: "flex", flexDirection: "column", gap: "4px", fontSize: "11px", color: "#94a3b8" }}>
                      X
                      <input
                        type="number"
                        value={(selectedShape as VectorRectShape).x}
                        onChange={(e) => handlePropertyChange(selectedShape.id, "x", e.target.value)}
                        disabled={selectedShape.locked}
                        style={{ padding: "4px 8px", background: "#0b0f19", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "4px", color: "#f1f5f9" }}
                      />
                    </label>
                    <label style={{ display: "flex", flexDirection: "column", gap: "4px", fontSize: "11px", color: "#94a3b8" }}>
                      Y
                      <input
                        type="number"
                        value={(selectedShape as VectorRectShape).y}
                        onChange={(e) => handlePropertyChange(selectedShape.id, "y", e.target.value)}
                        disabled={selectedShape.locked}
                        style={{ padding: "4px 8px", background: "#0b0f19", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "4px", color: "#f1f5f9" }}
                      />
                    </label>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                    <label style={{ display: "flex", flexDirection: "column", gap: "4px", fontSize: "11px", color: "#94a3b8" }}>
                      Width
                      <input
                        type="number"
                        value={(selectedShape as VectorRectShape).width}
                        onChange={(e) => handlePropertyChange(selectedShape.id, "width", e.target.value)}
                        disabled={selectedShape.locked}
                        style={{ padding: "4px 8px", background: "#0b0f19", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "4px", color: "#f1f5f9" }}
                      />
                    </label>
                    <label style={{ display: "flex", flexDirection: "column", gap: "4px", fontSize: "11px", color: "#94a3b8" }}>
                      Height
                      <input
                        type="number"
                        value={(selectedShape as VectorRectShape).height}
                        onChange={(e) => handlePropertyChange(selectedShape.id, "height", e.target.value)}
                        disabled={selectedShape.locked}
                        style={{ padding: "4px 8px", background: "#0b0f19", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "4px", color: "#f1f5f9" }}
                      />
                    </label>
                  </div>
                </>
              )}

              {selectedShape.type === "circle" && (
                <>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                    <label style={{ display: "flex", flexDirection: "column", gap: "4px", fontSize: "11px", color: "#94a3b8" }}>
                      cx
                      <input
                        type="number"
                        value={(selectedShape as VectorCircleShape).cx}
                        onChange={(e) => handlePropertyChange(selectedShape.id, "cx", e.target.value)}
                        disabled={selectedShape.locked}
                        style={{ padding: "4px 8px", background: "#0b0f19", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "4px", color: "#f1f5f9" }}
                      />
                    </label>
                    <label style={{ display: "flex", flexDirection: "column", gap: "4px", fontSize: "11px", color: "#94a3b8" }}>
                      cy
                      <input
                        type="number"
                        value={(selectedShape as VectorCircleShape).cy}
                        onChange={(e) => handlePropertyChange(selectedShape.id, "cy", e.target.value)}
                        disabled={selectedShape.locked}
                        style={{ padding: "4px 8px", background: "#0b0f19", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "4px", color: "#f1f5f9" }}
                      />
                    </label>
                  </div>
                  <label style={{ display: "flex", flexDirection: "column", gap: "4px", fontSize: "11px", color: "#94a3b8" }}>
                    Radius r
                    <input
                      type="number"
                      value={(selectedShape as VectorCircleShape).r}
                      onChange={(e) => handlePropertyChange(selectedShape.id, "r", e.target.value)}
                      disabled={selectedShape.locked}
                      style={{ padding: "4px 8px", background: "#0b0f19", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "4px", color: "#f1f5f9" }}
                    />
                  </label>
                </>
              )}

              {selectedShape.type === "text" && (
                <>
                  <label style={{ display: "flex", flexDirection: "column", gap: "4px", fontSize: "11px", color: "#94a3b8" }}>
                    Text Content
                    <input
                      type="text"
                      value={(selectedShape as VectorTextShape).text}
                      onChange={(e) => handlePropertyChange(selectedShape.id, "text", e.target.value)}
                      disabled={selectedShape.locked}
                      style={{ padding: "4px 8px", background: "#0b0f19", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "4px", color: "#f1f5f9" }}
                    />
                  </label>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                    <label style={{ display: "flex", flexDirection: "column", gap: "4px", fontSize: "11px", color: "#94a3b8" }}>
                      Font Size
                      <input
                        type="number"
                        value={(selectedShape as VectorTextShape).fontSize}
                        onChange={(e) => handlePropertyChange(selectedShape.id, "fontSize", e.target.value)}
                        disabled={selectedShape.locked}
                        style={{ padding: "4px 8px", background: "#0b0f19", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "4px", color: "#f1f5f9" }}
                      />
                    </label>
                    <label style={{ display: "flex", flexDirection: "column", gap: "4px", fontSize: "11px", color: "#94a3b8" }}>
                      X
                      <input
                        type="number"
                        value={(selectedShape as VectorTextShape).x}
                        onChange={(e) => handlePropertyChange(selectedShape.id, "x", e.target.value)}
                        disabled={selectedShape.locked}
                        style={{ padding: "4px 8px", background: "#0b0f19", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "4px", color: "#f1f5f9" }}
                      />
                    </label>
                  </div>
                </>
              )}

              {selectedShape.type === "path" && (
                <label style={{ display: "flex", flexDirection: "column", gap: "4px", fontSize: "11px", color: "#94a3b8" }}>
                  d Data (Read-only)
                  <textarea
                    value={(selectedShape as VectorPathShape).d}
                    readOnly
                    style={{ padding: "6px 8px", background: "#0b0f19", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "6px", color: "#64748b", fontSize: "10px", minHeight: "60px", resize: "none" }}
                  />
                </label>
              )}

            </div>
          ) : (
            <p style={{ margin: "6px 0 0", fontSize: "11px", color: "#64748b", fontStyle: "italic" }}>
              Select a vector layer to edit properties.
            </p>
          )}
        </div>

        {/* Audit timeline */}
        <div style={{ flex: 1 }}>
          <ReplayAuditPanel events={convertedAuditEvents} />
        </div>
      </div>
    </div>
  );
}
