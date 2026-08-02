from dataclasses import dataclass
from typing import Any, Literal

import httpx


SessionKind = Literal["auth", "photo"]
ASSET_BUCKET = "axiom-photo-assets"


class SupabasePersistenceError(RuntimeError):
    pass


@dataclass(frozen=True)
class StoredAsset:
    data: bytes
    mime_type: str
    extension: str


class SupabasePersistence:
    def __init__(
        self,
        base_url: str,
        secret_key: str,
        *,
        transport: httpx.BaseTransport | None = None,
    ) -> None:
        self._client = httpx.Client(
            base_url=base_url.rstrip("/"),
            headers={"apikey": secret_key},
            timeout=10,
            follow_redirects=False,
            transport=transport,
        )

    def _request(self, method: str, path: str, **kwargs: Any) -> httpx.Response:
        try:
            response = self._client.request(method, path, **kwargs)
            response.raise_for_status()
            return response
        except httpx.HTTPError as error:
            raise SupabasePersistenceError("Supabase persistence request failed.") from error

    def create_auth_flow(
        self,
        flow_hash: str,
        state_hash: str,
        code_verifier: str,
        expires_at: int,
        capacity: int,
    ) -> bool:
        response = self._request(
            "POST",
            "/rest/v1/rpc/axiom_create_auth_flow",
            json={
                "p_flow_hash": flow_hash,
                "p_state_hash": state_hash,
                "p_code_verifier": code_verifier,
                "p_expires_at": expires_at,
                "p_capacity": capacity,
            },
        )
        return response.json() is True

    def consume_auth_flow(self, flow_hash: str, state_hash: str) -> str | None:
        response = self._request(
            "POST",
            "/rest/v1/rpc/axiom_consume_auth_flow",
            json={"p_flow_hash": flow_hash, "p_state_hash": state_hash},
        )
        value = response.json()
        return value if isinstance(value, str) else None

    def put_session(
        self,
        kind: SessionKind,
        token_hash: str,
        payload: dict[str, Any],
        expires_at: int,
    ) -> None:
        self._request(
            "POST",
            "/rest/v1/axiom_sessions",
            headers={"Prefer": "resolution=merge-duplicates"},
            json={
                "session_kind": kind,
                "token_hash": token_hash,
                "payload": payload,
                "expires_at": expires_at,
            },
        )

    def get_session(self, kind: SessionKind, token_hash: str) -> dict[str, Any] | None:
        response = self._request(
            "GET",
            "/rest/v1/axiom_sessions",
            params={
                "select": "payload,expires_at",
                "session_kind": f"eq.{kind}",
                "token_hash": f"eq.{token_hash}",
                "limit": "1",
            },
        )
        rows = response.json()
        return rows[0] if isinstance(rows, list) and rows else None

    def delete_session(self, kind: SessionKind, token_hash: str) -> None:
        self._request(
            "DELETE",
            "/rest/v1/axiom_sessions",
            params={"session_kind": f"eq.{kind}", "token_hash": f"eq.{token_hash}"},
        )

    def put_asset(
        self,
        asset_id: str,
        extension: Literal["png", "svg"],
        data: bytes,
        mime_type: str,
    ) -> None:
        self._request(
            "POST",
            f"/storage/v1/object/{ASSET_BUCKET}/{asset_id}.{extension}",
            headers={"Content-Type": mime_type, "x-upsert": "false"},
            content=data,
        )

    def get_asset(self, asset_id: str) -> StoredAsset | None:
        for extension, default_mime in (("png", "image/png"), ("svg", "image/svg+xml")):
            try:
                response = self._client.get(
                    f"/storage/v1/object/{ASSET_BUCKET}/{asset_id}.{extension}"
                )
            except httpx.HTTPError as error:
                raise SupabasePersistenceError("Supabase persistence request failed.") from error
            if response.status_code == 404:
                continue
            try:
                response.raise_for_status()
            except httpx.HTTPError as error:
                raise SupabasePersistenceError("Supabase persistence request failed.") from error
            return StoredAsset(
                data=response.content,
                mime_type=default_mime,
                extension=extension,
            )
        return None
