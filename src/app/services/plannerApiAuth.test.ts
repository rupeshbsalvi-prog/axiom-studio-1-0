import { describe, expect, it, vi } from "vitest";
import { generateBrainPlan } from "./brainApi";
import { planPhotoComposition } from "./photoApi";
import { planVectorComposition } from "./vectorApi";


describe("authenticated planner API boundary", () => {
  it("uses same-origin credentialed requests for every planner", async () => {
    vi.mocked(fetch).mockImplementation(async () => (
      new Response("{}", { status: 200, headers: { "Content-Type": "application/json" } })
    ));

    await generateBrainPlan({ intent: "Create a poster" });
    await planPhotoComposition({ intent: "Create a poster" });
    await planVectorComposition({ intent: "Create a logo" });

    expect(vi.mocked(fetch).mock.calls.map(([url, options]) => ({
      url,
      credentials: options?.credentials,
    }))).toEqual([
      { url: "/api/brain/plan", credentials: "include" },
      { url: "/api/photo/plan", credentials: "include" },
      { url: "/api/vector/plan", credentials: "include" },
    ]);
  });
});
