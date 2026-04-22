"""Dashboard stats aggregation for the logged-in staff member."""
from datetime import datetime, timezone
from fastapi import APIRouter, Depends
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from backend.database import get_db
from backend.auth import require_staff, get_doctor_id
from backend.models.patient import Patient
from backend.models.appointment import Appointment
from backend.models.report import Report

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


@router.get("")
async def get_dashboard(
    profile=Depends(require_staff),
    db: AsyncSession = Depends(get_db),
):
    doctor_id = get_doctor_id(profile)
    now = datetime.now(timezone.utc)
    month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)

    total_patients = await db.scalar(
        select(func.count(Patient.id)).where(Patient.doctor_id == doctor_id)
    )

    total_reports = await db.scalar(
        select(func.count(Report.id))
        .join(Appointment, Report.appointment_id == Appointment.id)
        .where(Appointment.doctor_id == doctor_id)
    )

    reports_this_month = await db.scalar(
        select(func.count(Report.id))
        .join(Appointment, Report.appointment_id == Appointment.id)
        .where(Appointment.doctor_id == doctor_id, Report.created_at >= month_start)
    )

    upcoming_appointments = await db.scalar(
        select(func.count(Appointment.id)).where(
            Appointment.doctor_id == doctor_id,
            Appointment.scheduled_at >= now,
            Appointment.status != "cancelled",
        )
    )

    recent_reports_q = await db.execute(
        select(Report)
        .options(selectinload(Report.appointment).selectinload(Appointment.patient))
        .join(Appointment, Report.appointment_id == Appointment.id)
        .where(Appointment.doctor_id == doctor_id)
        .order_by(Report.created_at.desc())
        .limit(3)
    )

    upcoming_q = await db.execute(
        select(Appointment)
        .options(selectinload(Appointment.patient))
        .where(
            Appointment.doctor_id == doctor_id,
            Appointment.scheduled_at >= now,
            Appointment.status != "cancelled",
        )
        .order_by(Appointment.scheduled_at.asc())
        .limit(3)
    )

    return {
        "total_patients": total_patients or 0,
        "total_reports": total_reports or 0,
        "reports_this_month": reports_this_month or 0,
        "upcoming_appointments": upcoming_appointments or 0,
        "recent_reports": [
            {
                "id": str(r.id),
                "patient_name": r.appointment.patient.full_name if r.appointment and r.appointment.patient else None,
                "status": r.status,
                "created_at": r.created_at.isoformat() if r.created_at else None,
            }
            for r in recent_reports_q.scalars().all()
        ],
        "upcoming_appointments_list": [
            {
                "id": str(a.id),
                "patient_name": a.patient.full_name if a.patient else None,
                "scheduled_at": a.scheduled_at.isoformat() if a.scheduled_at else None,
                "status": a.status,
            }
            for a in upcoming_q.scalars().all()
        ],
    }
