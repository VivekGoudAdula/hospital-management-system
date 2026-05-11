from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime

class AppointmentBase(BaseModel):
    patient_id: str = Field(..., min_length=1)
    doctor_id: str = Field(..., min_length=1)
    department_id: Optional[str] = None
    appointment_date: str
    appointment_time: str
    type: str = "Consultation"
    reason: Optional[str] = None

class AppointmentCreate(AppointmentBase):
    pass

class AppointmentUpdate(BaseModel):
    appointment_date: Optional[str] = None
    appointment_time: Optional[str] = None
    status: Optional[str] = None
    type: Optional[str] = None
    reason: Optional[str] = None
    cancellation_reason: Optional[str] = None

class AppointmentResponse(AppointmentBase):
    id: str
    patient_name: Optional[str] = None
    doctor_name: Optional[str] = None
    department_name: Optional[str] = None
    status: str
    token: str
    cancellation_reason: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
