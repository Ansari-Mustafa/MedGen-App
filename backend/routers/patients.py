import uuid
from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete

from backend.database import get_db
from backend.auth import require_staff, get_doctor_id
from backend.models.patient import Patient
from backend.models.audit_log import AuditLog
from backend.schemas.patient import PatientCreate, PatientUpdate, PatientOut

router = APIRouter(prefix="/patients", tags=["patients"])


async def _log(db: AsyncSession, profile, action: str, resource_id: str, diff: dict | None = None, request: Request = None):
    log = AuditLog(
        actor_id=profile.id,
        actor_role=profile.role,
        action=action,
        resource_type="patient",
        resource_id=resource_id,
        diff=diff,
        ip_address=request.client.host if request else None,
    )
    db.add(log)


@router.get("", response_model=list[PatientOut])
async def list_patients(
    profile=Depends(require_staff),
    db: AsyncSession = Depends(get_db),
):
    doctor_id = get_doctor_id(profile)
    result = await db.execute(
        select(Patient).where(Patient.doctor_id == doctor_id).order_by(Patient.full_name)
    )
    return result.scalars().all()


@router.post("", response_model=PatientOut, status_code=status.HTTP_201_CREATED)
async def create_patient(
    body: PatientCreate,
    request: Request,
    profile=Depends(require_staff),
    db: AsyncSession = Depends(get_db),
):
    doctor_id = get_doctor_id(profile)
    patient = Patient(doctor_id=doctor_id, **body.model_dump())
    db.add(patient)
    await db.flush()
    await _log(db, profile, "create", str(patient.id), body.model_dump(), request)
    return patient


@router.get("/{patient_id}", response_model=PatientOut)
async def get_patient(
    patient_id: uuid.UUID,
    profile=Depends(require_staff),
    db: AsyncSession = Depends(get_db),
):
    doctor_id = get_doctor_id(profile)
    result = await db.execute(
        select(Patient).where(Patient.id == patient_id, Patient.doctor_id == doctor_id)
    )
    patient = result.scalar_one_or_none()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    return patient


@router.patch("/{patient_id}", response_model=PatientOut)
async def update_patient(
    patient_id: uuid.UUID,
    body: PatientUpdate,
    request: Request,
    profile=Depends(require_staff),
    db: AsyncSession = Depends(get_db),
):
    doctor_id = get_doctor_id(profile)
    result = await db.execute(
        select(Patient).where(Patient.id == patient_id, Patient.doctor_id == doctor_id)
    )
    patient = result.scalar_one_or_none()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    changes = body.model_dump(exclude_unset=True)
    for key, val in changes.items():
        setattr(patient, key, val)
    await _log(db, profile, "update", str(patient_id), changes, request)
    return patient


@router.delete("/{patient_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_patient(
    patient_id: uuid.UUID,
    request: Request,
    profile=Depends(require_staff),
    db: AsyncSession = Depends(get_db),
):
    doctor_id = get_doctor_id(profile)
    result = await db.execute(
        select(Patient).where(Patient.id == patient_id, Patient.doctor_id == doctor_id)
    )
    patient = result.scalar_one_or_none()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    await db.delete(patient)
    await _log(db, profile, "delete", str(patient_id), None, request)
