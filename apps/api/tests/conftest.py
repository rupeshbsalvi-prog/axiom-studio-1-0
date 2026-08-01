import asyncio

import pytest


@pytest.fixture(autouse=True)
def legacy_event_loop_compatibility():
    """Supports older synchronous tests that still call get_event_loop()."""
    try:
        asyncio.get_running_loop()
    except RuntimeError:
        asyncio.set_event_loop(asyncio.new_event_loop())
    yield
