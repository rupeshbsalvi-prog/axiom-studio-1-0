import { describe, expect, it, vi } from "vitest";

const threeProbe = vi.hoisted(() => ({ loaded: vi.fn() }));

vi.mock("three", async () => {
  threeProbe.loaded();
  return vi.importActual("three");
});

describe("cinematic bundle boundary", () => {
  it("does not load Three.js when the lightweight engine module is imported", async () => {
    await import("./CinematicExperienceEngine");

    expect(threeProbe.loaded).not.toHaveBeenCalled();
  });
});
