from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime

class ICDCode(BaseModel):
    code: str
    label: str

class DiagnosisCreate(BaseModel):
    patient_id: str
    visit_id: str
    primary_diagnosis: ICDCode
    secondary_diagnoses: List[ICDCode] = []
    notes: Optional[str] = None

class DiagnosisUpdate(BaseModel):
    primary_diagnosis: Optional[ICDCode] = None
    secondary_diagnoses: Optional[List[ICDCode]] = None
    notes: Optional[str] = None

class DiagnosisResponse(BaseModel):
    id: str
    patient_id: str
    visit_id: str
    doctor_id: str
    primary_diagnosis: ICDCode
    secondary_diagnoses: List[ICDCode]
    notes: Optional[str] = None
    created_at: datetime
    updated_at: datetime
