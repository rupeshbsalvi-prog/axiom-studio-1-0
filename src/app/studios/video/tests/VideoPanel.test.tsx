import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { VideoPanel } from "../VideoPanel";

describe("VideoPanel", () => {
  it("uses the shared professional Studio design language", () => {
    render(<VideoPanel />);

    const workspace = screen.getByRole("region", { name: "Video production workspace" });
    expect(workspace).toHaveAttribute("data-design-language", "axiom-pro-panel-v1");
    expect(within(workspace).getByRole("complementary", { name: "Video scenes and media" })).toBeInTheDocument();
    expect(within(workspace).getByRole("region", { name: "Video editorial canvas" })).toBeInTheDocument();
    expect(within(workspace).getByRole("complementary", { name: "Video continuity and delivery" })).toBeInTheDocument();
  });

  it("switches the active scene and editorial preview", () => {
    render(<VideoPanel />);

    fireEvent.click(screen.getByRole("button", { name: "Scene 2: Product reveal" }));

    expect(screen.getByRole("button", { name: "Scene 2: Product reveal" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("region", { name: "Video editorial canvas" })).toHaveTextContent("Product reveal");

    fireEvent.click(screen.getByRole("button", { name: "Scene 3: Human direction" }));
    expect(screen.getByRole("region", { name: "Video editorial canvas" })).toHaveTextContent("00:18:12");
  });

  it("keeps media upload gated pending persistence authority", () => {
    render(<VideoPanel />);

    expect(screen.getByRole("button", { name: "Upload media" })).toBeDisabled();
    expect(screen.getByText("Upload unavailable until persistence authority is approved.")).toBeInTheDocument();
  });
});
