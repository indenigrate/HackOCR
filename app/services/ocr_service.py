from fastapi import UploadFile, HTTPException
from PIL import Image
import fitz  # PyMuPDF
from Levenshtein import ratio
import re
import numpy as np  # EasyOCR uses NumPy arrays

# FIX: Import the Pydantic models from your schemas file
from app.api.schemas.ocr import ExtractionResponse, VerificationResponse, VerificationFieldResult

class OCRModel:
    """A singleton class to load and hold the EasyOCR model."""
    def __init__(self):
        try:
            import easyocr
            print("Loading EasyOCR model...")
            # This will download the model on the first run
            self.reader = easyocr.Reader(['en']) # Specify English language
            print("✅ EasyOCR model loaded successfully.")
        except Exception as e:
            print(f"❌ Critical Error: Failed to load EasyOCR model: {e}")
            self.reader = None

    def perform_ocr(self, image: Image.Image) -> str:
        """Performs OCR on a given PIL image using EasyOCR."""
        if not self.reader:
            raise HTTPException(status_code=503, detail="OCR service is unavailable due to a model loading error.")
        
        # Convert PIL Image to a NumPy array, which EasyOCR expects
        image_np = np.array(image)
        
        # Perform OCR, join results into a single block of text
        result = self.reader.readtext(image_np, detail=0, paragraph=True)
        generated_text = "\n".join(result)
        
        print(f"DEBUG: Decoded text from EasyOCR: '{generated_text}'")
        return generated_text

# Instantiate the model when the module is loaded.
ocr_model = OCRModel()

def parse_raw_text(text: str) -> dict:
    """
    Parses a block of raw text to extract key-value pairs using flexible regex.
    """
    data = {}
    patterns = {
        'name': r"(?i)Name\s*[:\-\s]\s*(.+)",
        'age': r"(?i)Age\s*[:\-\s]\s*(\d+)",
        'gender': r"(?i)Gender\s*[:\-\s]\s*(Female|Male|Other)",
        'address': r"(?i)Address\s*[:\-\s]\s*(.+)",
        'email_id': r"(?i)Email\s*(?:Id)?\s*[:\-\s]\s*([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})",
        'phone_number': r"(?i)Phone\s*(?:number)?\s*[:\-\s]\s*([+\d\s()-]+)"
    }
    
    lines = text.split('\n')
    for key, pattern in patterns.items():
        for line in lines:
            match = re.search(pattern, line)
            if match:
                data[key] = match.group(1).strip()
                break
            
    return data

async def process_and_extract_data(file: UploadFile) -> ExtractionResponse:
    """Handles file upload, converts to an image, and runs OCR and parsing."""
    contents = await file.read()
    
    try:
        if file.content_type == "application/pdf":
            pdf_doc = fitz.open(stream=contents, filetype="pdf")
            page = pdf_doc.load_page(0)
            pix = page.get_pixmap(dpi=300)
            image = Image.frombytes("RGB", [pix.width, pix.height], pix.samples)
        elif file.content_type in ["image/jpeg", "image/png", "image/bmp"]:
            from io import BytesIO
            image = Image.open(BytesIO(contents)).convert("RGB")
        else:
            raise HTTPException(status_code=400, detail=f"Unsupported file type: {file.content_type}")
    except Exception as e:
        raise HTTPException(status_code=422, detail=f"Could not process the uploaded file. Error: {e}")

    raw_text = ocr_model.perform_ocr(image)
    parsed_data = parse_raw_text(raw_text)
    
    return ExtractionResponse(**parsed_data, raw_text=raw_text)

async def verify_document_data(file: UploadFile, form_data: dict) -> VerificationResponse:
    """Compares extracted document data against user-submitted form data."""
    extracted_obj = await process_and_extract_data(file)
    extracted_data = extracted_obj.dict()

    results = []
    for field, submitted_value in form_data.items():
        extracted_value = extracted_data.get(field)

        if extracted_value is None:
            status = "missing_in_document"
            confidence = 0.0
        elif str(submitted_value).lower().strip() == str(extracted_value).lower().strip():
            status = "match"
            confidence = 1.0
        else:
            status = "mismatch"
            confidence = ratio(str(submitted_value).lower().strip(), str(extracted_value).lower().strip())
        
        results.append(VerificationFieldResult(field=field, status=status, confidence=confidence))
        
    return VerificationResponse(results=results)