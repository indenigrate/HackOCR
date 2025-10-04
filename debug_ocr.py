# debug_ocr.py

import cv2
from paddleocr import PaddleOCR
import numpy as np
from PIL import Image

def run_test(image_path):
    """Loads an image, runs OCR, and prints the result."""
    print("-" * 50)
    print(f"--- Testing image: {image_path} ---")

    try:
        # Initialize PaddleOCR
        # NOTE: This will be slower than in the server as it loads the model every time.
        ocr = PaddleOCR(use_angle_cls=True, lang='en')

        # Load the image using OpenCV
        img = cv2.imread(image_path)
        if img is None:
            print("!!! ERROR: Image could not be loaded. Check the path. !!!")
            return

        print(f"Image loaded successfully. Shape: {img.shape}")

        # --- TEST 1: Run OCR on the raw color image ---
        print("\n[ Running OCR on RAW image ]")
        result_raw = ocr.ocr(img)
        print("Raw OCR Result:")
        print(result_raw)


        # --- TEST 2: Run OCR on the pre-processed image ---
        print("\n[ Running OCR on PRE-PROCESSED image ]")
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        thresh = cv2.adaptiveThreshold(gray, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY, 11, 2)
        thresh_3_channel = cv2.cvtColor(thresh, cv2.COLOR_GRAY2BGR)
        
        result_processed = ocr.ocr(thresh_3_channel)
        print("Processed OCR Result:")
        print(result_processed)

    except Exception as e:
        print(f"!!! An exception occurred: {e} !!!")
        import traceback
        traceback.print_exc()

# --- IMPORTANT: Set the correct paths to your test images ---
run_test('test1.png')
run_test('test2.png') # Make sure this is the correct file name and extension