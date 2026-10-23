"""Idempotent seed: services + sample gallery. Run: cd /app/backend && python seed.py"""

import asyncio
from datetime import datetime, timedelta, timezone

from lib.db import db, ensure_indexes
from models.gallery import GalleryItem
from models.settings import Service

SERVICES = [
    Service(id="svc-pequena", name="Martelinho de Ouro — Pequena Avaria", duration_min=60,
            price_label="A partir de R$ 150,00",
            description="Mossas de estacionamento, batidas de porta e pequenos amassados."),
    Service(id="svc-media", name="Martelinho de Ouro — Média Avaria / Vinco", duration_min=120,
            price_label="A partir de R$ 280,00",
            description="Vincos em paralamas, portas e capô, mantendo a pintura original."),
    Service(id="svc-granizo", name="Martelinho de Ouro — Granizo", duration_min=240,
            price_label="Orçamento sob avaliação",
            description="Recuperação completa de veículos atingidos por granizo."),
]

U = "?auto=compress&cs=tinysrgb&w=1200"
GALLERY = [
    GalleryItem(id="gal-1", type="image", title="Paralama traseiro sem repintura", category="Paralama",
                description="Amassado de estacionamento removido preservando a tinta de fábrica.",
                before_url="https://images.unsplash.com/photo-1673187139211-1e7ec3dd60ec?w=1200&q=80",
                media_url="https://images.pexels.com/photos/29755711/pexels-photo-29755711.jpeg" + U),
    GalleryItem(id="gal-2", type="image", title="Desamassamento de porta lateral", category="Porta",
                description="Técnica de alavancas com iluminação de inspeção.",
                media_url="https://images.pexels.com/photos/35149611/pexels-photo-35149611.jpeg" + U),
    GalleryItem(id="gal-3", type="image", title="Acabamento espelhado no capô", category="Capô",
                description="Superfície alinhada e sem ondulações.",
                media_url="https://images.unsplash.com/photo-1690022676526-2762ac826843?w=1200&q=80"),
    GalleryItem(id="gal-4", type="image", title="Retrovisor e coluna recuperados", category="Detalhe",
                media_url="https://images.pexels.com/photos/7540400/pexels-photo-7540400.jpeg" + U),
    GalleryItem(id="gal-5", type="image", title="Inspeção de painel na oficina", category="Oficina",
                media_url="https://images.pexels.com/photos/37809577/pexels-photo-37809577.jpeg" + U),
]


async def main() -> None:
    await ensure_indexes()
    for s in SERVICES:
        await db.services.update_one({"id": s.id}, {"$setOnInsert": s.model_dump()}, upsert=True)
    base = datetime.now(timezone.utc)
    for i, g in enumerate(GALLERY):
        doc = {**g.model_dump(), "created_at": base - timedelta(minutes=i), "is_deleted": False}
        await db.gallery.update_one({"id": g.id}, {"$setOnInsert": doc}, upsert=True)
    print("seed ok")


if __name__ == "__main__":
    asyncio.run(main())
