import { computePosition, offset, flip, shift } from "@floating-ui/dom";
import { PositioningEngine, PositionOptions, PositionResult, Placement } from "./PositioningEngine";

export class FloatingUIAdapter implements PositioningEngine {
  async computePosition(
    reference: HTMLElement,
    floating: HTMLElement,
    options: PositionOptions = {}
  ): Promise<PositionResult> {
    const middleware = [];

    if (options.offset !== undefined) {
      middleware.push(offset(options.offset));
    }
    if (options.flip !== false) {
      middleware.push(flip());
    }
    if (options.shift !== false) {
      middleware.push(shift());
    }

    const result = await computePosition(reference, floating, {
      placement: options.placement ?? "bottom",
      strategy: options.strategy ?? "absolute",
      middleware,
    });

    return {
      x: result.x,
      y: result.y,
      placement: result.placement as Placement,
      strategy: result.strategy,
    };
  }
}
