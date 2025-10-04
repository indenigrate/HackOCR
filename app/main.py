# app/main.py

from fastapi import FastAPI
from app.api.endpoints import ocr

app = FastAPI(
    title="MOSIP Decode - OCR Submission",
    description="An API using a local TrOCR model for document text extraction and verification. Compliant with hackathon rules.",
    version="1.0.0",
    contact={
        "name": "Devansh Soni", 
    },
)

# Include the OCR routes
app.include_router(ocr.router, prefix="/api/v1", tags=["OCR Service"])

@app.get("/", tags=["Root"])
def read_root():
    """A simple health check endpoint."""
    return {"status": "ok", "message": "Welcome to the MOSIP OCR API. Visit /docs for the API documentation."}