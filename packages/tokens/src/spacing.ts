export const spacing = Object.freeze({
  none: "0rem",
  xxs: "0.25rem",  // 4px
  xs: "0.5rem",    // 8px
  sm: "0.75rem",   // 12px
  md: "1rem",      // 16px
  lg: "1.25rem",   // 20px
  xl: "1.5rem",    // 24px
  xxl: "2rem",     // 32px
  xxxl: "2.5rem",  // 40px
  layout: Object.freeze({
    sm: "1.5rem",  // 24px
    md: "2.5rem",  // 40px
    lg: "4rem",    // 64px
    xl: "6rem",    // 96px
  } as const),
} as const);

export type Spacing = typeof spacing;
