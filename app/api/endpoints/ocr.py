# app/api/v1/endpoints/ocr.py

from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from app.services.ocr_service import ocr_service
from app.services.llm_service import llm_service
from app.api.schemas.ocr import ExtractionResponse, VerificationResponse, VerificationFieldResult
import tempfile
import os
import json
from Levenshtein import ratio

router = APIRouter()

@router.post("/extract", response_model=ExtractionResponse)
async def ocr_extraction_api(file: UploadFile = File(...)):
    """
    API 1: Accepts an image/PDF, extracts text, and returns structured data.
    [cite: 39, 40]
    """
    # Save the uploaded file to a temporary path
    with tempfile.NamedTemporaryFile(delete=False, suffix=os.path.splitext(file.filename)[1]) as temp:
        temp.write(await file.read())
        temp_file_path = temp.name
    
    try:
        # Perform OCR and parsing
        raw_text = ocr_service.extract_text_from_image(temp_file_path)
        if not raw_text:
            raise HTTPException(status_code=422, detail="No text could be extracted from the image.")
            
        parsed_data = ocr_service.parse_raw_text(raw_text)
        
        return ExtractionResponse(**parsed_data, raw_text=raw_text)
    finally:
        # Clean up the temporary file
        os.unlink(temp_file_path)

@router.post("/extract-llm", response_model=ExtractionResponse)
async def ocr_extraction_llm_api(file: UploadFile = File(...)):
    """
    NEW API: Accepts an image, extracts text, and uses an LLM to return structured data.
    """
    with tempfile.NamedTemporaryFile(delete=False, suffix=os.path.splitext(file.filename)[1]) as temp:
        temp.write(await file.read())
        temp_file_path = temp.name
    
    try:
        # Step 1: Get the raw text using the existing OCR service
        raw_text = ocr_service.extract_text_from_image(temp_file_path)
        if not raw_text:
            raise HTTPException(status_code=422, detail="No text could be extracted from the image.")
        
        # Step 2: Pass the raw text to the new LLM service for parsing
        parsed_data = llm_service.parse_with_llm(raw_text)
        
        return ExtractionResponse(**parsed_data, raw_text=raw_text)
    finally:
        os.unlink(temp_file_path)

@router.post("/verify", response_model=VerificationResponse)
async def data_verification_api(file: UploadFile = File(...), form_data: str = Form(...)):
    """
    API 2: Verifies submitted data against the document using the intelligent LLM parser.
    """
    with tempfile.NamedTemporaryFile(delete=False, suffix=os.path.splitext(file.filename)[1]) as temp:
        temp.write(await file.read())
        temp_file_path = temp.name

    try:
        raw_text = ocr_service.extract_text_from_image(temp_file_path)
        if not raw_text:
            raise HTTPException(status_code=422, detail="No text could be extracted for verification.")
        
        # --- THIS IS THE KEY CHANGE ---
        # Use the robust LLM parser instead of the simple rule-based one.
        extracted_data = llm_service.parse_with_llm(raw_text)
        
        submitted_data = json.loads(form_data)
        
        results = []
        for field, submitted_value in submitted_data.items():
            extracted_value = extracted_data.get(field)
            
            status = "missing_in_document"
            confidence = 0.0
            
            if extracted_value is not None:
                similarity = ratio(str(submitted_value).lower().strip(), str(extracted_value).lower().strip())
                if similarity >= 0.95:
                    status = "match"
                else:
                    status = "mismatch"
                confidence = similarity

            results.append(VerificationFieldResult(field=field, status=status, confidence=confidence))
        
        return VerificationResponse(results=results)
    finally:
        os.unlink(temp_file_path)