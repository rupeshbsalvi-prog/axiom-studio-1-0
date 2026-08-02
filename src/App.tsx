import { type KeyboardEvent, useEffect, useMemo, useState } from "react";
import { CheckCircle2, ChevronRight, Cpu, FileArchive, Sparkles } from "lucide-react";
import { STUDIO_REGISTRY } from "./app/studios/registry";
import {
  buildExperienceDirectorState,
  detectHardwareTierFromSignals,
  getDirectorModules,
  getWEOSJourney,
  type ExperienceDirectorState,
  type HardwareTier,
} from "./experience/director/ExperienceDirector";
import { CinematicExperienceEngine } from "./experience/cinematic/CinematicExperienceEngine";
import { AuthWorkspaceGate } from "./auth/AuthWorkspaceGate";


const philosophyCards = [
  "User Intent First",
  "AI Planning",
  "Human Controlled AI",
  "Layer-Based Output",
  "Privacy by Design",
  "Cross-Platform",
];

const platformLayers = [
  { label: "Axiom OS Core", value: "Auth, billing, storage, plugins, MCP" },
  { label: "Axiom Brain X", value: "Reasoning, memory, knowledge graph, orchestration" },
  { label: "Axiom Imagine X", value: "Creative planning, provider routing, Auto Learner" },
  { label: "Universal Canvas", value: "Layers, frames, timelines, semantic editing" },
];

const pricingPlans = ["30-Day Free Trial", "Creator", "Professional", "Business", "Enterprise", "Education"];

const landingFilters = ["All", "Image", "Video", "Motion", "Brand", "UI", "Presentation", "Marketplace"];

const showcaseProjects = [
  {
    title: "Launch Campaign OS",
    studio: "Brand + Motion",
    detail: "Director plan, identity kit, motion frames, and export-ready assets.",
  },
  {
    title: "Product Experience Map",
    studio: "UI/UX Studio",
    detail: "Responsive frames, component tokens, user flow, and developer handoff.",
  },
  {
    title: "Investor Story Deck",
    studio: "Presentation",
    detail: "Narrative structure, slide system, speaker notes, and brand-safe visuals.",
  },
  {
    title: "Cinematic Social Cut",
    studio: "Video + Audio",
    detail: "Scene plan, transparent elements, continuity notes, and render queue.",
  },
];

const landingStats = [
  { value: "12", label: "studio modes" },
  { value: "3", label: "entry layers" },
  { value: "30", label: "trial days" },
  { value: "7", label: "platform targets" },
];

const cinematicChapters = getWEOSJourney();
const engineModules = getDirectorModules();

type NavigatorWithHardwareMemory = Navigator & {
  deviceMemory?: number;
};

function readBrowserHardwareTier(): HardwareTier {
  if (typeof window === "undefined") {
    return "high";
  }

  const navigatorWithMemory = window.navigator as NavigatorWithHardwareMemory;

  return detectHardwareTierFromSignals({
    deviceMemoryGB: navigatorWithMemory.deviceMemory,
    hardwareConcurrency: navigatorWithMemory.hardwareConcurrency,
    devicePixelRatio: window.devicePixelRatio,
  });
}

function readScrollProgress(): number {
  if (typeof document === "undefined" || typeof window === "undefined") {
    return 0;
  }

  const maxScroll = Math.max(document.documentElement.scrollHeight - window.innerHeight, 1);
  return window.scrollY / maxScroll;
}

function useExperienceDirectorState(): ExperienceDirectorState {
  const [progress, setProgress] = useState(0);
  const [hardwareTier, setHardwareTier] = useState<HardwareTier>("high");
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const mediaQuery = window.matchMedia?.("(prefers-reduced-motion: reduce)");
    setReducedMotion(Boolean(mediaQuery?.matches));
    setHardwareTier(readBrowserHardwareTier());
    setProgress(readScrollProgress());

    const handleReducedMotionChange = (event: MediaQueryListEvent) => {
      setReducedMotion(event.matches);
    };

    mediaQuery?.addEventListener?.("change", handleReducedMotionChange);

    return () => {
      mediaQuery?.removeEventListener?.("change", handleReducedMotionChange);
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    let frameId = 0;

    const updateProgress = () => {
      frameId = 0;
      setProgress(readScrollProgress());
    };

    const requestProgressUpdate = () => {
      if (frameId === 0) {
        frameId = window.requestAnimationFrame(updateProgress);
      }
    };

    window.addEventListener("scroll", requestProgressUpdate, { passive: true });
    window.addEventListener("resize", requestProgressUpdate);
    requestProgressUpdate();

    return () => {
      if (frameId !== 0) {
        window.cancelAnimationFrame(frameId);
      }
      window.removeEventListener("scroll", requestProgressUpdate);
      window.removeEventListener("resize", requestProgressUpdate);
    };
  }, []);

  return useMemo(
    () => buildExperienceDirectorState(progress, { reducedMotion, hardwareTier }),
    [hardwareTier, progress, reducedMotion],
  );
}



function LandingExperience({ onStartCreating }: { onStartCreating: () => void }) {
  const directorState = useExperienceDirectorState();
  const directorCue = directorState.cue;
  const scrollToChapter = (chapterIndex: number) => {
    if (typeof window === "undefined" || typeof document === "undefined") {
      return;
    }

    const clampedIndex = Math.min(Math.max(chapterIndex, 0), cinematicChapters.length - 1);
    const chapterProgress =
      clampedIndex === 0 ? 0 : Math.min((clampedIndex + 0.5) / cinematicChapters.length, 0.999999);
    const maxScroll = Math.max(document.documentElement.scrollHeight - window.innerHeight, 1);

    window.scrollTo({
      top: maxScroll * chapterProgress,
      behavior: window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
    });
  };

  const handleChapterRailKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const keyTargets: Record<string, number> = {
      ArrowRight: directorState.chapterIndex + 1,
      ArrowDown: directorState.chapterIndex + 1,
      ArrowLeft: directorState.chapterIndex - 1,
      ArrowUp: directorState.chapterIndex - 1,
      Home: 0,
      End: cinematicChapters.length - 1,
    };

    if (event.key in keyTargets) {
      event.preventDefault();
      scrollToChapter(keyTargets[event.key]);
    }
  };

  return (
    <main className="landing-experience">
      <CinematicExperienceEngine directorState={directorState} />
      <header className="landing-header" aria-label="Persistent landing navigation" data-persistent="true">
        <nav className="landing-nav" aria-label="Public navigation">
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
          <div className="landing-nav-links">
            <a href="#studios">Studios</a>
            <a href="#intelligence">Intelligence</a>
            <a href="#pricing">Pricing</a>
            <a href="#community">Community</a>
          </div>
          <button type="button" className="ghost-button" onClick={onStartCreating}>
            Sign In
          </button>
        </nav>
        <div className="chapter-rail" aria-label="Cinematic chapter timeline" onKeyDown={handleChapterRailKeyDown}>
          {cinematicChapters.map((chapter, index) => (
            <button
              aria-current={index === directorState.chapterIndex ? "step" : undefined}
              aria-label={`Go to ${chapter.title} chapter`}
              className={index === directorState.chapterIndex ? "chapter-chip active" : "chapter-chip"}
              key={chapter.id}
              onClick={() => scrollToChapter(index)}
              type="button"
            >
              <strong>{chapter.title}</strong>
            </button>
          ))}
        </div>
      </header>

      <section className="landing-hero" aria-label="Axiom Studio landing hero">
        <div className="signature-hero" role="region" aria-label="Axiom signature hero">
          <div className="signature-name">
            <p>Creative intelligence platform</p>
            <h1>Axiom Studio</h1>
            <span>One operating system for every creative discipline.</span>
          </div>

          <div className="mind-field" role="img" aria-label="Animated Axiom mind">
            <div className="mind-aura" aria-hidden="true" />
            <div className="mind-profile" aria-hidden="true">
              <img src="/assets/branding/ax-logo-core-symbol.svg" alt="" />
              <span className="neural-node node-one" />
              <span className="neural-node node-two" />
              <span className="neural-node node-three" />
              <span className="neural-node node-four" />
              <span className="neural-path path-one" />
              <span className="neural-path path-two" />
              <span className="neural-path path-three" />
            </div>
            <div className="mind-orbit orbit-one" aria-hidden="true" />
            <div className="mind-orbit orbit-two" aria-hidden="true" />
            <span className="mind-signal signal-one" aria-hidden="true">Intent</span>
            <span className="mind-signal signal-two" aria-hidden="true">Reason</span>
            <span className="mind-signal signal-three" aria-hidden="true">Create</span>
          </div>

          <div className="signature-promise">
            <p>Human-directed intelligence</p>
            <h2>Create Without Limits</h2>
            <span>From first thought to editable, professional output.</span>
          </div>
        </div>

        <div className="hero-scroll-cue" aria-hidden="true"><span />Scroll to awaken Imagine X</div>
      </section>

      <section className="creative-operating-act" role="region" aria-label="Imagine X creative operating system">
        <div className="creative-act-copy">
          <p className="eyebrow">AI-native creative operating system</p>
          <h2>Direction, intelligence, and craft—inside one living system.</h2>
          <strong>Powered by Axiom Imagine X</strong>
          <p>
            Turn intent, sketches, and future voice input into director-level plans, editable assets,
            and professional multi-studio output with human approval at every important step.
          </p>
          <div className="hero-actions">
            <button type="button" className="primary-button" onClick={onStartCreating}>
              Start Crafting
              <ChevronRight size={16} />
            </button>
            <a className="ghost-link" href="#intelligence">Explore Axiom</a>
          </div>
          <div className="hero-proof-list" aria-label="Axiom operating principles">
            <span>Intent becomes direction</span>
            <span>Human approval remains visible</span>
            <span>Every output stays editable</span>
          </div>
        </div>

        <aside className="orchestration-field" aria-label="Studio intelligence in motion">
          <header>
            <div><span className="live-indicator" /><strong>Studio intelligence in motion</strong></div>
            <span>LIVE / {directorState.chapter.title}</span>
          </header>
          <div className="signal-stage" aria-hidden="true">
            <div className="signal-ring ring-intent" />
            <div className="signal-ring ring-imagine" />
            <div className="signal-core"><img src="/assets/branding/ax-logo-core-symbol.svg" alt="" /></div>
            <span className="signal-label label-intent">Intent</span>
            <span className="signal-label label-plan">Imagine X</span>
            <span className="signal-label label-output">Editable Studios</span>
            <i className="signal-pulse pulse-one" />
            <i className="signal-pulse pulse-two" />
            <i className="signal-pulse pulse-three" />
          </div>
          <div className="studio-signal-list">
            <span>Photo</span><span>Motion</span><span>Brand</span><span>Vector</span>
          </div>
          <footer>
            <span>Director cue</span><strong>{directorCue.camera.mode}</strong>
            <span>Next</span><strong>{directorState.completionLabel}</strong>
          </footer>
        </aside>

        <div className="hero-stat-strip" aria-label="Platform summary">
          {landingStats.map((stat) => (
            <div key={stat.label}>
              <strong>{stat.value}</strong>
              <span>{stat.label}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="landing-section engine-section" aria-label="3D experience engine architecture">
        <div>
          <p className="eyebrow">Web Experience Operating System</p>
          <h2>One persistent WEOS scene. The Experience Director calls the cues.</h2>
          <p>
            Axiom now has a cinematic engine foundation: one mounted WebGL canvas, a scene graph,
            particles, an Imagine X core, studio nodes, and scroll-driven camera motion behind the UI.
          </p>
          <p>
            Active director cue: {directorCue.chapter.title} · {directorCue.camera.mode} · {directorCue.lighting.mood}.
          </p>
          <p>
            Chapter progress: {Math.round(directorState.chapterRange.localProgress * 100)}% ·{" "}
            {directorState.nextChapter ? `Next chapter ${directorState.nextChapter.title}` : "Workspace portal ready"}.
          </p>
        </div>
        <div className="engine-module-grid">
          {engineModules.map((module) => (
            <div className="engine-module" key={module}>
              <Sparkles size={16} />
              <span>{module}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="landing-section philosophy-section" aria-label="Axiom philosophy">
        <div>
          <p className="eyebrow">Platform philosophy</p>
          <h2>User Intent First to Professional Creation</h2>
        </div>
        <div className="principle-grid">
          {philosophyCards.map((card) => (
            <div className="principle-card" key={card}>
              <CheckCircle2 size={18} />
              <span>{card}</span>
            </div>
          ))}
        </div>
      </section>

      <section id="intelligence" className="landing-section split-section" aria-label="Axiom Intelligence">
        <div>
          <p className="eyebrow">Intelligence layer</p>
          <h2>Axiom Brain X powers the reasoning. Axiom Imagine X leads the creation.</h2>
          <p>
            Brain X owns memory, orchestration, and knowledge graph logic. Imagine X is the
            user-facing creative intelligence that plans, routes, critiques, and assembles work.
          </p>
        </div>
        <div className="layer-stack">
          {platformLayers.map((layer) => (
            <div className="layer-row" key={layer.label}>
              <Cpu size={18} />
              <div>
                <strong>{layer.label}</strong>
                <span>{layer.value}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section id="studios" className="landing-section">
        <div className="section-heading-row">
          <div>
            <p className="eyebrow">Studio explorer</p>
            <h2>Explore Axiom like a professional creative showcase.</h2>
          </div>
          <button type="button" className="ghost-button" onClick={onStartCreating}>
            Open Workspace
          </button>
        </div>
        <div className="filter-chip-row" aria-label="Showcase categories">
          {landingFilters.map((filter) => (
            <button type="button" key={filter}>
              {filter}
            </button>
          ))}
        </div>
        <div className="showcase-gallery" aria-label="Featured Axiom outputs">
          {showcaseProjects.map((project, index) => (
            <article className="showcase-card" key={project.title}>
              <div className={`showcase-preview preview-${index + 1}`}>
                <div className="preview-topbar" />
                <div className="preview-art" />
              </div>
              <div>
                <span>{project.studio}</span>
                <h3>{project.title}</h3>
                <p>{project.detail}</p>
              </div>
            </article>
          ))}
        </div>
        <div className="studio-explorer-grid">
          {STUDIO_REGISTRY.filter((studio) => studio.id !== "mission-control").map((studio, index) => {
            const Icon = studio.icon;
            return (
              <article className="studio-explorer-card" key={studio.id}>
                <div className="studio-card-topline">
                  <Icon size={22} />
                  <span>{String(index + 1).padStart(2, "0")}</span>
                </div>
                <h3>{studio.displayName}</h3>
                <p>{studio.summary}</p>
                <div className="studio-card-footer">
                  <span>{studio.exportFormats.join(" / ")}</span>
                  <ChevronRight size={16} />
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section id="pricing" className="landing-section">
        <div className="section-heading-row">
          <div>
            <p className="eyebrow">Subscription and licensing</p>
            <h2>Start with a full platform trial, then scale by creator, team, or enterprise.</h2>
          </div>
        </div>
        <div className="pricing-grid">
          {pricingPlans.map((plan) => (
            <div className="pricing-card" key={plan}>
              <FileArchive size={18} />
              <strong>{plan}</strong>
              <span>Studios, Imagine X planning, templates, version history, and transparent usage.</span>
            </div>
          ))}
        </div>
      </section>

      <section id="community" className="landing-section community-band">
        <div>
          <p className="eyebrow">Marketplace and community</p>
          <h2>Templates, plugins, MCP connectors, agents, assets, and studio packs for one creative platform.</h2>
          <p>
            Build from Axiom packs, publish reusable systems, connect enterprise tools, and carry
            projects across web, desktop, mobile, and tablet.
          </p>
          <button type="button" className="primary-button" onClick={onStartCreating}>
            Enter Workspace
            <ChevronRight size={16} />
          </button>
        </div>
        <div className="compatibility-strip">
          {["Web", "Windows", "macOS", "Linux", "Android", "iOS", "iPadOS"].map((platform) => (
            <span key={platform}>{platform}</span>
          ))}
        </div>
      </section>
    </main>
  );
}

export default function App() {
  return (
    <AuthWorkspaceGate
      renderLanding={(enterWorkspace) => (
        <LandingExperience onStartCreating={enterWorkspace} />
      )}
    />
  );
}
