#!/bin/bash

# Start Ollama in the background
ollama serve &

# Wait for Ollama to start
sleep 5

# Pull and start the phi model
ollama pull phi &

# Start the FastAPI application
uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 4