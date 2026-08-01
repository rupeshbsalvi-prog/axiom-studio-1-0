from typing import Literal

from fastapi import APIRouter, Cookie, HTTPException, Response, status
from pydantic import BaseModel

from apps.api.core.config import settings
from apps.api.services import auth_session


router = APIRouter(prefix="/api/workspaces", tags=["workspace-policy"])


class WorkspaceMembership(BaseModel):
    workspaceId: str
    memberId: str
    role: Literal["owner", "admin", "member", "viewer"]
    status: Literal["active"] = "active"


class WorkspaceLearningPolicy(BaseModel):
    policyId: str
    policyVersion: Literal[1] = 1
    workspaceId: str
    learningAllowed: bool
    allowedScopes: list[Literal["local_workspace"]] = ["local_workspace"]
    policyRequired: bool
    source: Literal["server_configuration"] = "server_configuration"


class WorkspaceLearningAuthorityResponse(BaseModel):
    contractVersion: Literal["axiom-workspace-learning-authority.v1"] = (
        "axiom-workspace-learning-authority.v1"
    )
    membership: WorkspaceMembership
    policy: WorkspaceLearningPolicy


def _error(status_code: int, detail: str) -> HTTPException:
    return HTTPException(
        status_code=status_code,
        detail=detail,
        headers={"Cache-Control": "no-store"},
    )


@router.get(
    "/{workspace_id}/learning-policy",
    response_model=WorkspaceLearningAuthorityResponse,
)
def get_workspace_learning_policy(
    workspace_id: str,
    response: Response,
    axiom_auth_session: str | None = Cookie(default=None),
) -> WorkspaceLearningAuthorityResponse:
    session = (
        auth_session.get_auth_store().read_session(axiom_auth_session)
        if axiom_auth_session
        else None
    )
    if not session:
        raise _error(
            status.HTTP_401_UNAUTHORIZED,
            "Invalid or expired authentication session.",
        )

    membership = next(
        (
            item
            for item in session.memberships
            if item.workspaceId == workspace_id and item.status == "active"
        ),
        None,
    )
    if not membership:
        raise _error(status.HTTP_404_NOT_FOUND, "Workspace not found.")

    configured_workspace_id = settings.AXIOM_WORKSPACE_ID.strip()
    if not configured_workspace_id or len(configured_workspace_id) > 128:
        raise _error(
            status.HTTP_503_SERVICE_UNAVAILABLE,
            "Workspace policy source is not configured.",
        )
    if workspace_id != configured_workspace_id:
        raise _error(status.HTTP_404_NOT_FOUND, "Workspace not found.")

    response.headers["Cache-Control"] = "no-store"
    return WorkspaceLearningAuthorityResponse(
        membership=WorkspaceMembership.model_validate(membership.model_dump()),
        policy=WorkspaceLearningPolicy(
            policyId=f"{workspace_id}:learning",
            workspaceId=workspace_id,
            learningAllowed=settings.AXIOM_WORKSPACE_LEARNING_ALLOWED,
            policyRequired=settings.AXIOM_WORKSPACE_POLICY_REQUIRED,
        ),
    )
