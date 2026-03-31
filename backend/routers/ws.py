"""
WebSocket endpoint for real-time notifications and pipeline status.

Mobile connects with:  ws(s)://<host>/ws/notifications?token=<supabase-jwt>
"""
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from backend.auth import _decode_token
from backend.database import _get_engine
from backend.services.ws_manager import manager

router = APIRouter(tags=["websocket"])


async def _get_user_id(token: str) -> str | None:
    try:
        payload = _decode_token(token)
        return payload.get("sub")
    except Exception:
        return None


@router.websocket("/ws/notifications")
async def ws_notifications(
    websocket: WebSocket,
    token: str = Query(default=""),
):
    """
    Authenticated WebSocket for real-time events.

    Events the server sends:
      {"type": "pipeline_update", "report_id": "...", "step": "transcribing|filling|generating|done"}
      {"type": "notification",    "title": "...", "body": "...", "data": {...}}
      {"type": "ping"}

    Client should send {"type": "pong"} every 30 s to keep alive.
    """
    user_id = await _get_user_id(token)
    if not user_id:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return

    await manager.connect(websocket, user_id)
    try:
        # Confirm connection
        await websocket.send_json({"type": "connected", "user_id": user_id})

        while True:
            data = await websocket.receive_json()
            if data.get("type") == "pong":
                pass  # keepalive acknowledged
    except WebSocketDisconnect:
        pass
    finally:
        manager.disconnect(websocket, user_id)
