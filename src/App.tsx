import { useEffect, useMemo, useRef, useState } from "react";
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
import awakeningFront from "../creative/brand-system/assets/cinematic/r1/axiom-awakening-front.png";
import awakeningFront960Avif from "../creative/brand-system/assets/cinematic/r1/axiom-awakening-front-960.avif";
import awakeningFront1672Avif from "../creative/brand-system/assets/cinematic/r1/axiom-awakening-front-1672.avif";
import awakeningFront960Webp from "../creative/brand-system/assets/cinematic/r1/axiom-awakening-front-960.webp";
import awakeningFront1672Webp from "../creative/brand-system/assets/cinematic/r1/axiom-awakening-front-1672.webp";
import awakeningReveal from "../creative/brand-system/assets/cinematic/r1/axiom-awakening-reveal.png";
import awakeningReveal960Avif from "../creative/brand-system/assets/cinematic/r1/axiom-awakening-reveal-960.avif";
import awakeningReveal1672Avif from "../creative/brand-system/assets/cinematic/r1/axiom-awakening-reveal-1672.avif";
import awakeningReveal960Webp from "../creative/brand-system/assets/cinematic/r1/axiom-awakening-reveal-960.webp";
import awakeningReveal1672Webp from "../creative/brand-system/assets/cinematic/r1/axiom-awakening-reveal-1672.webp";


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
  const awakeningRef = useRef<HTMLElement>(null);
  const awakeningFrame = useRef(0);

  useEffect(() => {
    const updateReveal = () => {
      awakeningFrame.current = 0;
      const reveal = awakeningRef.current;
      if (!reveal) return;
      if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) {
        reveal.style.setProperty("--reveal-clip", "0%");
        return;
      }
      const bounds = reveal.getBoundingClientRect();
      const travel = Math.max(bounds.height - window.innerHeight, 1);
      const progress = Math.min(Math.max(-bounds.top / travel, 0), 1);
      reveal.style.setProperty("--reveal-clip", `${Math.round(progress * 100)}%`);
    };
    const requestReveal = () => {
      if (!awakeningFrame.current) awakeningFrame.current = window.requestAnimationFrame(updateReveal);
    };

    updateReveal();
    window.addEventListener("scroll", requestReveal, { passive: true });
    window.addEventListener("resize", requestReveal);
    return () => {
      window.cancelAnimationFrame(awakeningFrame.current);
      window.removeEventListener("scroll", requestReveal);
      window.removeEventListener("resize", requestReveal);
    };
  }, []);

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

  return (
    <main className="landing-experience">
      <CinematicExperienceEngine directorState={directorState} />
      <header className="landing-header" aria-label="Persistent landing navigation" data-persistent="true" role="banner">
        <nav className="landing-nav" aria-label="Public navigation">
          <div className="brand-mark">
            <div>
              <strong>Axiom Studio</strong>
              <span>Creative Intelligence OS</span>
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
      </header>

      <nav className="world-route" aria-label="Axiom scroll world route">
        {cinematicChapters.map((chapter, index) => (
          <button
            aria-current={index === directorState.chapterIndex ? "step" : undefined}
            aria-label={`Fly to ${chapter.title}`}
            className={index === directorState.chapterIndex ? "active" : undefined}
            key={chapter.id}
            onClick={() => scrollToChapter(index)}
            type="button"
          >
            <span>{chapter.title}</span>
            <i aria-hidden="true" />
          </button>
        ))}
      </nav>

      <section
        ref={awakeningRef}
        className="cinematic-image-reveal"
        data-motion-system="scroll-image-reveal-v1"
        role="region"
        aria-label="Axiom awakening reveal"
      >
        <div className="cinematic-reveal-stage">
          <picture>
            <source data-testid="cinematic-responsive-source" type="image/avif" srcSet={`${awakeningReveal960Avif} 960w, ${awakeningReveal1672Avif} 1672w`} sizes="100vw" />
            <source data-testid="cinematic-responsive-source" type="image/webp" srcSet={`${awakeningReveal960Webp} 960w, ${awakeningReveal1672Webp} 1672w`} sizes="100vw" />
            <img src={awakeningReveal} alt="Awakened Axiom creative core" loading="lazy" decoding="async" />
          </picture>
          <picture>
            <source data-testid="cinematic-responsive-source" type="image/avif" srcSet={`${awakeningFront960Avif} 960w, ${awakeningFront1672Avif} 1672w`} sizes="100vw" />
            <source data-testid="cinematic-responsive-source" type="image/webp" srcSet={`${awakeningFront960Webp} 960w, ${awakeningFront1672Webp} 1672w`} sizes="100vw" />
            <img className="cinematic-reveal-front" src={awakeningFront} alt="Dormant Axiom creative core" loading="lazy" decoding="async" />
          </picture>
          <div className="cinematic-reveal-seam" aria-hidden="true" />
          <div className="cinematic-hero-name">
            <p>Creative intelligence, directed by you</p>
            <h1>Axiom Studio</h1>
            <span>One living system for every creative discipline.</span>
          </div>
          <div className="cinematic-hero-promise">
            <p>Human direction. Machine precision.</p>
            <h2>Create Without Limits</h2>
            <span>From first intent to production-ready craft.</span>
          </div>
          <div className="cinematic-hero-scroll" aria-hidden="true"><span />Scroll to awaken</div>
        </div>
      </section>

      <section className="creative-operating-act" role="region" aria-label="Imagine X creative operating system">
        <div className="creative-act-copy">
          <p className="eyebrow">AI-native creative operating system</p>
          <h2>One direction. Every studio. A system that remembers why.</h2>
          <strong>Powered by Axiom Imagine X</strong>
          <p>
            Imagine X turns your intent into creative direction. Brain X preserves context. Specialist
            studios execute the craft—and nothing important moves forward without your approval.
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

        <aside className="orchestration-field" aria-label="Studio intelligence in motion" data-ui-language="axiom-prism-v2">
          <header>
            <div><span className="live-indicator" /><strong>Studio intelligence in motion</strong></div>
            <span>LIVE / {directorState.chapter.title}</span>
          </header>
          <ol className="orchestration-route" aria-label="Axiom orchestration route">
            <li className="route-step route-intent">
              <span>01 / INPUT</span><strong>Creative intent</strong><p>Your brief, references, constraints, and desired outcome.</p>
            </li>
            <li className="route-step route-intelligence">
              <span>02 / DIRECT</span>
              <div><strong>Imagine X direction</strong><p>Concept, sequence, craft plan, and studio routing.</p></div>
              <div><strong>Brain X context</strong><p>Brand memory, workspace policy, and project continuity.</p></div>
            </li>
            <li className="route-step route-approval">
              <span>03 / DECIDE</span><strong>Human approval</strong><p>You accept, revise, or redirect before execution.</p>
            </li>
            <li className="route-step route-studios">
              <span>04 / CRAFT</span><strong>Specialist studios</strong>
              <div className="route-studio-list"><em>Photo</em><em>Motion</em><em>Brand</em><em>Vector</em></div>
            </li>
            <li className="route-step route-output">
              <span>05 / DELIVER</span><strong>Editable studio output</strong><p>Layered, governed, and ready for professional refinement.</p>
            </li>
          </ol>
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
