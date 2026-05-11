from datetime import datetime
from typing import Annotated, Optional, List
from pydantic import BaseModel, Field, BeforeValidator
from bson import ObjectId

# Represents an ObjID from MongoDB as a str for Pydantic
PyObjectId = Annotated[str, BeforeValidator(str)]

class OTBookingDB(BaseModel):
    """Represents an OT booking document in the 'ot_bookings' collection."""
    id: Optional[PyObjectId] = Field(alias="_id", default=None)
    patient_id: PyObjectId
    surgeon_id: PyObjectId
    theatre_id: str  # OT 1, OT 2, etc.
    surgery_name: str
    surgery_date: str  # YYYY-MM-DD
    start_time: str    # HH:MM
    end_time: str      # HH:MM
    status: str = "Scheduled"  # Scheduled | In Progress | Completed | Cancelled | Postponed
    type: str = "Planned"      # Planned | Emergency
    notes: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        populate_by_name = True
        json_encoders = {ObjectId: str}

class OperationTheatreDB(BaseModel):
    """Represents an Operation Theatre."""
    id: Optional[PyObjectId] = Field(alias="_id", default=None)
    name: str
    location: str
    status: str = "Available" # Available | Occupied | Maintenance
    equipment: List[str] = []
