import uuid
from datetime import datetime, timezone
from typing import Literal

from pydantic import BaseModel, Field

QuoteStatus = Literal["novo", "respondido", "agendado", "arquivado"]


class Quote(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    customer_name: str
    customer_phone: str
    car_model: str
    description: str = ""
    photos: list[str] = Field(default_factory=list)
    status: QuoteStatus = "novo"
    price_quote: str = ""
    owner_reply: str = ""
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    replied_at: datetime | None = None


class QuotePublic(BaseModel):
    """What the customer sees on the tracking page (no phone, no photos)."""
    id: str
    customer_name: str
    car_model: str
    status: QuoteStatus
    price_quote: str
    owner_reply: str
    created_at: datetime
    replied_at: datetime | None


class QuoteReply(BaseModel):
    price_quote: str = Field(default="", max_length=120)
    owner_reply: str = Field(default="", max_length=1000)
    status: QuoteStatus = "respondido"
