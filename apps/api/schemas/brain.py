from typing import Annotated, List, Optional, Dict, Any, Literal
from pydantic import BaseModel, Field, StringConstraints, model_validator

RecommendationInfluence = Annotated[
    str,
    StringConstraints(strip_whitespace=True, min_length=1, max_length=1000),
]

class RecommendationInfluenceSource(BaseModel):
    proposalId: str = Field(..., min_length=1, max_length=200)
    appliedAtUtc: str = Field(..., min_length=1, max_length=100)

class BrainPlanRequest(BaseModel):
    intent: str = Field(..., min_length=3)
    sessionId: Optional[str] = None
    creativeMode: Optional[str] = None
    recommendationInfluences: List[RecommendationInfluence] = Field(default_factory=list, max_length=10)
    recommendationInfluenceSource: Optional[RecommendationInfluenceSource] = None

    @model_validator(mode="after")
    def source_requires_influences(self):
        if self.recommendationInfluenceSource and not self.recommendationInfluences:
            raise ValueError("recommendationInfluenceSource requires recommendationInfluences")
        return self

class BrainObjective(BaseModel):
    id: str
    title: str
    description: str

class BrainDelegatedTask(BaseModel):
    id: str
    studio: str
    title: str
    priority: str
    status: str

class ProviderMetadata(BaseModel):
    name: str
    mode: str
    version: str

class ReplayAuditEvent(BaseModel):
    id: str
    type: str
    timestamp: str
    title: str
    description: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None

class BrainProviderRoute(BaseModel):
    taskId: str
    studio: str
    provider: str
    mode: Literal["dry-run"]
    reason: str

class BrainGuardianCheck(BaseModel):
    id: str
    status: Literal["passed", "warning", "failed"]
    message: str

class BrainGuardianCritique(BaseModel):
    status: Literal["passed", "repair_required"]
    summary: str
    checks: List[BrainGuardianCheck]

class BrainProposal(BaseModel):
    id: str
    status: Literal["awaiting_user_approval"]
    requiresUserApproval: Literal[True]
    providerExecutionAllowed: Literal[False]

class BrainPlanResponse(BaseModel):
    requestId: str
    intent: str
    summary: str
    objectives: List[BrainObjective]
    delegatedTasks: List[BrainDelegatedTask]
    confidence: float
    provider: ProviderMetadata
    routes: List[BrainProviderRoute]
    guardian: BrainGuardianCritique
    proposal: BrainProposal
    audit: List[ReplayAuditEvent]
    recommendationInfluences: List[str] = Field(default_factory=list)
    recommendationInfluenceSource: Optional[RecommendationInfluenceSource] = None
