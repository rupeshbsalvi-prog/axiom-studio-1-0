export interface VectorTemplate {
  categories: string[];
  aesthetics: string[];
  aspectRatios: string[];
  palettes: string[];
}

export interface VectorPlanRequest {
  intent: string;
  category?: string;
  aspectRatio?: string;
  palette?: string;
  style?: string;
}

export interface ShapeBreakdownItem {
  name: string;
  type: "rect" | "circle" | "path" | "text";
  description: string;
  fill: string;
  stroke: string;
  strokeWidth: number;
}

export interface VectorAuditEvent {
  id: string;
  type: string;
  timestamp: string;
  title: string;
  description: string | null;
}

export interface VectorProviderInfo {
  name: string;
  mode: string;
  status: string;
}

export interface VectorPlanResponse {
  intent: string;
  category: string;
  aspectRatio: string;
  canvas: {
    width: number;
    height: number;
    viewBox: string;
  };
  aesthetic: string;
  palette: string;
  colorPalette: string[];
  shapeBreakdown: ShapeBreakdownItem[];
  compositionStrategy: string;
  negativePrompt: string;
  audit: VectorAuditEvent[];
  provider: VectorProviderInfo;
}

export interface VectorGenerateRequest {
  plan: VectorPlanResponse;
}

export interface VectorShapeTransform {
  x: number;
  y: number;
  rotation: number;
  scaleX: number;
  scaleY: number;
}

export interface VectorShapeBase {
  id: string;
  name: string;
  type: "rect" | "circle" | "path" | "text";
  visible: boolean;
  locked: boolean;
  opacity: number;
  fill: string;
  stroke: string;
  strokeWidth: number;
  transform?: VectorShapeTransform;
}

export interface VectorRectShape extends VectorShapeBase {
  type: "rect";
  x: number;
  y: number;
  width: number;
  height: number;
  rx?: number;
}

export interface VectorCircleShape extends VectorShapeBase {
  type: "circle";
  cx: number;
  cy: number;
  r: number;
}

export interface VectorPathShape extends VectorShapeBase {
  type: "path";
  d: string;
}

export interface VectorTextShape extends VectorShapeBase {
  type: "text";
  x: number;
  y: number;
  text: string;
  fontSize: number;
  fontWeight?: number;
  fontFamily?: string;
}

export type VectorShape =
  | VectorRectShape
  | VectorCircleShape
  | VectorPathShape
  | VectorTextShape;

export interface VectorCanvasState {
  width: number;
  height: number;
  viewBox: string;
  background: string;
}

export interface VectorGenerateResponse {
  projectId: string;
  canvas: VectorCanvasState;
  shapes: Record<string, VectorShape>;
  shapeOrder: string[];
  audit: VectorAuditEvent[];
  provider: VectorProviderInfo;
}
