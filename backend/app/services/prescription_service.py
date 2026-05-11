import json
import os
from datetime import datetime
from typing import List, Dict, Any, Optional
from bson import ObjectId
from fastapi import HTTPException, status
from ..config.db import get_database
from ..schemas.prescription_schema import PrescriptionCreate, PrescriptionUpdate, MedicationItem

# Try to import reportlab for PDF generation
try:
    from reportlab.lib.pagesizes import A4
    from reportlab.lib import colors
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
    from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
    from reportlab.lib.units import inch
    REPORTLAB_AVAILABLE = True
except ImportError:
    REPORTLAB_AVAILABLE = False

class PrescriptionService:
    def __init__(self):
        self.collection_name = "prescriptions"
        self.medicines_file = os.path.join(os.path.dirname(__file__), "..", "data", "medicines.json")
        self._medicines_cache = None

    def _load_medicines(self):
        if self._medicines_cache is None:
            try:
                with open(self.medicines_file, "r") as f:
                    self._medicines_cache = json.load(f)
            except Exception as e:
                print(f"Error loading medicines: {e}")
                self._medicines_cache = []
        return self._medicines_cache

    async def search_medicines(self, query: str) -> List[Dict[str, Any]]:
        medicines = self._load_medicines()
        if not query:
            return medicines[:10]
        
        query = query.lower()
        results = [
            m for m in medicines 
            if query in m["name"].lower() or query in m["generic"].lower()
        ]
        return results

    async def create_prescription(self, data: PrescriptionCreate, doctor_id: str) -> Dict[str, Any]:
        db = get_database()
        
        # Verify patient and visit exist
        patient = await db["patients"].find_one({"_id": ObjectId(data.patient_id)})
        if not patient:
            raise HTTPException(status_code=404, detail="Patient not found")
        
        visit = await db["visits"].find_one({"_id": ObjectId(data.visit_id)})
        if not visit:
            raise HTTPException(status_code=404, detail="Visit not found")

        prescription_dict = data.dict()
        prescription_dict["patient_id"] = ObjectId(data.patient_id)
        prescription_dict["visit_id"] = ObjectId(data.visit_id)
        prescription_dict["doctor_id"] = ObjectId(doctor_id)
        
        if data.diagnosis_id:
            prescription_dict["diagnosis_id"] = ObjectId(data.diagnosis_id)
        else:
            # Try to find active diagnosis for this visit
            diag = await db["diagnoses"].find_one({"visit_id": ObjectId(data.visit_id)})
            if diag:
                prescription_dict["diagnosis_id"] = diag["_id"]

        prescription_dict["status"] = "draft"
        prescription_dict["created_at"] = datetime.utcnow()
        prescription_dict["updated_at"] = datetime.utcnow()

        result = await db[self.collection_name].insert_one(prescription_dict)
        prescription_dict["_id"] = result.inserted_id
        
        # Add to timeline
        await self._add_to_timeline(
            data.patient_id, 
            doctor_id, 
            "Prescription Created", 
            {"prescription_id": str(result.inserted_id), "status": "draft"}
        )
        
        return self._format_prescription(prescription_dict)

    async def update_prescription(self, prescription_id: str, data: PrescriptionUpdate) -> Dict[str, Any]:
        db = get_database()
        
        existing = await db[self.collection_name].find_one({"_id": ObjectId(prescription_id)})
        if not existing:
            raise HTTPException(status_code=404, detail="Prescription not found")
        
        if existing["status"] == "finalized":
            raise HTTPException(status_code=400, detail="Cannot update a finalized prescription")

        update_data = {k: v for k, v in data.dict().items() if v is not None}
        if "diagnosis_id" in update_data and update_data["diagnosis_id"]:
            update_data["diagnosis_id"] = ObjectId(update_data["diagnosis_id"])
        
        if "medicines" in update_data:
            update_data["medicines"] = [m.dict() for m in data.medicines]

        update_data["updated_at"] = datetime.utcnow()

        await db[self.collection_name].update_one(
            {"_id": ObjectId(prescription_id)},
            {"$set": update_data}
        )
        
        updated = await db[self.collection_name].find_one({"_id": ObjectId(prescription_id)})
        return self._format_prescription(updated)

    async def finalize_prescription(self, prescription_id: str, doctor_id: str) -> Dict[str, Any]:
        db = get_database()
        
        existing = await db[self.collection_name].find_one({"_id": ObjectId(prescription_id)})
        if not existing:
            raise HTTPException(status_code=404, detail="Prescription not found")
        
        if existing["status"] == "finalized":
            return self._format_prescription(existing)

        update_data = {
            "status": "finalized",
            "signed_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }

        await db[self.collection_name].update_one(
            {"_id": ObjectId(prescription_id)},
            {"$set": update_data}
        )
        
        # Add to timeline
        await self._add_to_timeline(
            str(existing["patient_id"]), 
            doctor_id, 
            "Prescription Finalized", 
            {"prescription_id": prescription_id, "status": "finalized"}
        )

        finalized = await db[self.collection_name].find_one({"_id": ObjectId(prescription_id)})
        return self._format_prescription(finalized)

    async def get_patient_prescriptions(self, patient_id: str) -> List[Dict[str, Any]]:
        db = get_database()
        prescriptions = await db[self.collection_name].find(
            {"patient_id": ObjectId(patient_id)}
        ).to_list(100)
        
        prescriptions.sort(key=lambda x: x.get("created_at", datetime.min), reverse=True)
        return [self._format_prescription(p) for p in prescriptions]

    async def get_visit_prescription(self, visit_id: str) -> Optional[Dict[str, Any]]:
        db = get_database()
        prescription = await db[self.collection_name].find_one({"visit_id": ObjectId(visit_id)})
        if prescription:
            return self._format_prescription(prescription)
        return None

    async def get_medication_history(self, patient_id: str) -> List[Dict[str, Any]]:
        db = get_database()
        # Find all finalized prescriptions for this patient
        prescriptions = await db[self.collection_name].find({
            "patient_id": ObjectId(patient_id),
            "status": "finalized"
        }).to_list(100)
        
        history = []
        for p in prescriptions:
            for m in p.get("medicines", []):
                history.append({
                    "medicine_name": m["medicine_name"],
                    "dosage": m["dosage"],
                    "frequency": m["frequency"],
                    "duration": m["duration"],
                    "prescribed_at": p["created_at"],
                    "doctor_id": str(p["doctor_id"])
                })
        
        history.sort(key=lambda x: x["prescribed_at"], reverse=True)
        return history

    async def check_interactions(self, patient_id: str, medicines: List[MedicationItem]) -> List[Dict[str, Any]]:
        # This is a mock interaction check
        # Real world would use a drug database API
        alerts = []
        
        # 1. Check for duplicates within the current prescription
        med_names = [m.medicine_name.split()[0].lower() for m in medicines]
        for i, name in enumerate(med_names):
            if med_names.count(name) > 1:
                alerts.append({
                    "type": "duplicate",
                    "severity": "medium",
                    "message": f"Duplicate medication detected: {medicines[i].medicine_name}"
                })
                break # Only one alert for duplicates
        
        # 2. Check for Penicillin allergy (mock)
        # In a real app, we'd fetch patient allergies
        for m in medicines:
            if "amoxicillin" in m.medicine_name.lower() or "penicillin" in m.medicine_name.lower():
                alerts.append({
                    "type": "allergy",
                    "severity": "high",
                    "message": f"Penicillin allergy conflict detected: {m.medicine_name}"
                })

        # 3. Check for specific drug-drug interactions (mock based on medicines.json)
        med_data = self._load_medicines()
        names_in_presc = [m.medicine_name for m in medicines]
        
        for m1 in medicines:
            # Find metadata for this medicine
            meta1 = next((item for item in med_data if item["name"] == m1.medicine_name), None)
            if meta1 and meta1.get("interactions"):
                for m2 in names_in_presc:
                    if m1.medicine_name == m2: continue
                    meta2 = next((item for item in med_data if item["name"] == m2), None)
                    if meta2 and (meta2["name"] in meta1["interactions"] or meta2["generic"] in meta1["interactions"]):
                        alerts.append({
                            "type": "interaction",
                            "severity": "high",
                            "message": f"Drug interaction: {m1.medicine_name} + {m2}"
                        })

        return alerts

    async def generate_pdf(self, prescription_id: str) -> Optional[str]:
        if not REPORTLAB_AVAILABLE:
            return None
            
        db = get_database()
        p = await db[self.collection_name].find_one({"_id": ObjectId(prescription_id)})
        if not p: return None
        
        # Fetch related data
        patient = await db["patients"].find_one({"_id": p["patient_id"]})
        doctor = await db["users"].find_one({"_id": p["doctor_id"]})
        
        # Path for the PDF
        pdf_dir = os.path.join(os.path.dirname(__file__), "..", "..", "static", "prescriptions")
        os.makedirs(pdf_dir, exist_ok=True)
        pdf_path = os.path.join(pdf_dir, f"prescription_{prescription_id}.pdf")
        
        doc = SimpleDocTemplate(pdf_path, pagesize=A4, rightMargin=40, leftMargin=40, topMargin=40, bottomMargin=40)
        styles = getSampleStyleSheet()
        
        # Custom styles
        styles.add(ParagraphStyle(name='HospitalName', fontName='Helvetica-Bold', fontSize=24, textColor=colors.HexColor("#0f172a")))
        styles.add(ParagraphStyle(name='RxStyle', fontName='Times-BoldItalic', fontSize=40, textColor=colors.HexColor("#0f172a")))
        
        elements = []
        
        # Header Table (Hospital Branding vs Doctor Info)
        header_left = [
            [Paragraph("<font color='#4f46e5' size=28><b>ApexCare</b></font>", styles["Normal"])],
            [Paragraph("<b>ApexCare Medical Center</b>", styles["Normal"])],
            [Paragraph("123 Health Avenue, Medical District", styles["Normal"])],
            [Paragraph("Contact: +1 (555) 123-4567", styles["Normal"])]
        ]
        
        header_right = [
            [Paragraph(f"<font size=14><b>Dr. {doctor.get('name', 'Vivek Goud')}</b></font>", styles["Normal"])],
            [Paragraph("<font color='#4f46e5'><b>General Physician</b></font>", styles["Normal"])],
            [Paragraph(f"Reg No: {doctor.get('registration_number', 'MED-2024-9921')}", styles["Normal"])]
        ]
        
        header_data = [[header_left, header_right]]
        header_table = Table(header_data, colWidths=[3.5*inch, 3.5*inch])
        header_table.setStyle(TableStyle([
            ('VALIGN', (0,0), (-1,-1), 'TOP'),
            ('ALIGN', (1,0), (1,0), 'RIGHT'),
            # Bottom border like the frontend
            ('LINEBELOW', (0,0), (-1,-1), 2, colors.HexColor("#4f46e5")),
        ]))
        elements.append(header_table)
        elements.append(Spacer(1, 0.3 * inch))
        
        # Patient Info Table
        patient_data = [
            [
                Paragraph(f"<b>Patient Name:</b> {patient['full_name']}", styles["Normal"]),
                Paragraph(f"<b>Date:</b> {p['created_at'].strftime('%d %B, %Y')}", styles["Normal"])
            ],
            [
                Paragraph(f"<b>MRN:</b> {patient['mrn']}", styles["Normal"]),
                Paragraph(f"<b>Age/Sex:</b> {patient.get('dob', 'N/A')} / {patient.get('gender', 'N/A')}", styles["Normal"])
            ]
        ]
        patient_table = Table(patient_data, colWidths=[4*inch, 3*inch])
        patient_table.setStyle(TableStyle([
            ('BOTTOMPADDING', (0,0), (-1,-1), 10),
            ('LINEBELOW', (0,1), (-1,1), 0.5, colors.grey),
        ]))
        elements.append(patient_table)
        elements.append(Spacer(1, 0.4 * inch))
        
        # Rx Symbol
        elements.append(Paragraph("Rx", styles["RxStyle"]))
        elements.append(Spacer(1, 0.2 * inch))
        
        # Medicines Table
        med_header = [
            Paragraph("<b>Medicine Name</b>", styles["Normal"]),
            Paragraph("<b>Dosage</b>", styles["Normal"]),
            Paragraph("<b>Freq</b>", styles["Normal"]),
            Paragraph("<b>Duration</b>", styles["Normal"]),
            Paragraph("<b>Instructions</b>", styles["Normal"])
        ]
        med_data = [med_header]
        for m in p.get("medicines", []):
            med_data.append([
                Paragraph(f"<b>{m['medicine_name']}</b>", styles["Normal"]),
                m["dosage"],
                m["frequency"],
                m["duration"],
                Paragraph(f"<i>{m.get('instructions', '')}</i>", styles["Normal"])
            ])
            
        med_table = Table(med_data, colWidths=[2.2*inch, 1*inch, 0.8*inch, 1*inch, 2*inch])
        med_table.setStyle(TableStyle([
            ('LINEBELOW', (0, 0), (-1, 0), 1.5, colors.black),
            ('LINEBELOW', (0, 1), (-1, -1), 0.5, colors.grey),
            ('TOPPADDING', (0, 1), (-1, -1), 8),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ]))
        elements.append(med_table)
        elements.append(Spacer(1, 0.5 * inch))
        
        # Assessment / Notes
        if p.get("notes"):
            elements.append(Paragraph("<font color='#4f46e5'><b>CLINICAL ASSESSMENT & ADVICE</b></font>", styles["Normal"]))
            elements.append(Spacer(1, 0.1 * inch))
            elements.append(Paragraph(p["notes"], styles["Normal"]))
            elements.append(Spacer(1, 1 * inch))
            
        # Signature
        if p["status"] == "finalized":
            sig_data = [
                ["", ""],
                ["", "_______________________"],
                ["", Paragraph(f"<b>Dr. {doctor.get('name', 'Vivek Goud')}</b>", styles["Normal"])],
                ["", Paragraph(f"<font size=8 color='grey'>Digitally Signed at {p['signed_at'].strftime('%Y-%m-%d %H:%M:%S')}</font>", styles["Normal"])]
            ]
            sig_table = Table(sig_data, colWidths=[4*inch, 3*inch])
            sig_table.setStyle(TableStyle([
                ('ALIGN', (1,0), (1,-1), 'CENTER'),
            ]))
            elements.append(sig_table)
        else:
            elements.append(Paragraph("<font color='red'><b>DRAFT - NOT FOR PHARMACY USE</b></font>", styles["Normal"]))
            
        doc.build(elements)
        return f"/static/prescriptions/prescription_{prescription_id}.pdf"

    async def _add_to_timeline(self, patient_id: str, doctor_id: str, title: str, metadata: Dict[str, Any]):
        db = get_database()
        event = {
            "patient_id": ObjectId(patient_id),
            "type": "prescription",
            "title": title,
            "timestamp": datetime.utcnow(),
            "created_by": ObjectId(doctor_id),
            "metadata": metadata
        }
        await db["patient_timeline"].insert_one(event)

    def _format_prescription(self, prescription: Dict[str, Any]) -> Dict[str, Any]:
        prescription["id"] = str(prescription["_id"])
        prescription["patient_id"] = str(prescription["patient_id"])
        prescription["visit_id"] = str(prescription["visit_id"])
        prescription["doctor_id"] = str(prescription["doctor_id"])
        if prescription.get("diagnosis_id"):
            prescription["diagnosis_id"] = str(prescription["diagnosis_id"])
        
        if "_id" in prescription:
            del prescription["_id"]
        return prescription

prescription_service = PrescriptionService()
