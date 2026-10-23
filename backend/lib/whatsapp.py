"""WhatsApp Business Cloud API (Meta) — daily appointment summary for the owner.

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


def _fmt_date(iso: str) -> str:
    y, m, d = iso.split("-")
    return f"{d}/{m}/{y}"


async def build_summary(date: str) -> tuple[list[str], int]:
    rows = await db.appointments.find(
        {"date": date, "status": {"$in": ["pendente", "confirmado"]}}, {"_id": 0}
    ).sort("time", 1).to_list(200)
    lines = [
        f"{r['time']} - {r['customer_name']} - {r['service_name']} - {r['car_model']}"
        + (f" ({r['car_plate']})" if r.get("car_plate") else "")
        for r in rows
    ]
    return lines, len(rows)


async def send_daily_summary(kind: str = "manual") -> dict:
    settings = await get_settings()
    date = today_iso()
    lines, count = await build_summary(date)
    header = f"Agenda {settings.business_name} - {_fmt_date(date)}"
    body_lines = lines or ["Nenhum agendamento para hoje."]
    preview = header + "\n" + "\n".join(body_lines)
    recipient = re.sub(r"\D", "", settings.owner_whatsapp)

    log = {
        "id": f"wa-{datetime.now(timezone.utc).strftime('%Y%m%d%H%M%S%f')}",
        "date": date, "kind": kind, "recipient": recipient, "count": count,
        "preview": preview, "sent_at": datetime.now(timezone.utc),
        "mock": True, "ok": True, "detail": "",
    }

    if not configured():
        log["detail"] = "Envio SIMULADO — credenciais da Meta não configuradas."
        logger.warning("WhatsApp MOCK send to %s:\n%s", recipient, preview)
    elif not recipient:
        log.update(ok=False, mock=False, detail="Número do funileiro não configurado.")
    else:
        version = _env("WHATSAPP_GRAPH_VERSION") or "v21.0"
        url = f"https://graph.facebook.com/{version}/{_env('WHATSAPP_PHONE_NUMBER_ID')}/messages"
        if send_mode() == "text":
            payload = {
                "messaging_product": "whatsapp", "recipient_type": "individual", "to": recipient,
                "type": "text", "text": {"preview_url": False, "body": preview},
            }
        else:
            # Template params cannot contain line breaks — join with separators.
            payload = {
                "messaging_product": "whatsapp", "to": recipient, "type": "template",
                "template": {
                    "name": _env("WHATSAPP_TEMPLATE_NAME") or "agenda_do_dia",
                    "language": {"code": _env("WHATSAPP_TEMPLATE_LANGUAGE") or "pt_BR"},
                    "components": [{"type": "body", "parameters": [
                        {"type": "text", "text": _fmt_date(date)},
                        {"type": "text", "text": " | ".join(body_lines)[:1000]},
                    ]}],
                },
            }
        try:
            async with httpx.AsyncClient(timeout=20) as client:
                resp = await client.post(
                    url, json=payload, headers={"Authorization": f"Bearer {_env('WHATSAPP_ACCESS_TOKEN')}"}
                )
            log["mock"] = False
            if resp.is_error:
                log.update(ok=False, detail=f"Meta respondeu {resp.status_code}: {resp.text[:300]}")
            else:
                log["detail"] = "Mensagem aceita pela Meta."
        except httpx.HTTPError as exc:
            log.update(ok=False, mock=False, detail=f"Falha de conexão: {exc}")

    await db.whatsapp_logs.insert_one(dict(log))
    log.pop("_id", None)
    return log
