from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime

class OTBookingBase(BaseModel):
    patient_id: str = Field(..., min_length=1)
    surgeon_id: str = Field(..., min_length=1)
    theatre_id: str = Field(..., min_length=1)
    surgery_name: str
    surgery_date: str
    start_time: str
    end_time: str
    type: str = "Planned"
    notes: Optional[str] = None

class OTBookingCreate(OTBookingBase):
    pass

class OTBookingUpdate(BaseModel):
    surgery_date: Optional[str] = None
    start_time: Optional[str] = None
    end_time: Optional[str] = None
    status: Optional[str] = None
    theatre_id: Optional[str] = None
    notes: Optional[str] = None

class OTBookingResponse(OTBookingBase):
    id: str
    patient_name: Optional[str] = None
    surgeon_name: Optional[str] = None
    status: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class OTStats(BaseModel):
    total_surgeries: int
    usage_hours: float
    occupancy_rate: float
    emergency_count: int
    planned_count: int
    cancelled_count: int
