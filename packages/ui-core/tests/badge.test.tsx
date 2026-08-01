import React, { useRef, useEffect } from "react";
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { colors, typography } from "@axiom/tokens";
import { Badge } from "../src/components/Badge/Badge";

function hexToRgb(hex: string): string {
  const clean = hex.replace("#", "");
  const r = parseInt(clean.substring(0, 2), 16);
  const g = parseInt(clean.substring(2, 4), 16);
  const b = parseInt(clean.substring(4, 6), 16);
  return `rgb(${r}, ${g}, ${b})`;
}

describe("Badge Component", () => {
  it("should render default tag (span), size (md), and variant (neutral)", () => {
    render(<Badge data-testid="badge">Status</Badge>);
    const el = screen.getByTestId("badge");
    expect(el.tagName).toBe("SPAN");
    expect(el.style.fontSize).toBe(typography.fontSizes.sm);
    expect(el.style.color).toBe(hexToRgb(colors.muted));
  });

  it("should support custom sizes", () => {
    const { rerender } = render(<Badge size="sm" data-testid="badge">Status</Badge>);
    expect(screen.getByTestId("badge").style.fontSize).toBe(typography.fontSizes.xs);

    rerender(<Badge size="md" data-testid="badge">Status</Badge>);
    expect(screen.getByTestId("badge").style.fontSize).toBe(typography.fontSizes.sm);
  });

  it("should resolve variant colors correctly", () => {
    const { rerender } = render(<Badge variant="optimal" data-testid="badge">Status</Badge>);
    expect(screen.getByTestId("badge").style.color).toBe(hexToRgb(colors.optimal));

    rerender(<Badge variant="warning" data-testid="badge">Status</Badge>);
    expect(screen.getByTestId("badge").style.color).toBe(hexToRgb(colors.attention));

    rerender(<Badge variant="error" data-testid="badge">Status</Badge>);
    expect(screen.getByTestId("badge").style.color).toBe(hexToRgb(colors.critical));

    rerender(<Badge variant="info" data-testid="badge">Status</Badge>);
    expect(screen.getByTestId("badge").style.color).toBe(hexToRgb(colors.primary));
  });

  it("should render dot when dot prop is true", () => {
    render(<Badge dot data-testid="badge">Status</Badge>);
    const dotEl = screen.getByTestId("badge-dot");
    expect(dotEl).toBeInTheDocument();
  });

  it("should render icon when icon prop is passed", () => {
    render(<Badge icon="check" data-testid="badge">Status</Badge>);
    const iconEl = screen.getByTestId("badge").querySelector("svg");
    expect(iconEl).toBeInTheDocument();
  });

  it("should support polymorphic rendering (as)", () => {
    render(<Badge as="div" data-testid="badge">Status</Badge>);
    expect(screen.getByTestId("badge").tagName).toBe("DIV");
  });

  it("should forward ref correctly", () => {
    let refNode: HTMLSpanElement | null = null;
    const TestComp = () => {
      const ref = useRef<HTMLSpanElement>(null);
      useEffect(() => {
        refNode = ref.current;
      }, []);
      return <Badge ref={ref} data-testid="badge">Status</Badge>;
    };
    render(<TestComp />);
    const el = screen.getByTestId("badge");
    expect(refNode).toBe(el);
  });
});
