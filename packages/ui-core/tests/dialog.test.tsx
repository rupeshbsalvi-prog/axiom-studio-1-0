import React, { useState } from "react";
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import { axe } from "vitest-axe";
import * as axeMatchers from "vitest-axe/matchers";

expect.extend(axeMatchers);
import {
  Dialog,
  DialogOverlay,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "../src/components/Dialog";

function TestDialog({ defaultOpen = true }: { defaultOpen?: boolean }) {
  const [open, onOpenChange] = useState(defaultOpen);
  return (
    <div>
      <button data-testid="trigger" onClick={() => onOpenChange(true)}>Open</button>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogOverlay />
        <DialogContent>
          <DialogTitle>Test Title</DialogTitle>
          <DialogDescription>Test Description</DialogDescription>
          <button data-testid="inside-btn-1">Inside Button 1</button>
          <button data-testid="inside-btn-2">Inside Button 2</button>
        </DialogContent>
      </Dialog>
    </div>
  );
}

describe("Dialog Component", () => {
  it("renders correctly when open and has no accessibility violations", async () => {
    const { container } = render(<TestDialog defaultOpen={true} />);
    expect(screen.getByTestId("dialog-overlay")).toBeInTheDocument();
    expect(screen.getByTestId("dialog-content")).toBeInTheDocument();
    expect(screen.getByText("Test Title")).toBeInTheDocument();
    expect(screen.getByText("Test Description")).toBeInTheDocument();

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it("does not render when closed", () => {
    render(<TestDialog defaultOpen={false} />);
    expect(screen.queryByTestId("dialog-overlay")).not.toBeInTheDocument();
    expect(screen.queryByTestId("dialog-content")).not.toBeInTheDocument();
  });

  it("closes when clicking the overlay", async () => {
    const user = userEvent.setup();
    render(<TestDialog defaultOpen={true} />);
    
    const overlay = screen.getByTestId("dialog-overlay");
    await user.click(overlay);

    expect(screen.queryByTestId("dialog-content")).not.toBeInTheDocument();
  });

  it("closes when pressing the Escape key", async () => {
    const user = userEvent.setup();
    render(<TestDialog defaultOpen={true} />);

    await user.keyboard("{Escape}");

    expect(screen.queryByTestId("dialog-content")).not.toBeInTheDocument();
  });

  it("traps focus and loops focus correctly on Tab keypresses", async () => {
    const user = userEvent.setup();
    render(<TestDialog defaultOpen={true} />);

    const btn1 = screen.getByTestId("inside-btn-1");
    const btn2 = screen.getByTestId("inside-btn-2");

    // Auto-focus should focus the first focusable element inside the dialog content
    expect(document.activeElement).toBe(btn1);

    // Tab to btn2
    await user.tab();
    expect(document.activeElement).toBe(btn2);

    // Tab loops back to btn1
    await user.tab();
    expect(document.activeElement).toBe(btn1);

    // Shift+Tab loops back to btn2
    await user.tab({ shift: true });
    expect(document.activeElement).toBe(btn2);
  });
});
