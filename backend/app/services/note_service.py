from datetime import datetime
from typing import List, Dict, Any
from bson import ObjectId
from ..config.db import get_database
from ..schemas.note_schema import NoteCreate

class NoteService:
    def __init__(self):
        self.collection_name = "notes"

    async def create_note(self, note_data: NoteCreate) -> Dict[str, Any]:
        db = get_database()
        note_dict = note_data.dict()
        note_dict["created_at"] = datetime.utcnow()
        note_dict["patient_id"] = ObjectId(note_dict["patient_id"])
        
        result = await db[self.collection_name].insert_one(note_dict)
        note_dict["_id"] = result.inserted_id
        
        # Prepare response
        note_dict["id"] = str(note_dict["_id"])
        note_dict["patient_id"] = str(note_dict["patient_id"])
        return note_dict

    async def get_notes_by_patient(self, patient_id: str) -> List[Dict[str, Any]]:
        db = get_database()
        notes = await db[self.collection_name].find({"patient_id": ObjectId(patient_id)}).sort("created_at", -1).to_list(100)
        
        for note in notes:
            note["id"] = str(note["_id"])
            note["patient_id"] = str(note["patient_id"])
        return notes

note_service = NoteService()
