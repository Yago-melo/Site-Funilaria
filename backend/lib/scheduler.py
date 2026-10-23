"""Background loop (every minute): owner daily summary + customer day-before reminders."""

import asyncio
import logging
import os
from datetime import date, datetime, timedelta
from zoneinfo import ZoneInfo

from lib.dates import today_iso
from lib.db import db
from lib.settings_store import get_settings
from lib.whatsapp import send_daily_summary, send_reminder

logger = logging.getLogger(__name__)


def _now_hhmm() -> str:
    return datetime.now(ZoneInfo(os.environ.get("APP_TZ", "UTC"))).strftime("%H:%M")


async def run_daily_summary() -> None:
    settings = await get_settings()
    if settings.daily_summary_enabled and _now_hhmm() >= settings.daily_summary_time:
        if not await db.whatsapp_logs.find_one({"date": today_iso(), "kind": "auto"}):
            await send_daily_summary(kind="auto")


async def run_reminders() -> None:
    settings = await get_settings()
    if not settings.reminder_enabled or _now_hhmm() < settings.reminder_time:
        return
    tomorrow = (date.fromisoformat(today_iso()) + timedelta(days=1)).isoformat()
    rows = await db.appointments.find(
        {"date": tomorrow, "status": {"$in": ["pendente", "confirmado"]}, "reminder_sent_at": None,
         "reminder_attempted": {"$ne": tomorrow}},
        {"_id": 0},
    ).to_list(200)
    for appt in rows:
        # mark the attempt first so a failing number is not retried every minute
        await db.appointments.update_one({"id": appt["id"]}, {"$set": {"reminder_attempted": tomorrow}})
        await send_reminder(appt)


async def daily_loop() -> None:
    while True:
        for job in (run_daily_summary, run_reminders):
            try:
                await job()
            except asyncio.CancelledError:
                raise
            except Exception:
                logger.exception("scheduled job %s failed", job.__name__)
        await asyncio.sleep(60)
