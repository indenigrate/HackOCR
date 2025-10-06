# app/services/llm_service.py

import ollama
import json

class LLMService:
    """A service to parse text using a local LLM via Ollama."""

    def __init__(self, model_name: str = "phi3"):
        self.model_name = model_name
        # The client automatically connects to http://localhost:11434
        self.client = ollama.Client()
        print(f"✅ LLM Service initialized for model '{self.model_name}'.")

    def _create_prompt(self, raw_text: str) -> str:
        """Creates a detailed, structured prompt for the LLM."""
        
        # This detailed prompt guides the LLM to produce clean JSON.
        prompt = f"""
You are an expert data extraction tool. Your task is to analyze the raw text from an OCR scan of a handwritten document and extract specific fields into a valid JSON format.

**Instructions:**
1.  Extract the following fields: `first_name`, `last_name`, `middle_name`, `gender`, `date_of_birth`, `address_line_1`, `address_line_2`, `city`, `state`, `pin_code`, `phone_number`, `email_id`.
2.  If a field is not found in the text, use `null` as its value in the JSON.
3.  **Correct obvious OCR errors.** For example, "mame" should be "name", "Grender" should be "Gender", "aail.com" should be "gmail.com", and "Layeut" should be "Layout". Use context to fix garbled words.
4.  Your response **MUST** be a single, valid JSON object and nothing else. Do not include any explanations or markdown.

**Raw OCR Text:**
---
{raw_text}
---

**JSON Output:**
"""
        return prompt

    def parse_with_llm(self, raw_text: str) -> dict:
        """
        Sends the raw text to the local LLM and gets a structured JSON response.
        """
        prompt = self._create_prompt(raw_text)
        
        try:
            print(f"Sending prompt to LLM model: {self.model_name}...")
            response = self.client.chat(
                model=self.model_name,
                messages=[{'role': 'user', 'content': prompt}],
                options={'temperature': 0.0}, # Low temperature for deterministic output
                format="json" # Tell the model to strictly output JSON
            )
            
            # The response content should be a JSON string.
            json_string = response['message']['content']
            
            # Parse the JSON string into a Python dictionary.
            parsed_data = json.loads(json_string)
            print("✅ LLM parsing successful.")
            return parsed_data

        except Exception as e:
            print(f"❌ Error during LLM parsing: {e}")
            return {} # Return an empty dict on failure

# Create a single instance of the service
llm_service = LLMService()