# app/main.py

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.endpoints import ocr

app = FastAPI(
    title="MOSIP Decode OCR Service",
    description="An API for extracting and verifying text from documents.",
    version="1.0.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # React dev server
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include the OCR API router
app.include_router(ocr.router, prefix="/api/v1", tags=["OCR"])

@app.get("/", tags=["Health Check"])
def read_root():
    """A simple health check endpoint."""
    return {"status": "ok", "message": "Welcome to the OCR Service!"}