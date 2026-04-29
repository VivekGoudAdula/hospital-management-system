from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class DocumentResponse(BaseModel):
    id: str
    patient_id: str
    file_url: str
    file_name: str
    file_type: str
    
    scan_date: Optional[datetime] = None
    body_part: Optional[str] = None
    department: Optional[str] = None
    referring_doctor_id: Optional[str] = None
    
    findings: Optional[str] = None
    impression: Optional[str] = None
    
    symptoms: Optional[str] = None
    clinical_history: Optional[str] = None
    reason_for_scan: Optional[str] = None
    doctor_notes: Optional[str] = None
    
    notes: Optional[str] = None
    uploaded_by: str
    created_at: datetime


class RepositoryItem(BaseModel):
    app_id: str
    patient_name: str
    mrn: str
    department: str
    document_types: List[str]
    files_count: int
    latest_activity: datetime
    patient_id: str

class RepositoryResponse(BaseModel):
    data: List[RepositoryItem]
    total: int


class StudyFileResponse(BaseModel):
    id: str
    study_id: str
    file_url: str
    file_name: str
    file_format: str
    created_at: datetime

class StudyResponse(BaseModel):
    id: str
    patient_id: str
    study_type: str
    body_part: Optional[str] = None
    scan_date: Optional[datetime] = None
    department: Optional[str] = None
    referring_doctor_id: Optional[str] = None
    
    findings: Optional[str] = None
    impression: Optional[str] = None
    
    symptoms: Optional[str] = None
    clinical_history: Optional[str] = None
    reason_for_scan: Optional[str] = None
    doctor_notes: Optional[str] = None
    
    uploaded_by: str
    created_at: datetime
    
    files: List[StudyFileResponse] = []
