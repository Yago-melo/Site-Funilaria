"""WhatsApp Business Cloud API (Meta) — owner daily summary + customer reminders.

Falls back to a logged MOCK send when credentials are missing/invalid.
"""

import logging
import os
import re
from datetime import datetime, timezone

import httpx

from lib.dates import today_iso
from lib.db import db
from lib.settings_store import get_settings

logger = logging.getLogger(__name__)


def _env(name: str) -> str:
    return (os.environ.get(name) or "").strip()


def configured() -> bool:
    return bool(_env("WHATSAPP_ACCESS_TOKEN")) and _env("WHATSAPP_PHONE_NUMBER_ID").isdigit()


def send_mode() -> str:
    return _env("WHATSAPP_SEND_MODE") or "template"


def summary_template() -> str:
    return _env("WHATSAPP_TEMPLATE_NAME") or "agenda_do_dia"


def reminder_template() -> str:
    return _env("WHATSAPP_REMINDER_TEMPLATE") or "lembrete_agendamento"


def normalize_phone(phone: str) -> str:
    digits = re.sub(r"\D", "", phone)
    return f"55{digits}" if len(digits) in (10, 11) else digits


def fmt_date(iso: str) -> str:
    y, m, d = iso.split("-")
    return f"{d}/{m}/{y}"


async def send_message(recipient: str, text: str, template: str, params: list[str]) -> dict:
    """Returns {ok, mock, detail}. Template params cannot contain line breaks."""
    if not configured():
        logger.warning("WhatsApp MOCK send to %s:\n%s", recipient, text)
        return {"ok": True, "mock": True, "detail": "Envio SIMULADO — credenciais da Meta não configuradas."}
    if not recipient:
        return {"ok": False, "mock": False, "detail": "Número de destino não configurado."}

    version = _env("WHATSAPP_GRAPH_VERSION") or "v21.0"
    url = f"https://graph.facebook.com/{version}/{_env('WHATSAPP_PHONE_NUMBER_ID')}/messages"
    if send_mode() == "text":
        payload = {
            "messaging_product": "whatsapp", "recipient_type": "individual", "to": recipient,
            "type": "text", "text": {"preview_url": False, "body": text},
        }
    else:
        payload = {
            "messaging_product": "whatsapp", "to": recipient, "type": "template",
            "template": {
                "name": template,
                "language": {"code": _env("WHATSAPP_TEMPLATE_LANGUAGE") or "pt_BR"},
                "components": [{"type": "body", "parameters": [
                    {"type": "text", "text": re.sub(r"\s*\n\s*", " | ", p)[:1000]} for p in params
                ]}],
            },
        }
    try:
        async with httpx.AsyncClient(timeout=20) as client:
            resp = await client.post(url, json=payload, headers={"Authorization": f"Bearer {_env('WHATSAPP_ACCESS_TOKEN')}"})
    except httpx.HTTPError as exc:
        return {"ok": False, "mock": False, "detail": f"Falha de conexão: {exc}"}
    if resp.is_error:
        return {"ok": False, "mock": False, "detail": f"Meta respondeu {resp.status_code}: {resp.text[:300]}"}
    return {"ok": True, "mock": False, "detail": "Mensagem aceita pela Meta."}


async def _log(kind: str, date: str, recipient: str, count: int, preview: str, result: dict) -> dict:
    now = datetime.now(timezone.utc)
    log = {
        "id": f"wa-{now.strftime('%Y%m%d%H%M%S%f')}", "date": date, "kind": kind, "recipient": recipient,
        "count": count, "preview": preview, "sent_at": now, **result,
    }
    await db.whatsapp_logs.insert_one(dict(log))
    return log


async def send_daily_summary(kind: str = "manual") -> dict:
    settings = await get_settings()
    date = today_iso()
    rows = await db.appointments.find(
        {"date": date, "status": {"$in": ["pendente", "confirmado"]}}, {"_id": 0}
    ).sort("time", 1).to_list(200)
    lines = [
        f"{r['time']} - {r['customer_name']} - {r['service_name']} - {r['car_model']}"
        + (f" ({r['car_plate']})" if r.get("car_plate") else "")
        for r in rows
    ] or ["Nenhum agendamento para hoje."]
    preview = f"Agenda {settings.business_name} - {fmt_date(date)}\n" + "\n".join(lines)
    recipient = normalize_phone(settings.owner_whatsapp)
    result = await send_message(recipient, preview, summary_template(), [fmt_date(date), "\n".join(lines)])
    return await _log(kind, date, recipient, len(rows), preview, result)


async def send_reminder(appt: dict, kind: str = "reminder") -> dict:
    """Day-before reminder to the customer. Marks the appointment so it is sent once."""
    settings = await get_settings()
    first = appt["customer_name"].split(" ")[0]
    date_br = fmt_date(appt["date"])
    preview = (
        f"Olá {first}! Lembrete da {settings.business_name}: seu horário de {appt['service_name']} "
        f"é amanhã, {date_br} às {appt['time']}. Endereço: {settings.address} - {settings.city}. "
        f"Se precisar remarcar, responda esta mensagem."
    )
    recipient = normalize_phone(appt["customer_phone"])
    result = await send_message(recipient, preview, reminder_template(), [first, date_br, appt["time"], appt["service_name"]])
    if result["ok"]:
        await db.appointments.update_one(
            {"id": appt["id"]},
            {"$set": {"reminder_sent_at": datetime.now(timezone.utc), "reminder_mock": result["mock"]}},
        )
    return await _log(kind, appt["date"], recipient, 1, preview, result)
