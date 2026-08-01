"""
Phase 30 — Photo Asset Maintenance Service

Provides idempotent legacy SVG backfill and crash reconciliation routines
executed on API startup.
"""

import os
import re
import time
import shutil
import logging
import hashlib
import xml.etree.ElementTree as ET
from pathlib import Path
from typing import Any

logger = logging.getLogger("axiom.photo_asset_maintenance")


def _is_path_contained(path: Path, base_dir: Path) -> bool:
    """Enforces path containment to prevent path traversal."""
    try:
        resolved_path = Path(path).resolve()
        resolved_base = Path(base_dir).resolve()
        return resolved_base in resolved_path.parents or resolved_path == resolved_base
    except Exception:
        return False


def _parse_svg_dimension(val: str | None) -> int | None:
    """Parses SVG width/height attribute value according to Phase 30 specifications."""
    if not val:
        return None
    val = val.strip()
    # Strip px suffix if present
    if val.endswith("px"):
        val = val[:-2].strip()
    
    # Reject other units (%, em, rem, pt, etc.)
    if not re.match(r"^\d+(\.\d+)?$", val):
        return None
    
    try:
        num = float(val)
        # Reject NaN, infinity, zero, negative, or > 16384
        if num <= 0 or num > 16384 or not int(num) == num:
            # We strictly expect integer dimensions based on database and constraint limits
            if num > 0 and num <= 16384:
                return int(num)
            return None
        return int(num)
    except ValueError:
        return None


def _parse_svg_viewbox(viewbox_str: str | None) -> tuple[int, int] | None:
    """Parses SVG viewBox to extract positive width and height."""
    if not viewbox_str:
        return None
    parts = re.split(r"[\s,]+", viewbox_str.strip())
    if len(parts) != 4:
        return None
    try:
        # Check all are finite numbers
        vals = [float(p) for p in parts]
        min_x, min_y, width, height = vals
        if width <= 0 or height <= 0 or width > 16384 or height > 16384:
            return None
        return int(width), int(height)
    except ValueError:
        return None


def run_legacy_backfill(store: Any) -> None:
    """
    Idempotent legacy SVG asset backfill.
    Computes byte size and SHA-256 for all existing SVG files on disk,
    parses dimensions safely without DTD resolution, and updates database rows.
    """
    logger.info("Starting legacy SVG asset backfill...")
    try:
        # We need to query the assets ledger
        with store._connect() as conn:
            rows = conn.execute(
                "SELECT asset_id, file_name, mime_type, availability_status FROM assets"
            ).fetchall()
            
            for asset_id, file_name, mime_type, availability_status in rows:
                # If it's a legacy SVG file
                if file_name.endswith(".svg"):
                    target_file = store.assets / file_name
                    
                    # Ensure path containment
                    if not _is_path_contained(target_file, store.assets):
                        logger.error("Path containment violation for legacy asset: %s", file_name)
                        conn.execute(
                            "UPDATE assets SET availability_status = 'invalid' WHERE asset_id = ?",
                            (asset_id,)
                        )
                        continue
                    
                    if not target_file.exists():
                        conn.execute(
                            "UPDATE assets SET availability_status = 'missing', mime_type = 'image/svg+xml' WHERE asset_id = ?",
                            (asset_id,)
                        )
                        continue
                    
                    # File exists on disk, parse it
                    try:
                        stat = target_file.stat()
                        byte_size = stat.st_size
                        
                        # Limit read to 1 MiB
                        if byte_size > 1048576:
                            conn.execute(
                                "UPDATE assets SET availability_status = 'invalid' WHERE asset_id = ?",
                                (asset_id,)
                            )
                            continue
                        
                        content_bytes = target_file.read_bytes()
                        sha256_hash = hashlib.sha256(content_bytes).hexdigest()
                        
                        # Check BOM
                        if content_bytes.startswith(b"\xef\xbb\xbf"):
                            content_bytes = content_bytes[3:]
                        
                        # Strict UTF-8 decode
                        content_str = content_bytes.decode("utf-8")
                        
                        # Case-insensitive DOCTYPE/ENTITY rejection
                        content_lower = content_str.lower()
                        if "<!doctype" in content_lower or "<!entity" in content_lower:
                            conn.execute(
                                "UPDATE assets SET availability_status = 'invalid' WHERE asset_id = ?",
                                (asset_id,)
                            )
                            continue
                        
                        # Parse XML safely without DTD
                        root = ET.fromstring(content_str)
                        tag = root.tag
                        if "}" in tag:
                            tag = tag.split("}")[1]
                        
                        if tag != "svg":
                            conn.execute(
                                "UPDATE assets SET availability_status = 'invalid' WHERE asset_id = ?",
                                (asset_id,)
                            )
                            continue
                        
                        width = _parse_svg_dimension(root.get("width"))
                        height = _parse_svg_dimension(root.get("height"))
                        
                        if width is None or height is None:
                            vb = _parse_svg_viewbox(root.get("viewBox"))
                            if vb:
                                width, height = vb
                                
                        if width is None or height is None:
                            conn.execute(
                                "UPDATE assets SET availability_status = 'invalid' WHERE asset_id = ?",
                                (asset_id,)
                            )
                            continue
                        
                        # Update asset metadata
                        conn.execute(
                            "UPDATE assets SET mime_type = 'image/svg+xml', byte_size = ?, width = ?, height = ?, sha256 = ?, availability_status = 'available' WHERE asset_id = ?",
                            (byte_size, width, height, sha256_hash, asset_id)
                        )

                    except Exception:
                        conn.execute(
                            "UPDATE assets SET availability_status = 'invalid' WHERE asset_id = ?",
                            (asset_id,)
                        )
    except Exception as e:
        logger.error("Legacy SVG backfill failed: %s", str(e))
        raise RuntimeError("Legacy backfill failed") from e


def run_reconciliation(store: Any) -> None:
    """
    Cleans up stale temp files, quarantines unreferenced PNG assets,
    and reconciles database availability statuses.
    """
    logger.info("Starting crash reconciliation...")
    now = time.time()
    try:
        # 1. Delete stale .temp_* files older than 1 hour
        for temp_file in store.assets.glob(".temp_*"):
            if not _is_path_contained(temp_file, store.assets):
                continue
            if temp_file.is_file():
                try:
                    if temp_file.stat().st_mtime < now - 3600:
                        temp_file.unlink()
                except Exception:
                    pass

        # 2. Reconcile database records with files on disk
        with store._connect() as conn:
            # Reconcile missing files for all assets
            rows = conn.execute(
                "SELECT asset_id, file_name, mime_type, availability_status FROM assets"
            ).fetchall()
            
            for asset_id, file_name, mime_type, availability_status in rows:
                target_file = store.assets / file_name
                if not _is_path_contained(target_file, store.assets):
                    conn.execute(
                        "UPDATE assets SET availability_status = 'invalid' WHERE asset_id = ?",
                        (asset_id,)
                    )
                    continue
                
                if not target_file.exists():
                    conn.execute(
                        "UPDATE assets SET availability_status = 'missing' WHERE asset_id = ?",
                        (asset_id,)
                    )
                    continue
                
                # Check for incomplete new OpenAI metadata
                if file_name.endswith(".png"):
                    if not mime_type or availability_status is None:
                        conn.execute(
                            "UPDATE assets SET availability_status = 'invalid' WHERE asset_id = ?",
                            (asset_id,)
                        )

            # 3. Quarantine unreferenced UUID-v4 PNG files older than 1 hour
            quarantine_dir = store.assets / "quarantine"
            quarantine_dir.mkdir(parents=True, exist_ok=True)
            
            for png_file in store.assets.glob("*.png"):
                if not _is_path_contained(png_file, store.assets):
                    continue
                if png_file.is_dir() or png_file.parent == quarantine_dir:
                    continue
                
                # Check filename pattern is exact UUID-v4 hex string
                filename = png_file.name
                asset_id = filename[:-4]
                if not re.match(r"^[a-f0-9]{32}$", asset_id):
                    continue
                
                # Check age
                try:
                    mtime = png_file.stat().st_mtime
                    if mtime >= now - 3600:
                        continue
                except Exception:
                    continue
                
                # Check if referenced in database
                row = conn.execute(
                    "SELECT 1 FROM assets WHERE asset_id = ?",
                    (asset_id,)
                ).fetchone()
                
                if not row:
                    # Move to quarantine
                    dest_file = quarantine_dir / filename
                    # Collision safety check
                    if dest_file.exists():
                        dest_file = quarantine_dir / f"{int(now)}_{filename}"
                    
                    if _is_path_contained(dest_file, quarantine_dir):
                        try:
                            shutil.move(str(png_file), str(dest_file))
                        except Exception as e:
                            logger.error("Failed to quarantine file %s: %s", png_file, str(e))
    except Exception as e:
        logger.error("Reconciliation failed: %s", str(e))
        raise RuntimeError("Reconciliation failed") from e
