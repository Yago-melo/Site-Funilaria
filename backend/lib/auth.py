"""Admin auth: single admin from env, JWT in an httpOnly cookie."""

import hmac
import os
from datetime import datetime, timedelta, timezone

import jwt
from fastapi import Cookie, HTTPException, Request, Response

COOKIE_NAME = "nadis_session"
ALGO = "HS256"
TTL = timedelta(days=7)


def check_credentials(email: str, password: str) -> bool:
    ok_email = hmac.compare_digest(email.strip().lower(), os.environ["ADMIN_EMAIL"].lower())
    ok_pass = hmac.compare_digest(password, os.environ["ADMIN_PASSWORD"])
    return ok_email and ok_pass


def set_session(response: Response, request: Request, email: str) -> None:
    exp = datetime.now(timezone.utc) + TTL
    token = jwt.encode({"sub": email, "exp": exp}, os.environ["JWT_SECRET"], algorithm=ALGO)
    secure = request.headers.get("x-forwarded-proto", request.url.scheme) == "https"
    response.set_cookie(
        COOKIE_NAME, token, httponly=True, samesite="lax", secure=secure,
        max_age=int(TTL.total_seconds()), path="/",
    )


def clear_session(response: Response) -> None:
    response.delete_cookie(COOKIE_NAME, path="/")


async def require_admin(nadis_session: str | None = Cookie(default=None)) -> str:
    if not nadis_session:
        raise HTTPException(status_code=401, detail="Não autenticado")
    try:
        payload = jwt.decode(nadis_session, os.environ["JWT_SECRET"], algorithms=[ALGO])
    except jwt.PyJWTError:
        raise HTTPException(status_code=401, detail="Sessão inválida")
    return str(payload["sub"])
