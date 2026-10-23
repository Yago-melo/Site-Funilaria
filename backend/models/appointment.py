import uuid
from datetime import datetime, timezone
from typing import Literal

from pydantic import BaseModel, Field

AppointmentStatus = Literal["pendente", "confirmado", "concluido", "cancelado"]


class AppointmentCreate(BaseModel):
    service_id: str
    date: str = Field(pattern=r"^\d{4}-\d{2}-\d{2}$")
    time: str = Field(pattern=r"^\d{2}:\d{2}$")
    customer_name: str = Field(min_length=2, max_length=80)
    customer_phone: str = Field(min_length=10, max_length=20)
    car_model: str = Field(min_length=2, max_length=80)
    car_plate: str = Field(default="", max_length=10)
    notes: str = Field(default="", max_length=500)


class Appointment(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    service_id: str
    service_name: str
    duration_min: int
    date: str
    time: str
    customer_name: str
    customer_phone: str
    car_model: str
    car_plate: str = ""
    notes: str = ""
    status: AppointmentStatus = "pendente"
    gcal_event_id: str | None = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class AppointmentStatusUpdate(BaseModel):
    status: AppointmentStatus


class Availability(BaseModel):
    date: str
    open: bool
    slots: list[str]


class BookingResult(BaseModel):
    appointment: Appointment
    whatsapp_url: str
    calendar_synced: bool
    calendar_mocked: bool


class AdminStats(BaseModel):
    today: str
    today_count: int
    upcoming_count: int
    pending_count: int
    gallery_count: int
