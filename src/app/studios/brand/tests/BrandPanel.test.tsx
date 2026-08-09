import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { BrandPanel } from "../BrandPanel";

describe("BrandPanel", () => {
  it("uses the approved professional Studio design language", () => {
    render(<BrandPanel />);

    const workspace = screen.getByRole("region", { name: "Brand production workspace" });
    expect(workspace).toHaveAttribute("data-design-language", "axiom-pro-panel-v1");
    expect(within(workspace).getByRole("complementary", { name: "Brand kit and assets" })).toBeInTheDocument();
    expect(within(workspace).getByRole("region", { name: "Brand identity canvas" })).toBeInTheDocument();
    expect(within(workspace).getByRole("complementary", { name: "Brand governance and tokens" })).toBeInTheDocument();
  });

  it("previews edited brand messaging without mutating project state", () => {
    render(<BrandPanel />);

    fireEvent.change(screen.getByRole("textbox", { name: "Brand promise" }), {
      target: { value: "Creativity, governed beautifully" },
    });

    expect(screen.getByRole("region", { name: "Brand identity canvas" })).toHaveTextContent(
      "Creativity, governed beautifully",
    );
  });

  it("keeps the approved promise visible when the local field is empty", () => {
    render(<BrandPanel />);

    fireEvent.change(screen.getByRole("textbox", { name: "Brand promise" }), { target: { value: "" } });

    expect(screen.getByRole("region", { name: "Brand identity canvas" })).toHaveTextContent("Create without limits");
  });

  it("switches between identity application previews", () => {
    render(<BrandPanel />);

    fireEvent.click(screen.getByRole("button", { name: "Application 2: Product surface" }));

    expect(screen.getByRole("button", { name: "Application 2: Product surface" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("region", { name: "Brand identity canvas" })).toHaveTextContent("Product surface");
  });
});
