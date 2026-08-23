import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { WhiteboardPanel } from "../WhiteboardPanel";

describe("WhiteboardPanel", () => {
  it("uses the shared professional Studio design language", () => {
    render(<WhiteboardPanel />);

    const workspace = screen.getByRole("region", { name: "Whiteboard production workspace" });
    expect(workspace).toHaveAttribute("data-design-language", "axiom-pro-panel-v1");
    expect(within(workspace).getByRole("complementary", { name: "Boards and facilitation tools" })).toBeInTheDocument();
    expect(within(workspace).getByRole("region", { name: "Whiteboard canvas" })).toBeInTheDocument();
    expect(within(workspace).getByRole("complementary", { name: "Board structure and collaboration" })).toBeInTheDocument();
  });

  it("switches between local boards and views", () => {
    render(<WhiteboardPanel />);

    fireEvent.click(screen.getByRole("button", { name: "Board 2: Product map" }));
    fireEvent.click(screen.getByRole("button", { name: "Flow view" }));

    expect(screen.getByRole("button", { name: "Board 2: Product map" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: "Flow view" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("region", { name: "Whiteboard canvas" })).toHaveTextContent("Product map");
  });

  it("keeps live collaboration gated pending session authority", () => {
    render(<WhiteboardPanel />);

    expect(screen.getByRole("button", { name: "Invite collaborators" })).toBeDisabled();
    expect(screen.getByText("Live collaboration requires authenticated workspace authority.")).toBeInTheDocument();
  });
});
