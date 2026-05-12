from datetime import datetime
from typing import Annotated, Optional
from pydantic import BaseModel, Field, BeforeValidator
from bson import ObjectId

PyObjectId = Annotated[str, BeforeValidator(str)]

class ReferralDB(BaseModel):
    id: Optional[PyObjectId] = Field(alias="_id", default=None)
    patient_id: PyObjectId
    visit_id: PyObjectId
    referred_by: PyObjectId
    
    referred_doctor_id: Optional[PyObjectId] = None
    referred_department_id: Optional[PyObjectId] = None
    
    reason: str
    notes: Optional[str] = None
    priority: str  # Routine, Urgent, Emergency
    status: str = "Sent"  # Sent, Accepted, In Review, Completed, Rejected
    
    external_hospital: Optional[str] = None
    
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        populate_by_name = True
        json_encoders = {ObjectId: str}
