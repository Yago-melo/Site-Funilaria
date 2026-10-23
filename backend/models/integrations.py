from datetime import datetime

from pydantic import BaseModel


class DispatchLog(BaseModel):
    id: str
    date: str
    kind: str
    recipient: str
    count: int
    preview: str
    sent_at: datetime
    mock: bool
    ok: bool
    detail: str


class WhatsAppStatus(BaseModel):
    configured: bool
    mode: str
    template_name: str
    recipient: str
    daily_enabled: bool
    daily_time: str
    last_dispatch: DispatchLog | None


class CalendarEvent(BaseModel):
    id: str
    summary: str
    start: str
    status: str


class CalendarStatus(BaseModel):
    connected: bool
    mocked: bool
    events_created: int
    recent_events: list[CalendarEvent]


class IntegrationsStatus(BaseModel):
    whatsapp: WhatsAppStatus
    google_calendar: CalendarStatus
