import os

from fastapi import APIRouter, Depends

from lib import gcal, whatsapp
from lib.auth import require_admin
from lib.db import db
from lib.settings_store import get_settings
from models.integrations import CalendarEvent, CalendarStatus, DispatchLog, IntegrationsStatus, WhatsAppStatus

router = APIRouter(prefix="/admin/integrations", tags=["integrations"], dependencies=[Depends(require_admin)])


@router.get("", response_model=IntegrationsStatus)
async def integrations_status():
    settings = await get_settings()
    last = await db.whatsapp_logs.find_one({}, {"_id": 0}, sort=[("sent_at", -1)])
    events = await db.calendar_events.find({}, {"_id": 0}).sort("created_at", -1).to_list(5)
    return IntegrationsStatus(
        whatsapp=WhatsAppStatus(
            configured=whatsapp.configured(),
            mode=whatsapp.send_mode(),
            template_name=os.environ.get("WHATSAPP_TEMPLATE_NAME", "agenda_do_dia"),
            recipient=settings.owner_whatsapp,
            daily_enabled=settings.daily_summary_enabled,
            daily_time=settings.daily_summary_time,
            last_dispatch=DispatchLog(**last) if last else None,
        ),
        google_calendar=CalendarStatus(
            connected=False,
            mocked=gcal.MOCKED,
            events_created=await gcal.events_count(),
            recent_events=[
                CalendarEvent(id=e["id"], summary=e["summary"], start=e["start"]["dateTime"], status=e["status"])
                for e in events
            ],
        ),
    )


@router.post("/whatsapp/send-today", response_model=DispatchLog)
async def send_today():
    return DispatchLog(**await whatsapp.send_daily_summary(kind="manual"))


@router.get("/whatsapp/logs", response_model=list[DispatchLog])
async def whatsapp_logs():
    docs = await db.whatsapp_logs.find({}, {"_id": 0}).sort("sent_at", -1).to_list(20)
    return [DispatchLog(**d) for d in docs]
