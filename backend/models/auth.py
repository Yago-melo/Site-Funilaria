from pydantic import BaseModel


class LoginRequest(BaseModel):
    email: str
    password: str


class AdminUser(BaseModel):
    email: str


class SessionInfo(BaseModel):
    authenticated: bool
    email: str | None
