# Start from a slim and efficient Python base image
FROM python:3.11-slim

# Set common environment variables for Python
ENV PYTHONUNBUFFERED=1
ENV VIRTUAL_ENV=/opt/venv
ENV PATH="$VIRTUAL_ENV/bin:$PATH"

# Install any essential system dependencies that your Python packages might need
# (e.g., libraries needed by OpenCV)
RUN apt-get update && apt-get install -y \
    libgl1 \
    libglib2.0-0 \
    libgomp1 \
    && rm -rf /var/lib/apt/lists/*

# Create the Python virtual environment
RUN python3.11 -m venv $VIRTUAL_ENV

# Set the working directory for the application
WORKDIR /code

# Copy and install the Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy your application source code into the container
COPY ./app ./app

# Expose the port that the application runs on
EXPOSE 8000

# The command to run when the container starts
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]