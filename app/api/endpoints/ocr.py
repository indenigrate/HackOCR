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
    NEW API: Accepts an image, extracts text, uses LLM to parse, and returns structured data with annotated image.
    """
    # Safely get the file extension
    filename = file.filename or ""
    extension = os.path.splitext(filename)[1] if filename else ""
    
    with tempfile.NamedTemporaryFile(delete=False, suffix=extension) as temp:
        temp.write(await file.read())
        temp_file_path = temp.name
    
    try:
        # Step 1: Get both the raw text and annotated image using the OCR service
        raw_text, annotated_image = ocr_service.extract_text_and_image(temp_file_path)
        if not raw_text:
            raise HTTPException(status_code=422, detail="No text could be extracted from the image.")
        
        # Step 2: Pass the raw text to the LLM service for parsing
        parsed_data = llm_service.parse_with_llm(raw_text)
        
        # Step 3: Return both parsed data and annotated image
        return ExtractionResponse(**parsed_data, raw_text=raw_text, annotated_image=annotated_image)
    finally:
        # Clean up the temporary file
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
        
        # Use the robust LLM parser instead of the simple rule-based one.
        extracted_data = llm_service.parse_with_llm(raw_text)
        
        # Parse the form data
        try:
            submitted_data = json.loads(form_data)
        except json.JSONDecodeError:
            raise HTTPException(status_code=400, detail="Invalid form data format")
        
        # Verify each field
        results = {}
        for field, submitted_value in submitted_data.items():
            # Get the extracted value for this field, ensure it's a string
            extracted_value = str(extracted_data.get(field, "") or "")
            
            # Calculate similarity ratio
            similarity = ratio(str(submitted_value).lower(), str(extracted_value).lower())
            
            # Determine if it's a match (you can adjust the threshold)
            is_match = similarity >= 0.8
            
            results[field] = VerificationFieldResult(
                submitted=submitted_value,
                extracted=extracted_value,
                match=is_match,
                similarity=similarity
            )
        
        return VerificationResponse(verification_results=results)
        
    finally:
        # Clean up the temporary file
        os.unlink(temp_file_path)
