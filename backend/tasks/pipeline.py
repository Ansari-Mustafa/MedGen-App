"""
ARQ pipeline task: audio → transcribe → fill → generate DOCX.

Publishes step events to Redis channel `pipeline:{report_id}` for SSE.
Also broadcasts directly to WebSocket connected clients.
"""
import json
import uuid
from datetime import datetime, timezone

import redis.asyncio as aioredis
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.config import get_settings
from backend.services import transcription as stt_svc
from backend.services import report_fill as fill_svc
from backend.services import report_generate as gen_svc
from backend.services import storage as store_svc
from backend.services import push as push_svc
from backend.services.ws_manager import manager as ws_manager


async def _publish(redis, report_id: str, event: dict):
    """Publish a step event to Redis channel and WebSocket manager."""
    channel = f"pipeline:{report_id}"
    await redis.publish(channel, json.dumps(event))


async def _update_job(db: AsyncSession, report_id: str, step: str, status: str, error: str | None = None):
    from backend.models.processing_job import ProcessingJob
    result = await db.execute(
        select(ProcessingJob).where(
            ProcessingJob.report_id == report_id,
            ProcessingJob.step == step,
        )
    )
    job = result.scalar_one_or_none()
    if job:
        job.status = status
        job.error = error
        if status == "running":
            job.started_at = datetime.now(timezone.utc)
        elif status in ("done", "error"):
            job.finished_at = datetime.now(timezone.utc)
        await db.commit()


async def run_pipeline(ctx, *, recording_id: str, report_id: str, template_id: str, doctor_user_id: str):
    """
    Full pipeline: audio → transcript → fill placeholders → render DOCX.
    Called by ARQ worker. ctx contains 'redis' and 'db_factory'.
    """
    settings = get_settings()
    db_factory = ctx["db_factory"]
    redis: aioredis.Redis = ctx["redis"]

    async def publish(step: str, status: str, extra: dict | None = None):
        event = {"step": step, "status": status, "report_id": report_id, **(extra or {})}
        await _publish(redis, report_id, event)
        await ws_manager.send_to_user(doctor_user_id, {"type": "pipeline_update", **event})

    async with db_factory() as db:
        from backend.models.recording import Recording
        from backend.models.transcript import Transcript
        from backend.models.report import Report
        from backend.models.template import Template
        from backend.models.profile import Profile

        try:
            # ── Step 1: Transcribe ────────────────────────────────
            await publish("transcribe", "running")
            await _update_job(db, report_id, "transcribe", "running")

            # Download audio from Storage
            recording = await db.get(Recording, uuid.UUID(recording_id))
            audio_bytes = await store_svc.download_bytes(store_svc.BUCKET_AUDIO, recording.storage_path)

            # Transcribe
            result = await stt_svc.transcribe_bytes(
                audio_bytes,
                filename=recording.storage_path.split("/")[-1],
            )

            # Save transcript
            transcript = Transcript(
                recording_id=uuid.UUID(recording_id),
                provider=settings.stt_provider,
                raw_json=result["raw_json"],
                paragraphs_text=result["paragraphs_text"],
                utterances_text=result["utterances_text"],
            )
            db.add(transcript)
            await db.commit()
            await _update_job(db, report_id, "transcribe", "done")
            await publish("transcribe", "done")

            # ── Step 2: Fill placeholders ─────────────────────────
            await publish("fill", "running")
            await _update_job(db, report_id, "fill", "running")

            # Get template + extract placeholders
            template = await db.get(Template, uuid.UUID(template_id))
            template_bytes = await store_svc.download_bytes(store_svc.BUCKET_TEMPLATES, template.docx_storage_path)

            # Extract placeholders from the DOCX bytes
            import tempfile, os
            fd, tpl_tmp = tempfile.mkstemp(suffix=".docx")
            os.close(fd)
            try:
                with open(tpl_tmp, "wb") as f:
                    f.write(template_bytes)
                from extras.scripts.extract_placeholders import extract_placeholders
                placeholders = extract_placeholders(tpl_tmp)
            finally:
                os.unlink(tpl_tmp)

            # Fill with Claude. Response shape: {filled: {...}, unfilled: [...]}
            fill_response = await fill_svc.fill_placeholders(placeholders, result["paragraphs_text"])
            if isinstance(fill_response, dict) and "filled" in fill_response:
                filled_data = fill_response.get("filled") or {}
                unfilled_data = fill_response.get("unfilled") or []
            else:
                # Defensive: if a future fill service returns the flat map directly.
                filled_data = fill_response or {}
                unfilled_data = []

            # Update report with the flat placeholder→value map.
            report = await db.get(Report, uuid.UUID(report_id))
            report.filled_json = filled_data
            if unfilled_data:
                report.edits_json = {"__unfilled__": unfilled_data}
            await db.commit()
            await _update_job(db, report_id, "fill", "done")
            await publish("fill", "done")

            # ── Step 3: Generate DOCX ─────────────────────────────
            await publish("generate", "running")
            await _update_job(db, report_id, "generate", "running")

            docx_bytes = await gen_svc.generate_report(template_bytes, filled_data, keep_unfilled=True)

            # Upload DOCX to Storage
            docx_path = f"{report_id}/report.docx"
            await store_svc.upload_bytes(store_svc.BUCKET_REPORTS, docx_path, docx_bytes,
                                          "application/vnd.openxmlformats-officedocument.wordprocessingml.document")

            report.docx_path = docx_path
            report.status = "ready"
            await db.commit()
            await _update_job(db, report_id, "generate", "done")
            await publish("generate", "done", {"report_id": report_id})

            # ── Done: notify doctor ───────────────────────────────
            await publish("done", "done", {"report_id": report_id})

            # Save notification row
            from backend.models.notification import Notification
            notif = Notification(
                user_id=uuid.UUID(doctor_user_id),
                type="report_ready",
                title="Report ready for review",
                body="Your medical report has been generated and is ready for review.",
                data={"report_id": report_id},
            )
            db.add(notif)
            await db.commit()

            # Expo push notification
            doctor = await db.get(Profile, uuid.UUID(doctor_user_id))
            if doctor and doctor.expo_push_token:
                await push_svc.send_push(
                    doctor.expo_push_token,
                    title="Report ready",
                    body="Your medical report is ready for review.",
                    data={"report_id": report_id, "type": "report_ready"},
                )

        except Exception as exc:
            # Mark current step as failed
            report = await db.get(Report, uuid.UUID(report_id))
            if report:
                report.status = "error"
                await db.commit()
            await publish("error", "error", {"message": str(exc)})
            raise
