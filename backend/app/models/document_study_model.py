from datetime import datetime
from typing import Annotated, Optional, List, Dict
from pydantic import BaseModel, Field, BeforeValidator
from bson import ObjectId

PyObjectId = Annotated[str, BeforeValidator(str)]

class DocumentFile(BaseModel):
    file_url: str
    file_type: str
    uploaded_at: datetime = Field(default_factory=datetime.utcnow)

class DocumentStudyDB(BaseModel):
    id: Optional[PyObjectId] = Field(alias="_id", default=None)
    patient_id: PyObjectId
    visit_id: PyObjectId
    
    category: str
    body_part: Optional[str] = None
    uploaded_by: PyObjectId
    
    findings: Optional[str] = None
    impression: Optional[str] = None
    clinical_context: Optional[str] = None
    
    files: List[DocumentFile] = []
    tags: List[str] = []
    status: str = "Pending Review"  # Pending Review, Reviewed, Critical, Archived
    
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        populate_by_name = True
        json_encoders = {ObjectId: str}
