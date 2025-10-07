# HackOCR: AI-Powered Text Extraction and Verification

HackOCR is an intelligent, OCR-driven solution designed to seamlessly extract text from scanned documents and images, intelligently auto-fill digital forms, and accurately verify the extracted data against the original source. This project is built to enhance data reliability and efficiency, minimizing manual intervention. It leverages the power of local AI models to ensure privacy and compliance with hackathon rules that prohibit cloud services.

## Table of Contents
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation and Running](#installation-and-running)
- [Tech Stack](#tech-stack)
  - [Backend](#backend)
  - [Frontend](#frontend)
  - [DevOps](#devops)
- [How It Works](#how-it-works)
  - [Core Functionality](#core-functionality)
- [API Documentation](#api-documentation)
  - [Text Extraction API](#1-text-extraction-api)
  - [Data Verification API](#2-data-verification-api)
- [Project Structure](#project-structure)
- [Compliance with Hackathon Guidelines](#compliance-with-hackathon-guidelines)

---

## Getting Started

Follow these instructions to get the HackOCR application up and running on your local machine.

### Prerequisites

Make sure you have the following software installed on your system:
- **Docker:** [Get Docker](https://docs.docker.com/get-docker/)
- **Docker Compose:** [Install Docker Compose](https://docs.docker.com/compose/install/)

### Installation and Running

1.  **Clone the repository:**
    ```bash
    git clone [https://github.com/your-username/HackOCR.git](https://github.com/your-username/HackOCR.git)
    cd HackOCR
    ```

2.  **Build and run the services using Docker Compose:**
    ```bash
    docker-compose up -d --build
    ```
    This command will build the Docker images for both the backend and frontend services and start them in detached mode.

3.  **Access the application:**
    - The **frontend** will be available at [http://localhost:80](http://localhost:80).
    - The **backend** API will be running at [http://localhost:8000](http://localhost:8000).

*Note: The first time you run the application, it may take a few minutes to download the necessary models for OCR and the LLM.*

---

## Tech Stack

This project is built with a modern, robust, and open-source technology stack.

### Backend

- **Python 3.11**
- **FastAPI:** A modern, high-performance web framework for building APIs.
- **PaddleOCR:** A powerful OCR toolkit for text detection and recognition, supporting both printed and handwritten text.
- **Ollama:** Serves a local Large Language Model (`phi3`) for intelligent text parsing and data extraction, ensuring no cloud services are used.
- **PyMuPDF & Levenshtein:** Libraries for PDF support and string similarity calculation, respectively.

### Frontend

- **React 19 & TypeScript:** For building a type-safe, modern user interface.
- **Vite:** A next-generation frontend build tool for a fast development experience.
- **Tailwind CSS:** A utility-first CSS framework for rapid UI development.
- **Framer Motion:** A production-ready motion library for creating smooth animations.

### DevOps

- **Docker & Docker Compose:** For containerizing and orchestrating the application services.
- **Nginx:** Used as a high-performance reverse proxy for the frontend application.

---

## How It Works

### Core Functionality

1.  **Document Upload:** The user uploads a scanned document (image or PDF) through the web interface.
2.  **OCR Processing:** The backend uses **PaddleOCR** to perform Optical Character Recognition, extracting raw text and generating an annotated image showing detected text boxes.
3.  **Intelligent Parsing with LLM:** The extracted text is passed to a local **Ollama LLM** (`phi3`), which intelligently parses the text, corrects common OCR errors, and structures the data into a clean JSON format.
4.  **Auto-filling the Form:** The structured JSON is sent to the frontend to auto-populate the digital form fields.
5.  **Data Verification:** After user review, the form data is sent to the verification API. The backend re-extracts data from the original document and compares it with the submitted data, providing a field-by-field match status and confidence score.

---

## API Documentation

**Base URL:** `http://localhost:8000`

### 1. Text Extraction API

This endpoint accepts a document, performs OCR and LLM parsing, and returns structured data along with an annotated image.

- **Endpoint:** `POST /api/v1/extract-llm`
- **Description:** Extracts and parses text from a document to auto-fill a form.

#### Request

A `multipart/form-data` request containing the document file.

-   **Body:**
    -   `file`: The document file (e.g., `.png`, `.jpeg`, `.pdf`). **Required**.

#### Response (`200 OK`)

A JSON object (`ExtractionResponse`) containing the extracted fields and the annotated image.

**`ExtractionResponse` Model:**

| Field             | Type   | Description                                                     |
| ----------------- | ------ | --------------------------------------------------------------- |
| `first_name`      | string | Extracted first name (`null` if not found).                     |
| `last_name`       | string | Extracted last name (`null` if not found).                      |
| ...               | ...    | Other fields like `gender`, `date_of_birth`, etc.               |
| `raw_text`        | string | The complete raw text extracted by the OCR engine.              |
| `annotated_image` | string | A Base64 encoded string of the image with OCR results on it.    |

---

### 2. Data Verification API

This endpoint compares user-submitted form data against the data extracted from the original document.

- **Endpoint:** `POST /api/v1/verify`
- **Description:** Verifies submitted form data against the original document.

#### Request

A `multipart/form-data` request containing the document and form data.

-   **Body:**
    -   `file`: The original document file. **Required**.
    -   `form_data`: A JSON string of the form data (e.g., `'{"first_name": "John"}'`). **Required**.

#### Response (`200 OK`)

A `VerificationResponse` object containing a detailed report for each field.

**`VerificationResponse` Model:**
This object contains a `verification_results` dictionary, where each key is a field name and the value is a `VerificationFieldResult` object.

**`VerificationFieldResult` Model:**

| Field        | Type    | Description                                                     |
| ------------ | ------- | --------------------------------------------------------------- |
| `submitted`  | string  | The value submitted by the user.                                |
| `extracted`  | string  | The value extracted from the document.                          |
| `match`      | boolean | `true` if similarity is >= 0.8, otherwise `false`.              |
| `similarity` | float   | A score from `0.0` to `1.0` indicating similarity.              |

---

## Project Structure

```bash
/
├── app/                     # FastAPI backend
│   ├── api/                 # API endpoints and schemas
│   ├── services/            # Business logic for OCR and LLM
│   └── main.py              # FastAPI application entrypoint
│
├── frontend-new/            # React frontend
│   ├── src/                 # Source code for the React app
│   └── ...                  # Other frontend files
│
├── Dockerfile               # Dockerfile for the backend
├── docker-compose.yml       # Docker Compose file for orchestration
└── requirements.txt         # Python dependencies
```

---

## Compliance with Hackathon Guidelines

-   **Two Separate APIs:** The solution provides two distinct APIs for extraction and verification.
-   **OCR for Form Filling:** OCR is used to automatically extract text and populate forms.
-   **Handwritten Text Support:** PaddleOCR enables the recognition of handwritten text.
-   **No Cloud Services:** The entire stack runs locally using Docker and Ollama, adhering to the "no cloud services" rule.
-   **Open Source:** The project is built entirely on open-source technologies.
-   **Working Demo:** A fully functional frontend serves as a working demo.
-   **API Documentation:** Endpoints are documented via FastAPI's Swagger UI (at `/docs`) and in this README.