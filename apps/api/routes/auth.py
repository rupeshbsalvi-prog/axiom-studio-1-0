from typing import Literal

from fastapi import APIRouter, Cookie, HTTPException, Response, status
from fastapi.responses import RedirectResponse
from pydantic import BaseModel

from apps.api.core.config import settings
from apps.api.services import auth_session


router = APIRouter(prefix="/api/auth", tags=["auth"])


class AuthUserResponse(BaseModel):
    id: str
    email: str | None


class AuthSessionResponse(BaseModel):
    contractVersion: Literal["axiom-auth-session.v1"] = "axiom-auth-session.v1"
    status: Literal["authenticated"] = "authenticated"
    user: AuthUserResponse
    memberships: list[auth_session.AuthWorkspaceMembership]


def _unauthorized() -> HTTPException:
    return HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid or expired authentication session.",
    )


@router.get("/login")
def start_login() -> RedirectResponse:
    try:
        flow_token, authorization_url = auth_session.create_login_flow()
    except auth_session.AuthConfigurationError:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Authentication provider is not configured.",
        )
    except auth_session.AuthFlowCapacityError:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Too many pending authentication flows.",
            headers={"Retry-After": "60"},
        )
    response = RedirectResponse(authorization_url, status_code=status.HTTP_307_TEMPORARY_REDIRECT)
    response.headers["Cache-Control"] = "no-store"
    response.set_cookie(
        auth_session.AUTH_FLOW_COOKIE_NAME,
        flow_token,
        httponly=True,
        secure=settings.AXIOM_SECURE_COOKIES,
        samesite="lax",
        max_age=settings.AXIOM_AUTH_FLOW_TTL_SECONDS,
        path=auth_session.AUTH_FLOW_COOKIE_PATH,
    )
    return response


@router.get("/callback")
async def complete_login(
    code: str,
    state: str,
    axiom_auth_flow: str | None = Cookie(default=None),
) -> RedirectResponse:
    verifier = (
        auth_session.get_auth_store().consume_flow(axiom_auth_flow, state)
        if axiom_auth_flow
        else None
    )
    if not verifier:
        raise _unauthorized()
    try:
        identity = await auth_session.exchange_supabase_code(code, verifier)
        memberships = await auth_session.fetch_workspace_memberships(
            identity.access_token, identity.user_id
        )
    except auth_session.AuthProviderError:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Identity provider request failed.",
        )
    if not memberships:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No active workspace membership.",
        )
    session_token = auth_session.get_auth_store().create_session(
        identity.user_id, identity.email, memberships
    )
    response = RedirectResponse(
        settings.AXIOM_AUTH_POST_LOGIN_REDIRECT,
        status_code=status.HTTP_303_SEE_OTHER,
    )
    response.headers["Cache-Control"] = "no-store"
    response.delete_cookie(
        auth_session.AUTH_FLOW_COOKIE_NAME,
        path=auth_session.AUTH_FLOW_COOKIE_PATH,
    )
    response.set_cookie(
        auth_session.AUTH_SESSION_COOKIE_NAME,
        session_token,
        httponly=True,
        secure=settings.AXIOM_SECURE_COOKIES,
        samesite="lax",
        max_age=settings.AXIOM_AUTH_SESSION_TTL_SECONDS,
        path=auth_session.AUTH_SESSION_COOKIE_PATH,
    )
    return response


@router.get("/session", response_model=AuthSessionResponse)
def read_session(
    response: Response,
    axiom_auth_session: str | None = Cookie(default=None),
) -> AuthSessionResponse:
    stored = (
        auth_session.get_auth_store().read_session(axiom_auth_session)
        if axiom_auth_session
        else None
    )
    if not stored:
        raise _unauthorized()
    response.headers["Cache-Control"] = "no-store"
    return AuthSessionResponse(
        user=AuthUserResponse(id=stored.user_id, email=stored.email),
        memberships=stored.memberships,
    )


@router.delete("/session", status_code=status.HTTP_204_NO_CONTENT)
def logout(
    response: Response,
    axiom_auth_session: str | None = Cookie(default=None),
) -> None:
    if axiom_auth_session:
        auth_session.get_auth_store().revoke_session(axiom_auth_session)
    response.delete_cookie(
        auth_session.AUTH_SESSION_COOKIE_NAME,
        path=auth_session.AUTH_SESSION_COOKIE_PATH,
    )
