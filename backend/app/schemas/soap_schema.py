from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class SoapNoteCreate(BaseModel):
    """Payload for creating a new SOAP note."""
    patient_id: str
    visit_id: str
    subjective: str = ""
    objective: str = ""
    assessment: str = ""
    plan: str = ""


class SoapNoteUpdate(BaseModel):
    """Partial update payload for autosave — all fields optional."""
    subjective: Optional[str] = None
    objective: Optional[str] = None
    assessment: Optional[str] = None
    plan: Optional[str] = None


class SoapNoteResponse(BaseModel):
    """Full SOAP note response returned to the client."""
    id: str
    patient_id: str
    visit_id: str
    doctor_id: str
    subjective: str
    objective: str
    assessment: str
    plan: str
    status: str           # draft | signed
    signed_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime


class TranscribeRequest(BaseModel):
    """Placeholder schema for the future AI voice transcription endpoint."""
    audio_text: str  # Raw browser speech text
    section: str     # target section: subjective | objective | assessment | plan
