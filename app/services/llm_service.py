# app/services/llm_service.py

import requests  # <-- CHANGED: Replaced 'ollama' with 'requests'
import json
import os

class LLMService:
    """A service to parse text using a remote Modal LLM API."""

    def __init__(self, model_name: str = "phi3-mini"): # <-- CHANGED: Updated default model
        self.model_name = model_name
        # The Modal endpoint URL
        self.api_url = "https://devanshsoni899-newenv--phi3-llm-server-serve.modal.run/v1/chat/completions"
        print(f"✅ LLM Service initialized for remote Modal model '{self.model_name}' at {self.api_url}.")

    def _create_prompt(self, raw_text: str) -> str:
        """
        Creates a detailed, structured prompt for the LLM.
        (This function is unchanged as its logic is correct)
        """
        
        # This detailed prompt guides the LLM to produce clean JSON.
        prompt = f"""
You are an expert data extraction tool. Your task is to analyze the raw text from an OCR scan of a handwritten document and extract specific fields into a valid JSON format.

**Instructions:**
1.  Extract the following fields: `first_name`, `last_name`, `middle_name`, `gender`, `date_of_birth`, `address_line_1`, `address_line_2`, `city`, `state`, `pin_code`, `phone_number`, `email_id`.
2.  If a field is not found in the text, use `null` as its value in the JSON.
3.  For dates: Convert all dates to YYYY-MM-DD format:
    - Convert dates like "DD-MM-YYYY" or "DD/MM/YYYY" to "YYYY-MM-DD"
    - Handle various date formats and standardize them
    - Ensure proper zero-padding for single digit days/months
4.  For emails: Always extract email addresses even if there are OCR errors. Fix common substitutions:
    - Replace "aail" with "gmail"
    - Keep the local part and domain intact
    - Ensure @ symbol is preserved
    - Remove any spaces in email addresses
5.  Use context from the raw text to predict the fields not mentioned and ignore typing errors in common fields.
6.  **Correct obvious OCR errors.** For example, "mame" should be "name", "Grender" should be "Gender", "Layeut" should be "Layout". Use context to fix garbled words.
7.  Your response **MUST** be a single, valid JSON object and nothing else. Do not include any explanations or markdown.

**Raw OCR Text:**
---
{raw_text}
---

**JSON Output:**
"""
        return prompt

    def parse_with_llm(self, raw_text: str) -> dict:
        """
        Sends the raw text to the remote Modal LLM and gets a structured JSON response.
        """
        prompt = self._create_prompt(raw_text)
        
        # <-- ENTIRELY NEW IMPLEMENTATION FOR API CALL -->
        headers = {
            "Content-Type": "application/json"
        }
        
        payload = {
            "model": self.model_name,
            "messages": [
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            "temperature": 0.0,
            "response_format": {"type": "json_object"}
        }
        
        try:
            print(f"Sending prompt to remote LLM model: {self.model_name}...")
            
            # Make the POST request to the Modal API
            response = requests.post(self.api_url, headers=headers, json=payload, timeout=60)
            
            # Check for HTTP errors (e.g., 404, 500)
            response.raise_for_status()
            
            # Parse the outer JSON response from the API
            api_response_data = response.json()
            
            # Extract the inner JSON string from the 'content' field
            # This matches the 'curl' output structure
            json_string = api_response_data['choices'][0]['message']['content']
            
            # Parse the inner JSON string into a Python dictionary.
            parsed_data = json.loads(json_string)
            
            print("✅ LLM parsing successful.")
            return parsed_data

        except requests.exceptions.RequestException as e:
            print(f"❌ HTTP Error during LLM API call: {e}")
            return {} # Return an empty dict on failure
        except (KeyError, IndexError, json.JSONDecodeError) as e:
            # Handle errors from an unexpected API response structure or bad JSON
            print(f"❌ Error parsing LLM response: {e}")
            print(f"Raw response text: {response.text if 'response' in locals() else 'No response'}")
            return {}
        except Exception as e:
            print(f"❌ An unexpected error occurred: {e}")
            return {} # Return an empty dict on failure
        # <-- END OF NEW IMPLEMENTATION -->

# Create a single instance of the service
llm_service = LLMService()