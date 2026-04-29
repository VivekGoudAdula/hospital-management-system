from fastapi import APIRouter, Depends
from typing import List, Optional
from ..config.db import get_database
from ..schemas.user_schema import UserResponse
from ..utils.dependencies import get_current_user

router = APIRouter(prefix="/doctors", tags=["Doctors"])

@router.get("", response_model=List[UserResponse])
async def get_doctors(_: dict = Depends(get_current_user)):
    """Get a list of all doctors for dropdowns and assignments."""
    db = get_database()
    cursor = db.users.find({"role": "doctor"})
    doctors = await cursor.to_list(length=None)
    
    # Format according to UserResponse
    return [
        UserResponse(
            id=str(doc["_id"]),
            name=doc["name"],
            email=doc["email"],
            role=doc["role"],
            doctor_id=doc.get("doctor_id"),
            created_at=doc["created_at"]
        ) for doc in doctors
    ]
