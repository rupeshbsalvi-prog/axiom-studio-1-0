export interface MotionLayer {
  id: string;
  name: string;
  type: "motion" | "gradient" | "shape" | "text" | "effect" | "placeholder";
  visible: boolean;
  opacity: number;
  blendMode: string;
  bounds: { x: number; y: number; width: number; height: number };
  source: string;
}

export interface MotionCanvasState {
  width: number;
  height: number;
  aspectRatio: string;
  background: string;
}

export interface MotionAuditEvent {
  id: string;
  type: string;
  timestamp: string;
  title: string;
  description: string | null;
}

export interface MotionProviderInfo {
  name: string;
  mode: string;
  status: string;
}
