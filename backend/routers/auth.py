from fastapi import APIRouter, Cookie, Depends, HTTPException, Request, Response

from lib.auth import check_credentials, clear_session, require_admin, set_session
from models.auth import AdminUser, LoginRequest, SessionInfo

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/login", response_model=AdminUser)
async def login(body: LoginRequest, request: Request, response: Response):
    if not check_credentials(body.email, body.password):
        raise HTTPException(status_code=401, detail="E-mail ou senha inválidos")
    set_session(response, request, body.email.strip().lower())
    return AdminUser(email=body.email.strip().lower())


@router.post("/logout")
async def logout(response: Response):
    clear_session(response)
    return {"ok": True}


@router.get("/me", response_model=AdminUser)
async def me(email: str = Depends(require_admin)):
    return AdminUser(email=email)


@router.get("/session", response_model=SessionInfo)
async def session(nadis_session: str | None = Cookie(default=None)):
    try:
        return SessionInfo(authenticated=True, email=await require_admin(nadis_session))
    except HTTPException:
        return SessionInfo(authenticated=False, email=None)
