from datetime import datetime
from typing import List, Optional, Dict, Any
from bson import ObjectId
from fastapi import HTTPException, status
from ..config.db import get_database
from ..schemas.vitals_schema import VitalsCreate, VitalsUpdate
from .ehr_service import ehr_service

class VitalsService:
    def __init__(self):
        self.collection_name = "vitals"

    def calculate_bmi(self, weight_kg: float, height_cm: float) -> tuple[float, str]:
        """Calculates BMI and returns (score, status)."""
        if height_cm <= 0:
            return 0.0, "Unknown"
        
        height_m = height_cm / 100
        bmi = weight_kg / (height_m * height_m)
        bmi = round(bmi, 1)

        if bmi < 18.5:
            status = "Underweight"
        elif 18.5 <= bmi < 25:
            status = "Normal"
        elif 25 <= bmi < 30:
            status = "Overweight"
        else:
            status = "Obese"
            
        return bmi, status

    async def create_vitals(self, recorded_by: str, vitals_data: VitalsCreate) -> Dict[str, Any]:
        db = get_database()
        
        vitals_dict = vitals_data.dict()
        vitals_dict["recorded_by"] = ObjectId(recorded_by)
        vitals_dict["patient_id"] = ObjectId(vitals_dict["patient_id"])
        vitals_dict["visit_id"] = ObjectId(vitals_dict["visit_id"])
        
        # Calculate BMI
        bmi, bmi_status = self.calculate_bmi(vitals_dict["weight"], vitals_dict["height"])
        vitals_dict["bmi"] = bmi
        vitals_dict["bmi_status"] = bmi_status
        
        vitals_dict["created_at"] = datetime.utcnow()
        
        result = await db[self.collection_name].insert_one(vitals_dict)
        vitals_dict["_id"] = result.inserted_id
        
        # Add to Timeline
        description = f"BP {vitals_dict['blood_pressure']['systolic']}/{vitals_dict['blood_pressure']['diastolic']} · Pulse {vitals_dict['pulse']} · Temp {vitals_dict['temperature']}°F"
        await ehr_service.add_timeline_event(
            patient_id=str(vitals_dict["patient_id"]),
            event_type="vitals",
            title="Vitals Recorded",
            description=description,
            created_by=recorded_by,
            metadata={
                "vitals_id": str(result.inserted_id),
                "bp": f"{vitals_dict['blood_pressure']['systolic']}/{vitals_dict['blood_pressure']['diastolic']}",
                "pulse": vitals_dict["pulse"],
                "spo2": vitals_dict["spo2"]
            }
        )
        
        return self._format_vitals(vitals_dict)

    async def get_patient_vitals(self, patient_id: str) -> List[Dict[str, Any]]:
        db = get_database()
        cursor = db[self.collection_name].find({"patient_id": ObjectId(patient_id)})
        vitals_list = await cursor.to_list(1000)
        
        # Sort in Python to avoid Cosmos DB index requirements
        vitals_list.sort(key=lambda x: x.get("created_at", datetime.min), reverse=True)
        
        return [self._format_vitals(v) for v in vitals_list]

    async def get_latest_vitals(self, patient_id: str) -> Optional[Dict[str, Any]]:
        db = get_database()
        vitals_list = await db[self.collection_name].find(
            {"patient_id": ObjectId(patient_id)}
        ).to_list(100)
        
        if not vitals_list:
            return None
            
        # Sort in Python to avoid Cosmos DB index requirements
        vitals_list.sort(key=lambda x: x.get("created_at", datetime.min), reverse=True)
        return self._format_vitals(vitals_list[0])

    async def update_vitals(self, vitals_id: str, vitals_data: VitalsUpdate) -> Dict[str, Any]:
        db = get_database()
        
        update_dict = {k: v for k, v in vitals_data.dict().items() if v is not None}
        
        # Recalculate BMI if weight or height changed
        if "weight" in update_dict or "height" in update_dict:
            # Need existing values for calculation if only one is provided
            existing = await db[self.collection_name].find_one({"_id": ObjectId(vitals_id)})
            weight = update_dict.get("weight", existing["weight"])
            height = update_dict.get("height", existing["height"])
            bmi, bmi_status = self.calculate_bmi(weight, height)
            update_dict["bmi"] = bmi
            update_dict["bmi_status"] = bmi_status

        result = await db[self.collection_name].update_one(
            {"_id": ObjectId(vitals_id)},
            {"$set": update_dict}
        )
        
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Vitals record not found")
            
        updated_vitals = await db[self.collection_name].find_one({"_id": ObjectId(vitals_id)})
        return self._format_vitals(updated_vitals)

    async def delete_vitals(self, vitals_id: str) -> None:
        db = get_database()
        result = await db[self.collection_name].delete_one({"_id": ObjectId(vitals_id)})
        
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Vitals record not found")

    def _format_vitals(self, vitals: Dict[str, Any]) -> Dict[str, Any]:
        vitals["id"] = str(vitals["_id"])
        vitals["patient_id"] = str(vitals["patient_id"])
        vitals["visit_id"] = str(vitals["visit_id"])
        vitals["recorded_by"] = str(vitals["recorded_by"])
        del vitals["_id"]
        return vitals

vitals_service = VitalsService()
