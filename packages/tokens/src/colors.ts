export const colors = Object.freeze({
  optimal: "#10b981",    // Healthy Teal/Emerald
  attention: "#f59e0b",  // Load warning Amber
  critical: "#ef4444",   // Decision block / failure Red
  primary: "#00d2ff",    // Neural crystal blue glow
  background: "#080807", // Dark mode base
  text: "#f7f2e8",       // Primary off-white text
  muted: "#c9c0b2",      // Secondary muted text
  highlight: "#e7c481",  // Warm amber highlight
  border: "rgba(255, 255, 255, 0.08)", // Thin white border for panels
} as const);

export type Colors = typeof colors;
