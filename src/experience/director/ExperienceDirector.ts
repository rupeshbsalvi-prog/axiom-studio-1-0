export type HardwareTier = "high" | "medium" | "low";

export type QualityProfile = {
  profile: HardwareTier;
  particleBudget: number;
  reflectionQuality: "dynamic" | "reduced" | "static";
  shaderMode: "full" | "simplified" | "css-assisted";
};

export type WEOSChapter = {
  id: string;
  title: string;
  act: string;
  objective: string;
  cameraPreset: string;
  environment: string;
  lightingMood: string;
  audioCue: string;
  particleBehavior: string;
  themeWorld: string;
  interactionMode: string;
  primaryVisual: string;
  overlayIntent: string;
};

export type DirectorCue = {
  chapter: WEOSChapter;
  camera: {
    preset: string;
    mode: string;
  };
  lighting: {
    mood: string;
  };
  particles: {
    behavior: string;
  };
  audio: {
    intent: string;
  };
  theme: {
    world: string;
  };
  quality: QualityProfile;
  portal: {
    ready: boolean;
    label: string;
  };
};

export type HardwareSignals = {
  deviceMemoryGB?: number;
  hardwareConcurrency?: number;
  devicePixelRatio?: number;
};

export type ChapterRange = {
  index: number;
  start: number;
  end: number;
  localProgress: number;
};

export type ExperienceDirectorState = {
  progress: number;
  chapterIndex: number;
  chapterRange: ChapterRange;
  chapter: WEOSChapter;
  previousChapter: WEOSChapter | null;
  nextChapter: WEOSChapter | null;
  cue: DirectorCue;
  isFirstChapter: boolean;
  isFinalChapter: boolean;
  completionLabel: string;
};

export type ExperienceRenderDirective = {
  cameraTarget: {
    x: number;
    y: number;
    z: number;
    lookAtZ: number;
    easing: number;
  };
  scene: {
    fogDensity: number;
    accentColor: string;
  };
  motion: {
    ringOrbitSpeed: number;
    studioOrbitSpeed: number;
    particleDriftSpeed: number;
  };
  core: {
    geometryScale: number;
    materialEmission: number;
    particleDensity: number;
    lightingIntensity: number;
  };
};

const WEOS_JOURNEY: WEOSChapter[] = [
  {
    id: "arrival",
    title: "Arrival",
    act: "Act I",
    objective: "Cold open with crystal dust and one beam of light.",
    cameraPreset: "85mm cold open",
    environment: "Black field",
    lightingMood: "single amber beam",
    audioCue: "soft piano note",
    particleBehavior: "crystal dust convergence",
    themeWorld: "Space",
    interactionMode: "cursor light bending",
    primaryVisual: "Crystal Core",
    overlayIntent: "No website chrome. Only presence.",
  },
  {
    id: "awakening",
    title: "Awakening",
    act: "Act II",
    objective: "Crystal fractures into wireframe, geometry, and architecture.",
    cameraPreset: "slow dolly reveal",
    environment: "Crystal genesis",
    lightingMood: "refracted white and gold",
    audioCue: "glass harmonic rise",
    particleBehavior: "fracture assembly",
    themeWorld: "Architect",
    interactionMode: "growth follows scroll",
    primaryVisual: "Procedural crystal architecture",
    overlayIntent: "Axiom constructs itself.",
  },
  {
    id: "living-observatory",
    title: "Living Observatory",
    act: "Act III",
    objective: "User enters Axiom as a world, not a page.",
    cameraPreset: "ultra wide observatory walk",
    environment: "Concrete, crystal, titanium, water, fog, sunlight",
    lightingMood: "soft skylight and moving reflections",
    audioCue: "large room air and low synth",
    particleBehavior: "environmental motes",
    themeWorld: "Living Observatory",
    interactionMode: "weather and reflections react",
    primaryVisual: "Glass bridges and observatory districts",
    overlayIntent: "Show the operating-system world.",
  },
  {
    id: "axiom-brain",
    title: "Axiom Brain",
    act: "Act IV",
    objective: "Make intelligence visible and teach through action.",
    cameraPreset: "orbit intelligence core",
    environment: "Floating crystal brain",
    lightingMood: "neural cyan heartbeat",
    audioCue: "thinking pulse",
    particleBehavior: "reasoning node activation",
    themeWorld: "Neural Observatory",
    interactionMode: "prompt-to-reasoning reveal",
    primaryVisual: "Crystal brain and routing graph",
    overlayIntent: "No hidden AI.",
  },
  {
    id: "creative-journey",
    title: "Creative Journey",
    act: "Act IV",
    objective: "Show intent becoming plan, identity lock, and output route.",
    cameraPreset: "focus pull through reasoning graph",
    environment: "Transparent planning chamber",
    lightingMood: "warm plan highlights",
    audioCue: "model route ticks",
    particleBehavior: "memory and model route streams",
    themeWorld: "Neural Observatory",
    interactionMode: "visible thought process",
    primaryVisual: "Intent to plan pipeline",
    overlayIntent: "Teach Axiom's transparent AI workflow.",
  },
  {
    id: "studio-exploration",
    title: "Studio Universe",
    act: "Act V",
    objective: "Reveal studios as physical districts with working software inside.",
    cameraPreset: "macro district glide",
    environment: "Studio District",
    lightingMood: "museum gold with cyan reflections",
    audioCue: "district reveal swell",
    particleBehavior: "studio node orbit",
    themeWorld: "Living Observatory",
    interactionMode: "hover expands studio districts",
    primaryVisual: "Photo Gallery, Motion Museum, Typography Cathedral",
    overlayIntent: "Studios are places, not cards.",
  },
  {
    id: "create-live",
    title: "Create Live",
    act: "Act VI",
    objective: "Let visitors create a small cross-studio project without login.",
    cameraPreset: "hands-on canvas macro",
    environment: "Living Canvas",
    lightingMood: "studio workbench glow",
    audioCue: "generation build",
    particleBehavior: "asset materialization",
    themeWorld: "Designer",
    interactionMode: "prompt and edit",
    primaryVisual: "Luxury perfume demo pipeline",
    overlayIntent: "Experience Axiom before signup.",
  },
  {
    id: "community",
    title: "Community",
    act: "Act VII",
    objective: "Present a living ecosystem of projects, forks, remixes, and assets.",
    cameraPreset: "drone community pass",
    environment: "Living Community",
    lightingMood: "social warm highlights",
    audioCue: "community activity bed",
    particleBehavior: "project link streams",
    themeWorld: "Museum",
    interactionMode: "fork and remix preview",
    primaryVisual: "Live project constellation",
    overlayIntent: "Community is alive.",
  },
  {
    id: "developer-universe",
    title: "Developer Universe",
    act: "Act VIII",
    objective: "Expose APIs, SDKs, shaders, MCP, workflow graphs, and plugins.",
    cameraPreset: "code lab track",
    environment: "Developer District",
    lightingMood: "blueprint cyan",
    audioCue: "terminal synth",
    particleBehavior: "node graph pulses",
    themeWorld: "Architect",
    interactionMode: "live code and graph exploration",
    primaryVisual: "SDK playground and MCP visualization",
    overlayIntent: "Developers can build inside Axiom.",
  },
  {
    id: "enterprise",
    title: "Enterprise",
    act: "Act IX",
    objective: "Show governance as an animated company operating model.",
    cameraPreset: "executive crane",
    environment: "Enterprise operations floor",
    lightingMood: "executive warm white",
    audioCue: "governance rhythm",
    particleBehavior: "permission and approval flows",
    themeWorld: "Executive",
    interactionMode: "permissions and approvals simulation",
    primaryVisual: "Teams, roles, approvals, audit, analytics",
    overlayIntent: "Enterprise is operational, not a diagram.",
  },
  {
    id: "future",
    title: "Future",
    act: "Act X",
    objective: "Roadmap crystals grow into future studios and labs.",
    cameraPreset: "future crystal crane",
    environment: "Research horizon",
    lightingMood: "dawn over crystal field",
    audioCue: "future swell",
    particleBehavior: "roadmap crystal growth",
    themeWorld: "Adventure",
    interactionMode: "roadmap exploration",
    primaryVisual: "Growing future crystals",
    overlayIntent: "The roadmap is alive.",
  },
  {
    id: "workspace-portal",
    title: "Workspace Portal",
    act: "Act X",
    objective: "Everything converges into the AI Core and opens Workspace Hub.",
    cameraPreset: "portal push",
    environment: "Workspace portal",
    lightingMood: "white cyan convergence",
    audioCue: "ascending portal sweep",
    particleBehavior: "converge into portal",
    themeWorld: "Space",
    interactionMode: "enter workspace",
    primaryVisual: "AI Core portal",
    overlayIntent: "No page break. Enter Axiom.",
  },
];

const DIRECTOR_MODULES = [
  "Scene Manager",
  "Camera Controller",
  "Animation Controller",
  "Scroll Controller",
  "Interaction Controller",
  "Section Timeline",
  "Quality Governor",
  "Theme Engine",
  "Audio Conductor",
  "Portal Controller",
];

export function getWEOSJourney(): WEOSChapter[] {
  return WEOS_JOURNEY;
}

export function getDirectorModules(): string[] {
  return DIRECTOR_MODULES;
}

export function clampProgress(progress: number): number {
  return Math.min(Math.max(progress, 0), 0.999999);
}

export function getChapterIndexAtProgress(progress: number): number {
  const normalized = clampProgress(progress);
  return Math.max(0, Math.ceil(normalized * WEOS_JOURNEY.length) - 1);
}

export function getChapterAtProgress(progress: number): WEOSChapter {
  return WEOS_JOURNEY[getChapterIndexAtProgress(progress)] ?? WEOS_JOURNEY[0];
}

export function getChapterRangeAtProgress(progress: number): ChapterRange {
  const normalized = clampProgress(progress);
  const index = getChapterIndexAtProgress(normalized);
  const chapterSize = 1 / WEOS_JOURNEY.length;
  const start = index * chapterSize;
  const end = Math.min(start + chapterSize, 1);
  const localProgress = Math.min(Math.max((normalized - start) / chapterSize, 0), 1);

  return {
    index,
    start,
    end,
    localProgress,
  };
}

export function resolveQualityProfile(hardwareTier: HardwareTier): QualityProfile {
  if (hardwareTier === "low") {
    return {
      profile: "low",
      particleBudget: 260,
      reflectionQuality: "static",
      shaderMode: "css-assisted",
    };
  }

  if (hardwareTier === "medium") {
    return {
      profile: "medium",
      particleBudget: 750,
      reflectionQuality: "reduced",
      shaderMode: "simplified",
    };
  }

  return {
    profile: "high",
    particleBudget: 1400,
    reflectionQuality: "dynamic",
    shaderMode: "full",
  };
}

export function detectHardwareTierFromSignals(signals: HardwareSignals): HardwareTier {
  const memory = signals.deviceMemoryGB ?? 8;
  const cores = signals.hardwareConcurrency ?? 8;
  const dpr = signals.devicePixelRatio ?? 1;

  if (memory <= 4 || cores <= 4 || dpr > 2.5) {
    return "low";
  }

  if (memory <= 8 || cores <= 8 || dpr > 1.75) {
    return "medium";
  }

  return "high";
}

export function buildDirectorCue(
  progress: number,
  options: { reducedMotion: boolean; hardwareTier: HardwareTier },
): DirectorCue {
  const chapter = getChapterAtProgress(progress);
  const quality = resolveQualityProfile(options.hardwareTier);
  const isPortal = chapter.id === "workspace-portal";

  return {
    chapter,
    camera: {
      preset: chapter.cameraPreset,
      mode: options.reducedMotion ? "locked accessible chapter focus" : chapter.cameraPreset,
    },
    lighting: {
      mood: options.reducedMotion ? "stable accessible contrast" : chapter.lightingMood,
    },
    particles: {
      behavior: options.reducedMotion ? "paused ambient field" : chapter.particleBehavior,
    },
    audio: {
      intent: options.reducedMotion ? "muted by default" : chapter.audioCue,
    },
    theme: {
      world: chapter.themeWorld,
    },
    quality,
    portal: {
      ready: isPortal,
      label: isPortal ? "Enter Workspace" : "Continue Journey",
    },
  };
}

export function buildExperienceDirectorState(
  progress: number,
  options: { reducedMotion: boolean; hardwareTier: HardwareTier },
): ExperienceDirectorState {
  const normalized = clampProgress(progress);
  const chapterRange = getChapterRangeAtProgress(normalized);
  const chapter = WEOS_JOURNEY[chapterRange.index] ?? WEOS_JOURNEY[0];
  const previousChapter = WEOS_JOURNEY[chapterRange.index - 1] ?? null;
  const nextChapter = WEOS_JOURNEY[chapterRange.index + 1] ?? null;
  const isFinalChapter = chapterRange.index === WEOS_JOURNEY.length - 1;

  return {
    progress: normalized,
    chapterIndex: chapterRange.index,
    chapterRange,
    chapter,
    previousChapter,
    nextChapter,
    cue: buildDirectorCue(normalized, options),
    isFirstChapter: chapterRange.index === 0,
    isFinalChapter,
    completionLabel: isFinalChapter ? "Workspace portal ready" : `Next: ${nextChapter?.title ?? "Workspace"}`,
  };
}

export function buildExperienceRenderDirective(state: ExperienceDirectorState): ExperienceRenderDirective {
  const local = state.chapterRange.localProgress;
  const chapterBlend = state.chapterIndex / Math.max(WEOS_JOURNEY.length - 1, 1);
  const qualityMultiplier =
    state.cue.quality.profile === "high" ? 1 : state.cue.quality.profile === "medium" ? 0.72 : 0.42;
  const reducedMotion = state.cue.camera.mode === "locked accessible chapter focus";

  return {
    cameraTarget: {
      x: reducedMotion ? 0 : Math.sin(chapterBlend * Math.PI * 2) * 2.2,
      y: 0.35 + chapterBlend * 2 + local * 0.18,
      z: reducedMotion ? 8.5 : 9 - chapterBlend * 6.2,
      lookAtZ: -1.4 - chapterBlend * 4.2,
      easing: reducedMotion ? 0.02 : 0.045,
    },
    scene: {
      fogDensity: 0.035 + chapterBlend * 0.03,
      accentColor:
        state.chapter.themeWorld === "Executive"
          ? "#e2bd72"
          : state.chapter.themeWorld === "Neural Observatory"
            ? "#69d4e8"
            : state.chapter.themeWorld === "Designer"
              ? "#d98a78"
              : "#f0d59a",
    },
    motion: {
      ringOrbitSpeed: reducedMotion ? 0.01 : 0.08 + local * 0.035,
      studioOrbitSpeed: reducedMotion ? 0.012 : 0.06 + chapterBlend * 0.05,
      particleDriftSpeed: reducedMotion ? 0.004 : 0.012 + local * 0.015,
    },
    core: {
      geometryScale: 1 + local * 0.08,
      materialEmission: (0.82 + local * 0.32) * qualityMultiplier,
      particleDensity: qualityMultiplier,
      lightingIntensity: (0.9 + local * 0.42) * qualityMultiplier,
    },
  };
}
