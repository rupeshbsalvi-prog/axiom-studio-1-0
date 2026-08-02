import asyncio

import pytest

from apps.api.core.config import settings
from apps.api.services import auth_session


@pytest.fixture(autouse=True)
def legacy_event_loop_compatibility():
    """Supports older synchronous tests that still call get_event_loop()."""
    try:
        asyncio.get_running_loop()
    except RuntimeError:
        asyncio.set_event_loop(asyncio.new_event_loop())
    yield


def authenticate_workspace_client(client) -> None:
    token = auth_session.get_auth_store().create_session(
        "test-user",
        "test@example.com",
        [
            auth_session.AuthWorkspaceMembership(
                workspaceId=settings.AXIOM_WORKSPACE_ID,
                memberId="test-user",
                role="member",
            )
        ],
    )
    client.cookies.set(auth_session.AUTH_SESSION_COOKIE_NAME, token, path="/api")
