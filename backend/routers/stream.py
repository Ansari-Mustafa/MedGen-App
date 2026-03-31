"""SSE stream for pipeline job status. Full implementation in Phase 2."""
import asyncio
import uuid
from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse

from backend.auth import require_staff

router = APIRouter(prefix="/jobs", tags=["stream"])


@router.get("/{job_id}/stream")
async def stream_job(
    job_id: uuid.UUID,
    profile=Depends(require_staff),
):
    """
    Server-Sent Events stream for a pipeline job.
    Phase 2: connects to Redis pub/sub channel keyed by job_id.
    Phase 1 stub: returns a single 'pending' event.
    """
    async def event_generator():
        yield f"data: {{\"step\": \"pending\", \"job_id\": \"{job_id}\"}}\n\n"
        # Phase 2: subscribe to Redis channel and stream updates
        await asyncio.sleep(0)

    return StreamingResponse(event_generator(), media_type="text/event-stream")
