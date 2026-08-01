import type {
  PhotoTemplate,
  PhotoPlanRequest,
  PhotoPlanResponse,
  PhotoGenerateRequest,
  PhotoGenerateResponse,
  PhotoLayer
} from "./photoTypes";

const MOCK_TEMPLATES: PhotoTemplate = {
  categories: ["portrait", "landscape", "product", "character", "campaign"],
  lighting: ["dramatic", "volumetric", "soft", "neon", "studio"],
  aspectRatios: ["1:1", "4:5", "16:9", "9:16"],
  aesthetics: ["luxury", "cinematic", "editorial", "futuristic", "minimal"]
};

const makeFallbackSvgDataUrl = (colorHex: string, label: string) => {
  const encodedColor = colorHex.replace("#", "%23");
  return `data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='400' height='400' viewBox='0 0 400 400'><rect width='400' height='400' fill='${encodedColor}' rx='15'/><text x='200' y='210' font-size='24' font-weight='bold' fill='white' font-family='sans-serif' text-anchor='middle'>${label}</text></svg>`;
};

const generateFallbackPlan = (request: PhotoPlanRequest): PhotoPlanResponse => {
  const category = request.category || "product";
  const aspectRatio = request.aspectRatio || "1:1";
  const style = request.style || "luxury";
  
  const width = aspectRatio === "16:9" ? 1920 : aspectRatio === "9:16" ? 1080 : 1000;
  const height = aspectRatio === "16:9" ? 1080 : aspectRatio === "9:16" ? 1920 : 1000;

  return {
    intent: request.intent,
    category,
    aspectRatio,
    canvasSize: { width, height },
    aesthetic: style,
    lighting: request.lighting || "studio",
    colorPalette: ["#0f172a", "#1e1b4b", "#cbd5e1"],
    backgroundStrategy: "Local offline fallback studio backdrop.",
    negativePrompt: "blurry, noise, poor quality",
    layerBreakdown: [
      { name: "Fallback Studio Backdrop", type: "placeholder", description: "Offline color field backdrop", blendMode: "normal", opacity: 1.0 },
      { name: "Fallback Subject", type: "image", description: "Centered offline focal visualizer", blendMode: "normal", opacity: 1.0 }
    ],
    recommendedAdjustments: {
      brightness: 100,
      contrast: 100,
      saturation: 100,
      blur: 0,
      hueRotate: 0,
      grayscale: 0
    },
    audit: [
      {
        id: `audit_photo_fallback_${Math.random().toString(36).substring(2, 8)}`,
        type: "intent_received",
        timestamp: new Date().toISOString(),
        title: "Intent Captured Offline",
        description: `Captured intent: "${request.intent}"`
      }
    ],
    provider: {
      name: "frontend-fallback-mock",
      mode: "fallback",
      status: "degraded"
    }
  };
};

const generateFallbackComposition = (plan: PhotoPlanResponse): PhotoGenerateResponse => {
  const { width, height } = plan.canvasSize;
  const layers: PhotoLayer[] = plan.layerBreakdown.map((item, idx) => {
    const layerId = `layer_fallback_${Math.random().toString(36).substring(2, 8)}`;
    const color = plan.colorPalette[idx % plan.colorPalette.length];
    
    let pos_w = width;
    let pos_h = height;
    let pos_x = 0;
    let pos_y = 0;

    if (item.type === "image") {
      pos_w = Math.round(width * 0.7);
      pos_h = Math.round(height * 0.7);
      pos_x = Math.round((width - pos_w) / 2);
      pos_y = Math.round((height - pos_h) / 2);
    }

    return {
      id: layerId,
      name: item.name,
      type: item.type as any,
      visible: true,
      opacity: item.opacity,
      blendMode: item.blendMode,
      position: { x: pos_x, y: pos_y, width: pos_w, height: pos_h, rotation: 0 },
      source: makeFallbackSvgDataUrl(color, `Offline: ${item.name}`),
      adjustments: {
        brightness: plan.recommendedAdjustments.brightness,
        contrast: plan.recommendedAdjustments.contrast,
        saturation: plan.recommendedAdjustments.saturation,
        blur: plan.recommendedAdjustments.blur,
        hueRotate: plan.recommendedAdjustments.hueRotate,
        grayscale: plan.recommendedAdjustments.grayscale
      }
    };
  });

  return {
    projectId: `proj_photo_fallback_${Math.random().toString(36).substring(2, 8)}`,
    canvas: {
      width,
      height,
      aspectRatio: plan.aspectRatio,
      background: plan.colorPalette[0]
    },
    layers,
    audit: [
      ...plan.audit,
      {
        id: `audit_gen_fallback_${Math.random().toString(36).substring(2, 8)}`,
        type: "composition_generated",
        timestamp: new Date().toISOString(),
        title: "Composition Built Offline",
        description: "Assembled simulated offline vector layers."
      }
    ],
    provider: plan.provider
  };
};

export async function getPhotoTemplates(): Promise<PhotoTemplate> {
  const envBaseUrl = typeof import.meta !== "undefined" && import.meta.env
    ? import.meta.env.VITE_API_BASE_URL
    : undefined;
  
  const baseUrl = envBaseUrl || "http://localhost:8000";
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 8000);

  try {
    const response = await fetch(`${baseUrl}/api/photo/templates`, { signal: controller.signal });
    clearTimeout(timeoutId);
    if (!response.ok) throw new Error("HTTP error");
    return await response.json() as PhotoTemplate;
  } catch (error) {
    clearTimeout(timeoutId);
    console.warn("Photo API offline. Loading local mock templates.", error);
    return MOCK_TEMPLATES;
  }
}

export async function planPhotoComposition(request: PhotoPlanRequest): Promise<PhotoPlanResponse> {
  const envBaseUrl = typeof import.meta !== "undefined" && import.meta.env
    ? import.meta.env.VITE_API_BASE_URL
    : undefined;
  
  const baseUrl = envBaseUrl || "http://localhost:8000";
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 8000);

  try {
    const response = await fetch(`${baseUrl}/api/photo/plan`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(request),
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    if (!response.ok) throw new Error("HTTP error");
    return await response.json() as PhotoPlanResponse;
  } catch (error) {
    clearTimeout(timeoutId);
    console.warn("Photo API offline. Generating local plan.", error);
    return generateFallbackPlan(request);
  }
}

export async function generatePhotoComposition(request: PhotoGenerateRequest): Promise<PhotoGenerateResponse> {
  const envBaseUrl = typeof import.meta !== "undefined" && import.meta.env
    ? import.meta.env.VITE_API_BASE_URL
    : undefined;
  
  const baseUrl = envBaseUrl || "http://localhost:8000";
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 8000);

  try {
    const response = await fetch(`${baseUrl}/api/photo/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(request),
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    if (!response.ok) throw new Error("HTTP error");
    return await response.json() as PhotoGenerateResponse;
  } catch (error) {
    clearTimeout(timeoutId);
    console.warn("Photo API offline. Assembling offline layers.", error);
    return generateFallbackComposition(request.plan);
  }
}
