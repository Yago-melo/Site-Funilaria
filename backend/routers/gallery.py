import re

from fastapi import APIRouter, Depends, File, Form, HTTPException, Request, UploadFile
from fastapi.responses import Response

from lib.auth import COOKIE_NAME, require_admin
from lib.db import db
from lib.media import store_upload
from lib.storage import get_object
from models.gallery import GalleryItem

router = APIRouter(tags=["gallery"])


@router.get("/gallery", response_model=list[GalleryItem])
async def list_gallery():
    docs = await db.gallery.find({"is_deleted": {"$ne": True}}, {"_id": 0}).sort("created_at", -1).to_list(500)
    return [GalleryItem(**d) for d in docs]


@router.post("/admin/gallery", response_model=GalleryItem, dependencies=[Depends(require_admin)])
async def upload_gallery_item(
    file: UploadFile = File(...),
    before: UploadFile | None = File(default=None),
    title: str = Form(...),
    category: str = Form("Martelinho de Ouro"),
    description: str = Form(""),
):
    media_url, ctype = await store_upload(file, "gallery")
    is_video = ctype.startswith("video/")
    before_url = None
    if before is not None and before.filename and not is_video:
        before_url, _ = await store_upload(before, "gallery", images_only=True)
    item = GalleryItem(
        type="video" if is_video else "image",
        title=title.strip() or "Trabalho", category=category.strip(), description=description.strip(),
        media_url=media_url, before_url=before_url,
    )
    await db.gallery.insert_one({**item.model_dump(), "is_deleted": False})
    return item


@router.delete("/admin/gallery/{id}", dependencies=[Depends(require_admin)])
async def delete_gallery_item(id: str):
    res = await db.gallery.update_one({"id": id, "is_deleted": {"$ne": True}}, {"$set": {"is_deleted": True}})
    if not res.matched_count:
        raise HTTPException(status_code=404, detail="Item não encontrado")
    return {"ok": True}


@router.get("/media/{path:path}")
async def serve_media(path: str, request: Request):
    record = await db.media_files.find_one({"storage_path": path, "is_deleted": False})
    if not record:
        raise HTTPException(status_code=404, detail="Arquivo não encontrado")
    if record.get("private"):
        await require_admin(request.cookies.get(COOKIE_NAME))  # customer quote photos: admin only
    data, _ = await get_object(path)
    ctype = record["content_type"]
    cache = "private, max-age=3600" if record.get("private") else "public, max-age=86400"
    headers = {"Accept-Ranges": "bytes", "Cache-Control": cache}
    total = len(data)
    match = re.match(r"bytes=(\d*)-(\d*)", request.headers.get("range", ""))
    if match and total:
        start = int(match.group(1)) if match.group(1) else max(0, total - int(match.group(2) or 0))
        end = int(match.group(2)) if match.group(1) and match.group(2) else total - 1
        end = min(end, total - 1)
        if start > end:
            return Response(status_code=416, headers={"Content-Range": f"bytes */{total}"})
        headers["Content-Range"] = f"bytes {start}-{end}/{total}"
        return Response(content=data[start:end + 1], status_code=206, media_type=ctype, headers=headers)
    return Response(content=data, media_type=ctype, headers=headers)
