from datetime import datetime
from typing import Annotated, Optional
from pydantic import BaseModel, Field, BeforeValidator
from bson import ObjectId

# Represents an ObjID from MongoDB as a str for Pydantic
PyObjectId = Annotated[str, BeforeValidator(str)]

class NotificationDB(BaseModel):
    """Represents a notification in the system."""
    id: Optional[PyObjectId] = Field(alias="_id", default=None)
    user_id: Optional[PyObjectId] = None  # Target user, None for broadcast
    role: Optional[str] = None  # Target role (doctor, nurse, admin)
    
    title: str
    message: str
    type: str = "info"  # info | success | warning | error | critical
    
    link: Optional[str] = None
    read_by: list[PyObjectId] = Field(default_factory=list)
    
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        populate_by_name = True
        json_encoders = {ObjectId: str}
