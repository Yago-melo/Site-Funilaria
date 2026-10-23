import uuid

from pydantic import BaseModel, Field


class Service(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    description: str = ""
    duration_min: int = 60
    price_label: str = ""


class ServiceCreate(BaseModel):
    name: str = Field(min_length=2)
    description: str = ""
    duration_min: int = Field(default=60, ge=15, le=600)
    price_label: str = ""


class BusinessSettings(BaseModel):
    business_name: str = "Martelinho de Ouro Nadis Car"
    tagline: str = "Desamassamento sem pintura com acabamento de fábrica."
    whatsapp_number: str = "5511999999999"
    owner_whatsapp: str = "5511999999999"
    whatsapp_message: str = "Olá! Gostaria de um orçamento de Martelinho de Ouro para o meu carro."
    address: str = "Rua Exemplo, 123 - Centro"
    city: str = "São Paulo - SP"
    email: str = "contato@nadiscar.com.br"
    instagram: str = ""
    work_days: list[int] = Field(default_factory=lambda: [0, 1, 2, 3, 4, 5])  # 0 = segunda
    open_time: str = Field(default="08:00", pattern=r"^\d{2}:\d{2}$")
    close_time: str = Field(default="18:00", pattern=r"^\d{2}:\d{2}$")
    slot_step_min: int = Field(default=60, ge=15, le=240)
    daily_summary_enabled: bool = True
    daily_summary_time: str = Field(default="07:30", pattern=r"^\d{2}:\d{2}$")


class SiteInfo(BaseModel):
    settings: BusinessSettings
    services: list[Service]
    today: str
