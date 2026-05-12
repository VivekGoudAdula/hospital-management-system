from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime

class DocumentFile(BaseModel):
    file_url: str
    file_type: str
    uploaded_at: datetime = Field(default_factory=datetime.utcnow)

class DocumentStudyCreate(BaseModel):
    patient_id: str
    visit_id: str
    category: str
    body_part: Optional[str] = None
    findings: Optional[str] = None
    impression: Optional[str] = None
    clinical_context: Optional[str] = None
    files: List[DocumentFile] = []
    tags: List[str] = []

class DocumentStudyUpdate(BaseModel):
    status: Optional[str] = None
    findings: Optional[str] = None
    impression: Optional[str] = None
    tags: Optional[List[str]] = None

class DocumentStudyResponse(BaseModel):
    id: str
    patient_id: str
    visit_id: Optional[str] = None
    category: str
    body_part: Optional[str] = None
    uploaded_by: str
    findings: Optional[str] = None
    impression: Optional[str] = None
    clinical_context: Optional[str] = None
    files: List[DocumentFile] = []
    tags: List[str] = []
    status: str = "Pending Review"
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        populate_by_name = True
