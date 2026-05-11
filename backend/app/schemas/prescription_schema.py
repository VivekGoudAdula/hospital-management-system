from pydantic import BaseModel, Field
from datetime import datetime
from typing import List, Optional


class MedicationItem(BaseModel):
    """A single medication row in the prescription."""
    medicine_name: str
    dosage: str
    frequency: str
    duration: str
    route: str = "Oral"
    instructions: str = ""


class PrescriptionCreate(BaseModel):
    """Payload accepted when creating a new prescription."""
    patient_id: str
    visit_id: str
    doctor_id: Optional[str] = None
    diagnosis_id: Optional[str] = None
    medicines: List[MedicationItem] = Field(default_factory=list)
    notes: str = ""


class PrescriptionUpdate(BaseModel):
    """Payload accepted when updating a prescription."""
    medicines: Optional[List[MedicationItem]] = None
    notes: Optional[str] = None
    diagnosis_id: Optional[str] = None


class PrescriptionResponse(BaseModel):
    """Prescription data returned to the client."""
    id: str
    patient_id: str
    visit_id: str
    doctor_id: str
    diagnosis_id: Optional[str] = None
    medicines: List[MedicationItem]
    notes: str
    status: str
    signed_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class MedicineSearchResponse(BaseModel):
    """Medicine lookup response."""
    name: str
    generic: str
    dosage_variants: List[str]
    category: str
    contraindications: List[str]
    interactions: List[str]
