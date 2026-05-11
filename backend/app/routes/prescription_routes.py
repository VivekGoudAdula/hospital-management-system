from fastapi import APIRouter, Depends, status, HTTPException, Query
from typing import List, Optional
from ..schemas.prescription_schema import (
    PrescriptionCreate, 
    PrescriptionUpdate, 
    PrescriptionResponse, 
    MedicineSearchResponse
)
from ..services.prescription_service import prescription_service
from ..utils.dependencies import require_doctor, require_role

router = APIRouter(prefix="/ehr/prescription", tags=["Prescriptions"])

@router.get("/medicines/search", response_model=List[MedicineSearchResponse])
async def search_medicines(
    q: str = Query("", description="Search query for medicine name or generic"),
    current_user: dict = Depends(require_doctor)
):
    """Search for medicines in the database."""
    return await prescription_service.search_medicines(q)

@router.post("/", response_model=PrescriptionResponse, status_code=status.HTTP_201_CREATED)
async def create_prescription(
    data: PrescriptionCreate,
    current_user: dict = Depends(require_doctor)
):
    """Create a new prescription."""
    doctor_id = str(current_user.get("_id"))
    return await prescription_service.create_prescription(data, doctor_id)

@router.get("/visit/{visit_id}", response_model=Optional[PrescriptionResponse])
async def get_visit_prescription(
    visit_id: str,
    current_user: dict = Depends(require_doctor)
):
    """Fetch prescription for a specific visit."""
    return await prescription_service.get_visit_prescription(visit_id)

@router.patch("/{id}", response_model=PrescriptionResponse)
async def update_prescription(
    id: str,
    data: PrescriptionUpdate,
    current_user: dict = Depends(require_doctor)
):
    """Update an existing draft prescription."""
    return await prescription_service.update_prescription(id, data)

@router.post("/{id}/finalize", response_model=PrescriptionResponse)
async def finalize_prescription(
    id: str,
    current_user: dict = Depends(require_doctor)
):
    """Finalize and digitally sign a prescription."""
    doctor_id = str(current_user.get("_id"))
    return await prescription_service.finalize_prescription(id, doctor_id)

@router.get("/history/{patient_id}", response_model=List[dict])
async def get_medication_history(
    patient_id: str,
    current_user: dict = Depends(require_doctor)
):
    """Fetch complete medication history for a patient."""
    return await prescription_service.get_medication_history(patient_id)

@router.post("/check-interactions", response_model=List[dict])
async def check_interactions(
    data: dict,
    current_user: dict = Depends(require_doctor)
):
    """Check for drug interactions and allergies."""
    patient_id = data.get("patientId")
    medicines = data.get("medicines", [])
    # Convert to MedicationItem objects for the service
    from ..schemas.prescription_schema import MedicationItem
    med_items = [MedicationItem(**m) for m in medicines]
    return await prescription_service.check_interactions(patient_id, med_items)

@router.post("/{id}/pdf")
async def generate_prescription_pdf(
    id: str,
    current_user: dict = Depends(require_doctor)
):
    """Generate a printable PDF for the prescription."""
    url = await prescription_service.generate_pdf(id)
    if not url:
        raise HTTPException(status_code=500, detail="PDF generation failed or reportlab not installed")
    return {"pdf_url": url}

@router.get("/{id}", response_model=PrescriptionResponse)
async def get_prescription(
    id: str,
    current_user: dict = Depends(require_doctor)
):
    """Get a specific prescription by ID."""
    prescription = await prescription_service.get_prescription(id)
    if not prescription:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Prescription not found")
    return prescription
