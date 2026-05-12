from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime

class ReferralCreate(BaseModel):
    patient_id: str
    visit_id: str
    referred_doctor_id: Optional[str] = None
    referred_department_id: Optional[str] = None
    reason: str
    notes: Optional[str] = None
    priority: str
    external_hospital: Optional[str] = None

class ReferralUpdate(BaseModel):
    status: Optional[str] = None
    notes: Optional[str] = None

class ReferralResponse(BaseModel):
    id: str
    patient_id: str
    visit_id: str
    referred_by: str
    referred_doctor_id: Optional[str] = None
    referred_department_id: Optional[str] = None
    reason: str
    notes: Optional[str] = None
    priority: str
    status: str = "Sent"
    external_hospital: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        populate_by_name = True
