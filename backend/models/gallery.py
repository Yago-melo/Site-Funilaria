import uuid
from datetime import datetime, timezone
from typing import Literal

from pydantic import BaseModel, Field


class GalleryItem(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    type: Literal["image", "video"]
    title: str
    category: str = "Martelinho de Ouro"
    description: str = ""
    media_url: str
    before_url: str | None = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
