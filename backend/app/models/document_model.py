from datetime import datetime
from typing import Annotated, Optional
from pydantic import BaseModel, Field, BeforeValidator
from bson import ObjectId

# Represents an ObjID from MongoDB as a str for Pydantic
PyObjectId = Annotated[str, BeforeValidator(str)]

class DocumentDB(BaseModel):
    """Represents a document document in the 'documents' collection."""
    id: Optional[PyObjectId] = Field(alias="_id", default=None)
    patient_id: PyObjectId
    file_url: str
    file_name: str
    file_type: str  # X-ray, MRI, CT, etc.
    notes: Optional[str] = None
    uploaded_by: PyObjectId  # User ID of the uploader
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        populate_by_name = True
        json_encoders = {ObjectId: str}
