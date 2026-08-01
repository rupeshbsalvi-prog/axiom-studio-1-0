from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field, field_validator
import re

class VectorPlanRequest(BaseModel):
  intent: str = Field(..., min_length=3)
  category: Optional[str] = None
  aspectRatio: Optional[str] = None
  palette: Optional[str] = None
  style: Optional[str] = None

class ShapeBreakdownItem(BaseModel):
  name: str
  type: str # rect | circle | path | text
  description: str
  fill: str
  stroke: str
  strokeWidth: float

class RecommendedAdjustments(BaseModel):
  opacity: float = 1.0
  strokeWidth: float = 2.0

class AuditEvent(BaseModel):
  id: str
  type: str
  timestamp: str
  title: str
  description: Optional[str] = None

class ProviderInfo(BaseModel):
  name: str
  mode: str
  status: str

class VectorPlanResponse(BaseModel):
  intent: str
  category: str
  aspectRatio: str
  canvas: Dict[str, Any] # width, height, viewBox
  aesthetic: str
  palette: str
  colorPalette: List[str]
  shapeBreakdown: List[ShapeBreakdownItem]
  compositionStrategy: str
  negativePrompt: str
  audit: List[AuditEvent]
  provider: ProviderInfo

class VectorGenerateRequest(BaseModel):
  plan: VectorPlanResponse

class VectorShapeTransform(BaseModel):
  x: float
  y: float
  rotation: float
  scaleX: float
  scaleY: float

class VectorShapeModel(BaseModel):
  id: str
  name: str
  type: str # rect | circle | path | text
  visible: bool = True
  locked: bool = False
  opacity: float = Field(1.0, ge=0.0, le=1.0)
  fill: str = Field(..., pattern=r"^(#[a-fA-F0-9]{6}|none)$")
  stroke: str = Field(..., pattern=r"^(#[a-fA-F0-9]{6}|none)$")
  strokeWidth: float = Field(..., ge=0.0)
  
  # Base coordinates
  x: Optional[float] = None
  y: Optional[float] = None
  width: Optional[float] = None
  height: Optional[float] = None
  
  # Circle-specific coordinates
  cx: Optional[float] = None
  cy: Optional[float] = None
  r: Optional[float] = None
  
  # Path data
  d: Optional[str] = None
  
  # Text data
  text: Optional[str] = None
  fontSize: Optional[float] = None
  
  transform: Optional[VectorShapeTransform] = None

  @field_validator("d")
  @classmethod
  def validate_path_d(cls, v: Optional[str]) -> Optional[str]:
    if v is not None:
      # Simple regex check to ensure only valid path letters, numbers, and coordinates
      if not re.match(r"^[MmLlHhVvCcSsQqTtAaZz0-9\s,\-\.]+$", v):
        raise ValueError("Invalid characters detected in SVG path data string.")
    return v

  @field_validator("text")
  @classmethod
  def validate_text_length(cls, v: Optional[str]) -> Optional[str]:
    if v is not None and len(v) > 200:
      raise ValueError("Text content length exceeds 200 characters limit.")
    return v

class VectorCanvasState(BaseModel):
  width: int
  height: int
  viewBox: str
  background: str

class VectorGenerateResponse(BaseModel):
  projectId: str
  canvas: VectorCanvasState
  shapes: Dict[str, VectorShapeModel]
  shapeOrder: List[str]
  audit: List[AuditEvent]
  provider: ProviderInfo
