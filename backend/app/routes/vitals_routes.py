from fastapi import APIRouter, Depends, HTTPException, status
from typing import List, Dict, Any
from ..schemas.vitals_schema import VitalsCreate, VitalsUpdate, VitalsResponse
from ..services.vitals_service import vitals_service
from ..utils.dependencies import get_current_user

router = APIRouter(prefix="/ehr/vitals", tags=["EHR Vitals"])

@router.post("", response_model=VitalsResponse)
async def create_vitals(
    vitals_data: VitalsCreate,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """Save new vitals for a patient visit."""
    # Check roles - only doctors, nurses and admins
    if current_user["role"].lower() not in ["doctor", "nurse", "admin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to record vitals."
        )
    
    return await vitals_service.create_vitals(str(current_user["_id"]), vitals_data)

@router.get("/{patient_id}", response_model=List[VitalsResponse])
async def get_patient_vitals(
    patient_id: str,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """Fetch full vitals history for a patient."""
    if current_user["role"].lower() == "receptionist":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Receptionists do not have access to clinical vitals."
        )
    return await vitals_service.get_patient_vitals(patient_id)

@router.get("/latest/{patient_id}", response_model=VitalsResponse)
async def get_latest_vitals(
    patient_id: str,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """Fetch the latest vitals snapshot for a patient."""
    if current_user["role"].lower() == "receptionist":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Receptionists do not have access to clinical vitals."
        )
    vitals = await vitals_service.get_latest_vitals(patient_id)
    if not vitals:
        raise HTTPException(status_code=404, detail="No vitals found for this patient.")
    return vitals

@router.patch("/{id}", response_model=VitalsResponse)
async def update_vitals(
    id: str,
    vitals_data: VitalsUpdate,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """Update an existing vitals record."""
    if current_user["role"].lower() not in ["doctor", "nurse", "admin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to update vitals."
        )
    return await vitals_service.update_vitals(id, vitals_data)

@router.delete("/{id}")
async def delete_vitals(
    id: str,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """Delete a vitals record."""
    if current_user["role"].lower() != "doctor":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only doctors can delete vitals records."
        )
    await vitals_service.delete_vitals(id)
    return {"message": "Vitals record deleted successfully"}
