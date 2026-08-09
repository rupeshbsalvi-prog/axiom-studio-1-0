import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { UiUxPanel } from "../UiUxPanel";

describe("UiUxPanel", () => {
  it("uses the approved professional Studio design language", () => {
    render(<UiUxPanel />);

    const workspace = screen.getByRole("region", { name: "UI/UX production workspace" });
    expect(workspace).toHaveAttribute("data-design-language", "axiom-pro-panel-v1");
    expect(within(workspace).getByRole("complementary", { name: "UI/UX frames and components" })).toBeInTheDocument();
    expect(within(workspace).getByRole("region", { name: "UI/UX product canvas" })).toBeInTheDocument();
    expect(within(workspace).getByRole("complementary", { name: "UI/UX properties and handoff" })).toBeInTheDocument();
  });

  it("switches between product screens", () => {
    render(<UiUxPanel />);

    fireEvent.click(screen.getByRole("button", { name: "Screen 2: Project workspace" }));

    expect(screen.getByRole("button", { name: "Screen 2: Project workspace" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("region", { name: "UI/UX product canvas" })).toHaveTextContent("Project workspace");
  });

  it("previews the selected responsive viewport", () => {
    render(<UiUxPanel />);

    fireEvent.click(screen.getByRole("button", { name: "Mobile viewport" }));

    expect(screen.getByRole("button", { name: "Mobile viewport" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("region", { name: "UI/UX product canvas" })).toHaveTextContent("390 × 844");
  });
});
