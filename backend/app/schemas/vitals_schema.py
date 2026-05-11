from pydantic import BaseModel, Field
from typing import Optional, Dict
from datetime import datetime

class BloodPressure(BaseModel):
    systolic: float
    diastolic: float

class VitalsBase(BaseModel):
    patient_id: str
    visit_id: str
    blood_pressure: BloodPressure
    pulse: float
    temperature: float
    spo2: float
    respiratory_rate: float
    height: float
    weight: float
    pain_scale: int = Field(..., ge=0, le=10)
    blood_sugar: Optional[float] = None
    notes: Optional[str] = None

class VitalsCreate(VitalsBase):
    pass

class VitalsUpdate(BaseModel):
    blood_pressure: Optional[BloodPressure] = None
    pulse: Optional[float] = None
    temperature: Optional[float] = None
    spo2: Optional[float] = None
    respiratory_rate: Optional[float] = None
    height: Optional[float] = None
    weight: Optional[float] = None
    pain_scale: Optional[int] = None
    blood_sugar: Optional[float] = None
    notes: Optional[str] = None

class VitalsResponse(VitalsBase):
    id: str
    recorded_by: str
    bmi: float
    bmi_status: str
    created_at: datetime

    class Config:
        from_attributes = True
