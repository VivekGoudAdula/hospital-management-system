from datetime import datetime
from typing import List, Optional, Dict, Any
from bson import ObjectId
from fastapi import HTTPException, status
from ..config.db import get_database
from ..schemas.visit_schema import VisitCreate, VisitUpdate, TimelineItem

class EHRService:
    def __init__(self):
        self.visits_collection = "visits"
        self.patients_collection = "patients"

    def _serialize_ids(self, data: Any) -> Any:
        """Recursively convert ObjectId to str in any data structure."""
        if isinstance(data, list):
            return [self._serialize_ids(item) for item in data]
        elif isinstance(data, dict):
            return {k: self._serialize_ids(v) for k, v in data.items()}
        elif isinstance(data, ObjectId):
            return str(data)
        return data

    def _format_visit(self, visit: Dict[str, Any]) -> Dict[str, Any]:
        """Helper to format a visit document for API response."""
        if not visit:
            return visit
            
        # Map legacy fields (started_at -> admission_date)
        if not visit.get("admission_date") and visit.get("started_at"):
            visit["admission_date"] = visit["started_at"]
        
        # Ensure required fields for Pydantic exist
        if not visit.get("admission_date"):
            visit["admission_date"] = visit.get("created_at", datetime.utcnow())

        if not visit.get("created_at"):
            visit["created_at"] = visit.get("admission_date", datetime.utcnow())
        
        if not visit.get("updated_at"):
            visit["updated_at"] = visit.get("created_at", datetime.utcnow())

        visit["id"] = str(visit["_id"])
        if "_id" in visit:
            del visit["_id"]
            
        visit["patient_id"] = str(visit.get("patient_id", ""))
        
        if visit.get("doctor_id"):
            visit["doctor_id"] = str(visit["doctor_id"])
        if visit.get("department_id"):
            visit["department_id"] = str(visit["department_id"])
            
        if visit.get("created_by"):
            visit["created_by"] = str(visit["created_by"])
        else:
            visit["created_by"] = "System"
            
        return visit

    async def get_active_visit(self, patient_id: str) -> Optional[Dict[str, Any]]:
        db = get_database()
        visit = await db[self.visits_collection].find_one({
            "patient_id": ObjectId(patient_id),
            "status": "active"
        })
        return self._format_visit(visit)

    async def create_visit(self, visit_data: VisitCreate, created_by: str) -> Dict[str, Any]:
        db = get_database()
        
        visit_dict = visit_data.dict()
        visit_dict["patient_id"] = ObjectId(visit_dict["patient_id"])
        
        if visit_dict.get("doctor_id"):
            visit_dict["doctor_id"] = ObjectId(visit_dict["doctor_id"])
        if visit_dict.get("department_id"):
            visit_dict["department_id"] = ObjectId(visit_dict["department_id"])
            
        visit_dict["created_by"] = ObjectId(created_by)
        visit_dict["status"] = "active"
        visit_dict["admission_date"] = datetime.utcnow()
        visit_dict["created_at"] = datetime.utcnow()
        visit_dict["updated_at"] = datetime.utcnow()
        
        result = await db[self.visits_collection].insert_one(visit_dict)
        visit_dict["_id"] = result.inserted_id
        
        return self._format_visit(visit_dict)

    async def get_or_create_active_visit(self, patient_id: str, doctor_id: str, department_id: Optional[str] = None) -> Dict[str, Any]:
        active_visit = await self.get_active_visit(patient_id)
        if active_visit:
            return active_visit
        
        # Auto-create visit
        visit_create = VisitCreate(
            patient_id=patient_id,
            doctor_id=doctor_id,
            department_id=department_id,
            visit_type="OPD",
            chief_complaint="Routine Checkup (Auto-generated)"
        )
        return await self.create_visit(visit_create, doctor_id)

    async def get_visit_by_id(self, visit_id: str) -> Dict[str, Any]:
        db = get_database()
        visit = await db[self.visits_collection].find_one({"_id": ObjectId(visit_id)})
        if not visit:
            raise HTTPException(status_code=404, detail="Visit not found")
        
        return self._format_visit(visit)

    async def update_visit(self, visit_id: str, visit_data: VisitUpdate) -> Dict[str, Any]:
        db = get_database()
        update_dict = {k: v for k, v in visit_data.dict().items() if v is not None}
        update_dict["updated_at"] = datetime.utcnow()
        
        if update_dict.get("doctor_id"):
            update_dict["doctor_id"] = ObjectId(update_dict["doctor_id"])
        if update_dict.get("department_id"):
            update_dict["department_id"] = ObjectId(update_dict["department_id"])
            
        result = await db[self.visits_collection].update_one(
            {"_id": ObjectId(visit_id)},
            {"$set": update_dict}
        )
        
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Visit not found")
            
        return await self.get_visit_by_id(visit_id)

    async def get_patient_visit_history(self, patient_id: str) -> List[Dict[str, Any]]:
        db = get_database()
        cursor = db[self.visits_collection].find({"patient_id": ObjectId(patient_id)})
        visits = await cursor.to_list(100)
        
        # Format each visit
        formatted_visits = [self._format_visit(v) for v in visits]
        
        # Sort in Python to avoid Cosmos DB index requirements
        formatted_visits.sort(key=lambda x: x.get("admission_date", datetime.min), reverse=True)
            
        return formatted_visits

    async def get_patient_timeline(self, patient_id: str) -> List[Dict[str, Any]]:
        """Aggregate all clinical events into a single sorted patient timeline."""
        db = get_database()
        timeline = []

        # 1 — Visit events
        visits = await self.get_patient_visit_history(patient_id)
        for v in visits:
            timeline.append({
                "type": "visit",
                "title": f"Visit - {v['visit_type']}",
                "timestamp": v["admission_date"],
                "created_by": v["created_by"],
                "metadata": {"status": v["status"], "visit_id": v["id"]},
            })

        # 2 — SOAP events from patient_timeline collection
        try:
            soap_events = await db["patient_timeline"].find(
                {"patient_id": ObjectId(patient_id)}
            ).to_list(200)
            for event in soap_events:
                timeline.append({
                    "type": event.get("type", "soap"),
                    "title": event.get("title", "SOAP Event"),
                    "timestamp": event.get("timestamp", datetime.utcnow()),
                    "created_by": str(event.get("created_by", "")),
                    "metadata": self._serialize_ids(event.get("metadata", {})),
                })
        except Exception:
            pass  # Timeline is best-effort; visits still returned

        # Sort in Python — avoids Cosmos DB index requirements
        timeline.sort(key=lambda x: x.get("timestamp", datetime.min), reverse=True)
        return timeline

ehr_service = EHRService()

