# app/api/schemas/ocr.py
from pydantic import BaseModel
from typing import List, Dict, Any

# Pydantic model for the data extracted from a document
class ExtractionResponse(BaseModel):
    name: str | None = None
    age: int | None = None
    gender: str | None = None
    address: str | None = None
    email_id: str | None = None
    phone_number: str | None = None

# Pydantic model for a single field's verification result
class VerificationFieldResult(BaseModel):
    field: str
    status: str # "match", "mismatch", or "missing"
    confidence: float

# Pydantic model for the final verification response
class VerificationResponse(BaseModel):
    results: List[VerificationFieldResult]