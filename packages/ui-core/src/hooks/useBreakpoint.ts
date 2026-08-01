import { useState, useEffect } from "react";
import { breakpoints } from "@axiom/tokens";

export type Breakpoint = "mobile" | "tablet" | "desktop";

export function useBreakpoint(): Breakpoint {
  const [breakpoint, setBreakpoint] = useState<Breakpoint>("mobile");

  useEffect(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") return;

    // Parse numeric values from tokens (e.g. "768px" -> 768)
    const mdVal = parseInt(breakpoints.md, 10) || 768;
    const lgVal = parseInt(breakpoints.lg, 10) || 1024;

    const mediaMd = window.matchMedia(`(min-width: ${mdVal}px)`);
    const mediaLg = window.matchMedia(`(min-width: ${lgVal}px)`);

    const updateBreakpoint = () => {
      if (mediaLg.matches) {
        setBreakpoint("desktop");
      } else if (mediaMd.matches) {
        setBreakpoint("tablet");
      } else {
        setBreakpoint("mobile");
      }
    };

    updateBreakpoint();

    mediaMd.addEventListener("change", updateBreakpoint);
    mediaLg.addEventListener("change", updateBreakpoint);

    return () => {
      mediaMd.removeEventListener("change", updateBreakpoint);
      mediaLg.removeEventListener("change", updateBreakpoint);
    };
  }, []);

  return breakpoint;
}

export function resolveResponsiveProp<T>(
  prop: T | { mobile?: T; tablet?: T; desktop?: T } | undefined,
  currentBreakpoint: Breakpoint,
  defaultValue: T
): T {
  if (prop === undefined) return defaultValue;
  if (typeof prop !== "object" || prop === null) {
    return prop as T;
  }

  const responsive = prop as { mobile?: T; tablet?: T; desktop?: T };
  if (currentBreakpoint === "desktop" && responsive.desktop !== undefined) {
    return responsive.desktop;
  }
  if (
    (currentBreakpoint === "desktop" || currentBreakpoint === "tablet") &&
    responsive.tablet !== undefined
  ) {
    return responsive.tablet;
  }
  if (responsive.mobile !== undefined) {
    return responsive.mobile;
  }
  return defaultValue;
}
