from datetime import datetime
from typing import List, Optional, Dict, Any
from bson import ObjectId
from fastapi import HTTPException, status
from ..config.db import get_database
from ..schemas.ot_schema import OTBookingCreate, OTBookingUpdate

class OTService:
    def __init__(self):
        self.collection_name = "ot_bookings"

    async def create_booking(self, booking_data: OTBookingCreate) -> Dict[str, Any]:
        db = get_database()
        
        # Conflict check: same OT, same date, overlapping time
        # This is a basic overlap check
        overlapping = await db[self.collection_name].find_one({
            "theatre_id": booking_data.theatre_id,
            "surgery_date": booking_data.surgery_date,
            "status": {"$ne": "Cancelled"},
            "$or": [
                {
                    "start_time": {"$lt": booking_data.end_time},
                    "end_time": {"$gt": booking_data.start_time}
                }
            ]
        })
        
        if overlapping:
            raise HTTPException(status_code=400, detail="OT is already booked for this time slot.")
            
        booking_dict = booking_data.dict()
        booking_dict["created_at"] = datetime.utcnow()
        booking_dict["updated_at"] = datetime.utcnow()
        booking_dict["status"] = "Scheduled"
        
        booking_dict["patient_id"] = ObjectId(booking_dict["patient_id"])
        booking_dict["surgeon_id"] = ObjectId(booking_dict["surgeon_id"])

        result = await db[self.collection_name].insert_one(booking_dict)
        return await self.get_booking_by_id(str(result.inserted_id))

    async def get_bookings(self, filters: Dict[str, Any]) -> List[Dict[str, Any]]:
        db = get_database()
        query = {}
        
        if filters.get("date"):
            query["surgery_date"] = filters["date"]
        if filters.get("theatre_id"):
            query["theatre_id"] = filters["theatre_id"]
        if filters.get("surgeon_id"):
            query["surgeon_id"] = ObjectId(filters["surgeon_id"])

        bookings = await db[self.collection_name].find(query).to_list(1000)
        bookings.sort(key=lambda x: x.get("start_time", ""))
        
        for b in bookings:
            b["id"] = str(b["_id"])
            b["patient_id"] = str(b["patient_id"])
            b["surgeon_id"] = str(b["surgeon_id"])
            
            patient = await db["patients"].find_one({"_id": ObjectId(b["patient_id"])})
            surgeon = await db["doctors"].find_one({"_id": ObjectId(b["surgeon_id"])})
            
            b["patient_name"] = patient["full_name"] if patient else "Unknown"
            b["surgeon_name"] = surgeon["name"] if surgeon else "Unknown"
                
        return bookings

    async def get_booking_by_id(self, booking_id: str) -> Dict[str, Any]:
        db = get_database()
        b = await db[self.collection_name].find_one({"_id": ObjectId(booking_id)})
        if not b:
            raise HTTPException(status_code=404, detail="Booking not found")
        
        b["id"] = str(b["_id"])
        b["patient_id"] = str(b["patient_id"])
        b["surgeon_id"] = str(b["surgeon_id"])
        
        patient = await db["patients"].find_one({"_id": ObjectId(b["patient_id"])})
        surgeon = await db["doctors"].find_one({"_id": ObjectId(b["surgeon_id"])})
        
        b["patient_name"] = patient["full_name"] if patient else "Unknown"
        b["surgeon_name"] = surgeon["name"] if surgeon else "Unknown"
        
        return b

    async def update_booking(self, booking_id: str, data: OTBookingUpdate) -> Dict[str, Any]:
        db = get_database()
        update_dict = {k: v for k, v in data.dict().items() if v is not None}
        update_dict["updated_at"] = datetime.utcnow()
        
        await db[self.collection_name].update_one(
            {"_id": ObjectId(booking_id)},
            {"$set": update_dict}
        )
        return await self.get_booking_by_id(booking_id)

    async def get_ot_stats(self, date: Optional[str] = None) -> Dict[str, Any]:
        try:
            db = get_database()
            query = {}
            if date:
                query["surgery_date"] = date
                
            all_bookings = await db[self.collection_name].find(query).to_list(10000)
            
            total = len(all_bookings)
            emergencies = len([b for b in all_bookings if b["type"] == "Emergency"])
            cancelled = len([b for b in all_bookings if b["status"] == "Cancelled"])
            
            # Calculate usage hours (mock logic for now)
            usage_hours = 0
            for b in all_bookings:
                if b["status"] == "Completed":
                    # Basic duration calculation from HH:MM
                    try:
                        start = datetime.strptime(b["start_time"], "%H:%M")
                        end = datetime.strptime(b["end_time"], "%H:%M")
                        usage_hours += (end - start).total_seconds() / 3600
                    except (ValueError, KeyError):
                        continue

            return {
                "total_surgeries": total,
                "usage_hours": round(usage_hours, 1),
                "occupancy_rate": round((usage_hours / (24 * 30 * 4)) * 100, 1) if total > 0 else 0, # Assuming 4 theatres
                "emergency_count": emergencies,
                "planned_count": total - emergencies,
                "cancelled_count": cancelled
            }
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Error calculating stats: {str(e)}")

ot_service = OTService()
