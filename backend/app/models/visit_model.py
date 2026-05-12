from datetime import datetime
from typing import Annotated, Optional
from pydantic import BaseModel, Field, BeforeValidator
from bson import ObjectId

# Represents an ObjID from MongoDB as a str for Pydantic
PyObjectId = Annotated[str, BeforeValidator(str)]

class VisitDB(BaseModel):
    """Represents a visit document in the 'visits' collection."""
    id: Optional[PyObjectId] = Field(alias="_id", default=None)
    patient_id: PyObjectId
    appointment_id: Optional[PyObjectId] = None
    doctor_id: Optional[PyObjectId] = None
    department_id: Optional[PyObjectId] = None
    
    visit_type: str = "OPD"  # OPD | IPD
    status: str = "Waiting"  # Waiting | Active | In Progress | Referred | Admitted | Discharged | Closed
    
    token_number: Optional[str] = None
    chief_complaint: Optional[str] = None
    
    started_at: datetime = Field(default_factory=datetime.utcnow)
    completed_at: Optional[datetime] = None
    
    discharge_summary_id: Optional[PyObjectId] = None
    
    created_by: PyObjectId
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        populate_by_name = True
        json_encoders = {ObjectId: str}
