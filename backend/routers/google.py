from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import RedirectResponse

from lib import gcal
from lib.auth import require_admin

router = APIRouter(tags=["google"])


def callback_uri(request: Request) -> str:
    proto = request.headers.get("x-forwarded-proto", request.url.scheme).split(",")[0].strip()
    host = request.headers.get("x-forwarded-host") or request.headers.get("host") or request.url.netloc
    return f"{proto}://{host.split(',')[0].strip()}/api/google/callback"


@router.get("/admin/google/connect", dependencies=[Depends(require_admin)])
async def google_connect(request: Request):
    if not gcal.client_configured():
        raise HTTPException(status_code=400, detail="Client ID/Secret do Google ainda não configurados")
    return {"authorization_url": gcal.authorization_url(callback_uri(request))}


@router.get("/google/callback")
async def google_callback(code: str | None = None, state: str | None = None, error: str | None = None):
    if error or not code or not state:
        return RedirectResponse("/admin/painel?google=erro")
    try:
        redirect_uri = gcal.read_state(state)
        await gcal.exchange_code(code, redirect_uri)
    except Exception:
        return RedirectResponse("/admin/painel?google=erro")
    return RedirectResponse("/admin/painel?google=ok")


@router.post("/admin/google/disconnect", dependencies=[Depends(require_admin)])
async def google_disconnect():
    await gcal.disconnect()
    return {"ok": True}
