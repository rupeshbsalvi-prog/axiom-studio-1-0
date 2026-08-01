import {
  Aperture,
  Bot,
  Boxes,
  BrainCircuit,
  Clapperboard,
  Film,
  FolderOpen,
  LayoutDashboard,
  Network,
  Palette,
  PenTool,
  Presentation,
  Shapes,
  StickyNote,
  Type,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type StudioId =
  | "mission-control"
  | "photo"
  | "vector"
  | "brand"
  | "asset-hub"
  | "ui-ux"
  | "typography"
  | "presentation"
  | "motion"
  | "video"
  | "whiteboard"
  | "axiom-ai"
  | "brain-x";

export type CanvasMode =
  | "workspace"
  | "raster-layers"
  | "vectors"
  | "brand-system"
  | "assets"
  | "frames"
  | "typography"
  | "slides"
  | "timeline"
  | "video-timeline"
  | "board"
  | "intelligence"
  | "orchestration";

export interface StudioDefinition {
  id: StudioId;
  displayName: string;
  summary: string;
  icon: LucideIcon;
  phase: string;
  initialDepth: string;
  canvasMode: CanvasMode;
  axpkgSlice: string;
  exportFormats: string[];
}

export const STUDIO_REGISTRY: StudioDefinition[] = [
  {
    id: "mission-control",
    displayName: "Mission Control",
    summary: "Projects, intent intake, recovery, provider readiness, and workspace health.",
    icon: LayoutDashboard,
    phase: "01",
    initialDepth: "working home",
    canvasMode: "workspace",
    axpkgSlice: "missionControl",
    exportFormats: ["AXPKG"],
  },
  {
    id: "photo",
    displayName: "Photo Studio",
    summary: "Layered image and poster generation with transparent compositing-ready elements.",
    icon: Aperture,
    phase: "03",
    initialDepth: "first vertical MVP",
    canvasMode: "raster-layers",
    axpkgSlice: "photo",
    exportFormats: ["PNG", "JPG", "WEBP", "PDF"],
  },
  {
    id: "vector",
    displayName: "Vector Studio",
    summary: "Parametric SVG, logo, icon, illustration, diagram, and path editing.",
    icon: PenTool,
    phase: "03",
    initialDepth: "canvas + shapes",
    canvasMode: "vectors",
    axpkgSlice: "vector",
    exportFormats: ["SVG", "PDF", "EPS", "PNG"],
  },
  {
    id: "brand",
    displayName: "Brand Studio",
    summary: "Living brand systems, palettes, typography rules, tone, and governance.",
    icon: Palette,
    phase: "02/03",
    initialDepth: "brand kit foundation",
    canvasMode: "brand-system",
    axpkgSlice: "brand",
    exportFormats: ["JSON", "PDF", "SVG"],
  },
  {
    id: "asset-hub",
    displayName: "Asset Hub",
    summary: "Digital asset lifecycle, metadata, search, collections, reuse, and provenance.",
    icon: FolderOpen,
    phase: "02/03",
    initialDepth: "asset grid foundation",
    canvasMode: "assets",
    axpkgSlice: "assetHub",
    exportFormats: ["AXPKG", "ZIP", "CSV"],
  },
  {
    id: "ui-ux",
    displayName: "UI/UX Studio",
    summary: "Product flows, wireframes, responsive screens, component systems, and handoff.",
    icon: Boxes,
    phase: "03",
    initialDepth: "product design foundation",
    canvasMode: "frames",
    axpkgSlice: "uiUx",
    exportFormats: ["HTML", "PDF", "PNG", "SVG", "JSON"],
  },
  {
    id: "typography",
    displayName: "Typography Studio",
    summary: "Type systems, hierarchy, font pairing, spacing, readability, and tokens.",
    icon: Type,
    phase: "03",
    initialDepth: "type playground",
    canvasMode: "typography",
    axpkgSlice: "typography",
    exportFormats: ["CSS", "JSON", "PDF", "SVG"],
  },
  {
    id: "presentation",
    displayName: "Presentation Studio",
    summary: "Structured decks, slide layouts, charts, speaker notes, and brand themes.",
    icon: Presentation,
    phase: "03",
    initialDepth: "slide editor foundation",
    canvasMode: "slides",
    axpkgSlice: "presentation",
    exportFormats: ["PPTX", "PDF", "HTML", "PNG"],
  },
  {
    id: "motion",
    displayName: "Motion Studio",
    summary: "Timeline-based animated objects, keyframes, easing, effects, and Lottie-ready plans.",
    icon: Clapperboard,
    phase: "03",
    initialDepth: "timeline scaffold",
    canvasMode: "timeline",
    axpkgSlice: "motion",
    exportFormats: ["MP4", "WEBM", "GIF", "Lottie"],
  },
  {
    id: "video",
    displayName: "Video Studio",
    summary: "Scene timelines, clips, camera language, audio, captions, transitions, and continuity.",
    icon: Film,
    phase: "03+",
    initialDepth: "timeline scaffold",
    canvasMode: "video-timeline",
    axpkgSlice: "video",
    exportFormats: ["MP4", "MOV", "WEBM", "SRT"],
  },
  {
    id: "whiteboard",
    displayName: "Whiteboard Studio",
    summary: "Editable thinking artifacts: boards, sticky notes, connectors, maps, and workshops.",
    icon: StickyNote,
    phase: "03+",
    initialDepth: "infinite board foundation",
    canvasMode: "board",
    axpkgSlice: "whiteboard",
    exportFormats: ["PDF", "PNG", "SVG"],
  },
  {
    id: "axiom-ai",
    displayName: "Axiom AI Studio",
    summary: "Axiom Imagine X command center for director plans, traces, memory, evals, and routing.",
    icon: BrainCircuit,
    phase: "02/03",
    initialDepth: "Imagine X dashboard",
    canvasMode: "intelligence",
    axpkgSlice: "axiomAi",
    exportFormats: ["JSON", "PDF", "Markdown"],
  },
  {
    // FR1.2 — Third Platform Consumer: Reasoning / Orchestration domain
    // Validates: concurrent heterogeneous Studio execution, async event streams,
    // cross-Studio observation, scheduler pattern, three-namespace coexistence.
    id: "brain-x",
    displayName: "Brain X",
    summary: "Reasoning and orchestration engine. Manages multi-step workflows, memory graphs, scheduling, and cross-Studio intelligence pipelines.",
    icon: Network,
    phase: "02",
    initialDepth: "orchestration core",
    canvasMode: "orchestration",
    axpkgSlice: "brainX",
    exportFormats: ["JSON", "Markdown", "AXPKG"],
  },
];

export function getStudioById(id: string): StudioDefinition | undefined {
  return STUDIO_REGISTRY.find((studio) => studio.id === id);
}

export function getDefaultStudio(): StudioDefinition {
  return STUDIO_REGISTRY[0];
}
