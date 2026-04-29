from pydantic import BaseModel
from typing import Optional
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
