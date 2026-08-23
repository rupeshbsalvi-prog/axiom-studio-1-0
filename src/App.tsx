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
import dormant960Avif from "../creative/brand-system/assets/cinematic/r2/axiom-portal-dormant-960.avif";
import dormant1672Avif from "../creative/brand-system/assets/cinematic/r2/axiom-portal-dormant-1672.avif";
import dormant960Webp from "../creative/brand-system/assets/cinematic/r2/axiom-portal-dormant-960.webp";
import dormant1672Webp from "../creative/brand-system/assets/cinematic/r2/axiom-portal-dormant-1672.webp";
import awakening960Avif from "../creative/brand-system/assets/cinematic/r2/axiom-portal-awakening-960.avif";
import awakening1672Avif from "../creative/brand-system/assets/cinematic/r2/axiom-portal-awakening-1672.avif";
import awakening960Webp from "../creative/brand-system/assets/cinematic/r2/axiom-portal-awakening-960.webp";
import awakening1672Webp from "../creative/brand-system/assets/cinematic/r2/axiom-portal-awakening-1672.webp";
import resolved960Avif from "../creative/brand-system/assets/cinematic/r2/axiom-portal-resolved-960.avif";
import resolved1672Avif from "../creative/brand-system/assets/cinematic/r2/axiom-portal-resolved-1672.avif";
import resolved960Webp from "../creative/brand-system/assets/cinematic/r2/axiom-portal-resolved-960.webp";
import resolved1672Webp from "../creative/brand-system/assets/cinematic/r2/axiom-portal-resolved-1672.webp";


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
        reveal.style.setProperty("--reveal-clip", "100%");
        reveal.style.setProperty("--resolve-opacity", "100%");
        return;
      }
      const bounds = reveal.getBoundingClientRect();
      const travel = Math.max(bounds.height - window.innerHeight, 1);
      const progress = Math.min(Math.max(-bounds.top / travel, 0), 1);
      reveal.style.setProperty("--reveal-clip", `${Math.round(progress * 100)}%`);
      reveal.style.setProperty("--resolve-opacity", `${Math.round(Math.max((progress - 0.5) * 2, 0) * 100)}%`);
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
      <header
        className="landing-header"
        aria-label="Persistent landing navigation"
        data-design-language="atelier-editorial-v3"
        data-persistent="true"
        role="banner"
      >
        <nav className="landing-nav" aria-label="Public navigation">
          <div className="brand-mark">
            <div>
              <strong>Axiom Studio</strong>
              <span>Creative Intelligence OS</span>
              <small>Edition 03 / 2026</small>
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
        data-art-direction="heirloom-editorial"
        data-motion-system="scroll-image-sequence-v2"
        role="region"
        aria-label="Axiom awakening reveal"
      >
        <div className="cinematic-reveal-stage">
          <div className="cinematic-hero-folio" aria-label="Axiom editorial edition">
            <span>Volume I — Creative Intelligence</span>
            <span>Intent · Intelligence · Creation</span>
          </div>
          <picture>
            <source data-testid="cinematic-responsive-source" type="image/avif" srcSet={`${resolved960Avif} 960w, ${resolved1672Avif} 1672w`} sizes="100vw" />
            <source data-testid="cinematic-responsive-source" type="image/webp" srcSet={`${resolved960Webp} 960w, ${resolved1672Webp} 1672w`} sizes="100vw" />
            <img src={resolved1672Webp} alt="Resolved Axiom creative core" loading="eager" decoding="async" />
          </picture>
          <picture>
            <source data-testid="cinematic-responsive-source" type="image/avif" srcSet={`${awakening960Avif} 960w, ${awakening1672Avif} 1672w`} sizes="100vw" />
            <source data-testid="cinematic-responsive-source" type="image/webp" srcSet={`${awakening960Webp} 960w, ${awakening1672Webp} 1672w`} sizes="100vw" />
            <img className="cinematic-reveal-middle" src={awakening1672Webp} alt="Awakening Axiom creative core" loading="eager" decoding="async" />
          </picture>
          <picture>
            <source data-testid="cinematic-responsive-source" type="image/avif" srcSet={`${dormant960Avif} 960w, ${dormant1672Avif} 1672w`} sizes="100vw" />
            <source data-testid="cinematic-responsive-source" type="image/webp" srcSet={`${dormant960Webp} 960w, ${dormant1672Webp} 1672w`} sizes="100vw" />
            <img className="cinematic-reveal-front" src={dormant1672Webp} alt="Dormant Axiom creative core" loading="eager" decoding="async" />
          </picture>
          <div className="cinematic-reveal-seam" aria-hidden="true" />
          <div className="cinematic-hero-name">
            <p>A living creative operating system</p>
            <h1>Axiom Studio</h1>
            <span>Human intention enters once. Every studio remembers why.</span>
          </div>
          <div className="cinematic-hero-promise">
            <p>Powered by Axiom Imagine X</p>
            <h2>Create Without Limits</h2>
            <span>From first intent to editable, production-ready craft.</span>
            <div className="cinematic-hero-actions">
              <button type="button" className="primary-button" onClick={onStartCreating}>
                Start Creating
                <ChevronRight aria-hidden="true" size={15} />
              </button>
              <a className="ghost-link" href="#intelligence">Explore Axiom</a>
            </div>
          </div>
          <div className="cinematic-hero-scroll" aria-hidden="true"><span />Scroll to awaken</div>
        </div>
      </section>

      <section
        className="creative-operating-act intelligence-editorial-chapter"
        data-chapter="two-centers"
        data-design-language="atelier-editorial-v3"
        role="region"
        aria-label="Imagine X creative operating system"
      >
        <div className="creative-act-copy">
          <p className="eyebrow">Chapter II — The Two Centers</p>
          <h2>One intention. Two intelligence layers.</h2>
          <strong>Powered by Axiom Imagine X</strong>
          <p>
            Imagine X directs the work. Brain X preserves the context that makes it coherent. You remain
            the authority between direction and execution.
          </p>
          <div className="intelligence-center-pair">
            <article aria-label="Brain X intelligence role">
              <span aria-hidden="true">B</span>
              <div>
                <h3>Brain X</h3>
                <p>Holds project context, workspace policy, and continuity across the work.</p>
                <small>Context · policy · continuity</small>
              </div>
            </article>
            <article aria-label="Imagine X intelligence role">
              <span aria-hidden="true">I</span>
              <div>
                <h3>Imagine X</h3>
                <p>Turns your brief into visible direction and routes approved work to specialist studios.</p>
                <small>Direction · routing · critique</small>
              </div>
            </article>
          </div>
          <div className="hero-actions">
            <button type="button" className="primary-button" onClick={onStartCreating}>
              Start Crafting
              <ChevronRight size={16} />
            </button>
            <a className="ghost-link" href="#intelligence">Explore Axiom</a>
          </div>
        </div>

        <aside className="orchestration-field intelligence-ledger" aria-label="Studio intelligence in motion" data-ui-language="atelier-editorial-v3">
          <header>
            <div><span className="live-indicator" /><strong>From intent to editable output</strong></div>
            <span>{directorState.chapter.title} / ACTIVE</span>
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

        <div className="intelligence-principles" aria-label="Axiom operating principles">
          <span>Intent stays visible</span>
          <span>Authority stays human</span>
          <span>Outputs stay editable</span>
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

      <section
        id="studios"
        className="landing-section studio-atlas"
        data-chapter="studio-atlas"
        data-design-language="atelier-editorial-v3"
        role="region"
        aria-label="Axiom Studio Atlas"
      >
        <header className="studio-atlas-intro">
          <div>
            <p className="eyebrow">Chapter III — The Studio Atlas</p>
            <h2>Twelve specialist studios. One continuous creative system.</h2>
            <p className="studio-atlas-lede">
              Move from image to identity, interface to motion, and direction to delivery without losing
              the intent that began the work.
            </p>
          </div>
          <button type="button" className="ghost-button" onClick={onStartCreating}>
            Open Workspace
          </button>
        </header>
        <div className="studio-atlas-guide" aria-hidden="true">
          <span>Index / Studio</span><span>Role</span><span>Export</span>
        </div>
        <div className="studio-atlas-directory">
          {STUDIO_REGISTRY.filter((studio) => studio.id !== "mission-control").map((studio, index) => {
            const Icon = studio.icon;
            return (
              <article className="studio-atlas-entry" data-studio-id={studio.id} key={studio.id}>
                <div className="studio-atlas-identity">
                  <span>{String(index + 1).padStart(2, "0")}</span>
                  <Icon aria-hidden="true" size={20} />
                  <h3>{studio.displayName}</h3>
                </div>
                <p>{studio.summary}</p>
                <div className="studio-atlas-formats">
                  <span>{studio.exportFormats.join(" / ")}</span>
                  <ChevronRight aria-hidden="true" size={15} />
                </div>
              </article>
            );
          })}
        </div>
        <footer className="studio-atlas-footer">
          <span>12 disciplines</span><span>One governed workspace</span><span>Editable by design</span>
        </footer>
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
