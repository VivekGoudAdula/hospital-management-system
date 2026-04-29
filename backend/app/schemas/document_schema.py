from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class DocumentResponse(BaseModel):
    id: str
    patient_id: str
    file_url: str
    file_name: str
    file_type: str
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
