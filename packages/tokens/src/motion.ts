export const motion = Object.freeze({
  durations: Object.freeze({
    snappy: "100ms",              // User Input / Tab Clicks (< 100ms)
    smooth: "400ms",              // Delegation Status Updates (300ms - 500ms)
    timeline: "800ms",            // Timeline Transitions (800ms)
    consolidation: "1800ms",      // Cognitive Promotion / Paced Consolidation (1.5s - 2s)
  } as const),
  easings: Object.freeze({
    standard: "cubic-bezier(0.4, 0, 0.2, 1)",
    enter: "cubic-bezier(0, 0, 0.2, 1)",
    exit: "cubic-bezier(0.4, 0, 1, 1)",
    pulse: "cubic-bezier(0.4, 0, 0.6, 1)",
    shimmer: "linear",
  } as const),
} as const);

export type Motion = typeof motion;
