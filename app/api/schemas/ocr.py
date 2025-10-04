# app/api/schemas/ocr.py

from pydantic import BaseModel
from typing import List

class ExtractionResponse(BaseModel):
    """Defines the structure of the data extracted from a document."""
    name: str | None = None
    age: str | None = None
    gender: str | None = None
    address: str | None = None
    email_id: str | None = None
    phone_number: str | None = None
    raw_text: str # Include the full raw text for debugging

class VerificationFieldResult(BaseModel):
    """Represents the verification result for a single field."""
    field: str
    status: str # "match", "mismatch", or "missing_in_document"
    confidence: float

class VerificationResponse(BaseModel):
    """The final response for the verification endpoint."""
    results: List[VerificationFieldResult]