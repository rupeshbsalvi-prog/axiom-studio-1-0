import { useEffect, useState, useCallback } from "react";
import {
  Play,
  CheckCircle,
  AlertTriangle,
  Cpu,
  GitBranch,
  Terminal,
  RefreshCw,
  BarChart2,
  Layers,
  ChevronRight,
  UserCheck,
  TrendingUp,
  Brain,
  Check,
  AlertCircle,
  Download,
  X
} from "lucide-react";

import { eventBus } from "../../../platform/services/EventBus";
import { stateService } from "../../../platform/services/StateService";
import { MISSION_STATE_KEYS } from "./BrainXState";
import { deriveExplanation } from "./mission/ExplanationEngine";
import { resolveDecision } from "./mission/MissionService";
import type { ExplanationContractV1 } from "./mission/ExplanationContract";
import type { BrainXMissionStateData } from "./mission/MissionTypes";
import { deriveTelemetrySnapshotV1 } from "./mission/TelemetryEngineV1";
import type { TelemetrySnapshotV1 } from "./mission/TelemetrySnapshotV1";

// Phase 02 additions
import { generateBrainPlan } from "../../services/brainApi";
import {
  resolveImagineXLearningAuthority,
  type ImagineXWorkspaceLearningPolicyState,
} from "../../services/ImagineXLearningAuthority";
import type { BrainPlanResponse, ReplayAuditEvent } from "../../services/brainTypes";
import type { PhotoPlanResponse } from "../../services/photoTypes";
import { ReplayAuditPanel } from "../../components/ReplayAuditPanel";
import { evaluateBrainXRuntimeAuthority, createBrainXAuthorityBlockedAuditEvent } from "./BrainXRuntimeAuthority";
import type { AxiomProjectDraft } from "../../projects/projectDraft";
import {
  buildPhotoProviderRequestManifest,
  validatePhotoProviderRequestManifest,
} from "../photo/PhotoProviderRequestContract";
import { getMockHandler } from "../../../runtime/activation/RuntimeMockActionRegistry";
import {
  intakeDryRunPreview,
  serializeCanvasPreviewState,
} from "../../../workspace/CanvasPreviewIntakeService";
import {
  applyImagineXRecommendationInfluence,
  approveImagineXPreferenceCandidate,
  createImagineXPreferenceProfileExport,
  decideImagineXRecommendationInfluence,
  deleteImagineXInfluenceEvaluationDecision,
  deleteImagineXPreferenceCandidate,
  previewImagineXPreferenceCandidate,
  previewImagineXRecommendationInfluence,
  recordImagineXInfluenceEvaluationDecision,
  recordImagineXOutcomeFeedback,
  recordImagineXProposalOutcome,
  resetImagineXPreferenceProfile,
  rollbackImagineXRecommendationInfluence,
  setImagineXLocalLearningEnabled,
  summarizeImagineXInfluenceEvaluation,
} from "../../services/ImagineXOutcomeService";
import {
  recordWorkspaceAuditEvent,
  createWorkspaceIntentReceivedEvent,
  createWorkspacePlanGeneratedEvent,
  createWorkspaceRecommendationInfluenceAppliedEvent,
  createWorkspaceRecommendationInfluenceRolledBackEvent,
  createWorkspaceProposalAcceptedEvent,
  createWorkspaceProposalRejectedEvent,
  createWorkspaceExportRequestedEvent,
  createWorkspaceProviderCalledEvent,
  getWorkspaceAuditEvents,
} from "../../../workspace/WorkspaceAuditService";

export function BrainXPanel({
  project,
  onUpdateProject,
  workspaceLearningPolicy = { status: "not_required" },
}: {
  project?: AxiomProjectDraft | null;
  onUpdateProject?: (project: AxiomProjectDraft) => void;
  workspaceLearningPolicy?: ImagineXWorkspaceLearningPolicyState;
}) {
  const [missionsState, setMissionsState] = useState<BrainXMissionStateData>({
    programs: [],
    missions: [],
    focusMissionId: null,
    globalMemory: [],
  });

  const [activeTab, setActiveTab] = useState<"timeline" | "graph" | "delegations" | "cognition">("timeline");
  const [hoveredTab, setHoveredTab] = useState<string | null>(null);
  const [hoveredOption, setHoveredOption] = useState<string | null>(null);

  // Phase 02 state
  const [intentInput, setIntentInput] = useState("");
  const [isPlanning, setIsPlanning] = useState(false);
  const [brainPlan, setBrainPlan] = useState<BrainPlanResponse | null>(null);
  const [isOfflineNotice, setIsOfflineNotice] = useState(false);
  const [proposalAccepted, setProposalAccepted] = useState<boolean | null>(null);
  const [authorityWarning, setAuthorityWarning] = useState("");
  const [outcomeRating, setOutcomeRating] = useState<number | null>(null);
  const [outcomeFeedback, setOutcomeFeedback] = useState("");
  const [feedbackSaved, setFeedbackSaved] = useState(false);
  const [resetPreferencePending, setResetPreferencePending] = useState(false);
  const [evaluationDecision, setEvaluationDecision] = useState<"keep" | "rollback" | "inconclusive">("inconclusive");
  const [evaluationRationale, setEvaluationRationale] = useState("");
  const [localLearningEnabled, setLocalLearningEnabled] = useState(
    project?.brain.learningControl?.enabled ?? false
  );
  const learningAuthority = resolveImagineXLearningAuthority(
    project?.brain.learningControl,
    workspaceLearningPolicy,
  );

  // Sync with StateService
  useEffect(() => {
    const hydrateState = () => {
      const s = stateService.getState();
      setMissionsState({
        programs: s[MISSION_STATE_KEYS.programs] ?? [],
        missions: s[MISSION_STATE_KEYS.missions] ?? [],
        focusMissionId: s[MISSION_STATE_KEYS.focusMissionId] ?? null,
        globalMemory: s[MISSION_STATE_KEYS.globalMemory] ?? [],
      });
    };

    hydrateState();

    const unsub = eventBus.subscribe("state:changed", () => {
      hydrateState();
    });

    return () => {
      unsub();
    };
  }, []);

  useEffect(() => {
    setLocalLearningEnabled(project?.brain.learningControl?.enabled ?? false);
  }, [project?.brain.learningControl?.enabled]);

  // Find current focus mission
  const focusMission = missionsState.missions.find(
    (m) => m.id === missionsState.focusMissionId
  ) || missionsState.missions[missionsState.missions.length - 1];

  // Derive ExplanationContractV1
  const contract: ExplanationContractV1 | null = focusMission
    ? deriveExplanation(focusMission, missionsState.globalMemory)
    : null;

  // Resolve decision helper
  const handleResolveDecision = (decisionId: string, choice: string) => {
    if (!contract) return;
    const s = stateService.getState();
    const currentState: BrainXMissionStateData = {
      programs: s[MISSION_STATE_KEYS.programs] ?? [],
      missions: s[MISSION_STATE_KEYS.missions] ?? [],
      focusMissionId: s[MISSION_STATE_KEYS.focusMissionId] ?? null,
      globalMemory: s[MISSION_STATE_KEYS.globalMemory] ?? [],
    };

    const updatedState = resolveDecision(currentState, contract.missionId, decisionId, choice);
    stateService.setState({
      [MISSION_STATE_KEYS.programs]: updatedState.programs,
      [MISSION_STATE_KEYS.missions]: updatedState.missions,
      [MISSION_STATE_KEYS.focusMissionId]: updatedState.focusMissionId,
      [MISSION_STATE_KEYS.globalMemory]: updatedState.globalMemory,
    });

    eventBus.publish("state:changed", stateService.getState());
  };

  // Switch focus mission
  const handleSelectMission = (missionId: string) => {
    stateService.setState({
      [MISSION_STATE_KEYS.focusMissionId]: missionId,
    });
    eventBus.publish("state:changed", stateService.getState());
  };

  // Phase 02: Generate creative plan via API client
  const handleGeneratePlan = async () => {
    if (intentInput.trim().length < 3) return;

    const authorityDecision = evaluateBrainXRuntimeAuthority("generatePlan");
    if (!authorityDecision.allowed) {
      const auditEvent = createBrainXAuthorityBlockedAuditEvent(authorityDecision);
      setAuthorityWarning(authorityDecision.message);
      recordWorkspaceAuditEvent(auditEvent);
      return;
    }

    setAuthorityWarning("");
    setIsPlanning(true);
    setIsOfflineNotice(false);
    setProposalAccepted(null);
    setOutcomeRating(null);
    setOutcomeFeedback("");
    setFeedbackSaved(false);

    const activeInfluence = learningAuthority.effectiveEnabled
      ? project?.brain.recommendationInfluenceProposals?.find((proposal) => proposal.applied)
      : undefined;
    const recommendationInfluences = activeInfluence?.proposedInfluences ?? [];
    const recommendationInfluenceSource = activeInfluence?.appliedAtUtc
      ? { proposalId: activeInfluence.id, appliedAtUtc: activeInfluence.appliedAtUtc }
      : undefined;
    const plan = await generateBrainPlan({
      intent: intentInput,
      recommendationInfluences,
      recommendationInfluenceSource,
    });
    setBrainPlan(plan);
    setIsPlanning(false);

    if (plan.provider.mode === "fallback") {
      setIsOfflineNotice(true);
    }

    // Promote intent received, plan generated, and provider called to Workspace
    recordWorkspaceAuditEvent(
      createWorkspaceIntentReceivedEvent({
        id: `audit_intent_${Math.random().toString(36).substring(2, 8)}`,
        studioId: "brain-x",
        title: "Brain X Intent Received",
        message: `Plan request received: "${intentInput}"`,
        timestamp: new Date().toISOString(),
      })
    );

    recordWorkspaceAuditEvent(
      createWorkspacePlanGeneratedEvent({
        id: `audit_plan_${Math.random().toString(36).substring(2, 8)}`,
        studioId: "brain-x",
        title: "Brain X Plan Generated",
        message: `Generated plan with ${plan.objectives.length} objectives: "${plan.summary}"`,
        timestamp: new Date().toISOString(),
        metadata: plan.recommendationInfluenceSource
          ? {
              recommendationInfluenceSource: plan.recommendationInfluenceSource,
              recommendationInfluences: plan.recommendationInfluences ?? [],
            }
          : undefined,
      })
    );

    recordWorkspaceAuditEvent(
      createWorkspaceProviderCalledEvent({
        id: `audit_provider_${Math.random().toString(36).substring(2, 8)}`,
        studioId: "brain-x",
        title: "Imagine X Provider Routed",
        message: `Routed to ${plan.provider.name} in ${plan.provider.mode} mode.`,
        timestamp: new Date().toISOString(),
      })
    );
  };

  const outcomeRecommendationInfluence = brainPlan?.recommendationInfluenceSource
    ? {
        proposalId: brainPlan.recommendationInfluenceSource.proposalId,
        appliedAtUtc: brainPlan.recommendationInfluenceSource.appliedAtUtc,
        influences: [...(brainPlan.recommendationInfluences ?? [])],
      }
    : null;

  // Phase 02: Accept/Reject proposal actions updating audit log
  const handleAcceptProposal = async () => {
    if (!brainPlan) return;

    const photoRoutes = brainPlan.routes.filter((route) => route.studio === "Photo Studio");
    let nextProject = project;
    let outputObjectCount = 0;
    if (photoRoutes.length > 0) {
      if (
        brainPlan.guardian.status !== "passed" ||
        brainPlan.proposal.requiresUserApproval !== true ||
        brainPlan.proposal.providerExecutionAllowed !== false
      ) {
        setAuthorityWarning("Photo route staging blocked because the proposal safety boundary did not pass.");
        return;
      }

      const routedTaskIds = new Set(photoRoutes.map((route) => route.taskId));
      const routedTasks = brainPlan.delegatedTasks.filter((task) => routedTaskIds.has(task.id));
      const photoPlan: PhotoPlanResponse = {
        intent: brainPlan.intent,
        category: "Imagine X delegated composition",
        aspectRatio: "1:1",
        canvasSize: { width: 1080, height: 1080 },
        aesthetic: "studio",
        lighting: "balanced",
        colorPalette: ["#0f172a", "#f8fafc"],
        backgroundStrategy: "Transparent-safe studio composition.",
        negativePrompt: "low quality, blurry, distorted",
        layerBreakdown: (routedTasks.length > 0 ? routedTasks : photoRoutes).map((item) => ({
          name: "title" in item ? item.title : "Photo composition",
          type: "image",
          description: "title" in item ? item.title : item.reason,
          blendMode: "normal",
          opacity: 1,
        })),
        recommendedAdjustments: {
          brightness: 0,
          contrast: 0,
          saturation: 0,
          blur: 0,
          hueRotate: 0,
          grayscale: 0,
        },
        audit: [],
        provider: { name: "imagine-x-photo", mode: "dry-run", status: "staged" },
      };
      const providerRequest = buildPhotoProviderRequestManifest(photoPlan);
      outputObjectCount = providerRequest.layers.length;
      const diagnostic = validatePhotoProviderRequestManifest(providerRequest)[0];
      const handler = getMockHandler("mock-photo-studio", "generatePhotoLayout");
      if (diagnostic || !handler) {
        setAuthorityWarning(diagnostic?.message ?? "Photo dry-run staging handler is unavailable.");
        return;
      }

      const result = await handler(
        { plan: photoPlan, providerRequest },
        { runtimeId: "mock-photo-studio", actionId: "generatePhotoLayout" }
      );
      if (!result.preview) {
        setAuthorityWarning("Photo dry-run staging did not return a review preview.");
        return;
      }

      const intake = intakeDryRunPreview({
        runtimeId: "mock-photo-studio",
        actionId: "generatePhotoLayout",
        preview: result.preview,
      });
      if (!intake.success) {
        setAuthorityWarning(intake.diagnostics[0]?.message ?? "Photo dry-run staging failed.");
        return;
      }

      if (project && onUpdateProject) {
        const intakeState = serializeCanvasPreviewState();
        nextProject = {
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
      }
    }

    if (nextProject && onUpdateProject) {
      onUpdateProject(recordImagineXProposalOutcome(nextProject, {
        proposalId: brainPlan.proposal.id,
        studioId: photoRoutes.length > 0 ? "photo" : "brain-x",
        intent: brainPlan.intent,
        providerRoutes: brainPlan.routes.map(({ studio, provider, mode }) => ({ studio, provider, mode })),
        status: "accepted",
        outputObjectCount,
        recommendationInfluence: outcomeRecommendationInfluence,
      }));
    }

    setAuthorityWarning("");
    setProposalAccepted(true);
    const acceptEvent: ReplayAuditEvent = {
      id: `audit_accept_${Math.random().toString(36).substring(2, 8)}`,
      type: "proposal_accepted",
      timestamp: new Date().toISOString(),
      title: "Creative Proposal Approved",
      description: "User approved the delegated creative plan structure and routing configurations."
    };
    setBrainPlan((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        audit: [...prev.audit, acceptEvent]
      };
    });

    recordWorkspaceAuditEvent(
      createWorkspaceProposalAcceptedEvent({
        id: acceptEvent.id,
        studioId: "brain-x",
        title: acceptEvent.title,
        message: acceptEvent.description || "",
        timestamp: acceptEvent.timestamp,
      })
    );
  };

  const handleRejectProposal = () => {
    if (!brainPlan) return;
    if (project && onUpdateProject) {
      const photoRouted = brainPlan.routes.some((route) => route.studio === "Photo Studio");
      onUpdateProject(recordImagineXProposalOutcome(project, {
        proposalId: brainPlan.proposal.id,
        studioId: photoRouted ? "photo" : "brain-x",
        intent: brainPlan.intent,
        providerRoutes: brainPlan.routes.map(({ studio, provider, mode }) => ({ studio, provider, mode })),
        status: "rejected",
        outputObjectCount: 0,
        recommendationInfluence: outcomeRecommendationInfluence,
      }));
    }
    setProposalAccepted(false);
    const rejectEvent: ReplayAuditEvent = {
      id: `audit_reject_${Math.random().toString(36).substring(2, 8)}`,
      type: "proposal_rejected",
      timestamp: new Date().toISOString(),
      title: "Creative Proposal Rejected",
      description: "User rejected the delegated creative plan structure."
    };
    setBrainPlan((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        audit: [...prev.audit, rejectEvent]
      };
    });

    recordWorkspaceAuditEvent(
      createWorkspaceProposalRejectedEvent({
        id: rejectEvent.id,
        studioId: "brain-x",
        title: rejectEvent.title,
        message: rejectEvent.description || "",
        timestamp: rejectEvent.timestamp,
      })
    );
  };

  const handleSaveOutcomeFeedback = () => {
    if (!brainPlan || !project || !onUpdateProject || outcomeRating === null) return;
    const updatedProject = recordImagineXOutcomeFeedback(project, {
      proposalId: brainPlan.proposal.id,
      rating: outcomeRating,
      feedback: outcomeFeedback,
    });
    if (updatedProject === project) {
      setAuthorityWarning("Outcome feedback could not be saved because its local outcome record was not found.");
      return;
    }
    setAuthorityWarning("");
    onUpdateProject(updatedProject);
    setFeedbackSaved(true);
  };

  const handleSaveLearningSetting = () => {
    if (!project || !onUpdateProject) return;
    onUpdateProject(setImagineXLocalLearningEnabled(project, localLearningEnabled));
  };

  const currentOutcome = brainPlan
    ? project?.brain.outcomes?.find((outcome) => outcome.proposalId === brainPlan.proposal.id)
    : undefined;
  const recommendationInfluenceProposals =
    project?.brain.recommendationInfluenceProposals ?? [];
  const latestRecommendationInfluence =
    recommendationInfluenceProposals[recommendationInfluenceProposals.length - 1];
  const influenceEvaluation = project
    ? summarizeImagineXInfluenceEvaluation(project)
    : null;
  const canPreviewPreference = Boolean(
    learningAuthority.effectiveEnabled &&
    currentOutcome?.status === "accepted" &&
    currentOutcome.rating !== null &&
    currentOutcome.rating >= 4 &&
    currentOutcome.feedback
  );

  const handlePreviewPreferenceCandidate = () => {
    if (!brainPlan || !project || !onUpdateProject) return;
    const updatedProject = previewImagineXPreferenceCandidate(
      project,
      brainPlan.proposal.id,
      learningAuthority,
    );
    if (updatedProject !== project) onUpdateProject(updatedProject);
  };

  const handleApprovePreferenceCandidate = (candidateId: string) => {
    if (!project || !onUpdateProject) return;
    const updatedProject = approveImagineXPreferenceCandidate(
      project,
      candidateId,
      learningAuthority,
    );
    if (updatedProject !== project) onUpdateProject(updatedProject);
  };

  const handleDeletePreferenceCandidate = (candidateId: string) => {
    if (!project || !onUpdateProject) return;
    onUpdateProject(deleteImagineXPreferenceCandidate(project, candidateId));
  };

  const handleExportPreferenceProfile = () => {
    if (!project) return;
    const blob = new Blob(
      [JSON.stringify(createImagineXPreferenceProfileExport(project), null, 2)],
      { type: "application/json" }
    );
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "axiom-preference-profile.json";
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const handleResetPreferenceProfile = () => {
    if (!project || !onUpdateProject) return;
    onUpdateProject(resetImagineXPreferenceProfile(project));
    setResetPreferencePending(false);
  };

  const handlePreviewRecommendationInfluence = () => {
    if (!project || !onUpdateProject) return;
    const updatedProject = previewImagineXRecommendationInfluence(project, learningAuthority);
    if (updatedProject !== project) onUpdateProject(updatedProject);
  };

  const handleDecideRecommendationInfluence = (decision: "approved" | "rejected") => {
    if (!project || !onUpdateProject || !latestRecommendationInfluence) return;
    const updatedProject = decideImagineXRecommendationInfluence(project, {
      proposalId: latestRecommendationInfluence.id,
      decision,
    }, learningAuthority);
    if (updatedProject !== project) onUpdateProject(updatedProject);
  };

  const handleApplyRecommendationInfluence = () => {
    if (!project || !onUpdateProject || !latestRecommendationInfluence) return;
    const updatedProject = applyImagineXRecommendationInfluence(
      project,
      latestRecommendationInfluence.id,
      learningAuthority,
    );
    if (updatedProject === project) return;
    const appliedProposal = updatedProject.brain.recommendationInfluenceProposals
      ?.find((proposal) => proposal.id === latestRecommendationInfluence.id);
    if (appliedProposal?.appliedAtUtc) {
      recordWorkspaceAuditEvent(
        createWorkspaceRecommendationInfluenceAppliedEvent({
          id: `audit_influence_apply_${Math.random().toString(36).substring(2, 8)}`,
          studioId: "brain-x",
          title: "Recommendation Influence Applied",
          message: "An explicitly approved local recommendation influence was activated.",
          timestamp: appliedProposal.appliedAtUtc,
          metadata: {
            proposalId: appliedProposal.id,
            influences: appliedProposal.proposedInfluences,
            appliedAtUtc: appliedProposal.appliedAtUtc,
          },
        })
      );
    }
    onUpdateProject(updatedProject);
  };

  const handleRollbackRecommendationInfluence = () => {
    if (!project || !onUpdateProject || !latestRecommendationInfluence) return;
    const updatedProject = rollbackImagineXRecommendationInfluence(
      project,
      latestRecommendationInfluence.id
    );
    if (updatedProject === project) return;
    const rolledBackProposal = updatedProject.brain.recommendationInfluenceProposals
      ?.find((proposal) => proposal.id === latestRecommendationInfluence.id);
    if (rolledBackProposal?.rolledBackAtUtc) {
      recordWorkspaceAuditEvent(
        createWorkspaceRecommendationInfluenceRolledBackEvent({
          id: `audit_influence_rollback_${Math.random().toString(36).substring(2, 8)}`,
          studioId: "brain-x",
          title: "Recommendation Influence Rolled Back",
          message: "The active local recommendation influence was rolled back.",
          timestamp: rolledBackProposal.rolledBackAtUtc,
          metadata: {
            proposalId: rolledBackProposal.id,
            influences: rolledBackProposal.proposedInfluences,
            appliedAtUtc: rolledBackProposal.appliedAtUtc ?? null,
            rolledBackAtUtc: rolledBackProposal.rolledBackAtUtc,
          },
        })
      );
    }
    onUpdateProject(updatedProject);
  };

  const handleRecordEvaluationDecision = () => {
    if (!project || !onUpdateProject || !latestRecommendationInfluence) return;
    const updatedProject = recordImagineXInfluenceEvaluationDecision(project, {
      proposalId: latestRecommendationInfluence.id,
      decision: evaluationDecision,
      rationale: evaluationRationale,
    });
    if (updatedProject !== project) onUpdateProject(updatedProject);
  };

  const handleDeleteEvaluationDecision = (decisionId: string) => {
    if (!project || !onUpdateProject) return;
    const updatedProject = deleteImagineXInfluenceEvaluationDecision(project, decisionId);
    if (updatedProject !== project) onUpdateProject(updatedProject);
  };

  // Phase 02: Blob-based browser download for project.axpkg.json
  const handleExportAXPKG = () => {
    if (!brainPlan) return;

    const authorityDecision = evaluateBrainXRuntimeAuthority("exportComposition");
    if (!authorityDecision.allowed) {
      const auditEvent = createBrainXAuthorityBlockedAuditEvent(authorityDecision);
      setAuthorityWarning(authorityDecision.message);
      recordWorkspaceAuditEvent(auditEvent);
      return;
    }

    setAuthorityWarning("");
    const exportEvent: ReplayAuditEvent = {
      id: `audit_export_${Math.random().toString(36).substring(2, 8)}`,
      type: "export_requested",
      timestamp: new Date().toISOString(),
      title: "Project Draft Exported",
      description: "Project manifest and audit log exported as project.axpkg.json."
    };
    const updatedPlan = {
      ...brainPlan,
      audit: [...brainPlan.audit, exportEvent]
    };
    setBrainPlan(updatedPlan);

    recordWorkspaceAuditEvent(
      createWorkspaceExportRequestedEvent({
        id: exportEvent.id,
        studioId: "brain-x",
        title: exportEvent.title,
        message: exportEvent.description || "",
        timestamp: exportEvent.timestamp,
      })
    );

    const payload = {
      format: "AXPKG",
      version: "0.1.0",
      project: {
        name: "Axiom Campaign Project",
        createdAt: new Date().toISOString()
      },
      intent: {
        raw: updatedPlan.intent,
        confidence: updatedPlan.confidence
      },
      brainPlan: {
        requestId: updatedPlan.requestId,
        summary: updatedPlan.summary,
        objectives: updatedPlan.objectives,
        delegatedTasks: updatedPlan.delegatedTasks,
        provider: updatedPlan.provider
      },
      auditTrail: getWorkspaceAuditEvents(),
      assets: []
    };

    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: "application/json",
    });

    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "project.axpkg.json";
    anchor.click();
    URL.revokeObjectURL(url);
  };

  // Derive telemetry snapshot via TelemetryEngineV1
  const telemetry = focusMission && contract
    ? deriveTelemetrySnapshotV1({
        activeMission: focusMission,
        missions: missionsState.missions,
        explanation: contract,
        timestamp: Date.now(),
      })
    : null;

  // Determine CLS color
  const getCLSColor = (score: number) => {
    if (score < 40) return "#10b981"; // green (calm)
    if (score < 75) return "#f59e0b"; // yellow
    return "#ef4444"; // red
  };

  const getHealthColor = (state: string) => {
    switch (state) {
      case "optimal": return "#10b981"; // green
      case "healthy": return "#818cf8"; // indigo/blue
      case "attention": return "#f59e0b"; // yellow/orange
      case "critical": return "#ef4444"; // red
      default: return "#94a3b8";
    }
  };

  return (
    <section
      className="studio-production-panel studio-production-panel--brain-x"
      aria-label="Brain X production workspace"
      data-design-language="axiom-pro-panel-v1"
    >
      <aside className="studio-panel-rail studio-panel-rail--planner brain-x-navigator" aria-label="Brain X mission navigator">
        <header className="brain-x-shell-heading">
          <span>Reasoning director</span>
          <h2><Brain size={18} aria-hidden="true" /> Brain X</h2>
          <p>Governed planning, delegation, evaluation, and explainable mission control.</p>
        </header>
        <section className="brain-x-shell-card">
          <span>Mission context</span>
          <dl>
            <div><dt>Programs</dt><dd>{missionsState.programs.length}</dd></div>
            <div><dt>Missions</dt><dd>{missionsState.missions.length}</dd></div>
            <div><dt>Focus</dt><dd>{contract?.title ?? "Intent intake"}</dd></div>
            <div><dt>Status</dt><dd>{contract?.status ?? "Ready"}</dd></div>
          </dl>
        </section>
        <section className="brain-x-shell-card brain-x-boundary">
          <span>Execution boundary</span>
          <p><strong>Human approval required.</strong> Brain X proposes and routes work; provider execution remains blocked until explicitly authorized.</p>
        </section>
      </aside>

      <section className="studio-panel-canvas brain-x-canvas" aria-label="Brain X reasoning canvas">
      
      {/* ── AXIOM BRAIN INTENT PLANNER INTAKE ── */}
      <div style={{ display: "flex", flexDirection: "column", gap: "10px", padding: "16px", background: "rgba(99, 102, 241, 0.05)", borderRadius: "12px", border: "1px solid rgba(99, 102, 241, 0.15)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <Brain style={{ color: "#a5b4fc" }} size={16} />
          <span style={{ fontSize: "11px", fontWeight: 700, color: "#a5b4fc", textTransform: "uppercase", letterSpacing: "0.05em" }}>
            Axiom Brain Intake
          </span>
        </div>
        {authorityWarning && (
          <div role="alert" style={{ padding: "8px", borderRadius: "6px", background: "rgba(239, 68, 68, 0.12)", border: "1px solid rgba(239, 68, 68, 0.28)", color: "#fecaca", fontSize: "11px", lineHeight: 1.35 }}>
            {authorityWarning}
          </div>
        )}
        <div style={{ display: "flex", gap: "8px" }}>
          <input
            type="text"
            placeholder="Enter creative intent (e.g. 'Create Luxury Perfume Poster')..."
            value={intentInput}
            onChange={(e) => setIntentInput(e.target.value)}
            style={{ flex: 1, padding: "8px 12px", background: "#0b0f19", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "6px", color: "#f8fafc", fontSize: "13px" }}
          />
          <button
            onClick={handleGeneratePlan}
            disabled={isPlanning || intentInput.trim().length < 3}
            style={{ padding: "8px 16px", background: "#4f46e5", border: "none", borderRadius: "6px", color: "#fff", fontWeight: 600, fontSize: "13px", cursor: "pointer", opacity: (isPlanning || intentInput.trim().length < 3) ? 0.5 : 1 }}
          >
            {isPlanning ? "Planning..." : "Generate Plan"}
          </button>
        </div>
        {isOfflineNotice && (
          <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "#f59e0b", fontSize: "11px" }}>
            <AlertCircle size={12} />
            <span>Backend offline — using the local fallback planner.</span>
          </div>
        )}
      </div>

      {/* ── GENERATED BRAIN PLAN CONSOLE ── */}
      {brainPlan && (
        <div style={{ display: "flex", flexDirection: "column", gap: "12px", padding: "16px", background: "rgba(15, 23, 42, 0.6)", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.06)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "11px", color: "#94a3b8", fontFamily: "monospace" }}>
              REQ_ID: {brainPlan.requestId}
            </span>
            <span style={{ fontSize: "11px", color: "#818cf8", fontWeight: 700 }}>
              Confidence: {Math.round(brainPlan.confidence * 100)}%
            </span>
          </div>

          <div>
            <h3 style={{ margin: 0, fontSize: "14px", fontWeight: 600, color: "#f8fafc" }}>
              {brainPlan.summary}
            </h3>
          </div>

          {brainPlan.recommendationInfluences &&
            brainPlan.recommendationInfluences.length > 0 && (
              <div style={{ display: "grid", gap: "4px", padding: "8px", background: "rgba(129,140,248,0.08)", borderRadius: "6px" }}>
                {brainPlan.recommendationInfluences.map((influence) => (
                  <span key={influence} style={{ color: "#c4b5fd", fontSize: "11px" }}>
                    Applied local influence: {influence}
                  </span>
                ))}
                {brainPlan.recommendationInfluenceSource && (
                  <span style={{ color: "#94a3b8", fontSize: "10px" }}>
                    Influence source: {brainPlan.recommendationInfluenceSource.proposalId} · applied {brainPlan.recommendationInfluenceSource.appliedAtUtc}
                  </span>
                )}
                <span style={{ color: "#94a3b8", fontSize: "10px" }}>Provider routes unchanged.</span>
              </div>
            )}

          {/* Objectives */}
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <span style={{ fontSize: "10px", color: "#64748b", fontWeight: 700, textTransform: "uppercase" }}>PLAN OBJECTIVES</span>
            {brainPlan.objectives.map((obj) => (
              <div key={obj.id} style={{ display: "flex", gap: "8px", fontSize: "12px" }}>
                <Check size={14} style={{ color: "#10b981", marginTop: "2px" }} />
                <div>
                  <strong style={{ color: "#cbd5e1" }}>{obj.title}</strong>
                  <p style={{ margin: "2px 0 0", color: "#64748b" }}>{obj.description}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Delegated Tasks */}
          <div style={{ display: "flex", flexDirection: "column", gap: "6px", borderTop: "1px solid rgba(255,255,255,0.05)", paddingTop: "10px" }}>
            <span style={{ fontSize: "10px", color: "#64748b", fontWeight: 700, textTransform: "uppercase" }}>DELEGATED TASKS</span>
            {brainPlan.delegatedTasks.map((task) => (
              <div key={task.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "rgba(255,255,255,0.02)", padding: "8px", borderRadius: "6px" }}>
                <div style={{ fontSize: "12px" }}>
                  <strong style={{ color: "#cbd5e1" }}>{task.title}</strong>
                  <span style={{ marginLeft: "8px", color: "#818cf8", fontSize: "10px" }}>({task.studio})</span>
                </div>
                <span style={{
                  fontSize: "9px",
                  padding: "1px 5px",
                  borderRadius: "3px",
                  background: task.priority === "high" ? "rgba(239,68,68,0.1)" : "rgba(245,158,11,0.1)",
                  color: task.priority === "high" ? "#ef4444" : "#f59e0b"
                }}>
                  {task.priority.toUpperCase()}
                </span>
              </div>
            ))}
          </div>

          <section
            aria-label="Imagine X plan governance"
            style={{ display: "grid", gap: "8px", borderTop: "1px solid rgba(255,255,255,0.05)", paddingTop: "10px", fontSize: "11px" }}
          >
            <span style={{ color: "#64748b", fontSize: "10px", fontWeight: 700 }}>STUDIO ROUTES</span>
            {brainPlan.routes.map((route) => (
              <div key={route.taskId} style={{ display: "grid", gap: "2px" }}>
                <strong style={{ color: "#a5b4fc" }}>{route.studio} · {route.mode}</strong>
                <span style={{ color: "#94a3b8" }}>{route.reason}</span>
              </div>
            ))}
            <div role="status" style={{ display: "grid", gap: "2px", padding: "8px", background: "rgba(16,185,129,0.08)", borderRadius: "6px" }}>
              <strong style={{ color: "#34d399" }}>Guardian: {brainPlan.guardian.status}</strong>
              <span style={{ color: "#cbd5e1" }}>{brainPlan.guardian.summary}</span>
              {brainPlan.guardian.checks.map((check) => (
                <span key={check.id} style={{ color: "#94a3b8" }}>{check.message}</span>
              ))}
            </div>
            <strong style={{ color: "#fbbf24" }}>
              Approval required · provider execution blocked
            </strong>
          </section>

          {/* Actions */}
          <div style={{ display: "flex", justifyItems: "center", gap: "8px", borderTop: "1px solid rgba(255,255,255,0.05)", paddingTop: "10px" }}>
            {proposalAccepted === null ? (
              <>
                <button
                  onClick={handleAcceptProposal}
                  style={{ flex: 1, padding: "8px", background: "rgba(16, 185, 129, 0.2)", border: "1px solid rgba(16,185,129,0.3)", borderRadius: "6px", color: "#34d399", fontWeight: 600, fontSize: "12px", cursor: "pointer" }}
                >
                  Accept Proposal
                </button>
                <button
                  onClick={handleRejectProposal}
                  style={{ flex: 1, padding: "8px", background: "rgba(239, 68, 68, 0.2)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: "6px", color: "#f87171", fontWeight: 600, fontSize: "12px", cursor: "pointer" }}
                >
                  Reject Proposal
                </button>
              </>
            ) : (
              <div style={{ flex: 1, textAlign: "center", fontSize: "12px", fontWeight: 600, color: proposalAccepted ? "#34d399" : "#f87171", padding: "8px", background: "rgba(255,255,255,0.02)", borderRadius: "6px" }}>
                {proposalAccepted ? "✓ Proposal Approved" : "✗ Proposal Rejected"}
              </div>
            )}
            <button
              onClick={handleExportAXPKG}
              style={{ padding: "8px 12px", background: "rgba(251, 191, 36, 0.2)", border: "1px solid rgba(251,191,36,0.3)", borderRadius: "6px", color: "#fbbf24", cursor: "pointer", display: "flex", alignItems: "center", gap: "6px" }}
            >
              <Download size={14} />
              Export
            </button>
          </div>

          {proposalAccepted !== null && (
            <section style={{ display: "flex", flexDirection: "column", gap: "8px", borderTop: "1px solid rgba(255,255,255,0.05)", paddingTop: "10px" }}>
              <strong style={{ color: "#cbd5e1", fontSize: "12px" }}>Outcome feedback</strong>
              <label style={{ display: "flex", flexDirection: "column", gap: "4px", color: "#94a3b8", fontSize: "11px" }}>
                Outcome rating
                <select
                  aria-label="Outcome rating"
                  value={outcomeRating ?? ""}
                  onChange={(event) => {
                    setOutcomeRating(event.target.value ? Number(event.target.value) : null);
                    setFeedbackSaved(false);
                  }}
                  style={{ background: "#0b0f19", color: "#f8fafc", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "6px", padding: "6px" }}
                >
                  <option value="">Select rating</option>
                  {[1, 2, 3, 4, 5].map((rating) => (
                    <option key={rating} value={rating}>{rating} / 5</option>
                  ))}
                </select>
              </label>
              <label style={{ display: "flex", flexDirection: "column", gap: "4px", color: "#94a3b8", fontSize: "11px" }}>
                Outcome feedback
                <textarea
                  aria-label="Outcome feedback"
                  maxLength={1000}
                  value={outcomeFeedback}
                  onChange={(event) => {
                    setOutcomeFeedback(event.target.value);
                    setFeedbackSaved(false);
                  }}
                  placeholder="Optional feedback"
                  style={{ background: "#0b0f19", color: "#f8fafc", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "6px", padding: "6px", minHeight: "56px" }}
                />
              </label>
              <button
                onClick={handleSaveOutcomeFeedback}
                disabled={outcomeRating === null || !project || !onUpdateProject}
                style={{ padding: "7px", background: "#4f46e5", border: 0, borderRadius: "6px", color: "#fff", cursor: outcomeRating === null ? "not-allowed" : "pointer", opacity: outcomeRating === null ? 0.5 : 1 }}
              >
                Save Outcome Feedback
              </button>
              {feedbackSaved && outcomeRating !== null && (
                <strong style={{ color: "#34d399", fontSize: "11px" }}>Saved rating: {outcomeRating}/5</strong>
              )}
              <span style={{ color: "#94a3b8", fontSize: "10px" }}>Learning remains disabled for this outcome.</span>
              <label style={{ display: "flex", alignItems: "center", gap: "6px", color: "#cbd5e1", fontSize: "11px" }}>
                <input
                  type="checkbox"
                  checked={localLearningEnabled}
                  onChange={(event) => setLocalLearningEnabled(event.target.checked)}
                />
                Allow local-only learning for this project
              </label>
              <button
                onClick={handleSaveLearningSetting}
                disabled={!project || !onUpdateProject}
                style={{ padding: "7px", background: "#334155", border: 0, borderRadius: "6px", color: "#fff", cursor: "pointer" }}
              >
                Save Learning Setting
              </button>
              <span style={{ color: "#94a3b8", fontSize: "10px" }}>
                {project?.brain.learningControl?.enabled
                  ? "Local learning: enabled for this project only."
                  : "Local learning: disabled."}
              </span>
              <button
                onClick={handlePreviewPreferenceCandidate}
                disabled={!canPreviewPreference}
                style={{ padding: "7px", background: "#475569", border: 0, borderRadius: "6px", color: "#fff", cursor: canPreviewPreference ? "pointer" : "not-allowed", opacity: canPreviewPreference ? 1 : 0.5 }}
              >
                Preview Preference Candidate
              </button>
            </section>
          )}
        </div>
      )}

      {project && (
        <section
          aria-label="Local preference profile"
          style={{ display: "grid", gap: "8px", padding: "12px", border: "1px solid rgba(129,140,248,0.2)", borderRadius: "8px" }}
        >
          <strong style={{ color: "#a5b4fc", fontSize: "12px" }}>Local preference profile</strong>
          <section
            aria-label="Learning authority"
            style={{ display: "grid", gap: "2px", padding: "8px", background: "rgba(129,140,248,0.06)", borderRadius: "6px" }}
          >
            <span style={{ color: "#cbd5e1", fontSize: "10px" }}>
              Requested: {learningAuthority.requestedEnabled ? "enabled" : "disabled"} · {learningAuthority.scope}
            </span>
            <span style={{ color: learningAuthority.effectiveEnabled ? "#86efac" : "#fca5a5", fontSize: "10px" }}>
              Effective: {learningAuthority.effectiveEnabled ? "enabled" : "blocked"}
            </span>
            <span style={{ color: "#94a3b8", fontSize: "10px" }}>
              Policy source: {learningAuthority.source}
            </span>
            <span style={{ color: "#64748b", fontSize: "10px" }}>{learningAuthority.reason}</span>
          </section>
          <span style={{ color: "#94a3b8", fontSize: "10px" }}>
            {(project.brain.preferenceCandidates ?? []).length} saved candidate{(project.brain.preferenceCandidates ?? []).length === 1 ? "" : "s"}
          </span>
          {influenceEvaluation && (
            <section
              aria-label="Influence evaluation"
              style={{ display: "grid", gap: "3px", padding: "8px", background: "rgba(129,140,248,0.06)", borderRadius: "6px" }}
            >
              <span style={{ color: "#cbd5e1", fontSize: "10px" }}>
                Baseline: {influenceEvaluation.baseline.ratedOutcomeCount} rated · {influenceEvaluation.baseline.averageRating === null ? "—" : influenceEvaluation.baseline.averageRating.toFixed(1)} average
              </span>
              <span style={{ color: "#cbd5e1", fontSize: "10px" }}>
                Influenced: {influenceEvaluation.influenced.ratedOutcomeCount} rated · {influenceEvaluation.influenced.averageRating === null ? "—" : influenceEvaluation.influenced.averageRating.toFixed(1)} average
              </span>
              <span style={{ color: "#94a3b8", fontSize: "10px" }}>
                Baseline ratings 1→5: {influenceEvaluation.baseline.ratingDistribution.join(" / ")}
              </span>
              <span style={{ color: "#94a3b8", fontSize: "10px" }}>
                Influenced ratings 1→5: {influenceEvaluation.influenced.ratingDistribution.join(" / ")}
              </span>
              {influenceEvaluation.observedDifference !== null && (
                <span style={{ color: "#c4b5fd", fontSize: "10px" }}>
                  Observed difference: {influenceEvaluation.observedDifference >= 0 ? "+" : ""}{influenceEvaluation.observedDifference.toFixed(1)}
                </span>
              )}
              {influenceEvaluation.byInfluenceProposal.map((proposal) => (
                <div key={proposal.proposalId} style={{ display: "grid", gap: "2px", paddingTop: "3px" }}>
                  <span style={{ color: "#a5b4fc", fontSize: "10px" }}>
                    {proposal.proposalId}: {proposal.ratedOutcomeCount} rated · {proposal.averageRating?.toFixed(1)} average
                  </span>
                  <span style={{ color: "#94a3b8", fontSize: "10px" }}>
                    {proposal.influences.join(", ")}
                  </span>
                  <span style={{ color: "#64748b", fontSize: "10px" }}>
                    Proposal ratings 1→5: {proposal.ratingDistribution.join(" / ")}
                  </span>
                </div>
              ))}
              <span style={{ color: "#64748b", fontSize: "10px" }}>Descriptive only · no preference changes</span>
              {latestRecommendationInfluence &&
                influenceEvaluation.byInfluenceProposal.some(
                  (item) => item.proposalId === latestRecommendationInfluence.id
                ) && (
                  project.brain.influenceEvaluationDecisions?.find(
                    (record) => record.proposalId === latestRecommendationInfluence.id
                  ) ? (
                    <span style={{ color: "#a5b4fc", fontSize: "10px" }}>
                      Recorded: {project.brain.influenceEvaluationDecisions.find(
                        (record) => record.proposalId === latestRecommendationInfluence.id
                      )?.decision} · no action executed
                    </span>
                  ) : (
                    <div style={{ display: "grid", gap: "4px", paddingTop: "4px" }}>
                      <select
                        aria-label="Evaluation decision"
                        value={evaluationDecision}
                        onChange={(event) => setEvaluationDecision(event.target.value as typeof evaluationDecision)}
                      >
                        <option value="inconclusive">Inconclusive</option>
                        <option value="keep">Keep</option>
                        <option value="rollback">Rollback</option>
                      </select>
                      <input
                        aria-label="Evaluation rationale"
                        value={evaluationRationale}
                        maxLength={1000}
                        onChange={(event) => setEvaluationRationale(event.target.value)}
                        placeholder="Optional rationale"
                      />
                      <button onClick={handleRecordEvaluationDecision}>
                        Record Evaluation Decision
                      </button>
                    </div>
                  )
                )}
            </section>
          )}
          {(project.brain.influenceEvaluationDecisions ?? []).length > 0 && (
            <section
              aria-label="Evaluation decision history"
              style={{ display: "grid", gap: "6px", padding: "8px", border: "1px solid rgba(129,140,248,0.2)", borderRadius: "6px" }}
            >
              <strong style={{ color: "#a5b4fc", fontSize: "11px" }}>Evaluation decision history</strong>
              {(project.brain.influenceEvaluationDecisions ?? []).map((record) => {
                const proposalEvidence = record.evidence.byInfluenceProposal.find(
                  (item) => item.proposalId === record.proposalId
                );
                return (
                  <div key={record.id} style={{ display: "grid", gap: "2px", padding: "6px", background: "rgba(255,255,255,0.02)", borderRadius: "4px" }}>
                    <span style={{ color: "#e2e8f0", fontSize: "10px" }}>{record.proposalId}</span>
                    <span style={{ color: "#c4b5fd", fontSize: "10px" }}>{record.decision} · {record.recordedAtUtc}</span>
                    {record.rationale && <span style={{ color: "#94a3b8", fontSize: "10px" }}>{record.rationale}</span>}
                    <span style={{ color: "#64748b", fontSize: "10px" }}>
                      Frozen evidence · baseline {record.evidence.baseline.ratedOutcomeCount} rated / {record.evidence.baseline.averageRating ?? "—"} average · influenced {record.evidence.influenced.ratedOutcomeCount} rated / {record.evidence.influenced.averageRating ?? "—"} average
                    </span>
                    {proposalEvidence && (
                      <span style={{ color: "#64748b", fontSize: "10px" }}>
                        Proposal ratings 1→5: {proposalEvidence.ratingDistribution.join(" / ")}
                      </span>
                    )}
                    <button
                      aria-label={`Delete Evaluation Decision: ${record.proposalId}`}
                      onClick={() => handleDeleteEvaluationDecision(record.id)}
                      style={{ padding: "6px", background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: "6px", color: "#fca5a5", cursor: "pointer" }}
                    >
                      Delete Evaluation Decision
                    </button>
                  </div>
                );
              })}
            </section>
          )}
          {(project.brain.preferenceCandidates ?? []).length === 0 ? (
            <span style={{ color: "#64748b", fontSize: "11px" }}>No preference candidates.</span>
          ) : (
            (project.brain.preferenceCandidates ?? []).map((candidate) => (
              <div key={candidate.id} style={{ display: "grid", gap: "4px", padding: "8px", background: "rgba(255,255,255,0.02)", borderRadius: "6px" }}>
                <span style={{ color: "#e2e8f0", fontSize: "11px" }}>{candidate.proposedPreference}</span>
                <span style={{ color: "#94a3b8", fontSize: "10px" }}>{candidate.explanation}</span>
                <span style={{ color: "#fbbf24", fontSize: "10px" }}>
                  {candidate.status === "approved"
                    ? "Approved · still not applied"
                    : "Pending explicit approval · not applied"}
                </span>
                {candidate.status === "pending_review" && (
                  <button
                    aria-label={`Approve Preference Candidate: ${candidate.proposedPreference}`}
                    onClick={() => handleApprovePreferenceCandidate(candidate.id)}
                    disabled={!learningAuthority.effectiveEnabled}
                    style={{ padding: "7px", background: "#4f46e5", border: 0, borderRadius: "6px", color: "#fff", cursor: "pointer" }}
                  >
                    Approve Preference Candidate
                  </button>
                )}
                <button
                  aria-label={`Delete Preference Candidate: ${candidate.proposedPreference}`}
                  onClick={() => handleDeletePreferenceCandidate(candidate.id)}
                  style={{ padding: "7px", background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: "6px", color: "#fca5a5", cursor: "pointer" }}
                >
                  Delete Preference Candidate
                </button>
              </div>
            ))
          )}
          <button
            onClick={handlePreviewRecommendationInfluence}
            disabled={
              !learningAuthority.effectiveEnabled ||
              !(project.brain.preferenceCandidates ?? []).some(
                (candidate) => candidate.status === "approved"
              )
            }
            style={{ padding: "7px", background: "#475569", border: 0, borderRadius: "6px", color: "#fff", cursor: "pointer" }}
          >
            Preview Recommendation Influence
          </button>
          {latestRecommendationInfluence && (
            <div style={{ display: "grid", gap: "4px", padding: "8px", border: "1px solid rgba(251,191,36,0.25)", borderRadius: "6px" }}>
              <strong style={{ color: "#fbbf24", fontSize: "11px" }}>Recommendation influence preview</strong>
              {latestRecommendationInfluence.proposedInfluences.map((influence) => (
                <span key={influence} style={{ color: "#e2e8f0", fontSize: "11px" }}>{influence}</span>
              ))}
              <span style={{ color: "#94a3b8", fontSize: "10px" }}>
                Before: {latestRecommendationInfluence.recommendationDiff?.before.join(", ") || "No preference influence applied"}
              </span>
              <span style={{ color: "#c4b5fd", fontSize: "10px" }}>
                After preview: {(latestRecommendationInfluence.recommendationDiff?.after ?? latestRecommendationInfluence.proposedInfluences).join(", ")}
              </span>
              <span style={{ color: "#94a3b8", fontSize: "10px" }}>{latestRecommendationInfluence.explanation}</span>
              <span style={{ color: "#fbbf24", fontSize: "10px" }}>
                {latestRecommendationInfluence.applied
                  ? "Applied to local recommendations"
                  : latestRecommendationInfluence.rolledBackAtUtc
                    ? "Rolled back · not applied"
                  : latestRecommendationInfluence.status === "approved"
                    ? "Approved · still not applied"
                  : latestRecommendationInfluence.status === "rejected"
                    ? "Rejected · not applied"
                    : "Pending review · no recommendation changed"}
              </span>
              {latestRecommendationInfluence.status === "pending_review" && (
                <div style={{ display: "flex", gap: "6px" }}>
                  <button
                    onClick={() => handleDecideRecommendationInfluence("approved")}
                    disabled={
                      !learningAuthority.effectiveEnabled
                    }
                    style={{ flex: 1, padding: "7px", background: "#4f46e5", border: 0, borderRadius: "6px", color: "#fff", cursor: "pointer" }}
                  >
                    Approve Influence Preview
                  </button>
                  <button
                    onClick={() => handleDecideRecommendationInfluence("rejected")}
                    style={{ flex: 1, padding: "7px", background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: "6px", color: "#fca5a5", cursor: "pointer" }}
                  >
                    Reject Influence Preview
                  </button>
                </div>
              )}
              {latestRecommendationInfluence.status === "approved" &&
                !latestRecommendationInfluence.applied && (
                  <button
                    onClick={handleApplyRecommendationInfluence}
                    disabled={
                      !learningAuthority.effectiveEnabled ||
                      recommendationInfluenceProposals.some((proposal) => proposal.applied)
                    }
                    style={{ padding: "7px", background: "#4f46e5", border: 0, borderRadius: "6px", color: "#fff", cursor: "pointer" }}
                  >
                    Apply Influence Locally
                  </button>
                )}
              {latestRecommendationInfluence.applied && (
                <button
                  onClick={handleRollbackRecommendationInfluence}
                  style={{ padding: "7px", background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: "6px", color: "#fca5a5", cursor: "pointer" }}
                >
                  Rollback Influence
                </button>
              )}
            </div>
          )}
          <button
            onClick={handleExportPreferenceProfile}
            style={{ padding: "7px", background: "#334155", border: 0, borderRadius: "6px", color: "#fff", cursor: "pointer" }}
          >
            Export Preference Profile
          </button>
          {!resetPreferencePending ? (
            <button
              onClick={() => setResetPreferencePending(true)}
              disabled={(project.brain.preferenceCandidates ?? []).length === 0}
              style={{ padding: "7px", background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: "6px", color: "#fca5a5", cursor: "pointer" }}
            >
              Reset Preference Profile
            </button>
          ) : (
            <div style={{ display: "grid", gap: "6px" }}>
              <span style={{ color: "#fca5a5", fontSize: "10px" }}>Reset removes every saved preference candidate.</span>
              <button
                onClick={handleResetPreferenceProfile}
                style={{ padding: "7px", background: "#b91c1c", border: 0, borderRadius: "6px", color: "#fff", cursor: "pointer" }}
              >
                Confirm Reset Preference Profile
              </button>
              <button onClick={() => setResetPreferencePending(false)}>Cancel</button>
            </div>
          )}
        </section>
      )}

      {/* ── REPLAY AUDIT PANEL ── */}
      {brainPlan && (
        <ReplayAuditPanel events={brainPlan.audit} />
      )}

      {/* ── HEADER & TELEMETRY PANEL ── */}
      {contract && telemetry && (
        <div style={{ display: "flex", flexDirection: "column", gap: "12px", padding: "16px", background: "rgba(30, 27, 75, 0.2)", borderRadius: "12px", border: "1px solid rgba(99, 102, 241, 0.15)", backdropFilter: "blur(8px)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <Brain style={{ color: "#818cf8" }} size={20} />
                <h1 style={{ margin: 0, fontSize: "16px", fontWeight: 700, letterSpacing: "0.05em", color: "#f8fafc", textTransform: "uppercase" }}>
                  Brain X Control Panel
                </h1>
                <span style={{
                  padding: "2px 8px",
                  fontSize: "10px",
                  fontWeight: 700,
                  textTransform: "uppercase",
                  borderRadius: "12px",
                  background: getHealthColor(telemetry.derivedState.healthState) + "20",
                  color: getHealthColor(telemetry.derivedState.healthState),
                  border: `1px solid ${getHealthColor(telemetry.derivedState.healthState)}40`,
                  marginLeft: "8px"
                }}>
                  {telemetry.derivedState.healthState}
                </span>
              </div>
              <p style={{ margin: "4px 0 0", fontSize: "12px", color: "#94a3b8" }}>
                Mission: <span style={{ color: "#a5b4fc", fontWeight: 600 }}>{contract.title}</span>
              </p>
            </div>

            {/* Mission Selector */}
            <div style={{ display: "flex", gap: "6px" }}>
              {missionsState.missions.map((m) => (
                <button
                  key={m.id}
                  onClick={() => handleSelectMission(m.id)}
                  style={{
                    padding: "4px 8px",
                    fontSize: "10px",
                    fontFamily: "monospace",
                    background: m.id === contract.missionId ? "rgba(99, 102, 241, 0.25)" : "rgba(255, 255, 255, 0.02)",
                    color: m.id === contract.missionId ? "#c7d2fe" : "#64748b",
                    border: `1px solid ${m.id === contract.missionId ? "rgba(99, 102, 241, 0.4)" : "rgba(255, 255, 255, 0.05)"}`,
                    borderRadius: "4px",
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                  }}
                >
                  {m.title.slice(0, 10)}...
                </button>
              ))}
            </div>
          </div>

          {/* Predictability Indicator & Metrics */}
          <div style={{ display: "grid", gridTemplateColumns: "1.1fr 0.8fr 0.8fr 0.8fr 0.8fr", gap: "16px", borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: "12px" }}>
            {/* Predictability */}
            <div>
              <span style={{ fontSize: "10px", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em", display: "block" }}>
                Predictability Indicator
              </span>
              <div style={{ display: "flex", alignItems: "flex-start", gap: "8px", marginTop: "4px" }}>
                <TrendingUp size={16} style={{ color: "#818cf8", marginTop: "2px" }} />
                <div>
                  <p style={{ margin: 0, fontSize: "12px", fontWeight: 600, color: "#f1f5f9" }}>
                    {contract.predictability.predictedNextAction}
                  </p>
                  <p style={{ margin: "2px 0 0", fontSize: "11px", color: "#64748b" }}>
                    {contract.predictability.rationale}
                  </p>
                </div>
              </div>
            </div>

            {/* Cognitive Transparency Score (CTS) */}
            <div style={{ borderLeft: "1px solid rgba(255,255,255,0.06)", paddingLeft: "16px" }}>
              <span style={{ fontSize: "10px", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em", display: "block" }}>
                Cognitive Transparency (CTS)
              </span>
              <div style={{ display: "flex", alignItems: "baseline", gap: "4px", marginTop: "4px" }}>
                <span style={{ fontSize: "20px", fontWeight: 700, color: "#818cf8" }}>{telemetry.productMetrics.cts}%</span>
                <span style={{ fontSize: "10px", color: "#64748b" }}>predictability</span>
              </div>
              <div style={{ height: "4px", background: "rgba(255,255,255,0.05)", borderRadius: "2px", marginTop: "6px", overflow: "hidden" }}>
                <div style={{ width: `${telemetry.productMetrics.cts}%`, height: "100%", background: "#818cf8", borderRadius: "2px" }} />
              </div>
            </div>

            {/* Cognitive Load Score (CLS) */}
            <div style={{ borderLeft: "1px solid rgba(255,255,255,0.06)", paddingLeft: "16px" }}>
              <span style={{ fontSize: "10px", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em", display: "block" }}>
                Cognitive Load Score (CLS)
              </span>
              <div style={{ display: "flex", alignItems: "baseline", gap: "4px", marginTop: "4px" }}>
                <span style={{ fontSize: "20px", fontWeight: 700, color: getCLSColor(telemetry.productMetrics.cls) }}>{telemetry.productMetrics.cls}%</span>
                <span style={{ fontSize: "10px", color: "#64748b" }}>{telemetry.derivedState.cognitiveLoadLevel}</span>
              </div>
              <div style={{ height: "4px", background: "rgba(255,255,255,0.05)", borderRadius: "2px", marginTop: "6px", overflow: "hidden" }}>
                <div style={{ width: `${telemetry.productMetrics.cls}%`, height: "100%", background: getCLSColor(telemetry.productMetrics.cls), borderRadius: "2px" }} />
              </div>
            </div>

            {/* Model Consistency Score (MCS) */}
            <div style={{ borderLeft: "1px solid rgba(255,255,255,0.06)", paddingLeft: "16px" }}>
              <span style={{ fontSize: "10px", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em", display: "block" }}>
                Model Consistency (MCS)
              </span>
              <div style={{ display: "flex", alignItems: "baseline", gap: "4px", marginTop: "4px" }}>
                <span style={{ fontSize: "20px", fontWeight: 700, color: "#10b981" }}>{telemetry.productMetrics.mcs}%</span>
                <span style={{ fontSize: "10px", color: "#64748b" }}>stability</span>
              </div>
              <div style={{ height: "4px", background: "rgba(255,255,255,0.05)", borderRadius: "2px", marginTop: "6px", overflow: "hidden" }}>
                <div style={{ width: `${telemetry.productMetrics.mcs}%`, height: "100%", background: "#10b981", borderRadius: "2px" }} />
              </div>
            </div>

            {/* Explanation Efficiency Score (EES) */}
            <div style={{ borderLeft: "1px solid rgba(255,255,255,0.06)", paddingLeft: "16px" }}>
              <span style={{ fontSize: "10px", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em", display: "block" }}>
                Explanation Efficiency (EES)
              </span>
              <div style={{ display: "flex", alignItems: "baseline", gap: "4px", marginTop: "4px" }}>
                <span style={{ fontSize: "20px", fontWeight: 700, color: "#6366f1" }}>{telemetry.productMetrics.ees}%</span>
                <span style={{ fontSize: "10px", color: "#64748b" }}>efficiency</span>
              </div>
              <div style={{ height: "4px", background: "rgba(255,255,255,0.05)", borderRadius: "2px", marginTop: "6px", overflow: "hidden" }}>
                <div style={{ width: `${telemetry.productMetrics.ees}%`, height: "100%", background: "#6366f1", borderRadius: "2px" }} />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── ACTIVE JUDGMENT CONSOLE (Decision Blocking) ── */}
      {contract && contract.activeDecision && (
        <div style={{ display: "flex", flexDirection: "column", gap: "12px", padding: "16px", background: "rgba(245, 158, 11, 0.08)", borderRadius: "10px", border: "1px solid rgba(245, 158, 11, 0.3)", animation: "pulse 2s infinite" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#f59e0b" }}>
            <AlertTriangle size={18} />
            <span style={{ fontSize: "12px", fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase" }}>
              Judgment Console // User Resolution Required
            </span>
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: "14px", fontWeight: 600, color: "#f8fafc" }}>
              {contract.activeDecision.question}
            </h3>
            <p style={{ margin: "6px 0 0", fontSize: "12px", color: "#d97706", display: "flex", gap: "4px", alignItems: "center" }}>
              <strong>Brain X Recommendation:</strong> {contract.activeDecision.recommendation} ({Math.round(contract.activeDecision.confidence * 100)}% confidence)
            </p>
            <p style={{ margin: "4px 0 0", fontSize: "11px", color: "#94a3b8", fontStyle: "italic" }}>
              "{contract.activeDecision.rationale}"
            </p>
          </div>

          <div style={{ display: "flex", gap: "8px", marginTop: "4px" }}>
            {contract.activeDecision.options.map((opt) => (
              <button
                key={opt}
                onClick={() => handleResolveDecision(contract!.activeDecision!.id, opt)}
                onMouseEnter={() => setHoveredOption(opt)}
                onMouseLeave={() => setHoveredOption(null)}
                style={{
                  padding: "8px 16px",
                  fontSize: "12px",
                  fontWeight: 600,
                  background: hoveredOption === opt ? "rgba(245, 158, 11, 0.2)" : "rgba(255,255,255,0.02)",
                  color: hoveredOption === opt ? "#f59e0b" : "#e2e8f0",
                  border: `1px solid ${hoveredOption === opt ? "#f59e0b" : "rgba(255,255,255,0.1)"}`,
                  borderRadius: "6px",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                <UserCheck size={14} />
                {opt}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── TAB BAR ── */}
      {contract && (
        <div style={{ display: "flex", gap: "8px", borderBottom: "1px solid rgba(255,255,255,0.05)", paddingBottom: "8px" }}>
          {[
            { id: "timeline", label: "Timeline", icon: Terminal },
            { id: "graph", label: "Reasoning Graph", icon: GitBranch },
            { id: "delegations", label: "Delegations", icon: Layers },
            { id: "cognition", label: "Cognitive Evolution", icon: Cpu },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            const isHovered = hoveredTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                onMouseEnter={() => setHoveredTab(tab.id)}
                onMouseLeave={() => setHoveredTab(null)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "8px 16px",
                  fontSize: "12px",
                  fontWeight: 600,
                  color: isActive ? "#818cf8" : isHovered ? "#cbd5e1" : "#64748b",
                  background: isActive ? "rgba(99, 102, 241, 0.08)" : "transparent",
                  border: "none",
                  borderBottom: `2px solid ${isActive ? "#818cf8" : "transparent"}`,
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                }}
              >
                <Icon size={14} />
                {tab.label}
              </button>
            );
          })}
        </div>
      )}

      {/* ── TAB CONTENT AREA ── */}
      {contract && (
        <div style={{ flex: 1, minHeight: "150px" }}>
          
          {/* ── TIMELINE TAB ── */}
          {activeTab === "timeline" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", background: "rgba(255,255,255,0.01)", padding: "10px 14px", borderRadius: "6px" }}>
                <span style={{ fontSize: "11px", color: "#64748b", fontFamily: "monospace" }}>STATUS:</span>
                <span style={{ fontSize: "11px", fontWeight: 700, fontFamily: "monospace", color: contract.status === "completed" ? "#10b981" : contract.status === "paused" ? "#f59e0b" : "#818cf8" }}>
                  {contract.status.toUpperCase()}
                </span>
                <span style={{ margin: "0 8px", color: "rgba(255,255,255,0.1)" }}>|</span>
                <span style={{ fontSize: "11px", color: "#64748b", fontFamily: "monospace" }}>DURATION:</span>
                <span style={{ fontSize: "11px", fontFamily: "monospace", color: "#e2e8f0" }}>
                  {(contract.timeline.durationMs / 1000).toFixed(2)}s
                </span>
              </div>

              {/* Horizontal Timeline Track */}
              <div style={{ display: "flex", flexDirection: "column", gap: "12px", padding: "16px", background: "rgba(255,255,255,0.02)", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.05)" }}>
                <span style={{ fontSize: "11px", color: "#64748b", textTransform: "uppercase", fontWeight: 600 }}>Execution Path Progress</span>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", position: "relative", marginTop: "8px" }}>
                  {/* Background Line */}
                  <div style={{ position: "absolute", left: "20px", right: "20px", height: "2px", background: "rgba(255,255,255,0.05)", zIndex: 0 }} />
                  
                  {/* Completed Stages line fill */}
                  <div
                    style={{
                      position: "absolute",
                      left: "20px",
                      width: `${(contract.timeline.completedStages.length / 4) * 100}%`,
                      height: "2px",
                      background: "#10b981",
                      zIndex: 0,
                      transition: "width 0.4s ease",
                    }}
                  />

                  {/* Steps */}
                  {["Created", "Planning", "Executing", "Verifying", "Completed"].map((stage, i) => {
                    const isCompleted = contract.timeline.completedStages.includes(stage);
                    const isCurrent = contract.timeline.currentStage === stage;
                    
                    let circleBg = "rgba(15, 23, 42, 0.9)";
                    let borderColor = "rgba(255,255,255,0.08)";
                    let labelColor = "#64748b";

                    if (isCompleted) {
                      circleBg = "#10b981";
                      borderColor = "#10b981";
                      labelColor = "#10b981";
                    } else if (isCurrent) {
                      circleBg = "#6366f1";
                      borderColor = "#818cf8";
                      labelColor = "#818cf8";
                    }

                    return (
                      <div key={stage} style={{ display: "flex", flexDirection: "column", alignItems: "center", zIndex: 1, width: "70px" }}>
                        <div style={{
                          width: "16px",
                          height: "16px",
                          borderRadius: "50%",
                          background: circleBg,
                          border: `2px solid ${borderColor}`,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          transition: "all 0.3s ease",
                          boxShadow: isCurrent ? "0 0 8px #818cf8" : "none"
                        }}>
                          {isCompleted && <Check size={10} style={{ color: "#fff" }} />}
                        </div>
                        <span style={{ fontSize: "10px", marginTop: "6px", fontWeight: isCurrent ? 700 : 500, color: labelColor }}>
                          {stage}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* ── REASONING GRAPH TAB ── */}
          {activeTab === "graph" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <span style={{ fontSize: "11px", color: "#64748b", textTransform: "uppercase", fontWeight: 600 }}>Reasoning Graph Elements</span>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                {/* Nodes List */}
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  <span style={{ fontSize: "10px", color: "#64748b", fontWeight: 700 }}>NODES</span>
                  {contract.reasoningGraph.nodes.map((node) => {
                    const isOnPath = contract.reasoningGraph.criticalPathNodeIds.includes(node.id);
                    return (
                      <div
                        key={node.id}
                        style={{
                          padding: "10px",
                          background: isOnPath ? "rgba(99, 102, 241, 0.05)" : "rgba(255,255,255,0.01)",
                          border: `1px solid ${isOnPath ? "rgba(99, 102, 241, 0.25)" : "rgba(255,255,255,0.04)"}`,
                          borderRadius: "6px",
                          display: "flex",
                          flexDirection: "column",
                          gap: "4px",
                          boxShadow: isOnPath ? "0 0 6px rgba(99, 102, 241, 0.05)" : "none"
                        }}
                      >
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <span style={{ fontSize: "11px", fontWeight: 600, color: "#cbd5e1" }}>
                            {node.label}
                          </span>
                          <span
                            style={{
                              fontSize: "9px",
                              padding: "2px 6px",
                              borderRadius: "3px",
                              background: node.status === "completed" ? "rgba(16,185,129,0.1)" : node.status === "active" ? "rgba(99,102,241,0.1)" : "rgba(255,255,255,0.03)",
                              color: node.status === "completed" ? "#10b981" : node.status === "active" ? "#818cf8" : "#64748b",
                            }}
                          >
                            {node.status}
                          </span>
                        </div>
                        <p style={{ margin: 0, fontSize: "10px", color: "#64748b" }}>
                          <em>"{node.rationale}"</em>
                        </p>
                        {isOnPath && (
                          <span style={{ fontSize: "9px", color: "#818cf8", fontWeight: 700, marginTop: "2px", display: "inline-flex", alignItems: "center", gap: "2px" }}>
                            <CheckCircle size={10} /> Critical Path Node
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Edges List */}
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  <span style={{ fontSize: "10px", color: "#64748b", fontWeight: 700 }}>EDGES (RELATIONSHIPS)</span>
                  {contract.reasoningGraph.edges.map((edge, idx) => (
                    <div key={idx} style={{ padding: "10px", background: "rgba(255,255,255,0.01)", border: "1px solid rgba(255,255,255,0.04)", borderRadius: "6px", display: "flex", flexDirection: "column", gap: "4px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "11px", color: "#cbd5e1" }}>
                        <span style={{ fontFamily: "monospace", color: "#818cf8" }}>Node {edge.from.slice(-4)}</span>
                        <ChevronRight size={10} style={{ color: "#64748b" }} />
                        <span style={{ padding: "1px 4px", fontSize: "9px", background: "rgba(99,102,241,0.08)", borderRadius: "3px", color: "#a5b4fc" }}>
                          {edge.relationship}
                        </span>
                        <ChevronRight size={10} style={{ color: "#64748b" }} />
                        <span style={{ fontFamily: "monospace", color: "#818cf8" }}>Node {edge.to.slice(-4)}</span>
                      </div>
                      <p style={{ margin: 0, fontSize: "10px", color: "#64748b" }}>
                        <em>"{edge.rationale}"</em>
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── DELEGATIONS TAB ── */}
          {activeTab === "delegations" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              <span style={{ fontSize: "11px", color: "#64748b", textTransform: "uppercase", fontWeight: 600 }}>Active Studio Delegations</span>
              {contract.delegations.length === 0 ? (
                <p style={{ fontSize: "12px", color: "#64748b", fontFamily: "monospace", margin: 0 }}>No active or completed delegations.</p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  {contract.delegations.map((del) => (
                    <div key={del.id} style={{ padding: "12px", background: "rgba(255,255,255,0.01)", border: "1px solid rgba(255,255,255,0.04)", borderRadius: "8px", display: "flex", flexDirection: "column", gap: "6px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                          <Terminal size={14} style={{ color: "#818cf8" }} />
                          <span style={{ fontSize: "12px", fontWeight: 600, color: "#cbd5e1" }}>
                            Studio target: {del.targetStudio}
                          </span>
                        </div>
                        <span style={{ fontSize: "10px", fontFamily: "monospace", color: del.status === "completed" ? "#10b981" : "#f59e0b" }}>
                          {del.status.toUpperCase()}
                        </span>
                      </div>

                      {/* Progress Bar */}
                      <div style={{ height: "4px", background: "rgba(255,255,255,0.04)", borderRadius: "2px", overflow: "hidden" }}>
                        <div style={{ width: `${del.progressPercent}%`, height: "100%", background: del.status === "completed" ? "#10b981" : "#818cf8", transition: "width 0.3s ease" }} />
                      </div>

                      <div style={{ fontSize: "10px", color: "#64748b" }}>
                        <p style={{ margin: "2px 0 0" }}><strong>Input details:</strong> {del.payloadSummary}</p>
                        <p style={{ margin: "2px 0 0" }}><strong>Expected output contract:</strong> {del.expectedOutputSummary}</p>
                        {del.validationPassed !== undefined && (
                          <p style={{ margin: "4px 0 0", color: del.validationPassed ? "#10b981" : "#ef4444", fontWeight: 600, display: "flex", alignItems: "center", gap: "3px" }}>
                            {del.validationPassed ? <Check size={10} /> : <AlertCircle size={10} />} Output Contract Validation: {del.validationPassed ? "PASSED" : "FAILED"}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── COGNITIVE EVOLUTION TAB ── */}
          {activeTab === "cognition" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {/* Overview Stats */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px" }}>
                <div style={{ padding: "12px", background: "rgba(255,255,255,0.01)", border: "1px solid rgba(255,255,255,0.04)", borderRadius: "8px", textAlign: "center" }}>
                  <span style={{ fontSize: "10px", color: "#64748b", textTransform: "uppercase" }}>Observations</span>
                  <p style={{ margin: "4px 0 0", fontSize: "18px", fontWeight: 700, color: "#cbd5e1" }}>
                    {contract.cognitiveEvolution.observationsCount}
                  </p>
                </div>
                <div style={{ padding: "12px", background: "rgba(255,255,255,0.01)", border: "1px solid rgba(255,255,255,0.04)", borderRadius: "8px", textAlign: "center" }}>
                  <span style={{ fontSize: "10px", color: "#64748b", textTransform: "uppercase" }}>Learnings</span>
                  <p style={{ margin: "4px 0 0", fontSize: "18px", fontWeight: 700, color: "#818cf8" }}>
                    {contract.cognitiveEvolution.learningsCount}
                  </p>
                </div>
                <div style={{ padding: "12px", background: "rgba(255,255,255,0.01)", border: "1px solid rgba(255,255,255,0.04)", borderRadius: "8px", textAlign: "center" }}>
                  <span style={{ fontSize: "10px", color: "#64748b", textTransform: "uppercase" }}>Knowledge Items</span>
                  <p style={{ margin: "4px 0 0", fontSize: "18px", fontWeight: 700, color: "#10b981" }}>
                    {contract.cognitiveEvolution.knowledgeCount}
                  </p>
                </div>
              </div>

              {/* Reflections & Promotions */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                {/* Reflections */}
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  <span style={{ fontSize: "10px", color: "#64748b", fontWeight: 700 }}>RECENT REFLECTIONS</span>
                  {contract.cognitiveEvolution.recentReflections.length === 0 ? (
                    <p style={{ fontSize: "11px", color: "#64748b", fontStyle: "italic", margin: 0 }}>No reflections recorded yet.</p>
                  ) : (
                    contract.cognitiveEvolution.recentReflections.map((ref, idx) => (
                      <div key={idx} style={{ padding: "10px", background: "rgba(255,255,255,0.01)", border: "1px solid rgba(255,255,255,0.04)", borderRadius: "6px" }}>
                        <span style={{
                          fontSize: "9px",
                          padding: "1px 4px",
                          borderRadius: "2px",
                          background: ref.type === "success" ? "rgba(16,185,129,0.1)" : "rgba(99,102,241,0.1)",
                          color: ref.type === "success" ? "#10b981" : "#818cf8",
                          textTransform: "uppercase",
                        }}>
                          {ref.type}
                        </span>
                        <p style={{ margin: "4px 0 0", fontSize: "11px", color: "#cbd5e1" }}>
                          {ref.content}
                        </p>
                      </div>
                    ))
                  )}
                </div>

                {/* Cognitive Promotions */}
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  <span style={{ fontSize: "10px", color: "#64748b", fontWeight: 700 }}>PROMOTIONS IN THIS SESSION</span>
                  {contract.cognitiveEvolution.promotedLearnings.length === 0 && contract.cognitiveEvolution.promotedKnowledge.length === 0 ? (
                    <p style={{ fontSize: "11px", color: "#64748b", fontStyle: "italic", margin: 0 }}>No promotions consolidated yet.</p>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                      {contract.cognitiveEvolution.promotedKnowledge.map((c, i) => (
                        <div key={`k-${i}`} style={{ padding: "8px", background: "rgba(16,185,129,0.05)", border: "1px solid rgba(16,185,129,0.15)", borderRadius: "6px" }}>
                          <span style={{ fontSize: "9px", color: "#10b981", fontWeight: 700 }}>PROMOTED TO KNOWLEDGE</span>
                          <p style={{ margin: "2px 0 0", fontSize: "11px", color: "#cbd5e1" }}>{c.content}</p>
                        </div>
                      ))}
                      {contract.cognitiveEvolution.promotedLearnings.map((c, i) => (
                        <div key={`l-${i}`} style={{ padding: "8px", background: "rgba(99, 102, 241, 0.05)", border: "1px solid rgba(99, 102, 241, 0.15)", borderRadius: "6px" }}>
                          <span style={{ fontSize: "9px", color: "#818cf8", fontWeight: 700 }}>PROMOTED TO LEARNING</span>
                          <p style={{ margin: "2px 0 0", fontSize: "11px", color: "#cbd5e1" }}>{c.content}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── COGNITIVE CALM FOOTER ── */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid rgba(255,255,255,0.05)", paddingTop: "10px", fontSize: "9px", color: "#64748b" }}>
        <span>Governed by Product Constitution v1.0</span>
        <div style={{ display: "flex", gap: "12px" }}>
          <span>✓ Intent First</span>
          <span>✓ Human Override</span>
          <span>✓ Explainable</span>
        </div>
      </div>
      </section>

      <aside className="studio-panel-rail studio-panel-rail--inspector brain-x-inspector" aria-label="Brain X authority inspector">
        <header className="brain-x-shell-heading">
          <span>Effective authority</span>
          <h2>Policy Inspector</h2>
          <p>Read-only disclosure of the authority currently governing this workspace.</p>
        </header>
        <section className="brain-x-shell-card">
          <span>Learning policy</span>
          <dl>
            <div><dt>Requested</dt><dd>{learningAuthority.requestedEnabled ? "Enabled" : "Disabled"}</dd></div>
            <div><dt>Effective</dt><dd className={learningAuthority.effectiveEnabled ? "is-allowed" : "is-blocked"}>{learningAuthority.effectiveEnabled ? "Enabled" : "Blocked"}</dd></div>
            <div><dt>Scope</dt><dd>{learningAuthority.scope}</dd></div>
            <div><dt>Source</dt><dd>{learningAuthority.source}</dd></div>
          </dl>
          <p>{learningAuthority.reason}</p>
        </section>
        <section className="brain-x-shell-card">
          <span>Planner state</span>
          <dl>
            <div><dt>Plan</dt><dd>{brainPlan ? "Generated" : "Awaiting intent"}</dd></div>
            <div><dt>Provider</dt><dd>{brainPlan?.provider.name ?? "Not routed"}</dd></div>
            <div><dt>Approval</dt><dd>{proposalAccepted === true ? "Accepted" : proposalAccepted === false ? "Rejected" : "Pending"}</dd></div>
          </dl>
        </section>
        <section className="brain-x-shell-card brain-x-principles">
          <span>Constitution</span>
          <p>Intent first · Human override · Explainable · No inferred learning automation.</p>
        </section>
      </aside>
    </section>
  );
}
