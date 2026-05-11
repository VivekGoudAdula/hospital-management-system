from datetime import datetime
from typing import List, Optional, Dict, Any
from bson import ObjectId
from fastapi import HTTPException, status
from ..config.db import get_database
from ..models.appointment_model import AppointmentDB
from ..schemas.appointment_schema import AppointmentCreate, AppointmentUpdate, AppointmentResponse
from ..utils.email_utils import send_email, get_appointment_email_template
import asyncio

class AppointmentService:
    def __init__(self):
        self.collection_name = "appointments"

    async def create_appointment(self, appointment_data: AppointmentCreate) -> Dict[str, Any]:
        db = get_database()
        
        # Check for slot availability (simplified for now)
        existing = await db[self.collection_name].find_one({
            "doctor_id": ObjectId(appointment_data.doctor_id),
            "appointment_date": appointment_data.appointment_date,
            "appointment_time": appointment_data.appointment_time,
            "status": {"$ne": "Cancelled"}
        })
        if existing:
            raise HTTPException(status_code=400, detail="This slot is already booked for the selected doctor.")
        
        appointment_dict = appointment_data.dict()
        appointment_dict["created_at"] = datetime.utcnow()
        appointment_dict["updated_at"] = datetime.utcnow()
        appointment_dict["status"] = "Upcoming"
        
        # Generate token
        count = await db[self.collection_name].count_documents({})
        appointment_dict["token"] = f"TKN-{1001 + count}"
        
        # Convert IDs to ObjectId
        appointment_dict["patient_id"] = ObjectId(appointment_dict["patient_id"])
        appointment_dict["doctor_id"] = ObjectId(appointment_dict["doctor_id"])
        if appointment_dict.get("department_id"):
            appointment_dict["department_id"] = ObjectId(appointment_dict["department_id"])

        result = await db[self.collection_name].insert_one(appointment_dict)
        appointment_dict["_id"] = result.inserted_id
        
        appointment = await self.get_appointment_by_id(str(result.inserted_id))
        
        # Send Confirmation Email (Background)
        patient = await db["patients"].find_one({"_id": ObjectId(appointment["patient_id"])})
        if patient and patient.get("email"):
            email_html = get_appointment_email_template(
                patient_name=patient["full_name"],
                doctor_name=appointment["doctor_name"],
                date=appointment["appointment_date"],
                time=appointment["appointment_time"],
                token=appointment["token"],
                action_type="confirmed"
            )
            asyncio.create_task(send_email(
                to_email=patient["email"],
                subject=f"Appointment Confirmed - ApexCare Hospital ({appointment['token']})",
                body_html=email_html
            ))
            
        return appointment

    async def get_appointments(self, filters: Dict[str, Any]) -> List[Dict[str, Any]]:
        db = get_database()
        query = {}
        
        if filters.get("patient_id"):
            query["patient_id"] = ObjectId(filters["patient_id"])
        if filters.get("doctor_id"):
            query["doctor_id"] = ObjectId(filters["doctor_id"])
        if filters.get("date"):
            query["appointment_date"] = filters["date"]
        if filters.get("status"):
            query["status"] = filters["status"]

        appointments = await db[self.collection_name].find(query).to_list(1000)
        appointments.sort(key=lambda x: x.get("appointment_date", ""))
        
        # Enrich with names
        for app in appointments:
            app["id"] = str(app["_id"])
            app["patient_id"] = str(app["patient_id"])
            app["doctor_id"] = str(app["doctor_id"])
            if app.get("department_id"):
                app["department_id"] = str(app["department_id"])
            
            # Fetch names (optimized in real apps with lookups)
            patient = await db["patients"].find_one({"_id": ObjectId(app["patient_id"])})
            doctor = await db["doctors"].find_one({"_id": ObjectId(app["doctor_id"])})
            dept = await db["departments"].find_one({"_id": ObjectId(app["department_id"])}) if app.get("department_id") else None
            
            app["patient_name"] = patient["full_name"] if patient else "Unknown"
            app["doctor_name"] = doctor["name"] if doctor else "Unknown"
            app["department_name"] = dept["name"] if dept else "General"
                
        return appointments

    async def get_appointment_by_id(self, appointment_id: str) -> Dict[str, Any]:
        db = get_database()
        app = await db[self.collection_name].find_one({"_id": ObjectId(appointment_id)})
        if not app:
            raise HTTPException(status_code=404, detail="Appointment not found")
        
        app["id"] = str(app["_id"])
        app["patient_id"] = str(app["patient_id"])
        app["doctor_id"] = str(app["doctor_id"])
        if app.get("department_id"):
            app["department_id"] = str(app["department_id"])
            
        patient = await db["patients"].find_one({"_id": ObjectId(app["patient_id"])})
        doctor = await db["doctors"].find_one({"_id": ObjectId(app["doctor_id"])})
        dept = await db["departments"].find_one({"_id": ObjectId(app["department_id"])}) if app.get("department_id") else None
        
        app["patient_name"] = patient["full_name"] if patient else "Unknown"
        app["doctor_name"] = doctor["name"] if doctor else "Unknown"
        app["department_name"] = dept["name"] if dept else "General"
        
        return app

    async def update_appointment(self, appointment_id: str, app_data: AppointmentUpdate) -> Dict[str, Any]:
        db = get_database()
        update_dict = {k: v for k, v in app_data.dict().items() if v is not None}
        
        if not update_dict:
            return await self.get_appointment_by_id(appointment_id)
            
        update_dict["updated_at"] = datetime.utcnow()
        
        result = await db[self.collection_name].update_one(
            {"_id": ObjectId(appointment_id)},
            {"$set": update_dict}
        )
        
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Appointment not found")
            
        updated_app = await self.get_appointment_by_id(appointment_id)
        
        # If rescheduled, send email
        if "appointment_date" in update_dict or "appointment_time" in update_dict:
            patient = await db["patients"].find_one({"_id": ObjectId(updated_app["patient_id"])})
            if patient and patient.get("email"):
                email_html = get_appointment_email_template(
                    patient_name=patient["full_name"],
                    doctor_name=updated_app["doctor_name"],
                    date=updated_app["appointment_date"],
                    time=updated_app["appointment_time"],
                    token=updated_app["token"],
                    action_type="rescheduled"
                )
                asyncio.create_task(send_email(
                    to_email=patient["email"],
                    subject=f"Appointment Rescheduled - ApexCare Hospital ({updated_app['token']})",
                    body_html=email_html
                ))

        return updated_app

    async def delete_appointment(self, appointment_id: str) -> None:
        db = get_database()
        result = await db[self.collection_name].delete_one({"_id": ObjectId(appointment_id)})
        
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Appointment not found")

appointment_service = AppointmentService()
