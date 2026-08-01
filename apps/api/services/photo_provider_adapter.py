"""
Phase 29 — Photo Provider Adapter Protocol

Defines the ProviderAdapter protocol and two implementations:
  - MockProviderAdapter: deterministic SVG output (always available)
  - StubRealProviderAdapter: calls AXIOM_PHOTO_PROVIDER_ENDPOINT when configured

SECURITY:
  - AXIOM_PHOTO_PROVIDER_ENDPOINT and AXIOM_PHOTO_PROVIDER_API_KEY are used
    server-side only and never returned to callers or logged.
  - StubRealProviderAdapter is disabled unless AXIOM_ENABLE_STUB_REAL_PROVIDER=true.
  - Both env vars must be present for StubRealProviderAdapter to activate.
  - If configured but unreachable: fail closed with provider_timeout diagnostic.
"""

from __future__ import annotations

import asyncio
import hashlib
import hmac
import time
import uuid
from dataclasses import dataclass, field
from pathlib import Path
from typing import List, Protocol
from urllib.parse import urlencode

from apps.api.schemas.photo import PhotoGatewayRequest, PhotoGatewayOutputLayer, PhotoGatewayResponse


@dataclass
class ProviderRawOutput:
    """
    Structured output from a provider adapter.
    Contains only metadata — no binary data, no raw provider responses,
    no credentials, no endpoint URLs.
    """
    success: bool
    asset_id: str | None = None
    width: int = 0
    height: int = 0
    diagnostics: List[dict] = field(default_factory=list)
    validated_bytes: bytes | None = None



class ProviderAdapter(Protocol):
    """Protocol that all provider adapters must satisfy."""

    async def generate(
        self,
        request: PhotoGatewayRequest,
        assets_dir: Path,
        signing_secret: str,
    ) -> ProviderRawOutput: ...

    def is_configured(self) -> bool: ...


# ---------------------------------------------------------------------------
# MockProviderAdapter — deterministic SVG, always available
# ---------------------------------------------------------------------------

class MockProviderAdapter:
    """
    Deterministic mock adapter. Produces an SVG asset and a signed reference.
    Does not make any network calls. Always returns success when asset storage
    and signing secret are available.
    """

    def is_configured(self) -> bool:
        return True

    async def generate(
        self,
        request: PhotoGatewayRequest,
        assets_dir: Path,
        signing_secret: str,
    ) -> ProviderRawOutput:
        if not signing_secret:
            return ProviderRawOutput(
                success=False,
                diagnostics=[{"severity": "error", "code": "signing_secret_missing",
                               "message": "Asset signing secret is not configured."}],
            )

        asset_id = uuid.uuid4().hex
        w = request.canvasHint.width
        h = request.canvasHint.height

        # Write deterministic SVG (same as existing execute_photo_gateway mock)
        file_name = f"{asset_id}.svg"
        target = assets_dir / file_name
        tmp = assets_dir / f".{file_name}.tmp"
        svg = (
            f'<svg xmlns="http://www.w3.org/2000/svg" width="{w}" height="{h}" '
            f'viewBox="0 0 {w} {h}"><rect width="100%" height="100%" fill="transparent"/>'
            '<text x="50%" y="50%" text-anchor="middle" fill="#64748b" font-family="sans-serif">'
            "Axiom Photo Provider Asset</text></svg>"
        )
        tmp.write_text(svg, encoding="utf-8")
        tmp.replace(target)

        return ProviderRawOutput(
            success=True,
            asset_id=asset_id,
            width=w,
            height=h,
        )


# ---------------------------------------------------------------------------
# StubRealProviderAdapter — calls AXIOM_PHOTO_PROVIDER_ENDPOINT
# Gated behind AXIOM_ENABLE_STUB_REAL_PROVIDER=true.
# ---------------------------------------------------------------------------

class StubRealProviderAdapter:
    """
    Stub real adapter that calls AXIOM_PHOTO_PROVIDER_ENDPOINT using
    AXIOM_PHOTO_PROVIDER_API_KEY.

    SECURITY:
      - The endpoint URL and API key are read from settings at call time.
      - They are NEVER logged, returned in responses, or written to SQLite.
      - Fail-closed if endpoint or key is missing or if the call times out.
    """

    def __init__(self, endpoint: str, api_key: str, timeout_seconds: float = 30.0) -> None:
        # Stored in memory for the lifetime of this adapter instance only.
        # Never written to SQLite, logs, or responses.
        self._endpoint = endpoint
        self._api_key = api_key
        self._timeout = timeout_seconds

    def is_configured(self) -> bool:
        return bool(self._endpoint and self._api_key)

    async def generate(
        self,
        request: PhotoGatewayRequest,
        assets_dir: Path,
        signing_secret: str,
    ) -> ProviderRawOutput:
        if not self.is_configured():
            return ProviderRawOutput(
                success=False,
                diagnostics=[{"severity": "error", "code": "provider_not_configured",
                               "message": "Real provider adapter is not configured."}],
            )
        if not signing_secret:
            return ProviderRawOutput(
                success=False,
                diagnostics=[{"severity": "error", "code": "signing_secret_missing",
                               "message": "Asset signing secret is not configured."}],
            )

        try:
            import httpx  # optional dependency for real adapter path only
        except ImportError:
            return ProviderRawOutput(
                success=False,
                diagnostics=[{"severity": "error", "code": "provider_dependency_missing",
                               "message": "httpx is required for the real provider adapter."}],
            )

        # Build a minimal, metadata-only payload. No raw image, no binary.
        payload = {
            "prompt": request.promptText,
            "width": request.canvasHint.width,
            "height": request.canvasHint.height,
        }

        try:
            async with httpx.AsyncClient(timeout=self._timeout) as client:
                # Authorization header uses API key — never returned to callers.
                resp = await client.post(
                    self._endpoint,
                    json=payload,
                    headers={"Authorization": f"Bearer {self._api_key}"},
                )
                resp.raise_for_status()
        except (httpx.TimeoutException, asyncio.TimeoutError):
            return ProviderRawOutput(
                success=False,
                diagnostics=[{"severity": "error", "code": "provider_timeout",
                               "message": "Provider request timed out."}],
            )
        except Exception:
            # Never surface endpoint URL, API key, or raw error to callers.
            return ProviderRawOutput(
                success=False,
                diagnostics=[{"severity": "error", "code": "provider_error",
                               "message": "Provider call failed. Check server logs."}],
            )

        # Save a deterministic SVG asset (Phase 30 will replace with real image).
        asset_id = uuid.uuid4().hex
        w = request.canvasHint.width
        h = request.canvasHint.height
        file_name = f"{asset_id}.svg"
        target = assets_dir / file_name
        tmp = assets_dir / f".{file_name}.tmp"
        svg = (
            f'<svg xmlns="http://www.w3.org/2000/svg" width="{w}" height="{h}" '
            f'viewBox="0 0 {w} {h}"><rect width="100%" height="100%" fill="transparent"/>'
            '<text x="50%" y="50%" text-anchor="middle" fill="#64748b" font-family="sans-serif">'
            "Axiom Provider Output</text></svg>"
        )
        tmp.write_text(svg, encoding="utf-8")
        tmp.replace(target)

        return ProviderRawOutput(success=True, asset_id=asset_id, width=w, height=h)


# ---------------------------------------------------------------------------
# OpenAiGptImage2PhotoAdapter — calls OpenAI GPT Image 2 API
# Gated behind AXIOM_ENABLE_OPENAI_IMAGE_PROVIDER=true.
# ---------------------------------------------------------------------------

class OpenAiGptImage2PhotoAdapter:
    """
    Statically defined provider adapter for OpenAI GPT Image 2 model.
    """
    ORIGIN = "https://api.openai.com"
    ROUTE = "/v1/images/generations"
    MODEL = "gpt-image-2-2026-04-21"

    def __init__(self, api_key: str, timeout_seconds: float = 150.0) -> None:
        self._api_key = api_key
        self._timeout = timeout_seconds
        self.providerExecuted = False
        self.networkAccessed = False
        self.providerApiCalled = False

    def is_configured(self) -> bool:
        return bool(self._api_key)

    async def generate(
        self,
        request: PhotoGatewayRequest,
        assets_dir: Path,
        signing_secret: str,
    ) -> ProviderRawOutput:
        import base64
        import json
        import warnings
        import io
        import re
        import httpx
        from PIL import Image

        self.providerExecuted = True
        if not self.is_configured():
            return ProviderRawOutput(
                success=False,
                diagnostics=[{"severity": "error", "code": "configuration_missing",
                               "message": "OpenAI API key is missing."}],
            )

        w = request.canvasHint.width
        h = request.canvasHint.height
        size_str = f"{w}x{h}"
        if size_str not in ("1024x1024", "1024x1536", "1536x1024"):
            return ProviderRawOutput(
                success=False,
                diagnostics=[{"severity": "error", "code": "dimension_mismatch",
                               "message": f"Unsupported generation size: {size_str}"}],
            )

        # Enforce prompt length cap
        if len(request.promptText) > 1000:
            return ProviderRawOutput(
                success=False,
                diagnostics=[{"severity": "error", "code": "image_generation_user_error",
                               "message": "Prompt exceeds 1,000 characters."}],
            )

        # Build strict payload
        payload = {
            "model": self.MODEL,
            "prompt": request.promptText,
            "n": 1,
            "size": size_str,
            "quality": "medium",
            "output_format": "png",
            "background": "opaque",
            "moderation": "auto",
        }

        url = f"{self.ORIGIN}{self.ROUTE}"
        headers = {
            "Authorization": f"Bearer {self._api_key}",
            "Content-Type": "application/json",
        }

        try:
            limits = httpx.Limits(max_keepalive_connections=5, max_connections=10)
            timeout = httpx.Timeout(self._timeout, connect=5.0, pool=5.0, write=15.0)
            
            self.networkAccessed = True
            async with httpx.AsyncClient(timeout=timeout, limits=limits) as client:
                self.providerApiCalled = True
                async with client.stream("POST", url, json=payload, headers=headers) as response:
                    # Enforce HTTP status and Content-Type checks
                    if response.status_code != 200:
                        err_content = await response.aread()
                        if len(err_content) > 65536:
                            err_content = err_content[:65536]
                        
                        diag_code = "provider_server_error"
                        content_type = response.headers.get("content-type", "")
                        if "application/json" in content_type.lower():
                            try:
                                err_json = json.loads(err_content.decode("utf-8"))
                                err_details = err_json.get("error", {})
                                err_code = err_details.get("code")
                                err_type = err_details.get("type")
                                
                                if err_code == "billing_hard_limit_reached" or err_type == "insufficient_quota":
                                    diag_code = "authorization_failed"
                                elif err_code == "invalid_api_key":
                                    diag_code = "authentication_failed"
                                elif "moderation" in str(err_code).lower() or "moderation" in str(err_type).lower():
                                    diag_code = "moderation_blocked"
                                elif err_code == "rate_limit_exceeded":
                                    diag_code = "provider_rate_limited"
                            except Exception:
                                pass
                        
                        if response.status_code == 401:
                            diag_code = "authentication_failed"
                        elif response.status_code == 403:
                            diag_code = "authorization_failed"
                        elif response.status_code == 429:
                            diag_code = "provider_rate_limited"
                            retry_after = response.headers.get("retry-after")
                            if retry_after:
                                return ProviderRawOutput(
                                    success=False,
                                    diagnostics=[{
                                        "severity": "error",
                                        "code": diag_code,
                                        "message": "Rate limited by provider.",
                                        "retry_after": retry_after
                                    }]
                                )
                        elif response.status_code == 400 and diag_code == "provider_server_error":
                            diag_code = "image_generation_user_error"
                        
                        return ProviderRawOutput(
                            success=False,
                            diagnostics=[{"severity": "error", "code": diag_code,
                                           "message": "OpenAI provider API call failed."}]
                        )

                    content_type = response.headers.get("content-type", "")
                    clean_content_type = content_type.split(";")[0].strip().lower()
                    if clean_content_type != "application/json":
                        return ProviderRawOutput(
                            success=False,
                            diagnostics=[{"severity": "error", "code": "unsupported_response_content_type",
                                           "message": "API returned non-JSON content type."}]
                        )

                    content_length = response.headers.get("content-length")
                    if content_length:
                        try:
                            if int(content_length) > 15204352:
                                return ProviderRawOutput(
                                    success=False,
                                    diagnostics=[{"severity": "error", "code": "response_body_too_large",
                                                   "message": "Response body exceeds maximum allowed size."}]
                                )
                        except ValueError:
                            pass

                    body_buffer = io.BytesIO()
                    total_bytes = 0
                    chunks = response.aiter_bytes()
                    try:
                        async for chunk in chunks:
                            total_bytes += len(chunk)
                            if total_bytes > 15204352:
                                return ProviderRawOutput(
                                    success=False,
                                    diagnostics=[{"severity": "error", "code": "response_body_too_large",
                                                   "message": "Response body exceeds maximum allowed size."}]
                                )
                            body_buffer.write(chunk)
                    finally:
                        await chunks.aclose()
                        await response.aclose()

            raw_body = body_buffer.getvalue()
            body_buffer.close()
            
            try:
                body_json = json.loads(raw_body.decode("utf-8"))
            except Exception:
                return ProviderRawOutput(
                    success=False,
                    diagnostics=[{"severity": "error", "code": "invalid_json",
                                   "message": "Failed to parse JSON response."}]
                )

            if not isinstance(body_json, dict) or "data" not in body_json:
                return ProviderRawOutput(
                    success=False,
                    diagnostics=[{"severity": "error", "code": "missing_output",
                                   "message": "data field is missing from response."}]
                )
            
            data_list = body_json["data"]
            if not isinstance(data_list, list) or len(data_list) != 1:
                return ProviderRawOutput(
                    success=False,
                    diagnostics=[{"severity": "error", "code": "missing_output",
                                   "message": "data list must contain exactly 1 output."}]
                )
            
            item = data_list[0]
            if not isinstance(item, dict) or "b64_json" not in item:
                return ProviderRawOutput(
                    success=False,
                    diagnostics=[{"severity": "error", "code": "missing_output",
                                   "message": "b64_json field is missing from response item."}]
                )
            
            b64_str = item["b64_json"]
            if not isinstance(b64_str, str) or not b64_str:
                return ProviderRawOutput(
                    success=False,
                    diagnostics=[{"severity": "error", "code": "missing_output",
                                   "message": "b64_json field is empty."}]
                )

            if len(b64_str) > 13981016:
                return ProviderRawOutput(
                    success=False,
                    diagnostics=[{"severity": "error", "code": "encoded_payload_too_large",
                                   "message": "Base64 payload exceeds cap."}]
                )

            if not re.match(r"^[A-Za-z0-9+/]+={0,2}$", b64_str):
                return ProviderRawOutput(
                    success=False,
                    diagnostics=[{"severity": "error", "code": "invalid_base64",
                                   "message": "b64_json contains invalid characters."}]
                )

            try:
                decoded_bytes = base64.b64decode(b64_str.encode("ascii"), validate=True)
            except Exception:
                return ProviderRawOutput(
                    success=False,
                    diagnostics=[{"severity": "error", "code": "invalid_base64",
                                   "message": "Failed to decode base64 string."}]
                )

            del b64_str
            del item
            del data_list
            del body_json

            if len(decoded_bytes) > 10485760:
                return ProviderRawOutput(
                    success=False,
                    diagnostics=[{"severity": "error", "code": "decoded_payload_too_large",
                                   "message": "Decoded bytes exceed 10 MiB limit."}]
                )

            if not decoded_bytes.startswith(b"\x89PNG\r\n\x1a\n"):
                return ProviderRawOutput(
                    success=False,
                    diagnostics=[{"severity": "error", "code": "signature_mime_mismatch",
                                   "message": "Decoded bytes do not match PNG file signature."}]
                )

            try:
                img_stream = io.BytesIO(decoded_bytes)
                
                with warnings.catch_warnings():
                    warnings.simplefilter("error", Image.DecompressionBombWarning)
                    
                    image = Image.open(img_stream)
                    width, height = image.size
                    
                    if width * height > 4000000:
                        image.close()
                        img_stream.close()
                        return ProviderRawOutput(
                            success=False,
                            diagnostics=[{"severity": "error", "code": "decompression_bomb_blocked",
                                           "message": "Image size exceeds 4 megapixels limit."}]
                        )
                    
                    if width != w or height != h:
                        image.close()
                        img_stream.close()
                        return ProviderRawOutput(
                            success=False,
                            diagnostics=[{"severity": "error", "code": "dimension_mismatch",
                                           "message": "Decoded image dimensions do not match request."}]
                        )
                    
                    image.verify()
                    
                    n_frames = getattr(image, "n_frames", 1)
                    is_animated = getattr(image, "is_animated", False)
                    if n_frames != 1 or is_animated:
                        image.close()
                        img_stream.close()
                        return ProviderRawOutput(
                            success=False,
                            diagnostics=[{"severity": "error", "code": "image_decode_failed",
                                           "message": "Animated images are not accepted."}]
                        )

                img_stream.seek(0)
                image_load = Image.open(img_stream)
                image_load.load()
                
                if image_load.size != (w, h) or image_load.format != "PNG":
                    image_load.close()
                    img_stream.close()
                    return ProviderRawOutput(
                        success=False,
                        diagnostics=[{"severity": "error", "code": "image_decode_failed",
                                       "message": "Image load validation failed."}]
                    )
                
                image_load.close()
                img_stream.close()

            except Image.DecompressionBombWarning:
                return ProviderRawOutput(
                    success=False,
                    diagnostics=[{"severity": "error", "code": "decompression_bomb_blocked",
                                   "message": "Decompression bomb warning triggered."}]
                )
            except Exception:
                return ProviderRawOutput(
                    success=False,
                    diagnostics=[{"severity": "error", "code": "image_decode_failed",
                                   "message": "Image decode validation failed."}]
                )

            return ProviderRawOutput(
                success=True,
                width=w,
                height=h,
                validated_bytes=decoded_bytes
            )

        except httpx.ConnectError:
            return ProviderRawOutput(
                success=False,
                diagnostics=[{"severity": "error", "code": "provider_connect_failed",
                               "message": "Failed to connect to provider host."}]
            )
        except httpx.TimeoutException:
            return ProviderRawOutput(
                success=False,
                diagnostics=[{"severity": "error", "code": "ambiguous_provider_timeout",
                               "message": "Ambiguous read/write timeout occurred."}]
            )
        except Exception:
            return ProviderRawOutput(
                success=False,
                diagnostics=[{"severity": "error", "code": "provider_server_error",
                               "message": "OpenAI provider HTTP request failed."}]
            )


# ---------------------------------------------------------------------------
# Factory — selects the active adapter based on configuration
# ---------------------------------------------------------------------------

def get_provider_adapter() -> ProviderAdapter:
    """
    Returns the active provider adapter based on configuration settings.
    """
    from apps.api.core.config import settings

    # Check for flag conflicts
    if settings.AXIOM_ENABLE_OPENAI_IMAGE_PROVIDER and settings.AXIOM_ENABLE_STUB_REAL_PROVIDER:
        raise ValueError("Configuration error: Both AXIOM_ENABLE_OPENAI_IMAGE_PROVIDER and AXIOM_ENABLE_STUB_REAL_PROVIDER cannot be enabled.")

    if settings.AXIOM_ENABLE_OPENAI_IMAGE_PROVIDER:
        return OpenAiGptImage2PhotoAdapter(
            api_key=settings.AXIOM_PHOTO_PROVIDER_API_KEY
        )

    if (
        settings.AXIOM_ENABLE_STUB_REAL_PROVIDER
        and settings.AXIOM_PHOTO_PROVIDER_ENDPOINT
        and settings.AXIOM_PHOTO_PROVIDER_API_KEY
    ):
        return StubRealProviderAdapter(
            endpoint=settings.AXIOM_PHOTO_PROVIDER_ENDPOINT,
            api_key=settings.AXIOM_PHOTO_PROVIDER_API_KEY,
        )
        
    return MockProviderAdapter()
