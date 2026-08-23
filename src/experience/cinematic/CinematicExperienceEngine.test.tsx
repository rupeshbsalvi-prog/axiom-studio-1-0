import { render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { buildExperienceDirectorState } from "../director/ExperienceDirector";
import { CinematicExperienceEngine } from "./CinematicExperienceEngine";

const threeRuntimeProbe = vi.hoisted(() => ({ loaded: vi.fn() }));

vi.mock("./threeRuntime", () => {
  threeRuntimeProbe.loaded();
  throw new Error("Low-tier rendering must not load Three.js");
});

describe("CinematicExperienceEngine performance governor", () => {
  const webGlDescriptor = Object.getOwnPropertyDescriptor(window, "WebGLRenderingContext");

  afterEach(() => {
    threeRuntimeProbe.loaded.mockClear();
    if (webGlDescriptor) Object.defineProperty(window, "WebGLRenderingContext", webGlDescriptor);
    else delete (window as Window & { WebGLRenderingContext?: unknown }).WebGLRenderingContext;
  });

  it("keeps low-tier visitors on the CSS fallback without loading Three.js", async () => {
    Object.defineProperty(window, "WebGLRenderingContext", { configurable: true, value: class {} });
    const state = buildExperienceDirectorState(0, { reducedMotion: false, hardwareTier: "low" });

    render(<CinematicExperienceEngine directorState={state} />);

    await waitFor(() => expect(screen.getByLabelText(/Persistent cinematic experience engine/i)).toHaveClass("status-fallback"));
    expect(threeRuntimeProbe.loaded).not.toHaveBeenCalled();
  });
});
