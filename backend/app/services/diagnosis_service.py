import json
import os
from datetime import datetime
from typing import List, Optional, Dict, Any
from bson import ObjectId
from fastapi import HTTPException
from ..config.db import get_database
from ..schemas.diagnosis_schema import DiagnosisCreate, DiagnosisUpdate

class DiagnosisService:
    def __init__(self):
        self.collection = "diagnoses"
        self.timeline_collection = "patient_timeline"
        self.icd_data_path = os.path.join(os.path.dirname(__file__), "..", "data", "icd10_codes.json")

    def _format_diagnosis(self, diag: Dict[str, Any]) -> Dict[str, Any]:
        if not diag:
            return diag
        diag["id"] = str(diag["_id"])
        del diag["_id"]
        diag["patient_id"] = str(diag["patient_id"])
        diag["visit_id"] = str(diag["visit_id"])
        diag["doctor_id"] = str(diag["doctor_id"])
        return diag

    async def search_icd_codes(self, query: str) -> List[Dict[str, str]]:
        try:
            with open(self.icd_data_path, "r") as f:
                codes = json.load(f)
            
            query = query.lower()
            results = []
            for item in codes:
                if (query in item["code"].lower() or 
                    query in item["label"].lower() or 
                    any(query in k.lower() for k in item.get("keywords", []))):
                    results.append({
                        "code": item["code"],
                        "label": item["label"]
                    })
            
            return results[:20]  # Limit results
        except Exception as e:
            print(f"Error searching ICD codes: {e}")
            return []

    async def get_diagnosis_by_visit(self, visit_id: str) -> Optional[Dict[str, Any]]:
        db = get_database()
        diag = await db[self.collection].find_one({"visit_id": ObjectId(visit_id)})
        return self._format_diagnosis(diag)

    async def create_diagnosis(self, data: DiagnosisCreate, doctor_id: str) -> Dict[str, Any]:
        db = get_database()
        
        # Check if diagnosis already exists for this visit
        existing = await db[self.collection].find_one({"visit_id": ObjectId(data.visit_id)})
        if existing:
            # If exists, we might want to update it instead or raise error. 
            # Prompt says "add diagnoses to a visit", but usually one visit has one diagnosis record with primary/secondary.
            # I'll update it if it exists to maintain one record per visit as per schema.
            return await self.update_diagnosis(str(existing["_id"]), DiagnosisUpdate(**data.dict()), doctor_id)

        diag_dict = data.dict()
        diag_dict["patient_id"] = ObjectId(data.patient_id)
        diag_dict["visit_id"] = ObjectId(data.visit_id)
        diag_dict["doctor_id"] = ObjectId(doctor_id)
        diag_dict["created_at"] = datetime.utcnow()
        diag_dict["updated_at"] = datetime.utcnow()

        result = await db[self.collection].insert_one(diag_dict)
        diag_dict["_id"] = result.inserted_id

        # Add to timeline
        await db[self.timeline_collection].insert_one({
            "patient_id": diag_dict["patient_id"], # patient_id is already ObjectId, this is fine for query but let's keep it consistent
            "type": "diagnosis",
            "title": "Primary Diagnosis Added",
            "description": data.primary_diagnosis.label,
            "timestamp": datetime.utcnow(),
            "created_by": str(doctor_id),
            "metadata": {
                "visit_id": str(diag_dict["visit_id"]),
                "code": data.primary_diagnosis.code
            }
        })

        return self._format_diagnosis(diag_dict)

    async def update_diagnosis(self, diag_id: str, data: DiagnosisUpdate, doctor_id: str) -> Dict[str, Any]:
        db = get_database()
        update_dict = {k: v for k, v in data.dict().items() if v is not None}
        update_dict["updated_at"] = datetime.utcnow()

        result = await db[self.collection].find_one_and_update(
            {"_id": ObjectId(diag_id)},
            {"$set": update_dict},
            return_document=True
        )

        if not result:
            raise HTTPException(status_code=404, detail="Diagnosis not found")

        # Add to timeline
        await db[self.timeline_collection].insert_one({
            "patient_id": result["patient_id"],
            "type": "diagnosis",
            "title": "Diagnosis Updated",
            "description": result["primary_diagnosis"]["label"],
            "timestamp": datetime.utcnow(),
            "created_by": str(doctor_id),
            "metadata": {
                "visit_id": str(result["visit_id"]),
                "code": result["primary_diagnosis"]["code"]
            }
        })

        return self._format_diagnosis(result)

    async def delete_diagnosis(self, diag_id: str) -> bool:
        db = get_database()
        result = await db[self.collection].delete_one({"_id": ObjectId(diag_id)})
        return result.deleted_count > 0

diagnosis_service = DiagnosisService()
