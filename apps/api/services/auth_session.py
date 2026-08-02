import base64
import hashlib
import hmac
import json
import secrets
import sqlite3
import time
from contextlib import contextmanager
from pathlib import Path
from typing import Literal
from urllib.parse import parse_qsl, urlencode, urlparse, urlunparse

import httpx
from pydantic import BaseModel

from apps.api.core.config import settings
from apps.api.services.supabase_persistence import SupabasePersistence


AUTH_FLOW_COOKIE_NAME = "axiom_auth_flow"
AUTH_SESSION_COOKIE_NAME = "axiom_auth_session"
AUTH_FLOW_COOKIE_PATH = "/api/auth"
AUTH_SESSION_COOKIE_PATH = "/api"
MAX_PENDING_AUTH_FLOWS = 1000

_store: "AuthSessionStore | None" = None
_store_root: str | None = None


class AuthProviderError(RuntimeError):
    pass


class AuthConfigurationError(RuntimeError):
    pass


class AuthFlowCapacityError(RuntimeError):
    pass


class SupabaseIdentity(BaseModel):
    user_id: str
    email: str | None
    access_token: str


class AuthWorkspaceMembership(BaseModel):
    workspaceId: str
    memberId: str
    role: Literal["owner", "admin", "member", "viewer"]
    status: Literal["active"] = "active"


class StoredAuthSession(BaseModel):
    user_id: str
    email: str | None
    memberships: list[AuthWorkspaceMembership]


def _token_hash(token: str) -> str:
    return hashlib.sha256(token.encode()).hexdigest()


class AuthSessionStore:
    def __init__(self, root: str):
        runtime_root = Path(root).resolve()
        runtime_root.mkdir(parents=True, exist_ok=True)
        self.database = runtime_root / "auth.sqlite3"
        self._migrate()

    @contextmanager
    def _connect(self):
        connection = sqlite3.connect(self.database, timeout=5)
        connection.execute("PRAGMA journal_mode=WAL")
        try:
            yield connection
            connection.commit()
        except Exception:
            connection.rollback()
            raise
        finally:
            connection.close()

    def _migrate(self) -> None:
        with self._connect() as connection:
            connection.executescript(
                """
                CREATE TABLE IF NOT EXISTS auth_flows (
                    flow_hash TEXT PRIMARY KEY,
                    state_hash TEXT NOT NULL,
                    code_verifier TEXT NOT NULL,
                    expires_at INTEGER NOT NULL
                );
                CREATE TABLE IF NOT EXISTS auth_sessions (
                    token_hash TEXT PRIMARY KEY,
                    user_id TEXT NOT NULL,
                    email TEXT,
                    memberships_json TEXT NOT NULL,
                    expires_at INTEGER NOT NULL
                );
                """
            )

    def create_flow(self) -> tuple[str, str, str]:
        flow_token = secrets.token_urlsafe(32)
        state = secrets.token_urlsafe(32)
        verifier = secrets.token_urlsafe(48)
        expires_at = int(time.time()) + settings.AXIOM_AUTH_FLOW_TTL_SECONDS
        with self._connect() as connection:
            connection.execute("DELETE FROM auth_flows WHERE expires_at <= ?", (int(time.time()),))
            if connection.execute("SELECT COUNT(*) FROM auth_flows").fetchone()[0] >= MAX_PENDING_AUTH_FLOWS:
                raise AuthFlowCapacityError
            connection.execute(
                "INSERT INTO auth_flows(flow_hash, state_hash, code_verifier, expires_at) "
                "VALUES (?, ?, ?, ?)",
                (_token_hash(flow_token), _token_hash(state), verifier, expires_at),
            )
        challenge = base64.urlsafe_b64encode(hashlib.sha256(verifier.encode()).digest()).decode().rstrip("=")
        return flow_token, state, challenge

    def consume_flow(self, flow_token: str, state: str) -> str | None:
        with self._connect() as connection:
            connection.execute("BEGIN IMMEDIATE")
            flow_hash = _token_hash(flow_token)
            row = connection.execute(
                "SELECT state_hash, code_verifier, expires_at FROM auth_flows WHERE flow_hash = ?",
                (flow_hash,),
            ).fetchone()
            connection.execute("DELETE FROM auth_flows WHERE flow_hash = ?", (flow_hash,))
        if not row or row[2] <= int(time.time()):
            return None
        return row[1] if hmac.compare_digest(row[0], _token_hash(state)) else None

    def create_session(
        self,
        user_id: str,
        email: str | None,
        memberships: list[AuthWorkspaceMembership],
    ) -> str:
        token = secrets.token_urlsafe(32)
        expires_at = int(time.time()) + settings.AXIOM_AUTH_SESSION_TTL_SECONDS
        payload = json.dumps([membership.model_dump() for membership in memberships])
        with self._connect() as connection:
            connection.execute("DELETE FROM auth_sessions WHERE expires_at <= ?", (int(time.time()),))
            connection.execute(
                "INSERT INTO auth_sessions(token_hash, user_id, email, memberships_json, expires_at) "
                "VALUES (?, ?, ?, ?, ?)",
                (_token_hash(token), user_id, email, payload, expires_at),
            )
        return token

    def read_session(self, token: str) -> StoredAuthSession | None:
        token_hash = _token_hash(token)
        with self._connect() as connection:
            row = connection.execute(
                "SELECT user_id, email, memberships_json, expires_at "
                "FROM auth_sessions WHERE token_hash = ?",
                (token_hash,),
            ).fetchone()
            if row and row[3] <= int(time.time()):
                connection.execute("DELETE FROM auth_sessions WHERE token_hash = ?", (token_hash,))
                row = None
        if not row:
            return None
        try:
            memberships = [AuthWorkspaceMembership.model_validate(item) for item in json.loads(row[2])]
        except (TypeError, ValueError, json.JSONDecodeError):
            self.revoke_session(token)
            return None
        return StoredAuthSession(user_id=row[0], email=row[1], memberships=memberships)

    def revoke_session(self, token: str) -> None:
        with self._connect() as connection:
            connection.execute(
                "DELETE FROM auth_sessions WHERE token_hash = ?", (_token_hash(token),)
            )


class SupabaseAuthSessionStore:
    def __init__(self, persistence: SupabasePersistence):
        self.persistence = persistence

    def create_flow(self) -> tuple[str, str, str]:
        flow_token = secrets.token_urlsafe(32)
        state = secrets.token_urlsafe(32)
        verifier = secrets.token_urlsafe(48)
        created = self.persistence.create_auth_flow(
            _token_hash(flow_token),
            _token_hash(state),
            verifier,
            int(time.time()) + settings.AXIOM_AUTH_FLOW_TTL_SECONDS,
            MAX_PENDING_AUTH_FLOWS,
        )
        if not created:
            raise AuthFlowCapacityError
        challenge = base64.urlsafe_b64encode(hashlib.sha256(verifier.encode()).digest()).decode().rstrip("=")
        return flow_token, state, challenge

    def consume_flow(self, flow_token: str, state: str) -> str | None:
        return self.persistence.consume_auth_flow(_token_hash(flow_token), _token_hash(state))

    def create_session(
        self,
        user_id: str,
        email: str | None,
        memberships: list[AuthWorkspaceMembership],
    ) -> str:
        token = secrets.token_urlsafe(32)
        self.persistence.put_session(
            "auth",
            _token_hash(token),
            {
                "user_id": user_id,
                "email": email,
                "memberships": [membership.model_dump() for membership in memberships],
            },
            int(time.time()) + settings.AXIOM_AUTH_SESSION_TTL_SECONDS,
        )
        return token

    def read_session(self, token: str) -> StoredAuthSession | None:
        row = self.persistence.get_session("auth", _token_hash(token))
        if not row or row.get("expires_at", 0) <= int(time.time()):
            if row:
                self.revoke_session(token)
            return None
        try:
            payload = row["payload"]
            return StoredAuthSession(
                user_id=payload["user_id"],
                email=payload.get("email"),
                memberships=[
                    AuthWorkspaceMembership.model_validate(item)
                    for item in payload.get("memberships", [])
                ],
            )
        except (AttributeError, KeyError, TypeError, ValueError):
            self.revoke_session(token)
            return None

    def revoke_session(self, token: str) -> None:
        self.persistence.delete_session("auth", _token_hash(token))


def get_auth_store() -> AuthSessionStore | SupabaseAuthSessionStore:
    global _store, _store_root
    root = str(Path(settings.AXIOM_RUNTIME_DATA_DIR).resolve())
    store_key = f"{settings.AXIOM_PERSISTENCE_BACKEND}:{root}:{settings.AXIOM_SUPABASE_URL}"
    if _store is None or _store_root != store_key:
        if settings.AXIOM_PERSISTENCE_BACKEND == "supabase":
            base_url = settings.AXIOM_SUPABASE_URL.rstrip("/")
            secret_key = settings.AXIOM_SUPABASE_SECRET_KEY.get_secret_value()
            if not base_url or not secret_key:
                raise AuthConfigurationError
            _store = SupabaseAuthSessionStore(SupabasePersistence(base_url, secret_key))
        else:
            _store = AuthSessionStore(root)
        _store_root = store_key
    return _store


def _configured_supabase() -> tuple[str, str]:
    base_url = settings.AXIOM_SUPABASE_URL.rstrip("/")
    publishable_key = settings.AXIOM_SUPABASE_PUBLISHABLE_KEY.get_secret_value()
    parsed = urlparse(base_url)
    if (
        not base_url
        or not publishable_key
        or parsed.scheme != "https"
        or not parsed.netloc
        or parsed.username
        or parsed.password
    ):
        raise AuthConfigurationError
    return base_url, publishable_key


def create_login_flow() -> tuple[str, str]:
    base_url, _ = _configured_supabase()
    provider = settings.AXIOM_AUTH_OAUTH_PROVIDER
    if not provider or not provider.replace("-", "").isalnum():
        raise AuthConfigurationError
    post_login = urlparse(settings.AXIOM_AUTH_POST_LOGIN_REDIRECT)
    if (
        post_login.scheme not in {"http", "https"}
        or not post_login.netloc
        or post_login.username
        or post_login.password
        or post_login.fragment
    ):
        raise AuthConfigurationError

    flow_token, state, challenge = get_auth_store().create_flow()
    callback = urlparse(settings.AXIOM_AUTH_CALLBACK_URL)
    if callback.scheme not in {"http", "https"} or not callback.netloc or callback.fragment:
        raise AuthConfigurationError
    callback_query = parse_qsl(callback.query, keep_blank_values=True)
    if any(key == "state" for key, _ in callback_query):
        raise AuthConfigurationError
    redirect_to = urlunparse(callback._replace(query=urlencode([*callback_query, ("state", state)])))
    query = urlencode(
        {
            "provider": provider,
            "redirect_to": redirect_to,
            "code_challenge": challenge,
            "code_challenge_method": "s256",
        }
    )
    return flow_token, f"{base_url}/auth/v1/authorize?{query}"


async def exchange_supabase_code(code: str, verifier: str) -> SupabaseIdentity:
    base_url, publishable_key = _configured_supabase()
    try:
        async with httpx.AsyncClient(timeout=10, follow_redirects=False) as client:
            response = await client.post(
                f"{base_url}/auth/v1/token",
                params={"grant_type": "pkce"},
                headers={"apikey": publishable_key, "Content-Type": "application/json"},
                json={"auth_code": code, "code_verifier": verifier},
            )
        response.raise_for_status()
        payload = response.json()
        user = payload["user"]
        return SupabaseIdentity(
            user_id=user["id"],
            email=user.get("email"),
            access_token=payload["access_token"],
        )
    except (httpx.HTTPError, AttributeError, KeyError, TypeError, ValueError) as error:
        raise AuthProviderError from error


async def fetch_workspace_memberships(
    access_token: str, user_id: str
) -> list[AuthWorkspaceMembership]:
    base_url, publishable_key = _configured_supabase()
    try:
        async with httpx.AsyncClient(timeout=10, follow_redirects=False) as client:
            response = await client.get(
                f"{base_url}/rest/v1/workspace_memberships",
                params={
                    "select": "workspace_id,user_id,role,status",
                    "user_id": f"eq.{user_id}",
                    "status": "eq.active",
                },
                headers={
                    "apikey": publishable_key,
                    "Authorization": f"Bearer {access_token}",
                },
            )
        response.raise_for_status()
        rows = response.json()
        if not isinstance(rows, list):
            raise ValueError
        return [
            AuthWorkspaceMembership(
                workspaceId=row["workspace_id"],
                memberId=row["user_id"],
                role=row["role"],
            )
            for row in rows
            if row.get("status") == "active" and row.get("user_id") == user_id
        ]
    except (httpx.HTTPError, AttributeError, KeyError, TypeError, ValueError) as error:
        raise AuthProviderError from error
