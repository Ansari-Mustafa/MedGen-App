"""Recordings router — full upload → Storage → enqueue pipeline."""
import uuid

from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from backend.database import get_db
from backend.auth import require_staff, get_doctor_id
from backend.models.recording import Recording
from backend.models.report import Report
from backend.models.processing_job import ProcessingJob
from backend.models.appointment import Appointment
from backend.schemas.recording import RecordingOut
from backend.services import storage as store_svc

router = APIRouter(prefix="/recordings", tags=["recordings"])

_ALLOWED_AUDIO_EXTS = {"mp3", "mp4", "wav", "m4a", "webm", "ogg"}


@router.post("/upload", response_model=dict, status_code=202)
async def upload_recording(
    appointment_id: uuid.UUID = Form(...),
    template_id: uuid.UUID = Form(...),
    source: str = Form(default="uploaded"),
    duration_s: int = Form(default=None),
    file: UploadFile = File(...),
    profile=Depends(require_staff),
    db: AsyncSession = Depends(get_db),
):
    """
    Upload an audio file.
    1. Saves to Supabase Storage (audio bucket)
    2. Creates Recording + Report + ProcessingJob rows
    3. Enqueues the ARQ pipeline task
    Returns {recording_id, report_id, job_id} — subscribe to /jobs/{job_id}/stream for SSE.
    """
    doctor_id = get_doctor_id(profile)

    # Verify appointment belongs to this doctor
    result = await db.execute(
        select(Appointment).where(Appointment.id == appointment_id, Appointment.doctor_id == doctor_id)
    )
    if not result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Appointment not found")

    audio_bytes = await file.read()
    file_ext = (file.filename or "audio.mp3").rsplit(".", 1)[-1].lower()
    if file_ext not in _ALLOWED_AUDIO_EXTS:
        file_ext = "mp3"

    # Create Recording row first to get an ID for the storage path
    recording = Recording(
        appointment_id=appointment_id,
        duration_s=duration_s,
        file_size=len(audio_bytes),
        status="processing",
        source=source,
    )
    db.add(recording)
    await db.flush()

    # Upload audio to Supabase Storage
    storage_path = f"{doctor_id}/{recording.id}.{file_ext}"
    await store_svc.upload_bytes(
        store_svc.BUCKET_AUDIO,
        storage_path,
        audio_bytes,
        file.content_type or "audio/mpeg",
    )
    recording.storage_path = storage_path

    # Create Report row
    report = Report(
        appointment_id=appointment_id,
        template_id=template_id,
        status="pending",
    )
    db.add(report)
    await db.flush()

    # Create a ProcessingJob row for each step
    for step in ("transcribe", "fill", "generate"):
        db.add(ProcessingJob(report_id=report.id, step=step, status="pending"))

    await db.commit()

    # Enqueue ARQ pipeline task
    from arq import create_pool
    from arq.connections import RedisSettings
    from backend.config import get_settings

    settings = get_settings()
    pool = await create_pool(RedisSettings.from_dsn(settings.redis_url))
    await pool.enqueue_job(
        "run_pipeline",
        recording_id=str(recording.id),
        report_id=str(report.id),
        template_id=str(template_id),
        doctor_user_id=doctor_id,
    )
    await pool.aclose()

    return {
        "recording_id": str(recording.id),
        "report_id": str(report.id),
        "job_id": str(report.id),  # SSE endpoint keyed on report_id
        "status": "queued",
    }


@router.get("/{recording_id}", response_model=RecordingOut)
async def get_recording(
    recording_id: uuid.UUID,
    profile=Depends(require_staff),
    db: AsyncSession = Depends(get_db),
):
    doctor_id = get_doctor_id(profile)
    result = await db.execute(
        select(Recording)
        .join(Appointment, Recording.appointment_id == Appointment.id)
        .where(Recording.id == recording_id, Appointment.doctor_id == doctor_id)
    )
    recording = result.scalar_one_or_none()
    if not recording:
        raise HTTPException(status_code=404, detail="Recording not found")
    return recording
