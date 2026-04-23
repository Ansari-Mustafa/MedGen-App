"""Transcripts router — list, detail, and signed URL to the source audio."""
import uuid
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from backend.auth import get_doctor_id, require_staff
from backend.database import get_db
from backend.models.appointment import Appointment
from backend.models.patient import Patient
from backend.models.recording import Recording
from backend.models.transcript import Transcript
from backend.schemas.transcript import TranscriptListItem, TranscriptOut
from backend.services import storage as store_svc

router = APIRouter(prefix="/transcripts", tags=["transcripts"])

_SNIPPET_LEN = 180


def _snippet(text: Optional[str]) -> Optional[str]:
    if not text:
        return None
    cleaned = text.strip().replace("\n", " ")
    if len(cleaned) <= _SNIPPET_LEN:
        return cleaned
    return cleaned[:_SNIPPET_LEN].rstrip() + "…"


async def _load_owned(
    db: AsyncSession, transcript_id: uuid.UUID, doctor_id: str
) -> tuple[Transcript, Recording, Appointment, Optional[Patient]]:
    result = await db.execute(
        select(Transcript, Recording, Appointment, Patient)
        .join(Recording, Transcript.recording_id == Recording.id)
        .join(Appointment, Recording.appointment_id == Appointment.id)
        .outerjoin(Patient, Appointment.patient_id == Patient.id)
        .where(Transcript.id == transcript_id, Appointment.doctor_id == doctor_id)
    )
    row = result.first()
    if not row:
        raise HTTPException(status_code=404, detail="Transcript not found")
    return row  # type: ignore[return-value]


@router.get("", response_model=list[TranscriptListItem])
async def list_transcripts(
    limit: int = Query(default=50, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
    patient_id: Optional[uuid.UUID] = Query(default=None),
    profile=Depends(require_staff),
    db: AsyncSession = Depends(get_db),
):
    doctor_id = get_doctor_id(profile)
    stmt = (
        select(Transcript, Recording, Appointment, Patient)
        .join(Recording, Transcript.recording_id == Recording.id)
        .join(Appointment, Recording.appointment_id == Appointment.id)
        .outerjoin(Patient, Appointment.patient_id == Patient.id)
        .where(Appointment.doctor_id == doctor_id)
        .order_by(Transcript.created_at.desc())
        .limit(limit)
        .offset(offset)
    )
    if patient_id is not None:
        stmt = stmt.where(Appointment.patient_id == patient_id)

    rows = (await db.execute(stmt)).all()
    return [
        TranscriptListItem(
            id=t.id,
            recording_id=r.id,
            appointment_id=a.id,
            patient_name=p.full_name if p else None,
            appointment_scheduled_at=a.scheduled_at,
            provider=t.provider,
            duration_s=r.duration_s,
            snippet=_snippet(t.paragraphs_text or t.utterances_text),
            created_at=t.created_at,
        )
        for (t, r, a, p) in rows
    ]


@router.get("/{transcript_id}", response_model=TranscriptOut)
async def get_transcript(
    transcript_id: uuid.UUID,
    include_audio_url: bool = Query(default=False),
    profile=Depends(require_staff),
    db: AsyncSession = Depends(get_db),
):
    doctor_id = get_doctor_id(profile)
    t, r, a, p = await _load_owned(db, transcript_id, doctor_id)

    audio_url: Optional[str] = None
    if include_audio_url and r.storage_path:
        try:
            audio_url = await store_svc.get_signed_url(
                store_svc.BUCKET_AUDIO, r.storage_path, expires_in=3600
            )
        except Exception:
            audio_url = None

    return TranscriptOut(
        id=t.id,
        recording_id=r.id,
        appointment_id=a.id,
        patient_name=p.full_name if p else None,
        appointment_scheduled_at=a.scheduled_at,
        provider=t.provider,
        paragraphs_text=t.paragraphs_text,
        utterances_text=t.utterances_text,
        duration_s=r.duration_s,
        audio_url=audio_url,
        created_at=t.created_at,
    )


@router.get("/{transcript_id}/audio-url")
async def get_transcript_audio_url(
    transcript_id: uuid.UUID,
    profile=Depends(require_staff),
    db: AsyncSession = Depends(get_db),
):
    doctor_id = get_doctor_id(profile)
    t, r, a, p = await _load_owned(db, transcript_id, doctor_id)

    if not r.storage_path:
        raise HTTPException(status_code=404, detail="Audio file not available")

    expires_in = 3600
    url = await store_svc.get_signed_url(
        store_svc.BUCKET_AUDIO, r.storage_path, expires_in=expires_in
    )
    return {"url": url, "expires_in": expires_in}
