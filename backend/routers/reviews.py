from fastapi import APIRouter, Depends, HTTPException

from lib.auth import require_admin
from lib.db import db
from models.review import Review, ReviewCreate, ReviewPublic, ReviewStatusUpdate, ReviewsSummary

router = APIRouter(tags=["reviews"])


@router.get("/reviews", response_model=ReviewsSummary)
async def public_reviews():
    docs = await db.reviews.find({"status": "aprovado"}, {"_id": 0}).sort("created_at", -1).to_list(200)
    count = len(docs)
    avg = round(sum(d["rating"] for d in docs) / count, 1) if count else 0.0
    return ReviewsSummary(average=avg, count=count, items=[ReviewPublic(**d) for d in docs])


@router.post("/reviews", response_model=Review)
async def create_review(body: ReviewCreate):
    review = Review(**{k: v.strip() if isinstance(v, str) else v for k, v in body.model_dump().items()})
    await db.reviews.insert_one(review.model_dump())
    return review


@router.get("/admin/reviews", response_model=list[Review], dependencies=[Depends(require_admin)])
async def admin_reviews(status: str | None = None):
    q = {"status": status} if status else {}
    docs = await db.reviews.find(q, {"_id": 0}).sort("created_at", -1).to_list(500)
    return [Review(**d) for d in docs]


@router.patch("/admin/reviews/{id}", response_model=Review, dependencies=[Depends(require_admin)])
async def moderate_review(id: str, body: ReviewStatusUpdate):
    doc = await db.reviews.find_one_and_update(
        {"id": id}, {"$set": {"status": body.status}}, projection={"_id": 0}, return_document=True
    )
    if not doc:
        raise HTTPException(status_code=404, detail="Avaliação não encontrada")
    return Review(**doc)


@router.delete("/admin/reviews/{id}", dependencies=[Depends(require_admin)])
async def delete_review(id: str):
    res = await db.reviews.delete_one({"id": id})
    if not res.deleted_count:
        raise HTTPException(status_code=404, detail="Avaliação não encontrada")
    return {"ok": True}
