from datetime import datetime
from typing import Annotated, Optional
from pydantic import BaseModel, Field, BeforeValidator
from bson import ObjectId

# Represents an ObjectId from MongoDB as a string for Pydantic
PyObjectId = Annotated[str, BeforeValidator(str)]


class SoapNoteDB(BaseModel):
    """Represents a soap_notes document in the 'soap_notes' MongoDB collection."""

    id: Optional[PyObjectId] = Field(alias="_id", default=None)

    patient_id: PyObjectId
    visit_id: PyObjectId
    doctor_id: PyObjectId

    # SOAP content fields
    subjective: str = ""   # Patient-reported symptoms
    objective: str = ""    # Doctor observations & measurable findings
    assessment: str = ""   # Clinical impression
    plan: str = ""         # Treatment plan

    # Lifecycle state
    status: str = "draft"  # draft | signed

    signed_at: Optional[datetime] = None

    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        populate_by_name = True
        json_encoders = {ObjectId: str}
