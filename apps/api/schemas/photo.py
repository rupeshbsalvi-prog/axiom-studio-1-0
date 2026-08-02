from typing import List, Optional, Dict, Any, Literal
from pydantic import BaseModel, ConfigDict, Field

class PhotoPlanRequest(BaseModel):
  intent: str = Field(..., min_length=3, max_length=4000)
  category: Optional[str] = Field(default=None, max_length=100)
  aspectRatio: Optional[str] = Field(default=None, max_length=32)
  lighting: Optional[str] = Field(default=None, max_length=100)
  style: Optional[str] = Field(default=None, max_length=100)

class LayerBreakdownItem(BaseModel):
  name: str
  type: str
  description: str
  blendMode: str
  opacity: float

class RecommendedAdjustments(BaseModel):
  brightness: float = 100.0
  contrast: float = 100.0
  saturation: float = 100.0
  blur: float = 0.0
  hueRotate: float = 0.0
  grayscale: float = 0.0

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

class PhotoPlanResponse(BaseModel):
  intent: str
  category: str
  aspectRatio: str
  canvasSize: Dict[str, int]
  aesthetic: str
  lighting: str
  colorPalette: List[str] = Field(..., max_length=32)
  backgroundStrategy: str
  negativePrompt: str
  layerBreakdown: List[LayerBreakdownItem] = Field(..., max_length=64)
  recommendedAdjustments: RecommendedAdjustments
  audit: List[AuditEvent] = Field(..., max_length=128)
  provider: ProviderInfo

class PhotoGenerateRequest(BaseModel):
  plan: PhotoPlanResponse

class PhotoLayerPosition(BaseModel):
  x: float
  y: float
  width: float
  height: float
  rotation: float

class PhotoLayerAdjustments(BaseModel):
  brightness: float = 100.0
  contrast: float = 100.0
  saturation: float = 100.0
  blur: float = 0.0
  hueRotate: float = 0.0
  grayscale: float = 0.0

class PhotoLayer(BaseModel):
  id: str
  name: str
  type: str # image | gradient | shape | text | texture | placeholder
  visible: bool = True
  opacity: float = 1.0
  blendMode: str = "normal"
  position: PhotoLayerPosition
  source: Optional[str] = None
  adjustments: PhotoLayerAdjustments

class PhotoCanvasState(BaseModel):
  width: int
  height: int
  aspectRatio: str
  background: str

class PhotoGenerateResponse(BaseModel):
  projectId: str
  canvas: PhotoCanvasState
  layers: List[PhotoLayer]
  audit: List[AuditEvent]
  provider: ProviderInfo


class PhotoGatewayCanvasHint(BaseModel):
  model_config = ConfigDict(extra="forbid")
  width: int = Field(..., ge=64, le=4096)
  height: int = Field(..., ge=64, le=4096)
  aspectRatio: str = Field(..., min_length=3, max_length=16)
  transparentBackground: bool


class PhotoGatewayLayer(BaseModel):
  model_config = ConfigDict(extra="forbid")
  index: int = Field(..., ge=0, le=31)
  label: str = Field(..., min_length=1, max_length=100)
  type: str = Field(..., min_length=1, max_length=32)
  blendMode: str = Field(..., min_length=1, max_length=32)
  opacity: float = Field(..., ge=0, le=1)
  transparentBackgroundRequired: Literal[True]


class PhotoGatewaySecurity(BaseModel):
  model_config = ConfigDict(extra="forbid")
  dryRunPreview: Literal[False]
  noRealProviderCalled: Literal[False]
  providerId: Literal["mock-photo-provider"]
  secretsIncluded: Literal[False]
  endpointUrlIncluded: Literal[False]


class PhotoGatewayRequest(BaseModel):
  model_config = ConfigDict(extra="forbid")
  contractVersion: Literal["photo-provider-live-request.v1"]
  routeId: Literal["photo.generate.dev"]
  promptText: str = Field(..., min_length=3, max_length=500)
  canvasHint: PhotoGatewayCanvasHint
  layers: List[PhotoGatewayLayer] = Field(default_factory=list, max_length=16)
  security: PhotoGatewaySecurity


class PhotoGatewayOutputLayer(BaseModel):
  index: int
  label: str
  type: Literal["image"]
  source: str
  width: int
  height: int
  opacity: float
  blendMode: Literal["normal"]


class PhotoGatewayResponse(BaseModel):
  contractVersion: Literal["photo-provider-live-response.v1"]
  routeId: Literal["photo.generate.dev"]
  status: Literal["success"]
  outputLayers: List[PhotoGatewayOutputLayer]
  diagnostics: List[Dict[str, str]] = Field(default_factory=list)


# ---------------------------------------------------------------------------
# Phase 29 — Async Provider Job Lifecycle schemas
# SECURITY: No prompt text, API keys, endpoint URLs, raw provider request/response,
# asset file paths, session cookies, or signing secrets appear in these models.
# ---------------------------------------------------------------------------

class PhotoProviderJobDiagnostic(BaseModel):
  severity: Literal["info", "warning", "error"]
  code: str
  message: str


class PhotoProviderJobEnqueueResponse(BaseModel):
  jobId: str
  status: Literal["queued"]


class PhotoProviderJobStatusResponse(BaseModel):
  jobId: str
  status: Literal["queued", "processing", "completed", "failed", "cancelled"]
  # assetRef present only when status == "completed"; contains signed path, never raw asset or URL
  assetRef: Optional[str] = None
  retryCount: int = 0
  diagnostics: List[PhotoProviderJobDiagnostic] = Field(default_factory=list)
  createdAt: str
  updatedAt: str
