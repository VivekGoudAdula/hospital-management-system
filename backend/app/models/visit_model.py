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
    doctor_id: Optional[PyObjectId] = None
    department_id: Optional[PyObjectId] = None
    
    visit_type: str = "OPD"  # OPD | IPD
    status: str = "active"  # active | completed | cancelled
    
    chief_complaint: Optional[str] = None
    
    admission_date: datetime = Field(default_factory=datetime.utcnow)
    discharge_date: Optional[datetime] = None
    
    created_by: PyObjectId
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        populate_by_name = True
        json_encoders = {ObjectId: str}
