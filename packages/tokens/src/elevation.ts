export const elevation = Object.freeze({
  zIndices: Object.freeze({
    base: 0,
    graph: 1,
    panel: 10,
    banner: 100,
    alert: 1000,
  } as const),
  layers: Object.freeze({
    base: 0,
    dropdown: 100,
    popover: 200,
    tooltip: 300,
    modal: 400,
    toast: 500,
    debug: 9999,
  } as const),
  glassmorphism: Object.freeze({
    panel: Object.freeze({
      backdropFilter: "blur(16px)",
      background: "rgba(8, 8, 7, 0.72)",
      border: "1px solid rgba(255, 255, 255, 0.08)",
    } as const),
  } as const),
  shadows: Object.freeze({
    none: "none",
    sm: "0 1px 2px 0 rgba(0, 0, 0, 0.5)",
    md: "0 4px 6px -1px rgba(0, 0, 0, 0.5), 0 2px 4px -1px rgba(0, 0, 0, 0.3)",
    lg: "0 10px 15px -3px rgba(0, 0, 0, 0.7), 0 4px 6px -2px rgba(0, 0, 0, 0.4)",
    glow: "0 0 20px rgba(0, 210, 255, 0.25)", // Neural blue glow shadow
  } as const),
} as const);

export type Elevation = typeof elevation;
