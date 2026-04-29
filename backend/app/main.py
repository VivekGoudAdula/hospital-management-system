from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os
from .config.db import connect_to_mongo, close_mongo_connection
from .config.settings import settings
from .routes import auth_routes, department_routes, doctor_routes, patient_routes, document_routes, stats_routes, notes_routes, doctor_dashboard_routes, prescription_routes

app = FastAPI(title="ApexCare Backend")

# Ensure uploads directory exists
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
uploads_dir = os.path.join(BASE_DIR, "uploads")

if not os.path.exists(uploads_dir):
    os.makedirs(uploads_dir)

# Mount Static Files
app.mount("/uploads", StaticFiles(directory=uploads_dir), name="uploads")

# CORS Setup
# Strip spaces and any quotes that might come from env variables
origins = [o.strip().replace('"', '').replace("'", "") for o in settings.ALLOWED_ORIGINS.split(",")]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def startup_db_client():
    await connect_to_mongo()

@app.on_event("shutdown")
async def shutdown_db_client():
    await close_mongo_connection()

# Include Routes
app.include_router(auth_routes.router, prefix="/api")
app.include_router(department_routes.router, prefix="/api")
app.include_router(doctor_routes.router, prefix="/api")
app.include_router(patient_routes.router, prefix="/api")
app.include_router(document_routes.router, prefix="/api")
app.include_router(stats_routes.router, prefix="/api")
app.include_router(notes_routes.router, prefix="/api")
app.include_router(prescription_routes.router, prefix="/api")
app.include_router(doctor_dashboard_routes.router, prefix="/api")

@app.get("/")
async def root():
    return {"message": "Welcome to ApexCare API"}
