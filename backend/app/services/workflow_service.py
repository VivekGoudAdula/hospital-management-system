from datetime import datetime
from typing import List, Optional, Dict, Any
from bson import ObjectId
from fastapi import HTTPException, status
from ..config.db import get_database
from .ehr_service import ehr_service
from .appointment_service import appointment_service

class WorkflowService:
    def __init__(self):
        self.visits_collection = "visits"
        self.appointments_collection = "appointments"
        self.patients_collection = "patients"
        self.notifications_collection = "notifications"
        self.timeline_collection = "patient_timeline"

    async def create_notification(self, title: str, message: str, role: Optional[str] = None, user_id: Optional[str] = None, type: str = "info"):
        db = get_database()
        notification = {
            "title": title,
            "message": message,
            "role": role,
            "user_id": ObjectId(user_id) if user_id else None,
            "type": type,
            "read_by": [],
            "created_at": datetime.utcnow()
        }
        await db[self.notifications_collection].insert_one(notification)

    async def log_event(self, patient_id: str, event_type: str, title: str, created_by: str, metadata: Dict[str, Any] = None):
        """Wrapper for ehr_service.add_timeline_event to centralize event logging."""
        await ehr_service.add_timeline_event(
            patient_id=patient_id,
            event_type=event_type,
            title=title,
            created_by=created_by,
            metadata=metadata
        )

    async def check_in_patient(self, appointment_id: str, user_id: str) -> Dict[str, Any]:
        """STEP 3 & 4: Patient Check-In and Visit Session Creation."""
        db = get_database()
        
        # 1. Get Appointment
        appt = await db[self.appointments_collection].find_one({"_id": ObjectId(appointment_id)})
        if not appt:
            raise HTTPException(status_code=404, detail="Appointment not found")
            
        # 2. Update Appointment Status
        await db[self.appointments_collection].update_one(
            {"_id": ObjectId(appointment_id)},
            {"$set": {"status": "Checked In", "updated_at": datetime.utcnow()}}
        )
        
        # 3. Create Visit Session
        visit_dict = {
            "patient_id": appt["patient_id"],
            "appointment_id": ObjectId(appointment_id),
            "doctor_id": appt["doctor_id"],
            "department_id": appt.get("department_id"),
            "visit_type": "OPD",
            "status": "Waiting",
            "token_number": appt.get("token"),
            "started_at": datetime.utcnow(),
            "created_by": ObjectId(user_id),
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }
        
        result = await db[self.visits_collection].insert_one(visit_dict)
        visit_dict["id"] = str(result.inserted_id)
        
        # 4. Log Event
        await self.log_event(
            str(appt["patient_id"]),
            "visit",
            "Patient Checked In",
            user_id,
            {"visit_id": visit_dict["id"], "token": visit_dict["token_number"]}
        )
        
        # 5. Notify Doctor
        await self.create_notification(
            "Patient Checked In",
            f"Patient with token {visit_dict['token_number']} is waiting in the queue.",
            user_id=str(appt["doctor_id"]),
            type="info"
        )
        
        # 6. Update Patient Status
        await db[self.patients_collection].update_one(
            {"_id": appt["patient_id"]},
            {"$set": {"status": "Waiting", "updated_at": datetime.utcnow()}}
        )
        
        return ehr_service._serialize_ids(visit_dict)

    async def start_consultation(self, visit_id: str, user_id: str) -> Dict[str, Any]:
        """STEP 5: Start Consultation - Auto Open EHR Session."""
        db = get_database()
        
        visit = await db[self.visits_collection].find_one({"_id": ObjectId(visit_id)})
        if not visit:
            raise HTTPException(status_code=404, detail="Visit not found")
            
        # Update Status
        await db[self.visits_collection].update_one(
            {"_id": ObjectId(visit_id)},
            {"$set": {"status": "In Progress", "updated_at": datetime.utcnow()}}
        )
        
        # Update Appointment if exists
        if visit.get("appointment_id"):
            await db[self.appointments_collection].update_one(
                {"_id": visit["appointment_id"]},
                {"$set": {"status": "In Consultation", "updated_at": datetime.utcnow()}}
            )
            
        # Log Event
        await self.log_event(
            str(visit["patient_id"]),
            "visit",
            "Consultation Started",
            user_id,
            {"visit_id": visit_id}
        )
        
        # Update Patient Status
        await db[self.patients_collection].update_one(
            {"_id": visit["patient_id"]},
            {"$set": {"status": "In Consultation", "updated_at": datetime.utcnow()}}
        )
        
        updated_visit = await db[self.visits_collection].find_one({"_id": ObjectId(visit_id)})
        return ehr_service._serialize_ids(updated_visit)

    async def complete_visit(self, visit_id: str, user_id: str) -> Dict[str, Any]:
        """STEP 16: Visit Closure."""
        db = get_database()
        
        visit = await db[self.visits_collection].find_one({"_id": ObjectId(visit_id)})
        if not visit:
            raise HTTPException(status_code=404, detail="Visit not found")
            
        # Update Status
        now = datetime.utcnow()
        await db[self.visits_collection].update_one(
            {"_id": ObjectId(visit_id)},
            {"$set": {
                "status": "Closed", 
                "completed_at": now,
                "updated_at": now
            }}
        )
        
        # Update Appointment if exists
        if visit.get("appointment_id"):
            await db[self.appointments_collection].update_one(
                {"_id": visit["appointment_id"]},
                {"$set": {"status": "Completed", "updated_at": now}}
            )
            
        # Log Event
        await self.log_event(
            str(visit["patient_id"]),
            "visit",
            "Visit Completed & Signed",
            user_id,
            {"visit_id": visit_id}
        )
        
        # Update Patient Status
        await db[self.patients_collection].update_one(
            {"_id": visit["patient_id"]},
            {"$set": {"status": "Registered", "updated_at": now}}
        )
        
        updated_visit = await db[self.visits_collection].find_one({"_id": ObjectId(visit_id)})
        return ehr_service._serialize_ids(updated_visit)

    async def generate_discharge_summary_data(self, visit_id: str) -> Dict[str, Any]:
        """STEP 15: Discharge Summary Flow - Auto-populate data."""
        db = get_database()
        
        visit = await db[self.visits_collection].find_one({"_id": ObjectId(visit_id)})
        if not visit:
            raise HTTPException(status_code=404, detail="Visit not found")
            
        patient_id = visit["patient_id"]
        
        patient = await db[self.patients_collection].find_one({"_id": patient_id})
        all_vitals = await db["vitals"].find({"visit_id": ObjectId(visit_id)}).to_list(None)
        vitals = sorted(all_vitals, key=lambda x: x.get("recorded_at", datetime.min), reverse=True)[:1] if all_vitals else []
        diagnoses = await db["diagnoses"].find({"visit_id": ObjectId(visit_id)}).to_list(None)
        prescriptions = await db["prescriptions"].find({"visit_id": ObjectId(visit_id)}).to_list(None)
        labs = await db["lab_orders"].find({"visit_id": ObjectId(visit_id)}).to_list(None)
        soap = await db["soap_notes"].find_one({"visit_id": ObjectId(visit_id)})
        
        # Format the data for the frontend to render the PDF
        summary_data = {
            "visit": {
                "id": str(visit["_id"]),
                "started_at": visit.get("started_at"),
                "completed_at": visit.get("completed_at"),
                "status": visit.get("status"),
                "chief_complaint": visit.get("chief_complaint")
            },
            "patient": {
                "name": patient.get("full_name"),
                "mrn": patient.get("mrn"),
                "dob": patient.get("dob"),
                "gender": patient.get("gender")
            },
            "vitals": vitals[0] if vitals else None,
            "diagnoses": diagnoses,
            "prescriptions": prescriptions,
            "labs": labs,
            "soap": soap
        }
        
        # Serialize ObjectIds
        import json
        from bson import json_util
        return json.loads(json_util.dumps(summary_data))

workflow_service = WorkflowService()
