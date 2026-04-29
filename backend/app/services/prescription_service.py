from datetime import datetime
from typing import List, Dict, Any, Optional
from bson import ObjectId
from fastapi import HTTPException, status
from ..config.db import get_database
from ..schemas.prescription_schema import PrescriptionCreate

class PrescriptionService:
    def __init__(self):
        self.collection_name = "prescriptions"

    async def create_prescription(self, data: PrescriptionCreate, doctor_id: str) -> Dict[str, Any]:
        db = get_database()
        
        # Verify patient exists
        patient = await db["patients"].find_one({"_id": ObjectId(data.patient_id)})
        if not patient:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Patient not found"
            )

        prescription_dict = data.dict()
        prescription_dict["patient_id"] = ObjectId(data.patient_id)
        prescription_dict["doctor_id"] = ObjectId(doctor_id)
        prescription_dict["created_at"] = datetime.utcnow()

        result = await db[self.collection_name].insert_one(prescription_dict)
        prescription_dict["_id"] = result.inserted_id
        
        return self._format_prescription(prescription_dict)

    async def get_patient_prescriptions(self, patient_id: str) -> List[Dict[str, Any]]:
        db = get_database()
        prescriptions = await db[self.collection_name].find(
            {"patient_id": ObjectId(patient_id)}
        ).to_list(100)
        
        # Sort in memory by created_at descending
        prescriptions.sort(key=lambda x: x.get("created_at", datetime.min), reverse=True)
        return [self._format_prescription(p) for p in prescriptions]

    async def get_prescription(self, prescription_id: str) -> Optional[Dict[str, Any]]:
        db = get_database()
        prescription = await db[self.collection_name].find_one({"_id": ObjectId(prescription_id)})
        if prescription:
            return self._format_prescription(prescription)
        return None

    def _format_prescription(self, prescription: Dict[str, Any]) -> Dict[str, Any]:
        prescription["id"] = str(prescription["_id"])
        prescription["patient_id"] = str(prescription["patient_id"])
        prescription["doctor_id"] = str(prescription["doctor_id"])
        return prescription

prescription_service = PrescriptionService()
