from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime

class VisitCreate(BaseModel):
    patient_id: str
    appointment_id: Optional[str] = None
    doctor_id: Optional[str] = None
    department_id: Optional[str] = None
    visit_type: str = "OPD"
    token_number: Optional[str] = None
    chief_complaint: Optional[str] = None

class VisitUpdate(BaseModel):
    status: Optional[str] = None
    chief_complaint: Optional[str] = None
    doctor_id: Optional[str] = None
    department_id: Optional[str] = None
    completed_at: Optional[datetime] = None
    discharge_summary_id: Optional[str] = None

class VisitResponse(BaseModel):
    id: str
    patient_id: str
    appointment_id: Optional[str] = None
    doctor_id: Optional[str] = None
    department_id: Optional[str] = None
    visit_type: str
    status: str
    token_number: Optional[str] = None
    chief_complaint: Optional[str] = None
    started_at: datetime
    completed_at: Optional[datetime] = None
    discharge_summary_id: Optional[str] = None
    created_by: Optional[str] = None
    created_at: datetime
    updated_at: datetime

class TimelineItem(BaseModel):
    type: str  # visit | soap | prescription | lab
    title: str
    timestamp: datetime
    created_by: str
    metadata: Optional[dict] = None
