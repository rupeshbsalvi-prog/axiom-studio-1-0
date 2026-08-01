import { describe, expect, it } from "vitest";
import {
  buildExperienceDirectorState,
  buildExperienceRenderDirective,
  buildDirectorCue,
  detectHardwareTierFromSignals,
  getChapterAtProgress,
  getChapterIndexAtProgress,
  getChapterRangeAtProgress,
  getWEOSJourney,
  resolveQualityProfile,
} from "./ExperienceDirector";

describe("ExperienceDirector", () => {
  it("defines the WEOS journey from Arrival to Workspace Portal", () => {
    const journey = getWEOSJourney();

    expect(journey).toHaveLength(12);
    expect(journey[0]).toMatchObject({
      id: "arrival",
      title: "Arrival",
      act: "Act I",
      cameraPreset: "85mm cold open",
    });
    expect(journey.at(-1)).toMatchObject({
      id: "workspace-portal",
      title: "Workspace Portal",
      act: "Act X",
      cameraPreset: "portal push",
    });
  });

  it("maps scroll progress into stable chapter cues", () => {
    expect(getChapterAtProgress(-1).id).toBe("arrival");
    expect(getChapterAtProgress(0.5).id).toBe("studio-exploration");
    expect(getChapterAtProgress(2).id).toBe("workspace-portal");
    expect(getChapterIndexAtProgress(0)).toBe(0);
    expect(getChapterIndexAtProgress(0.999999)).toBe(11);
  });

  it("returns chapter range metadata for local progress choreography", () => {
    const range = getChapterRangeAtProgress(0.5);

    expect(range.index).toBe(5);
    expect(range.start).toBeCloseTo(5 / 12);
    expect(range.end).toBeCloseTo(6 / 12);
    expect(range.localProgress).toBeCloseTo(1);
  });

  it("builds director cues for camera, lighting, particles, audio, theme, and portal readiness", () => {
    const cue = buildDirectorCue(0.5, { reducedMotion: false, hardwareTier: "high" });

    expect(cue.chapter.id).toBe("studio-exploration");
    expect(cue.camera.mode).toBe("macro district glide");
    expect(cue.lighting.mood).toBe("museum gold with cyan reflections");
    expect(cue.particles.behavior).toBe("studio node orbit");
    expect(cue.audio.intent).toBe("district reveal swell");
    expect(cue.theme.world).toBe("Living Observatory");
    expect(cue.portal.ready).toBe(false);
  });

  it("prioritizes reduced motion and low hardware quality", () => {
    const cue = buildDirectorCue(0.98, { reducedMotion: true, hardwareTier: "low" });

    expect(cue.chapter.id).toBe("workspace-portal");
    expect(cue.camera.mode).toBe("locked accessible chapter focus");
    expect(cue.quality.profile).toBe("low");
    expect(cue.quality.particleBudget).toBeLessThan(400);
    expect(cue.portal.ready).toBe(true);
  });

  it("resolves quality profiles from hardware tiers", () => {
    expect(resolveQualityProfile("high")).toMatchObject({ profile: "high", particleBudget: 1400 });
    expect(resolveQualityProfile("medium")).toMatchObject({ profile: "medium", particleBudget: 750 });
    expect(resolveQualityProfile("low")).toMatchObject({ profile: "low", particleBudget: 260 });
  });

  it("detects hardware tiers from browser capability signals", () => {
    expect(detectHardwareTierFromSignals({ deviceMemoryGB: 16, hardwareConcurrency: 12, devicePixelRatio: 1 })).toBe(
      "high",
    );
    expect(detectHardwareTierFromSignals({ deviceMemoryGB: 8, hardwareConcurrency: 8, devicePixelRatio: 2 })).toBe(
      "medium",
    );
    expect(detectHardwareTierFromSignals({ deviceMemoryGB: 4, hardwareConcurrency: 4, devicePixelRatio: 3 })).toBe(
      "low",
    );
  });

  it("builds a complete director state for UI and render wiring", () => {
    const state = buildExperienceDirectorState(0.98, { reducedMotion: false, hardwareTier: "medium" });

    expect(state.chapter.id).toBe("workspace-portal");
    expect(state.previousChapter?.id).toBe("future");
    expect(state.nextChapter).toBeNull();
    expect(state.isFinalChapter).toBe(true);
    expect(state.cue.quality.profile).toBe("medium");
    expect(state.completionLabel).toBe("Workspace portal ready");
  });

  it("builds render directives from director state without reopening runtime contracts", () => {
    const state = buildExperienceDirectorState(0.35, { reducedMotion: false, hardwareTier: "high" });
    const directive = buildExperienceRenderDirective(state);

    expect(directive.cameraTarget.easing).toBe(0.045);
    expect(directive.cameraTarget.z).toBeLessThan(9);
    expect(directive.scene.accentColor).toMatch(/^#/);
    expect(directive.core.particleDensity).toBe(1);
    expect(directive.motion.studioOrbitSpeed).toBeGreaterThan(0.06);
  });

  it("dampens render directives for reduced motion and lower hardware", () => {
    const state = buildExperienceDirectorState(0.35, { reducedMotion: true, hardwareTier: "low" });
    const directive = buildExperienceRenderDirective(state);

    expect(directive.cameraTarget.x).toBe(0);
    expect(directive.cameraTarget.easing).toBe(0.02);
    expect(directive.core.particleDensity).toBeLessThan(0.5);
    expect(directive.motion.ringOrbitSpeed).toBe(0.01);
  });
});
