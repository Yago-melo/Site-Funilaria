"""Emergent Managed Object Storage wrapper (sync requests run in a thread)."""

import asyncio
import logging
import os
from collections import OrderedDict

import requests

logger = logging.getLogger(__name__)

STORAGE_BASE = (os.environ.get("INTEGRATION_PROXY_URL") or "").strip() or "https://integrations.emergentagent.com"
STORAGE_URL = STORAGE_BASE.rstrip("/") + "/objstore/api/v1/storage"
APP_NAME = "nadis-car"

_storage_key: str | None = None
_cache: "OrderedDict[str, tuple[bytes, str]]" = OrderedDict()
_CACHE_MAX_BYTES = 300 * 1024 * 1024


def init_storage(force: bool = False) -> str:
    global _storage_key
    if _storage_key and not force:
        return _storage_key
    resp = requests.post(f"{STORAGE_URL}/init", json={"emergent_key": os.environ.get("EMERGENT_LLM_KEY")}, timeout=30)
    resp.raise_for_status()
    _storage_key = resp.json()["storage_key"]
    return _storage_key


def _put(path: str, data: bytes, content_type: str) -> dict:
    for attempt in range(2):
        key = init_storage(force=attempt > 0)
        resp = requests.put(
            f"{STORAGE_URL}/objects/{path}",
            headers={"X-Storage-Key": key, "Content-Type": content_type},
            data=data, timeout=300,
        )
        if resp.status_code == 404 and attempt == 0:
            continue
        resp.raise_for_status()
        return resp.json()
    raise RuntimeError("upload failed")


def _get(path: str) -> tuple[bytes, str]:
    if path in _cache:
        _cache.move_to_end(path)
        return _cache[path]
    for attempt in range(2):
        key = init_storage(force=attempt > 0)
        resp = requests.get(f"{STORAGE_URL}/objects/{path}", headers={"X-Storage-Key": key}, timeout=120)
        if resp.status_code == 404 and attempt == 0:
            continue
        resp.raise_for_status()
        item = (resp.content, resp.headers.get("Content-Type", "application/octet-stream"))
        _cache[path] = item
        while sum(len(v[0]) for v in _cache.values()) > _CACHE_MAX_BYTES and len(_cache) > 1:
            _cache.popitem(last=False)
        return item
    raise RuntimeError("download failed")


async def put_object(path: str, data: bytes, content_type: str) -> dict:
    return await asyncio.to_thread(_put, path, data, content_type)


async def get_object(path: str) -> tuple[bytes, str]:
    return await asyncio.to_thread(_get, path)
