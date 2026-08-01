import { colors } from "./colors";
import { typography } from "./typography";
import { spacing } from "./spacing";
import { radius } from "./radius";
import { motion } from "./motion";
import { elevation } from "./elevation";
import { breakpoints } from "./breakpoints";

export const theme = Object.freeze({
  colors,
  typography,
  spacing,
  radius,
  motion,
  elevation,
  breakpoints,
} as const);

export type Theme = typeof theme;
