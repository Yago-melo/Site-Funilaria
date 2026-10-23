"""Upload helper shared by gallery and quotes — stores bytes in object storage and records them in db.media_files."""

import uuid

from fastapi import HTTPException, UploadFile

from lib.db import db
from lib.storage import APP_NAME, put_object

MAX_BYTES = 150 * 1024 * 1024
ALLOWED = {
    "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "image/gif": "gif",
    "image/heic": "heic", "image/heif": "heif",
    "video/mp4": "mp4", "video/webm": "webm", "video/quicktime": "mov",
}


async def store_upload(file: UploadFile, folder: str, private: bool = False, images_only: bool = False) -> tuple[str, str]:
    """Returns (public api url, content_type)."""
    ctype = (file.content_type or "").lower()
    if ctype not in ALLOWED or (images_only and not ctype.startswith("image/")):
        raise HTTPException(status_code=400, detail=f"Formato não suportado: {ctype or 'desconhecido'}")
    data = await file.read()
    if len(data) > MAX_BYTES:
        raise HTTPException(status_code=413, detail="Arquivo maior que 150MB")
    path = f"{APP_NAME}/{folder}/{uuid.uuid4()}.{ALLOWED[ctype]}"
    result = await put_object(path, data, ctype)
    stored = result.get("path", path)
    await db.media_files.insert_one({
        "storage_path": stored, "content_type": ctype, "size": len(data), "is_deleted": False, "private": private,
    })
    return f"/api/media/{stored}", ctype
