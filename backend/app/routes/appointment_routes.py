from fastapi import APIRouter, Depends, Query, status
from typing import List, Optional
from ..schemas.appointment_schema import AppointmentCreate, AppointmentUpdate, AppointmentResponse
from ..services.appointment_service import appointment_service
from ..utils.dependencies import require_doctor, require_admin

router = APIRouter(prefix="/appointments", tags=["Appointments"])

@router.post("/", response_model=AppointmentResponse, status_code=status.HTTP_201_CREATED)
async def create_appointment(
    appointment_data: AppointmentCreate,
    current_user: dict = Depends(require_doctor)
):
    """Book a new appointment."""
    return await appointment_service.create_appointment(appointment_data)

@router.get("/", response_model=List[AppointmentResponse])
async def get_appointments(
    patient_id: Optional[str] = None,
    doctor_id: Optional[str] = None,
    date: Optional[str] = None,
    status: Optional[str] = None,
    current_user: dict = Depends(require_doctor)
):
    """Get all appointments with filters."""
    filters = {
        "patient_id": patient_id,
        "doctor_id": doctor_id,
        "date": date,
        "status": status
    }
    
    # If doctor, restrict to their appointments unless admin
    if current_user["role"] == "doctor" and not doctor_id:
        filters["doctor_id"] = current_user.get("doctor_id")

    return await appointment_service.get_appointments(filters)

@router.get("/{id}", response_model=AppointmentResponse)
async def get_appointment(
    id: str,
    current_user: dict = Depends(require_doctor)
):
    """Get a single appointment by ID."""
    return await appointment_service.get_appointment_by_id(id)

@router.patch("/{id}", response_model=AppointmentResponse)
async def update_appointment(
    id: str,
    app_data: AppointmentUpdate,
    current_user: dict = Depends(require_doctor)
):
    """Update appointment (reschedule, cancel, etc.)."""
    return await appointment_service.update_appointment(id, app_data)

@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_appointment(
    id: str,
    current_user: dict = Depends(require_admin)
):
    """Delete an appointment record."""
    await appointment_service.delete_appointment(id)
    return None
