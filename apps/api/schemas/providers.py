from typing import List
from pydantic import BaseModel

class ProviderItem(BaseModel):
    id: str
    name: str
    type: str
    status: str
    mode: str
    errorRate: float
    latencyMs: int

class ProviderStatusResponse(BaseModel):
    providers: List[ProviderItem]
