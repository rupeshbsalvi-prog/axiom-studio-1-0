import { fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import App from "./App";

async function enterLocalWorkspace(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole("button", { name: /Start Crafting/i }));
  await user.click(await screen.findByRole("button", { name: /Continue locally/i }));
}

describe("Axiom Studio 1.0 shell", () => {
  it("opens first-time public visitors into the Axiom Landing Experience", () => {
    render(<App />);

    const header = screen.getByRole("banner", { name: /Persistent landing navigation/i });
    expect(within(header).queryByRole("img", { name: /Axiom Studio brand logo/i })).not.toBeInTheDocument();
    expect(within(header).getByText(/^Axiom Studio$/i)).toBeInTheDocument();
    expect(screen.queryByLabelText(/Cinematic chapter timeline/i)).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /Create Without Limits/i })).toBeInTheDocument();
    expect(screen.getAllByText(/Powered by Axiom Imagine X/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/User Intent First/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/30-Day Free Trial/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Axiom Brain X/i).length).toBeGreaterThan(0);
  });

  it("presents the cinematic chapter timeline and persistent experience engine", () => {
    render(<App />);

    const engine = screen.getByLabelText(/Persistent cinematic experience engine/i);
    expect(engine).toBeInTheDocument();
    expect(engine).toHaveAttribute("data-chapter", "arrival");
    expect(engine).toHaveStyle("--fallback-accent: #f0d59a");
    expect(screen.getByLabelText(/Cinematic engine readiness/i)).toBeInTheDocument();
    expect(screen.getByText(/WEOS initializing|WEOS accessible scene/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Arrival/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Studio Universe/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Workspace Portal/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/Scene Manager/i)).toBeInTheDocument();
  });

  it("merges the Axiom identity into the cinematic awakening hero", () => {
    render(<App />);

    const header = screen.getByRole("banner", { name: /Persistent landing navigation/i });
    expect(header).toHaveAttribute("data-design-language", "atelier-editorial-v3");
    expect(within(header).getByText(/Edition 03 \/ 2026/i)).toBeInTheDocument();

    expect(screen.queryByRole("region", { name: /Axiom signature hero/i })).not.toBeInTheDocument();
    const hero = screen.getByRole("region", { name: /Axiom awakening reveal/i });
    expect(hero).toHaveAttribute("data-art-direction", "heirloom-editorial");
    expect(within(hero).getByRole("heading", { name: /^Axiom Studio$/i })).toBeInTheDocument();
    expect(within(hero).getByRole("heading", { name: /Create Without Limits/i })).toBeInTheDocument();
    expect(within(hero).getByText(/Volume I — Creative Intelligence/i)).toBeInTheDocument();
    expect(within(hero).getByText(/Human intention enters once\. Every studio remembers why\./i)).toBeInTheDocument();
    expect(within(hero).getByText(/Powered by Axiom Imagine X/i)).toBeInTheDocument();
    expect(within(hero).getByRole("button", { name: /^Start Creating$/i })).toBeInTheDocument();
    expect(within(hero).getByRole("link", { name: /^Explore Axiom$/i })).toHaveAttribute("href", "#intelligence");
    expect(within(hero).getByText(/Scroll to awaken/i)).toBeInTheDocument();
    expect(within(hero).queryByText(/Graphic designer.?quality finish|No Neon/i)).not.toBeInTheDocument();

    const creativeAct = screen.getByRole("region", { name: /Imagine X creative operating system/i });
    expect(creativeAct).toHaveAttribute("data-chapter", "two-centers");
    expect(creativeAct).toHaveAttribute("data-design-language", "atelier-editorial-v3");
    expect(within(creativeAct).getByText(/Chapter II — The Two Centers/i)).toBeInTheDocument();
    expect(within(creativeAct).getByRole("heading", { name: /One intention\. Two intelligence layers\./i })).toBeInTheDocument();
    const brainRole = within(creativeAct).getByRole("article", { name: /Brain X intelligence role/i });
    expect(within(brainRole).getByText(/Context · policy · continuity/i)).toBeInTheDocument();
    const imagineRole = within(creativeAct).getByRole("article", { name: /Imagine X intelligence role/i });
    expect(within(imagineRole).getByText(/Direction · routing · critique/i)).toBeInTheDocument();
    expect(within(creativeAct).getByText(/Powered by Axiom Imagine X/i)).toBeInTheDocument();
    expect(within(creativeAct).getByRole("button", { name: /Start Crafting/i })).toBeInTheDocument();
    expect(within(creativeAct).getByRole("link", { name: /Explore Axiom/i })).toBeInTheDocument();
    const orchestration = within(creativeAct).getByRole("complementary", { name: /Studio intelligence in motion/i });
    expect(orchestration).toHaveAttribute("data-ui-language", "atelier-editorial-v3");
    expect(within(orchestration).getByText(/From intent to editable output/i)).toBeInTheDocument();
    const route = within(orchestration).getByLabelText(/Axiom orchestration route/i);
    expect(within(route).getByText(/Creative intent/i)).toBeInTheDocument();
    expect(within(route).getByText(/Imagine X direction/i)).toBeInTheDocument();
    expect(within(route).getByText(/Brain X context/i)).toBeInTheDocument();
    expect(within(route).getByText(/Human approval/i)).toBeInTheDocument();
    expect(within(route).getByText(/Editable studio output/i)).toBeInTheDocument();
  });

  it("presents every specialist Studio in one condensed editorial atlas", () => {
    render(<App />);

    const atlas = screen.getByRole("region", { name: /Axiom Studio Atlas/i });
    expect(atlas).toHaveAttribute("data-chapter", "studio-atlas");
    expect(atlas).toHaveAttribute("data-design-language", "atelier-editorial-v3");
    expect(within(atlas).getByText(/Chapter III — The Studio Atlas/i)).toBeInTheDocument();
    expect(within(atlas).getByRole("heading", { name: /Twelve specialist studios\. One continuous creative system\./i })).toBeInTheDocument();
    expect(within(atlas).getAllByRole("article")).toHaveLength(12);
    expect(within(atlas).getByRole("heading", { name: /^Photo Studio$/i })).toBeInTheDocument();
    expect(within(atlas).getByRole("heading", { name: /^Brain X$/i })).toBeInTheDocument();
    expect(within(atlas).getByRole("button", { name: /Open Workspace/i })).toBeInTheDocument();
    expect(within(atlas).queryByLabelText(/Showcase categories/i)).not.toBeInTheDocument();
    expect(within(atlas).queryByLabelText(/Featured Axiom outputs/i)).not.toBeInTheDocument();
  });

  it("keeps cinematic developer diagnostics opt-in on the public landing page", () => {
    render(<App />);

    expect(screen.queryByText(/Quality preset & LOD/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Stress & diagnostics tools/i)).not.toBeInTheDocument();
  });

  it("reveals the three-state Axiom scene continuously in both scroll directions", () => {
    render(<App />);

    const reveal = screen.getByRole("region", { name: /Axiom awakening reveal/i });
    const front = within(reveal).getByRole("img", { name: /Dormant Axiom creative core/i });
    const awakening = within(reveal).getByRole("img", { name: /Awakening Axiom creative core/i });
    const resolved = within(reveal).getByRole("img", { name: /Resolved Axiom creative core/i });
    expect(reveal).toHaveAttribute("data-motion-system", "scroll-image-sequence-v2");
    expect(front).toHaveAttribute("src", expect.stringMatching(/axiom-portal-dormant-1672\.webp$/));
    expect(awakening).toHaveAttribute("src", expect.stringMatching(/axiom-portal-awakening-1672\.webp$/));
    expect(resolved).toHaveAttribute("src", expect.stringMatching(/axiom-portal-resolved-1672\.webp$/));
    const sources = within(reveal).getAllByTestId("cinematic-responsive-source");
    expect(sources).toHaveLength(6);
    expect(sources.map((source) => source.getAttribute("type"))).toEqual([
      "image/avif",
      "image/webp",
      "image/avif",
      "image/webp",
      "image/avif",
      "image/webp",
    ]);
    for (const source of sources) {
      expect(source).toHaveAttribute("sizes", "100vw");
      expect(source.getAttribute("srcset")).toMatch(/-960\.(avif|webp) 960w, .*-(1672)\.(avif|webp) 1672w$/);
    }

    const frameCallbacks: FrameRequestCallback[] = [];
    vi.spyOn(window, "requestAnimationFrame").mockImplementation((callback) => {
      frameCallbacks.push(callback);
      return frameCallbacks.length;
    });
    const travel = Math.max(1200 - window.innerHeight, 1);
    vi.spyOn(reveal, "getBoundingClientRect").mockReturnValue({
      bottom: 1200 - travel / 2,
      height: 1200,
      left: 0,
      right: 1000,
      top: -(travel * 0.75),
      width: 1000,
      x: 0,
      y: -(travel * 0.75),
      toJSON: () => ({}),
    });

    fireEvent.scroll(window);
    frameCallbacks.at(-1)?.(0);
    expect(reveal.style.getPropertyValue("--reveal-clip")).toBe("75%");
    expect(reveal.style.getPropertyValue("--resolve-opacity")).toBe("50%");
  });

  it("offers a scroll-world route through the persistent Axiom scene", async () => {
    const user = userEvent.setup();
    const scrollTo = vi.fn();
    Object.defineProperty(window, "scrollTo", {
      configurable: true,
      value: scrollTo,
    });

    render(<App />);

    const route = screen.getByRole("navigation", { name: /Axiom scroll world route/i });
    expect(within(route).getAllByRole("button")).toHaveLength(12);
    expect(within(route).getByRole("button", { name: /Fly to Arrival/i })).toHaveAttribute(
      "aria-current",
      "step",
    );

    await user.click(within(route).getByRole("button", { name: /Fly to Studio Universe/i }));
    expect(scrollTo).toHaveBeenCalledWith(expect.objectContaining({ top: expect.any(Number) }));
  });

  it("enters the Workspace Hub and can switch to UI/UX Studio", async () => {
    const user = userEvent.setup();
    render(<App />);

    await enterLocalWorkspace(user);

    expect(screen.getByRole("img", { name: "Axiom Studio brand logo" })).toHaveAttribute(
      "src",
      expect.stringMatching(/axiom-logo-ui-512\.webp$/),
    );
    expect(screen.getByRole("heading", { name: /Mission Control/i })).toBeInTheDocument();
    expect(screen.getAllByTestId("studio-nav-item")).toHaveLength(13);
    expect(screen.getByRole("region", { name: /Studio production surface/i })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /UI\/UX Studio/i }));

    expect(screen.getByRole("heading", { name: /UI\/UX Studio/i })).toBeInTheDocument();
    expect(screen.getByRole("region", { name: /UI\/UX product canvas/i })).toBeInTheDocument();
    expect(within(screen.getByLabelText(/Inspector/i)).getByText(/foundation fallback/i)).toBeInTheDocument();
    expect(within(screen.getByLabelText(/Inspector/i)).getByText(/fallback canvas/i)).toBeInTheDocument();
    expect(within(screen.getByLabelText(/Inspector/i)).getByText(/no runtime authority/i)).toBeInTheDocument();
    expect(within(screen.getByLabelText(/Inspector/i)).getByText(/read project: blocked/i)).toBeInTheDocument();
  });

  it("routes real studio panels through the workspace panel router", async () => {
    const user = userEvent.setup();
    render(<App />);

    await enterLocalWorkspace(user);
    await user.click(screen.getByRole("button", { name: /Photo Studio/i }));

    expect(screen.getByRole("heading", { name: /Photo Studio/i })).toBeInTheDocument();
    expect(await screen.findByText(/Active Composition Canvas/i, undefined, { timeout: 5000 })).toBeInTheDocument();
    const inspector = screen.getByLabelText(/Inspector/i);
    expect(await within(inspector).findByText(/lazy runtime registered/i)).toBeInTheDocument();
    expect(await within(inspector).findByText(/first-party/i)).toBeInTheDocument();
    expect(await within(inspector).findByText(/studio-panel, lifecycle, generation-canvas/i)).toBeInTheDocument();
    expect(await within(inspector).findByText(/read project, write canvas, export, providers, approval required/i)).toBeInTheDocument();
    expect(
      await within(inspector).findByText(/read project: allowed, write canvas: allowed, export: allowed, use providers: allowed/i),
    ).toBeInTheDocument();
    expect(await within(inspector).findAllByText(/^photo$/i)).toHaveLength(2);

    await user.click(screen.getByRole("button", { name: /Vector Studio/i }));

    expect(screen.getByRole("heading", { name: /Vector Studio/i })).toBeInTheDocument();
    expect(await screen.findByText(/SVG Workspace Viewport/i, undefined, { timeout: 5000 })).toBeInTheDocument();
    expect(await within(inspector).findByText(/photo, vector/i)).toBeInTheDocument();
  }, 10000);

  it("creates a local project draft from Mission Control", async () => {
    const user = userEvent.setup();
    render(<App />);

    await enterLocalWorkspace(user);
    await user.clear(screen.getByLabelText(/Project name/i));
    await user.type(screen.getByLabelText(/Project name/i), "Founder Launch");
    await user.type(screen.getByLabelText(/Creative intent/i), "Create a launch poster with motion-ready brand assets");
    await user.click(screen.getByRole("button", { name: /Create local draft/i }));

    expect(screen.getByText(/Founder Launch/i)).toBeInTheDocument();
    expect(screen.getByText(/AXPKG draft ready/i)).toBeInTheDocument();
  }, 10000);
});
