from datetime import datetime
from typing import List, Dict, Any
from bson import ObjectId
from fastapi import HTTPException, UploadFile
from ..config.db import get_database
from ..utils.file_upload import save_upload_file, delete_local_file

class DocumentService:
    def __init__(self):
        self.collection_name = "documents"

    async def upload_document(self, patient_id: str, file_type: str, notes: str, file: UploadFile, user_id: str) -> Dict[str, Any]:
        db = get_database()
        
        # Verify patient exists
        patient = await db.patients.find_one({"_id": ObjectId(patient_id)})
        if not patient:
            raise HTTPException(status_code=404, detail="Patient not found")
            
        # Save file locally
        file_url = await save_upload_file(file)
        
        document_dict = {
            "patient_id": ObjectId(patient_id),
            "file_url": file_url,
            "file_name": file.filename,
            "file_type": file_type,
            "notes": notes,
            "uploaded_by": ObjectId(user_id),
            "created_at": datetime.utcnow()
        }
        
        result = await db[self.collection_name].insert_one(document_dict)
        document_dict["id"] = str(result.inserted_id)
        document_dict["patient_id"] = str(document_dict["patient_id"])
        document_dict["uploaded_by"] = str(document_dict["uploaded_by"])
        del document_dict["_id"]
        
        return document_dict

    async def get_patient_documents(self, patient_id: str) -> List[Dict[str, Any]]:
        db = get_database()
        # Fetch without server-side sort to avoid indexing requirements (specifically for Cosmos DB)
        documents = await db[self.collection_name].find({"patient_id": ObjectId(patient_id)}).to_list(1000)
        
        # Sort in memory by created_at descending
        documents.sort(key=lambda x: x.get("created_at", datetime.min), reverse=True)
        
        for doc in documents:
            doc["id"] = str(doc["_id"])
            doc["patient_id"] = str(doc["patient_id"])
            doc["uploaded_by"] = str(doc["uploaded_by"])
            del doc["_id"]
            
        return documents

    async def get_document_repository(self, search: str = None, file_type: str = None, start_date: str = None, end_date: str = None) -> Dict[str, Any]:
        db = get_database()
        
        pipeline = []
        
        # 1. Match documents by type and date
        match_doc = {}
        if file_type and file_type != "all":
            match_doc["file_type"] = file_type
        
        date_query = {}
        if start_date:
            try:
                date_query["$gte"] = datetime.fromisoformat(start_date.replace('Z', '+00:00'))
            except: pass
        if end_date:
            try:
                date_query["$lte"] = datetime.fromisoformat(end_date.replace('Z', '+00:00'))
            except: pass
            
        if date_query:
            match_doc["created_at"] = date_query
            
        if match_doc:
            pipeline.append({"$match": match_doc})
            
        # 2. Join with Patients
        pipeline.append({
            "$lookup": {
                "from": "patients",
                "localField": "patient_id",
                "foreignField": "_id",
                "as": "patient"
            }
        })
        pipeline.append({"$unwind": "$patient"})
        
        # 3. Filter by search (name or mrn)
        if search:
            pipeline.append({
                "$match": {
                    "$or": [
                        {"patient.full_name": {"$regex": search, "$options": "i"}},
                        {"patient.mrn": {"$regex": search, "$options": "i"}}
                    ]
                }
            })
            
        # 4. Join with Doctors (for department)
        pipeline.append({
            "$lookup": {
                "from": "doctors",
                "localField": "patient.assigned_doctor_id",
                "foreignField": "_id",
                "as": "doctor"
            }
        })
        pipeline.append({"$unwind": {"path": "$doctor", "preserveNullAndEmptyArrays": True}})
        
        # 5. Join with DoctorDepartments to get primary department
        pipeline.append({
            "$lookup": {
                "from": "doctor_departments",
                "localField": "doctor._id",
                "foreignField": "doctor_id",
                "as": "all_depts"
            }
        })
        pipeline.append({
            "$addFields": {
                "dept_mapping": {
                    "$arrayElemAt": [
                        {
                            "$filter": {
                                "input": "$all_depts",
                                "as": "d",
                                "cond": {"$eq": ["$$d.is_primary", True]}
                            }
                        },
                        0
                    ]
                }
            }
        })
        pipeline.append({"$unwind": {"path": "$dept_mapping", "preserveNullAndEmptyArrays": True}})
        
        # 6. Join with Departments to get name
        pipeline.append({
            "$lookup": {
                "from": "departments",
                "localField": "dept_mapping.department_id",
                "foreignField": "_id",
                "as": "dept_info"
            }
        })
        pipeline.append({"$unwind": {"path": "$dept_info", "preserveNullAndEmptyArrays": True}})
        
        # 7. Group by patient
        pipeline.append({
            "$group": {
                "_id": "$patient_id",
                "patient_name": {"$first": "$patient.full_name"},
                "mrn": {"$first": "$patient.mrn"},
                "department": {"$first": {"$ifNull": ["$dept_info.name", "General"]}},
                "document_types": {"$addToSet": "$file_type"},
                "files_count": {"$sum": 1},
                "latest_activity": {"$max": "$created_at"}
            }
        })
        
        # 8. Fetch results and sort in memory (Cosmos DB compatibility)
        results = await db[self.collection_name].aggregate(pipeline).to_list(1000)
        results.sort(key=lambda x: x.get("latest_activity", datetime.min), reverse=True)
        
        # 9. Format response and generate app_id
        formatted_data = []
        for index, item in enumerate(results):
            formatted_data.append({
                "app_id": f"APP-{str(index + 1).zfill(3)}",
                "patient_name": item["patient_name"],
                "mrn": item["mrn"],
                "department": item["department"],
                "document_types": item["document_types"],
                "files_count": item["files_count"],
                "latest_activity": item["latest_activity"],
                "patient_id": str(item["_id"])
            })
            
        return {
            "data": formatted_data,
            "total": len(formatted_data)
        }

    async def delete_document(self, document_id: str, user_id: str, user_role: str) -> Dict[str, str]:
        db = get_database()
        document = await db[self.collection_name].find_one({"_id": ObjectId(document_id)})
        
        if not document:
            raise HTTPException(status_code=404, detail="Document not found")
            
        # Authorization check: only uploader or admin can delete
        if user_role != "admin" and str(document["uploaded_by"]) != user_id:
            raise HTTPException(status_code=403, detail="Not authorized to delete this document")
            
        # Delete local file
        delete_local_file(document["file_url"])
        
        # Delete from DB
        await db[self.collection_name].delete_one({"_id": ObjectId(document_id)})
        
        return {"message": "Document deleted successfully"}

document_service = DocumentService()
