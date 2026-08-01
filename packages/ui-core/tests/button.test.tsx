import React, { useRef, useEffect } from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { colors } from "@axiom/tokens";
import { Button } from "../src/components/Button/Button";

function hexToRgb(hex: string): string {
  const clean = hex.replace("#", "");
  const r = parseInt(clean.substring(0, 2), 16);
  const g = parseInt(clean.substring(2, 4), 16);
  const b = parseInt(clean.substring(4, 6), 16);
  return `rgb(${r}, ${g}, ${b})`;
}

describe("Button Component", () => {
  it("should render default tag (button), size (md), and primary variant styles", () => {
    render(<Button data-testid="btn">Click me</Button>);
    const el = screen.getByTestId("btn");
    expect(el.tagName).toBe("BUTTON");
    expect(el.style.backgroundColor).toBe(hexToRgb(colors.primary));
    expect(el.getAttribute("aria-disabled")).toBeNull();
    expect(el.getAttribute("aria-busy")).toBeNull();
  });

  it("should support custom sizes", () => {
    const { rerender } = render(<Button size="sm" data-testid="btn">Click me</Button>);
    expect(screen.getByTestId("btn").style.fontSize).toBe("0.75rem");

    rerender(<Button size="lg" data-testid="btn">Click me</Button>);
    expect(screen.getByTestId("btn").style.fontSize).toBe("1rem");
  });

  it("should support variant styles", () => {
    const { rerender } = render(<Button variant="secondary" data-testid="btn">Click me</Button>);
    expect(screen.getByTestId("btn").style.color).toBe(hexToRgb(colors.text));

    rerender(<Button variant="ghost" data-testid="btn">Click me</Button>);
    expect(screen.getByTestId("btn").style.backgroundColor).toBe("transparent");

    rerender(<Button variant="destructive" data-testid="btn">Click me</Button>);
    expect(screen.getByTestId("btn").style.backgroundColor).toBe(hexToRgb(colors.critical));
  });

  it("should support polymorphic rendering (as='a')", () => {
    render(<Button as="a" href="https://example.com" data-testid="btn">Link</Button>);
    const el = screen.getByTestId("btn");
    expect(el.tagName).toBe("A");
    expect(el.getAttribute("role")).toBe("button");
    expect(el.getAttribute("href")).toBe("https://example.com");
  });

  it("should prevent click handlers when disabled", () => {
    const handleClick = vi.fn();
    render(<Button disabled onClick={handleClick} data-testid="btn">Button</Button>);
    const el = screen.getByTestId("btn");
    expect(el.getAttribute("aria-disabled")).toBe("true");
    
    fireEvent.click(el);
    expect(handleClick).not.toHaveBeenCalled();
  });

  it("should render spinner and set aria-busy when loading", () => {
    const handleClick = vi.fn();
    render(<Button loading onClick={handleClick} data-testid="btn">Button</Button>);
    const el = screen.getByTestId("btn");
    expect(el.getAttribute("aria-busy")).toBe("true");
    expect(el.getAttribute("aria-disabled")).toBe("true");
    expect(el.querySelector("svg")).toBeInTheDocument(); // spinner icon

    fireEvent.click(el);
    expect(handleClick).not.toHaveBeenCalled();
  });

  it("should forward ref correctly", () => {
    let refNode: HTMLButtonElement | null = null;
    const TestComp = () => {
      const ref = useRef<HTMLButtonElement>(null);
      useEffect(() => {
        refNode = ref.current;
      }, []);
      return <Button ref={ref} data-testid="btn">Button</Button>;
    };
    render(<TestComp />);
    const el = screen.getByTestId("btn");
    expect(refNode).toBe(el);
  });

  it("should apply focus styling when focused", () => {
    render(<Button data-testid="btn">Button</Button>);
    const el = screen.getByTestId("btn");
    fireEvent.focus(el);
    expect(el.style.boxShadow).toBe(`0 0 0 2px ${colors.background}, 0 0 0 4px ${colors.primary}`);
  });
});
