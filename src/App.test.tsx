import { render, screen, within } from "@testing-library/react";
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
    expect(within(header).getByRole("img", { name: /Axiom Studio brand logo/i })).toHaveAttribute(
      "src",
      expect.stringMatching(/axiom-logo-ui-512\.webp$/),
    );
    expect(screen.getByRole("heading", { name: /Create Without Limits/i })).toBeInTheDocument();
    expect(screen.getByText(/Powered by Axiom Imagine X/i)).toBeInTheDocument();
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

  it("presents a cinematic signature hero and a separate Imagine X creative act", () => {
    render(<App />);

    const signature = screen.getByRole("region", { name: /Axiom signature hero/i });
    expect(within(signature).getByRole("heading", { name: /^Axiom Studio$/i })).toBeInTheDocument();
    const heroArt = within(signature).getByRole("img", { name: /Animated Axiom mind/i });
    expect(heroArt.querySelector("img")).toHaveAttribute(
      "srcset",
      expect.stringMatching(/axiom-logo-ui-512\.webp 512w.*axiom-logo-display-1024\.webp 1024w.*axiom-logo-hero-2048\.webp 2048w/),
    );
    expect(within(signature).getByRole("heading", { name: /Create Without Limits/i })).toBeInTheDocument();

    const creativeAct = screen.getByRole("region", { name: /Imagine X creative operating system/i });
    expect(within(creativeAct).getByText(/AI-native creative operating system/i)).toBeInTheDocument();
    expect(within(creativeAct).getByText(/Powered by Axiom Imagine X/i)).toBeInTheDocument();
    expect(within(creativeAct).getByRole("button", { name: /Start Crafting/i })).toBeInTheDocument();
    expect(within(creativeAct).getByRole("link", { name: /Explore Axiom/i })).toBeInTheDocument();
    expect(within(creativeAct).getByRole("complementary", { name: /Studio intelligence in motion/i })).toBeInTheDocument();
  });

  it("keeps complete chapter names inside a persistent numberless landing header", () => {
    render(<App />);

    const header = screen.getByRole("banner", { name: /Persistent landing navigation/i });
    expect(header).toHaveAttribute("data-persistent", "true");
    const timeline = within(header).getByLabelText(/Cinematic chapter timeline/i);
    expect(within(timeline).getByRole("button", { name: /Go to Arrival chapter/i })).toHaveAttribute(
      "aria-current",
      "step",
    );
    expect(within(timeline).getByRole("button", { name: /Go to Living Observatory chapter/i })).toHaveTextContent(
      "Living Observatory",
    );
    expect(within(timeline).getByRole("button", { name: /Go to Workspace Portal chapter/i })).toHaveTextContent(
      "Workspace Portal",
    );
    expect(within(timeline).queryByText("01")).not.toBeInTheDocument();
  });

  it("lets keyboard and button users request WEOS chapter navigation", async () => {
    const user = userEvent.setup();
    const scrollTo = vi.fn();
    Object.defineProperty(window, "scrollTo", {
      configurable: true,
      value: scrollTo,
    });

    render(<App />);

    const arrival = screen.getByRole("button", { name: /Go to Arrival chapter/i });
    const awakening = screen.getByRole("button", { name: /Go to Awakening chapter/i });
    const workspacePortal = screen.getByRole("button", { name: /Go to Workspace Portal chapter/i });

    expect(arrival).toHaveAttribute("aria-current", "step");

    await user.click(awakening);
    expect(scrollTo).toHaveBeenCalledWith(expect.objectContaining({ behavior: expect.any(String) }));

    arrival.focus();
    await user.keyboard("{End}");
    expect(scrollTo).toHaveBeenLastCalledWith(expect.objectContaining({ top: expect.any(Number) }));
    expect(workspacePortal).toBeInTheDocument();
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
    expect(screen.getByText(/editable frames, components, tokens/i)).toBeInTheDocument();
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
