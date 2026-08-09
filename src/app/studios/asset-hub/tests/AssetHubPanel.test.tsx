import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { AssetHubPanel } from "../AssetHubPanel";

describe("AssetHubPanel", () => {
  it("uses the approved professional Studio design language", () => {
    render(<AssetHubPanel />);

    const workspace = screen.getByRole("region", { name: "Asset Hub production workspace" });
    expect(workspace).toHaveAttribute("data-design-language", "axiom-pro-panel-v1");
    expect(within(workspace).getByRole("complementary", { name: "Asset collections and filters" })).toBeInTheDocument();
    expect(within(workspace).getByRole("region", { name: "Asset library canvas" })).toBeInTheDocument();
    expect(within(workspace).getByRole("complementary", { name: "Asset provenance and delivery" })).toBeInTheDocument();
  });

  it("switches between governed asset collections", () => {
    render(<AssetHubPanel />);

    fireEvent.click(screen.getByRole("button", { name: "Collection 3: Product UI" }));

    expect(screen.getByRole("button", { name: "Collection 3: Product UI" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("region", { name: "Asset library canvas" })).toHaveTextContent("Product UI");
  });

  it("shows provenance for the selected asset", () => {
    render(<AssetHubPanel />);

    fireEvent.click(screen.getByRole("button", { name: "Asset: Campaign portrait" }));

    const inspector = screen.getByRole("complementary", { name: "Asset provenance and delivery" });
    expect(inspector).toHaveTextContent("Campaign portrait");
    expect(inspector).toHaveTextContent("Camera original + governed grade");
  });
});
