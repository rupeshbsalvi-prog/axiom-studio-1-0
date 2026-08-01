"""
Phase 30 — API Startup Lifespan Maintenance Tests
"""

import pytest
from unittest.mock import MagicMock, patch
from fastapi import FastAPI

from apps.api.core.config import settings
from apps.api.main import lifespan


@pytest.mark.anyio
async def test_migration_failure_blocks_startup():
    app_mock = FastAPI()
    
    with patch("apps.api.services.photo_gateway._get_store", side_effect=RuntimeError("Migration failed")):
        with pytest.raises(RuntimeError) as exc:
            async with lifespan(app_mock):
                pass
        assert "Database migration failed" in str(exc.value)


@pytest.mark.anyio
async def test_backfill_failure_blocks_openai_mode_but_warns_in_mock_mode(monkeypatch, caplog):
    app_mock = FastAPI()
    
    # 1. OpenAI mode active -> must raise and block startup
    monkeypatch.setattr(settings, "AXIOM_ENABLE_OPENAI_IMAGE_PROVIDER", True)
    with patch("apps.api.services.photo_gateway._get_store", return_value=MagicMock()):
        with patch("apps.api.services.photo_asset_maintenance.run_legacy_backfill", side_effect=RuntimeError("Backfill error")):
            with pytest.raises(RuntimeError) as exc:
                async with lifespan(app_mock):
                    pass
            assert "Legacy SVG backfill failed" in str(exc.value)

    # 2. Mock mode active -> must only warn and boot successfully
    caplog.clear()
    monkeypatch.setattr(settings, "AXIOM_ENABLE_OPENAI_IMAGE_PROVIDER", False)
    with patch("apps.api.services.photo_gateway._get_store", return_value=MagicMock()):
        with patch("apps.api.services.photo_asset_maintenance.run_legacy_backfill", side_effect=RuntimeError("Backfill error")):
            with patch("apps.api.services.photo_asset_maintenance.run_reconciliation"):
                async with lifespan(app_mock):
                    # Verify warning log was emitted
                    assert any("Warning: Legacy SVG backfill failed" in record.message for record in caplog.records)
                    # Verify no credential leaks in the warning
                    for record in caplog.records:
                        assert "secret" not in record.message.lower()
                        assert "prompt" not in record.message.lower()


@pytest.mark.anyio
async def test_reconciliation_failure_blocks_openai_mode_but_warns_in_mock_mode(monkeypatch, caplog):
    app_mock = FastAPI()
    
    # 1. OpenAI mode active -> must raise and block startup
    monkeypatch.setattr(settings, "AXIOM_ENABLE_OPENAI_IMAGE_PROVIDER", True)
    with patch("apps.api.services.photo_gateway._get_store", return_value=MagicMock()):
        with patch("apps.api.services.photo_asset_maintenance.run_legacy_backfill"):
            with patch("apps.api.services.photo_asset_maintenance.run_reconciliation", side_effect=RuntimeError("Reconciliation error")):
                with pytest.raises(RuntimeError) as exc:
                    async with lifespan(app_mock):
                        pass
                assert "Crash reconciliation failed" in str(exc.value)

    # 2. Mock mode active -> must only warn and boot successfully
    caplog.clear()
    monkeypatch.setattr(settings, "AXIOM_ENABLE_OPENAI_IMAGE_PROVIDER", False)
    with patch("apps.api.services.photo_gateway._get_store", return_value=MagicMock()):
        with patch("apps.api.services.photo_asset_maintenance.run_legacy_backfill"):
            with patch("apps.api.services.photo_asset_maintenance.run_reconciliation", side_effect=RuntimeError("Reconciliation error")):
                async with lifespan(app_mock):
                    # Verify warning log was emitted
                    assert any("Warning: Crash reconciliation failed" in record.message for record in caplog.records)
