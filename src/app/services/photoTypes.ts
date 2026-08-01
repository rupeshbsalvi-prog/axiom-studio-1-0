export interface PhotoTemplate {
  categories: string[];
  lighting: string[];
  aspectRatios: string[];
  aesthetics: string[];
}

export interface PhotoPlanRequest {
  intent: string;
  category?: string;
  aspectRatio?: string;
  lighting?: string;
  style?: string;
}

export interface LayerBreakdownItem {
  name: string;
  type: string;
  description: string;
  blendMode: string;
  opacity: number;
}

export interface PhotoRecommendedAdjustments {
  brightness: number;
  contrast: number;
  saturation: number;
  blur: number;
  hueRotate: number;
  grayscale: number;
}

export interface PhotoAuditEvent {
  id: string;
  type: string;
  timestamp: string;
  title: string;
  description: string | null;
}

export interface PhotoProviderInfo {
  name: string;
  mode: string;
  status: string;
}

export interface PhotoPlanResponse {
  intent: string;
  category: string;
  aspectRatio: string;
  canvasSize: { width: number; height: number };
  aesthetic: string;
  lighting: string;
  colorPalette: string[];
  backgroundStrategy: string;
  negativePrompt: string;
  layerBreakdown: LayerBreakdownItem[];
  recommendedAdjustments: PhotoRecommendedAdjustments;
  audit: PhotoAuditEvent[];
  provider: PhotoProviderInfo;
}

export interface PhotoGenerateRequest {
  plan: PhotoPlanResponse;
}

export interface PhotoLayerPosition {
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
}

export interface PhotoLayerAdjustments {
  brightness: number;
  contrast: number;
  saturation: number;
  blur: number;
  hueRotate: number;
  grayscale: number;
}

export interface PhotoLayer {
  id: string;
  name: string;
  type: "image" | "gradient" | "shape" | "text" | "texture" | "placeholder";
  visible: boolean;
  opacity: number;
  blendMode: string;
  position: PhotoLayerPosition;
  source?: string;
  adjustments: PhotoLayerAdjustments;
}

export interface PhotoCanvasState {
  width: number;
  height: number;
  aspectRatio: string;
  background: string;
}

export interface PhotoGenerateResponse {
  projectId: string;
  canvas: PhotoCanvasState;
  layers: PhotoLayer[];
  audit: PhotoAuditEvent[];
  provider: PhotoProviderInfo;
}
