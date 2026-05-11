from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime

class VisitCreate(BaseModel):
    patient_id: str
    doctor_id: Optional[str] = None
    department_id: Optional[str] = None
    visit_type: str = "OPD"
    chief_complaint: Optional[str] = None

class VisitUpdate(BaseModel):
    status: Optional[str] = None
    chief_complaint: Optional[str] = None
    doctor_id: Optional[str] = None
    department_id: Optional[str] = None
    discharge_date: Optional[datetime] = None

class VisitResponse(BaseModel):
    id: str
    patient_id: str
    doctor_id: Optional[str] = None
    department_id: Optional[str] = None
    visit_type: str
    status: str
    chief_complaint: Optional[str] = None
    admission_date: datetime
    discharge_date: Optional[datetime] = None
    created_by: str
    created_at: datetime
    updated_at: datetime

class TimelineItem(BaseModel):
    type: str  # visit | soap | prescription | lab
    title: str
    timestamp: datetime
    created_by: str
    metadata: Optional[dict] = None
