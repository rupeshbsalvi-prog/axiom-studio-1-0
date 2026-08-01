export const typography = Object.freeze({
  fonts: Object.freeze({
    heading: "Outfit, Inter, ui-sans-serif, system-ui, sans-serif",
    body: "Inter, ui-sans-serif, system-ui, sans-serif",
    mono: "JetBrains Mono, ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
  } as const),
  fontSizes: Object.freeze({
    xs: "0.75rem",     // 12px
    sm: "0.875rem",    // 14px
    md: "1rem",        // 16px
    lg: "1.25rem",     // 20px
    xl: "1.5rem",      // 24px
    xxl: "2rem",       // 32px
    display: "3rem",   // 48px
    hero: "6.5rem",    // 104px
  } as const),
  fontWeights: Object.freeze({
    light: "300",
    regular: "400",
    medium: "500",
    semibold: "600",
    bold: "700",
    extrabold: "800",
  } as const),
  letterSpacings: Object.freeze({
    tight: "-0.02em",  // Headings
    normal: "0em",
    wide: "0.05em",
  } as const),
  lineHeights: Object.freeze({
    none: "1",
    tight: "1.25",
    normal: "1.5",
    loose: "1.75",
  } as const),
} as const);

export type Typography = typeof typography;
