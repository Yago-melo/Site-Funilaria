import os
import re
from datetime import date as date_cls, datetime, timedelta
from urllib.parse import quote
from zoneinfo import ZoneInfo

from fastapi import APIRouter, Depends, HTTPException, Query

from lib import gcal
from lib.auth import require_admin
from lib.dates import today_iso
from lib.db import db
from lib.settings_store import get_settings
from models.appointment import (
    AdminStats, Appointment, AppointmentCreate, AppointmentStatusUpdate, Availability, BookingResult,
)

router = APIRouter(tags=["appointments"])

MAX_DAYS_AHEAD = 60
ACTIVE = ["pendente", "confirmado"]


def _to_min(hhmm: str) -> int:
    h, m = hhmm.split(":")
    return int(h) * 60 + int(m)


def _to_hhmm(minutes: int) -> str:
    return f"{minutes // 60:02d}:{minutes % 60:02d}"


async def compute_slots(day: str, duration: int) -> Availability:
    settings = await get_settings()
    today = today_iso()
    try:
        d = date_cls.fromisoformat(day)
    except ValueError:
        raise HTTPException(status_code=400, detail="Data inválida")
    if day < today or d > date_cls.fromisoformat(today) + timedelta(days=MAX_DAYS_AHEAD) or d.weekday() not in settings.work_days:
        return Availability(date=day, open=False, slots=[])

    booked = await db.appointments.find({"date": day, "status": {"$in": ACTIVE}}, {"_id": 0, "time": 1, "duration_min": 1}).to_list(200)
    busy = [(_to_min(b["time"]), _to_min(b["time"]) + b["duration_min"]) for b in booked]
    now_min = -1
    if day == today:
        now = datetime.now(ZoneInfo(os.environ.get("APP_TZ", "UTC")))
        now_min = now.hour * 60 + now.minute

    open_m, close_m = _to_min(settings.open_time), _to_min(settings.close_time)
    slots: list[str] = []
    t = open_m
    while t + duration <= close_m:
        if t > now_min and all(t + duration <= s or t >= e for s, e in busy):
            slots.append(_to_hhmm(t))
        t += settings.slot_step_min
    return Availability(date=day, open=True, slots=slots)


@router.get("/availability", response_model=Availability)
async def availability(date: str, service_id: str):
    service = await db.services.find_one({"id": service_id}, {"_id": 0})
    if not service:
        raise HTTPException(status_code=404, detail="Serviço não encontrado")
    return await compute_slots(date, service["duration_min"])


@router.post("/appointments", response_model=BookingResult)
async def create_appointment(body: AppointmentCreate):
    service = await db.services.find_one({"id": body.service_id}, {"_id": 0})
    if not service:
        raise HTTPException(status_code=404, detail="Serviço não encontrado")
    avail = await compute_slots(body.date, service["duration_min"])
    if body.time not in avail.slots:
        raise HTTPException(status_code=409, detail="Horário indisponível. Escolha outro horário.")

    appt = Appointment(
        **body.model_dump(exclude={"customer_phone", "car_plate"}),
        customer_phone=re.sub(r"\D", "", body.customer_phone),
        car_plate=body.car_plate.strip().upper(),
        service_name=service["name"], duration_min=service["duration_min"],
    )
    appt.gcal_event_id = await gcal.create_event(appt.model_dump())
    await db.appointments.insert_one(appt.model_dump())

    settings = await get_settings()
    y, m, d = appt.date.split("-")
    text = (
        f"Olá! Acabei de agendar pelo site:\n"
        f"Serviço: {appt.service_name}\nData: {d}/{m}/{y} às {appt.time}\n"
        f"Nome: {appt.customer_name}\nVeículo: {appt.car_model}"
        + (f" ({appt.car_plate})" if appt.car_plate else "")
    )
    wa = f"https://wa.me/{re.sub(r'[^0-9]', '', settings.whatsapp_number)}?text={quote(text)}"
    return BookingResult(appointment=appt, whatsapp_url=wa, calendar_synced=True, calendar_mocked=gcal.MOCKED)


@router.get("/admin/appointments", response_model=list[Appointment], dependencies=[Depends(require_admin)])
async def list_appointments(
    date: str | None = None,
    scope: str = Query("upcoming", pattern="^(today|upcoming|past|all)$"),
    status: str | None = None,
):
    q: dict = {}
    today = today_iso()
    if date:
        q["date"] = date
    elif scope == "today":
        q["date"] = today
    elif scope == "upcoming":
        q["date"] = {"$gte": today}
    elif scope == "past":
        q["date"] = {"$lt": today}
    if status:
        q["status"] = status
    direction = -1 if scope == "past" else 1
    docs = await db.appointments.find(q, {"_id": 0}).sort([("date", direction), ("time", direction)]).to_list(1000)
    return [Appointment(**d) for d in docs]


@router.patch("/admin/appointments/{id}", response_model=Appointment, dependencies=[Depends(require_admin)])
async def update_appointment_status(id: str, body: AppointmentStatusUpdate):
    doc = await db.appointments.find_one_and_update(
        {"id": id}, {"$set": {"status": body.status}}, projection={"_id": 0}, return_document=True
    )
    if not doc:
        raise HTTPException(status_code=404, detail="Agendamento não encontrado")
    if body.status == "cancelado":
        await gcal.cancel_event(doc.get("gcal_event_id"))
    return Appointment(**doc)


@router.get("/admin/stats", response_model=AdminStats, dependencies=[Depends(require_admin)])
async def admin_stats():
    today = today_iso()
    return AdminStats(
        today=today,
        today_count=await db.appointments.count_documents({"date": today, "status": {"$in": ACTIVE}}),
        upcoming_count=await db.appointments.count_documents({"date": {"$gte": today}, "status": {"$in": ACTIVE}}),
        pending_count=await db.appointments.count_documents({"date": {"$gte": today}, "status": "pendente"}),
        gallery_count=await db.gallery.count_documents({"is_deleted": {"$ne": True}}),
    )
