import React, { useRef, useEffect } from "react";
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { colors } from "@axiom/tokens";
import { Icon } from "../src/components/Icon/Icon";

function hexToRgb(hex: string): string {
  const clean = hex.replace("#", "");
  const r = parseInt(clean.substring(0, 2), 16);
  const g = parseInt(clean.substring(2, 4), 16);
  const b = parseInt(clean.substring(4, 6), 16);
  return `rgb(${r}, ${g}, ${b})`;
}

describe("Icon Component", () => {
  it("should render default size and aria-hidden when no label provided", () => {
    render(<Icon name="check" data-testid="icon" />);
    const el = screen.getByTestId("icon");
    expect(el.tagName).toBe("svg");
    expect(el.style.width).toBe("24px");
    expect(el.style.height).toBe("24px");
    expect(el.getAttribute("aria-hidden")).toBe("true");
    expect(el.getAttribute("role")).toBeNull();
  });

  it("should support custom sizes", () => {
    const { rerender } = render(<Icon name="check" size={32} data-testid="icon" />);
    expect(screen.getByTestId("icon").style.width).toBe("32px");

    rerender(<Icon name="check" size="2rem" data-testid="icon" />);
    expect(screen.getByTestId("icon").style.width).toBe("2rem");
  });

  it("should resolve color token keys", () => {
    render(<Icon name="check" color="primary" data-testid="icon" />);
    const el = screen.getByTestId("icon");
    expect(el.style.color).toBe(hexToRgb(colors.primary));
  });

  it("should accept custom CSS colors", () => {
    render(<Icon name="check" color="red" data-testid="icon" />);
    const el = screen.getByTestId("icon");
    expect(el.style.color).toBe("red");
  });

  it("should support a11y label", () => {
    render(<Icon name="close" label="Close button" data-testid="icon" />);
    const el = screen.getByTestId("icon");
    expect(el.getAttribute("role")).toBe("img");
    expect(el.getAttribute("aria-label")).toBe("Close button");
    expect(el.getAttribute("aria-hidden")).toBeNull();
  });

  it("should apply spin animation to spinner icon", () => {
    render(<Icon name="spinner" data-testid="icon" />);
    const el = screen.getByTestId("icon");
    expect(el.style.animation).toContain("ax-spin");
  });

  it("should forward ref correctly", () => {
    let refNode: SVGSVGElement | null = null;
    const TestComp = () => {
      const ref = useRef<SVGSVGElement>(null);
      useEffect(() => {
        refNode = ref.current;
      }, []);
      return <Icon ref={ref} name="check" data-testid="icon" />;
    };
    render(<TestComp />);
    const el = screen.getByTestId("icon");
    expect(refNode).toBe(el);
  });
});
