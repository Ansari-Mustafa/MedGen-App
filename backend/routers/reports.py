"""Reports router."""
import uuid
from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import JSONResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from backend.database import get_db
from backend.auth import require_staff, get_doctor_id
from backend.models.report import Report
from backend.models.appointment import Appointment
from backend.schemas.report import ReportOut, ReportEditSave
from backend.services import storage as store_svc

router = APIRouter(prefix="/reports", tags=["reports"])


@router.get("", response_model=list[ReportOut])
async def list_reports(
    profile=Depends(require_staff),
    db: AsyncSession = Depends(get_db),
):
    doctor_id = get_doctor_id(profile)
    result = await db.execute(
        select(Report)
        .join(Appointment, Report.appointment_id == Appointment.id)
        .where(Appointment.doctor_id == doctor_id)
        .order_by(Report.created_at.desc())
    )
    return result.scalars().all()


@router.get("/{report_id}", response_model=ReportOut)
async def get_report(
    report_id: uuid.UUID,
    profile=Depends(require_staff),
    db: AsyncSession = Depends(get_db),
):
    doctor_id = get_doctor_id(profile)
    result = await db.execute(
        select(Report)
        .join(Appointment, Report.appointment_id == Appointment.id)
        .where(Report.id == report_id, Appointment.doctor_id == doctor_id)
    )
    report = result.scalar_one_or_none()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    return report


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
        .join(Appointment, Report.appointment_id == Appointment.id)
        .where(Report.id == report_id, Appointment.doctor_id == doctor_id)
    )
    report = result.scalar_one_or_none()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")

    # Merge edits into filled_json and store correction pairs
    updated = {**report.filled_json, **body.fields}
    report.filled_json = updated
    report.edits_json = body.fields
    return report


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
        .join(Appointment, Report.appointment_id == Appointment.id)
        .where(Report.id == report_id, Appointment.doctor_id == doctor_id)
    )
    report = result.scalar_one_or_none()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")

    report.status = "approved"
    report.approved_at = datetime.now(timezone.utc)
    return report


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
