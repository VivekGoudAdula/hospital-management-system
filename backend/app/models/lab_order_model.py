from datetime import datetime
from typing import Annotated, Optional, List
from pydantic import BaseModel, Field, BeforeValidator
from bson import ObjectId

PyObjectId = Annotated[str, BeforeValidator(str)]

class LabOrderDB(BaseModel):
    id: Optional[PyObjectId] = Field(alias="_id", default=None)
    patient_id: PyObjectId
    visit_id: PyObjectId
    ordered_by: PyObjectId
    department_id: Optional[PyObjectId] = None
    
    category: str  # Blood Test, Urine Test, MRI, CT Scan, X-Ray, Ultrasound, ECG, Pathology
    test_name: str
    urgency: str  # Routine, Priority, Urgent, STAT
    clinical_indication: Optional[str] = None
    notes: Optional[str] = None
    
    status: str = "Ordered"  # Ordered, Sample Collected, Processing, Completed, Reviewed
    
    ordered_at: datetime = Field(default_factory=datetime.utcnow)
    result_document_ids: List[PyObjectId] = []
    
    # Lab specific findings
    findings: Optional[str] = None
    impression: Optional[str] = None
    radiologist_comments: Optional[str] = None
    technician_notes: Optional[str] = None

    class Config:
        populate_by_name = True
        json_encoders = {ObjectId: str}
