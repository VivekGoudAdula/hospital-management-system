from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional

class NoteBase(BaseModel):
    content: str
    patient_id: str
    author_name: str
    author_role: str = "Medical Staff"

class NoteCreate(NoteBase):
    pass

class NoteResponse(NoteBase):
    id: str
    created_at: datetime

    class Config:
        from_attributes = True
