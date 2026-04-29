from fastapi import APIRouter, Depends, status
from typing import List
from ..schemas.note_schema import NoteCreate, NoteResponse
from ..services.note_service import note_service
from ..utils.dependencies import require_doctor

router = APIRouter(prefix="/notes", tags=["Notes"])

@router.post("/", response_model=NoteResponse, status_code=status.HTTP_201_CREATED)
async def create_note(
    note_data: NoteCreate,
    current_user: dict = Depends(require_doctor)
):
    """Create a new clinical observation."""
    return await note_service.create_note(note_data)

@router.get("/patient/{patient_id}", response_model=List[NoteResponse])
async def get_patient_notes(
    patient_id: str,
    current_user: dict = Depends(require_doctor)
):
    """Get all clinical notes for a specific patient."""
    return await note_service.get_notes_by_patient(patient_id)
