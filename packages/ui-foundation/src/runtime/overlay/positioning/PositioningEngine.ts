export type Placement =
  | "top"
  | "top-start"
  | "top-end"
  | "bottom"
  | "bottom-start"
  | "bottom-end"
  | "left"
  | "left-start"
  | "left-end"
  | "right"
  | "right-start"
  | "right-end";

export interface PositionOptions {
  placement?: Placement;
  strategy?: "absolute" | "fixed";
  offset?: number;
  shift?: boolean;
  flip?: boolean;
}

export interface PositionResult {
  x: number;
  y: number;
  placement: Placement;
  strategy: "absolute" | "fixed";
}

export interface PositioningEngine {
  computePosition(
    reference: HTMLElement,
    floating: HTMLElement,
    options?: PositionOptions
  ): Promise<PositionResult>;
}
