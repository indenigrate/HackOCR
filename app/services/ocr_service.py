# app/services/ocr_service.py

from paddleocr import PaddleOCR
import re
from Levenshtein import ratio
import cv2
import os
import tempfile

class OCRService:
    """A service class to handle all OCR-related logic."""

    def __init__(self):
        """Initializes and loads the OCR model once."""
        print("Loading PaddleOCR model...")
        self.model = PaddleOCR(
            use_doc_orientation_classify=True,
            use_doc_unwarping=True,
            lang='en'
        )
        print("✅ PaddleOCR model loaded successfully.")

    def extract_text_from_image(self, image_path: str) -> str:
        """
        Performs OCR and extracts text based on the new, correct result structure.
        """
        result = self.model.predict(image_path)
        
        # --- THIS IS THE KEY CHANGE ---
        # The result is a list containing one dictionary for the image.
        # We access that dictionary and get the text from the 'rec_texts' key.
        if not result or not result[0]:
            return ""
        
        result_dict = result[0]
        texts = result_dict.get('rec_texts', []) # Safely get the list of texts
        
        return "\n".join(texts)

    def parse_raw_text(self, text: str) -> dict:
        """Intelligently parses raw text to extract structured key-value pairs."""
        data = {}
        # This regex is good for lines like "Key : Value"
        pattern = re.compile(
            r"^(.*?)\s*:\s*(.*)", re.IGNORECASE | re.MULTILINE
        )
        matches = pattern.findall(text)
        
        # A map to normalize extracted keys to our desired schema keys
        key_map = {
            'first name': 'first_name', 'midde name': 'middle_name', 'last name': 'last_name',
            'grender': 'gender', 'gender': 'gender', 'date of birth': 'date_of_birth',
            'address linet': 'address_line_1', 'address line1': 'address_line_1',
            'address line 2': 'address_line_2', 'city': 'city', 'state': 'state',
            'pin code': 'pin_code', 'phone member': 'phone_number', 'phone number': 'phone_number',
            'email id': 'email_id', 'email': 'email_id', 'name': 'first_name', 'age': 'date_of_birth',
            'address': 'address_line_1', 'country': 'state'
        }
        
        for key, value in matches:
            clean_key = key.strip().lower()
            if clean_key in key_map:
                # Assign if not already filled to avoid overwriting (e.g., "Name" vs "First name")
                if key_map[clean_key] not in data:
                    data[key_map[clean_key]] = value.strip()
        
        return data

# Create a single instance of the service to be used by the API
ocr_service = OCRService()