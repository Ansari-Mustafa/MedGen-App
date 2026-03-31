"""Recordings router — upload endpoint stub. Full pipeline in Phase 2."""
import uuid
from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from backend.database import get_db
from backend.auth import require_staff, get_doctor_id
from backend.models.recording import Recording
from backend.models.appointment import Appointment
from backend.schemas.recording import RecordingOut

router = APIRouter(prefix="/recordings", tags=["recordings"])


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
    Upload an audio file. Creates a Recording row and enqueues the pipeline.
    Returns job_id for SSE tracking.
    Full ARQ enqueue implemented in Phase 2.
    """
    doctor_id = get_doctor_id(profile)

    # Verify appointment belongs to this doctor
    result = await db.execute(
        select(Appointment).where(Appointment.id == appointment_id, Appointment.doctor_id == doctor_id)
    )
    if not result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Appointment not found")

    recording = Recording(
        appointment_id=appointment_id,
        duration_s=duration_s,
        file_size=file.size,
        status="pending",
        source=source,
    )
    db.add(recording)
    await db.flush()

    # TODO Phase 2: save file to Supabase Storage, enqueue ARQ pipeline task
    job_id = str(recording.id)

    return {"recording_id": str(recording.id), "job_id": job_id, "status": "queued"}


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
