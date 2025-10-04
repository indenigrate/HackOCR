# app/api/endpoints/ocr.py

from fastapi import APIRouter, UploadFile, File, Form, HTTPException
import json

from app.services import ocr_service
from app.api.schemas.ocr import ExtractionResponse, VerificationResponse

router = APIRouter()

@router.post(
    "/extract",
    response_model=ExtractionResponse,
    summary="Extracts structured data from a document",
)
async def ocr_extraction_api(
    file: UploadFile = File(..., description="The scanned document (PDF, JPG, PNG) to process.")
):
    """
    Accepts a scanned document and performs the following steps:
    1.  Converts the document to an image.
    2.  Uses the TrOCR model to extract text.
    3.  Parses the raw text to find structured fields (Name, Age, etc.).
    4.  Returns the structured data as a JSON object.
    """
    return await ocr_service.process_and_extract_data(file)


@router.post(
    "/verify",
    response_model=VerificationResponse,
    summary="Verifies form data against a document",
)
async def data_verification_api(
    file: UploadFile = File(..., description="The original scanned document for verification."),
    form_data_json: str = Form(..., description="A JSON string of the form data to be verified (e.g., '{\"name\": \"John Doe\"}').")
):
    """
    Accepts user-submitted form data and the original document, then:
    1.  Extracts structured data from the document using the OCR service.
    2.  Compares each field from the user's data with the extracted data.
    3.  Returns a detailed verification result with a match status and confidence score for each field.
    """
    try:
        form_data = json.loads(form_data_json)
        if not isinstance(form_data, dict):
             raise HTTPException(status_code=400, detail="form_data_json must be a JSON object.")
    except json.JSONDecodeError:
        raise HTTPException(status_code=400, detail="Invalid JSON format in form_data_json.")
    
    return await ocr_service.verify_document_data(file, form_data)