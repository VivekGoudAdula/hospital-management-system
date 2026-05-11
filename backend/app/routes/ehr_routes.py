from fastapi import APIRouter, Depends, HTTPException, status, Query
from typing import List, Optional
from ..services.ehr_service import ehr_service
from ..services.patient_service import patient_service
from ..schemas.visit_schema import VisitCreate, VisitUpdate, VisitResponse, TimelineItem
from ..schemas.patient_schema import PatientResponse
from ..utils.dependencies import get_current_user

router = APIRouter(prefix="/ehr", tags=["EHR"])

async def ehr_access_required(current_user: dict = Depends(get_current_user)):
    if current_user.get("role") not in ["admin", "doctor"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="EHR access restricted to Admins and Doctors"
        )
    return current_user

@router.get("/visits/{id}", response_model=VisitResponse)
async def get_visit(id: str, current_user: dict = Depends(ehr_access_required)):
    return await ehr_service.get_visit_by_id(id)

@router.post("/visits/create", response_model=VisitResponse)
async def create_visit(data: VisitCreate, current_user: dict = Depends(ehr_access_required)):
    return await ehr_service.create_visit(data, str(current_user["_id"]))

@router.patch("/visits/{id}", response_model=VisitResponse)
async def update_visit(id: str, data: VisitUpdate, current_user: dict = Depends(ehr_access_required)):
    return await ehr_service.update_visit(id, data)

@router.get("/patients/{patient_id}/visits", response_model=List[VisitResponse])
async def get_patient_visits(patient_id: str, current_user: dict = Depends(ehr_access_required)):
    return await ehr_service.get_patient_visit_history(patient_id)

@router.get("/patients/{patient_id}/active-visit", response_model=Optional[VisitResponse])
async def get_active_visit(patient_id: str, current_user: dict = Depends(ehr_access_required)):
    return await ehr_service.get_active_visit(patient_id)

@router.get("/patients/{patient_id}/timeline", response_model=List[TimelineItem])
async def get_patient_timeline(patient_id: str, current_user: dict = Depends(ehr_access_required)):
    return await ehr_service.get_patient_timeline(patient_id)

@router.get("/patients/{patient_id}/get-or-create-visit", response_model=VisitResponse)
async def get_or_create_visit(patient_id: str, current_user: dict = Depends(ehr_access_required)):
    # If doctor, use their doctor_id. If admin, they might need to specify a doctor, but for foundation we'll use a placeholder or the admin's ID if we must.
    # Usually, this is called by a doctor.
    doctor_id = current_user.get("doctor_id")
    if not doctor_id and current_user.get("role") == "admin":
        # For admin, we might just use their user ID if they don't have a doctor_id, 
        # but the model expects doctor_id. Let's see if we can find a default doctor or just use None.
        doctor_id = str(current_user["_id"]) # Fallback
    
    return await ehr_service.get_or_create_active_visit(patient_id, doctor_id)

@router.get("/dashboard/patients", response_model=List[PatientResponse])
async def get_ehr_patients(
    name: Optional[str] = Query(None),
    mrn: Optional[str] = Query(None),
    phone: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    current_user: dict = Depends(ehr_access_required)
):
    """Specific patient list for EHR workspace, optimized for doctors."""
    filters = {
        "name": name,
        "mrn": mrn,
        "phone": phone,
        "status": status
    }
    
    # If doctor, restrict to assigned patients (as per prompt)
    if current_user.get("role") == "doctor" and current_user.get("doctor_id"):
        filters["doctor_id"] = current_user["doctor_id"]
        
    return await patient_service.get_patients(filters)
