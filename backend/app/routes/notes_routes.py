from fastapi import APIRouter, Depends, status, HTTPException, Query
from typing import List, Optional
from ..schemas.note_schema import NoteCreate, NoteResponse
from ..services.notes_service import notes_service
from ..utils.dependencies import require_doctor, require_role

router = APIRouter(prefix="/notes", tags=["Notes"])

@router.post("/", response_model=NoteResponse, status_code=status.HTTP_201_CREATED)
async def create_note(
    note_data: NoteCreate,
    current_user: dict = Depends(require_doctor)
):
    """Create a new clinical observation."""
    doctor_id = current_user.get("doctor_id")
    if not doctor_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Current user is not associated with a doctor profile"
        )
    return await notes_service.create_note(note_data, doctor_id)

@router.get("/patient/{patient_id}", response_model=List[NoteResponse])
async def get_notes_by_patient(
    patient_id: str,
    current_user: dict = Depends(require_doctor)
):
    """Get all clinical notes for a specific patient (path param version)."""
    return await notes_service.get_patient_notes(patient_id)

@router.get("/", response_model=List[NoteResponse])
async def get_notes(
    patient_id: str = Query(...),
    current_user: dict = Depends(require_doctor)
):
    """Get all clinical notes for a specific patient (query param version)."""
    return await notes_service.get_patient_notes(patient_id)

@router.delete("/{note_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_note(
    note_id: str,
    current_user: dict = Depends(require_doctor)
):
    """Delete a specific note."""
    doctor_id = current_user.get("doctor_id")
    if not doctor_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Current user is not associated with a doctor profile"
        )
    
    success = await notes_service.delete_note(note_id, doctor_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Note not found or you don't have permission to delete it"
        )
    return None
