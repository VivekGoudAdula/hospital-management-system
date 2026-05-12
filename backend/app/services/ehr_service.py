from datetime import datetime
from typing import List, Optional, Dict, Any
from bson import ObjectId
from fastapi import HTTPException, status
from ..config.db import get_database
from ..schemas.visit_schema import VisitCreate, VisitUpdate, TimelineItem
from ..schemas.lab_schema import LabOrderCreate, LabOrderUpdate
from ..schemas.referral_schema import ReferralCreate, ReferralUpdate
from ..schemas.document_study_schema import DocumentStudyCreate, DocumentStudyUpdate

class EHRService:
    def __init__(self):
        self.visits_collection = "visits"
        self.patients_collection = "patients"
        self.lab_orders_collection = "lab_orders"
        self.referrals_collection = "referrals"
        self.document_studies_collection = "document_studies"
        self.timeline_collection = "patient_timeline"

    def _serialize_ids(self, data: Any) -> Any:
        """Recursively convert ObjectId to str and map _id to id."""
        if isinstance(data, list):
            return [self._serialize_ids(item) for item in data]
        elif isinstance(data, dict):
            # Map _id to id if present
            if "_id" in data and "id" not in data:
                data["id"] = str(data["_id"])
            
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

        # 2 — SOAP events from timeline collection
        try:
            soap_events = await db[self.timeline_collection].find(
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
            pass

        # 3 — Lab Orders
        try:
            labs = await db[self.lab_orders_collection].find(
                {"patient_id": ObjectId(patient_id)}
            ).to_list(100)
            for l in labs:
                timeline.append({
                    "type": "lab",
                    "title": f"Lab Order: {l['test_name']}",
                    "timestamp": l["ordered_at"],
                    "created_by": str(l["ordered_by"]),
                    "metadata": {"status": l["status"], "id": str(l["_id"])},
                })
        except Exception:
            pass

        # 4 — Referrals
        try:
            referrals = await db[self.referrals_collection].find(
                {"patient_id": ObjectId(patient_id)}
            ).to_list(100)
            for r in referrals:
                timeline.append({
                    "type": "referral",
                    "title": f"Referral: {r['reason']}",
                    "timestamp": r["created_at"],
                    "created_by": str(r["referred_by"]),
                    "metadata": {"status": r["status"], "id": str(r["_id"])},
                })
        except Exception:
            pass

        # 5 — Document Studies
        try:
            studies = await db[self.document_studies_collection].find(
                {"patient_id": ObjectId(patient_id)}
            ).to_list(100)
            for s in studies:
                timeline.append({
                    "type": "document",
                    "title": f"Study Uploaded: {s['category']}",
                    "timestamp": s["created_at"],
                    "created_by": str(s["uploaded_by"]),
                    "metadata": {"category": s["category"], "id": str(s["_id"])},
                })
        except Exception:
            pass

        # Sort in Python — avoids Cosmos DB index requirements
        timeline.sort(key=lambda x: x.get("timestamp", datetime.min), reverse=True)
        return timeline

    async def add_timeline_event(self, patient_id: str, event_type: str, title: str, created_by: str, description: str = "", metadata: Dict[str, Any] = None) -> None:
        """Centralized method to log clinical events into the patient timeline."""
        db = get_database()
        await db[self.timeline_collection].insert_one({
            "type": event_type,
            "title": title,
            "description": description,
            "timestamp": datetime.utcnow(),
            "patient_id": ObjectId(patient_id),
            "created_by": ObjectId(created_by) if isinstance(created_by, str) and len(created_by) == 24 else created_by,
            "metadata": metadata or {}
        })

    # ── Lab Order Actions ──────────────────────────────────────────────────

    async def create_lab_order(self, data: LabOrderCreate, user_id: str) -> Dict[str, Any]:
        db = get_database()
        order_dict = data.dict()
        order_dict["patient_id"] = ObjectId(order_dict["patient_id"])
        order_dict["visit_id"] = ObjectId(order_dict["visit_id"])
        order_dict["ordered_by"] = ObjectId(user_id)
        if order_dict.get("department_id"):
            order_dict["department_id"] = ObjectId(order_dict["department_id"])
        
        order_dict["status"] = "Ordered"
        order_dict["ordered_at"] = datetime.utcnow()
        order_dict["result_document_ids"] = []
        
        result = await db[self.lab_orders_collection].insert_one(order_dict)
        order_dict["id"] = str(result.inserted_id)
        
        # Add to timeline
        await self.add_timeline_event(
            str(order_dict["patient_id"]),
            "lab",
            f"Lab Test Ordered: {order_dict['test_name']}",
            user_id,
            metadata={"order_id": order_dict["id"], "category": order_dict["category"]}
        )
        
        return self._serialize_ids(order_dict)

    async def get_visit_lab_orders(self, visit_id: str) -> List[Dict[str, Any]]:
        db = get_database()
        cursor = db[self.lab_orders_collection].find({"visit_id": ObjectId(visit_id)})
        orders = await cursor.to_list(100)
        return self._serialize_ids(orders)

    async def get_patient_lab_history(self, patient_id: str) -> List[Dict[str, Any]]:
        db = get_database()
        cursor = db[self.lab_orders_collection].find({"patient_id": ObjectId(patient_id)})
        orders = await cursor.to_list(100)
        return self._serialize_ids(orders)

    async def update_lab_order(self, order_id: str, data: LabOrderUpdate) -> Dict[str, Any]:
        db = get_database()
        update_dict = {k: v for k, v in data.dict().items() if v is not None}
        
        if update_dict.get("result_document_ids"):
            update_dict["result_document_ids"] = [ObjectId(rid) for rid in update_dict["result_document_ids"]]
            
        await db[self.lab_orders_collection].update_one(
            {"_id": ObjectId(order_id)},
            {"$set": update_dict}
        )
        
        order = await db[self.lab_orders_collection].find_one({"_id": ObjectId(order_id)})
        
        # If status is updated to completed, add timeline event
        if data.status == "Completed":
            await self.add_timeline_event(
                str(order["patient_id"]),
                "lab",
                f"Lab Results Ready: {order['test_name']}",
                str(order["ordered_by"]),
                metadata={"order_id": order_id, "status": "Completed"}
            )
            
        return self._serialize_ids(order)

    # ── Referral Actions ──────────────────────────────────────────────────

    async def create_referral(self, data: ReferralCreate, user_id: str) -> Dict[str, Any]:
        db = get_database()
        ref_dict = data.dict()
        ref_dict["patient_id"] = ObjectId(ref_dict["patient_id"])
        ref_dict["visit_id"] = ObjectId(ref_dict["visit_id"])
        ref_dict["referred_by"] = ObjectId(user_id)
        
        if ref_dict.get("referred_doctor_id"):
            ref_dict["referred_doctor_id"] = ObjectId(ref_dict["referred_doctor_id"])
        if ref_dict.get("referred_department_id"):
            ref_dict["referred_department_id"] = ObjectId(ref_dict["referred_department_id"])
            
        ref_dict["status"] = "Sent"
        ref_dict["created_at"] = datetime.utcnow()
        ref_dict["updated_at"] = datetime.utcnow()
        
        result = await db[self.referrals_collection].insert_one(ref_dict)
        ref_dict["id"] = str(result.inserted_id)
        
        # Add to timeline
        await self.add_timeline_event(
            str(ref_dict["patient_id"]),
            "referral",
            f"Patient Referral: {ref_dict['priority']}",
            user_id,
            metadata={"referral_id": ref_dict["id"], "reason": ref_dict["reason"]}
        )
        
        return self._serialize_ids(ref_dict)

    async def get_patient_referrals(self, patient_id: str) -> List[Dict[str, Any]]:
        db = get_database()
        cursor = db[self.referrals_collection].find({"patient_id": ObjectId(patient_id)})
        refs = await cursor.to_list(100)
        return self._serialize_ids(refs)

    async def update_referral(self, ref_id: str, data: ReferralUpdate) -> Dict[str, Any]:
        db = get_database()
        update_dict = {k: v for k, v in data.dict().items() if v is not None}
        update_dict["updated_at"] = datetime.utcnow()
        
        await db[self.referrals_collection].update_one(
            {"_id": ObjectId(ref_id)},
            {"$set": update_dict}
        )
        
        ref = await db[self.referrals_collection].find_one({"_id": ObjectId(ref_id)})
        return self._serialize_ids(ref)

    # ── Document Study Actions ──────────────────────────────────────────

    async def create_document_study(self, data: DocumentStudyCreate, user_id: str) -> Dict[str, Any]:
        db = get_database()
        study_dict = data.dict()
        study_dict["patient_id"] = ObjectId(study_dict["patient_id"])
        study_dict["visit_id"] = ObjectId(study_dict["visit_id"])
        study_dict["uploaded_by"] = ObjectId(user_id)
        
        study_dict["status"] = "Pending Review"
        study_dict["created_at"] = datetime.utcnow()
        study_dict["updated_at"] = datetime.utcnow()
        
        result = await db[self.document_studies_collection].insert_one(study_dict)
        study_dict["id"] = str(result.inserted_id)
        
        # Add to timeline
        await self.add_timeline_event(
            str(study_dict["patient_id"]),
            "document",
            f"Clinical Study Uploaded: {study_dict['category']}",
            user_id,
            metadata={"study_id": study_dict["id"], "files_count": len(study_dict["files"])}
        )
        
        return self._serialize_ids(study_dict)

    async def get_patient_document_studies(self, patient_id: str) -> List[Dict[str, Any]]:
        db = get_database()
        cursor = db[self.document_studies_collection].find({"patient_id": ObjectId(patient_id)})
        studies = await cursor.to_list(100)
        
        # Format for legacy data
        for s in studies:
            if "study_type" in s and "category" not in s:
                s["category"] = s["study_type"]
            if "scan_date" in s and "created_at" not in s:
                s["created_at"] = s["scan_date"]
                
        return self._serialize_ids(studies)

    async def update_document_study(self, study_id: str, data: DocumentStudyUpdate) -> Dict[str, Any]:
        db = get_database()
        update_dict = {k: v for k, v in data.dict().items() if v is not None}
        update_dict["updated_at"] = datetime.utcnow()
        
        await db[self.document_studies_collection].update_one(
            {"_id": ObjectId(study_id)},
            {"$set": update_dict}
        )
        
        study = await db[self.document_studies_collection].find_one({"_id": ObjectId(study_id)})
        return self._serialize_ids(study)

ehr_service = EHRService()

