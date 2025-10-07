# app/api/schemas/ocr.py

from pydantic import BaseModel, Field
from typing import List, Optional, Dict

class ExtractionResponse(BaseModel):
    """Defines the structure for the OCR extraction response."""
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    middle_name: Optional[str] = None
    annotated_image: Optional[str] = Field(None, description="Base64 encoded annotated image with OCR results")
    gender: Optional[str] = None
    date_of_birth: Optional[str] = None
    address_line_1: Optional[str] = None
    address_line_2: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    pin_code: Optional[str] = None
    
    phone_number: Optional[str] = None
    email_id: Optional[str] = None
    raw_text: str = Field(..., description="The full, raw text extracted from the document.")

class VerificationFieldResult(BaseModel):
    """Holds the verification result for a single field."""
    submitted: str
    extracted: Optional[str] = Field(default="", description="Extracted value from document")
    match: bool
    similarity: float

class VerificationResponse(BaseModel):
    """Defines the structure for the data verification response."""
    verification_results: Dict[str, VerificationFieldResult]