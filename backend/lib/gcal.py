"""Google Calendar — real sync via OAuth 2.0 when connected, MOCK otherwise.

Every event (real or mock) is mirrored in db.calendar_events for the admin panel.
The owner's tokens live in db.google_tokens (id="owner").
"""

import logging
import os
import uuid
from datetime import datetime, timedelta, timezone
from urllib.parse import urlencode

import httpx
import jwt

from lib.db import db

logger = logging.getLogger(__name__)

CAL_TZ = "America/Sao_Paulo"
SCOPES = "openid https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/calendar.events"
AUTH_URI = "https://accounts.google.com/o/oauth2/v2/auth"
TOKEN_URI = "https://oauth2.googleapis.com/token"
EVENTS_URI = "https://www.googleapis.com/calendar/v3/calendars/primary/events"


def _env(name: str) -> str:
    return (os.environ.get(name) or "").strip()


def client_configured() -> bool:
    return bool(_env("GOOGLE_CLIENT_ID") and _env("GOOGLE_CLIENT_SECRET"))


async def get_tokens() -> dict | None:
    return await db.google_tokens.find_one({"id": "owner"}, {"_id": 0})


async def is_connected() -> bool:
    tokens = await get_tokens()
    return client_configured() and bool(tokens and tokens.get("refresh_token"))


# ---------- OAuth ----------

def make_state(redirect_uri: str) -> str:
    exp = datetime.now(timezone.utc) + timedelta(minutes=15)
    return jwt.encode({"ru": redirect_uri, "exp": exp, "p": "gcal"}, _env("JWT_SECRET"), algorithm="HS256")


def read_state(state: str) -> str:
    payload = jwt.decode(state, _env("JWT_SECRET"), algorithms=["HS256"])
    return str(payload["ru"])


def authorization_url(redirect_uri: str) -> str:
    params = {
        "client_id": _env("GOOGLE_CLIENT_ID"), "redirect_uri": redirect_uri, "response_type": "code",
        "scope": SCOPES, "access_type": "offline", "prompt": "consent", "include_granted_scopes": "true",
        "state": make_state(redirect_uri),
    }
    return f"{AUTH_URI}?{urlencode(params)}"


async def exchange_code(code: str, redirect_uri: str) -> str:
    async with httpx.AsyncClient(timeout=20) as client:
        resp = await client.post(TOKEN_URI, data={
            "code": code, "client_id": _env("GOOGLE_CLIENT_ID"), "client_secret": _env("GOOGLE_CLIENT_SECRET"),
            "redirect_uri": redirect_uri, "grant_type": "authorization_code",
        })
        resp.raise_for_status()
        tok = resp.json()
        info = await client.get("https://www.googleapis.com/oauth2/v2/userinfo",
                                headers={"Authorization": f"Bearer {tok['access_token']}"})
        email = info.json().get("email", "") if info.is_success else ""
    existing = await get_tokens() or {}
    await db.google_tokens.update_one({"id": "owner"}, {"$set": {
        "id": "owner", "email": email, "access_token": tok["access_token"],
        "refresh_token": tok.get("refresh_token") or existing.get("refresh_token"),
        "expires_at": datetime.now(timezone.utc) + timedelta(seconds=int(tok.get("expires_in", 3600))),
        "connected_at": datetime.now(timezone.utc),
    }}, upsert=True)
    return email


async def disconnect() -> None:
    tokens = await get_tokens()
    if tokens and tokens.get("refresh_token"):
        try:
            async with httpx.AsyncClient(timeout=10) as client:
                await client.post("https://oauth2.googleapis.com/revoke", data={"token": tokens["refresh_token"]})
        except httpx.HTTPError:
            pass
    await db.google_tokens.delete_one({"id": "owner"})


async def _access_token() -> str:
    tokens = await get_tokens()
    if not tokens:
        raise RuntimeError("Google não conectado")
    expires = tokens.get("expires_at")
    if expires and expires.tzinfo is None:
        expires = expires.replace(tzinfo=timezone.utc)  # motor returns naive UTC
    if expires and expires > datetime.now(timezone.utc) + timedelta(seconds=60):
        return tokens["access_token"]
    async with httpx.AsyncClient(timeout=20) as client:
        resp = await client.post(TOKEN_URI, data={
            "client_id": _env("GOOGLE_CLIENT_ID"), "client_secret": _env("GOOGLE_CLIENT_SECRET"),
            "refresh_token": tokens["refresh_token"], "grant_type": "refresh_token",
        })
        resp.raise_for_status()
        tok = resp.json()
    await db.google_tokens.update_one({"id": "owner"}, {"$set": {
        "access_token": tok["access_token"],
        "expires_at": datetime.now(timezone.utc) + timedelta(seconds=int(tok.get("expires_in", 3600))),
    }})
    return tok["access_token"]


# ---------- Events ----------

def _event_body(appt: dict) -> dict:
    start = datetime.strptime(f"{appt['date']} {appt['time']}", "%Y-%m-%d %H:%M")
    end = start + timedelta(minutes=appt["duration_min"])
    return {
        "summary": f"{appt['service_name']} — {appt['customer_name']}",
        "description": (
            f"Cliente: {appt['customer_name']}\nTelefone: {appt['customer_phone']}\n"
            f"Veículo: {appt['car_model']} {appt.get('car_plate') or ''}\nObs: {appt.get('notes') or '-'}\n\n"
            "Agendado pelo site Nadis Car."
        ),
        "start": {"dateTime": start.strftime("%Y-%m-%dT%H:%M:00"), "timeZone": CAL_TZ},
        "end": {"dateTime": end.strftime("%Y-%m-%dT%H:%M:00"), "timeZone": CAL_TZ},
        "reminders": {"useDefault": True},
    }


async def create_event(appt: dict) -> str:
    body = _event_body(appt)
    event_id, provider, error = f"mock-gcal-{uuid.uuid4().hex[:12]}", "mock", ""
    if await is_connected():
        try:
            token = await _access_token()
            async with httpx.AsyncClient(timeout=20) as client:
                resp = await client.post(EVENTS_URI, json=body, headers={"Authorization": f"Bearer {token}"})
            resp.raise_for_status()
            event_id, provider = resp.json()["id"], "google"
        except Exception as exc:  # booking must never fail because of the calendar
            error = str(exc)[:300]
            logger.error("Google Calendar insert failed: %s", error)
    await db.calendar_events.insert_one({
        "id": event_id, "appointment_id": appt["id"], "provider": provider, "error": error,
        "summary": body["summary"], "start": body["start"], "end": body["end"],
        "status": "confirmed", "created_at": datetime.now(timezone.utc),
    })
    return event_id


async def cancel_event(event_id: str | None) -> None:
    if not event_id:
        return
    await db.calendar_events.update_one({"id": event_id}, {"$set": {"status": "cancelled"}})
    if not event_id.startswith("mock-") and await is_connected():
        try:
            token = await _access_token()
            async with httpx.AsyncClient(timeout=20) as client:
                await client.delete(f"{EVENTS_URI}/{event_id}", headers={"Authorization": f"Bearer {token}"})
        except Exception as exc:
            logger.error("Google Calendar delete failed: %s", exc)


def is_mock_event(event_id: str | None) -> bool:
    return not event_id or event_id.startswith("mock-")


async def events_count() -> int:
    return await db.calendar_events.count_documents({"status": "confirmed"})
