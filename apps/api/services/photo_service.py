import uuid
import datetime
from typing import Dict, Any, List
from apps.api.schemas.photo import (
  PhotoPlanRequest,
  PhotoPlanResponse,
  PhotoGenerateRequest,
  PhotoGenerateResponse,
  PhotoLayer,
  PhotoLayerPosition,
  PhotoLayerAdjustments,
  PhotoCanvasState,
  LayerBreakdownItem,
  RecommendedAdjustments,
  AuditEvent,
  ProviderInfo
)

CATEGORIES = ["portrait", "landscape", "product", "character", "campaign"]
LIGHTING = ["dramatic", "volumetric", "soft", "neon", "studio"]
AESTHETICS = ["luxury", "cinematic", "editorial", "futuristic", "minimal"]

ASPECT_RATIOS = {
  "1:1": {"width": 1000, "height": 1000},
  "4:5": {"width": 1000, "height": 1250},
  "16:9": {"width": 1920, "height": 1080},
  "9:16": {"width": 1080, "height": 1920}
}

def make_svg_data_url(color_hex: str, label: str = "") -> str:
  encoded_color = color_hex.replace("#", "%23")
  if label:
    return f"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='400' height='400' viewBox='0 0 400 400'><rect width='400' height='400' fill='{encoded_color}' rx='15'/><text x='200' y='210' font-size='24' font-weight='bold' fill='white' font-family='sans-serif' text-anchor='middle'>{label}</text></svg>"
  else:
    return f"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='400' height='400'><rect width='400' height='400' fill='{encoded_color}' rx='15'/></svg>"

class PhotoPlannerService:
  @staticmethod
  def get_templates() -> Dict[str, List[str]]:
    return {
      "categories": CATEGORIES,
      "lighting": LIGHTING,
      "aspectRatios": list(ASPECT_RATIOS.keys()),
      "aesthetics": AESTHETICS
    }

  @classmethod
  def generate_composition_plan(cls, request: PhotoPlanRequest) -> PhotoPlanResponse:
    category = request.category or "product"
    aspect_ratio = request.aspectRatio or "1:1"
    lighting = request.lighting or "studio"
    style = request.style or "luxury"

    dimensions = ASPECT_RATIOS.get(aspect_ratio, {"width": 1000, "height": 1000})

    # Build layers based on category
    layer_breakdown = []
    if category == "product":
      layer_breakdown = [
        LayerBreakdownItem(name="Background Studio Set", type="gradient", description="A smooth studio backdrop gradient", blendMode="normal", opacity=1.0),
        LayerBreakdownItem(name="Dramatic Rim Light Overlay", type="placeholder", description="Volumetric neon highlight layer", blendMode="screen", opacity=0.8),
        LayerBreakdownItem(name="Hero Product Container", type="image", description="Crisp centered container for the product visualizer", blendMode="normal", opacity=1.0),
        LayerBreakdownItem(name="Reflective Surface Cast", type="texture", description="Subtle floor reflection layer", blendMode="overlay", opacity=0.4)
      ]
    elif category == "portrait":
      layer_breakdown = [
        LayerBreakdownItem(name="Soft Studio Backdrop", type="placeholder", description="Volumetric studio lighting vignette", blendMode="normal", opacity=1.0),
        LayerBreakdownItem(name="Model Subject Focus", type="image", description="High-fidelity centered portrait layer", blendMode="normal", opacity=1.0),
        LayerBreakdownItem(name="Color Grading Overlay", type="gradient", description="Warm editorial grade gradient", blendMode="color", opacity=0.3)
      ]
    else:
      layer_breakdown = [
        LayerBreakdownItem(name="Base Environment Layer", type="placeholder", description="Scenic layout background", blendMode="normal", opacity=1.0),
        LayerBreakdownItem(name="Focal Point Element", type="image", description="Primary subject composition layer", blendMode="normal", opacity=1.0),
        LayerBreakdownItem(name="Overlay Text Typography", type="text", description="Editorial header layout text", blendMode="normal", opacity=0.9)
      ]

    # Map recommended adjustments based on aesthetic style
    adjustments = RecommendedAdjustments()
    if style == "luxury":
      adjustments = RecommendedAdjustments(brightness=105, contrast=110, saturation=95, blur=0, hueRotate=0, grayscale=0)
    elif style == "cinematic":
      adjustments = RecommendedAdjustments(brightness=95, contrast=115, saturation=105, blur=1, hueRotate=5, grayscale=0)
    elif style == "minimal":
      adjustments = RecommendedAdjustments(brightness=100, contrast=95, saturation=80, blur=0, hueRotate=0, grayscale=0)

    now_iso = datetime.datetime.now(datetime.timezone.utc).isoformat().replace("+00:00", "Z")

    audit = [
      AuditEvent(
        id=f"audit_photo_init_{uuid.uuid4().hex[:8]}",
        type="intent_received",
        timestamp=now_iso,
        title="Creative Intent Received",
        description=f"Received prompt: '{request.intent}' with target category: '{category}'"
      ),
      AuditEvent(
        id=f"audit_photo_plan_{uuid.uuid4().hex[:8]}",
        type="plan_generated",
        timestamp=now_iso,
        title="Composition Plan Generated",
        description=f"Generated layout plan for aspect ratio {aspect_ratio} ({dimensions['width']}x{dimensions['height']})"
      )
    ]

    return PhotoPlanResponse(
      intent=request.intent,
      category=category,
      aspectRatio=aspect_ratio,
      canvasSize=dimensions,
      aesthetic=style,
      lighting=lighting,
      colorPalette=["#0f172a", "#1e1b4b", "#312e81", "#818cf8", "#cbd5e1"],
      backgroundStrategy="Clean procedural studio lighting backdrop.",
      negativePrompt="blurry, distorted, noise, poor lighting, artifacts",
      layerBreakdown=layer_breakdown,
      recommendedAdjustments=adjustments,
      audit=audit,
      provider=ProviderInfo(
        name="mock-photo-planner",
        mode="mock",
        status="active"
      )
    )

  @classmethod
  def generate_placeholder_composition(cls, request: PhotoGenerateRequest) -> PhotoGenerateResponse:
    plan = request.plan
    width = plan.canvasSize["width"]
    height = plan.canvasSize["height"]

    layers: List[PhotoLayer] = []
    
    # Generate placeholder layers dynamically
    for idx, item in enumerate(plan.layerBreakdown):
      layer_id = f"layer_{uuid.uuid4().hex[:8]}"
      
      # Determine a procedural background color
      color_hex = plan.colorPalette[idx % len(plan.colorPalette)]
      source_url = make_svg_data_url(color_hex, f"Layer: {item.name}")
      
      # Layout composition layers centered with padding
      pos_w = width
      pos_h = height
      pos_x = 0
      pos_y = 0

      if item.type == "image":
        pos_w = int(width * 0.7)
        pos_h = int(height * 0.7)
        pos_x = int((width - pos_w) / 2)
        pos_y = int((height - pos_h) / 2)
      elif item.type == "text":
        pos_w = int(width * 0.8)
        pos_h = int(height * 0.2)
        pos_x = int((width - pos_w) / 2)
        pos_y = int(height * 0.7)

      pos = PhotoLayerPosition(x=pos_x, y=pos_y, width=pos_w, height=pos_h, rotation=0.0)
      
      adj = PhotoLayerAdjustments(
        brightness=plan.recommendedAdjustments.brightness,
        contrast=plan.recommendedAdjustments.contrast,
        saturation=plan.recommendedAdjustments.saturation,
        blur=plan.recommendedAdjustments.blur,
        hueRotate=plan.recommendedAdjustments.hueRotate,
        grayscale=plan.recommendedAdjustments.grayscale
      )

      layers.append(
        PhotoLayer(
          id=layer_id,
          name=item.name,
          type=item.type,
          visible=True,
          opacity=item.opacity,
          blendMode=item.blendMode,
          position=pos,
          source=source_url,
          adjustments=adj
        )
      )

    now_iso = datetime.datetime.now(datetime.timezone.utc).isoformat().replace("+00:00", "Z")
    
    audit = list(plan.audit)
    audit.append(
      AuditEvent(
        id=f"audit_photo_gen_{uuid.uuid4().hex[:8]}",
        type="composition_generated",
        timestamp=now_iso,
        title="Placeholder Composition Built",
        description=f"Constructed {len(layers)} procedurally colored vector layers on a {width}x{height} canvas."
      )
    )

    return PhotoGenerateResponse(
      projectId=f"proj_photo_{uuid.uuid4().hex[:8]}",
      canvas=PhotoCanvasState(
        width=width,
        height=height,
        aspectRatio=plan.aspectRatio,
        background=plan.colorPalette[0]
      ),
      layers=layers,
      audit=audit,
      provider=plan.provider
    )
