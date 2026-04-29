from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os
from .config.db import connect_to_mongo, close_mongo_connection
from .config.settings import settings
from .routes import auth_routes, department_routes, doctor_routes, patient_routes, document_routes, stats_routes, note_routes

app = FastAPI(title="ApexCare Backend")

# Ensure uploads directory exists
if not os.path.exists("uploads"):
    os.makedirs("uploads")

# Mount Static Files
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

# CORS Setup
origins = settings.ALLOWED_ORIGINS.split(",")

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
app.include_router(note_routes.router, prefix="/api")

@app.get("/")
async def root():
    return {"message": "Welcome to ApexCare API"}
