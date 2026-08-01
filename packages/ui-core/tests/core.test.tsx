import React, { useRef, useEffect } from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { colors, radius, elevation, spacing, typography } from "@axiom/tokens";
import {
  Surface,
  Text,
  Stack,
  Grid,
  useBreakpoint,
} from "../src/index";

/**
 * jsdom normalises hex colour values to rgb() when reading element.style.
 * e.g. '#080807' → 'rgb(8, 8, 7)'
 * Use this helper to keep assertions declarative and tied to the token.
 */
function hexToRgb(hex: string): string {
  const clean = hex.replace("#", "");
  const r = parseInt(clean.substring(0, 2), 16);
  const g = parseInt(clean.substring(2, 4), 16);
  const b = parseInt(clean.substring(4, 6), 16);
  return `rgb(${r}, ${g}, ${b})`;
}

describe("Axiom UI Core Components", () => {
  
  describe("Surface Component", () => {
    it("should render default tag (div) and apply base and default variant styles", () => {
      render(<Surface data-testid="surf">Content</Surface>);
      const el = screen.getByTestId("surf");
      expect(el.tagName).toBe("DIV");
      expect(el.style.borderRadius).toBe(radius.md);
      expect(el.style.backgroundColor).toBe(hexToRgb(colors.background));
      expect(el.style.border).toBe(`1px solid ${colors.border}`);
    });

    it("should support polymorphic rendering (section)", () => {
      render(<Surface as="section" data-testid="surf">Content</Surface>);
      const el = screen.getByTestId("surf");
      expect(el.tagName).toBe("SECTION");
    });

    it("should apply glass variant styling", () => {
      render(<Surface variant="glass" data-testid="surf">Content</Surface>);
      const el = screen.getByTestId("surf");
      expect(el.style.backdropFilter).toBe(elevation.glassmorphism.panel.backdropFilter);
      expect(el.style.background).toBe(elevation.glassmorphism.panel.background);
    });

    it("should apply elevated variant styling", () => {
      render(<Surface variant="elevated" data-testid="surf">Content</Surface>);
      const el = screen.getByTestId("surf");
      expect(el.style.boxShadow).toBe(elevation.shadows.md);
    });

    it("should apply outline variant styling", () => {
      render(<Surface variant="outline" data-testid="surf">Content</Surface>);
      const el = screen.getByTestId("surf");
      expect(el.style.backgroundColor).toBe("transparent");
      expect(el.style.border).toBe(`1px solid ${colors.border}`);
    });

    it("should apply glowing styles when glowing prop is true", () => {
      render(<Surface glowing data-testid="surf">Content</Surface>);
      const el = screen.getByTestId("surf");
      expect(el.style.boxShadow).toBe(elevation.shadows.glow);
      expect(el.style.borderColor).toBe(hexToRgb(colors.primary));
    });

    it("should forward refs correctly", () => {
      let refNode: HTMLDivElement | null = null;
      const TestComp = () => {
        const ref = useRef<HTMLDivElement>(null);
        useEffect(() => {
          refNode = ref.current;
        }, []);
        return <Surface ref={ref} data-testid="surf">Ref</Surface>;
      };
      render(<TestComp />);
      const el = screen.getByTestId("surf");
      expect(refNode).toBe(el);
    });
  });

  describe("Text Component", () => {
    it("should render default tag (span) and default body variant styles", () => {
      render(<Text data-testid="text">Hello</Text>);
      const el = screen.getByTestId("text");
      expect(el.tagName).toBe("SPAN");
      expect(el.style.fontSize).toBe(typography.fontSizes.md);
    });

    it("should support polymorphic rendering (h1, p, code)", () => {
      const { rerender } = render(<Text as="h1" data-testid="text">Heading</Text>);
      expect(screen.getByTestId("text").tagName).toBe("H1");

      rerender(<Text as="p" data-testid="text">Paragraph</Text>);
      expect(screen.getByTestId("text").tagName).toBe("P");

      rerender(<Text as="code" data-testid="text">Code</Text>);
      expect(screen.getByTestId("text").tagName).toBe("CODE");
    });

    it("should support semantic overrides like color and align", () => {
      render(<Text color="optimal" align="center" data-testid="text">Teal</Text>);
      const el = screen.getByTestId("text");
      expect(el.style.color).toBe(hexToRgb(colors.optimal));
      expect(el.style.textAlign).toBe("center");
    });

    it("should forward refs correctly", () => {
      let refNode: HTMLSpanElement | null = null;
      const TestComp = () => {
        const ref = useRef<HTMLSpanElement>(null);
        useEffect(() => {
          refNode = ref.current;
        }, []);
        return <Text ref={ref} data-testid="text">Ref</Text>;
      };
      render(<TestComp />);
      const el = screen.getByTestId("text");
      expect(refNode).toBe(el);
    });
  });

  describe("Stack Component", () => {
    it("should render default flex container and column direction", () => {
      render(<Stack data-testid="stack">Stack</Stack>);
      const el = screen.getByTestId("stack");
      expect(el.style.display).toBe("flex");
      expect(el.style.flexDirection).toBe("column");
      expect(el.style.alignItems).toBe("stretch");
      expect(el.style.justifyContent).toBe("flex-start");
    });

    it("should support custom static directions, alignment, and gap", () => {
      render(
        <Stack direction="row" align="center" justify="between" gap="md" data-testid="stack">
          <div>1</div>
          <div>2</div>
        </Stack>
      );
      const el = screen.getByTestId("stack");
      expect(el.style.flexDirection).toBe("row");
      expect(el.style.alignItems).toBe("center");
      expect(el.style.justifyContent).toBe("space-between");
      expect(el.style.gap).toBe(spacing.md);
    });

    it("should support responsive props", () => {
      // Mock matches for desktop
      const originalMatchMedia = window.matchMedia;
      window.matchMedia = vi.fn().mockImplementation((query) => {
        return {
          matches: query.includes("1024px") || query.includes("768px"),
          media: query,
          onchange: null,
          addListener: vi.fn(),
          removeListener: vi.fn(),
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
          dispatchEvent: vi.fn(),
        };
      });

      render(
        <Stack
          direction={{ mobile: "column", tablet: "row" }}
          gap={{ mobile: "sm", desktop: "lg" }}
          data-testid="stack"
        >
          <div>1</div>
        </Stack>
      );
      const el = screen.getByTestId("stack");
      expect(el.style.flexDirection).toBe("row");
      expect(el.style.gap).toBe(spacing.lg);

      window.matchMedia = originalMatchMedia;
    });

    it("should forward ref correctly", () => {
      let refNode: HTMLDivElement | null = null;
      const TestComp = () => {
        const ref = useRef<HTMLDivElement>(null);
        useEffect(() => {
          refNode = ref.current;
        }, []);
        return <Stack ref={ref} data-testid="stack">Ref</Stack>;
      };
      render(<TestComp />);
      const el = screen.getByTestId("stack");
      expect(refNode).toBe(el);
    });
  });

  describe("Grid Component", () => {
    it("should render default grid container and columns", () => {
      render(<Grid data-testid="grid">Grid</Grid>);
      const el = screen.getByTestId("grid");
      expect(el.style.display).toBe("grid");
      expect(el.style.gridTemplateColumns).toBe("repeat(1, minmax(0, 1fr))");
    });

    it("should apply columns template dynamically from number or custom string", () => {
      const { rerender } = render(<Grid columns={3} data-testid="grid">Grid</Grid>);
      expect(screen.getByTestId("grid").style.gridTemplateColumns).toBe("repeat(3, minmax(0, 1fr))");

      rerender(<Grid columns="200px 1fr" data-testid="grid">Grid</Grid>);
      expect(screen.getByTestId("grid").style.gridTemplateColumns).toBe("200px 1fr");
    });

    it("should support static layouts align, justify, gap, and flow", () => {
      render(
        <Grid flow="column dense" align="center" justify="between" gap="xl" data-testid="grid">
          <div>1</div>
        </Grid>
      );
      const el = screen.getByTestId("grid");
      expect(el.style.gridAutoFlow).toBe("column dense");
      expect(el.style.alignItems).toBe("center");
      expect(el.style.justifyContent).toBe("space-between");
      expect(el.style.gap).toBe(spacing.xl);
    });

    it("should support responsive values", () => {
      const originalMatchMedia = window.matchMedia;
      window.matchMedia = vi.fn().mockImplementation((query) => {
        // Mock tablet viewport matches md, but not lg
        return {
          matches: query.includes("768px") && !query.includes("1024px"),
          media: query,
          onchange: null,
          addListener: vi.fn(),
          removeListener: vi.fn(),
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
          dispatchEvent: vi.fn(),
        };
      });

      render(
        <Grid
          columns={{ mobile: 1, tablet: 2, desktop: 4 }}
          gap={{ mobile: "none", tablet: "sm" }}
          data-testid="grid"
        >
          <div>1</div>
        </Grid>
      );
      const el = screen.getByTestId("grid");
      expect(el.style.gridTemplateColumns).toBe("repeat(2, minmax(0, 1fr))");
      expect(el.style.gap).toBe(spacing.sm);

      window.matchMedia = originalMatchMedia;
    });

    it("should forward ref correctly", () => {
      let refNode: HTMLDivElement | null = null;
      const TestComp = () => {
        const ref = useRef<HTMLDivElement>(null);
        useEffect(() => {
          refNode = ref.current;
        }, []);
        return <Grid ref={ref} data-testid="grid">Ref</Grid>;
      };
      render(<TestComp />);
      const el = screen.getByTestId("grid");
      expect(refNode).toBe(el);
    });
  });
});
