"""Google Calendar integration — MOCKED.

Events are recorded in db.calendar_events exactly as they would be sent to
Google Calendar (events.insert). Swap `create_event`/`cancel_event` for real
google-api-python-client calls once the owner connects their account via OAuth.
"""

import uuid
from datetime import datetime, timedelta, timezone

from lib.db import db

MOCKED = True
CAL_TZ = "America/Sao_Paulo"


async def create_event(appt: dict) -> str:
    start = datetime.strptime(f"{appt['date']} {appt['time']}", "%Y-%m-%d %H:%M")
    end = start + timedelta(minutes=appt["duration_min"])
    event_id = f"mock-gcal-{uuid.uuid4().hex[:12]}"
    await db.calendar_events.insert_one({
        "id": event_id,
        "appointment_id": appt["id"],
        "summary": f"{appt['service_name']} — {appt['customer_name']}",
        "description": (
            f"Cliente: {appt['customer_name']}\nTelefone: {appt['customer_phone']}\n"
            f"Veículo: {appt['car_model']} {appt.get('car_plate') or ''}\nObs: {appt.get('notes') or '-'}"
        ),
        "start": {"dateTime": start.strftime("%Y-%m-%dT%H:%M:00"), "timeZone": CAL_TZ},
        "end": {"dateTime": end.strftime("%Y-%m-%dT%H:%M:00"), "timeZone": CAL_TZ},
        "status": "confirmed",
        "created_at": datetime.now(timezone.utc),
    })
    return event_id


async def cancel_event(event_id: str | None) -> None:
    if event_id:
        await db.calendar_events.update_one({"id": event_id}, {"$set": {"status": "cancelled"}})


async def events_count() -> int:
    return await db.calendar_events.count_documents({"status": "confirmed"})
