import { Suspense } from "react";
import { CheckCircle2 } from "lucide-react";
import type { StudioDefinition, StudioId } from "../app/studios/registry";
import { getStudioRuntimeEntry } from "./StudioRuntimeRegistry";
import { type AxiomProjectDraft } from "../app/projects/projectDraft";
import type { ImagineXWorkspaceLearningPolicyState } from "../app/services/ImagineXLearningAuthority";
import { TypographyPanel } from "../app/studios/typography/TypographyPanel";
import { PresentationPanel } from "../app/studios/presentation/PresentationPanel";
import { BrandPanel } from "../app/studios/brand/BrandPanel";
import { UiUxPanel } from "../app/studios/ui-ux/UiUxPanel";
import { AssetHubPanel } from "../app/studios/asset-hub/AssetHubPanel";
import { VideoPanel } from "../app/studios/video/VideoPanel";
import { WhiteboardPanel } from "../app/studios/whiteboard/WhiteboardPanel";

export const studioHighlights: Record<StudioId, string[]> = {
  "mission-control": [
    "Workspace Hub foundation for authenticated and guest creation entry.",
    "Intent intake routes future work to the intelligence layer and the studio registry.",
    "Local AXPKG-ready drafts prove the Phase 01 project foundation.",
  ],
  photo: ["structured image templates", "transparent compositing elements", "layered canvas assembly"],
  vector: ["editable SVG paths", "parametric shapes", "symbols and export-safe vectors"],
  brand: ["living brand kits", "palette and typography governance", "cross-studio constraints"],
  "asset-hub": ["metadata and provenance", "collections and reuse", "insert-to-studio actions"],
  "ui-ux": ["editable frames, components, tokens", "responsive flows", "developer handoff"],
  typography: ["font pairing", "hierarchy and spacing", "readability validation"],
  presentation: ["structured decks", "slide layouts", "speaker notes"],
  motion: ["timeline keyframes", "easing and effects", "Lottie-ready planning"],
  video: ["scene timelines", "camera language", "audio and continuity"],
  whiteboard: ["editable nodes", "connectors and maps", "facilitation boards"],
  "axiom-ai": ["director plans", "agent traces", "memory and evals"],
  "brain-x": ["async workflow orchestration", "cross-studio intelligence pipelines", "reasoning memory graph"],
};

export function StudioPanelRouter({
  activeStudio,
  project,
  onUpdateProject,
  workspaceLearningPolicy,
}: {
  activeStudio: StudioDefinition;
  project?: AxiomProjectDraft | null;
  onUpdateProject?: (project: AxiomProjectDraft) => void;
  workspaceLearningPolicy?: ImagineXWorkspaceLearningPolicyState;
}) {
  if (activeStudio.id === "typography") {
    return <TypographyPanel />;
  }

  if (activeStudio.id === "presentation") {
    return <PresentationPanel />;
  }

  if (activeStudio.id === "brand") {
    return <BrandPanel />;
  }

  if (activeStudio.id === "ui-ux") {
    return <UiUxPanel />;
  }

  if (activeStudio.id === "asset-hub") {
    return <AssetHubPanel />;
  }

  if (activeStudio.id === "video") {
    return <VideoPanel />;
  }

  if (activeStudio.id === "whiteboard") {
    return <WhiteboardPanel />;
  }

  const runtimeEntry = getStudioRuntimeEntry(activeStudio.id);
  if (runtimeEntry) {
    const RuntimePanel = runtimeEntry.Panel;
    return (
      <Suspense
        fallback={
          <div className="canvas-foundation" role="status">
            <div className="artboard">
              <span>Loading studio runtime</span>
              <strong>{activeStudio.displayName}</strong>
            </div>
          </div>
        }
      >
        <RuntimePanel
          project={project}
          onUpdateProject={onUpdateProject}
          workspaceLearningPolicy={workspaceLearningPolicy}
        />
      </Suspense>
    );
  }

  return (
    <>
      <div className="highlight-grid">
        {studioHighlights[activeStudio.id].map((highlight) => (
          <div className="highlight-card" key={highlight}>
            <CheckCircle2 size={16} />
            <span>{highlight}</span>
          </div>
        ))}
      </div>

      <div className="canvas-foundation">
        <div className="artboard">
          <span>Canvas foundation</span>
          <strong>{activeStudio.axpkgSlice}</strong>
        </div>
        <div className="artboard-meta">
          <span>Phase</span>
          <strong>{activeStudio.phase}</strong>
          <span>Exports</span>
          <strong>{activeStudio.exportFormats.join(" / ")}</strong>
        </div>
      </div>
    </>
  );
}
