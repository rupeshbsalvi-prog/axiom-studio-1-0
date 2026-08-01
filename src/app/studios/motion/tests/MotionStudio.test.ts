import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { MotionStudio } from "../MotionStudio";
import { platformRuntime } from "../../../../platform/runtime/PlatformRuntime";
import { stateService } from "../../../../platform/services/StateService";
import { eventBus } from "../../../../platform/services/EventBus";
import { getStudioRuntimeEntry } from "../../../../workspace/StudioRuntimeRegistry";

describe("MotionStudio Lifecycle", () => {
  let studio: MotionStudio;

  beforeEach(() => {
    studio = new MotionStudio();
  });

  afterEach(() => {
    try {
      studio.dispose();
    } catch {
      // Already disposed
    }
    stateService.clear();
    eventBus.clear();
  });

  it("1. registers as first-party implemented studio", () => {
    const entry = getStudioRuntimeEntry("motion");
    expect(entry).toBeDefined();
    expect(entry?.source).toBe("first-party");
    expect(entry?.status).toBe("implemented");
  });

  it("2. initializes default timeline state", () => {
    studio.initialize();
    const state = stateService.getState()["motion.state"];
    expect(state).toBeDefined();
    expect(state.playheadFrame).toBe(0);
    expect(state.durationFrames).toBe(100);
    expect(state.isPlaying).toBe(false);
  });

  it("3. starts telemetry only once on activation", () => {
    studio.initialize();
    
    // We mock setInterval to verify it is called exactly once
    const setIntervalSpy = vi.spyOn(globalThis, "setInterval");
    
    studio.activate();
    expect(setIntervalSpy).toHaveBeenCalledTimes(1);

    // Call activate again; should not call setInterval again
    studio.activate();
    expect(setIntervalSpy).toHaveBeenCalledTimes(1);
    
    setIntervalSpy.mockRestore();
  });

  it("4. deactivation stops telemetry", () => {
    studio.initialize();
    const clearIntervalSpy = vi.spyOn(globalThis, "clearInterval");
    
    studio.activate();
    studio.deactivate();
    
    expect(clearIntervalSpy).toHaveBeenCalledTimes(1);
    clearIntervalSpy.mockRestore();
  });

  it("5. dispose clears intervals and unregisters from runtime", () => {
    const unregisterSpy = vi.spyOn(platformRuntime, "unregisterStudio");
    const clearIntervalSpy = vi.spyOn(globalThis, "clearInterval");

    studio.initialize();
    studio.activate();
    studio.dispose();

    expect(unregisterSpy).toHaveBeenCalledWith(studio);
    expect(clearIntervalSpy).toHaveBeenCalledTimes(1);

    unregisterSpy.mockRestore();
    clearIntervalSpy.mockRestore();
  });
});
