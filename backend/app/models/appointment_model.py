from datetime import datetime
from typing import Annotated, Optional
from pydantic import BaseModel, Field, BeforeValidator
from bson import ObjectId

# Represents an ObjID from MongoDB as a str for Pydantic
PyObjectId = Annotated[str, BeforeValidator(str)]

class AppointmentDB(BaseModel):
    """Represents an appointment document in the 'appointments' collection."""
    id: Optional[PyObjectId] = Field(alias="_id", default=None)
    patient_id: PyObjectId
    doctor_id: PyObjectId
    department_id: Optional[PyObjectId] = None
    appointment_date: str  # YYYY-MM-DD
    appointment_time: str  # HH:MM
    status: str = "Upcoming"  # Upcoming | Completed | Cancelled | Rescheduled
    type: str = "Consultation"  # Consultation | Follow-up | Emergency
    token: str
    reason: Optional[str] = None
    cancellation_reason: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        populate_by_name = True
        json_encoders = {ObjectId: str}
