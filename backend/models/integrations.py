from datetime import datetime

from pydantic import BaseModel


class DispatchLog(BaseModel):
    id: str
    date: str
    kind: str  # auto | manual (owner summary) | reminder | reminder_manual (customer)
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
    reminder_template: str
    recipient: str
    daily_enabled: bool
    daily_time: str
    reminder_enabled: bool
    reminder_time: str
    last_dispatch: DispatchLog | None


class CalendarEvent(BaseModel):
    id: str
    summary: str
    start: str
    status: str
    provider: str


class CalendarStatus(BaseModel):
    client_configured: bool
    connected: bool
    email: str | None
    mocked: bool
    redirect_uri: str
    events_created: int
    recent_events: list[CalendarEvent]


class IntegrationsStatus(BaseModel):
    whatsapp: WhatsAppStatus
    google_calendar: CalendarStatus
