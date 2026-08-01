import { describe, it, expect } from "vitest";
import * as tokens from "../src/index";

describe("Axiom Design Tokens - Core Integrity", () => {
  it("should export all required token groups and the aggregated theme", () => {
    expect(tokens.colors).toBeDefined();
    expect(tokens.typography).toBeDefined();
    expect(tokens.spacing).toBeDefined();
    expect(tokens.radius).toBeDefined();
    expect(tokens.motion).toBeDefined();
    expect(tokens.elevation).toBeDefined();
    expect(tokens.breakpoints).toBeDefined();
    expect(tokens.theme).toBeDefined();
  });

  it("should enforce deep runtime immutability on all token groups", () => {
    expect(Object.isFrozen(tokens.colors)).toBe(true);
    expect(Object.isFrozen(tokens.typography)).toBe(true);
    expect(Object.isFrozen(tokens.typography.fonts)).toBe(true);
    expect(Object.isFrozen(tokens.typography.fontSizes)).toBe(true);
    expect(Object.isFrozen(tokens.typography.fontWeights)).toBe(true);
    expect(Object.isFrozen(tokens.typography.letterSpacings)).toBe(true);
    expect(Object.isFrozen(tokens.typography.lineHeights)).toBe(true);
    expect(Object.isFrozen(tokens.spacing)).toBe(true);
    expect(Object.isFrozen(tokens.spacing.layout)).toBe(true);
    expect(Object.isFrozen(tokens.radius)).toBe(true);
    expect(Object.isFrozen(tokens.motion)).toBe(true);
    expect(Object.isFrozen(tokens.motion.durations)).toBe(true);
    expect(Object.isFrozen(tokens.motion.easings)).toBe(true);
    expect(Object.isFrozen(tokens.elevation)).toBe(true);
    expect(Object.isFrozen(tokens.elevation.zIndices)).toBe(true);
    expect(Object.isFrozen(tokens.elevation.glassmorphism)).toBe(true);
    expect(Object.isFrozen(tokens.elevation.glassmorphism.panel)).toBe(true);
    expect(Object.isFrozen(tokens.elevation.shadows)).toBe(true);
    expect(Object.isFrozen(tokens.breakpoints)).toBe(true);
    expect(Object.isFrozen(tokens.theme)).toBe(true);
  });

  it("should prevent modifications and throw errors in strict mode", () => {
    expect(() => {
      // @ts-expect-error - testing runtime freeze safety
      (tokens.colors as any).primary = "#newcolor";
    }).toThrow();

    expect(() => {
      // @ts-expect-error - testing runtime freeze safety
      (tokens.theme.colors as any).optimal = "#newcolor";
    }).toThrow();
  });

  it("should define core status colors correctly according to Visual Language v1.0", () => {
    expect(tokens.colors.optimal).toBe("#10b981");
    expect(tokens.colors.attention).toBe("#f59e0b");
    expect(tokens.colors.critical).toBe("#ef4444");
    expect(tokens.colors.primary).toBe("#00d2ff");
  });

  it("should adhere to formatting and naming conventions", () => {
    // Check colors are hex format or rgba
    Object.values(tokens.colors).forEach((color) => {
      expect(color).toMatch(/^(#|rgba)/);
    });

    // Check spacing ends with rem
    const baseSpacingKeys = ["xxs", "xs", "sm", "md", "lg", "xl", "xxl", "xxxl"] as const;
    baseSpacingKeys.forEach((key) => {
      expect(tokens.spacing[key]).toMatch(/rem$/);
    });

    // Check motion durations contain ms
    Object.values(tokens.motion.durations).forEach((duration) => {
      expect(duration).toMatch(/ms$/);
    });
  });

  it("should possess a complete theme object containing references to all token domains", () => {
    expect(tokens.theme.colors).toBe(tokens.colors);
    expect(tokens.theme.typography).toBe(tokens.typography);
    expect(tokens.theme.spacing).toBe(tokens.spacing);
    expect(tokens.theme.radius).toBe(tokens.radius);
    expect(tokens.theme.motion).toBe(tokens.motion);
    expect(tokens.theme.elevation).toBe(tokens.elevation);
    expect(tokens.theme.breakpoints).toBe(tokens.breakpoints);
  });
});
