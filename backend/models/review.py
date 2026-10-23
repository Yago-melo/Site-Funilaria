import uuid
from datetime import datetime, timezone
from typing import Literal

from pydantic import BaseModel, Field

ReviewStatus = Literal["pendente", "aprovado", "rejeitado"]


class ReviewCreate(BaseModel):
    customer_name: str = Field(min_length=2, max_length=60)
    rating: int = Field(ge=1, le=5)
    comment: str = Field(min_length=5, max_length=600)
    car_model: str = Field(default="", max_length=60)


class Review(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    customer_name: str
    rating: int
    comment: str
    car_model: str = ""
    status: ReviewStatus = "pendente"
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class ReviewPublic(BaseModel):
    id: str
    customer_name: str
    rating: int
    comment: str
    car_model: str
    created_at: datetime


class ReviewsSummary(BaseModel):
    average: float
    count: int
    items: list[ReviewPublic]


class ReviewStatusUpdate(BaseModel):
    status: ReviewStatus
