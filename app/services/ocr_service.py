# app/services/ocr_service.py

from paddleocr import PaddleOCR
import re
from Levenshtein import ratio
import cv2
import os
import tempfile
import numpy as np
import base64

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
        """Extract text from the given image file."""
        result = self.model.predict(image_path)
        if not result or not result[0]:
            return ""
        
        result_dict = result[0]
        texts = result_dict.get('rec_texts', [])
        return "\n".join(texts)

    def extract_text_and_image(self, image_path: str) -> tuple[str, str]:
        """
        Performs OCR, extracts text, and returns both the text and annotated image.
        Returns a tuple of (extracted_text, base64_encoded_annotated_image)
        """
        # Read the image
        image = cv2.imread(image_path)
        result = self.model.predict(image_path)
        
        if not result or not result[0]:
            return "", ""
        
        result_dict = result[0]
        texts = result_dict.get('rec_texts', [])
        
        # Create a temporary file for the annotated image
        with tempfile.NamedTemporaryFile(suffix='.png', delete=False) as temp:
            temp_path = temp.name
        
        # Use PaddleOCR's native visualization
        result[0].save_to_img(temp_path)
        
        # Read the generated image and convert to base64
        with open(temp_path, 'rb') as img_file:
            base64_image = base64.b64encode(img_file.read()).decode('utf-8')
            
        # Clean up temporary file
        os.unlink(temp_path)
        
        return "\n".join(texts), base64_image

    def _normalize_date(self, date_str: str) -> str:
        """Convert various date formats to YYYY-MM-DD."""
        # Remove any extra spaces
        date_str = date_str.strip()
        
        # Try different date patterns
        patterns = [
            # DD-MM-YYYY
            (r'(\d{1,2})[-/](\d{1,2})[-/](\d{4})', lambda m: f"{m.group(3)}-{m.group(2).zfill(2)}-{m.group(1).zfill(2)}"),
            # YYYY-MM-DD
            (r'(\d{4})[-/](\d{1,2})[-/](\d{1,2})', lambda m: f"{m.group(1)}-{m.group(2).zfill(2)}-{m.group(3).zfill(2)}"),
        ]
        
        for pattern, formatter in patterns:
            match = re.match(pattern, date_str)
            if match:
                try:
                    return formatter(match)
                except:
                    continue
        
        return date_str

    def _clean_address(self, address: str) -> str:
        """Clean up address text by fixing common OCR errors."""
        # Fix common OCR errors in addresses
        corrections = {
            'Linet': 'Line',
            'Layeut': 'Layout',
            'Strect': 'Street',
            'Read': 'Road'
        }
        
        for wrong, correct in corrections.items():
            address = re.sub(wrong, correct, address, flags=re.IGNORECASE)
        
        return address.strip()

    def parse_raw_text(self, text: str) -> dict:
        """Intelligently parses raw text to extract structured key-value pairs."""
        data = {}
        # This regex is good for lines like "Key : Value"
        pattern = re.compile(
            r"^(.*?)\s*:\s*(.*)", re.IGNORECASE | re.MULTILINE
        )
        matches = pattern.findall(text)
        
        # Special handling for email addresses
        email_pattern = re.compile(r'([a-zA-Z0-9._%+-]+)@([a-zA-Z0-9.-]+\.[a-zA-Z]{2,})')
        email_matches = email_pattern.findall(text)
        if email_matches:
            # Take the first matching email address
            email_parts = email_matches[0]
            email = f"{email_parts[0].replace(' ', '')}@{email_parts[1].replace(' ', '')}"
            # Common OCR fixes for emails
            email = email.replace('aail.', 'gmail.')
            data['email_id'] = email
        
        # Map to normalize extracted keys to our desired schema keys
        key_map = {
            'first name': 'first_name', 'midde name': 'middle_name', 'last name': 'last_name',
            'grender': 'gender', 'gender': 'gender', 'date of birth': 'date_of_birth',
            'address linet': 'address_line_1', 'address line1': 'address_line_1',
            'address line 2': 'address_line_2', 'city': 'city', 'state': 'state',
            'pin code': 'pin_code', 'phone member': 'phone_number', 'phone number': 'phone_number',
            'email id': 'email_id', 'email': 'email_id', 'name': 'first_name', 'age': 'date_of_birth',
            'address': 'address_line_1', 'country': 'state'
        }
        
        # Define key mappings with better handling of OCR errors
        key_map = {
            'first name': 'first_name', 'midde name': 'middle_name', 'last name': 'last_name',
            'grender': 'gender', 'gender': 'gender', 'date of birth': 'date_of_birth',
            'address linet': 'address_line_1', 'address line1': 'address_line_1', 'address line 1': 'address_line_1',
            'adebress linet': 'address_line_1', 'adress line1': 'address_line_1',
            'address line2': 'address_line_2', 'address line 2': 'address_line_2', 'address line 2:': 'address_line_2',
            'city': 'city', 'state': 'state',
            'pin code': 'pin_code', 'pin c0de': 'pin_code',
            'phone member': 'phone_number', 'phone number': 'phone_number', 'phonemumber': 'phone_number',
            'email id': 'email_id', 'email': 'email_id'
        }
        
        # Process all key-value pairs
        for key, value in matches:
            clean_key = key.strip().lower()
            if clean_key in key_map:
                mapped_key = key_map[clean_key]
                clean_value = value.strip()
                
                # Special handling for dates
                if mapped_key == 'date_of_birth':
                    clean_value = self._normalize_date(clean_value)
                
                # Special handling for addresses
                if mapped_key in ['address_line_1', 'address_line_2']:
                    clean_value = self._clean_address(clean_value)
                
                # Don't overwrite existing values unless it's address line 2
                # This ensures proper ordering of address lines
                if mapped_key not in data or mapped_key == 'address_line_2':
                    data[mapped_key] = clean_value
        
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