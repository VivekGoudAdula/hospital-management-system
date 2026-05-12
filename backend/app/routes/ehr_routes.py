from fastapi import APIRouter, Depends, HTTPException, status, Query
from typing import List, Optional
from ..services.ehr_service import ehr_service
from ..services.patient_service import patient_service
from ..schemas.visit_schema import VisitCreate, VisitUpdate, VisitResponse, TimelineItem
from ..schemas.lab_schema import LabOrderCreate, LabOrderUpdate, LabOrderResponse
from ..schemas.referral_schema import ReferralCreate, ReferralUpdate, ReferralResponse
from ..schemas.document_study_schema import DocumentStudyCreate, DocumentStudyUpdate, DocumentStudyResponse
from ..schemas.patient_schema import PatientResponse
from ..utils.dependencies import get_current_user
from ..services.workflow_service import workflow_service

router = APIRouter(prefix="/ehr", tags=["EHR"])

async def ehr_access_required(current_user: dict = Depends(get_current_user)):
    if current_user.get("role") not in ["admin", "doctor", "nurse"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="EHR access restricted to Clinical Staff (Admins, Doctors, Nurses)"
        )
    return current_user

async def doctor_admin_only(current_user: dict = Depends(get_current_user)):
    if current_user.get("role") not in ["admin", "doctor"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This action is restricted to Doctors and Admins"
        )
    return current_user

# ── Workflow Routes ──────────────────────────────────────────────────

@router.post("/workflow/check-in/{appointment_id}", response_model=VisitResponse)
async def check_in_patient(appointment_id: str, current_user: dict = Depends(get_current_user)):
    return await workflow_service.check_in_patient(appointment_id, str(current_user["_id"]))

@router.post("/workflow/start-consultation/{visit_id}", response_model=VisitResponse)
async def start_consultation(visit_id: str, current_user: dict = Depends(ehr_access_required)):
    return await workflow_service.start_consultation(visit_id, str(current_user["_id"]))

@router.post("/workflow/complete-visit/{visit_id}", response_model=VisitResponse)
async def complete_visit(visit_id: str, current_user: dict = Depends(doctor_admin_only)):
    return await workflow_service.complete_visit(visit_id, str(current_user["_id"]))

@router.get("/workflow/discharge-summary/{visit_id}")
async def get_discharge_summary(visit_id: str, current_user: dict = Depends(ehr_access_required)):
    return await workflow_service.generate_discharge_summary_data(visit_id)

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

# ── Lab Order Routes ──────────────────────────────────────────────────

@router.post("/labs/order", response_model=LabOrderResponse)
async def create_lab_order(data: LabOrderCreate, current_user: dict = Depends(ehr_access_required)):
    return await ehr_service.create_lab_order(data, str(current_user["_id"]))

@router.get("/labs/visit/{visit_id}", response_model=List[LabOrderResponse])
async def get_visit_labs(visit_id: str, current_user: dict = Depends(ehr_access_required)):
    return await ehr_service.get_visit_lab_orders(visit_id)

@router.get("/labs/patient/{patient_id}", response_model=List[LabOrderResponse])
async def get_patient_labs(patient_id: str, current_user: dict = Depends(ehr_access_required)):
    return await ehr_service.get_patient_lab_history(patient_id)

@router.patch("/labs/{id}", response_model=LabOrderResponse)
async def update_lab_order(id: str, data: LabOrderUpdate, current_user: dict = Depends(ehr_access_required)):
    return await ehr_service.update_lab_order(id, data)

# ── Referral Routes ──────────────────────────────────────────────────

@router.post("/referrals", response_model=ReferralResponse)
async def create_referral(data: ReferralCreate, current_user: dict = Depends(ehr_access_required)):
    return await ehr_service.create_referral(data, str(current_user["_id"]))

@router.get("/referrals/patient/{patient_id}", response_model=List[ReferralResponse])
async def get_patient_referrals(patient_id: str, current_user: dict = Depends(ehr_access_required)):
    return await ehr_service.get_patient_referrals(patient_id)

@router.patch("/referrals/{id}", response_model=ReferralResponse)
async def update_referral(id: str, data: ReferralUpdate, current_user: dict = Depends(doctor_admin_only)):
    return await ehr_service.update_referral(id, data)

# ── Document Study Routes ──────────────────────────────────────────

@router.post("/documents/study/upload", response_model=DocumentStudyResponse)
async def create_document_study(data: DocumentStudyCreate, current_user: dict = Depends(ehr_access_required)):
    return await ehr_service.create_document_study(data, str(current_user["_id"]))

@router.get("/documents/patient/{patient_id}", response_model=List[DocumentStudyResponse])
async def get_patient_document_studies(patient_id: str, current_user: dict = Depends(ehr_access_required)):
    return await ehr_service.get_patient_document_studies(patient_id)

@router.patch("/documents/study/{id}", response_model=DocumentStudyResponse)
async def update_document_study(id: str, data: DocumentStudyUpdate, current_user: dict = Depends(ehr_access_required)):
    return await ehr_service.update_document_study(id, data)
