"""Business settings live in one document (id="business") in db.settings."""

from lib.db import db
from models.settings import BusinessSettings


async def get_settings() -> BusinessSettings:
    doc = await db.settings.find_one({"id": "business"}, {"_id": 0})
    if not doc:
        return BusinessSettings()
    return BusinessSettings(**{k: v for k, v in doc.items() if k != "id"})


async def save_settings(settings: BusinessSettings) -> BusinessSettings:
    await db.settings.update_one(
        {"id": "business"}, {"$set": {"id": "business", **settings.model_dump()}}, upsert=True
    )
    return settings
