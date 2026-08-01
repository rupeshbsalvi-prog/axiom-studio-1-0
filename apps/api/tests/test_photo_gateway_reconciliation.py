"""
Phase 30 — Gateway Database Migration and Asset Maintenance Reconciliation Tests
"""

import os
import json
import time
import shutil
import hashlib
import sqlite3
import pytest
from pathlib import Path

from apps.api.core.config import settings
from apps.api.services.photo_gateway import PhotoGatewayStore, _get_store, reset_photo_gateway_state_for_test
from apps.api.services.photo_asset_maintenance import run_legacy_backfill, run_reconciliation


@pytest.fixture
def mock_store_path():
    p = Path("apps/api/tests/.runtime-test/reconciliation")
    shutil.rmtree(p, ignore_errors=True)
    p.mkdir(parents=True, exist_ok=True)
    yield p
    shutil.rmtree(p, ignore_errors=True)


def test_migration_and_idempotency(mock_store_path):
    store = PhotoGatewayStore(str(mock_store_path))
    
    # Check that schema matches migration 0003
    with store._connect() as conn:
        # Check added columns on assets
        res = conn.execute("PRAGMA table_info(assets)").fetchall()
        cols = {r[1] for r in res}
        assert "mime_type" in cols
        assert "byte_size" in cols
        assert "width" in cols
        assert "height" in cols
        assert "sha256" in cols
        assert "availability_status" in cols
        
        # Check added columns on provider_jobs
        res_jobs = conn.execute("PRAGMA table_info(provider_jobs)").fetchall()
        cols_jobs = {r[1] for r in res_jobs}
        assert "worker_id" in cols_jobs

    # Verify migration checksum idempotency works
    store._migrate()  # run again, shouldn't raise any errors


def test_queued_rows_retain_null_worker_id(mock_store_path):
    store = PhotoGatewayStore(str(mock_store_path))
    # Insert job with no worker_id explicitly or by default
    with store._connect() as conn:
        conn.execute(
            "INSERT INTO provider_jobs(job_id, session_hash, status, created_at, updated_at) "
            "VALUES ('job1', 'session1', 'queued', ?, ?)",
            (int(time.time()), int(time.time()))
        )
        row = conn.execute("SELECT worker_id FROM provider_jobs WHERE job_id = 'job1'").fetchone()
        assert row[0] is None


def test_legacy_svg_backfill_xml_rules(mock_store_path):
    store = PhotoGatewayStore(str(mock_store_path))
    
    # 1. Valid SVG with BOM and XML declaration
    svg_id_1 = "svg1"
    svg_content_1 = b'\xef\xbb\xbf<?xml version="1.0" encoding="utf-8"?><svg width="800px" height="600px"></svg>'
    (store.assets / f"{svg_id_1}.svg").write_bytes(svg_content_1)
    
    # 2. SVG with DOCTYPE (must be rejected)
    svg_id_2 = "svg2"
    svg_content_2 = b'<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd"><svg width="10" height="10"></svg>'
    (store.assets / f"{svg_id_2}.svg").write_bytes(svg_content_2)
    
    # 3. SVG with viewBox only
    svg_id_3 = "svg3"
    svg_content_3 = b'<svg viewBox="0 0 100 200"></svg>'
    (store.assets / f"{svg_id_3}.svg").write_bytes(svg_content_3)

    # 4. SVG with invalid suffix/units (rejected)
    svg_id_4 = "svg4"
    svg_content_4 = b'<svg width="10em" height="10%"></svg>'
    (store.assets / f"{svg_id_4}.svg").write_bytes(svg_content_4)

    # Insert rows into database
    with store._connect() as conn:
        for sid in [svg_id_1, svg_id_2, svg_id_3, svg_id_4]:
            conn.execute(
                "INSERT INTO assets(asset_id, file_name, created_at) VALUES (?, ?, ?)",
                (sid, f"{sid}.svg", int(time.time()))
            )
            
    # Run backfill
    run_legacy_backfill(store)
    
    # Assert outcomes
    with store._connect() as conn:
        # svg1 should be available with 800x600
        r1 = conn.execute("SELECT availability_status, width, height, mime_type FROM assets WHERE asset_id = 'svg1'").fetchone()
        assert r1[0] == "available"
        assert r1[1] == 800
        assert r1[2] == 600
        assert r1[3] == "image/svg+xml"
        
        # svg2 should be invalid (DOCTYPE)
        r2 = conn.execute("SELECT availability_status FROM assets WHERE asset_id = 'svg2'").fetchone()
        assert r2[0] == "invalid"
        
        # svg3 should be available with 100x200 (viewBox)
        r3 = conn.execute("SELECT availability_status, width, height FROM assets WHERE asset_id = 'svg3'").fetchone()
        assert r3[0] == "available"
        assert r3[1] == 100
        assert r3[2] == 200
        
        # svg4 should be invalid due to incorrect dimensions
        r4 = conn.execute("SELECT availability_status FROM assets WHERE asset_id = 'svg4'").fetchone()
        assert r4[0] == "invalid"


def test_legacy_svg_backfill_missing_and_invalid(mock_store_path):
    store = PhotoGatewayStore(str(mock_store_path))
    
    # Missing file
    with store._connect() as conn:
        conn.execute(
            "INSERT INTO assets(asset_id, file_name, created_at) VALUES ('missing_svg', 'missing_svg.svg', ?)",
            (int(time.time()),)
        )
        
    run_legacy_backfill(store)
    
    with store._connect() as conn:
        r = conn.execute("SELECT availability_status, mime_type FROM assets WHERE asset_id = 'missing_svg'").fetchone()
        assert r[0] == "missing"
        assert r[1] == "image/svg+xml"


def test_stale_temp_file_deletion(mock_store_path):
    store = PhotoGatewayStore(str(mock_store_path))
    
    # Create temp files
    temp1 = store.assets / ".temp_job1.bin"
    temp1.write_bytes(b"hello")
    temp2 = store.assets / ".temp_job2.bin"
    temp2.write_bytes(b"world")
    
    # Make temp1 old (2 hours ago)
    now = time.time()
    os.utime(str(temp1), (now - 7200, now - 7200))
    
    # Run reconciliation
    run_reconciliation(store)
    
    # temp1 (old) should be deleted, temp2 (new) should still exist
    assert not temp1.exists()
    assert temp2.exists()


def test_uuid_png_quarantine(mock_store_path):
    store = PhotoGatewayStore(str(mock_store_path))
    
    # Create orphan PNG file with exact UUID-v4 pattern
    uuid_hex = "a" * 32
    png_file = store.assets / f"{uuid_hex}.png"
    png_file.write_bytes(b"fake png data")
    
    # Make it 2 hours old
    now = time.time()
    os.utime(str(png_file), (now - 7200, now - 7200))
    
    # Run reconciliation
    run_reconciliation(store)
    
    # Should be moved to quarantine
    assert not png_file.exists()
    quarantine_file = store.assets / "quarantine" / f"{uuid_hex}.png"
    assert quarantine_file.exists()
    
    # Legacy SVGs should NEVER be quarantined or deleted
    svg_file = store.assets / "some_legacy.svg"
    svg_file.write_bytes(b"<svg></svg>")
    os.utime(str(svg_file), (now - 7200, now - 7200))
    
    run_reconciliation(store)
    assert svg_file.exists()
