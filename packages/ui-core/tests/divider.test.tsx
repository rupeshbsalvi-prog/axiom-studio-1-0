import React, { useRef, useEffect } from "react";
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { colors, spacing } from "@axiom/tokens";
import { Divider } from "../src/components/Divider/Divider";

describe("Divider Component", () => {
  it("should render default tag (hr) and horizontal orientation style", () => {
    render(<Divider data-testid="div" />);
    const el = screen.getByTestId("div");
    expect(el.tagName).toBe("HR");
    expect(el.style.width).toBe("100%");
    expect(el.getAttribute("role")).toBe("separator");
    expect(el.getAttribute("aria-orientation")).toBe("horizontal");
  });

  it("should support polymorphic rendering (as)", () => {
    render(<Divider as="div" data-testid="div" />);
    const el = screen.getByTestId("div");
    expect(el.tagName).toBe("DIV");
  });

  it("should support vertical orientation", () => {
    render(<Divider orientation="vertical" data-testid="div" />);
    const el = screen.getByTestId("div");
    expect(el.style.height).toBe("100%");
    expect(el.getAttribute("aria-orientation")).toBe("vertical");
  });

  it("should support custom spacing", () => {
    render(<Divider spacing="lg" data-testid="div" />);
    const el = screen.getByTestId("div");
    expect(el.style.marginTop).toBe(spacing.lg);
    expect(el.style.marginBottom).toBe(spacing.lg);
  });

  it("should render label and use div tag by default when labeled", () => {
    render(<Divider label="Separator Label" data-testid="div" />);
    const el = screen.getByTestId("div");
    expect(el.tagName).toBe("DIV");
    expect(screen.getByText("Separator Label")).toBeInTheDocument();
    expect(el.style.display).toBe("flex");
    expect(el.style.alignItems).toBe("center");
  });

  it("should forward ref correctly", () => {
    let refNode: HTMLHRElement | null = null;
    const TestComp = () => {
      const ref = useRef<HTMLHRElement>(null);
      useEffect(() => {
        refNode = ref.current;
      }, []);
      return <Divider ref={ref} data-testid="div" />;
    };
    render(<TestComp />);
    const el = screen.getByTestId("div");
    expect(refNode).toBe(el);
  });
});
