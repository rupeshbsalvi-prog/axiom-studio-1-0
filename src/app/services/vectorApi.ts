import type {
  VectorTemplate,
  VectorPlanRequest,
  VectorPlanResponse,
  VectorGenerateRequest,
  VectorGenerateResponse,
  VectorShape
} from "./vectorTypes";

export const VECTOR_CANVAS_PRESETS = {
  "1:1": { width: 1024, height: 1024, viewBox: "0 0 1024 1024" },
  "4:5": { width: 1080, height: 1350, viewBox: "0 0 1080 1350" },
  "16:9": { width: 1920, height: 1080, viewBox: "0 0 1920 1080" },
  "9:16": { width: 1080, height: 1920, viewBox: "0 0 1080 1920" }
};

const MOCK_TEMPLATES: VectorTemplate = {
  categories: ["logo", "icon", "illustration", "diagram", "infographic"],
  aesthetics: ["modern", "minimalist", "retro", "isometric", "futuristic"],
  aspectRatios: ["1:1", "4:5", "16:9", "9:16"],
  palettes: ["monochrome", "neon", "editorial", "brand", "pastel"]
};

const generateFallbackPlan = (request: VectorPlanRequest): VectorPlanResponse => {
  const category = request.category || "logo";
  const aspectRatio = request.aspectRatio || "1:1";
  const style = request.style || "modern";
  const palette = request.palette || "brand";
  
  const canvas = VECTOR_CANVAS_PRESETS[aspectRatio as keyof typeof VECTOR_CANVAS_PRESETS] || VECTOR_CANVAS_PRESETS["1:1"];

  return {
    intent: request.intent,
    category,
    aspectRatio,
    canvas,
    aesthetic: style,
    palette,
    colorPalette: ["#0f172a", "#4f46e5", "#ffffff"],
    shapeBreakdown: [
      { name: "Fallback Backdrop", type: "rect", description: "Local background shape", fill: "#0f172a", stroke: "#4f46e5", strokeWidth: 2 },
      { name: "Fallback Focal Point", type: "circle", description: "Local focal shape", fill: "#ffffff", stroke: "#4f46e5", strokeWidth: 4 }
    ],
    compositionStrategy: "Offline fallback vector composition strategy.",
    negativePrompt: "low quality, text overlays",
    audit: [
      {
        id: `audit_vec_fallback_${Math.random().toString(36).substring(2, 8)}`,
        type: "intent_received",
        timestamp: new Date().toISOString(),
        title: "Vector Intent Staged Offline",
        description: `Staged intent: "${request.intent}"`
      }
    ],
    provider: {
      name: "frontend-vector-fallback",
      mode: "fallback",
      status: "degraded"
    }
  };
};

const generateFallbackComposition = (plan: VectorPlanResponse): VectorGenerateResponse => {
  const { width, height, viewBox } = plan.canvas;
  const shapes: Record<string, VectorShape> = {};
  const shapeOrder: string[] = [];

  plan.shapeBreakdown.forEach((item, idx) => {
    const shapeId = `shape_fallback_${Math.random().toString(36).substring(2, 8)}`;
    shapeOrder.push(shapeId);

    const baseShape = {
      id: shapeId,
      name: item.name,
      visible: true,
      locked: false,
      opacity: 1.0,
      fill: item.fill,
      stroke: item.stroke,
      strokeWidth: item.strokeWidth,
      transform: { x: 0, y: 0, rotation: 0, scaleX: 1, scaleY: 1 }
    };

    if (item.type === "rect") {
      shapes[shapeId] = {
        ...baseShape,
        type: "rect",
        x: width * 0.1,
        y: height * 0.1,
        width: width * 0.8,
        height: height * 0.8,
        rx: 10
      };
    } else if (item.type === "circle") {
      shapes[shapeId] = {
        ...baseShape,
        type: "circle",
        cx: width / 2,
        cy: height / 2,
        r: Math.min(width, height) * 0.3
      };
    } else if (item.type === "text") {
      shapes[shapeId] = {
        ...baseShape,
        type: "text",
        x: width / 2 - 50,
        y: height * 0.8,
        text: "Offline Vector",
        fontSize: 24
      };
    } else {
      // Default to path (Centered square shape)
      shapes[shapeId] = {
        ...baseShape,
        type: "path",
        d: `M ${width * 0.4} ${height * 0.4} L ${width * 0.6} ${height * 0.4} L ${width * 0.6} ${height * 0.6} L ${width * 0.4} ${height * 0.6} Z`
      };
    }
  });

  return {
    projectId: `proj_vec_fallback_${Math.random().toString(36).substring(2, 8)}`,
    canvas: {
      width,
      height,
      viewBox,
      background: plan.colorPalette[0]
    },
    shapes,
    shapeOrder,
    audit: [
      ...plan.audit,
      {
        id: `audit_gen_fallback_${Math.random().toString(36).substring(2, 8)}`,
        type: "composition_generated",
        timestamp: new Date().toISOString(),
        title: "Vector Blueprint Rendered Offline",
        description: "Built fallback vector shapes record."
      }
    ],
    provider: plan.provider
  };
};

export async function getVectorTemplates(): Promise<VectorTemplate> {
  const envBaseUrl = typeof import.meta !== "undefined" && import.meta.env
    ? import.meta.env.VITE_API_BASE_URL
    : undefined;
  
  const baseUrl = envBaseUrl || "";
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 8000);

  try {
    const response = await fetch(`${baseUrl}/api/vector/templates`, { signal: controller.signal });
    clearTimeout(timeoutId);
    if (!response.ok) throw new Error("HTTP error");
    return await response.json() as VectorTemplate;
  } catch (error) {
    clearTimeout(timeoutId);
    console.warn("Vector API offline. Loading local mock templates.", error);
    return MOCK_TEMPLATES;
  }
}

export async function planVectorComposition(request: VectorPlanRequest): Promise<VectorPlanResponse> {
  const envBaseUrl = typeof import.meta !== "undefined" && import.meta.env
    ? import.meta.env.VITE_API_BASE_URL
    : undefined;
  
  const baseUrl = envBaseUrl || "";
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 8000);

  try {
    const response = await fetch(`${baseUrl}/api/vector/plan`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(request),
      credentials: "include",
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    if (!response.ok) throw new Error("HTTP error");
    return await response.json() as VectorPlanResponse;
  } catch (error) {
    clearTimeout(timeoutId);
    console.warn("Vector API offline. Generating local vector plan.", error);
    return generateFallbackPlan(request);
  }
}

export async function generateVectorComposition(request: VectorGenerateRequest): Promise<VectorGenerateResponse> {
  const envBaseUrl = typeof import.meta !== "undefined" && import.meta.env
    ? import.meta.env.VITE_API_BASE_URL
    : undefined;
  
  const baseUrl = envBaseUrl || "";
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 8000);

  try {
    const response = await fetch(`${baseUrl}/api/vector/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(request),
      credentials: "include",
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    if (!response.ok) throw new Error("HTTP error");
    return await response.json() as VectorGenerateResponse;
  } catch (error) {
    clearTimeout(timeoutId);
    console.warn("Vector API offline. Loading fallback vector layers.", error);
    return generateFallbackComposition(request.plan);
  }
}
