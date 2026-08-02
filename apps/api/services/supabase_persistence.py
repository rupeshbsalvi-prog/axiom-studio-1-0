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

    def check_ready(self) -> bool:
        for table, column in (
            ("axiom_sessions", "token_hash"),
            ("axiom_assets", "asset_id"),
        ):
            self._request(
                "GET",
                f"/rest/v1/{table}",
                params={"select": column, "limit": "0"},
            )
        return True

    def put_asset(
        self,
        asset_id: str,
        extension: Literal["png", "svg"],
        data: bytes,
        mime_type: str,
        *,
        owner_hash: str | None = None,
        expires_at: int | None = None,
    ) -> None:
        self._request(
            "POST",
            f"/storage/v1/object/{ASSET_BUCKET}/{asset_id}.{extension}",
            headers={"Content-Type": mime_type, "x-upsert": "false"},
            content=data,
        )
        if owner_hash is not None and expires_at is not None:
            try:
                self._request(
                    "POST",
                    "/rest/v1/axiom_assets",
                    json={
                        "asset_id": asset_id,
                        "extension": extension,
                        "mime_type": mime_type,
                        "owner_hash": owner_hash,
                        "expires_at": expires_at,
                    },
                )
            except Exception:
                self._delete_storage_object(f"{asset_id}.{extension}")
                raise

    def _delete_storage_object(self, file_name: str) -> None:
        self._request(
            "DELETE",
            f"/storage/v1/object/{ASSET_BUCKET}",
            json={"prefixes": [file_name]},
        )

    def delete_asset(self, asset_id: str, owner_hash: str) -> bool:
        response = self._request(
            "GET",
            "/rest/v1/axiom_assets",
            params={
                "select": "extension",
                "asset_id": f"eq.{asset_id}",
                "owner_hash": f"eq.{owner_hash}",
                "limit": "1",
            },
        )
        rows = response.json()
        if not isinstance(rows, list) or not rows:
            return False
        self._delete_storage_object(f"{asset_id}.{rows[0]['extension']}")
        self._request(
            "DELETE",
            "/rest/v1/axiom_assets",
            params={"asset_id": f"eq.{asset_id}", "owner_hash": f"eq.{owner_hash}"},
        )
        return True

    def purge_expired_assets(self, now: int) -> int:
        response = self._request(
            "GET",
            "/rest/v1/axiom_assets",
            params={
                "select": "asset_id,extension",
                "expires_at": f"lte.{now}",
                "limit": "100",
            },
        )
        rows = response.json()
        if not isinstance(rows, list):
            return 0
        for row in rows:
            self._delete_storage_object(f"{row['asset_id']}.{row['extension']}")
            self._request(
                "DELETE",
                "/rest/v1/axiom_assets",
                params={"asset_id": f"eq.{row['asset_id']}"},
            )
        return len(rows)

    def get_asset(self, asset_id: str) -> StoredAsset | None:
        for extension, default_mime in (("png", "image/png"), ("svg", "image/svg+xml")):
            try:
                response = self._client.get(
                    f"/storage/v1/object/authenticated/{ASSET_BUCKET}/{asset_id}.{extension}"
                )
            except httpx.HTTPError as error:
                raise SupabasePersistenceError("Supabase persistence request failed.") from error
            if response.status_code == 404:
                continue
            if response.status_code == 400:
                try:
                    if response.json().get("code") == "NoSuchKey":
                        continue
                except (AttributeError, ValueError):
                    pass
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
