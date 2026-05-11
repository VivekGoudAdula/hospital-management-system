from fastapi import APIRouter, Depends, HTTPException, status, Query
from typing import List, Optional
from ..services.diagnosis_service import diagnosis_service
from ..schemas.diagnosis_schema import DiagnosisCreate, DiagnosisUpdate, DiagnosisResponse, ICDCode
from ..utils.dependencies import get_current_user

router = APIRouter(prefix="/ehr", tags=["Diagnosis"])

async def doctor_access_required(current_user: dict = Depends(get_current_user)):
    if current_user.get("role") not in ["admin", "doctor"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Diagnosis management restricted to Admins and Doctors"
        )
    return current_user

@router.get("/icd/search", response_model=List[ICDCode])
async def search_icd(q: str = Query(...), current_user: dict = Depends(get_current_user)):
    return await diagnosis_service.search_icd_codes(q)

@router.post("/diagnosis", response_model=DiagnosisResponse)
async def create_diagnosis(data: DiagnosisCreate, current_user: dict = Depends(doctor_access_required)):
    # Use doctor_id from user profile or the user's ObjectId
    doctor_id = current_user.get("doctor_id") or str(current_user["_id"])
    return await diagnosis_service.create_diagnosis(data, doctor_id)

@router.get("/diagnosis/{visit_id}", response_model=Optional[DiagnosisResponse])
async def get_diagnosis(visit_id: str, current_user: dict = Depends(get_current_user)):
    return await diagnosis_service.get_diagnosis_by_visit(visit_id)

@router.patch("/diagnosis/{id}", response_model=DiagnosisResponse)
async def update_diagnosis(id: str, data: DiagnosisUpdate, current_user: dict = Depends(doctor_access_required)):
    doctor_id = current_user.get("doctor_id") or str(current_user["_id"])
    return await diagnosis_service.update_diagnosis(id, data, doctor_id)

@router.delete("/diagnosis/{id}")
async def delete_diagnosis(id: str, current_user: dict = Depends(doctor_access_required)):
    success = await diagnosis_service.delete_diagnosis(id)
    if not success:
        raise HTTPException(status_code=404, detail="Diagnosis not found")
    return {"status": "success", "message": "Diagnosis removed"}
