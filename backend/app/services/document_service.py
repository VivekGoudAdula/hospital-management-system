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
        documents = await db[self.collection_name].find({"patient_id": ObjectId(patient_id)}).to_list(1000)
        
        for doc in documents:
            doc["id"] = str(doc["_id"])
            doc["patient_id"] = str(doc["patient_id"])
            doc["uploaded_by"] = str(doc["uploaded_by"])
            del doc["_id"]
            
        return documents

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
