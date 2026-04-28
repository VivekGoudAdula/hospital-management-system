from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .config.db import connect_to_mongo, close_mongo_connection
from .routes import auth_routes

app = FastAPI(title="ApexCare Backend")

# CORS Setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Adjust this for production
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

@app.get("/")
async def root():
    return {"message": "Welcome to ApexCare API"}
