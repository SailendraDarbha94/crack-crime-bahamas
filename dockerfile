# Start from Python 3.10 slim image
FROM python:3.10-slim

# Set the working directory in the Docker container
WORKDIR /usr/src/

# Copy the requirements.txt file and install Python dependencies
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Copy the backend application code into the Docker container
COPY backend/ /usr/src/backend/

# Expose the port FastAPI will run on
EXPOSE 8000

# Command to run the application using Uvicorn
CMD ["uvicorn", "backend.main:app", "--host", "0.0.0.0", "--port", "8000"]
