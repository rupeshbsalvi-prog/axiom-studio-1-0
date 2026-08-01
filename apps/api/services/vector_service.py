import uuid
import datetime
from typing import Dict, Any, List
from apps.api.schemas.vector import (
  VectorPlanRequest,
  VectorPlanResponse,
  VectorGenerateRequest,
  VectorGenerateResponse,
  VectorShapeModel,
  VectorShapeTransform,
  VectorCanvasState,
  ShapeBreakdownItem,
  AuditEvent,
  ProviderInfo
)

CATEGORIES = ["logo", "icon", "illustration", "diagram", "infographic"]
AESTHETICS = ["modern", "minimalist", "retro", "isometric", "futuristic"]
PALETTES = ["monochrome", "neon", "editorial", "brand", "pastel"]

VECTOR_CANVAS_PRESETS = {
  "1:1": {"width": 1024, "height": 1024, "viewBox": "0 0 1024 1024"},
  "4:5": {"width": 1080, "height": 1350, "viewBox": "0 0 1080 1350"},
  "16:9": {"width": 1920, "height": 1080, "viewBox": "0 0 1920 1080"},
  "9:16": {"width": 1080, "height": 1920, "viewBox": "0 0 1080 1920"}
}

COLOR_PALETTES = {
  "monochrome": ["#000000", "#1e293b", "#475569", "#cbd5e1", "#ffffff"],
  "neon": ["#0b0f19", "#ff007f", "#00f0ff", "#39ff14", "#ffff00"],
  "editorial": ["#1c1917", "#78716c", "#d6d3d1", "#f5f5f4", "#e7e5e4"],
  "brand": ["#0f172a", "#4f46e5", "#818cf8", "#cbd5e1", "#f8fafc"],
  "pastel": ["#fef08a", "#bbf7d0", "#bfdbfe", "#fbcfe8", "#ffffff"]
}

class VectorPlannerService:
  @staticmethod
  def get_templates() -> Dict[str, List[str]]:
    return {
      "categories": CATEGORIES,
      "aesthetics": AESTHETICS,
      "aspectRatios": list(VECTOR_CANVAS_PRESETS.keys()),
      "palettes": PALETTES
    }

  @classmethod
  def generate_composition_plan(cls, request: VectorPlanRequest) -> VectorPlanResponse:
    category = request.category or "logo"
    aspect_ratio = request.aspectRatio or "1:1"
    aesthetic = request.style or "modern"
    palette_name = request.palette or "brand"

    canvas_preset = VECTOR_CANVAS_PRESETS.get(aspect_ratio, VECTOR_CANVAS_PRESETS["1:1"])
    palette = COLOR_PALETTES.get(palette_name, COLOR_PALETTES["brand"])

    # Build layers based on category
    shape_breakdown = []
    if category == "logo":
      shape_breakdown = [
        ShapeBreakdownItem(name="Background Shield", type="rect", description="Outer container box", fill=palette[0], stroke=palette[3], strokeWidth=4),
        ShapeBreakdownItem(name="Emblem Crest Icon", type="path", description="Procedural logo core path shape", fill=palette[1], stroke=palette[2], strokeWidth=3),
        ShapeBreakdownItem(name="Brand Wordmark Text", type="text", description="Bottom aligned title text", fill=palette[4], stroke=palette[4], strokeWidth=0)
      ]
    elif category == "icon":
      shape_breakdown = [
        ShapeBreakdownItem(name="Outer Circle Frame", type="circle", description="Perfect circular frame bounds", fill=palette[0], stroke=palette[1], strokeWidth=8),
        ShapeBreakdownItem(name="Icon Graphic Detail", type="path", description="Centered geometry detail", fill="none", stroke=palette[2], strokeWidth=6)
      ]
    else:
      shape_breakdown = [
        ShapeBreakdownItem(name="Layout Base Block", type="rect", description="Card background rectangle", fill=palette[0], stroke=palette[2], strokeWidth=2),
        ShapeBreakdownItem(name="Decorative Center Node", type="circle", description="Centered graphic highlight", fill=palette[1], stroke="none", strokeWidth=0),
        ShapeBreakdownItem(name="Label Typography", type="text", description="Main body label", fill=palette[4], stroke=palette[4], strokeWidth=0)
      ]

    now_iso = datetime.datetime.now(datetime.timezone.utc).isoformat().replace("+00:00", "Z")

    audit = [
      AuditEvent(
        id=f"audit_vec_init_{uuid.uuid4().hex[:8]}",
        type="intent_received",
        timestamp=now_iso,
        title="Vector Intent Received",
        description=f"Received prompt: '{request.intent}' with target category: '{category}'"
      ),
      AuditEvent(
        id=f"audit_vec_plan_{uuid.uuid4().hex[:8]}",
        type="plan_generated",
        timestamp=now_iso,
        title="Vector Blueprint Staged",
        description=f"Staged blueprint for aspect ratio {aspect_ratio} ({canvas_preset['viewBox']})"
      )
    ]

    return VectorPlanResponse(
      intent=request.intent,
      category=category,
      aspectRatio=aspect_ratio,
      canvas=canvas_preset,
      aesthetic=aesthetic,
      palette=palette_name,
      colorPalette=palette,
      shapeBreakdown=shape_breakdown,
      compositionStrategy=f"Create a clean {aesthetic} vector composition using parametric shapes.",
      negativePrompt="unsafe, distorted, complex details",
      layerBreakdown=shape_breakdown,
      recommendedAdjustments={"opacity": 1.0, "strokeWidth": 2.0},
      audit=audit,
      provider=ProviderInfo(
        name="mock-vector-planner",
        mode="mock",
        status="active"
      )
    )

  @classmethod
  def generate_placeholder_composition(cls, request: VectorGenerateRequest) -> VectorGenerateResponse:
    plan = request.plan
    width = plan.canvas["width"]
    height = plan.canvas["height"]
    viewBox = plan.canvas["viewBox"]
    palette = plan.colorPalette

    shapes: Dict[str, VectorShapeModel] = {}
    shape_order: List[str] = []

    # Map center coordinate bounds based on aspect ratio
    center_x = int(width / 2)
    center_y = int(height / 2)

    for idx, item in enumerate(plan.shapeBreakdown):
      shape_id = f"shape_{uuid.uuid4().hex[:8]}"
      shape_order.append(shape_id)

      # Create default transform
      transform = VectorShapeTransform(x=0.0, y=0.0, rotation=0.0, scaleX=1.0, scaleY=1.0)

      if item.type == "rect":
        # Centered rectangle with padding
        rect_w = int(width * 0.9)
        rect_h = int(height * 0.9)
        rect_x = int((width - rect_w) / 2)
        rect_y = int((height - rect_h) / 2)

        shapes[shape_id] = VectorShapeModel(
          id=shape_id,
          name=item.name,
          type="rect",
          visible=True,
          locked=False,
          opacity=1.0,
          fill=item.fill,
          stroke=item.stroke,
          strokeWidth=item.strokeWidth,
          x=float(rect_x),
          y=float(rect_y),
          width=float(rect_w),
          height=float(rect_h),
          rx=12.0,
          transform=transform
        )

      elif item.type == "circle":
        # Centered circle
        radius = int(min(width, height) * 0.3)
        shapes[shape_id] = VectorShapeModel(
          id=shape_id,
          name=item.name,
          type="circle",
          visible=True,
          locked=False,
          opacity=1.0,
          fill=item.fill,
          stroke=item.stroke,
          strokeWidth=item.strokeWidth,
          cx=float(center_x),
          cy=float(center_y),
          r=float(radius),
          transform=transform
        )

      elif item.type == "text":
        # Label text placed near the bottom
        text_y = int(height * 0.8)
        shapes[shape_id] = VectorShapeModel(
          id=shape_id,
          name=item.name,
          type="text",
          visible=True,
          locked=False,
          opacity=1.0,
          fill=item.fill,
          stroke=item.stroke,
          strokeWidth=item.strokeWidth,
          x=float(center_x - 100),
          y=float(text_y),
          text="Axiom Creative",
          fontSize=36.0,
          transform=transform
        )

      elif item.type == "path":
        # Draw a beautiful star shape path centered
        scale = min(width, height) / 1024
        # Procedural path coordinates scaled from base 1024x1024 layout
        scaled_path = (
          f"M {512*scale} {300*scale} "
          f"L {570*scale} {450*scale} "
          f"L {720*scale} {450*scale} "
          f"L {600*scale} {550*scale} "
          f"L {650*scale} {700*scale} "
          f"L {512*scale} {600*scale} "
          f"L {374*scale} {700*scale} "
          f"L {424*scale} {550*scale} "
          f"L {304*scale} {450*scale} "
          f"L {454*scale} {450*scale} Z"
        )

        shapes[shape_id] = VectorShapeModel(
          id=shape_id,
          name=item.name,
          type="path",
          visible=True,
          locked=False,
          opacity=1.0,
          fill=item.fill,
          stroke=item.stroke,
          strokeWidth=item.strokeWidth,
          d=scaled_path,
          transform=transform
        )

    now_iso = datetime.datetime.now(datetime.timezone.utc).isoformat().replace("+00:00", "Z")
    audit = list(plan.audit)
    audit.append(
      AuditEvent(
        id=f"audit_vec_gen_{uuid.uuid4().hex[:8]}",
        type="composition_generated",
        timestamp=now_iso,
        title="Vector Assets Populated",
        description=f"Generated {len(shapes)} parametric vector objects directly in canvas state."
      )
    )

    return VectorGenerateResponse(
      projectId=f"proj_vec_{uuid.uuid4().hex[:8]}",
      canvas=VectorCanvasState(
        width=width,
        height=height,
        viewBox=viewBox,
        background=palette[0]
      ),
      shapes=shapes,
      shapeOrder=shape_order,
      audit=audit,
      provider=plan.provider
    )
