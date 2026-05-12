from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime

class LabOrderCreate(BaseModel):
    patient_id: str
    visit_id: str
    category: str
    test_name: str
    urgency: str
    clinical_indication: Optional[str] = None
    notes: Optional[str] = None
    department_id: Optional[str] = None

class LabOrderUpdate(BaseModel):
    status: Optional[str] = None
    findings: Optional[str] = None
    impression: Optional[str] = None
    radiologist_comments: Optional[str] = None
    technician_notes: Optional[str] = None
    result_document_ids: Optional[List[str]] = None

class LabOrderResponse(BaseModel):
    id: str
    patient_id: str
    visit_id: str
    ordered_by: str
    department_id: Optional[str] = None
    category: str
    test_name: str
    urgency: str
    clinical_indication: Optional[str] = None
    notes: Optional[str] = None
    status: str = "Ordered"
    ordered_at: datetime = Field(default_factory=datetime.utcnow)
    result_document_ids: List[str] = []
    findings: Optional[str] = None
    impression: Optional[str] = None
    radiologist_comments: Optional[str] = None
    technician_notes: Optional[str] = None

    class Config:
        populate_by_name = True
