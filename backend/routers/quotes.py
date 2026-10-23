import re
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile

from lib.auth import require_admin
from lib.db import db
from lib.media import store_upload
from models.quote import Quote, QuotePublic, QuoteReply

router = APIRouter(tags=["quotes"])

MAX_PHOTOS = 5


@router.post("/quotes", response_model=QuotePublic)
async def create_quote(
    customer_name: str = Form(..., min_length=2, max_length=80),
    customer_phone: str = Form(..., min_length=10, max_length=20),
    car_model: str = Form(..., min_length=2, max_length=80),
    description: str = Form("", max_length=1000),
    photos: list[UploadFile] = File(...),
):
    phone = re.sub(r"\D", "", customer_phone)
    if len(phone) < 10:
        raise HTTPException(status_code=400, detail="Telefone inválido")
    files = [p for p in photos if p.filename]
    if not files:
        raise HTTPException(status_code=400, detail="Envie pelo menos uma foto do amassado")
    if len(files) > MAX_PHOTOS:
        raise HTTPException(status_code=400, detail=f"Envie no máximo {MAX_PHOTOS} fotos")
    urls = [(await store_upload(f, "quotes", private=True, images_only=True))[0] for f in files]
    quote = Quote(
        customer_name=customer_name.strip(), customer_phone=phone, car_model=car_model.strip(),
        description=description.strip(), photos=urls,
    )
    await db.quotes.insert_one(quote.model_dump())
    return QuotePublic(**quote.model_dump())


@router.get("/quotes/{id}", response_model=QuotePublic)
async def get_quote(id: str):
    doc = await db.quotes.find_one({"id": id}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="Orçamento não encontrado")
    return QuotePublic(**doc)


@router.get("/admin/quotes", response_model=list[Quote], dependencies=[Depends(require_admin)])
async def list_quotes(status: str | None = None):
    q = {"status": status} if status else {}
    docs = await db.quotes.find(q, {"_id": 0}).sort("created_at", -1).to_list(500)
    return [Quote(**d) for d in docs]


@router.patch("/admin/quotes/{id}", response_model=Quote, dependencies=[Depends(require_admin)])
async def reply_quote(id: str, body: QuoteReply):
    update = body.model_dump()
    if body.status == "respondido":
        update["replied_at"] = datetime.now(timezone.utc)
    doc = await db.quotes.find_one_and_update({"id": id}, {"$set": update}, projection={"_id": 0}, return_document=True)
    if not doc:
        raise HTTPException(status_code=404, detail="Orçamento não encontrado")
    return Quote(**doc)
