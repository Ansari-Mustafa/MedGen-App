import uuid
from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from backend.database import get_db
from backend.auth import require_staff, get_doctor_id
from backend.models.appointment import Appointment
from backend.models.patient import Patient
from backend.models.audit_log import AuditLog
from backend.schemas.appointment import AppointmentCreate, AppointmentUpdate, AppointmentOut

router = APIRouter(prefix="/appointments", tags=["appointments"])


async def _log(db, profile, action, resource_id, diff=None, request=None):
    db.add(AuditLog(
        actor_id=profile.id,
        actor_role=profile.role,
        action=action,
        resource_type="appointment",
        resource_id=resource_id,
        diff=diff,
        ip_address=request.client.host if request else None,
    ))


def _serialize(appt: Appointment) -> dict:
    return {
        "id": appt.id,
        "patient_id": appt.patient_id,
        "doctor_id": appt.doctor_id,
        "patient_name": appt.patient.full_name if appt.patient else None,
        "scheduled_at": appt.scheduled_at,
        "status": appt.status,
        "type": appt.type,
        "notes": appt.notes,
        "created_at": appt.created_at,
        "updated_at": appt.updated_at,
    }


@router.get("", response_model=list[AppointmentOut])
async def list_appointments(
    profile=Depends(require_staff),
    db: AsyncSession = Depends(get_db),
):
    doctor_id = get_doctor_id(profile)
    result = await db.execute(
        select(Appointment)
        .options(selectinload(Appointment.patient))
        .where(Appointment.doctor_id == doctor_id)
        .order_by(Appointment.scheduled_at.desc().nullslast())
    )
    return [_serialize(a) for a in result.scalars().all()]


@router.post("", response_model=AppointmentOut, status_code=status.HTTP_201_CREATED)
async def create_appointment(
    body: AppointmentCreate,
    request: Request,
    profile=Depends(require_staff),
    db: AsyncSession = Depends(get_db),
):
    doctor_id = get_doctor_id(profile)

    result = await db.execute(
        select(Patient).where(Patient.id == body.patient_id, Patient.doctor_id == doctor_id)
    )
    patient = result.scalar_one_or_none()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    appt = Appointment(doctor_id=doctor_id, **body.model_dump())
    db.add(appt)
    await db.flush()
    await _log(db, profile, "create", str(appt.id), {k: str(v) for k, v in body.model_dump().items()}, request)
    appt.patient = patient
    return _serialize(appt)


@router.get("/{appt_id}", response_model=AppointmentOut)
async def get_appointment(
    appt_id: uuid.UUID,
    profile=Depends(require_staff),
    db: AsyncSession = Depends(get_db),
):
    doctor_id = get_doctor_id(profile)
    result = await db.execute(
        select(Appointment)
        .options(selectinload(Appointment.patient))
        .where(Appointment.id == appt_id, Appointment.doctor_id == doctor_id)
    )
    appt = result.scalar_one_or_none()
    if not appt:
        raise HTTPException(status_code=404, detail="Appointment not found")
    return _serialize(appt)


@router.patch("/{appt_id}", response_model=AppointmentOut)
async def update_appointment(
    appt_id: uuid.UUID,
    body: AppointmentUpdate,
    request: Request,
    profile=Depends(require_staff),
    db: AsyncSession = Depends(get_db),
):
    doctor_id = get_doctor_id(profile)
    result = await db.execute(
        select(Appointment)
        .options(selectinload(Appointment.patient))
        .where(Appointment.id == appt_id, Appointment.doctor_id == doctor_id)
    )
    appt = result.scalar_one_or_none()
    if not appt:
        raise HTTPException(status_code=404, detail="Appointment not found")

    changes = body.model_dump(exclude_unset=True)
    for key, val in changes.items():
        setattr(appt, key, val)
    await _log(db, profile, "update", str(appt_id), {k: str(v) for k, v in changes.items()}, request)
    return _serialize(appt)


@router.delete("/{appt_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_appointment(
    appt_id: uuid.UUID,
    request: Request,
    profile=Depends(require_staff),
    db: AsyncSession = Depends(get_db),
):
    doctor_id = get_doctor_id(profile)
    result = await db.execute(
        select(Appointment).where(Appointment.id == appt_id, Appointment.doctor_id == doctor_id)
    )
    appt = result.scalar_one_or_none()
    if not appt:
        raise HTTPException(status_code=404, detail="Appointment not found")

    await db.delete(appt)
    await _log(db, profile, "delete", str(appt_id), None, request)
