from fastapi import APIRouter, Depends, HTTPException, status
from typing import Optional

from ..services.soap_service import soap_service
from ..schemas.soap_schema import (
    SoapNoteCreate,
    SoapNoteUpdate,
    SoapNoteResponse,
    TranscribeRequest,
)
from ..utils.dependencies import get_current_user

router = APIRouter(prefix="/ehr/soap", tags=["SOAP Notes"])


# ─── Role guard ──────────────────────────────────────────────────────────────

async def soap_access_required(current_user: dict = Depends(get_current_user)):
    """Allow only Doctors and Admins to access SOAP note endpoints."""
    if current_user.get("role") not in ["admin", "doctor"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="SOAP Notes access restricted to Admins and Doctors",
        )
    return current_user


# ─── Routes ──────────────────────────────────────────────────────────────────

@router.post("", response_model=SoapNoteResponse, status_code=status.HTTP_201_CREATED)
async def create_soap_note(
    data: SoapNoteCreate,
    current_user: dict = Depends(soap_access_required),
):
    """Create a new draft SOAP note linked to an active visit."""
    doctor_id = current_user.get("doctor_id") or str(current_user["_id"])
    return await soap_service.create_soap_note(data, doctor_id)


@router.get("/{visit_id}", response_model=Optional[SoapNoteResponse])
@router.get("/visit/{visit_id}", response_model=Optional[SoapNoteResponse])
async def get_soap_by_visit(
    visit_id: str,
    current_user: dict = Depends(soap_access_required),
):
    """Retrieve the SOAP note for a given visit. Returns null if none exists yet."""
    return await soap_service.get_soap_by_visit(visit_id)


@router.patch("/{note_id}", response_model=SoapNoteResponse)
async def update_soap_note(
    note_id: str,
    data: SoapNoteUpdate,
    current_user: dict = Depends(soap_access_required),
):
    """Autosave endpoint — partially update SOAP note fields."""
    doctor_id = current_user.get("doctor_id") or str(current_user["_id"])
    role = current_user.get("role", "")

    note = await soap_service.update_soap_note(note_id, data, doctor_id, role)
    if note is None:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Note not found, is already signed, or you lack permission to edit it.",
        )
    return note


@router.post("/{note_id}/sign", response_model=SoapNoteResponse)
async def sign_soap_note(
    note_id: str,
    current_user: dict = Depends(soap_access_required),
):
    """Digitally sign and finalize a SOAP note — makes it read-only for non-admins."""
    doctor_id = current_user.get("doctor_id") or str(current_user["_id"])
    role = current_user.get("role", "")

    note = await soap_service.sign_soap_note(note_id, doctor_id, role)
    if note is None:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Note not found or you lack permission to sign it.",
        )
    return note


@router.post("/transcribe", status_code=status.HTTP_200_OK)
async def transcribe_voice_placeholder(
    data: TranscribeRequest,
    current_user: dict = Depends(soap_access_required),
):
    """
    Voice-to-SOAP transcription placeholder.
    Currently echoes the raw browser speech text.
    Ready for AI pipeline integration in a future sprint.
    """
    return {
        "transcribed": data.audio_text,
        "section": data.section,
        "ai_ready": False,
        "message": "AI transcription pipeline is ready for integration.",
    }
