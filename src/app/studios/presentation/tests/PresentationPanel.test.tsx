import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { PresentationPanel } from "../PresentationPanel";

describe("PresentationPanel", () => {
  it("uses the approved professional Studio design language", () => {
    render(<PresentationPanel />);

    const workspace = screen.getByRole("region", { name: "Presentation production workspace" });
    expect(workspace).toHaveAttribute("data-design-language", "axiom-pro-panel-v1");
    expect(within(workspace).getByRole("complementary", { name: "Presentation planner and slides" })).toBeInTheDocument();
    expect(within(workspace).getByRole("region", { name: "Presentation slide canvas" })).toBeInTheDocument();
    expect(within(workspace).getByRole("complementary", { name: "Presentation properties and notes" })).toBeInTheDocument();
  });

  it("selects a slide and previews its editable content", () => {
    render(<PresentationPanel />);

    fireEvent.click(screen.getByRole("button", { name: "Slide 2: The opportunity" }));

    expect(screen.getByRole("region", { name: "Presentation slide canvas" })).toHaveTextContent("The creative stack is fragmented");
    expect(screen.getByRole("button", { name: "Slide 2: The opportunity" })).toHaveAttribute("aria-pressed", "true");
  });

  it("keeps speaker notes editable in local preview state", () => {
    render(<PresentationPanel />);

    fireEvent.change(screen.getByRole("textbox", { name: "Speaker notes" }), {
      target: { value: "Pause here for the customer story." },
    });

    expect(screen.getByRole("textbox", { name: "Speaker notes" })).toHaveValue("Pause here for the customer story.");
  });
});
