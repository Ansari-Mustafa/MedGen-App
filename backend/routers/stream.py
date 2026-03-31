"""
SSE stream for pipeline job status.
Subscribes to Redis channel `pipeline:{job_id}` and forwards events to the client.
"""
import asyncio
import uuid

import redis.asyncio as aioredis
from fastapi import APIRouter, Depends, Query
from fastapi.responses import StreamingResponse

from backend.auth import _decode_token
from backend.config import get_settings

router = APIRouter(prefix="/jobs", tags=["stream"])


@router.get("/{job_id}/stream")
async def stream_job(
    job_id: uuid.UUID,
    token: str = Query(default=""),
):
    """
    Server-Sent Events stream for pipeline progress.
    Authenticates via ?token= query param (same as WebSocket).

    Events:
      data: {"step": "transcribe|fill|generate|done|error", "status": "running|done|error", "report_id": "..."}
    """
    # Verify token
    try:
        _decode_token(token)
    except Exception:
        async def denied():
            yield "data: {\"error\": \"unauthorized\"}\n\n"
        return StreamingResponse(denied(), media_type="text/event-stream")

    settings = get_settings()
    channel = f"pipeline:{job_id}"

    async def event_generator():
        r = aioredis.from_url(settings.redis_url, decode_responses=True)
        ps = r.pubsub()
        await ps.subscribe(channel)

        # Send initial connected event
        yield f"data: {{\"step\": \"connected\", \"job_id\": \"{job_id}\"}}\n\n"

        try:
            async for message in ps.listen():
                if message["type"] == "message":
                    yield f"data: {message['data']}\n\n"
                    # Stop streaming once the pipeline is done or errored
                    import json
                    try:
                        payload = json.loads(message["data"])
                        if payload.get("step") in ("done", "error"):
                            break
                    except Exception:
                        pass
        finally:
            await ps.unsubscribe(channel)
            await r.aclose()

    return StreamingResponse(event_generator(), media_type="text/event-stream")
