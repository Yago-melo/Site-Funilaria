"""Daily WhatsApp dispatch loop — checks every minute, sends once per day after the configured time."""

import asyncio
import logging
import os
from datetime import datetime
from zoneinfo import ZoneInfo

from lib.dates import today_iso
from lib.db import db
from lib.settings_store import get_settings
from lib.whatsapp import send_daily_summary

logger = logging.getLogger(__name__)


async def daily_loop() -> None:
    while True:
        try:
            settings = await get_settings()
            if settings.daily_summary_enabled:
                now = datetime.now(ZoneInfo(os.environ.get("APP_TZ", "UTC")))
                if now.strftime("%H:%M") >= settings.daily_summary_time:
                    already = await db.whatsapp_logs.find_one({"date": today_iso(), "kind": "auto"})
                    if not already:
                        await send_daily_summary(kind="auto")
        except asyncio.CancelledError:
            raise
        except Exception:
            logger.exception("daily WhatsApp dispatch failed")
        await asyncio.sleep(60)
