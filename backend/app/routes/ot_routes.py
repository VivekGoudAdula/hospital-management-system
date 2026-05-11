from fastapi import APIRouter, Depends, Query, status
from typing import List, Optional
from ..schemas.ot_schema import OTBookingCreate, OTBookingUpdate, OTBookingResponse, OTStats
from ..services.ot_service import ot_service
from ..utils.dependencies import require_doctor, require_admin

router = APIRouter(prefix="/ot", tags=["OT Scheduling"])

@router.post("/bookings/", response_model=OTBookingResponse, status_code=status.HTTP_201_CREATED)
async def create_booking(
    booking_data: OTBookingCreate,
    current_user: dict = Depends(require_admin)
):
    """Schedule a new surgery."""
    return await ot_service.create_booking(booking_data)

@router.get("/bookings/", response_model=List[OTBookingResponse])
async def get_bookings(
    date: Optional[str] = None,
    theatre_id: Optional[str] = None,
    surgeon_id: Optional[str] = None,
    current_user: dict = Depends(require_doctor)
):
    """Get OT schedule with filters."""
    filters = {"date": date, "theatre_id": theatre_id, "surgeon_id": surgeon_id}
    return await ot_service.get_bookings(filters)

@router.patch("/bookings/{id}", response_model=OTBookingResponse)
async def update_booking(
    id: str,
    data: OTBookingUpdate,
    current_user: dict = Depends(require_doctor)
):
    """Update surgery status or reschedule."""
    return await ot_service.update_booking(id, data)

@router.get("/stats/", response_model=OTStats)
async def get_ot_stats(
    date: Optional[str] = None,
    current_user: dict = Depends(require_doctor)
):
    """Fetch OT utilization reports."""
    return await ot_service.get_ot_stats(date)
