"""Templates router — full CRUD + AI onboarding pipeline."""
import asyncio
import json
import uuid
from datetime import datetime, timezone
from typing import Optional

import redis.asyncio as aioredis
from fastapi import APIRouter, Depends, File, Form, HTTPException, Query, UploadFile
from fastapi.responses import JSONResponse, StreamingResponse
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.auth import _decode_token, get_doctor_id, require_doctor
from backend.config import get_settings
from backend.database import get_db
from backend.models.report import Report
from backend.models.template import Template
from backend.models.template_onboarding_job import TemplateOnboardingJob
from backend.schemas.template import (
    OnboardingJobOut,
    TemplateOnboardResponse,
    TemplateOut,
    TemplateUpdate,
)
from backend.services import storage as store_svc

router = APIRouter(prefix="/templates", tags=["templates"])

_MAX_ONBOARD_FILES = 5
_MIN_ONBOARD_FILES = 2
_MAX_FILE_BYTES = 10 * 1024 * 1024  # 10 MB
_DOCX_CONTENT_TYPE = (
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
)


# ── Helpers ─────────────────────────────────────────────────────────────────


async def _load_owned(db: AsyncSession, template_id: uuid.UUID, doctor_id: str) -> Template:
    result = await db.execute(
        select(Template).where(
            Template.id == template_id,
            Template.doctor_id == doctor_id,
        )
    )
    template = result.scalar_one_or_none()
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")
    return template


# ── List / Get ──────────────────────────────────────────────────────────────


@router.get("", response_model=list[TemplateOut])
async def list_templates(
    profile=Depends(require_doctor),
    db: AsyncSession = Depends(get_db),
):
    doctor_id = get_doctor_id(profile)
    result = await db.execute(
        select(Template)
        .where(Template.doctor_id == doctor_id)
        .order_by(Template.is_default.desc(), Template.name)
    )
    return result.scalars().all()


@router.get("/{template_id}", response_model=TemplateOut)
async def get_template(
    template_id: uuid.UUID,
    profile=Depends(require_doctor),
    db: AsyncSession = Depends(get_db),
):
    doctor_id = get_doctor_id(profile)
    return await _load_owned(db, template_id, doctor_id)


@router.get("/{template_id}/download")
async def download_template(
    template_id: uuid.UUID,
    profile=Depends(require_doctor),
    db: AsyncSession = Depends(get_db),
):
    """Signed URL (valid 60 min) for the onboarded .docx template."""
    doctor_id = get_doctor_id(profile)
    template = await _load_owned(db, template_id, doctor_id)
    if not template.docx_storage_path:
        raise HTTPException(status_code=404, detail="Template document not yet generated")
    url = await store_svc.get_signed_url(
        store_svc.BUCKET_TEMPLATES, template.docx_storage_path, expires_in=3600
    )
    return JSONResponse({"url": url, "format": "docx"})


# ── Update (rename + active toggle) ─────────────────────────────────────────


@router.patch("/{template_id}", response_model=TemplateOut)
async def update_template(
    template_id: uuid.UUID,
    body: TemplateUpdate,
    profile=Depends(require_doctor),
    db: AsyncSession = Depends(get_db),
):
    doctor_id = get_doctor_id(profile)
    template = await _load_owned(db, template_id, doctor_id)

    if body.name is not None:
        name = body.name.strip()
        if not name:
            raise HTTPException(status_code=400, detail="Name cannot be empty")
        template.name = name

    if body.is_active is not None:
        template.is_active = body.is_active
        if not body.is_active and template.is_default:
            template.is_default = False

    await db.commit()
    await db.refresh(template)
    return template


# ── Set default ────────────────────────────────────────────────────────────


@router.post("/{template_id}/set-default", response_model=TemplateOut)
async def set_default_template(
    template_id: uuid.UUID,
    profile=Depends(require_doctor),
    db: AsyncSession = Depends(get_db),
):
    doctor_id = get_doctor_id(profile)
    template = await _load_owned(db, template_id, doctor_id)

    if not template.is_active:
        raise HTTPException(status_code=400, detail="Cannot set an inactive template as default")

    # Clear any existing default then set the new one in the same transaction.
    await db.execute(
        Template.__table__.update()
        .where(Template.doctor_id == doctor_id, Template.is_default.is_(True))
        .values(is_default=False)
    )
    template.is_default = True
    await db.commit()
    await db.refresh(template)
    return template


# ── Delete ─────────────────────────────────────────────────────────────────


@router.delete("/{template_id}", status_code=204)
async def delete_template(
    template_id: uuid.UUID,
    profile=Depends(require_doctor),
    db: AsyncSession = Depends(get_db),
):
    doctor_id = get_doctor_id(profile)
    template = await _load_owned(db, template_id, doctor_id)

    # Refuse if any reports reference it.
    in_use = await db.execute(
        select(func.count(Report.id)).where(Report.template_id == template_id)
    )
    if in_use.scalar_one() > 0:
        raise HTTPException(
            status_code=409,
            detail="Template is referenced by existing reports and cannot be deleted",
        )

    # Best-effort cleanup of Supabase Storage assets; do not fail the delete if it errors.
    if template.docx_storage_path:
        try:
            await store_svc.delete_file(
                store_svc.BUCKET_TEMPLATES, template.docx_storage_path
            )
        except Exception:
            pass

    await db.delete(template)
    await db.commit()
    return None


# ── Onboarding ─────────────────────────────────────────────────────────────


@router.post("/onboard", response_model=TemplateOnboardResponse, status_code=202)
async def onboard_template(
    name: str = Form(...),
    files: list[UploadFile] = File(...),
    profile=Depends(require_doctor),
    db: AsyncSession = Depends(get_db),
):
    """
    Upload 2–5 past .docx reports. Creates a draft Template + OnboardingJob
    and enqueues the `onboard_template` ARQ task. Returns IDs; subscribe to
    /templates/onboard/{job_id}/stream for progress events.
    """
    doctor_id = get_doctor_id(profile)

    name = (name or "").strip()
    if not name:
        raise HTTPException(status_code=400, detail="Template name is required")

    if not files or len(files) < _MIN_ONBOARD_FILES or len(files) > _MAX_ONBOARD_FILES:
        raise HTTPException(
            status_code=400,
            detail=f"Upload {_MIN_ONBOARD_FILES}–{_MAX_ONBOARD_FILES} past reports",
        )

    # Create draft template + job first so we have stable IDs for the storage path.
    template = Template(
        doctor_id=uuid.UUID(doctor_id),
        name=name,
        placeholders={},
        doctor_profile={},
        is_active=False,
        is_default=False,
        onboarding_status="pending",
    )
    db.add(template)
    await db.flush()

    job = TemplateOnboardingJob(
        template_id=template.id,
        doctor_id=uuid.UUID(doctor_id),
        status="pending",
        source_report_paths=[],
    )
    db.add(job)
    await db.flush()

    source_paths: list[str] = []
    for idx, uf in enumerate(files):
        filename = uf.filename or f"report_{idx + 1}.docx"
        if not filename.lower().endswith(".docx"):
            raise HTTPException(
                status_code=400, detail=f"{filename}: only .docx files are supported"
            )
        data = await uf.read()
        if len(data) == 0:
            raise HTTPException(status_code=400, detail=f"{filename}: empty file")
        if len(data) > _MAX_FILE_BYTES:
            raise HTTPException(
                status_code=400, detail=f"{filename}: file exceeds 10MB limit"
            )
        safe_name = filename.replace("/", "_").replace("\\", "_")
        path = f"onboarding/{doctor_id}/{job.id}/{idx + 1}_{safe_name}"
        await store_svc.upload_bytes(
            store_svc.BUCKET_TEMPLATES, path, data, _DOCX_CONTENT_TYPE
        )
        source_paths.append(path)

    job.source_report_paths = source_paths
    template.source_report_paths = source_paths
    await db.commit()

    # Enqueue ARQ task
    from arq import create_pool
    from arq.connections import RedisSettings

    settings = get_settings()
    pool = await create_pool(RedisSettings.from_dsn(settings.redis_url))
    await pool.enqueue_job(
        "onboard_template",
        job_id=str(job.id),
        template_id=str(template.id),
        doctor_user_id=doctor_id,
        source_paths=source_paths,
        template_name=name,
    )
    await pool.aclose()

    return TemplateOnboardResponse(
        template_id=template.id, job_id=job.id, status="queued"
    )


@router.get("/onboard/{job_id}", response_model=OnboardingJobOut)
async def get_onboarding_job(
    job_id: uuid.UUID,
    profile=Depends(require_doctor),
    db: AsyncSession = Depends(get_db),
):
    doctor_id = get_doctor_id(profile)
    result = await db.execute(
        select(TemplateOnboardingJob).where(
            TemplateOnboardingJob.id == job_id,
            TemplateOnboardingJob.doctor_id == doctor_id,
        )
    )
    job = result.scalar_one_or_none()
    if not job:
        raise HTTPException(status_code=404, detail="Onboarding job not found")
    return job


@router.get("/onboard/{job_id}/stream")
async def stream_onboarding(
    job_id: uuid.UUID,
    token: str = Query(default=""),
):
    """SSE stream for template onboarding progress."""
    try:
        _decode_token(token)
    except Exception:
        async def denied():
            yield "data: {\"error\": \"unauthorized\"}\n\n"
        return StreamingResponse(denied(), media_type="text/event-stream")

    settings = get_settings()
    channel = f"onboarding:{job_id}"

    async def event_generator():
        r = aioredis.from_url(settings.redis_url, decode_responses=True)
        ps = r.pubsub()
        await ps.subscribe(channel)

        yield f"data: {{\"step\": \"connected\", \"job_id\": \"{job_id}\"}}\n\n"

        try:
            async for message in ps.listen():
                if message["type"] == "message":
                    yield f"data: {message['data']}\n\n"
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
