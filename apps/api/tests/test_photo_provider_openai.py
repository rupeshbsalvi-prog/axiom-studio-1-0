"""
Phase 30 — OpenAI Provider Adapter Tests
"""

import io
import warnings
import pytest
import httpx
import asyncio
import base64
import json
from pathlib import Path
from PIL import Image

from apps.api.schemas.photo import PhotoGatewayRequest
from apps.api.services.photo_provider_adapter import OpenAiGptImage2PhotoAdapter, ProviderRawOutput


def dummy_request(width=1024, height=1024, prompt="A beautiful sunset"):
    return PhotoGatewayRequest(
        contractVersion="photo-provider-live-request.v1",
        routeId="photo.generate.dev",
        promptText=prompt,
        canvasHint={
            "width": width,
            "height": height,
            "aspectRatio": "1:1",
            "transparentBackground": False
        },
        layers=[],
        security={
            "dryRunPreview": False,
            "noRealProviderCalled": False,
            "providerId": "mock-photo-provider",
            "secretsIncluded": False,
            "endpointUrlIncluded": False
        }
    )


def test_endpoint_and_model_snapshot():
    adapter = OpenAiGptImage2PhotoAdapter(api_key="test-key")
    assert adapter.ORIGIN == "https://api.openai.com"
    assert adapter.ROUTE == "/v1/images/generations"
    assert adapter.MODEL == "gpt-image-2-2026-04-21"


def test_successful_response_handling():
    img = Image.new("RGBA", (1024, 1024), color=(255, 0, 0, 255))
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    png_bytes = buf.getvalue()
    
    b64_str = base64.b64encode(png_bytes).decode("ascii")
    
    response_payload = {
        "created": 123456,
        "data": [{"b64_json": b64_str}]
    }
    
    resp_bytes = json.dumps(response_payload).encode("utf-8")
    
    def mock_handler(request: httpx.Request):
        assert request.url.host == "api.openai.com"
        assert request.url.path == "/v1/images/generations"
        req_json = json.loads(request.read().decode("utf-8"))
        assert req_json["model"] == "gpt-image-2-2026-04-21"
        assert req_json["n"] == 1
        assert req_json["quality"] == "medium"
        assert req_json["output_format"] == "png"
        assert req_json["background"] == "opaque"
        assert req_json["moderation"] == "auto"
        
        return httpx.Response(
            200,
            content=resp_bytes,
            headers={"Content-Type": "application/json; charset=utf-8"}
        )

    adapter = OpenAiGptImage2PhotoAdapter(api_key="test-key")
    
    original_client = httpx.AsyncClient
    def create_mock_client(*args, **kwargs):
        kwargs["transport"] = httpx.MockTransport(mock_handler)
        return original_client(*args, **kwargs)

    import unittest.mock as mock
    with mock.patch("httpx.AsyncClient", create_mock_client):
        result = asyncio.get_event_loop().run_until_complete(
            adapter.generate(dummy_request(), Path("/tmp"), "secret")
        )
        
    assert result.success
    assert result.validated_bytes == png_bytes
    assert result.width == 1024
    assert result.height == 1024


def test_incorrect_media_type():
    adapter = OpenAiGptImage2PhotoAdapter(api_key="test-key")
    def mock_handler(request):
        return httpx.Response(200, content=b"{}", headers={"Content-Type": "text/html"})
        
    original_client = httpx.AsyncClient
    def create_mock_client(*args, **kwargs):
        kwargs["transport"] = httpx.MockTransport(mock_handler)
        return original_client(*args, **kwargs)

    import unittest.mock as mock
    with mock.patch("httpx.AsyncClient", create_mock_client):
        result = asyncio.get_event_loop().run_until_complete(
            adapter.generate(dummy_request(), Path("/tmp"), "secret")
        )
        
    assert not result.success
    assert result.diagnostics[0]["code"] == "unsupported_response_content_type"


def test_oversized_content_length():
    adapter = OpenAiGptImage2PhotoAdapter(api_key="test-key")
    def mock_handler(request):
        return httpx.Response(200, content=b"{}", headers={"Content-Type": "application/json", "Content-Length": "20000000"})
        
    original_client = httpx.AsyncClient
    def create_mock_client(*args, **kwargs):
        kwargs["transport"] = httpx.MockTransport(mock_handler)
        return original_client(*args, **kwargs)

    import unittest.mock as mock
    with mock.patch("httpx.AsyncClient", create_mock_client):
        result = asyncio.get_event_loop().run_until_complete(
            adapter.generate(dummy_request(), Path("/tmp"), "secret")
        )
        
    assert not result.success
    assert result.diagnostics[0]["code"] == "response_body_too_large"


@pytest.mark.anyio
async def test_oversized_chunked_success_body():
    adapter = OpenAiGptImage2PhotoAdapter(api_key="test-key")
    class MockStream(httpx.AsyncByteStream):
        async def __aiter__(self):
            for _ in range(16):
                yield b"a" * 1000000

        async def aclose(self):
            return None

    def mock_handler(request):
        return httpx.Response(200, headers={"Content-Type": "application/json"}, stream=MockStream())
        
    original_client = httpx.AsyncClient
    def create_mock_client(*args, **kwargs):
        kwargs["transport"] = httpx.MockTransport(mock_handler)
        return original_client(*args, **kwargs)

    import unittest.mock as mock
    with mock.patch("httpx.AsyncClient", create_mock_client):
        result = await adapter.generate(dummy_request(), Path("/tmp"), "secret")
        
    assert not result.success
    assert result.diagnostics[0]["code"] == "response_body_too_large"


def test_empty_b64_json():
    adapter = OpenAiGptImage2PhotoAdapter(api_key="test-key")
    response_payload = {
        "created": 123,
        "data": [{"b64_json": ""}]
    }
    def mock_handler(request):
        return httpx.Response(200, json=response_payload, headers={"Content-Type": "application/json"})
        
    original_client = httpx.AsyncClient
    def create_mock_client(*args, **kwargs):
        kwargs["transport"] = httpx.MockTransport(mock_handler)
        return original_client(*args, **kwargs)

    import unittest.mock as mock
    with mock.patch("httpx.AsyncClient", create_mock_client):
        result = asyncio.get_event_loop().run_until_complete(
            adapter.generate(dummy_request(), Path("/tmp"), "secret")
        )
        
    assert not result.success
    assert result.diagnostics[0]["code"] == "missing_output"


def test_strict_base64_checks():
    adapter = OpenAiGptImage2PhotoAdapter(api_key="test-key")
    response_payload = {
        "created": 123,
        "data": [{"b64_json": "iVBORw0KGgoAAA\nANSUhEUgAA"}]
    }
    def mock_handler(request):
        return httpx.Response(200, json=response_payload, headers={"Content-Type": "application/json"})
        
    original_client = httpx.AsyncClient
    def create_mock_client(*args, **kwargs):
        kwargs["transport"] = httpx.MockTransport(mock_handler)
        return original_client(*args, **kwargs)

    import unittest.mock as mock
    with mock.patch("httpx.AsyncClient", create_mock_client):
        result = asyncio.get_event_loop().run_until_complete(
            adapter.generate(dummy_request(), Path("/tmp"), "secret")
        )
        
    assert not result.success
    assert result.diagnostics[0]["code"] == "invalid_base64"


def test_png_signature_check():
    adapter = OpenAiGptImage2PhotoAdapter(api_key="test-key")
    b64_str = base64.b64encode(b"hello world").decode("ascii")
    response_payload = {
        "created": 123,
        "data": [{"b64_json": b64_str}]
    }
    def mock_handler(request):
        return httpx.Response(200, json=response_payload, headers={"Content-Type": "application/json"})
        
    original_client = httpx.AsyncClient
    def create_mock_client(*args, **kwargs):
        kwargs["transport"] = httpx.MockTransport(mock_handler)
        return original_client(*args, **kwargs)

    import unittest.mock as mock
    with mock.patch("httpx.AsyncClient", create_mock_client):
        result = asyncio.get_event_loop().run_until_complete(
            adapter.generate(dummy_request(), Path("/tmp"), "secret")
        )
        
    assert not result.success
    assert result.diagnostics[0]["code"] == "signature_mime_mismatch"


def test_png_excessive_pixel_count():
    adapter = OpenAiGptImage2PhotoAdapter(api_key="test-key")
    
    img = Image.new("RGBA", (2048, 2048), color=(0, 0, 0))
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    b64_str = base64.b64encode(buf.getvalue()).decode("ascii")
    
    response_payload = {
        "created": 123,
        "data": [{"b64_json": b64_str}]
    }
    def mock_handler(request):
        return httpx.Response(200, json=response_payload, headers={"Content-Type": "application/json"})
        
    original_client = httpx.AsyncClient
    def create_mock_client(*args, **kwargs):
        kwargs["transport"] = httpx.MockTransport(mock_handler)
        return original_client(*args, **kwargs)

    import unittest.mock as mock
    with mock.patch("httpx.AsyncClient", create_mock_client):
        result = asyncio.get_event_loop().run_until_complete(
            adapter.generate(dummy_request(1024, 1024), Path("/tmp"), "secret")
        )
        
    assert not result.success
    assert result.diagnostics[0]["code"] in ("decompression_bomb_blocked", "dimension_mismatch")


def test_animated_png_rejected():
    adapter = OpenAiGptImage2PhotoAdapter(api_key="test-key")
    img = Image.new("RGBA", (1024, 1024), color=(0, 0, 0))
    img2 = Image.new("RGBA", (1024, 1024), color=(255, 255, 255))
    buf = io.BytesIO()
    img.save(buf, format="PNG", save_all=True, append_images=[img2])
    
    b64_str = base64.b64encode(buf.getvalue()).decode("ascii")
    response_payload = {
        "created": 123,
        "data": [{"b64_json": b64_str}]
    }
    def mock_handler(request):
        return httpx.Response(200, json=response_payload, headers={"Content-Type": "application/json"})
        
    original_client = httpx.AsyncClient
    def create_mock_client(*args, **kwargs):
        kwargs["transport"] = httpx.MockTransport(mock_handler)
        return original_client(*args, **kwargs)

    import unittest.mock as mock
    with mock.patch("httpx.AsyncClient", create_mock_client):
        result = asyncio.get_event_loop().run_until_complete(
            adapter.generate(dummy_request(), Path("/tmp"), "secret")
        )
        
    if not result.success:
        assert result.diagnostics[0]["code"] == "image_decode_failed"


def test_http_401_and_403_mapping():
    adapter = OpenAiGptImage2PhotoAdapter(api_key="test-key")
    
    for status, expected_code in [(401, "authentication_failed"), (403, "authorization_failed")]:
        def mock_handler(request, status=status):
            return httpx.Response(status, content=b'{"error": {"code": "invalid_key", "type": "auth"}}', headers={"Content-Type": "application/json"})
            
        original_client = httpx.AsyncClient
        def create_mock_client(*args, **kwargs):
            kwargs["transport"] = httpx.MockTransport(mock_handler)
            return original_client(*args, **kwargs)

        import unittest.mock as mock
        with mock.patch("httpx.AsyncClient", create_mock_client):
            result = asyncio.get_event_loop().run_until_complete(
                adapter.generate(dummy_request(), Path("/tmp"), "secret")
            )
            
        assert not result.success
        assert result.diagnostics[0]["code"] == expected_code


def test_http_400_preserves_specific_error_mapping():
    adapter = OpenAiGptImage2PhotoAdapter(api_key="test-key")

    for error, expected_code in [
        ({"code": "billing_hard_limit_reached", "type": "billing_limit_user_error"}, "authorization_failed"),
        ({"code": "moderation_blocked", "type": "image_generation_user_error"}, "moderation_blocked"),
    ]:
        def mock_handler(request, error=error):
            return httpx.Response(400, json={"error": error}, headers={"Content-Type": "application/json"})

        original_client = httpx.AsyncClient
        def create_mock_client(*args, **kwargs):
            kwargs["transport"] = httpx.MockTransport(mock_handler)
            return original_client(*args, **kwargs)

        import unittest.mock as mock
        with mock.patch("httpx.AsyncClient", create_mock_client):
            result = asyncio.get_event_loop().run_until_complete(
                adapter.generate(dummy_request(), Path("/tmp"), "secret")
            )

        assert not result.success
        assert result.diagnostics[0]["code"] == expected_code


def test_http_429_rate_limited():
    adapter = OpenAiGptImage2PhotoAdapter(api_key="test-key")
    def mock_handler(request):
        return httpx.Response(429, headers={"Retry-After": "45"}, content=b"{}")
        
    original_client = httpx.AsyncClient
    def create_mock_client(*args, **kwargs):
        kwargs["transport"] = httpx.MockTransport(mock_handler)
        return original_client(*args, **kwargs)

    import unittest.mock as mock
    with mock.patch("httpx.AsyncClient", create_mock_client):
        result = asyncio.get_event_loop().run_until_complete(
            adapter.generate(dummy_request(), Path("/tmp"), "secret")
        )
        
    assert not result.success
    assert result.diagnostics[0]["code"] == "provider_rate_limited"
    assert result.diagnostics[0]["retry_after"] == "45"


def test_http_5xx_server_error():
    adapter = OpenAiGptImage2PhotoAdapter(api_key="test-key")
    def mock_handler(request):
        return httpx.Response(502, content=b"Bad Gateway")
        
    original_client = httpx.AsyncClient
    def create_mock_client(*args, **kwargs):
        kwargs["transport"] = httpx.MockTransport(mock_handler)
        return original_client(*args, **kwargs)

    import unittest.mock as mock
    with mock.patch("httpx.AsyncClient", create_mock_client):
        result = asyncio.get_event_loop().run_until_complete(
            adapter.generate(dummy_request(), Path("/tmp"), "secret")
        )
        
    assert not result.success
    assert result.diagnostics[0]["code"] == "provider_server_error"
    assert "bad gateway" not in str(result.diagnostics[0]).lower()


def test_pre_dispatch_connect_failure():
    adapter = OpenAiGptImage2PhotoAdapter(api_key="test-key")
    
    async def mock_send(self, *args, **kwargs):
        raise httpx.ConnectError("Connection refused")
        
    import unittest.mock as mock
    with mock.patch("httpx.AsyncClient.send", mock_send):
        result = asyncio.get_event_loop().run_until_complete(
            adapter.generate(dummy_request(), Path("/tmp"), "secret")
        )
        
    assert not result.success
    assert result.diagnostics[0]["code"] == "provider_connect_failed"


def test_ambiguous_post_dispatch_timeout():
    adapter = OpenAiGptImage2PhotoAdapter(api_key="test-key")
    
    async def mock_send(self, *args, **kwargs):
        raise httpx.ReadTimeout("Timeout reading response")
        
    import unittest.mock as mock
    with mock.patch("httpx.AsyncClient.send", mock_send):
        result = asyncio.get_event_loop().run_until_complete(
            adapter.generate(dummy_request(), Path("/tmp"), "secret")
        )
        
    assert not result.success
    assert result.diagnostics[0]["code"] == "ambiguous_provider_timeout"
