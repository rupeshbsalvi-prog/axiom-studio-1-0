import { PositioningEngine, PositionOptions, PositionResult } from "./PositioningEngine";
import { FloatingUIAdapter } from "./FloatingUIAdapter";

const defaultEngine: PositioningEngine = new FloatingUIAdapter();

export function computeOverlayPosition(
  reference: HTMLElement,
  floating: HTMLElement,
  options?: PositionOptions
): Promise<PositionResult> {
  return defaultEngine.computePosition(reference, floating, options);
}

export type { PositionOptions, PositionResult, Placement } from "./PositioningEngine";
export { FloatingUIAdapter } from "./FloatingUIAdapter";
