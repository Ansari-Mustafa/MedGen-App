"""Reports router."""
import uuid
from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import JSONResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from backend.database import get_db
from backend.auth import require_staff, get_doctor_id
from backend.models.report import Report
from backend.models.appointment import Appointment
from backend.schemas.report import ReportOut, ReportEditSave
from backend.services import storage as store_svc

router = APIRouter(prefix="/reports", tags=["reports"])


def _serialize(report: Report) -> dict:
    appt = report.appointment
    patient_name = appt.patient.full_name if appt and appt.patient else None
    return {
        "id": report.id,
        "appointment_id": report.appointment_id,
        "template_id": report.template_id,
        "patient_name": patient_name,
        "filled_json": report.filled_json or {},
        "docx_path": report.docx_path,
        "pdf_path": report.pdf_path,
        "status": report.status,
        "approved_at": report.approved_at,
        "created_at": report.created_at,
        "updated_at": report.updated_at,
    }


def _report_with_patient():
    return selectinload(Report.appointment).selectinload(Appointment.patient)


@router.get("", response_model=list[ReportOut])
async def list_reports(
    profile=Depends(require_staff),
    db: AsyncSession = Depends(get_db),
):
    doctor_id = get_doctor_id(profile)
    result = await db.execute(
        select(Report)
        .options(_report_with_patient())
        .join(Appointment, Report.appointment_id == Appointment.id)
        .where(Appointment.doctor_id == doctor_id)
        .order_by(Report.created_at.desc())
    )
    return [_serialize(r) for r in result.scalars().all()]


@router.get("/{report_id}", response_model=ReportOut)
async def get_report(
    report_id: uuid.UUID,
    profile=Depends(require_staff),
    db: AsyncSession = Depends(get_db),
):
    doctor_id = get_doctor_id(profile)
    result = await db.execute(
        select(Report)
        .options(_report_with_patient())
        .join(Appointment, Report.appointment_id == Appointment.id)
        .where(Report.id == report_id, Appointment.doctor_id == doctor_id)
    )
    report = result.scalar_one_or_none()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    return _serialize(report)


@router.patch("/{report_id}/fields", response_model=ReportOut)
async def save_edits(
    report_id: uuid.UUID,
    body: ReportEditSave,
    profile=Depends(require_staff),
    db: AsyncSession = Depends(get_db),
):
    """Save in-app field edits."""
    doctor_id = get_doctor_id(profile)
    result = await db.execute(
        select(Report)
        .options(_report_with_patient())
        .join(Appointment, Report.appointment_id == Appointment.id)
        .where(Report.id == report_id, Appointment.doctor_id == doctor_id)
    )
    report = result.scalar_one_or_none()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")

    updated = {**(report.filled_json or {}), **body.fields}
    report.filled_json = updated
    report.edits_json = body.fields
    if report.status == "ready":
        report.status = "edited"
    await db.commit()
    await db.refresh(report)
    return _serialize(report)


@router.post("/{report_id}/approve", response_model=ReportOut)
async def approve_report(
    report_id: uuid.UUID,
    profile=Depends(require_staff),
    db: AsyncSession = Depends(get_db),
):
    """Mark report approved. PDF generation triggered async (Phase 3)."""
    from datetime import datetime, timezone
    doctor_id = get_doctor_id(profile)
    result = await db.execute(
        select(Report)
        .options(_report_with_patient())
        .join(Appointment, Report.appointment_id == Appointment.id)
        .where(Report.id == report_id, Appointment.doctor_id == doctor_id)
    )
    report = result.scalar_one_or_none()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")

    report.status = "approved"
    report.approved_at = datetime.now(timezone.utc)
    await db.commit()
    await db.refresh(report)
    return _serialize(report)


@router.get("/{report_id}/download")
async def download_report(
    report_id: uuid.UUID,
    format: str = Query(default="docx", pattern="^(docx|pdf)$"),
    profile=Depends(require_staff),
    db: AsyncSession = Depends(get_db),
):
    """Return a signed URL (valid 60 min) for DOCX or PDF download."""
    doctor_id = get_doctor_id(profile)
    result = await db.execute(
        select(Report)
        .join(Appointment, Report.appointment_id == Appointment.id)
        .where(Report.id == report_id, Appointment.doctor_id == doctor_id)
    )
    report = result.scalar_one_or_none()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")

    path = report.pdf_path if format == "pdf" else report.docx_path
    if not path:
        raise HTTPException(status_code=404, detail=f"{format.upper()} not yet generated")

    url = await store_svc.get_signed_url(store_svc.BUCKET_REPORTS, path, expires_in=3600)
    return JSONResponse({"url": url, "format": format})
