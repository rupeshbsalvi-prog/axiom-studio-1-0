import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { TypographyPanel } from "../TypographyPanel";

describe("TypographyPanel", () => {
  it("uses the approved professional Studio design language", () => {
    render(<TypographyPanel />);

    const workspace = screen.getByRole("region", { name: "Typography production workspace" });
    expect(workspace).toHaveAttribute("data-design-language", "axiom-pro-panel-v1");
    expect(within(workspace).getByRole("complementary", { name: "Typography planner and styles" })).toBeInTheDocument();
    expect(within(workspace).getByRole("region", { name: "Typography specimen canvas" })).toBeInTheDocument();
    expect(within(workspace).getByRole("complementary", { name: "Typography properties and audit" })).toBeInTheDocument();
  });

  it("previews edited specimen text without mutating project state", () => {
    render(<TypographyPanel />);

    fireEvent.change(screen.getByRole("textbox", { name: "Specimen text" }), {
      target: { value: "Intelligence made visible" },
    });

    expect(screen.getByRole("region", { name: "Typography specimen canvas" })).toHaveTextContent(
      "Intelligence made visible",
    );
  });
});
