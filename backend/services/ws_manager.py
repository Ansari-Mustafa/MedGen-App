"""
In-process WebSocket connection manager.
Maps user_id → list of active WebSocket connections.

For single-process uvicorn (dev). For multi-worker production,
replace broadcast() with a Redis pub/sub fan-out.
"""
import asyncio
from fastapi import WebSocket


class ConnectionManager:
    def __init__(self):
        self._connections: dict[str, list[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, user_id: str):
        await websocket.accept()
        self._connections.setdefault(user_id, []).append(websocket)

    def disconnect(self, websocket: WebSocket, user_id: str):
        conns = self._connections.get(user_id, [])
        if websocket in conns:
            conns.remove(websocket)
        if not conns:
            self._connections.pop(user_id, None)

    async def send_to_user(self, user_id: str, data: dict):
        dead = []
        for ws in self._connections.get(user_id, []):
            try:
                await ws.send_json(data)
            except Exception:
                dead.append(ws)
        for ws in dead:
            self.disconnect(ws, user_id)

    async def broadcast(self, data: dict):
        """Send to all connected users."""
        coros = [
            self.send_to_user(uid, data)
            for uid in list(self._connections)
        ]
        if coros:
            await asyncio.gather(*coros, return_exceptions=True)


# Singleton — imported by routers and tasks
manager = ConnectionManager()
