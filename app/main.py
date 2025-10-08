# app/main.py

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from app.api.endpoints import ocr
import os
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

static_file_path = os.path.join(os.path.dirname(__file__), "static")
app.mount("/static", StaticFiles(directory=static_file_path), name="static")

# Include the OCR API router
app.include_router(ocr.router, prefix="/api/v1", tags=["OCR"])

@app.get("/api/v1/healthz", tags=["Health Check"])
def health_check():
    """A simple health check endpoint for the API."""
    return {"status": "ok"}

@app.get("/", tags=["Frontend"], response_class=FileResponse)
def read_root():
    return os.path.join(static_file_path, "index.html")
    # return {"status": "ok", "message": "Welcome to the OCR Service!"}