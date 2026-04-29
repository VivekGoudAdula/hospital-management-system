from fastapi import APIRouter, Depends, UploadFile, File, Form, status
from typing import List
from ..schemas.document_schema import DocumentResponse
from ..services.document_service import document_service
from ..utils.dependencies import require_doctor, get_current_user

router = APIRouter(prefix="/documents", tags=["Documents"])

@router.post("/upload", response_model=DocumentResponse, status_code=status.HTTP_201_CREATED)
async def upload_document(
    patient_id: str = Form(...),
    file_type: str = Form(...),
    notes: str = Form(None),
    file: UploadFile = File(...),
    current_user: dict = Depends(require_doctor)
):
    """Upload a document for a patient."""
    return await document_service.upload_document(
        patient_id=patient_id,
        file_type=file_type,
        notes=notes,
        file=file,
        user_id=str(current_user["_id"])
    )

@router.get("/", response_model=List[DocumentResponse])
async def get_patient_documents(
    patient_id: str,
    current_user: dict = Depends(require_doctor)
):
    """Get all documents for a specific patient."""
    return await document_service.get_patient_documents(patient_id)

@router.delete("/{id}")
async def delete_document(
    id: str,
    current_user: dict = Depends(require_doctor)
):
    """Delete a document."""
    return await document_service.delete_document(
        document_id=id,
        user_id=str(current_user["_id"]),
        user_role=current_user["role"]
    )
