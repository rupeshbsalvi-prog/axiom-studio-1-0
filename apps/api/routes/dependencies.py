from fastapi import Cookie, HTTPException, status

from apps.api.core.config import settings
from apps.api.services import auth_session


def require_workspace_authority(
    axiom_auth_session: str | None = Cookie(default=None),
) -> auth_session.AuthWorkspaceMembership:
    session = (
        auth_session.get_auth_store().read_session(axiom_auth_session)
        if axiom_auth_session
        else None
    )
    if not session:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired authentication session.",
        )
    workspace_id = settings.AXIOM_WORKSPACE_ID.strip()
    if not workspace_id or len(workspace_id) > 128:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Workspace authority is not configured.",
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
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No active workspace membership.",
        )
    return membership
