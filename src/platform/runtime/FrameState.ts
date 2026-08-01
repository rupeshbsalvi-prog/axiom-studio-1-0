export const AXIOM_CORE_LIFECYCLE_STATES = [
  "Idle",
  "Listening",
  "Understanding",
  "Planning",
  "Generating",
  "Collaborating",
  "Completed",
] as const;

export type AxiomCoreLifecycleState = (typeof AXIOM_CORE_LIFECYCLE_STATES)[number];

export type AxiomCoreInteractionSource = "mouse" | "pen" | "touch";
export const AXIOM_CORE_POINTER_PULL_RADIUS = 1;

export interface AxiomCoreInteractionState {
  pointerX: number;
  pointerY: number;
  proximity: number;
  hovered: boolean;
  source: AxiomCoreInteractionSource;
}

export const AXIOM_CORE_INACTIVE_INTERACTION: AxiomCoreInteractionState = {
  pointerX: 0,
  pointerY: 0,
  proximity: 0,
  hovered: false,
  source: "mouse",
};

export function createAxiomCoreInteraction(
  clientX: number,
  clientY: number,
  viewportWidth: number,
  viewportHeight: number,
  source: AxiomCoreInteractionSource,
): AxiomCoreInteractionState {
  const pointerX = Math.max(-1, Math.min(1, (clientX / Math.max(1, viewportWidth) - 0.5) * 2));
  const pointerY = Math.max(-1, Math.min(1, (0.5 - clientY / Math.max(1, viewportHeight)) * 2));
  const proximity = Math.max(
    0,
    1 - Math.hypot(pointerX, pointerY) / AXIOM_CORE_POINTER_PULL_RADIUS,
  );

  return { pointerX, pointerY, proximity, hovered: proximity > 0, source };
}

export interface AXRuntimeStateData {
  lifecycle?: AxiomCoreLifecycleState;
  geometry: {
    scale: number;
    deformation: number;
  };
  materials: {
    color: string;
    emission: number;
  };
  particles: {
    velocity: number;
    density: number;
  };
  lighting: {
    intensity: number;
  };
  interaction?: AxiomCoreInteractionState;
  signature?: {
    monochrome: boolean;
    wireframe: boolean;
    paused: boolean;
    opaque: boolean;
    noLights: boolean;
    flatDiffuse: boolean;
    basicShader: boolean;
    noBloom: boolean;
  };
  quality?: "high" | "medium" | "low";
  transition?: {
    duration: number;
    easing: string;
  };
  [key: string]: any;
}

export interface AXFrameState {
  lifecycle: AxiomCoreLifecycleState;
  scale: number;
  deformation: number;
  color: string;
  emission: number;
  particleVelocity: number;
  particleDensity: number;
  lightIntensity: number;
  latticeActivity: number;
  
  // Interaction variables (clamped based on guidelines)
  shellTiltX: number;
  shellTiltY: number;
  crystalBiasX: number;
  crystalBiasY: number;

  // Signature checks
  monochrome: boolean;
  wireframe: boolean;
  paused: boolean;
  opaque: boolean;
  noLights: boolean;
  flatDiffuse: boolean;
  basicShader: boolean;
  noBloom: boolean;

  // Quality details
  quality: "high" | "medium" | "low";
}
