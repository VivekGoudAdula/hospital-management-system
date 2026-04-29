import os
import uuid
from fastapi import UploadFile, HTTPException, status
from typing import List

UPLOAD_DIR = "uploads"
ALLOWED_EXTENSIONS = {"pdf", "jpg", "jpeg", "png"}
MAX_FILE_SIZE = 5 * 1024 * 1024  # 5MB

if not os.path.exists(UPLOAD_DIR):
    os.makedirs(UPLOAD_DIR)

async def save_upload_file(upload_file: UploadFile) -> str:
    """
    Saves an uploaded file locally and returns the file path.
    Generates a unique filename using UUID + original name.
    """
    # Check file extension
    file_ext = upload_file.filename.split(".")[-1].lower()
    if file_ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File type not allowed. Allowed types: {', '.join(ALLOWED_EXTENSIONS)}"
        )

    # Check file size (optional, since UploadFile doesn't directly expose size until read)
    # But we can read a chunk and check
    
    unique_filename = f"{uuid.uuid4()}_{upload_file.filename}"
    file_path = os.path.join(UPLOAD_DIR, unique_filename)
    
    try:
        with open(file_path, "wb") as f:
            content = await upload_file.read()
            if len(content) > MAX_FILE_SIZE:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"File size exceeds limit of {MAX_FILE_SIZE // (1024 * 1024)}MB"
                )
            f.write(content)
    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Could not save file: {str(e)}"
        )
    finally:
        await upload_file.close()
    
    # Return the relative URL/path
    return f"/{UPLOAD_DIR}/{unique_filename}"

def delete_local_file(file_url: str):
    """Deletes a file from the local storage."""
    # file_url is like /uploads/filename
    if file_url.startswith("/"):
        file_path = file_url[1:] # remove leading slash
    else:
        file_path = file_url
        
    if os.path.exists(file_path):
        os.remove(file_path)
