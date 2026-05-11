from datetime import datetime
from typing import Annotated, List, Optional
from pydantic import BaseModel, Field, BeforeValidator
from bson import ObjectId

# Represents an ObjectId from MongoDB as a str for Pydantic
PyObjectId = Annotated[str, BeforeValidator(str)]


class MedicationDB(BaseModel):
    """Represents a single medication row in a prescription."""
    medicine_name: str
    dosage: str
    frequency: str
    duration: str
    route: str = "Oral"
    instructions: str = ""


class PrescriptionDB(BaseModel):
    """Represents a prescription document in the 'prescriptions' collection."""
    id: Optional[PyObjectId] = Field(alias="_id", default=None)
    patient_id: PyObjectId
    visit_id: PyObjectId
    doctor_id: PyObjectId
    diagnosis_id: Optional[PyObjectId] = None
    
    medicines: List[MedicationDB] = Field(default_factory=list)
    notes: str = ""
    
    status: str = "draft"  # "draft" | "finalized"
    signed_at: Optional[datetime] = None
    
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        populate_by_name = True
        json_encoders = {ObjectId: str}
