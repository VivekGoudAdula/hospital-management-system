from datetime import datetime
from typing import Any, Dict, Optional
from bson import ObjectId

from ..config.db import get_database
from ..schemas.soap_schema import SoapNoteCreate, SoapNoteUpdate


class SoapService:
    """Service layer for all SOAP note operations."""

    def __init__(self):
        self.collection_name = "soap_notes"
        self.timeline_collection = "patient_timeline"

    # ─── Create ─────────────────────────────────────────────────────────────

    async def create_soap_note(self, data: SoapNoteCreate, doctor_id: str) -> Dict[str, Any]:
        """Create a new draft SOAP note for a visit and log a timeline event."""
        db = get_database()
        now = datetime.utcnow()

        note_dict: Dict[str, Any] = {
            "patient_id": ObjectId(data.patient_id),
            "visit_id": ObjectId(data.visit_id),
            "doctor_id": ObjectId(doctor_id),
            "subjective": data.subjective,
            "objective": data.objective,
            "assessment": data.assessment,
            "plan": data.plan,
            "status": "draft",
            "signed_at": None,
            "created_at": now,
            "updated_at": now,
        }

        result = await db[self.collection_name].insert_one(note_dict)
        note_dict["_id"] = result.inserted_id
        await self._push_timeline_event(note_dict, "created", doctor_id, db)
        return self._format_note(note_dict)

    # ─── Read ────────────────────────────────────────────────────────────────

    async def get_soap_by_visit(self, visit_id: str) -> Optional[Dict[str, Any]]:
        """Retrieve the SOAP note associated with a specific visit."""
        db = get_database()
        note = await db[self.collection_name].find_one(
            {"visit_id": ObjectId(visit_id)}
        )
        return self._format_note(note) if note else None

    # ─── Update ──────────────────────────────────────────────────────────────

    async def update_soap_note(
        self,
        note_id: str,
        data: SoapNoteUpdate,
        doctor_id: str,
        role: str,
    ) -> Optional[Dict[str, Any]]:
        """
        Autosave PATCH — partially update SOAP content.
        Signed notes are locked for non-admin roles.
        Doctors may only edit their own notes.
        Returns None when caller lacks permission (route raises 403).
        """
        db = get_database()
        note = await db[self.collection_name].find_one({"_id": ObjectId(note_id)})
        if not note:
            return None

        # Signed notes are read-only for non-admins
        if note.get("status") == "signed" and role != "admin":
            return None

        # Doctors can only update their own notes
        if role == "doctor" and str(note.get("doctor_id", "")) != doctor_id:
            return None

        update_fields: Dict[str, Any] = {"updated_at": datetime.utcnow()}
        if data.subjective is not None:
            update_fields["subjective"] = data.subjective
        if data.objective is not None:
            update_fields["objective"] = data.objective
        if data.assessment is not None:
            update_fields["assessment"] = data.assessment
        if data.plan is not None:
            update_fields["plan"] = data.plan

        await db[self.collection_name].update_one(
            {"_id": ObjectId(note_id)},
            {"$set": update_fields},
        )

        updated = await db[self.collection_name].find_one({"_id": ObjectId(note_id)})
        await self._push_timeline_event(updated, "updated", doctor_id, db)
        return self._format_note(updated)

    # ─── Sign ────────────────────────────────────────────────────────────────

    async def sign_soap_note(
        self,
        note_id: str,
        doctor_id: str,
        role: str,
    ) -> Optional[Dict[str, Any]]:
        """
        Digitally sign and finalize a SOAP note.
        Sets status=signed, stores signedAt, and makes note read-only for non-admins.
        Returns None when caller lacks permission.
        """
        db = get_database()
        note = await db[self.collection_name].find_one({"_id": ObjectId(note_id)})
        if not note:
            return None

        # Only note author or admin can sign
        if role == "doctor" and str(note.get("doctor_id", "")) != doctor_id:
            return None

        now = datetime.utcnow()
        await db[self.collection_name].update_one(
            {"_id": ObjectId(note_id)},
            {"$set": {"status": "signed", "signed_at": now, "updated_at": now}},
        )

        signed = await db[self.collection_name].find_one({"_id": ObjectId(note_id)})
        await self._push_timeline_event(signed, "signed", doctor_id, db)
        return self._format_note(signed)

    # ─── Timeline ────────────────────────────────────────────────────────────

    async def _push_timeline_event(
        self,
        note: Dict[str, Any],
        action: str,
        doctor_id: str,
        db: Any,
    ) -> None:
        """Write a SOAP lifecycle event into the patient_timeline collection."""
        action_titles = {
            "created": "SOAP Note Created",
            "updated": "SOAP Note Updated",
            "signed": "SOAP Note Signed & Finalized",
        }
        await db[self.timeline_collection].insert_one({
            "type": "soap",
            "title": action_titles.get(action, "SOAP Note Event"),
            "timestamp": datetime.utcnow(),
            "patient_id": note.get("patient_id"),
            "created_by": doctor_id,
            "metadata": {
                "soap_id": str(note["_id"]),
                "visit_id": str(note.get("visit_id", "")),
                "status": note.get("status", "draft"),
            },
        })

    # ─── Format ──────────────────────────────────────────────────────────────

    def _format_note(self, note: Dict[str, Any]) -> Dict[str, Any]:
        """Convert ObjectId fields to plain strings for JSON serialization."""
        note["id"] = str(note["_id"])
        note["patient_id"] = str(note.get("patient_id", ""))
        note["visit_id"] = str(note.get("visit_id", ""))
        note["doctor_id"] = str(note.get("doctor_id", ""))
        return note


soap_service = SoapService()
