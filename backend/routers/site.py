from fastapi import APIRouter, Depends, HTTPException

from lib.auth import require_admin
from lib.dates import today_iso
from lib.db import db
from lib.settings_store import get_settings, save_settings
from models.settings import BusinessSettings, Service, ServiceCreate, SiteInfo

router = APIRouter(tags=["site"])


async def list_services() -> list[Service]:
    docs = await db.services.find({}, {"_id": 0}).sort("duration_min", 1).to_list(100)
    return [Service(**d) for d in docs]


@router.get("/site", response_model=SiteInfo)
async def site_info():
    return SiteInfo(settings=await get_settings(), services=await list_services(), today=today_iso())


@router.put("/admin/settings", response_model=BusinessSettings, dependencies=[Depends(require_admin)])
async def update_settings(body: BusinessSettings):
    if body.open_time >= body.close_time:
        raise HTTPException(status_code=400, detail="Horário de abertura deve ser antes do fechamento")
    return await save_settings(body)


@router.post("/admin/services", response_model=Service, dependencies=[Depends(require_admin)])
async def create_service(body: ServiceCreate):
    service = Service(**body.model_dump())
    await db.services.insert_one(service.model_dump())
    return service


@router.delete("/admin/services/{id}", dependencies=[Depends(require_admin)])
async def delete_service(id: str):
    res = await db.services.delete_one({"id": id})
    if not res.deleted_count:
        raise HTTPException(status_code=404, detail="Serviço não encontrado")
    return {"ok": True}
