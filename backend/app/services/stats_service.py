from typing import Dict, Any
from ..config.db import db

class StatsService:
    async def get_dashboard_stats(self) -> Dict[str, Any]:
        """Get aggregate statistics for the dashboard."""
        
        # Total counts
        total_patients = await db.db.patients.count_documents({})
        total_doctors = await db.db.doctors.count_documents({})
        total_departments = await db.db.departments.count_documents({})
        total_documents = await db.db.documents.count_documents({})
        
        # Status counts for patients
        admitted_now = await db.db.patients.count_documents({"status": {"$in": ["In Treatment", "Critical"]}})
        critical_care = await db.db.patients.count_documents({"status": "Critical"})
        out_patient = await db.db.patients.count_documents({"status": "Stable"})
        discharged = await db.db.patients.count_documents({"status": "Discharged"})
        
        return {
            "total_patients": total_patients,
            "total_doctors": total_doctors,
            "total_departments": total_departments,
            "total_documents": total_documents,
            "admitted_now": admitted_now,
            "critical_care": critical_care,
            "out_patient": out_patient,
            "discharged": discharged,
            "trends": {
                "patients": "+12%", 
                "doctors": "Stable",
                "services": "Active",
                "records": "+5%"
            }
        }

    async def get_reports(self, start_date: str, end_date: str) -> Dict[str, Any]:
        """Generate detailed reports for a specific date range."""
        
        # 1. Doctor Workload (Appointments per doctor)
        pipeline = [
            {"$match": {"appointment_date": {"$gte": start_date, "$lte": end_date}}},
            {"$group": {"_id": "$doctor_id", "count": {"$sum": 1}}}
        ]
        workload_cursor = db.db.appointments.aggregate(pipeline)
        workload_raw = await workload_cursor.to_list(100)
        
        workload_data = []
        for item in workload_raw:
            doctor = await db.db.doctors.find_one({"_id": item["_id"]})
            workload_data.append({
                "doctor": doctor["name"] if doctor else "Unknown",
                "patients": item["count"]
            })
            
        # 2. Patient Volume (Appointments per day)
        pipeline = [
            {"$match": {"appointment_date": {"$gte": start_date, "$lte": end_date}}},
            {"$group": {"_id": "$appointment_date", "count": {"$sum": 1}}},
            {"$sort": {"_id": 1}}
        ]
        volume_cursor = db.db.appointments.aggregate(pipeline)
        volume_raw = await volume_cursor.to_list(100)
        
        volume_data = [{"date": item["_id"], "count": item["count"]} for item in volume_raw]
        
        return {
            "workload": workload_data,
            "volume": volume_data,
            "summary": {
                "total_appointments": sum(item["count"] for item in volume_raw),
                "unique_doctors": len(workload_data)
            }
        }

stats_service = StatsService()
