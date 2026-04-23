"""
ARQ task: extract a reusable DOCX template from a doctor's past reports.

Stages, each published on Redis channel `onboarding:{job_id}` plus WebSocket
via ws_manager.send_to_user:
    1. upload      — acknowledge receipt (files are already in Supabase)
    2. extract     — flatten each .docx, compute format_score
    3. architect   — Claude call identifies dynamic spans and writing style
    4. transform   — rewrite chosen .docx with Jinja placeholders
    5. finalize    — upload transformed .docx, update Template + job rows
    6. done        — push notification
"""
import json
import os
import tempfile
import uuid
from datetime import datetime, timezone

import redis.asyncio as aioredis
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.services import push as push_svc
from backend.services import storage as store_svc
from backend.services import template_extract as extract_svc
from backend.services.ws_manager import manager as ws_manager


_STEP_PROGRESS = {
    "upload": 10,
    "extract": 30,
    "architect": 55,
    "transform": 80,
    "finalize": 95,
    "done": 100,
    "error": 0,
}


async def _publish(redis: aioredis.Redis, job_id: str, payload: dict):
    channel = f"onboarding:{job_id}"
    await redis.publish(channel, json.dumps(payload))


async def _update_job(
    db: AsyncSession,
    job_id: str,
    *,
    step: str | None = None,
    status: str | None = None,
    error: str | None = None,
):
    from backend.models.template_onboarding_job import TemplateOnboardingJob

    job = await db.get(TemplateOnboardingJob, uuid.UUID(job_id))
    if not job:
        return
    if step is not None:
        job.step = step
    if status is not None:
        job.status = status
        if status == "running" and job.started_at is None:
            job.started_at = datetime.now(timezone.utc)
        if status in ("done", "error"):
            job.finished_at = datetime.now(timezone.utc)
    if error is not None:
        job.error = error
    await db.commit()


async def onboard_template(
    ctx,
    *,
    job_id: str,
    template_id: str,
    doctor_user_id: str,
    source_paths: list[str],
    template_name: str,
):
    db_factory = ctx["db_factory"]
    redis: aioredis.Redis = ctx["redis"]

    async def publish(step: str, status: str, extra: dict | None = None):
        payload = {
            "step": step,
            "status": status,
            "job_id": job_id,
            "template_id": template_id,
            "progress": _STEP_PROGRESS.get(step, 0),
            **(extra or {}),
        }
        await _publish(redis, job_id, payload)
        await ws_manager.send_to_user(
            doctor_user_id, {"type": "template_onboarding", **payload}
        )

    async with db_factory() as db:
        from backend.models.template import Template
        from backend.models.notification import Notification
        from backend.models.profile import Profile

        try:
            await _update_job(db, job_id, status="running", step="upload")
            await publish("upload", "done")

            # ── Step 1: extract paragraphs from every uploaded report ───────
            await _update_job(db, job_id, step="extract")
            await publish("extract", "running", {"message": "Reading uploaded reports…"})

            report_blobs: list[bytes] = []
            report_descriptors: list[dict] = []
            for i, path in enumerate(source_paths, start=1):
                data = await store_svc.download_bytes(store_svc.BUCKET_TEMPLATES, path)
                report_blobs.append(data)
                paragraphs = extract_svc.extract_paragraphs(data)
                report_descriptors.append(
                    {
                        "index": i,
                        "filename": path.rsplit("/", 1)[-1],
                        "paragraphs": paragraphs,
                        "format_score": extract_svc.format_score(paragraphs),
                    }
                )
            await publish("extract", "done", {"message": f"Parsed {len(report_blobs)} reports"})

            # ── Step 2: Claude Architect call ───────────────────────────────
            await _update_job(db, job_id, step="architect")
            await publish(
                "architect", "running", {"message": "Identifying template structure with AI…"}
            )

            architect = await extract_svc.analyze_reports(report_descriptors)
            chosen_idx = int(architect.get("chosen_report_index") or 1)
            chosen_idx = max(1, min(chosen_idx, len(report_blobs)))
            replacements = architect.get("replacements", []) or []
            if not replacements:
                raise RuntimeError("Architect returned no replacements")

            await publish(
                "architect",
                "done",
                {
                    "message": f"Identified {len(replacements)} dynamic fields",
                    "chosen_report_index": chosen_idx,
                },
            )

            # ── Step 3: DOCX transformation ────────────────────────────────
            await _update_job(db, job_id, step="transform")
            await publish("transform", "running", {"message": "Building template document…"})

            chosen_bytes = report_blobs[chosen_idx - 1]
            transformed = await extract_svc.transform_docx(chosen_bytes, replacements)

            await publish("transform", "done")

            # ── Step 4: upload final template + persist ─────────────────────
            await _update_job(db, job_id, step="finalize")
            await publish("finalize", "running", {"message": "Saving template…"})

            final_path = f"{doctor_user_id}/{template_id}.docx"
            await store_svc.upload_bytes(
                store_svc.BUCKET_TEMPLATES,
                final_path,
                transformed,
                "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            )

            template = await db.get(Template, uuid.UUID(template_id))
            if not template:
                raise RuntimeError(f"Template {template_id} disappeared mid-job")

            template.docx_storage_path = final_path
            template.placeholders = extract_svc.placeholders_to_schema(replacements)
            template.doctor_profile = {
                "writing_style": architect.get("writing_style", {}),
                "doctor_profile": architect.get("doctor_profile", {}),
            }
            template.is_active = True
            template.onboarding_status = "ready"
            template.onboarding_error = None

            # If this is the doctor's only template, mark it as default.
            existing_default = await db.execute(
                select(func.count(Template.id)).where(
                    Template.doctor_id == uuid.UUID(doctor_user_id),
                    Template.is_default.is_(True),
                    Template.id != template.id,
                )
            )
            if existing_default.scalar_one() == 0:
                template.is_default = True

            await db.commit()

            await _update_job(db, job_id, status="done", step="finalize")
            await publish("finalize", "done")
            await publish("done", "done", {"message": "Template ready"})

            # Notification + push
            db.add(
                Notification(
                    user_id=uuid.UUID(doctor_user_id),
                    type="template_ready",
                    title="Template ready",
                    body=f'"{template_name}" is ready to use.',
                    data={"template_id": template_id, "job_id": job_id},
                )
            )
            await db.commit()

            doctor = await db.get(Profile, uuid.UUID(doctor_user_id))
            if doctor and doctor.expo_push_token:
                await push_svc.send_push(
                    doctor.expo_push_token,
                    title="Template ready",
                    body=f'"{template_name}" is ready to use.',
                    data={"template_id": template_id, "type": "template_ready"},
                )

        except Exception as exc:
            message = str(exc) or "Template onboarding failed"
            try:
                template = await db.get(Template, uuid.UUID(template_id))
                if template:
                    template.onboarding_status = "error"
                    template.onboarding_error = message
                    await db.commit()
            except Exception:
                pass
            await _update_job(db, job_id, status="error", error=message)
            await publish("error", "error", {"message": message})
            raise
